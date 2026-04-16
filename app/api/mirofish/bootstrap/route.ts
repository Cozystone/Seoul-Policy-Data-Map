import { NextResponse } from "next/server";
import { fetchMiroFish } from "@/lib/mirofish-client";
import type { Scenario, SeoulRealtimeSnapshot } from "@/lib/types";

type BootstrapRequest = {
  scenario: Scenario;
  realtime: SeoulRealtimeSnapshot | null;
};

function buildPolicyDocument(scenario: Scenario, realtime: SeoulRealtimeSnapshot | null) {
  return [
    `# ${scenario.name}`,
    "",
    "## Policy Overview",
    `- Policy Type: ${scenario.type}`,
    `- Region: ${scenario.region}`,
    `- Time Window: ${scenario.timeWindow}`,
    `- Target Groups: ${scenario.personas.join(", ")}`,
    "",
    "## Objective",
    scenario.objective,
    "",
    "## Expected Effects",
    scenario.effect,
    "",
    "## Potential Side Effects",
    scenario.sideEffect,
    "",
    "## Fragility Points",
    scenario.fragility,
    "",
    "## Mitigation",
    scenario.mitigation,
    "",
    "## Evidence",
    scenario.evidence,
    "",
    "## Current Seoul City Signals",
    `- Area: ${realtime?.areaName ?? scenario.realtimeArea}`,
    `- Crowding: ${realtime?.crowding.level ?? "unknown"} (${realtime?.crowding.score ?? "-"})`,
    `- Road Traffic: ${realtime?.mobility.roadTrafficLevel ?? "unknown"} (${realtime?.mobility.roadTrafficScore ?? "-"})`,
    `- Temperature: ${realtime?.weather.temperatureC ?? "-"}C`,
    `- Source: ${realtime?.source ?? "fallback"}`
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BootstrapRequest;
    if (!body?.scenario) {
      return NextResponse.json({ success: false, error: "scenario is required" }, { status: 400 });
    }

    const { scenario, realtime } = body;
    const response = await fetchMiroFish("/api/spdm/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_name: `SPDM ${scenario.shortName}`,
        graph_name: `SPDM ${scenario.shortName}`,
        simulation_requirement: [
          `Simulate both structural effects and social reactions in Seoul when ${scenario.name} is implemented.`,
          `Forecast goal: ${scenario.objective}`,
          `Target region: ${scenario.region}`,
          `Target groups: ${scenario.personas.join(", ")}`
        ].join("\n"),
        additional_context: JSON.stringify({ source: "spdm-ui", realtime, judgement: scenario.judgement }, null, 2),
        policy_document: buildPolicyDocument(scenario, realtime ?? null)
      })
    });

    const json = await response.json();
    return NextResponse.json(json, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown bootstrap error" },
      { status: 500 }
    );
  }
}
