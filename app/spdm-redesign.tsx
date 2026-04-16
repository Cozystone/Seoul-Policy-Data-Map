"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Play, RefreshCw, Send } from "lucide-react";
import { scenarios } from "@/lib/sample-data";
import type {
  MiroFishAction,
  MiroFishConfigRealtime,
  MiroFishGraphData,
  MiroFishOntology,
  MiroFishPrepareStatus,
  MiroFishProfileRealtime,
  MiroFishProject,
  MiroFishReport,
  MiroFishReportChatTurn,
  MiroFishRunStatus,
  MiroFishRunStatusDetail,
  MiroFishTask,
  Scenario,
  SeoulRealtimeSnapshot
} from "@/lib/types";

type RenderNode = { id: string; label: string; type: string; x: number; y: number; color: string };
type RenderEdge = { from: string; to: string; label: string };
type ConsoleLog = { ts: string; message: string };
type GraphGrowth = { nodes: number; edges: number };

const entityColors = ["#ff7a45", "#1d5fd0", "#8b5cf6", "#10b981", "#ef4444", "#06b6d4", "#f59e0b", "#64748b"];

function formatClock(iso?: string) {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("ko-KR", { hour12: false });
}

function buildStableId(prefix: string, seed: string) {
  const safe = seed.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${prefix}_${safe.slice(0, 12) || "spdm"}`;
}

function graphTypeOf(labels?: string[]) {
  return labels?.find((label) => label !== "Entity") ?? "Entity";
}

function buildGraphFromData(graphData: MiroFishGraphData | null, active: Scenario, realtime: SeoulRealtimeSnapshot | null) {
  if (!graphData?.nodes?.length) {
    return {
      nodes: [
        { id: "policy", label: active.shortName, type: "Policy", x: 340, y: 90, color: entityColors[1] },
        { id: "region", label: active.region.split("/")[0].trim(), type: "Region", x: 180, y: 210, color: entityColors[0] },
        { id: "place", label: realtime?.areaName ?? active.realtimeArea, type: "Place", x: 520, y: 210, color: entityColors[3] },
        { id: "issue", label: "정책 수용성", type: "Issue", x: 320, y: 340, color: entityColors[2] },
        { id: "reaction", label: "사회 반응", type: "Reaction", x: 520, y: 340, color: entityColors[4] }
      ] as RenderNode[],
      edges: [
        { from: "policy", to: "region", label: "APPLIES_TO" },
        { from: "policy", to: "place", label: "AFFECTS" },
        { from: "place", to: "issue", label: "MENTIONS" },
        { from: "issue", to: "reaction", label: "AMPLIFIES" }
      ] as RenderEdge[]
    };
  }

  const width = 820;
  const height = 620;
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const typeGroups = new Map<string, typeof graphData.nodes>();

  graphData.nodes.forEach((node) => {
    const type = graphTypeOf(node.labels);
    const group = typeGroups.get(type) ?? [];
    group.push(node);
    typeGroups.set(type, group);
  });

  const rings = [...typeGroups.entries()];
  const nodes: RenderNode[] = [];
  const nodeMap = new Map<string, RenderNode>();

  rings.forEach(([type, group], ringIndex) => {
    const radius = 90 + ringIndex * 82;
    group.forEach((node, index) => {
      const angle = ((Math.PI * 2) / Math.max(group.length, 1)) * index + ringIndex * 0.35;
      const renderNode = {
        id: node.uuid,
        label: node.name || type,
        type,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        color: entityColors[ringIndex % entityColors.length]
      };
      nodeMap.set(node.uuid, renderNode);
      nodes.push(renderNode);
    });
  });

  const edges: RenderEdge[] = graphData.edges
    .filter((edge) => nodeMap.has(edge.source_node_uuid) && nodeMap.has(edge.target_node_uuid))
    .slice(0, 180)
    .map((edge) => ({ from: edge.source_node_uuid, to: edge.target_node_uuid, label: edge.name || edge.fact_type || "RELATED_TO" }));

  return { nodes, edges };
}

function normalizeProfile(profile: Record<string, unknown>, index: number) {
  const name = String(profile.name ?? profile.username ?? profile.display_name ?? `Agent ${index}`);
  const handle = String(profile.username ?? profile.handle ?? name).replace(/^@?/, "@");
  return {
    id: String(profile.id ?? profile.uuid ?? `${name}-${index}`),
    name,
    handle,
    role: String(profile.occupation ?? profile.role ?? profile.entity_type ?? profile.persona_type ?? "에이전트"),
    archetype: String(profile.entity_type ?? profile.platform ?? "시민 그룹"),
    description: String(profile.description ?? profile.bio ?? profile.summary ?? "설명 없음"),
    topics: Array.isArray(profile.topics)
      ? profile.topics.map(String).slice(0, 4)
      : Array.isArray(profile.interests)
        ? profile.interests.map(String).slice(0, 4)
        : []
  };
}

function getActionSummary(action: MiroFishAction) {
  const args = action.action_args ?? {};
  if (typeof args.content === "string") return args.content;
  if (typeof args.quote_content === "string") return args.quote_content;
  if (typeof args.original_content === "string") return args.original_content;
  if (typeof args.post_content === "string") return args.post_content;
  return `${action.action_type ?? "ACTION"} executed`;
}

function getActivationSequence(configRealtime: MiroFishConfigRealtime | null, active: Scenario) {
  const eventConfig = configRealtime?.config?.event_config as Record<string, unknown> | undefined;
  const initialActivations = (eventConfig?.initial_activations ?? eventConfig?.initial_activation_sequence) as Record<string, unknown>[] | undefined;
  if (Array.isArray(initialActivations) && initialActivations.length) {
    return initialActivations.slice(0, 4).map((item, index) => ({
      role: String(item.entity_type ?? item.role ?? `Agent ${index + 1}`),
      handle: String(item.username ?? item.handle ?? item.name ?? `@agent_${index + 1}`),
      message: String(item.content ?? item.message ?? item.post ?? "초기 활성화 메시지")
    }));
  }
  return [
    { role: "행정 담당자", handle: "@서울시정책총괄", message: `${active.shortName} 시행안은 ${active.objective}를 목표로 하며, 초기 현장 피드백을 즉시 반영합니다.` },
    { role: active.personas[0] ?? "시민", handle: `@${(active.personas[0] ?? "시민").replace(/\s+/g, "")}`, message: `${active.shortName}이 실제 생활 불편과 편익을 어떻게 바꾸는지에 따라 반응이 갈릴 수 있습니다.` }
  ];
}

export default function SpdmRedesign() {
  const [active, setActive] = useState<Scenario>(scenarios[0]);
  const [realtime, setRealtime] = useState<SeoulRealtimeSnapshot | null>(null);
  const [ontology, setOntology] = useState<MiroFishOntology | null>(null);
  const [project, setProject] = useState<MiroFishProject | null>(null);
  const [bootstrapTask, setBootstrapTask] = useState<MiroFishTask | null>(null);
  const [graphTask, setGraphTask] = useState<MiroFishTask | null>(null);
  const [resolvedGraphId, setResolvedGraphId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<MiroFishGraphData | null>(null);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [prepareStatus, setPrepareStatus] = useState<MiroFishPrepareStatus | null>(null);
  const [profilesRealtime, setProfilesRealtime] = useState<MiroFishProfileRealtime | null>(null);
  const [configRealtime, setConfigRealtime] = useState<MiroFishConfigRealtime | null>(null);
  const [runStatus, setRunStatus] = useState<MiroFishRunStatus | null>(null);
  const [runDetail, setRunDetail] = useState<MiroFishRunStatusDetail | null>(null);
  const [reportTask, setReportTask] = useState<MiroFishTask | null>(null);
  const [reportData, setReportData] = useState<MiroFishReport | null>(null);
  const [reportChatHistory, setReportChatHistory] = useState<MiroFishReportChatTurn[]>([]);
  const [reportQuestion, setReportQuestion] = useState("송파 자영업자와 강남 출퇴근 직장인 관점의 핵심 차이를 요약해줘.");
  const [interviewPrompt, setInterviewPrompt] = useState("이 정책이 일상에 어떤 영향을 준다고 보나요?");
  const [interviewResponse, setInterviewResponse] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState(0);
  const [selectedAgentPlatform, setSelectedAgentPlatform] = useState<"twitter" | "reddit">("twitter");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isAskingReport, setIsAskingReport] = useState(false);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [customRounds, setCustomRounds] = useState(40);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [graphGrowth, setGraphGrowth] = useState<GraphGrowth>({ nodes: 0, edges: 0 });
  const [logs, setLogs] = useState<ConsoleLog[]>([
    { ts: "", message: "MiroFish 기반 서울 정책 반응 트윈 콘솔을 초기화했습니다." },
    { ts: "", message: "Seed input을 기다리는 중입니다." }
  ]);

  const intervalsRef = useRef<number[]>([]);
  const flowIdRef = useRef(0);
  const creatingSimulationRef = useRef(false);
  const graphStatRef = useRef({ nodes: 0, edges: 0 });
  const runLogRef = useRef({ twitter: 0, reddit: 0 });

  const addLog = (message: string) => {
    setLogs((prev) => [{ ts: new Date().toISOString(), message }, ...prev.slice(0, 16)]);
  };

  const clearPollers = () => {
    intervalsRef.current.forEach((id) => window.clearInterval(id));
    intervalsRef.current = [];
  };

  const resetFlowState = () => {
    creatingSimulationRef.current = false;
    graphStatRef.current = { nodes: 0, edges: 0 };
    runLogRef.current = { twitter: 0, reddit: 0 };
    setOntology(null);
    setProject(null);
    setBootstrapTask(null);
    setGraphTask(null);
    setResolvedGraphId(null);
    setGraphData(null);
    setSimulationId(null);
    setPrepareStatus(null);
    setProfilesRealtime(null);
    setConfigRealtime(null);
    setRunStatus(null);
    setRunDetail(null);
    setReportTask(null);
    setReportData(null);
    setReportChatHistory([]);
    setInterviewResponse("");
    setIsRunning(false);
    setIsInitializing(false);
    setGraphGrowth({ nodes: 0, edges: 0 });
  };

  const loadGraphData = async (graphId: string, flowId: number) => {
    const response = await fetch(`/api/mirofish/graph/data/${graphId}`);
    const json = await response.json();
    if (flowId !== flowIdRef.current || !json?.success) return;
    const nextGraphData = json.data as MiroFishGraphData;
    setGraphData(nextGraphData);
    const nodeCount = nextGraphData.node_count ?? nextGraphData.nodes?.length ?? 0;
    const edgeCount = nextGraphData.edge_count ?? nextGraphData.edges?.length ?? 0;
    if (graphStatRef.current.nodes !== nodeCount || graphStatRef.current.edges !== edgeCount) {
      const growth = {
        nodes: Math.max(0, nodeCount - graphStatRef.current.nodes),
        edges: Math.max(0, edgeCount - graphStatRef.current.edges)
      };
      setGraphGrowth(growth);
      graphStatRef.current = { nodes: nodeCount, edges: edgeCount };
      addLog(`그래프가 갱신되었습니다: 노드 ${nodeCount}개, 엣지 ${edgeCount}개${growth.nodes || growth.edges ? ` (+${growth.nodes}/+${growth.edges})` : ""}`);
    }
  };

  const startRunPolling = (simId: string, graphId: string | null, flowId: number) => {
    const statusInterval = window.setInterval(async () => {
      const [statusRes, detailRes] = await Promise.all([
        fetch(`/api/mirofish/simulation/${simId}/run-status`),
        fetch(`/api/mirofish/simulation/${simId}/run-status/detail`)
      ]);
      const [statusJson, detailJson] = await Promise.all([statusRes.json(), detailRes.json()]);
      if (flowId !== flowIdRef.current) return;
      if (statusJson?.success) {
        const nextStatus = statusJson.data as MiroFishRunStatus;
        setRunStatus(nextStatus);
        const twitterActions = nextStatus.twitter_actions_count ?? 0;
        const redditActions = nextStatus.reddit_actions_count ?? 0;
        if (twitterActions > runLogRef.current.twitter) {
          runLogRef.current.twitter = twitterActions;
          addLog(`[Info Plaza] actions ${twitterActions}, round ${nextStatus.current_round ?? 0}/${nextStatus.total_rounds ?? customRounds}`);
        }
        if (redditActions > runLogRef.current.reddit) {
          runLogRef.current.reddit = redditActions;
          addLog(`[Topic Community] actions ${redditActions}, round ${nextStatus.current_round ?? 0}/${nextStatus.total_rounds ?? customRounds}`);
        }
      }
      if (detailJson?.success) {
        setRunDetail(detailJson.data as MiroFishRunStatusDetail);
      }
      if (graphId) {
        void loadGraphData(graphId, flowId);
      }
    }, 3000);
    intervalsRef.current.push(statusInterval);
  };

  const startPreparePolling = (simId: string, taskId: string | undefined, graphId: string | null, flowId: number) => {
    const prepareInterval = window.setInterval(async () => {
      const [profilesRes, configRes, prepareRes] = await Promise.all([
        fetch(`/api/mirofish/simulation/${simId}/profiles/realtime?platform=reddit`),
        fetch(`/api/mirofish/simulation/${simId}/config/realtime`),
        fetch(`/api/mirofish/simulation/prepare/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ simulation_id: simId, task_id: taskId })
        })
      ]);
      const [profilesJson, configJson, prepareJson] = await Promise.all([
        profilesRes.json(),
        configRes.json(),
        prepareRes.json()
      ]);
      if (flowId !== flowIdRef.current) return;
      if (profilesJson?.success) setProfilesRealtime(profilesJson.data as MiroFishProfileRealtime);
      if (configJson?.success) setConfigRealtime(configJson.data as MiroFishConfigRealtime);
      if (prepareJson?.success) {
        const nextStatus = prepareJson.data as MiroFishPrepareStatus;
        setPrepareStatus(nextStatus);
        if (["ready", "completed"].includes(nextStatus.status ?? "")) {
          addLog(`Environment setup 완료: ${simId}`);
          window.clearInterval(prepareInterval);
        }
      }
      if (graphId) void loadGraphData(graphId, flowId);
    }, 2500);
    intervalsRef.current.push(prepareInterval);
  };

  const createSimulationFlow = async (projectId: string, graphId: string | null, flowId: number) => {
    if (!graphId || creatingSimulationRef.current) return;
    creatingSimulationRef.current = true;
    try {
      const createRes = await fetch(`/api/mirofish/simulation/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, graph_id: graphId, enable_twitter: true, enable_reddit: true })
      });
      const createJson = await createRes.json();
      if (flowId !== flowIdRef.current || !createJson?.success) return;
      const simId = createJson.data?.simulation_id as string;
      setSimulationId(simId);
      addLog(`Simulation instance 생성: ${simId}`);

      const prepareRes = await fetch(`/api/mirofish/simulation/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_id: simId, use_llm_for_profiles: true, parallel_profile_count: 5 })
      });
      const prepareJson = await prepareRes.json();
      if (flowId !== flowIdRef.current || !prepareJson?.success) return;
      setPrepareStatus(prepareJson.data as MiroFishPrepareStatus);
      addLog(`Environment setup 시작: ${simId}`);
      startPreparePolling(simId, prepareJson.data?.task_id as string | undefined, graphId, flowId);
    } finally {
      creatingSimulationRef.current = false;
    }
  };

  const startBootstrap = async (scenario: Scenario, snapshot: SeoulRealtimeSnapshot | null) => {
    flowIdRef.current += 1;
    const flowId = flowIdRef.current;
    clearPollers();
    resetFlowState();
    setIsInitializing(true);
    addLog(`Seed input bootstrap 시작: ${scenario.shortName}`);

    try {
      const response = await fetch(`/api/mirofish/bootstrap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, realtime: snapshot })
      });
      const json = await response.json();
      if (flowId !== flowIdRef.current || !json?.success) {
        addLog(`Bootstrap 실패: ${json?.error ?? "unknown error"}`);
        return;
      }
      const projectId = json.data.project_id as string;
      const bootstrapTaskId = json.data.bootstrap_task_id as string;
      setProject({ project_id: projectId });
      setBootstrapTask({ task_id: bootstrapTaskId, status: "processing", message: "Bootstrap started", progress: 0 });
      addLog(`Bootstrap task 시작: ${bootstrapTaskId}`);

      let linkedGraphTaskId: string | null = null;
      const graphInterval = window.setInterval(async () => {
        const [projectRes, bootstrapRes] = await Promise.all([
          fetch(`/api/mirofish/graph/project/${projectId}`),
          fetch(`/api/mirofish/spdm/bootstrap/task/${bootstrapTaskId}`)
        ]);
        const [projectJson, bootstrapJson] = await Promise.all([projectRes.json(), bootstrapRes.json()]);
        if (flowId !== flowIdRef.current) return;
        if (projectJson?.success) {
          const projectData = projectJson.data as MiroFishProject;
          setProject(projectData);
          if (projectData.ontology) setOntology(projectData.ontology);
          if (projectData.graph_id) {
            setResolvedGraphId(projectData.graph_id);
            void loadGraphData(projectData.graph_id, flowId);
          }
        }
        if (!bootstrapJson?.success) {
          addLog(`Bootstrap task 조회 실패: ${bootstrapTaskId}`);
          window.clearInterval(graphInterval);
          setIsInitializing(false);
          return;
        }
        if (bootstrapJson?.success) {
          const nextBootstrapTask = bootstrapJson.data as MiroFishTask;
          setBootstrapTask(nextBootstrapTask);
          if (nextBootstrapTask.status === "failed") {
            addLog(`Bootstrap 실패: ${nextBootstrapTask.message ?? nextBootstrapTask.error ?? "unknown error"}`);
            window.clearInterval(graphInterval);
            return;
          }

          const nextGraphTaskId =
            (nextBootstrapTask.result?.graph_task_id as string | undefined) ??
            (projectJson?.data?.graph_build_task_id as string | undefined);

          if (nextGraphTaskId && linkedGraphTaskId !== nextGraphTaskId) {
            linkedGraphTaskId = nextGraphTaskId;
            setGraphTask({ task_id: nextGraphTaskId, status: "processing", message: "Graph build started", progress: 55 });
            addLog(`Graph build task 연결: ${nextGraphTaskId}`);
          }

          if (nextGraphTaskId) {
            const graphTaskRes = await fetch(`/api/mirofish/graph/task/${nextGraphTaskId}`);
            const graphTaskJson = await graphTaskRes.json();
            if (flowId !== flowIdRef.current) return;
            if (graphTaskJson?.success) {
              const nextTask = graphTaskJson.data as MiroFishTask;
              setGraphTask(nextTask);
              const nextGraphId =
                (nextTask.result?.graph_id as string | undefined) ??
                (projectJson?.data?.graph_id as string | undefined) ??
                null;
              if (nextGraphId) {
                setResolvedGraphId(nextGraphId);
                void loadGraphData(nextGraphId, flowId);
              }
              if (["completed", "success"].includes(nextTask.status ?? "") && nextGraphId) {
                addLog(`Graph build 완료: ${nextGraphId}`);
                window.clearInterval(graphInterval);
                await createSimulationFlow(projectId, nextGraphId, flowId);
              }
            }
          }
        }
      }, 2500);
      intervalsRef.current.push(graphInterval);
    } catch (error) {
      addLog(`Bootstrap exception: ${error instanceof Error ? error.message : "unknown"}`);
    } finally {
      if (flowId === flowIdRef.current) setIsInitializing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const scenario = active;
    const controller = new AbortController();
    clearPollers();
    resetFlowState();
    setRealtime(null);
    fetch(`/api/seoul/realtime?area=${encodeURIComponent(scenario.realtimeArea)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((snapshot: SeoulRealtimeSnapshot | null) => {
        if (cancelled) return;
        setRealtime(snapshot);
        if (snapshot) addLog(`${snapshot.areaName} 실시간 도시 신호 반영 (${snapshot.source})`);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      controller.abort();
      clearPollers();
    };
  }, [active]);

  useEffect(() => () => clearPollers(), []);

  useEffect(() => {
    if (!simulationId) return;
    void fetchReportBySimulation(simulationId);
  }, [simulationId]);

  async function runSimulation() {
    if (!simulationId) return;
    setIsRunning(true);
    addLog(`Simulation start 요청: ${simulationId}`);
    try {
      const response = await fetch(`/api/mirofish/simulation/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_id: simulationId, platform: "parallel", max_rounds: customRounds, enable_graph_memory_update: true, force: true })
      });
      const json = await response.json();
      if (!json?.success) {
        addLog(`Simulation start 실패: ${json?.error ?? "unknown"}`);
        return;
      }
      setRunStatus(json.data as MiroFishRunStatus);
      addLog(`Simulation running: ${simulationId}`);
      startRunPolling(simulationId, resolvedGraphId ?? project?.graph_id ?? null, flowIdRef.current);
    } finally {
      setIsRunning(false);
    }
  }

  async function fetchReportBySimulation(simId: string) {
    const response = await fetch(`/api/mirofish/report/by-simulation/${simId}`);
    const json = await response.json();
    if (!json?.success) return null;
    const report = json.data as MiroFishReport;
    setReportData(report);
    return report;
  }

  function startReportPolling(taskId: string, simId: string, flowId: number) {
    const reportInterval = window.setInterval(async () => {
      const statusRes = await fetch(`/api/mirofish/report/generate/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_id: simId, task_id: taskId })
      });
      const statusJson = await statusRes.json();
      if (flowId !== flowIdRef.current || !statusJson?.success) return;
      const nextTask = statusJson.data as MiroFishTask;
      setReportTask(nextTask);
      if (nextTask.status === "failed") {
        addLog(`Report generation 실패: ${nextTask.message ?? nextTask.error ?? "unknown"}`);
        window.clearInterval(reportInterval);
        setIsGeneratingReport(false);
        return;
      }
      if (["completed", "success"].includes(nextTask.status ?? "") || nextTask.result?.report_id) {
        const report = await fetchReportBySimulation(simId);
        if (report?.report_id) {
          addLog(`Report 생성 완료: ${report.report_id}`);
        }
        window.clearInterval(reportInterval);
        setIsGeneratingReport(false);
      }
    }, 3000);
    intervalsRef.current.push(reportInterval);
  }

  async function generateReport() {
    if (!simulationId) return;
    setIsGeneratingReport(true);
    addLog(`Report generation 요청: ${simulationId}`);
    let startedPolling = false;
    try {
      const existing = await fetchReportBySimulation(simulationId);
      if (existing?.report_id && existing.status === "completed") {
        addLog(`기존 report 재사용: ${existing.report_id}`);
        return;
      }
      const response = await fetch(`/api/mirofish/report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_id: simulationId })
      });
      const json = await response.json();
      if (!json?.success) {
        addLog(`Report generation 실패: ${json?.error ?? "unknown"}`);
        return;
      }
      const task = {
        task_id: json.data?.task_id as string | undefined,
        status: json.data?.status as string | undefined,
        message: json.data?.message as string | undefined,
        result: { report_id: json.data?.report_id as string | undefined }
      } satisfies MiroFishTask;
      setReportTask(task);
      if (json.data?.already_generated) {
        await fetchReportBySimulation(simulationId);
        addLog(`기존 report 연결 완료: ${json.data?.report_id ?? "report"}`);
        return;
      }
      if (task.task_id) {
        startedPolling = true;
        startReportPolling(task.task_id, simulationId, flowIdRef.current);
      }
    } finally {
      if (!startedPolling) setIsGeneratingReport(false);
    }
  }

  async function askReportAgent() {
    if (!simulationId || !reportQuestion.trim()) return;
    setIsAskingReport(true);
    const history = [...reportChatHistory, { role: "user", content: reportQuestion.trim() } satisfies MiroFishReportChatTurn];
    setReportChatHistory(history);
    try {
      const response = await fetch(`/api/mirofish/report/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_id: simulationId, message: reportQuestion.trim(), chat_history: history.slice(0, -1) })
      });
      const json = await response.json();
      if (!json?.success) {
        addLog(`ReportAgent 질의 실패: ${json?.error ?? "unknown"}`);
        setReportChatHistory((prev) => prev.slice(0, -1));
        return;
      }
      const responseText = String(json.data?.response ?? "");
      setReportChatHistory((prev) => [...prev, { role: "assistant", content: responseText }]);
      addLog("ReportAgent 응답 수신");
      setReportQuestion("");
    } finally {
      setIsAskingReport(false);
    }
  }

  async function interviewAgent() {
    if (!simulationId || !interviewPrompt.trim()) return;
    setIsInterviewing(true);
    setInterviewResponse("");
    try {
      const response = await fetch(`/api/mirofish/simulation/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulation_id: simulationId,
          agent_id: selectedAgentId,
          prompt: interviewPrompt.trim(),
          platform: selectedAgentPlatform,
          timeout: 90
        })
      });
      const json = await response.json();
      if (!json?.success) {
        const message = json?.error ?? json?.data?.error ?? "unknown";
        addLog(`Persona 인터뷰 실패: ${message}`);
        setInterviewResponse(`인터뷰 실패: ${message}`);
        return;
      }
      const result = json.data?.result;
      const responseText =
        typeof result === "string"
          ? result
          : typeof result?.response === "string"
            ? result.response
            : JSON.stringify(result, null, 2);
      setInterviewResponse(responseText);
      addLog(`Persona 인터뷰 완료: agent ${selectedAgentId}`);
    } finally {
      setIsInterviewing(false);
    }
  }

  const graph = useMemo(() => buildGraphFromData(graphData, active, realtime), [graphData, active, realtime]);
  const entityTypes = useMemo(() => {
    const uniq = new Map<string, string>();
    graph.nodes.forEach((node) => { if (!uniq.has(node.type)) uniq.set(node.type, node.color); });
    return [...uniq.entries()].map(([name, color]) => ({ name, color }));
  }, [graph]);
  const nodeCount = graphData?.node_count ?? graphData?.nodes?.length ?? graph.nodes.length;
  const edgeCount = graphData?.edge_count ?? graphData?.edges?.length ?? graph.edges.length;
  const profiles = useMemo(() => (profilesRealtime?.profiles ?? []).map((profile, index) => normalizeProfile(profile, index)), [profilesRealtime]);
  const activationSequence = useMemo(() => getActivationSequence(configRealtime, active), [configRealtime, active]);
  const currentRound = runStatus?.current_round ?? 0;
  const actions = runDetail?.all_actions ?? [];
  const recentActions = actions.slice(-8).reverse();
  const configObject = configRealtime?.config as Record<string, unknown> | undefined;
  const timeConfig = (configObject?.time_config ?? {}) as Record<string, unknown>;
  const platformConfigs = (configObject?.platform_configs ?? {}) as Record<string, unknown>;
  const eventConfig = (configObject?.event_config ?? {}) as Record<string, unknown>;
  const hotTopics = Array.isArray(eventConfig.hot_topics) ? eventConfig.hot_topics.map(String).slice(0, 6) : [active.shortName, active.type, active.region.split("/")[0].trim(), realtime?.areaName ?? active.realtimeArea, "서울 정책", "사회 반응"];
  const selectedProfile = profiles[selectedAgentId] ?? profiles[0] ?? null;

  useEffect(() => {
    if (profiles.length && selectedAgentId >= profiles.length) {
      setSelectedAgentId(0);
    }
  }, [profiles, selectedAgentId]);

  return (
    <main className="miro-shell">
      <header className="miro-topbar">
        <div className="miro-topbar-left">
          <div className="miro-brand"><div className="miro-brand-mark">S</div><strong>Seoul Policy Reaction Twin</strong></div>
        </div>
        <div className="miro-topbar-center">
          <span className="miro-tab miro-tab-active">시뮬레이션 콘솔</span>
          <span className="miro-section-title">MiroFish Flow</span>
          <span className="miro-phase-dot" />
          <span className="miro-phase-text">seed → graph → env → simulation → report</span>
        </div>
        <div className="miro-topbar-right" />
      </header>

      <div className="miro-workspace">
        <section className="miro-graph-panel">
          <div className="miro-graph-header">
            <span className="miro-graph-title">World Skeleton / Explanation Graph</span>
            <div className="miro-graph-tools">
              <div className="miro-select-pill">
                <button className="miro-select-trigger" type="button" onClick={() => setActive((current) => scenarios[(scenarios.findIndex((item) => item.id === current.id) + 1) % scenarios.length])}>
                  {active.shortName}<ChevronDown size={14} />
                </button>
              </div>
              <button className="miro-tool-btn" onClick={() => void startBootstrap(active, realtime)}><RefreshCw size={14} />다시 빌드</button>
            </div>
          </div>

          <button className="miro-toggle-chip" type="button" onClick={() => setShowEdgeLabels((current) => !current)}>
            <span className={`miro-switch ${showEdgeLabels ? "miro-switch-on" : ""}`}><i /></span>
            evidence edge 표시
          </button>

          <svg className="miro-graph-svg" viewBox="0 0 820 620" role="img" aria-label="mirofish graph">
            {graph.edges.map((edge) => {
              const from = graph.nodes.find((node) => node.id === edge.from);
              const to = graph.nodes.find((node) => node.id === edge.to);
              if (!from || !to) return null;
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              return (
                <g key={`${edge.from}-${edge.to}-${edge.label}`}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#c8c8ce" strokeWidth="1.2" />
                  {showEdgeLabels ? (
                    <>
                      <rect x={mx - 34} y={my - 9} width="68" height="18" rx="7" fill="rgba(255,255,255,0.94)" />
                      <text x={mx} y={my + 4} textAnchor="middle" className="miro-edge-label">{edge.label.slice(0, 10)}</text>
                    </>
                  ) : null}
                </g>
              );
            })}
            {graph.nodes.map((node) => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r="10" fill={node.color} stroke="#fff" strokeWidth="3" />
                <text x={node.x + 16} y={node.y + 4} className="miro-node-label">{node.label.slice(0, 18)}</text>
              </g>
            ))}
          </svg>

          <div className="miro-graph-pill">
            <span className="miro-graph-pill-icon">◎</span>
            {runStatus?.runner_status === "running" ? "Graph memory 업데이트 중..." : graphTask?.status === "processing" ? "Graph build 진행 중..." : isInitializing ? "Seed world를 생성하는 중..." : "World skeleton 준비 완료"}
          </div>

          <div className="miro-legend-card">
            <span className="miro-legend-title">Entity Types</span>
            <div className="miro-legend-list">
              {entityTypes.map((item) => <div className="miro-legend-item" key={item.name}><span className="miro-legend-dot" style={{ background: item.color }} /><span>{item.name}</span></div>)}
            </div>
          </div>
        </section>

        <section className="miro-workbench">
          <div className="miro-step-card">
            <div className="miro-step-header"><div className="miro-step-title-group"><span className="miro-step-num">01</span><div><span className="miro-step-title">Seed Input</span><p className="miro-step-subtitle">문서 + 예측 질문 + 도시 상태</p></div></div><span className={`miro-badge ${project ? "miro-badge-success" : isInitializing ? "miro-badge-processing" : "miro-badge-idle"}`}>{project ? <Check size={14} /> : null}{project ? "완료" : isInitializing ? "진행 중" : "대기"}</span></div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/mirofish/bootstrap</p>
              <p className="miro-step-desc">정책 문서, 서울 현재 상태, 예측 목표를 하나의 seed bundle로 묶고 ontology generation을 시작합니다.</p>
              <div className="miro-step-actions">
                <button className="miro-primary-btn" type="button" onClick={() => void startBootstrap(active, realtime)} disabled={isInitializing}>
                  <Play size={14} />시드/그래프 빌드 시작
                </button>
              </div>
              <div className="miro-id-grid">
                <div className="miro-id-item"><span>Scenario</span><strong>{active.name}</strong></div>
                <div className="miro-id-item"><span>Forecast Question</span><strong>{active.objective}</strong></div>
                <div className="miro-id-item"><span>Realtime Area</span><strong>{realtime?.areaName ?? active.realtimeArea}</strong></div>
                <div className="miro-id-item"><span>Project ID</span><strong>{project?.project_id ?? buildStableId("proj", active.id)}</strong></div>
                <div className="miro-id-item"><span>Bootstrap Task</span><strong>{bootstrapTask?.task_id ?? "pending"}</strong></div>
                <div className="miro-id-item"><span>Bootstrap Status</span><strong>{bootstrapTask?.status ?? "pending"}</strong></div>
              </div>
            </div>
          </div>

          <div className="miro-step-card">
            <div className="miro-step-header"><div className="miro-step-title-group"><span className="miro-step-num">02</span><div><span className="miro-step-title">Graph Building</span><p className="miro-step-subtitle">ontology / graph / issue axis</p></div></div><span className={`miro-badge ${graphTask?.status === "completed" ? "miro-badge-success" : "miro-badge-processing"}`}>{graphTask?.status === "completed" ? <Check size={14} /> : null}{graphTask?.progress ?? 0}%</span></div>
            <div className="miro-step-body">
              <p className="miro-api-note">/api/graph/ontology/generate → /api/graph/build → /api/graph/task/:id</p>
              <p className="miro-step-desc">문서에서 엔티티와 관계를 추출해 world skeleton을 만들고, 같은 그래프를 explanation graph로 재사용합니다.</p>
              <div className="miro-summary-grid">
                <div className="miro-summary-card"><span>Node Count</span><strong>{nodeCount}</strong></div>
                <div className="miro-summary-card"><span>Edge Count</span><strong>{edgeCount}</strong></div>
                <div className="miro-summary-card"><span>Latest Growth</span><strong>+{graphGrowth.nodes} / +{graphGrowth.edges}</strong></div>
                <div className="miro-summary-card"><span>Task Status</span><strong>{graphTask?.status ?? "idle"}</strong></div>
                <div className="miro-summary-card"><span>Graph ID</span><strong>{resolvedGraphId ?? project?.graph_id ?? "pending"}</strong></div>
              </div>
              <span className="miro-tag-label">엔티티 유형</span>
              <div className="miro-tag-list">{(ontology?.entity_types ?? []).map((tag) => <span className="miro-tag" key={tag}>{tag}</span>)}</div>
              <span className="miro-tag-label">관계 유형</span>
              <div className="miro-tag-list">{(ontology?.edge_types ?? []).map((tag) => <span className="miro-tag" key={tag}>{tag}</span>)}</div>
              <span className="miro-tag-label">Conflict / Issue Axis</span>
              <div className="miro-tag-list">{hotTopics.map((tag) => <span className="miro-tag" key={tag}>{tag}</span>)}</div>
            </div>
          </div>

          <div className="miro-step-card">
            <div className="miro-step-header"><div className="miro-step-title-group"><span className="miro-step-num">03</span><div><span className="miro-step-title">Environment / Persona</span><p className="miro-step-subtitle">graph-grounded persona generation</p></div></div><span className={`miro-badge ${prepareStatus?.status === "ready" || prepareStatus?.status === "completed" ? "miro-badge-success" : "miro-badge-processing"}`}>{prepareStatus?.status === "ready" || prepareStatus?.status === "completed" ? <Check size={14} /> : null}{prepareStatus?.status ?? "preparing"}</span></div>
            <div className="miro-step-body">
              <p className="miro-api-note">/api/simulation/create → /api/simulation/prepare → /profiles/realtime → /config/realtime</p>
              <div className="miro-summary-grid">
                <div className="miro-summary-card"><span>Simulation ID</span><strong>{simulationId ?? "pending"}</strong></div>
                <div className="miro-summary-card"><span>Current Agents</span><strong>{profilesRealtime?.count ?? profiles.length}</strong></div>
                <div className="miro-summary-card"><span>Expected Total</span><strong>{profilesRealtime?.total_expected ?? prepareStatus?.prepare_info?.entities_count ?? profiles.length}</strong></div>
                <div className="miro-summary-card"><span>Prepare Stage</span><strong>{configRealtime?.generation_stage ?? prepareStatus?.status ?? "preparing"}</strong></div>
              </div>
              <div className="miro-agent-list">
                {profiles.slice(0, 8).map((profile) => (
                  <article className="miro-agent-card" key={profile.id}>
                    <div className="miro-agent-header"><div><strong>{profile.name}</strong><span>{profile.handle}</span></div></div>
                    <div className="miro-agent-role">{profile.role} / {profile.archetype}</div>
                    <p className="miro-agent-summary">{profile.description}</p>
                    <div className="miro-mini-tags">{profile.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
                  </article>
                ))}
              </div>
              <span className="miro-tag-label">Initial Activation Sequence</span>
              <div className="miro-sequence-list">
                {activationSequence.map((item, index) => (
                  <div className="miro-sequence-card" key={`${item.handle}-${index}`}>
                    <div className="miro-sequence-head"><strong>{item.role}</strong><span>{item.handle}</span></div>
                    <p>{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="miro-step-card">
            <div className="miro-step-header"><div className="miro-step-title-group"><span className="miro-step-num">04</span><div><span className="miro-step-title">Round Simulation</span><p className="miro-step-subtitle">time-evolving multi-agent run</p></div></div><span className={`miro-badge ${runStatus?.runner_status === "completed" ? "miro-badge-success" : "miro-badge-processing"}`}>{runStatus?.runner_status ?? "idle"}</span></div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/simulation/start (enable_graph_memory_update=true)</p>
              <div className="miro-config-grid">
                <div className="miro-config-item"><span>Duration</span><strong>{String(timeConfig.duration_hours ?? 72)} hours</strong></div>
                <div className="miro-config-item"><span>Current Round</span><strong>{currentRound} / {runStatus?.total_rounds ?? customRounds}</strong></div>
                <div className="miro-config-item"><span>Twitter Acts</span><strong>{runStatus?.twitter_actions_count ?? 0}</strong></div>
                <div className="miro-config-item"><span>Reddit Acts</span><strong>{runStatus?.reddit_actions_count ?? 0}</strong></div>
                <div className="miro-config-item"><span>Recency Weight</span><strong>{String((platformConfigs.info_plaza as Record<string, unknown> | undefined)?.recency_weight ?? 0.4)}</strong></div>
                <div className="miro-config-item"><span>Viral Threshold</span><strong>{String((platformConfigs.topic_community as Record<string, unknown> | undefined)?.viral_threshold ?? 15)}</strong></div>
              </div>
              <div className="miro-llm-reasoning">
                <strong>Round Progression</strong>
                <p>각 round에서 사건 인식, 관찰, 태도 갱신, 발화 생성, graph memory write-back이 순차적으로 반영됩니다. 현재 그래프는 simulation 중에도 계속 다시 읽어옵니다.</p>
              </div>
              <div className="miro-ready-grid">
                <div className="miro-ready-box"><span>Custom Rounds</span><strong>{customRounds} rounds</strong></div>
                <div className="miro-ready-box"><span>Graph Memory Update</span><strong>enabled</strong></div>
                <div className="miro-ready-box"><span>Actions Collected</span><strong>{actions.length}</strong></div>
              </div>
              <div className="miro-round-input-wrap" style={{ marginTop: 14 }}>
                <input className="miro-round-input" type="number" min={1} max={72} value={customRounds} onChange={(e) => setCustomRounds(Number(e.target.value) || 1)} />
                <small>rounds</small>
              </div>
              <button className="miro-run-btn" onClick={runSimulation} disabled={!simulationId || isRunning || !(prepareStatus?.status === "ready" || prepareStatus?.status === "completed")}>
                <span>{isRunning ? "시뮬레이션 실행 중" : "듀얼 플랫폼 시뮬레이션 시작"}</span><Play size={16} />
              </button>
              <div className="miro-sequence-list">
                {recentActions.length ? recentActions.map((action, index) => (
                  <div className="miro-sequence-card" key={`${action.id ?? action.timestamp}-${index}`}>
                    <div className="miro-sequence-head"><strong>{action.agent_name ?? `Agent ${action.agent_id ?? index}`}</strong><span>{action.platform} / R{action.round_num ?? 0} / {action.action_type ?? "ACTION"}</span></div>
                    <p>{getActionSummary(action)}</p>
                  </div>
                )) : (
                  <div className="miro-sequence-card"><div className="miro-sequence-head"><strong>Simulation Feed</strong><span>waiting</span></div><p>시뮬레이션이 시작되면 round별 action feed가 여기에 누적됩니다.</p></div>
                )}
              </div>
            </div>
          </div>

          <div className="miro-step-card miro-step-active">
            <div className="miro-step-header"><div className="miro-step-title-group"><span className="miro-step-num">05</span><div><span className="miro-step-title">Report + Deep Interaction</span><p className="miro-step-subtitle">verdict / follow-up / agent interaction</p></div></div><span className={`miro-badge ${reportData?.status === "completed" ? "miro-badge-success" : "miro-badge-processing"}`}>{reportData?.status ?? reportTask?.status ?? "pending"}</span></div>
            <div className="miro-step-body">
              <p className="miro-api-note">/api/report/generate → /api/report/by-simulation → /api/report/chat → /api/simulation/interview</p>
              <div className="miro-ready-grid">
                <div className="miro-ready-box"><span>Report ID</span><strong>{reportData?.report_id ?? (typeof reportTask?.result?.report_id === "string" ? reportTask.result.report_id : "pending")}</strong></div>
                <div className="miro-ready-box"><span>Report Status</span><strong>{reportData?.status ?? reportTask?.status ?? "pending"}</strong></div>
                <div className="miro-ready-box"><span>Interview Target</span><strong>{selectedProfile?.name ?? "pending"}</strong></div>
              </div>
              <div className="miro-step-actions">
                <button className="miro-primary-btn" type="button" onClick={generateReport} disabled={!simulationId || isGeneratingReport}>
                  {isGeneratingReport ? "리포트 생성 중" : "리포트 생성"}
                </button>
              </div>
              <div className="miro-report-block">
                <div className="miro-report-header">
                  <strong>{reportData?.outline?.title ?? "Final Report"}</strong>
                  <span>{reportData?.completed_at ? formatClock(reportData.completed_at) : "not generated"}</span>
                </div>
                <p className="miro-report-summary">{reportData?.outline?.summary ?? "시뮬레이션을 실행한 뒤 report를 생성하면 executive summary와 evidence 기반 verdict가 표시됩니다."}</p>
                <div className="miro-report-sections">
                  {(reportData?.outline?.sections ?? []).slice(0, 6).map((section, index) => (
                    <article className="miro-report-section" key={`${section.title}-${index}`}>
                      <strong>{section.title}</strong>
                      <p>{section.content}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="miro-chat-block">
                <div className="miro-chat-header">
                  <strong>ReportAgent</strong>
                  <span>{reportChatHistory.length} turns</span>
                </div>
                <div className="miro-chat-log">
                  {reportChatHistory.length ? reportChatHistory.map((turn, index) => (
                    <div className={`miro-chat-turn miro-chat-turn-${turn.role}`} key={`${turn.role}-${index}`}>
                      <span>{turn.role === "user" ? "질문" : "응답"}</span>
                      <p>{turn.content}</p>
                    </div>
                  )) : <div className="miro-chat-empty">리포트 생성 후 후속 질문을 보내면 ReportAgent 응답이 여기에 누적됩니다.</div>}
                </div>
                <div className="miro-chat-input-row">
                  <textarea className="miro-textarea" value={reportQuestion} onChange={(e) => setReportQuestion(e.target.value)} rows={3} />
                  <button className="miro-primary-btn" type="button" onClick={askReportAgent} disabled={!simulationId || isAskingReport || !reportData?.report_id}>
                    <Send size={14} />{isAskingReport ? "질의 중" : "ReportAgent 질문"}
                  </button>
                </div>
              </div>
              <div className="miro-chat-block">
                <div className="miro-chat-header">
                  <strong>Persona Interview</strong>
                  <span>{selectedProfile?.handle ?? "@agent"}</span>
                </div>
                <div className="miro-interview-controls">
                  <select className="miro-select" value={selectedAgentId} onChange={(e) => setSelectedAgentId(Number(e.target.value))}>
                    {profiles.slice(0, 24).map((profile, index) => <option key={profile.id} value={index}>{profile.name}</option>)}
                  </select>
                  <select className="miro-select" value={selectedAgentPlatform} onChange={(e) => setSelectedAgentPlatform(e.target.value as "twitter" | "reddit")}>
                    <option value="twitter">Info Plaza</option>
                    <option value="reddit">Topic Community</option>
                  </select>
                </div>
                <textarea className="miro-textarea" value={interviewPrompt} onChange={(e) => setInterviewPrompt(e.target.value)} rows={3} />
                <button className="miro-primary-btn" type="button" onClick={interviewAgent} disabled={!simulationId || isInterviewing || !selectedProfile}>
                  {isInterviewing ? "인터뷰 중" : "에이전트 인터뷰"}
                </button>
                <div className="miro-interview-response">
                  {interviewResponse || "시뮬레이션이 진행된 뒤 선택한 persona에게 왜 그렇게 반응했는지 직접 물을 수 있습니다."}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="miro-system-log">
        <div className="miro-log-header"><span>시스템 대시보드</span><span>{simulationId ?? project?.project_id ?? buildStableId("proj", active.id)}</span></div>
        <div className="miro-log-body">
          {logs.map((log, index) => (
            <div className="miro-log-line" key={`${log.ts}-${index}`}>
              <span>{formatClock(log.ts)}</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
