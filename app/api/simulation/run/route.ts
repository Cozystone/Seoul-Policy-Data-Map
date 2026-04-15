import { NextResponse } from "next/server";
import { runPolicySimulation } from "@/lib/simulation";
import type { SimulationRunRequest } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as SimulationRunRequest;

  if (!body?.scenario) {
    return NextResponse.json({ error: "scenario is required" }, { status: 400 });
  }

  const result = runPolicySimulation(body.scenario, body.realtime ?? null);
  return NextResponse.json(result);
}
