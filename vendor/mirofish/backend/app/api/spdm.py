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
from ..services.spdm_seoul_adapter import execute_core_if_requested, write_rehearsal_artifacts
from ..services.text_processor import TextProcessor


def _get_storage():
    storage = current_app.extensions.get("neo4j_storage")
    if not storage:
        raise ValueError("GraphStorage not initialized")
    return storage


def _build_spdm_ontology():
    return {
        "entity_types": [
            {"name": "Policy", "description": "A Seoul public policy or intervention.", "attributes": [{"name": "policy_name", "type": "text", "description": "Name of the policy"}], "examples": ["JamSil Event Expansion"]},
            {"name": "Region", "description": "An administrative region in Seoul.", "attributes": [{"name": "region_name", "type": "text", "description": "Name of the region"}], "examples": ["Songpa-gu", "Gangnam-gu"]},
            {"name": "Place", "description": "A specific place or venue in Seoul.", "attributes": [{"name": "place_name", "type": "text", "description": "Name of the place"}], "examples": ["Jamsil Sports Complex", "COEX"]},
            {"name": "Organization", "description": "An institution, operator, district office, or business group.", "attributes": [{"name": "org_name", "type": "text", "description": "Name of the organization"}], "examples": ["Seoul Metropolitan Government", "Songpa District Office"]},
            {"name": "PopulationGroup", "description": "A stakeholder population affected by the policy.", "attributes": [{"name": "group_name", "type": "text", "description": "Name of the group"}], "examples": ["Office Workers", "Small Merchants"]},
            {"name": "Metric", "description": "A measurable city signal or indicator.", "attributes": [{"name": "metric_name", "type": "text", "description": "Name of the metric"}], "examples": ["Crowding", "Traffic Delay"]},
            {"name": "Event", "description": "A scheduled or triggered event in the city.", "attributes": [{"name": "event_name", "type": "text", "description": "Name of the event"}], "examples": ["Large concert", "Policy rollout"]},
            {"name": "Issue", "description": "A contested issue or conflict axis in the policy discussion.", "attributes": [{"name": "issue_name", "type": "text", "description": "Name of the issue"}], "examples": ["Accessibility", "Public acceptance"]},
            {"name": "Reaction", "description": "A social or public reaction to the policy or event.", "attributes": [{"name": "reaction_name", "type": "text", "description": "Name of the reaction"}], "examples": ["Support", "Backlash"]},
            {"name": "Document", "description": "A source document or signal used as seed input.", "attributes": [{"name": "document_name", "type": "text", "description": "Name of the document"}], "examples": ["Policy brief", "Realtime city signal summary"]},
        ],
        "edge_types": [
            {"name": "APPLIES_TO", "description": "A policy applies to a region or population.", "source_targets": [{"source": "Policy", "target": "Region"}, {"source": "Policy", "target": "PopulationGroup"}], "attributes": []},
            {"name": "CONTAINS", "description": "A region contains a place.", "source_targets": [{"source": "Region", "target": "Place"}], "attributes": []},
            {"name": "OCCURS_AT", "description": "An event occurs at a place.", "source_targets": [{"source": "Event", "target": "Place"}], "attributes": []},
            {"name": "AFFECTS", "description": "A policy or event affects a metric or issue.", "source_targets": [{"source": "Policy", "target": "Metric"}, {"source": "Event", "target": "Metric"}, {"source": "Policy", "target": "Issue"}], "attributes": []},
            {"name": "INFLUENCES", "description": "A metric or issue influences a reaction.", "source_targets": [{"source": "Metric", "target": "Reaction"}, {"source": "Issue", "target": "Reaction"}], "attributes": []},
            {"name": "REACTS_TO", "description": "A population group reacts to a policy or event.", "source_targets": [{"source": "PopulationGroup", "target": "Policy"}, {"source": "PopulationGroup", "target": "Event"}], "attributes": []},
            {"name": "MENTIONS", "description": "A document mentions an entity.", "source_targets": [{"source": "Document", "target": "Policy"}, {"source": "Document", "target": "Region"}, {"source": "Document", "target": "Place"}, {"source": "Document", "target": "PopulationGroup"}, {"source": "Document", "target": "Metric"}, {"source": "Document", "target": "Event"}, {"source": "Document", "target": "Issue"}, {"source": "Document", "target": "Reaction"}], "attributes": []},
            {"name": "AMPLIFIES", "description": "An issue amplifies a reaction.", "source_targets": [{"source": "Issue", "target": "Reaction"}], "attributes": []},
            {"name": "MITIGATES", "description": "An issue or organization mitigates a reaction.", "source_targets": [{"source": "Issue", "target": "Reaction"}, {"source": "Organization", "target": "Reaction"}], "attributes": []},
        ],
        "analysis_summary": "SPDM ontology uses a fixed Seoul policy schema so graph-first simulation can start quickly and deterministically."
    }


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
                ontology = _build_spdm_ontology()

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
