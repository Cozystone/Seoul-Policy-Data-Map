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

export type MiroFishOntology = {
  entity_types?: string[];
  edge_types?: string[];
  analysis_summary?: string;
};

export type MiroFishGraphNode = {
  uuid: string;
  name?: string;
  labels?: string[];
  summary?: string;
  attributes?: Record<string, string>;
};

export type MiroFishGraphEdge = {
  uuid?: string;
  source_node_uuid: string;
  target_node_uuid: string;
  name?: string;
  fact_type?: string;
  fact?: string;
};

export type MiroFishGraphData = {
  graph_id?: string;
  node_count?: number;
  edge_count?: number;
  nodes: MiroFishGraphNode[];
  edges: MiroFishGraphEdge[];
};

export type MiroFishTask = {
  task_id?: string;
  status?: string;
  message?: string;
  progress?: number;
  result?: Record<string, unknown>;
};

export type MiroFishProject = {
  project_id: string;
  name?: string;
  status?: string;
  graph_id?: string | null;
  graph_build_task_id?: string | null;
  ontology?: {
    entity_types?: string[];
    edge_types?: string[];
  } | null;
  analysis_summary?: string;
};

export type MiroFishPrepareStatus = {
  task_id?: string;
  status?: string;
  message?: string;
  progress?: number;
  already_prepared?: boolean;
  prepare_info?: {
    status?: string;
    profiles_count?: number;
    entities_count?: number;
  };
};

export type MiroFishProfileRealtime = {
  count?: number;
  total_expected?: number;
  is_generating?: boolean;
  profiles?: Record<string, unknown>[];
};

export type MiroFishConfigRealtime = {
  file_exists?: boolean;
  is_generating?: boolean;
  generation_stage?: string;
  config?: Record<string, unknown>;
};

export type MiroFishRunStatus = {
  simulation_id?: string;
  runner_status?: string;
  current_round?: number;
  total_rounds?: number;
  twitter_running?: boolean;
  reddit_running?: boolean;
  twitter_completed?: boolean;
  reddit_completed?: boolean;
  twitter_actions_count?: number;
  reddit_actions_count?: number;
  total_actions_count?: number;
  graph_memory_update_enabled?: boolean;
  graph_id?: string;
};

export type MiroFishAction = {
  id?: string;
  round_num?: number;
  timestamp?: string;
  platform?: string;
  agent_id?: number;
  agent_name?: string;
  action_type?: string;
  action_args?: Record<string, unknown>;
};

export type MiroFishRunStatusDetail = MiroFishRunStatus & {
  all_actions?: MiroFishAction[];
  recent_actions?: MiroFishAction[];
};
