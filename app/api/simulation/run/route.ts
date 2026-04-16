import { NextResponse } from "next/server";
import { runPolicySimulation } from "@/lib/simulation";
import type { MiroFishArtifactResponse, SimulationRunRequest } from "@/lib/types";

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
    execute_core: body.executeCore ?? process.env.SPDM_EXECUTE_CORE === "true",
    max_rounds: body.maxRounds ?? Number(process.env.SPDM_CORE_MAX_ROUNDS ?? 1),
    platform: process.env.SPDM_CORE_PLATFORM ?? "parallel"
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as SimulationRunRequest;

  if (!body?.scenario) {
    return NextResponse.json({ error: "scenario is required" }, { status: 400 });
  }

  const miroFishBackendUrl = process.env.MIROFISH_BACKEND_INTERNAL_URL ?? process.env.MIROFISH_BACKEND_URL;

  if (miroFishBackendUrl) {
    try {
      const response = await fetch(`${miroFishBackendUrl}/api/spdm/world-seed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildMiroFishPayload(body))
      });

      const mirofish = (await response.json().catch(() => null)) as MiroFishArtifactResponse | null;

      if (response.ok && mirofish?.success) {
        const fallbackResult = runPolicySimulation(body.scenario, body.realtime ?? null);

        return NextResponse.json({
          ...fallbackResult,
          runId: mirofish.data?.simulation_id ?? fallbackResult.runId,
          engine: "mirofish-offline",
          mirofish
        });
      }
      console.warn("MiroFish backend returned non-success response", {
        status: response.status,
        error: mirofish?.error
      });
    } catch (error) {
      console.warn("MiroFish backend unavailable", error);
      // Keep the public UI usable when the Python/MiroFish stack is not running.
    }
  }

  const result = runPolicySimulation(body.scenario, body.realtime ?? null);
  return NextResponse.json({
    ...result,
    engine: "spdm-fallback"
  });
}
