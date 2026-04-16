"use client";

import SpdmRedesign from "./spdm-redesign";
import {
  Activity,
  BarChart3,
  Database,
  FileText,
  GitBranch,
  Landmark,
  Play,
  ShieldCheck,
  Users
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { scenarios, signalBase } from "@/lib/sample-data";
import type { Scenario, SeoulRealtimeSnapshot, SimulationRunResult } from "@/lib/types";

const colors = {
  blue: "#0079bc",
  green: "#2e853c",
  amber: "#fe9c00",
  red: "#ae1932",
  violet: "#345f53"
};

function deriveSignals(scenario: Scenario, realtime?: SeoulRealtimeSnapshot | null) {
  const realtimeCrowding = realtime?.crowding.score ?? signalBase.crowding;
  const realtimeMobility = realtime?.mobility.roadTrafficScore ?? signalBase.mobilityLoad;
  const pressure = Math.round(
    realtimeCrowding * 0.28 +
      realtimeMobility * 0.24 +
      scenario.intensity * 42 +
      scenario.personaSensitivity * 24
  );
  const acceptance = Math.max(
    28,
    Math.round(86 - scenario.disruption * 34 + scenario.benefitClarity * 21)
  );
  const risk = Math.max(
    22,
    Math.round(36 + scenario.disruption * 39 + scenario.intensity * 18)
  );
  const confidence = Math.min(
    94,
    Math.round(58 + scenario.evidenceStrength * 31 - scenario.novelty * 11)
  );

  return { pressure, acceptance, risk, confidence };
}

function makeRiver(scenario: Scenario) {
  return ["D-2", "D-1", "Launch", "D+1", "D+2", "D+3"].map((label, index) => {
    const ramp = index / 5;
    return {
      label,
      support: Math.round(22 + scenario.benefitClarity * 34 + ramp * 11),
      concern: Math.round(16 + scenario.novelty * 31 + ramp * 8),
      opposition: Math.round(10 + scenario.disruption * 38 + ramp * 4),
      neutral: Math.round(18 + (1 - scenario.personaSensitivity) * 21 - ramp * 4)
    };
  });
}

function ScenarioComposer({
  active,
  onSelect,
  onRun,
  isRunning,
  runResult
}: {
  active: Scenario;
  onSelect: (scenario: Scenario) => void;
  onRun: () => void;
  isRunning: boolean;
  runResult: SimulationRunResult | null;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Policy Composer</h2>
          <p className="panel-kicker">정책 문서와 실행 조건을 시나리오로 정리</p>
        </div>
        <FileText size={18} color={colors.blue} />
      </div>
      <div className="composer">
        <div className="field">
          <label>정책명</label>
          <input value={active.name} readOnly />
        </div>
        <div className="field">
          <label>정책 유형</label>
          <select value={active.type} onChange={() => undefined}>
            <option>{active.type}</option>
          </select>
        </div>
        <div className="form-row">
          <div className="field">
            <label>대상 권역</label>
            <input value={active.region} readOnly />
          </div>
          <div className="field">
            <label>시간대</label>
            <input value={active.timeWindow} readOnly />
          </div>
        </div>
        <div className="field">
          <label>대상 집단</label>
          <input value={active.personas.join(", ")} readOnly />
        </div>
        <div className="field">
          <label>정책 목표</label>
          <textarea value={active.objective} readOnly />
        </div>
        <button className="primary-button" onClick={onRun} disabled={isRunning}>
          <Play size={18} />
          {isRunning ? "시뮬레이션 실행 중" : "시뮬레이션 실행"}
        </button>
        {runResult ? (
          <div className="run-receipt">
            <strong>{runResult.verdict.headline}</strong>
            <span>Run ID {runResult.runId}</span>
            <span>{new Date(runResult.createdAt).toLocaleString("ko-KR")}</span>
          </div>
        ) : null}
        <div className="scenario-list">
          {scenarios.map((scenario) => (
            <button
              className={`scenario-chip ${scenario.id === active.id ? "active" : ""}`}
              key={scenario.id}
              onClick={() => onSelect(scenario)}
            >
              <strong>{scenario.name}</strong>
              <span>{scenario.region}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SituationSignals({
  scenario,
  realtime
}: {
  scenario: Scenario;
  realtime: SeoulRealtimeSnapshot | null;
}) {
  const signals = deriveSignals(scenario, realtime);
  const items = [
    ["운영 압력", signals.pressure, colors.blue],
    ["시민 수용성", signals.acceptance, colors.green],
    ["갈등 위험", signals.risk, colors.red],
    ["근거 신뢰도", signals.confidence, colors.amber]
  ] as const;

  const districts = [
    ["강남구", 88, colors.blue],
    ["송파구", 81, colors.amber],
    ["서초구", 66, colors.green],
    ["중구", 71, colors.red]
  ] as const;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Current Seoul Situation</h2>
          <p className="panel-kicker">
            {realtime
              ? `${realtime.areaName} · ${realtime.source === "live" ? "실시간 API" : "샘플 대체"} · ${realtime.crowding.level}`
              : "혼잡, 이동, 여론, 근거 데이터의 현재 신호"}
          </p>
        </div>
        <Activity size={18} color={colors.green} />
      </div>
      <div className="signal-grid">
        {items.map(([label, value, color]) => (
          <div className="signal-card" key={label}>
            <div className="signal-label">{label}</div>
            <div className="signal-value">{value}</div>
            <div className="signal-bar">
              <div className="signal-fill" style={{ width: `${value}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="district-bars">
        {realtime ? (
          <div className="district-row">
            <span>{realtime.areaName}</span>
            <div className="mini-bar">
              <span style={{ width: `${realtime.crowding.score}%`, background: colors.blue }} />
            </div>
            <strong>{realtime.crowding.score}</strong>
          </div>
        ) : null}
        {districts.map(([name, value, color]) => (
          <div className="district-row" key={name}>
            <span>{name}</span>
            <div className="mini-bar">
              <span style={{ width: `${value}%`, background: color }} />
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function ImpactGraph({
  scenario,
  realtime
}: {
  scenario: Scenario;
  realtime: SeoulRealtimeSnapshot | null;
}) {
  const opposition = Math.round(40 + scenario.disruption * 40);
  const support = Math.round(44 + scenario.benefitClarity * 38);
  const signals = deriveSignals(scenario, realtime);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Impact Graph</h2>
          <p className="panel-kicker">정책 조치가 권역, 집단, 반응으로 이동하는 경로</p>
        </div>
        <GitBranch size={18} color={colors.amber} />
      </div>
      <div className="graph-wrap">
        <svg className="impact-svg" viewBox="0 0 720 340" role="img" aria-label="Impact graph">
          <path className="flow-line" d="M130 170 C190 170 190 102 260 102" stroke={colors.blue} />
          <path className="flow-line" d="M130 170 C190 170 190 238 260 238" stroke={colors.amber} />
          <path className="flow-line" d="M380 102 C430 102 430 72 500 72" stroke={colors.green} />
          <path className="flow-line" d="M380 238 C430 238 430 272 500 272" stroke={colors.red} />
          <path className="flow-line" d="M600 72 C650 88 650 132 640 160" stroke={colors.green} />
          <path className="flow-line" d="M600 272 C650 250 650 208 640 180" stroke={colors.red} />

          <rect className="node-box" x="30" y="132" width="150" height="76" stroke={colors.blue} />
          <text className="node-text" x="105" y="160">정책 실행</text>
          <text className="node-text" x="105" y="181">{scenario.region}</text>

          <rect className="node-box" x="250" y="64" width="150" height="76" stroke={colors.blue} />
          <text className="node-text" x="325" y="95">운영 신호</text>
          <text className="node-text" x="325" y="116">압력 {signals.pressure}</text>

          <rect className="node-box" x="250" y="200" width="150" height="76" stroke={colors.amber} />
          <text className="node-text" x="325" y="232">생활 영향</text>
          <text className="node-text" x="325" y="253">변동 {Math.round(scenario.disruption * 100)}</text>

          <rect className="node-box" x="490" y="34" width="150" height="76" stroke={colors.green} />
          <text className="node-text" x="565" y="65">기대 효과</text>
          <text className="node-text" x="565" y="86">지지 {support}</text>

          <rect className="node-box" x="490" y="234" width="150" height="76" stroke={colors.red} />
          <text className="node-text" x="565" y="265">반대 확산</text>
          <text className="node-text" x="565" y="286">위험 {opposition}</text>

          <circle cx="650" cy="170" r="38" fill="#111821" stroke={colors.violet} strokeWidth="2" />
          <text className="node-text" x="650" y="164">Verdict</text>
          <text className="node-text" x="650" y="184">{scenario.verdict}</text>
        </svg>
      </div>
      <div className="summary-strip">
        <div className="summary-item">
          <strong>핵심 판단</strong>
          <span>{scenario.judgement}</span>
        </div>
        <div className="summary-item">
          <strong>취약 구간</strong>
          <span>{scenario.fragility}</span>
        </div>
        <div className="summary-item">
          <strong>보완 카드</strong>
          <span>{scenario.mitigation}</span>
        </div>
      </div>
    </section>
  );
}

function ReactionRiver({ scenario }: { scenario: Scenario }) {
  const river = useMemo(() => makeRiver(scenario), [scenario]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Reaction River</h2>
          <p className="panel-kicker">시행 전후 시민 반응의 방향과 속도</p>
        </div>
        <BarChart3 size={18} color={colors.blue} />
      </div>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={river} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="support" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.green} stopOpacity={0.86} />
                <stop offset="95%" stopColor={colors.green} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="concern" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.amber} stopOpacity={0.86} />
                <stop offset="95%" stopColor={colors.amber} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="opposition" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.red} stopOpacity={0.86} />
                <stop offset="95%" stopColor={colors.red} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#9aa8b7", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9aa8b7", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#111821", border: "1px solid #2c3745", borderRadius: 8 }}
              labelStyle={{ color: "#eef2f5" }}
            />
            <Area type="monotone" dataKey="support" stackId="1" stroke={colors.green} fill="url(#support)" name="지지" />
            <Area type="monotone" dataKey="concern" stackId="1" stroke={colors.amber} fill="url(#concern)" name="우려" />
            <Area type="monotone" dataKey="opposition" stackId="1" stroke={colors.red} fill="url(#opposition)" name="반대" />
            <Area type="monotone" dataKey="neutral" stackId="1" stroke={colors.blue} fill="rgba(73,184,232,0.18)" name="관망" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function PersonaCluster({ scenario }: { scenario: Scenario }) {
  const personas = [
    { name: "직장인", stance: "조건부 수용", weight: 68, driver: "퇴근 접근성", color: colors.amber },
    { name: "관광객", stance: "수용 우세", weight: 62, driver: "길찾기 편의", color: colors.blue },
    { name: "상인", stance: "효과 기대", weight: 74, driver: "유입 변화", color: colors.green },
    { name: "주민", stance: "민원 민감", weight: 58, driver: "소음·체류", color: colors.red },
    { name: "청년층", stance: "관망", weight: 48, driver: "온라인 확산", color: colors.violet }
  ];

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Persona Cluster</h2>
          <p className="panel-kicker">{scenario.personas.join(" · ")} 반응 민감도</p>
        </div>
        <Users size={18} color={colors.violet} />
      </div>
      <div className="persona-map">
        {personas.map((persona) => (
          <div className="persona-row" key={persona.name}>
            <span className="persona-color" style={{ background: persona.color }} />
            <strong>{persona.name}</strong>
            <span>{persona.stance}</span>
            <span>{persona.driver}</span>
            <div className="persona-weight">
              <i style={{ width: `${persona.weight}%`, background: persona.color }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VerdictPanel({
  scenario,
  runResult
}: {
  scenario: Scenario;
  runResult: SimulationRunResult | null;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Policy Verdict</h2>
          <p className="panel-kicker">효과, 부작용, 보완 권고를 함께 제시</p>
        </div>
        <ShieldCheck size={18} color={colors.green} />
      </div>
      <div className="verdict-grid">
        <div className="verdict-card">
          <h3>
            <Landmark size={16} color={colors.green} />
            예상 정책 효과
          </h3>
          <p>{runResult ? runResult.verdict.summary : scenario.effect}</p>
        </div>
        <div className="verdict-card">
          <h3>
            <Activity size={16} color={colors.red} />
            부작용과 반대 가능성
          </h3>
          <p>
            {runResult
              ? `반대 ${runResult.reaction.opposition}, 우려 ${runResult.reaction.concern}, 수용성 ${runResult.signals.acceptance}.`
              : scenario.sideEffect}
          </p>
        </div>
        <div className="verdict-card">
          <h3>
            <Database size={16} color={colors.blue} />
            데이터 근거
          </h3>
          <p>
            {runResult
              ? `${scenario.evidence} 실행 결과의 신뢰도는 ${runResult.signals.confidence}입니다.`
              : scenario.evidence}
          </p>
        </div>
      </div>
      <div className="confidence">
        <div className="confidence-track">
          <span />
          <span />
          <span />
        </div>
        <div className="confidence-labels">
          <span>행정 데이터</span>
          <span>공간 신호</span>
          <span>여론 샘플</span>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const [active, setActive] = useState<Scenario>(scenarios[0]);
  const [realtime, setRealtime] = useState<SeoulRealtimeSnapshot | null>(null);
  const [runResult, setRunResult] = useState<SimulationRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    setRealtime(null);

    fetch(`/api/seoul/realtime?area=${encodeURIComponent(active.realtimeArea)}`, {
      signal: controller.signal
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((snapshot: SeoulRealtimeSnapshot | null) => {
        if (snapshot) {
          setRealtime(snapshot);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [active.realtimeArea]);

  useEffect(() => {
    setRunResult(null);
  }, [active.id]);

  async function runSimulation() {
    setIsRunning(true);

    try {
      const response = await fetch("/api/simulation/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scenario: active,
          realtime
        })
      });

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as SimulationRunResult;
      setRunResult(result);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <span>서울</span>
          </div>
          <div>
            <h1>Seoul Policy Data Map</h1>
            <p>서울시 정책 데이터맵 · 산, 한강, 시민 반응을 함께 보는 의사결정 리허설</p>
          </div>
        </div>
        <div className="seoul-signature" aria-label="Seoul identity line">
          <span>산</span>
          <i />
          <span>한강</span>
          <i />
          <span>시민</span>
        </div>
        <div className="topbar-status">
          <span className="status-pill">
            <span className="status-dot" />
            {realtime?.source === "live" ? "Live city data" : "Fallback rehearsal"}
          </span>
          <span className="status-pill">
            {realtime ? `Updated ${realtime.updatedAt}` : "Loading city signal"}
          </span>
          <span className="status-pill">Active scenario: {active.shortName}</span>
          {runResult ? <span className="status-pill">Run: {runResult.verdict.grade}</span> : null}
        </div>
      </header>

      <div className="workspace-grid">
        <ScenarioComposer
          active={active}
          onSelect={setActive}
          onRun={runSimulation}
          isRunning={isRunning}
          runResult={runResult}
        />
        <div className="main-stack">
          <SituationSignals scenario={active} realtime={realtime} />
          <ImpactGraph scenario={active} realtime={realtime} />
        </div>
        <div className="side-stack">
          <ReactionRiver scenario={active} />
          <PersonaCluster scenario={active} />
          <VerdictPanel scenario={active} runResult={runResult} />
        </div>
      </div>

      <footer className="footer">
        <span>SPDM prototype. Sample data only. Not an official Seoul Metropolitan Government service.</span>
        <nav className="footer-links">
          <a href="https://github.com/Cozystone/Seoul-Policy-Data-Map">Source</a>
          <a href="/LICENSE.txt">License</a>
          <a href="/NOTICE.md">Notice</a>
        </nav>
      </footer>
    </main>
  );
}

export default SpdmRedesign;
