"use client";

import { useState, useCallback, useRef } from "react";
import type { ToolResult, PADecision, Scenario } from "@/lib/types";
import { SCENARIOS, TOOLS, CACHE_HIT_MS } from "@/lib/constants";
import styles from "./PALatencyLab.module.css";

/* ─────────────────────────── helpers ─────────────────────────── */

function randomLatency(base: number) {
  return Math.round(base + (Math.random() - 0.5) * 150);
}

async function fetchDecision(scenario: Scenario, toolResults: ToolResult[]): Promise<PADecision> {
  const res = await fetch("/api/pa-decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario, toolResults }),
  });
  return res.json();
}

/* ─────────────────────────── sub-components ──────────────────── */

function ToolRow({
  toolId,
  label,
  initials,
  color,
  bg,
  completed,
  running,
}: {
  toolId: string;
  label: string;
  initials: string;
  color: string;
  bg: string;
  completed: ToolResult[];
  running: boolean;
}) {
  const result = completed.find((r) => r.id === toolId);

  return (
    <div className={styles.toolRow}>
      <div className={styles.toolAvatar} style={{ background: bg, color }}>
        {initials}
      </div>
      <span className={styles.toolLabel}>{label}</span>
      <div className={styles.toolBar}>
        {result && <div className={styles.toolBarFill} style={{ background: color }} />}
      </div>
      <span className={`${styles.toolLatency} ${styles.mono}`}>
        {result ? `${result.latency}ms` : running ? "···" : "—"}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "default" | "success" | "danger" | "info";
}) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={`${styles.metricValue} ${styles.mono} ${styles[`text_${variant}`]}`}>
        {value}
        <span className={styles.metricUnit}>ms</span>
      </div>
    </div>
  );
}

/* ─────────────────────────── main component ──────────────────── */

export default function PALatencyLab() {
  const [selectedId, setSelectedId]     = useState(0);
  const [phase, setPhase]               = useState<"idle" | "running" | "done">("idle");
  const [seqDone, setSeqDone]           = useState<ToolResult[]>([]);
  const [parDone, setParDone]           = useState<ToolResult[]>([]);
  const [seqTotal, setSeqTotal]         = useState<number | null>(null);
  const [parTotal, setParTotal]         = useState<number | null>(null);
  const [llmDecision, setLlmDecision]   = useState<PADecision | null>(null);
  const [llmMs, setLlmMs]               = useState<number | null>(null);
  const [cachePhase, setCachePhase]     = useState<"checking" | "hit" | null>(null);

  const prevSel = useRef<number | null>(null);

  const handleRun = useCallback(async () => {
    // Second click on same scenario → demo the cache
    if (phase === "done" && prevSel.current === selectedId) {
      setCachePhase("checking");
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 60));
      setCachePhase("hit");
      return;
    }

    prevSel.current = selectedId;
    setCachePhase(null);
    setPhase("running");
    setSeqDone([]); setParDone([]);
    setSeqTotal(null); setParTotal(null);
    setLlmDecision(null); setLlmMs(null);

    const scenario = SCENARIOS[selectedId];
    let seqAcc: ToolResult[] = [];
    let parAcc: ToolResult[] = [];

    const seqStart = performance.now();
    const parStart = performance.now();

    const [seqMs, parMs] = await Promise.all([
      // Sequential: each tool waits for the previous
      (async () => {
        for (const t of TOOLS) {
          const ms = randomLatency(t.baseLatency);
          await new Promise((r) => setTimeout(r, ms));
          seqAcc = [...seqAcc, { id: t.id, latency: ms }];
          setSeqDone([...seqAcc]);
        }
        return Math.round(performance.now() - seqStart);
      })(),

      // Parallel: all tools fire simultaneously
      (async () => {
        await Promise.all(
          TOOLS.map(async (t) => {
            const ms = randomLatency(t.baseLatency);
            await new Promise((r) => setTimeout(r, ms));
            parAcc = [...parAcc, { id: t.id, latency: ms }];
            setParDone([...parAcc]);
          })
        );
        return Math.round(performance.now() - parStart);
      })(),
    ]);

    setSeqTotal(seqMs);
    setParTotal(parMs);

    const llmStart = performance.now();
    const decision = await fetchDecision(scenario, parAcc);
    setLlmMs(Math.round(performance.now() - llmStart));
    setLlmDecision(decision);
    setPhase("done");
  }, [selectedId, phase]);

  const sc       = SCENARIOS[selectedId];
  const running  = phase === "running";
  const done     = phase === "done";
  const e2eSeq   = seqTotal && llmMs ? seqTotal + llmMs : null;
  const e2ePar   = parTotal && llmMs ? parTotal + llmMs : null;

  return (
    <div className={styles.lab}>

      {/* header */}
      <div className={styles.header}>
        <h1 className={styles.title}>PA latency lab</h1>
        <p className={styles.subtitle}>
          Prior authorization · sequential vs parallel tool execution · semantic cache
        </p>
      </div>

      {/* scenario picker */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Request scenario</div>
        <div className={styles.scenarioRow}>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              className={`${styles.scenarioBtn} ${selectedId === s.id ? styles.scenarioBtnActive : ""}`}
              onClick={() => { setSelectedId(s.id); setPhase("idle"); setCachePhase(null); }}
            >
              {s.drug.split(" (")[0]}
            </button>
          ))}
        </div>
        <div className={`${styles.scenarioMeta} ${styles.mono}`}>
          {sc.condition} · {sc.icd} · {sc.plan}
        </div>
      </div>

      {/* run button */}
      <div className={styles.runRow}>
        <button
          className={styles.runBtn}
          onClick={handleRun}
          disabled={running || cachePhase === "checking"}
        >
          {running
            ? "Running analysis…"
            : cachePhase === "checking"
            ? "Checking cache…"
            : done
            ? "Run same request again"
            : "Run analysis"}
        </button>
        {done && !cachePhase && (
          <span className={styles.hint}>Click again to trigger semantic cache</span>
        )}
      </div>

      {/* cache hit banner */}
      {cachePhase === "hit" && e2eSeq && (
        <div className={`${styles.banner} ${styles.bannerSuccess}`}>
          <div className={styles.bannerTitle}>
            Semantic cache hit — ~{CACHE_HIT_MS}ms
          </div>
          <div className={styles.bannerBody}>
            No tool calls fired. Cached decision served. Saved {e2eSeq - CACHE_HIT_MS}ms vs sequential.
          </div>
          <div className={styles.bannerNote}>
            Capital markets lesson: cache-first design prevented pricing revenue leakage at FX market open. Same discipline here.
          </div>
        </div>
      )}

      {/* execution panels */}
      {(running || (done && !cachePhase)) && (
        <div className={styles.panels}>
          {[
            { label: "Sequential", desc: "tools called one at a time",   data: seqDone, total: seqTotal, hi: false },
            { label: "Parallel",   desc: "all tools fire simultaneously", data: parDone, total: parTotal, hi: true  },
          ].map(({ label, desc, data, total, hi }) => (
            <div key={label} className={`${styles.panel} ${hi ? styles.panelHighlight : ""}`}>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelTitle}>{label}</div>
                  <div className={styles.panelDesc}>{desc}</div>
                </div>
                {hi && <span className={styles.badge}>recommended</span>}
              </div>

              {TOOLS.map((t) => {
                const dark = typeof window !== "undefined" &&
                  window.matchMedia("(prefers-color-scheme: dark)").matches;
                return (
                  <ToolRow
                    key={t.id}
                    toolId={t.id}
                    label={t.label}
                    initials={t.initials}
                    color={dark ? t.darkColor : t.color}
                    bg={dark ? t.darkBg : t.bg}
                    completed={data}
                    running={running}
                  />
                );
              })}

              <div className={styles.panelFooter}>
                <span>Tool calls</span>
                <span className={`${styles.mono} ${total ? (hi ? styles.text_success : styles.text_danger) : styles.text_tertiary}`}>
                  {total ? `${total}ms` : "···"}
                </span>
              </div>
              {total && llmMs && (
                <div className={styles.panelFooter}>
                  <span>+ LLM decision</span>
                  <span className={`${styles.mono} ${styles.text_secondary}`}>+{llmMs}ms</span>
                </div>
              )}
              {total && llmMs && (
                <div className={`${styles.panelFooter} ${styles.panelTotal}`}>
                  <span>End-to-end</span>
                  <span className={`${styles.mono} ${hi ? styles.text_success : styles.text_danger}`}>
                    {total + llmMs}ms
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* summary metrics */}
      {done && e2eSeq && e2ePar && !cachePhase && (
        <div className={styles.metrics}>
          <MetricCard label="Sequential"  value={e2eSeq}                variant="danger"  />
          <MetricCard label="Parallel"    value={e2ePar}                variant="success" />
          <MetricCard label="Time saved"  value={e2eSeq - e2ePar}       variant="default" />
          <MetricCard label="Cache hit"   value={CACHE_HIT_MS}          variant="info"    />
        </div>
      )}

      {/* LLM decision */}
      {llmDecision && !cachePhase && (
        <div className={styles.decisionCard}>
          <div className={styles.decisionMeta}>
            LLM decision · real Claude API call · {llmMs}ms
          </div>
          <div className={styles.decisionTop}>
            <span className={`${styles.decisionBadge} ${styles[`decision_${llmDecision.decision}`]}`}>
              {llmDecision.decision}
            </span>
            <span className={`${styles.mono} ${styles.text_tertiary}`} style={{ fontSize: 12 }}>
              {Math.round((llmDecision.confidence ?? 0.91) * 100)}% confidence
            </span>
          </div>
          <p className={styles.decisionRationale}>{llmDecision.rationale}</p>
          <div className={styles.factorRow}>
            {(llmDecision.factors ?? []).map((f, i) => (
              <span key={i} className={styles.factor}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* latency bars */}
      {done && e2eSeq && e2ePar && !cachePhase && (
        <div className={styles.barCard}>
          <div className={styles.sectionLabel} style={{ marginBottom: 12 }}>Latency comparison</div>
          {[
            { label: "Sequential + LLM", val: e2eSeq,      cls: styles.text_danger,  barCls: styles.barDanger  },
            { label: "Parallel + LLM",   val: e2ePar,      cls: styles.text_success, barCls: styles.barSuccess },
            { label: "Semantic cache",   val: CACHE_HIT_MS, cls: styles.text_info,   barCls: styles.barInfo    },
          ].map(({ label, val, cls, barCls }) => (
            <div key={label} className={styles.barRow}>
              <div className={styles.barRowLabel}>
                <span className={styles.text_secondary} style={{ fontSize: 12 }}>{label}</span>
                <span className={`${styles.mono} ${cls}`} style={{ fontSize: 12, fontWeight: 500 }}>{val}ms</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${barCls}`}
                  style={{ width: `${Math.round((val / e2eSeq) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* capital markets insight */}
      {done && !cachePhase && seqTotal && parTotal && (
        <div className={styles.insight}>
          <div className={styles.insightTitle}>The capital markets lesson</div>
          <div className={styles.insightBody}>
            In FX pricing systems, sequential lock-based lookups caused &gt;30% latency spikes at London market open.
            Concurrent data structures and async fan-out fixed it — the same pattern cuts PA tool call time
            from {seqTotal}ms to {parTotal}ms here. The problems are new. The discipline isn&apos;t.
          </div>
        </div>
      )}

      {/* footer */}
      <div className={styles.footer}>
        Built by{" "}
        <a href="https://github.com/neelima156" target="_blank" rel="noreferrer">
          Neelima V
        </a>{" "}
        · Companion to the Medium article{" "}
        <em>What Capital Markets Taught Me About Designing AI Systems Under Latency Constraints</em>
      </div>

    </div>
  );
}
