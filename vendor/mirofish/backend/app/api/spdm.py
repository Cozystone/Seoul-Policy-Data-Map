"""
SPDM adapter API.

These routes do not replace MiroFish routes. They translate Seoul policy inputs
into MiroFish-compatible artifacts and optionally delegate execution to
SimulationRunner.
"""

import os
import traceback
import threading
import uuid
from flask import current_app, jsonify, request

from . import spdm_bp
from ..config import Config
from ..models.project import ProjectManager, ProjectStatus
from ..models.task import TaskManager, TaskStatus
from ..services.graph_builder import GraphBuilderService
from ..services.ontology_generator import OntologyGenerator
from ..services.spdm_seoul_adapter import execute_core_if_requested, write_rehearsal_artifacts
from ..services.text_processor import TextProcessor


def _get_storage():
    storage = current_app.extensions.get("neo4j_storage")
    if not storage:
        raise ValueError("GraphStorage not initialized")
    return storage


@spdm_bp.route("/world-seed", methods=["POST"])
def create_spdm_world_seed():
    try:
        payload = request.get_json() or {}
        output_dir = os.path.join(Config.OASIS_SIMULATION_DATA_DIR)
        result = write_rehearsal_artifacts(payload, output_dir)

        if payload.get("execute_core"):
            result["core_run_state"] = execute_core_if_requested(
                simulation_id=result["simulation_id"],
                platform=payload.get("platform", "parallel"),
                max_rounds=int(payload.get("max_rounds", 8)),
            )

        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify(
            {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc(),
            }
        ), 500


@spdm_bp.route("/bootstrap", methods=["POST"])
def create_spdm_bootstrap():
    try:
        payload = request.get_json() or {}
        project_name = payload.get("project_name") or "SPDM Bootstrap"
        simulation_requirement = payload.get("simulation_requirement") or ""
        additional_context = payload.get("additional_context") or ""
        policy_document = payload.get("policy_document") or ""
        graph_name = payload.get("graph_name") or project_name

        if not simulation_requirement.strip():
            return jsonify({"success": False, "error": "simulation_requirement is required"}), 400
        if not policy_document.strip():
            return jsonify({"success": False, "error": "policy_document is required"}), 400

        storage = _get_storage()
        project = ProjectManager.create_project(name=project_name)
        project.simulation_requirement = simulation_requirement

        files_dir = ProjectManager._get_project_files_dir(project.project_id)
        os.makedirs(files_dir, exist_ok=True)
        file_path = os.path.join(files_dir, f"{uuid.uuid4().hex[:8]}.md")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(policy_document)

        project.files.append({"filename": f"{graph_name}.md", "size": len(policy_document.encode('utf-8'))})
        project.total_text_length = len(policy_document)
        ProjectManager.save_extracted_text(project.project_id, policy_document)
        ProjectManager.save_project(project)

        task_manager = TaskManager()
        bootstrap_task_id = task_manager.create_task(
            task_type="spdm_bootstrap",
            metadata={"project_id": project.project_id}
        )

        def bootstrap_worker():
            try:
                task_manager.update_task(
                    bootstrap_task_id,
                    status=TaskStatus.PROCESSING,
                    progress=5,
                    message="Generating ontology..."
                )

                text = TextProcessor.preprocess_text(policy_document)
                generator = OntologyGenerator()
                ontology = generator.generate(
                    document_texts=[text],
                    simulation_requirement=simulation_requirement,
                    additional_context=additional_context if additional_context else None
                )

                project_state = ProjectManager.get_project(project.project_id)
                if not project_state:
                    raise ValueError(f"Project does not exist: {project.project_id}")

                project_state.ontology = {
                    "entity_types": ontology.get("entity_types", []),
                    "edge_types": ontology.get("edge_types", [])
                }
                project_state.analysis_summary = ontology.get("analysis_summary", "")
                project_state.status = ProjectStatus.ONTOLOGY_GENERATED
                ProjectManager.save_project(project_state)

                task_manager.update_task(
                    bootstrap_task_id,
                    progress=55,
                    message="Ontology completed. Starting graph build...",
                    result={
                        "project_id": project.project_id,
                        "ontology": project_state.ontology,
                        "analysis_summary": project_state.analysis_summary
                    }
                )

                builder = GraphBuilderService(storage=storage)
                graph_task_id = builder.build_graph_async(
                    text=policy_document,
                    ontology=project_state.ontology,
                    graph_name=graph_name,
                    chunk_size=project_state.chunk_size,
                    chunk_overlap=project_state.chunk_overlap,
                    batch_size=3
                )

                project_state.status = ProjectStatus.GRAPH_BUILDING
                project_state.graph_build_task_id = graph_task_id
                ProjectManager.save_project(project_state)

                task_manager.update_task(
                    bootstrap_task_id,
                    status=TaskStatus.COMPLETED,
                    progress=100,
                    message="Bootstrap completed. Graph build task started.",
                    result={
                        "project_id": project.project_id,
                        "graph_task_id": graph_task_id,
                        "ontology": project_state.ontology,
                        "analysis_summary": project_state.analysis_summary
                    }
                )
            except Exception as e:
                project_state = ProjectManager.get_project(project.project_id)
                if project_state:
                    project_state.status = ProjectStatus.FAILED
                    project_state.error = str(e)
                    ProjectManager.save_project(project_state)
                task_manager.update_task(
                    bootstrap_task_id,
                    status=TaskStatus.FAILED,
                    message=f"Bootstrap failed: {str(e)}",
                    error=traceback.format_exc()
                )

        threading.Thread(target=bootstrap_worker, daemon=True).start()

        return jsonify({
            "success": True,
            "data": {
                "project_id": project.project_id,
                "bootstrap_task_id": bootstrap_task_id,
                "message": "SPDM bootstrap task started"
            }
        })
    except Exception as e:
        return jsonify(
            {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc(),
            }
        ), 500


@spdm_bp.route("/bootstrap/task/<task_id>", methods=["GET"])
def get_spdm_bootstrap_task(task_id: str):
    task = TaskManager().get_task(task_id)
    if not task:
        return jsonify({"success": False, "error": f"Task does not exist: {task_id}"}), 404
    return jsonify({"success": True, "data": task.to_dict()})
