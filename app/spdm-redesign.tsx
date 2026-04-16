"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Github, Languages, Maximize2, Play, RefreshCw } from "lucide-react";
import { scenarios } from "@/lib/sample-data";
import type { Scenario, SeoulRealtimeSnapshot, SimulationRunResult } from "@/lib/types";

const entityColors = ["#ff7a45", "#1d5fd0", "#8b5cf6", "#10b981", "#ef4444", "#06b6d4", "#f59e0b"];

type GraphNode = {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  color: string;
};

type GraphEdge = {
  from: string;
  to: string;
  label: string;
};

type AgentProfile = {
  id: string;
  handle: string;
  role: string;
  archetype: string;
  summary: string;
  topics: string[];
  stance: "지지" | "중립" | "반발";
  influence: number;
};

function buildGraph(active: Scenario, realtime: SeoulRealtimeSnapshot | null, runResult: SimulationRunResult | null) {
  const nodes: GraphNode[] = [
    { id: "policy", label: active.shortName, type: "정책", x: 348, y: 84, color: "#1d5fd0" },
    { id: "region", label: active.region.split("/")[0].trim(), type: "지역", x: 178, y: 210, color: "#ff7a45" },
    { id: "signal", label: realtime?.areaName ?? active.realtimeArea, type: "도시신호", x: 530, y: 210, color: "#10b981" },
    { id: "opinion", label: `여론 ${runResult?.reaction.concern ?? 46}`, type: "반응", x: 318, y: 332, color: "#8b5cf6" },
    { id: "impact", label: `영향 ${runResult?.signals.pressure ?? 67}`, type: "지표", x: 498, y: 330, color: "#06b6d4" },
    { id: "verdict", label: runResult?.verdict.grade ?? active.verdict, type: "판정", x: 650, y: 456, color: "#ef4444" }
  ];

  active.personas.slice(0, 4).forEach((persona, index) => {
    nodes.push({
      id: `persona-${index}`,
      label: persona,
      type: "에이전트",
      x: 102 + index * 160,
      y: 468 - (index % 2) * 34,
      color: entityColors[(index + 2) % entityColors.length]
    });
  });

  const edges: GraphEdge[] = [
    { from: "policy", to: "region", label: "APPLIES_TO" },
    { from: "policy", to: "signal", label: "AFFECTS" },
    { from: "region", to: "opinion", label: "REACTS_TO" },
    { from: "signal", to: "impact", label: "INFLUENCES" },
    { from: "opinion", to: "verdict", label: "AMPLIFIES" },
    { from: "impact", to: "verdict", label: "MITIGATES" }
  ];

  active.personas.slice(0, 4).forEach((_, index) => {
    edges.push({ from: `persona-${index}`, to: index % 2 === 0 ? "opinion" : "impact", label: "MENTIONS" });
  });

  return { nodes, edges };
}

function formatClock(iso?: string) {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("ko-KR", { hour12: false });
}

function buildStableId(prefix: string, seed: string) {
  const safe = seed.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${prefix}_${safe.slice(0, 12) || "spdm"}`;
}

function buildAgentProfiles(active: Scenario, runResult: SimulationRunResult | null): AgentProfile[] {
  const personaProfiles: AgentProfile[] = active.personas.map((persona, index) => ({
    id: `${persona.toLowerCase().replace(/\s+/g, "-")}-${index}`,
    handle: `@${persona.replace(/\s+/g, "")}`,
    role: persona,
    archetype: index % 3 === 0 ? "시민 그룹" : index % 3 === 1 ? "현장 이해관계자" : "온라인 반응층",
    summary:
      `${persona} 집단은 ${active.shortName} 정책이 자신의 이동, 비용, 안전, 체감 편익에 어떤 변화를 주는지에 따라 반응 강도가 달라진다.`,
    topics: [active.type, active.region.split("/")[0].trim(), "정책 수용성", "도시 체감"],
    stance: index % 3 === 0 ? "지지" : index % 3 === 1 ? "중립" : "반발",
    influence: 1 + index * 0.3
  }));

  const institutionalProfiles: AgentProfile[] = [
    {
      id: "seoul-mayor-office",
      handle: "@서울시 정책총괄",
      role: "행정 담당자",
      archetype: "공공기관",
      summary: "서울시 정책총괄 부서는 정책 시행 명분과 실행 가능성을 동시에 설명해야 하며, 초반 메시지 설계가 여론 분산을 좌우한다.",
      topics: ["정책 커뮤니케이션", "행정 신뢰", "성과관리"],
      stance: "지지",
      influence: 2.6
    },
    {
      id: "seoul-open-data",
      handle: "@서울 열린데이터광장",
      role: "데이터 플랫폼",
      archetype: "기관 계정",
      summary: "실시간 혼잡도와 교통, 날씨 신호를 제공하며 정책 근거의 신뢰도를 높이는 역할을 맡는다.",
      topics: ["실시간 데이터", "근거기반 정책", "도시 신호"],
      stance: "중립",
      influence: 2.2
    },
    {
      id: "district-merchants",
      handle: "@권역 상인회",
      role: "자영업자 연합",
      archetype: "지역 경제",
      summary: "정책이 유동 인구와 체류 시간을 어떻게 바꾸는지에 따라 즉각적인 지지 또는 반발 메시지를 발화한다.",
      topics: ["상권 매출", "유동 인구", "현장 체감"],
      stance: runResult && runResult.reaction.concern > runResult.reaction.support ? "반발" : "중립",
      influence: 1.8
    },
    {
      id: "community-watch",
      handle: "@지역 커뮤니티",
      role: "온라인 커뮤니티 사용자",
      archetype: "디지털 여론",
      summary: "현장 사진, 체감 후기, 불편 경험을 빠르게 확산시키며 반응의 속도를 끌어올린다.",
      topics: ["민원", "체감 후기", "반응 확산"],
      stance: "반발",
      influence: 1.4
    },
    {
      id: "traffic-operator",
      handle: "@서울교통 운영실",
      role: "교통 운영기관",
      archetype: "운영자",
      summary: "혼잡 관리와 이동 안정성 수치를 기준으로 정책의 운영 가능성을 판단한다.",
      topics: ["교통 혼잡", "접근성", "운영 부하"],
      stance: "중립",
      influence: 2.1
    }
  ];

  return [...institutionalProfiles, ...personaProfiles];
}

function stanceClass(stance: AgentProfile["stance"]) {
  if (stance === "지지") return "miro-pill-positive";
  if (stance === "반발") return "miro-pill-negative";
  return "miro-pill-neutral";
}

export default function SpdmRedesign() {
  const [active, setActive] = useState<Scenario>(scenarios[0]);
  const [realtime, setRealtime] = useState<SeoulRealtimeSnapshot | null>(null);
  const [runResult, setRunResult] = useState<SimulationRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executeCore, setExecuteCore] = useState(true);
  const [customRounds, setCustomRounds] = useState(40);
  const [logs, setLogs] = useState<string[]>([
    "시뮬레이션 작업대가 준비되었습니다.",
    "서울 정책 시드와 도시 신호를 불러오는 중입니다."
  ]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/seoul/realtime?area=${encodeURIComponent(active.realtimeArea)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((snapshot: SeoulRealtimeSnapshot | null) => {
        if (snapshot) {
          setRealtime(snapshot);
          setLogs((prev) => [
            `${formatClock(snapshot.updatedAt)} ${snapshot.areaName} 실시간 도시 신호를 반영했습니다.`,
            ...prev.slice(0, 9)
          ]);
        }
      })
      .catch(() => undefined);

    setRunResult(null);
    return () => controller.abort();
  }, [active]);

  async function runSimulation() {
    setIsRunning(true);
    setLogs((prev) => [`${formatClock(new Date().toISOString())} 시뮬레이션 시작 요청을 전송했습니다.`, ...prev.slice(0, 9)]);

    try {
      const response = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: active, realtime, executeCore, maxRounds: customRounds })
      });

      if (response.ok) {
        const data = (await response.json()) as SimulationRunResult;
        setRunResult(data);
        setLogs((prev) => [
          `${formatClock(data.createdAt)} ${data.engine} 엔진이 run ${data.runId} 를 생성했습니다.`,
          `${formatClock(data.createdAt)} 지지 ${data.reaction.support}, 우려 ${data.reaction.concern}, 반발 ${data.reaction.opposition}.`,
          ...prev.slice(0, 8)
        ]);
      }
    } finally {
      setIsRunning(false);
    }
  }

  const graph = useMemo(() => buildGraph(active, realtime, runResult), [active, realtime, runResult]);
  const entityTypes = useMemo(() => {
    const uniq = new Map<string, string>();
    graph.nodes.forEach((node) => {
      if (!uniq.has(node.type)) uniq.set(node.type, node.color);
    });
    return [...uniq.entries()].map(([name, color]) => ({ name, color }));
  }, [graph]);
  const agentProfiles = useMemo(() => buildAgentProfiles(active, runResult), [active, runResult]);
  const topicTags = useMemo(
    () => [active.shortName, active.region.split("/")[0].trim(), active.type, realtime?.areaName ?? active.realtimeArea, "시민 반응", "정책 수용성"],
    [active, realtime]
  );

  const projectId = buildStableId("proj", active.id);
  const graphId = buildStableId("mirofish", active.realtimeArea);
  const simulationId = runResult?.runId ?? buildStableId("sim", `${active.id}${active.timeWindow}`);
  const taskId = buildStableId("task_prepare", `${active.id}${active.personas.join("")}`);
  const expectedTotalAgents = 180 + Math.round(active.intensity * 120);
  const totalRounds = 72;
  const activePerHourMin = 10 + Math.round(active.novelty * 8);
  const activePerHourMax = 24 + Math.round(active.personaSensitivity * 6);
  const buildProgress = runResult ? 100 : realtime ? 92 : 66;
  const graphStats = {
    nodes: graph.nodes.length + 48,
    edges: graph.edges.length + 97
  };
  const activationSequence = [
    {
      role: "행정 담당자",
      handle: "@서울시 정책총괄",
      message: `${active.shortName} 시행안은 ${active.objective}를 목표로 합니다. 초기 운영 과정에서 현장 피드백을 즉시 반영하겠습니다.`
    },
    {
      role: active.personas[0] ?? "시민",
      handle: `@${(active.personas[0] ?? "시민").replace(/\s+/g, "")}`,
      message: `현장 체감이 정말 개선되는지 궁금합니다. ${active.shortName}이 실제 혼잡과 불편을 줄이지 못하면 반응은 빠르게 바뀔 수 있습니다.`
    },
    {
      role: "자영업자",
      handle: "@권역상인회",
      message: `유동 인구가 분산되는 방식이 매출에 어떤 영향을 주는지 중요합니다. 상권 보완책이 같이 나와야 납득할 수 있습니다.`
    },
    {
      role: "언론",
      handle: "@도시정책브리프",
      message: `이번 정책은 단순 혼잡 완화가 아니라 행정 신뢰, 수용성, 데이터 설명 책임까지 함께 검증받게 됩니다.`
    }
  ];

  return (
    <main className="miro-shell">
      <header className="miro-topbar">
        <div className="miro-topbar-left">
          <button className="miro-icon-btn" aria-label="back">
            <ArrowLeft size={18} />
          </button>
          <div className="miro-brand">
            <div className="miro-brand-mark">S</div>
            <strong>Seoul Policy Reaction Twin</strong>
          </div>
        </div>

        <div className="miro-topbar-center">
          <button className="miro-tab">그래프</button>
          <button className="miro-tab miro-tab-active">내비다</button>
          <button className="miro-tab">작업대</button>
          <span className="miro-section-title">시뮬레이션</span>
          <span className="miro-phase-dot" />
          <span className="miro-phase-text">에이전트 생성</span>
        </div>

        <div className="miro-topbar-right">
          <button className="miro-lang-btn">
            <Languages size={14} />
            한국어 / 영어
          </button>
          <a className="miro-github-btn" href="https://github.com/Cozystone/Seoul-Policy-Data-Map">
            <Github size={16} />
            깃허브
          </a>
        </div>
      </header>

      <div className="miro-workspace">
        <section className="miro-graph-panel">
          <div className="miro-graph-header">
            <span className="miro-graph-title">시뮬레이션 관계 시각화</span>
            <div className="miro-graph-tools">
              <div className="miro-select-pill">
                <button
                  className="miro-select-trigger"
                  type="button"
                  onClick={() =>
                    setActive((current) => scenarios[(scenarios.findIndex((item) => item.id === current.id) + 1) % scenarios.length])
                  }
                >
                  {active.shortName}
                  <ChevronDown size={14} />
                </button>
              </div>
              <button className="miro-tool-btn" onClick={() => setRunResult(null)}>
                <RefreshCw size={14} />
                새로 고치다
              </button>
              <button className="miro-icon-btn" aria-label="maximize">
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          <label className="miro-toggle-chip">
            <span className="miro-switch miro-switch-on"><i /></span>
            엣지 레이블 표시
          </label>

          <svg className="miro-graph-svg" viewBox="0 0 820 620" role="img" aria-label="simulation graph">
            {graph.edges.map((edge) => {
              const from = graph.nodes.find((node) => node.id === edge.from)!;
              const to = graph.nodes.find((node) => node.id === edge.to)!;
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              return (
                <g key={`${edge.from}-${edge.to}-${edge.label}`}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#c8c8ce" strokeWidth="1.4" />
                  <rect x={mx - 34} y={my - 9} width="68" height="18" rx="7" fill="rgba(255,255,255,0.94)" />
                  <text x={mx} y={my + 4} textAnchor="middle" className="miro-edge-label">{edge.label}</text>
                </g>
              );
            })}
            {graph.nodes.map((node) => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r="10" fill={node.color} stroke="#fff" strokeWidth="3" />
                <text x={node.x + 16} y={node.y + 4} className="miro-node-label">{node.label}</text>
              </g>
            ))}
          </svg>

          <div className="miro-graph-pill">
            <span className="miro-graph-pill-icon">◎</span>
            {isRunning ? "실시간으로 업데이트 중..." : "시뮬레이션 상태를 실시간으로 반영 중..."}
          </div>

          <div className="miro-legend-card">
            <span className="miro-legend-title">엔티티 유형</span>
            <div className="miro-legend-list">
              {entityTypes.map((item) => (
                <div className="miro-legend-item" key={item.name}>
                  <span className="miro-legend-dot" style={{ background: item.color }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="miro-workbench">
          <div className="miro-step-card">
            <div className="miro-step-header">
              <div className="miro-step-title-group">
                <span className="miro-step-num">01</span>
                <div>
                  <span className="miro-step-title">시뮬레이션 인스턴스 초기화</span>
                  <p className="miro-step-subtitle">Simulation Instance Init</p>
                </div>
              </div>
              <span className="miro-badge miro-badge-success"><Check size={14} /> 완료</span>
            </div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/simulation/create</p>
              <p className="miro-step-desc">시뮬레이션 인스턴스를 생성하고, 서울형 월드 파라미터 템플릿을 불러옵니다.</p>
              <div className="miro-id-grid">
                <div className="miro-id-item"><span>Project ID</span><strong>{projectId}</strong></div>
                <div className="miro-id-item"><span>Graph ID</span><strong>{graphId}</strong></div>
                <div className="miro-id-item"><span>Simulation ID</span><strong>{simulationId}</strong></div>
                <div className="miro-id-item"><span>Task ID</span><strong>{taskId}</strong></div>
              </div>
            </div>
          </div>

          <div className="miro-step-card">
            <div className="miro-step-header">
              <div className="miro-step-title-group">
                <span className="miro-step-num">02</span>
                <div>
                  <span className="miro-step-title">에이전트 프로필 생성</span>
                  <p className="miro-step-subtitle">Generate Agent Profiles</p>
                </div>
              </div>
              <span className="miro-badge miro-badge-success"><Check size={14} /> 완료</span>
            </div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/simulation/prepare</p>
              <p className="miro-step-desc">서울시 정책 맥락과 실세계 시드를 기반으로 각 개체의 완전한 에이전트 프로필을 생성합니다.</p>
              <div className="miro-summary-grid">
                <div className="miro-summary-card"><span>Current Agents</span><strong>{agentProfiles.length}</strong></div>
                <div className="miro-summary-card"><span>Expected Total</span><strong>{expectedTotalAgents}</strong></div>
                <div className="miro-summary-card"><span>Related Topics</span><strong>{topicTags.length}</strong></div>
                <div className="miro-summary-card"><span>Graph Build</span><strong>{buildProgress}%</strong></div>
              </div>
              <span className="miro-tag-label">관련 토픽</span>
              <div className="miro-tag-list">
                {topicTags.map((tag) => (
                  <span className="miro-tag" key={tag}>{tag}</span>
                ))}
              </div>
              <span className="miro-tag-label">생성된 에이전트 프로필</span>
              <div className="miro-agent-list">
                {agentProfiles.map((agent) => (
                  <article className="miro-agent-card" key={agent.id}>
                    <div className="miro-agent-header">
                      <div>
                        <strong>{agent.role}</strong>
                        <span>{agent.handle}</span>
                      </div>
                      <span className={`miro-pill ${stanceClass(agent.stance)}`}>{agent.stance}</span>
                    </div>
                    <div className="miro-agent-role">{agent.archetype}</div>
                    <p className="miro-agent-summary">{agent.summary}</p>
                    <div className="miro-mini-tags">
                      {agent.topics.map((topic) => (
                        <span key={topic}>{topic}</span>
                      ))}
                      <span>+{Math.round(agent.influence * 10)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="miro-step-card">
            <div className="miro-step-header">
              <div className="miro-step-title-group">
                <span className="miro-step-num">03</span>
                <div>
                  <span className="miro-step-title">시뮬레이션 설정 생성</span>
                  <p className="miro-step-subtitle">Generate Config</p>
                </div>
              </div>
              <span className="miro-badge miro-badge-success"><Check size={14} /> 완료</span>
            </div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/simulation/prepare</p>
              <p className="miro-step-desc">시뮬레이션 요구사항과 에이전트 프로필을 바탕으로 듀얼 플랫폼 실행 파라미터를 생성합니다.</p>
              <div className="miro-config-grid">
                <div className="miro-config-item"><span>Duration</span><strong>72 hours</strong></div>
                <div className="miro-config-item"><span>Round Duration</span><strong>60 min</strong></div>
                <div className="miro-config-item"><span>Total Rounds</span><strong>{totalRounds} rounds</strong></div>
                <div className="miro-config-item"><span>Active / Hour</span><strong>{activePerHourMin}-{activePerHourMax}</strong></div>
                <div className="miro-config-item"><span>Peak Hours</span><strong>19:00, 20:00, 21:00, 22:00 ×1.5</strong></div>
                <div className="miro-config-item"><span>Work Hours</span><strong>09:00-18:00 ×0.7</strong></div>
                <div className="miro-config-item"><span>Morning Hours</span><strong>06:00-08:00 ×0.4</strong></div>
                <div className="miro-config-item"><span>Off-Peak Hours</span><strong>00:00-05:00 ×0.05</strong></div>
              </div>
              <div className="miro-config-panel">
                <div className="miro-config-panel-title">Agent Config</div>
                <div className="miro-config-panel-head">
                  <span>{agentProfiles.length} agents</span>
                  <span>{runResult?.engine ?? "mirofish-offline"}</span>
                </div>
                <div className="miro-compact-agents">
                  {agentProfiles.slice(0, 8).map((agent, index) => (
                    <div className="miro-compact-agent" key={agent.id}>
                      <div className="miro-compact-agent-title">Agent {index}</div>
                      <div className="miro-compact-agent-row"><span>{agent.role}</span><strong>{agent.stance}</strong></div>
                      <div className="miro-compact-agent-row"><span>Activity Level</span><strong>{50 + index * 5}%</strong></div>
                      <div className="miro-compact-agent-row"><span>Influence Weight</span><strong>{agent.influence.toFixed(1)}</strong></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="miro-llm-reasoning">
                <strong>LLM 설정 근거</strong>
                <p>
                  {active.shortName} 정책은 {active.timeWindow} 시간대의 도시 반응을 검증하는 시나리오입니다. 피크 시간은 직장인,
                  주민, 온라인 커뮤니티 사용자의 반응이 가장 강한 저녁 시간대로 설정했고, 새벽 시간대는 활동을 낮춰 실제 정책 담론의 흐름과 맞췄습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="miro-step-card">
            <div className="miro-step-header">
              <div className="miro-step-title-group">
                <span className="miro-step-num">04</span>
                <div>
                  <span className="miro-step-title">초기 활성화 오케스트레이션</span>
                  <p className="miro-step-subtitle">Initial Activation Orchestration</p>
                </div>
              </div>
              <span className="miro-badge miro-badge-success"><Check size={14} /> 완료</span>
            </div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/simulation/prepare</p>
              <p className="miro-step-desc">내러티브 방향성과 에이전트 프로필을 기준으로 초기 활성화 순서를 구성합니다.</p>
              <div className="miro-narrative-box">
                <span>내러티브 방향</span>
                <p>
                  {active.shortName}에 대한 초기 반응은 정책 편익을 높게 보는 집단과 절차적 정당성을 더 따지는 집단으로 갈립니다. 논의는
                  행정 신뢰, 현장 체감, 데이터 근거의 충분성에 집중됩니다.
                </p>
              </div>
              <span className="miro-tag-label">초기 핫토픽</span>
              <div className="miro-tag-list">
                {topicTags.slice(0, 5).map((tag) => (
                  <span className="miro-tag" key={tag}># {tag}</span>
                ))}
              </div>
              <span className="miro-tag-label">초기 활성화 시퀀스 ({activationSequence.length})</span>
              <div className="miro-sequence-list">
                {activationSequence.map((item, index) => (
                  <div className="miro-sequence-card" key={`${item.handle}-${index}`}>
                    <div className="miro-sequence-head">
                      <strong>{item.role}</strong>
                      <span>{item.handle}</span>
                    </div>
                    <p>{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="miro-step-card miro-step-active">
            <div className="miro-step-header">
              <div className="miro-step-title-group">
                <span className="miro-step-num">05</span>
                <div>
                  <span className="miro-step-title">준비 완료</span>
                  <p className="miro-step-subtitle">Ready</p>
                </div>
              </div>
              <span className={`miro-badge ${runResult ? "miro-badge-success" : "miro-badge-processing"}`}>
                {runResult ? <Check size={14} /> : null}
                {runResult ? "실행됨" : isRunning ? "실행 중" : "진행 중"}
              </span>
            </div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/simulation/start</p>
              <p className="miro-step-desc">시뮬레이션 환경이 준비되었습니다. 듀얼 플랫폼 실행을 시작할 수 있습니다.</p>
              <div className="miro-ready-grid">
                <div className="miro-ready-box">
                  <span>Simulation Rounds Config</span>
                  <strong>72 hours / 60 min per round</strong>
                </div>
                <div className="miro-ready-box">
                  <span>Custom</span>
                  <div className="miro-round-input-wrap">
                    <input
                      className="miro-round-input"
                      type="number"
                      min={1}
                      max={72}
                      value={customRounds}
                      onChange={(e) => setCustomRounds(Number(e.target.value) || 1)}
                    />
                    <small>rounds</small>
                  </div>
                </div>
                <div className="miro-ready-box">
                  <span>Estimated</span>
                  <strong>~{Math.max(1, Math.round(customRounds * 0.6))} min</strong>
                </div>
              </div>
              <label className="miro-check-row">
                <input type="checkbox" checked={executeCore} onChange={(e) => setExecuteCore(e.target.checked)} />
                <span>MiroFish core runner 실제 실행</span>
              </label>
              <p className="miro-step-helper">라운드를 조정하려면 custom 모드를 사용하세요.</p>
              <button className="miro-run-btn" onClick={runSimulation} disabled={isRunning}>
                <span>{isRunning ? "시뮬레이션 실행 중" : "듀얼 플랫폼 시뮬레이션 시작"}</span>
                <Play size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="miro-system-log">
        <div className="miro-log-header">
          <span>시스템 대시보드</span>
          <span>{projectId}</span>
        </div>
        <div className="miro-log-body">
          <div className="miro-log-line">
            <span>{formatClock(new Date().toISOString())}</span>
            <span>그래프 빌드 작업이 시작되었습니다... 작업: {taskId}</span>
          </div>
          <div className="miro-log-line">
            <span>{formatClock(new Date().toISOString())}</span>
            <span>그래프가 새로 고쳐졌습니다: 노드 {graphStats.nodes}개, 엣지 {graphStats.edges}개</span>
          </div>
          {logs.map((log, index) => (
            <div className="miro-log-line" key={`${log}-${index}`}>
              <span>{formatClock(new Date().toISOString())}</span>
              <span>{log}</span>
            </div>
          ))}
          {runResult ? (
            <div className="miro-log-line">
              <span>{formatClock(runResult.createdAt)}</span>
              <span>
                verdict {runResult.verdict.grade} / support {runResult.reaction.support} / concern {runResult.reaction.concern} / opposition {runResult.reaction.opposition}
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
