"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Github, Languages, Maximize2, Play, RefreshCw } from "lucide-react";
import { scenarios } from "@/lib/sample-data";
import type { Scenario, SeoulRealtimeSnapshot, SimulationRunResult } from "@/lib/types";

const entityColors = ["#ff6b35", "#004e89", "#7b2d8e", "#1a936f", "#c5283d", "#3498db"];

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

function buildGraph(active: Scenario, realtime: SeoulRealtimeSnapshot | null, runResult: SimulationRunResult | null) {
  const nodes: GraphNode[] = [
    { id: "policy", label: active.shortName, type: "정책", x: 370, y: 78, color: "#004e89" },
    { id: "region", label: active.region.split("/")[0].trim(), type: "지역", x: 208, y: 214, color: "#ff6b35" },
    { id: "signal", label: realtime?.areaName ?? active.realtimeArea, type: "도시신호", x: 540, y: 194, color: "#1a936f" },
    { id: "verdict", label: runResult?.verdict.grade ?? active.verdict, type: "판정", x: 664, y: 332, color: "#7b2d8e" },
    { id: "support", label: `지지 ${runResult?.reaction.support ?? 68}`,
      type: "반응", x: 275, y: 348, color: "#1a936f" },
    { id: "concern", label: `우려 ${runResult?.reaction.concern ?? 44}`,
      type: "반응", x: 458, y: 330, color: "#ffb000" }
  ];

  active.personas.slice(0, 4).forEach((persona, index) => {
    nodes.push({
      id: `persona-${index}`,
      label: persona,
      type: "집단",
      x: 126 + index * 150,
      y: 470 - (index % 2) * 38,
      color: entityColors[(index + 2) % entityColors.length]
    });
  });

  const edges: GraphEdge[] = [
    { from: "policy", to: "region", label: "APPLIES_TO" },
    { from: "policy", to: "signal", label: "AFFECTS" },
    { from: "signal", to: "verdict", label: "INFLUENCES" },
    { from: "region", to: "support", label: "REACTS_TO" },
    { from: "signal", to: "concern", label: "AMPLIFIES" },
    { from: "support", to: "verdict", label: "MITIGATES" },
    { from: "concern", to: "verdict", label: "MENTIONS" }
  ];

  active.personas.slice(0, 4).forEach((_, index) => {
    edges.push({ from: `persona-${index}`, to: index % 2 === 0 ? "support" : "concern", label: "REACTS_TO" });
  });

  return { nodes, edges };
}

function formatClock(iso?: string) {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("ko-KR", { hour12: false });
}

export default function SpdmRedesign() {
  const [active, setActive] = useState<Scenario>(scenarios[0]);
  const [realtime, setRealtime] = useState<SeoulRealtimeSnapshot | null>(null);
  const [runResult, setRunResult] = useState<SimulationRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executeCore, setExecuteCore] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "시스템 대시보드가 준비되었습니다.",
    "서울 정책 반응 트윈이 정책 문서와 도시 신호를 대기 중입니다."
  ]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/seoul/realtime?area=${encodeURIComponent(active.realtimeArea)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((snapshot: SeoulRealtimeSnapshot | null) => {
        if (snapshot) {
          setRealtime(snapshot);
          setLogs((prev) => [
            `${formatClock(snapshot.updatedAt)} ${snapshot.areaName} 실시간 도시데이터를 반영했습니다.`,
            ...prev.slice(0, 7)
          ]);
        }
      })
      .catch(() => undefined);

    setRunResult(null);
    return () => controller.abort();
  }, [active]);

  async function runSimulation() {
    setIsRunning(true);
    setLogs((prev) => [
      `${formatClock(new Date().toISOString())} 시뮬레이션 실행 요청을 전송했습니다.`,
      ...prev.slice(0, 7)
    ]);

    try {
      const response = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: active, realtime, executeCore, maxRounds: 1 })
      });

      if (response.ok) {
        const data = (await response.json()) as SimulationRunResult;
        setRunResult(data);
        setLogs((prev) => [
          `${formatClock(data.createdAt)} ${data.engine} 엔진으로 run ${data.runId} 가 생성되었습니다.`,
          `${formatClock(data.createdAt)} verdict ${data.verdict.grade}, support ${data.reaction.support}, concern ${data.reaction.concern}.`,
          ...prev.slice(0, 6)
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

  const ontologyEntities = ["정책", "지역", "장소", "인구집단", "문서", "반응", ...active.personas].slice(0, 9);
  const ontologyRelations = ["APPLIES_TO", "AFFECTS", "INFLUENCES", "REACTS_TO", "AMPLIFIES", "MITIGATES"];
  const buildProgress = runResult ? 100 : realtime ? 45 : 18;

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
          <span className="miro-section-title">그래프 빌드</span>
          <span className="miro-phase-dot" />
          <span className="miro-phase-text">온톨로지 생성</span>
        </div>

        <div className="miro-topbar-right">
          <button className="miro-lang-btn">
            <Languages size={14} />
            영어 / 중간어
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
            <span className="miro-graph-title">그래프 관계 시각화</span>
            <div className="miro-graph-tools">
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

          <svg className="miro-graph-svg" viewBox="0 0 820 620" role="img" aria-label="MiroFish style graph">
            {graph.edges.map((edge) => {
              const from = graph.nodes.find((node) => node.id === edge.from)!;
              const to = graph.nodes.find((node) => node.id === edge.to)!;
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              return (
                <g key={`${edge.from}-${edge.to}-${edge.label}`}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#b8b8b8" strokeWidth="1.5" />
                  <rect x={mx - 30} y={my - 8} width="60" height="16" rx="6" fill="rgba(255,255,255,0.92)" />
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
            <span className="miro-graph-pill-icon">◉</span>
            {isRunning ? "실시간으로 업데이트 중..." : "서울 정책 그래프가 준비되었습니다."}
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
          <div className="miro-step-card miro-step-complete">
            <div className="miro-step-header">
              <div className="miro-step-title-group">
                <span className="miro-step-num">01</span>
                <span className="miro-step-title">온톨로지 생성</span>
              </div>
              <span className="miro-badge miro-badge-success">빌드 완료</span>
            </div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/graph/ontology/generate</p>
              <p className="miro-step-desc">
                정책 문서와 현재 서울 상태를 분석하고, 실제 세계의 시드와 서울형 개체 및 관계 구조를 생성합니다.
              </p>
              <span className="miro-tag-label">생성된 엔티티 유형</span>
              <div className="miro-tag-list">
                {ontologyEntities.map((item) => (
                  <span className="miro-tag" key={item}>{item}</span>
                ))}
              </div>
              <span className="miro-tag-label">생성된 관계 유형</span>
              <div className="miro-tag-list">
                {ontologyRelations.map((item) => (
                  <span className="miro-tag" key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="miro-step-card miro-step-active">
            <div className="miro-step-header">
              <div className="miro-step-title-group">
                <span className="miro-step-num">02</span>
                <span className="miro-step-title">GraphRAG 빌드</span>
              </div>
              <span className="miro-badge miro-badge-processing">{buildProgress}%</span>
            </div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/graph/build</p>
              <p className="miro-step-desc">
                온톨로지를 기준으로 정책, 지역, 시민 집단, 반응 흐름을 그래프 메모리로 정리하고 요약 계층을 구성합니다.
              </p>
              <div className="miro-stats-grid">
                <div className="miro-stat-card"><strong>{graph.nodes.length}</strong><span>노드</span></div>
                <div className="miro-stat-card"><strong>{graph.edges.length}</strong><span>엣지</span></div>
                <div className="miro-stat-card"><strong>{entityTypes.length}</strong><span>타입</span></div>
              </div>
            </div>
          </div>

          <div className="miro-step-card">
            <div className="miro-step-header">
              <div className="miro-step-title-group">
                <span className="miro-step-num">03</span>
                <span className="miro-step-title">서울 신호 주입</span>
              </div>
              <span className="miro-badge miro-badge-neutral">{realtime?.source === "live" ? "LIVE" : "SAMPLE"}</span>
            </div>
            <div className="miro-step-body miro-signal-card-list">
              <div className="miro-signal-row"><span>대상 지역</span><strong>{realtime?.areaName ?? active.realtimeArea}</strong></div>
              <div className="miro-signal-row"><span>혼잡도</span><strong>{realtime?.crowding.level ?? "loading"}</strong></div>
              <div className="miro-signal-row"><span>도로상태</span><strong>{realtime?.mobility.roadTrafficLevel ?? "loading"}</strong></div>
              <div className="miro-signal-row"><span>기온</span><strong>{realtime?.weather.temperatureC ?? "-"}°C</strong></div>
            </div>
          </div>

          <div className="miro-step-card">
            <div className="miro-step-header">
              <div className="miro-step-title-group">
                <span className="miro-step-num">04</span>
                <span className="miro-step-title">시뮬레이션 실행</span>
              </div>
              {runResult ? <span className="miro-badge miro-badge-accent">{runResult.engine}</span> : null}
            </div>
            <div className="miro-step-body">
              <p className="miro-api-note">POST /api/simulation/run</p>
              <textarea
                className="miro-textarea"
                readOnly
                value={`${active.name}\n${active.objective}\n대상: ${active.personas.join(", ")}`}
              />
              <label className="miro-check-row">
                <input type="checkbox" checked={executeCore} onChange={(e) => setExecuteCore(e.target.checked)} />
                <span>MiroFish core runner 실행</span>
              </label>
              <button className="miro-run-btn" onClick={runSimulation} disabled={isRunning}>
                <span>{isRunning ? "실행 중..." : "Start Engine"}</span>
                <Play size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="miro-system-log">
        <div className="miro-log-header">
          <span>시스템 대시보드</span>
          <span>{runResult?.runId ?? "project_spdm_local"}</span>
        </div>
        <div className="miro-log-body">
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
