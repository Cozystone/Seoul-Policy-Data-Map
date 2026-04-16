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
  executeCore?: boolean;
  maxRounds?: number;
};

export type MiroFishArtifactResponse = {
  success?: boolean;
  data?: {
    simulation_id?: string;
    simulation_dir?: string;
    artifacts?: {
      simulation_config?: string;
      reddit_profiles?: string;
      twitter_profiles?: string;
      state?: string;
    };
    output_json?: string;
    report?: string;
    core_run_state?: {
      runner_status?: string;
      total_rounds?: number;
      twitter_running?: boolean;
      reddit_running?: boolean;
      process_pid?: number;
      error?: string | null;
    };
  };
  error?: string;
};

export type SimulationRunResult = {
  runId: string;
  scenarioId: string;
  createdAt: string;
  engine?: "mirofish-offline" | "spdm-fallback";
  mirofish?: MiroFishArtifactResponse;
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
