import { NextResponse } from "next/server";
import { runPolicySimulation } from "@/lib/simulation";
import type { SimulationRunRequest } from "@/lib/types";

function buildMiroFishPayload(body: SimulationRunRequest) {
  const scenario = body.scenario;

  return {
    simulation_id: `spdm_${scenario.id}_${Date.now().toString(36)}`,
    policy_name: scenario.name,
    objective: scenario.objective,
    regions: scenario.region.split("/").map((part) => part.trim()),
    target_groups: scenario.personas,
    time_window: scenario.timeWindow,
    policy_document: `# ${scenario.name}\n${scenario.objective}`,
    current_city_state: body.realtime,
    external_signals: [
      {
        source: "spdm-ui",
        title: scenario.shortName,
        summary: scenario.judgement,
        stance: scenario.verdict
      }
    ],
    execute_core: false
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as SimulationRunRequest;

  if (!body?.scenario) {
    return NextResponse.json({ error: "scenario is required" }, { status: 400 });
  }

  const miroFishBackendUrl = process.env.MIROFISH_BACKEND_URL;

  if (miroFishBackendUrl) {
    try {
      const response = await fetch(`${miroFishBackendUrl}/api/spdm/world-seed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildMiroFishPayload(body))
      });

      if (response.ok) {
        const mirofish = (await response.json()) as {
          success?: boolean;
          data?: {
            simulation_id?: string;
            report?: string;
            output_json?: string;
          };
        };
        const fallbackResult = runPolicySimulation(body.scenario, body.realtime ?? null);

        return NextResponse.json({
          ...fallbackResult,
          runId: mirofish.data?.simulation_id ?? fallbackResult.runId,
          engine: "mirofish-offline",
          mirofish
        });
      }
    } catch {
      // Keep the public UI usable when the Python/MiroFish stack is not running.
    }
  }

  const result = runPolicySimulation(body.scenario, body.realtime ?? null);
  return NextResponse.json({
    ...result,
    engine: "spdm-fallback"
  });
}
