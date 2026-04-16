"""
SPDM adapter API.

These routes do not replace MiroFish routes. They translate Seoul policy inputs
into MiroFish-compatible artifacts and optionally delegate execution to
SimulationRunner.
"""

import os
import traceback
from flask import jsonify, request

from . import spdm_bp
from ..config import Config
from ..services.spdm_seoul_adapter import execute_core_if_requested, write_rehearsal_artifacts


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
