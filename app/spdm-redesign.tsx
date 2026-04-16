"use client";

import {
  Activity,
  ArrowRight,
  Database,
  FileText,
  GitBranch,
  Landmark,
  Play,
  Radar,
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
import { scenarios } from "@/lib/sample-data";
import { deriveSimulationSignals } from "@/lib/simulation";
import type { Scenario, SeoulRealtimeSnapshot, SimulationRunResult } from "@/lib/types";

const palette = {
  seoulBlue: "#0079bc",
  dancheongRed: "#ae1932",
  seoulGreen: "#2e853c",
  gold: "#fe9c00"
};

function makeRiver(scenario: Scenario, runResult: SimulationRunResult | null) {
  const anchor = runResult?.reaction;

  return ["Seed", "Graph", "Round 01", "Round 04", "Round 08", "Report"].map((label, index) => {
    const ramp = index / 5;
    return {
      label,
      support: anchor
        ? Math.round(anchor.support * (0.58 + ramp * 0.42))
        : Math.round(22 + scenario.benefitClarity * 34 + ramp * 11),
      concern: anchor
        ? Math.round(anchor.concern * (0.62 + ramp * 0.38))
        : Math.round(16 + scenario.novelty * 31 + ramp * 8),
      opposition: anchor
        ? Math.round(anchor.opposition * (0.55 + ramp * 0.45))
        : Math.round(10 + scenario.disruption * 38 + ramp * 4),
      neutral: anchor
        ? Math.round(anchor.neutral * (0.72 - ramp * 0.16))
        : Math.round(18 + (1 - scenario.personaSensitivity) * 21 - ramp * 4)
    };
  });
}

function SeoulMark() {
  return (
    <div className="mf-mark" aria-label="Seoul Policy Data Map">
      <span>SPDM</span>
      <i />
    </div>
  );
}

function ScenarioConsole({
  active,
  setActive,
  realtime,
  runResult,
  isRunning,
  executeCore,
  setExecuteCore,
  onRun
}: {
  active: Scenario;
  setActive: (scenario: Scenario) => void;
  realtime: SeoulRealtimeSnapshot | null;
  runResult: SimulationRunResult | null;
  isRunning: boolean;
  executeCore: boolean;
  setExecuteCore: (value: boolean) => void;
  onRun: () => void;
}) {
  const signals = deriveSimulationSignals(active, realtime);
  const coreState = runResult?.mirofish?.data?.core_run_state;

  return (
    <section className="mf-console">
      <div className="mf-console-top">
        <div>
          <span className="mf-eyebrow">Seoul policy reaction twin</span>
          <h1>정책이 도시로 나가기 전에 반응을 리허설합니다.</h1>
          <p>
            정책 문서, 실시간 도시 신호, 지역 맥락, 시민 페르소나를 MiroFish 기반 멀티에이전트 실행 흐름으로 연결합니다.
          </p>
        </div>
        <div className="mf-live">
          <strong>{realtime?.source === "live" ? "LIVE" : "SAMPLE"}</strong>
          <span>{realtime?.areaName ?? active.realtimeArea}</span>
          <span>{realtime?.crowding.level ?? "loading"}</span>
        </div>
      </div>

      <div className="mf-prompt">
        <div className="mf-prompt-header">
          <FileText size={18} />
          <span>Policy seed</span>
        </div>
        <textarea value={`${active.name}\n${active.objective}`} readOnly />
        <div className="mf-prompt-actions">
          <select
            value={active.id}
            onChange={(event) => {
              const next = scenarios.find((scenario) => scenario.id === event.target.value);
              if (next) setActive(next);
            }}
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
          <label className="mf-core-toggle">
            <input
              type="checkbox"
              checked={executeCore}
              onChange={(event) => setExecuteCore(event.target.checked)}
            />
            <span>Core run</span>
          </label>
          <button onClick={onRun} disabled={isRunning}>
            <Play size={18} />
            {isRunning ? "Running agents" : "Start Simulation"}
          </button>
        </div>
      </div>

      <div className="mf-metrics">
        {[
          ["Pressure", signals.pressure, palette.seoulBlue],
          ["Acceptance", signals.acceptance, palette.seoulGreen],
          ["Conflict", signals.risk, palette.dancheongRed],
          ["Confidence", signals.confidence, palette.gold]
        ].map(([label, value, color]) => (
          <div className="mf-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <i style={{ width: `${value}%`, background: color }} />
          </div>
        ))}
      </div>

      <div className="mf-run-card">
        <div>
          <span className="mf-eyebrow">Current run</span>
          <strong>{runResult ? runResult.verdict.headline : "No execution yet"}</strong>
          <p>
            {runResult
              ? runResult.verdict.summary
              : "시뮬레이션을 실행하면 Run ID, verdict, 시민 반응 점수, 보완 권고가 생성됩니다."}
          </p>
        </div>
        <div className="mf-run-meta">
          <span>{runResult?.runId ?? "pending"}</span>
          <span>{runResult?.engine ?? "ready"}</span>
          <span>{coreState ? `core ${coreState.runner_status ?? "unknown"}` : "artifact mode"}</span>
        </div>
      </div>
    </section>
  );
}

function Pipeline({ runResult }: { runResult: SimulationRunResult | null }) {
  const steps = [
    ["01", "Seed", "정책 문서와 도시 상태"],
    ["02", "Graph", "영향 경로와 이해관계자"],
    ["03", "Agents", "서울형 시민 페르소나"],
    ["04", "Report", "verdict와 보완 권고"]
  ];
  const artifacts = runResult?.mirofish?.data?.artifacts;

  return (
    <section className="mf-pipeline">
      {steps.map((step, index) => (
        <div className="mf-step" key={step[0]}>
          <span>{step[0]}</span>
          <strong>{step[1]}</strong>
          <p>{step[2]}</p>
          {index < steps.length - 1 ? <ArrowRight size={16} /> : null}
        </div>
      ))}
      <div className="mf-agent-counts">
        <div>
          <strong>{runResult ? 9 : 0}</strong>
          <span>Agents</span>
        </div>
        <div>
          <strong>{runResult?.mirofish?.data?.core_run_state?.total_rounds ?? (runResult ? 8 : 0)}</strong>
          <span>Rounds</span>
        </div>
        <div>
          <strong>{artifacts ? Object.keys(artifacts).length : runResult ? 1 : 0}</strong>
          <span>Artifacts</span>
        </div>
      </div>
    </section>
  );
}

function CitySignals({ active, realtime }: { active: Scenario; realtime: SeoulRealtimeSnapshot | null }) {
  return (
    <section className="mf-panel">
      <div className="mf-panel-head">
        <Activity size={18} />
        <div>
          <h2>Seoul Signal Layer</h2>
          <p>{active.region} · {active.timeWindow}</p>
        </div>
      </div>
      <div className="mf-signal-list">
        <div>
          <span>Realtime area</span>
          <strong>{realtime?.areaName ?? active.realtimeArea}</strong>
        </div>
        <div>
          <span>Crowding</span>
          <strong>{realtime?.crowding.level ?? "loading"}</strong>
        </div>
        <div>
          <span>Road traffic</span>
          <strong>{realtime?.mobility.roadTrafficLevel ?? "loading"}</strong>
        </div>
        <div>
          <span>Weather</span>
          <strong>{realtime?.weather.temperatureC ?? "-"}°C</strong>
        </div>
      </div>
    </section>
  );
}

function ReactionChart({ active, runResult }: { active: Scenario; runResult: SimulationRunResult | null }) {
  const data = useMemo(() => makeRiver(active, runResult), [active, runResult]);

  return (
    <section className="mf-panel mf-chart-panel">
      <div className="mf-panel-head">
        <Radar size={18} />
        <div>
          <h2>Reaction Evolution</h2>
          <p>agent stance over simulation rounds</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#8ca0b3", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8ca0b3", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#071927", border: "1px solid #20435f", borderRadius: 6 }} />
          <Area type="monotone" dataKey="support" stackId="1" stroke={palette.seoulGreen} fill="rgba(46,133,60,0.45)" name="support" />
          <Area type="monotone" dataKey="concern" stackId="1" stroke={palette.gold} fill="rgba(254,156,0,0.36)" name="concern" />
          <Area type="monotone" dataKey="opposition" stackId="1" stroke={palette.dancheongRed} fill="rgba(174,25,50,0.42)" name="opposition" />
          <Area type="monotone" dataKey="neutral" stackId="1" stroke={palette.seoulBlue} fill="rgba(0,121,188,0.34)" name="neutral" />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}

function ReportPreview({ active, runResult }: { active: Scenario; runResult: SimulationRunResult | null }) {
  const coreState = runResult?.mirofish?.data?.core_run_state;

  return (
    <section className="mf-report">
      <div className="mf-panel-head">
        <ShieldCheck size={18} />
        <div>
          <h2>Policy Verdict</h2>
          <p>{runResult ? runResult.verdict.grade : "structured output preview"}</p>
        </div>
      </div>
      <div className="mf-report-grid">
        <article>
          <Landmark size={17} />
          <strong>Expected impact</strong>
          <p>{active.effect}</p>
        </article>
        <article>
          <Users size={17} />
          <strong>Stakeholder risk</strong>
          <p>
            {runResult
              ? `support ${runResult.reaction.support}, concern ${runResult.reaction.concern}, opposition ${runResult.reaction.opposition}`
              : active.sideEffect}
          </p>
        </article>
        <article>
          <GitBranch size={17} />
          <strong>Mitigation path</strong>
          <p>{runResult?.verdict.mitigation ?? active.mitigation}</p>
        </article>
        <article>
          <Database size={17} />
          <strong>MiroFish output</strong>
          <p>
            {runResult?.mirofish?.success
              ? `seed ${runResult.runId}, ${coreState ? `core ${coreState.runner_status}` : "artifact generated"}`
              : active.evidence}
          </p>
        </article>
      </div>
    </section>
  );
}

export default function SpdmRedesign() {
  const [active, setActive] = useState<Scenario>(scenarios[0]);
  const [realtime, setRealtime] = useState<SeoulRealtimeSnapshot | null>(null);
  const [runResult, setRunResult] = useState<SimulationRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executeCore, setExecuteCore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setRealtime(null);
    setRunResult(null);

    fetch(`/api/seoul/realtime?area=${encodeURIComponent(active.realtimeArea)}`, {
      signal: controller.signal
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((snapshot: SeoulRealtimeSnapshot | null) => {
        if (snapshot) setRealtime(snapshot);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [active]);

  async function runSimulation() {
    setIsRunning(true);

    try {
      const response = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: active, realtime, executeCore, maxRounds: 1 })
      });

      if (response.ok) {
        setRunResult((await response.json()) as SimulationRunResult);
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="mf-shell">
      <header className="mf-nav">
        <div className="mf-nav-brand">
          <SeoulMark />
          <div>
            <strong>Seoul Policy Data Map</strong>
            <span>서울 정책 반응 트윈 실행 콘솔</span>
          </div>
        </div>
        <nav>
          <a href="https://www.seoul.go.kr">Seoul</a>
          <a href="https://github.com/Cozystone/Seoul-Policy-Data-Map">Source</a>
          <a href="/LICENSE.txt">License</a>
          <a href="/NOTICE.md">Notice</a>
        </nav>
      </header>

      <div className="mf-layout">
        <div className="mf-main">
          <ScenarioConsole
            active={active}
            setActive={setActive}
            realtime={realtime}
            runResult={runResult}
            isRunning={isRunning}
            executeCore={executeCore}
            setExecuteCore={setExecuteCore}
            onRun={runSimulation}
          />
          <Pipeline runResult={runResult} />
          <ReactionChart active={active} runResult={runResult} />
        </div>
        <aside className="mf-side">
          <CitySignals active={active} realtime={realtime} />
          <ReportPreview active={active} runResult={runResult} />
        </aside>
      </div>
    </main>
  );
}
