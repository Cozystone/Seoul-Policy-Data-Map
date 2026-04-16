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
    `- 정책 유형: ${scenario.type}`,
    `- 대상 권역: ${scenario.region}`,
    `- 운영 시간: ${scenario.timeWindow}`,
    `- 대상 집단: ${scenario.personas.join(", ")}`,
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
    const policyDocument = buildPolicyDocument(scenario, realtime ?? null);

    const formData = new FormData();
    formData.append("project_name", `SPDM ${scenario.shortName}`);
    formData.append(
      "simulation_requirement",
      [
        `Simulate both structural effects and social reactions in Seoul when ${scenario.name} is implemented.`,
        `Forecast goal: ${scenario.objective}`,
        `Target region: ${scenario.region}`,
        `Target groups: ${scenario.personas.join(", ")}`
      ].join("\n")
    );
    formData.append(
      "additional_context",
      JSON.stringify(
        {
          source: "spdm-ui",
          realtime,
          judgement: scenario.judgement
        },
        null,
        2
      )
    );
    formData.append(
      "files",
      new Blob([policyDocument], { type: "text/markdown" }),
      `${scenario.id}.md`
    );

    const ontologyResponse = await fetchMiroFish("/api/graph/ontology/generate", {
      method: "POST",
      body: formData
    });
    const ontologyJson = await ontologyResponse.json();

    if (!ontologyResponse.ok || !ontologyJson?.success) {
      return NextResponse.json(
        {
          success: false,
          error: ontologyJson?.error ?? "Failed to generate ontology"
        },
        { status: ontologyResponse.status || 500 }
      );
    }

    const projectId = ontologyJson.data?.project_id as string | undefined;
    if (!projectId) {
      return NextResponse.json({ success: false, error: "project_id missing from ontology response" }, { status: 500 });
    }

    const buildResponse = await fetchMiroFish("/api/graph/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        graph_name: `SPDM ${scenario.shortName}`,
        force: true
      })
    });
    const buildJson = await buildResponse.json();

    if (!buildResponse.ok || !buildJson?.success) {
      return NextResponse.json(
        {
          success: false,
          error: buildJson?.error ?? "Failed to start graph build",
          project_id: projectId,
          ontology: ontologyJson.data?.ontology
        },
        { status: buildResponse.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        project_id: projectId,
        task_id: buildJson.data?.task_id,
        ontology: ontologyJson.data?.ontology,
        analysis_summary: ontologyJson.data?.analysis_summary
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown bootstrap error"
      },
      { status: 500 }
    );
  }
}
