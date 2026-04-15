import type { Scenario, SeoulRealtimeSnapshot, SimulationRunResult } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function deriveSimulationSignals(
  scenario: Scenario,
  realtime: SeoulRealtimeSnapshot | null
): SimulationRunResult["signals"] {
  const realtimeCrowding = realtime?.crowding.score ?? 82;
  const realtimeMobility = realtime?.mobility.roadTrafficScore ?? 68;

  const pressure = clamp(
    Math.round(
      realtimeCrowding * 0.28 +
        realtimeMobility * 0.24 +
        scenario.intensity * 42 +
        scenario.personaSensitivity * 24
    )
  );
  const acceptance = clamp(
    Math.round(86 - scenario.disruption * 34 + scenario.benefitClarity * 21),
    28
  );
  const risk = clamp(Math.round(36 + scenario.disruption * 39 + scenario.intensity * 18), 22);
  const confidence = clamp(
    Math.round(58 + scenario.evidenceStrength * 31 - scenario.novelty * 11),
    20,
    94
  );

  return { pressure, acceptance, risk, confidence };
}

function gradeRun(signals: SimulationRunResult["signals"], scenario: Scenario) {
  const score =
    signals.acceptance * 0.34 +
    signals.confidence * 0.26 +
    scenario.benefitClarity * 100 * 0.24 -
    signals.risk * 0.16;

  if (score >= 68) {
    return "Proceed";
  }

  if (score >= 54) {
    return "Proceed with controls";
  }

  return "Revise before launch";
}

export function runPolicySimulation(
  scenario: Scenario,
  realtime: SeoulRealtimeSnapshot | null
): SimulationRunResult {
  const signals = deriveSimulationSignals(scenario, realtime);
  const grade = gradeRun(signals, scenario);
  const support = clamp(Math.round(24 + scenario.benefitClarity * 42 + signals.acceptance * 0.16));
  const opposition = clamp(Math.round(12 + scenario.disruption * 42 + signals.risk * 0.18));
  const concern = clamp(Math.round(14 + scenario.novelty * 34 + signals.pressure * 0.12));
  const neutral = clamp(100 - Math.round((support + opposition + concern) / 3));

  return {
    runId: `spdm-${Date.now().toString(36)}`,
    scenarioId: scenario.id,
    createdAt: new Date().toISOString(),
    signals,
    verdict: {
      grade,
      headline: `${scenario.shortName}: ${grade}`,
      summary: scenario.judgement,
      mitigation: scenario.mitigation
    },
    reaction: {
      support,
      concern,
      opposition,
      neutral
    }
  };
}
