"""Generate and optionally execute a Seoul Policy Reaction Twin rehearsal."""

import argparse
import json
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, BACKEND_DIR)

from app.config import Config  # noqa: E402
from app.services.spdm_seoul_adapter import execute_core_if_requested, write_rehearsal_artifacts  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description="Run SPDM on top of MiroFish-Offline core artifacts")
    parser.add_argument("--input", required=True, help="Path to Seoul policy rehearsal JSON")
    parser.add_argument("--output-dir", default=Config.OASIS_SIMULATION_DATA_DIR)
    parser.add_argument("--execute-core", action="store_true", help="Delegate to MiroFish SimulationRunner")
    parser.add_argument("--platform", default="parallel", choices=["parallel", "twitter", "reddit"])
    parser.add_argument("--max-rounds", type=int, default=8)
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        payload = json.load(f)

    result = write_rehearsal_artifacts(payload, args.output_dir)

    if args.execute_core:
        result["core_run_state"] = execute_core_if_requested(
            simulation_id=result["simulation_id"],
            platform=args.platform,
            max_rounds=args.max_rounds,
        )

    print(json.dumps({"success": True, "data": result}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
