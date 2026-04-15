export type Scenario = {
  id: string;
  name: string;
  shortName: string;
  type: string;
  region: string;
  realtimeArea: string;
  timeWindow: string;
  personas: string[];
  objective: string;
  intensity: number;
  disruption: number;
  benefitClarity: number;
  personaSensitivity: number;
  evidenceStrength: number;
  novelty: number;
  verdict: string;
  judgement: string;
  fragility: string;
  mitigation: string;
  effect: string;
  sideEffect: string;
  evidence: string;
};

export type SeoulRealtimeSnapshot = {
  areaName: string;
  source: "live" | "fallback";
  updatedAt: string;
  crowding: {
    level: string;
    message: string;
    score: number;
  };
  weather: {
    temperatureC: number | null;
    condition: string;
    pm10: number | null;
  };
  mobility: {
    roadTrafficLevel: string;
    roadTrafficScore: number;
    subwayLine?: string;
  };
  raw?: unknown;
};

export type SimulationRunRequest = {
  scenario: Scenario;
  realtime: SeoulRealtimeSnapshot | null;
};

export type SimulationRunResult = {
  runId: string;
  scenarioId: string;
  createdAt: string;
  signals: {
    pressure: number;
    acceptance: number;
    risk: number;
    confidence: number;
  };
  verdict: {
    grade: string;
    headline: string;
    summary: string;
    mitigation: string;
  };
  reaction: {
    support: number;
    concern: number;
    opposition: number;
    neutral: number;
  };
};
