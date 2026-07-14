"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MISSION_CATALOGUE, PURPOSES, VIABILITY_TRIBUNAL, availabilityLabel } from "@/lib/missions/catalogue";
import {
  type MissionDefinition,
  type MissionRun,
  type MissionRunSummary,
  type ReviewState,
  type ViabilityTribunalResult,
} from "@/lib/missions/types";
import { type Campaign } from "@/lib/pipeline/types";

const WORKER_KEYS = [
  ["advocate", "Campaign Advocate"],
  ["falsifier", "Campaign Falsifier"],
  ["formal-route", "Formal Route Examiner"],
  ["capacity", "Capacity Examiner"],
] as const;

const VERDICT_LABEL: Record<ViabilityTribunalResult["verdict"], string> = {
  viable: "Viable",
  viable_with_changes: "Viable with changes",
  uncertain: "Uncertain",
  not_currently_viable: "Not currently viable",
};

const REVIEW_LABEL: Record<ReviewState, string> = {
  unreviewed: "Awaiting human review",
  reviewed: "Marked reviewed",
  rejected: "Findings rejected",
  needs_local_knowledge: "Needs local knowledge",
};

function MissionStatus({ run }: { run: MissionRun | null }) {
  if (!run) return <span className="mb-status available">Available now</span>;
  if (run.status === "queued") return <span className="mb-status running">Queued</span>;
  if (run.status === "running") return <span className="mb-status running">Running live</span>;
  if (run.status === "failed") return <span className="mb-status failed">Stopped without verdict</span>;
  if (run.status === "partial") return <span className="mb-status partial">Partial verdict</span>;
  return <span className="mb-status complete">Verdict ready</span>;
}

function agentState(run: MissionRun | null, key: string): "waiting" | "running" | "done" | "failed" {
  if (!run) return "waiting";
  const relevant = run.events.filter((event) => event.agentKey === key);
  if (relevant.some((event) => event.kind === "agent_completed" || (key === "chair" && event.kind === "mission_completed"))) return "done";
  if (relevant.some((event) => event.kind === "agent_failed" || (key === "chair" && event.kind === "mission_failed"))) return "failed";
  if (relevant.some((event) => event.kind === "agent_started" || (key === "chair" && event.kind === "synthesis_started"))) return "running";
  return "waiting";
}

function FactoryGlyph({ pattern }: { pattern: MissionDefinition["pattern"] }) {
  const mark = pattern === "Tribunal" ? "⇉◇" : pattern === "Parallel Team" ? "⇉●" : pattern === "Persistent Loop" ? "↻●" : "↻◇";
  return <span className="factory-glyph" aria-hidden="true">{mark}</span>;
}

function MissionRow({ mission }: { mission: MissionDefinition }) {
  return (
    <details className="mission-row">
      <summary>
        <span className="mission-row-main">
          <FactoryGlyph pattern={mission.pattern} />
          <span><b>{mission.name}</b><small>{mission.question}</small></span>
        </span>
        <span className={`mb-status ${mission.availability}`}>{availabilityLabel(mission.availability)}</span>
      </summary>
      <div className="mission-row-detail">
        <div><span className="mb-kicker">Factory pattern</span><b>{mission.pattern}</b></div>
        <div><span className="mb-kicker">Coordinated team</span><p>{mission.team.join(" · ")}</p></div>
        <div><span className="mb-kicker">Returns</span><p>{mission.artefact}</p></div>
        <div><span className="mb-kicker">Human decision</span><p>{mission.humanDecision}</p></div>
        <p className="mission-boundary"><b>Boundary:</b> {mission.boundary}</p>
      </div>
    </details>
  );
}

function EvidenceRefs({ refs, campaign }: { refs: string[]; campaign: Campaign }) {
  if (!refs?.length) return <span className="basis-pill unknown">No direct source cited</span>;
  return (
    <span className="evidence-refs">
      {refs.map((ref) => {
        const source = campaign.sources[Number(ref.slice(1)) - 1];
        return source?.url?.startsWith("http") ? (
          <a key={ref} href={source.url} target="_blank" rel="noopener noreferrer" title={source.sourceTitle}>{ref}</a>
        ) : <span key={ref}>{ref}</span>;
      })}
    </span>
  );
}

function ResultList({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  return (
    <section className="result-list">
      <h3>{title}</h3>
      {items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mb-muted">{empty || "None recorded."}</p>}
    </section>
  );
}

function TribunalResult({ run, campaign, canLaunch, onReview }: {
  run: MissionRun;
  campaign: Campaign;
  canLaunch: boolean;
  onReview: (state: Exclude<ReviewState, "unreviewed">) => Promise<void>;
}) {
  const result = run.result;
  if (!result) return null;
  return (
    <section className="tribunal-result" aria-labelledby="tribunal-verdict">
      <header className="verdict-head">
        <div>
          <span className="mb-kicker">Tribunal verdict</span>
          <h2 id="tribunal-verdict">{VERDICT_LABEL[result.verdict]}</h2>
        </div>
        <span className={`review-state ${run.reviewState}`}>{REVIEW_LABEL[run.reviewState]}</span>
      </header>
      <p className="verdict-summary">{result.executiveSummary}</p>

      <div className="rationale-list">
        {result.rationale.map((item, index) => (
          <article key={index}>
            <span className={`basis-pill ${item.basis}`}>{item.basis}</span>
            <p>{item.point}</p>
            <EvidenceRefs refs={item.evidenceRefs} campaign={campaign} />
          </article>
        ))}
      </div>

      <div className="result-columns">
        <ResultList title="What the examiners agree on" items={result.agreements} />
        <ResultList title="What could make the campaign fail" items={result.failureConditions} />
        <ResultList title="Recommended changes for review" items={result.recommendedChanges} empty="No changes recommended." />
        <ResultList title="Questions for local knowledge" items={result.localKnowledgeQuestions} empty="No local questions recorded." />
      </div>

      {result.disagreements.length ? (
        <section className="disagreements">
          <span className="mb-kicker">Disagreement retained</span>
          <h3>The chair did not flatten these differences</h3>
          {result.disagreements.map((item, index) => (
            <details key={index}>
              <summary>{item.issue}</summary>
              <ul>{item.positions.map((position, itemIndex) => <li key={itemIndex}>{position}</li>)}</ul>
              <p><b>Chair&apos;s assessment:</b> {item.chairAssessment}</p>
            </details>
          ))}
        </section>
      ) : null}

      <div className="worker-reports">
        <span className="mb-kicker">Independent examinations</span>
        {run.workerReports.map((report) => (
          <details key={report.agentKey}>
            <summary><b>{report.agentName}</b><span>{report.assessment.replaceAll("_", " ")}</span></summary>
            <p>{report.summary}</p>
            {report.findings.map((finding, index) => (
              <div className="worker-finding" key={index}>
                <span className={`basis-pill ${finding.basis}`}>{finding.basis}</span>
                <p>{finding.finding}</p>
                <EvidenceRefs refs={finding.evidenceRefs} campaign={campaign} />
              </div>
            ))}
          </details>
        ))}
      </div>

      {result.limitations.length ? <ResultList title="Limits of this verdict" items={result.limitations} /> : null}

      <footer className="human-gate">
        <div>
          <span className="mb-kicker">Human approval gate</span>
          <h3>The campaign has not been changed</h3>
          <p>Record what you make of the tribunal. This decision is an audit note, not an automatic edit.</p>
        </div>
        {canLaunch ? (
          <div className="review-actions">
            <button onClick={() => void onReview("reviewed")}>Mark reviewed</button>
            <button onClick={() => void onReview("needs_local_knowledge")}>Needs local knowledge</button>
            <button className="quiet" onClick={() => void onReview("rejected")}>Reject findings</button>
          </div>
        ) : <p className="mb-muted">Only the campaign owner can record the review decision.</p>}
      </footer>
    </section>
  );
}

export function MissionBay({ campaign, canLaunch, initialRuns, initialRun }: {
  campaign: Campaign;
  canLaunch: boolean;
  initialRuns: MissionRunSummary[];
  initialRun: MissionRun | null;
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [selectedRun, setSelectedRun] = useState<MissionRun | null>(initialRun);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = selectedRun?.status === "queued" || selectedRun?.status === "running";
  const newestRunId = runs[0]?.id;

  const fetchRun = useCallback(async (id: string) => {
    const response = await fetch(`/api/missions/${id}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Mission progress could not be loaded.");
    const run = await response.json() as MissionRun;
    setSelectedRun(run);
    setRuns((current) => {
      const summary: MissionRunSummary = {
        id: run.id,
        campaignId: run.campaignId,
        missionType: run.missionType,
        status: run.status,
        result: run.result,
        error: run.error,
        reviewState: run.reviewState,
        createdAt: run.createdAt,
        completedAt: run.completedAt,
      };
      return [summary, ...current.filter((item) => item.id !== run.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }, []);

  useEffect(() => {
    if (!isActive || !selectedRun) return;
    const id = window.setInterval(() => void fetchRun(selectedRun.id).catch(() => {}), 1800);
    return () => window.clearInterval(id);
  }, [fetchRun, isActive, selectedRun]);

  async function launch() {
    setLaunching(true);
    setError(null);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/missions/viability-tribunal`, { method: "POST" });
      const body = await response.json() as { missionRunId?: string; error?: string };
      if (!response.ok && body.missionRunId) {
        await fetchRun(body.missionRunId);
        return;
      }
      if (!response.ok || !body.missionRunId) throw new Error(body.error || "The tribunal could not be launched.");
      await fetchRun(body.missionRunId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The tribunal could not be launched.");
    } finally {
      setLaunching(false);
    }
  }

  async function review(reviewState: Exclude<ReviewState, "unreviewed">) {
    if (!selectedRun) return;
    setError(null);
    const response = await fetch(`/api/missions/${selectedRun.id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewState }),
    });
    const body = await response.json() as { error?: string };
    if (!response.ok) {
      setError(body.error || "The review decision could not be saved.");
      return;
    }
    await fetchRun(selectedRun.id);
  }

  const location = campaign.research?.location;
  const place = campaign.input.location || location?.area || "Not resolved";
  const decision = campaign.plan?.objective.dm || campaign.research?.decisionMaker?.formal || "Decision route unresolved";
  const challengeMissions = useMemo(() => MISSION_CATALOGUE.filter((mission) => mission.purpose === "challenge" && mission.slug !== VIABILITY_TRIBUNAL.slug), []);

  return (
    <div className="mission-bay-shell">
      <header className="mission-bay-hero">
        <Link className="back-link" href={`/c/${campaign.id}`}>← Back to campaign</Link>
        <div className="mb-eyebrow">Mission Bay · one hyperlocal campaign</div>
        <h1>What should the factory do <span>next?</span></h1>
        <p>Choose a bounded mission to challenge, investigate, watch or prepare this campaign. Every result returns to a person for judgement.</p>
      </header>

      <section className="campaign-context" aria-label="Campaign context">
        <div><span>Campaign</span><b>{campaign.name}</b></div>
        <div><span>Place</span><b>{place}</b><small>{location?.authority}</small></div>
        <div><span>Decision target</span><b>{decision}</b></div>
        <div><span>Evidence register</span><b>{campaign.sources.length} labelled source{campaign.sources.length === 1 ? "" : "s"}</b></div>
      </section>

      <aside className="factory-caption">
        <FactoryGlyph pattern="Tribunal" />
        <p>Mission Bay visualises how an agent factory divides, checks and recombines campaign work. These are bounded software processes, not autonomous digital employees. Every result returns to a person for review.</p>
        <Link href="/how#mission-bay">How the factory works</Link>
      </aside>

      <section className="featured-bay" aria-labelledby="viability-title">
        <div className="featured-copy">
          <div className="featured-meta"><MissionStatus run={selectedRun} /><span className="pattern-label"><FactoryGlyph pattern="Tribunal" /> Tribunal</span></div>
          <span className="mb-kicker">Challenge mission 01</span>
          <h2 id="viability-title">Viability Tribunal</h2>
          <p className="featured-question">Can this campaign actually win?</p>
          <p>Four examiners test the campaign independently. A fifth agent adjudicates their evidence and preserves disagreement instead of producing an easy consensus.</p>
          <div className="mission-contract">
            <p><b>Returns:</b> {VIABILITY_TRIBUNAL.artefact}</p>
            <p><b>Boundary:</b> {VIABILITY_TRIBUNAL.boundary}</p>
          </div>
          {error ? <p className="mb-error" role="alert">{error}</p> : null}
          {canLaunch ? (
            <button className="launch-button" disabled={launching || isActive} onClick={() => void launch()}>
              {launching ? "Securing campaign snapshot…" : isActive ? "Tribunal in progress" : selectedRun?.result ? "Run tribunal again" : "Send the tribunal"}
            </button>
          ) : (
            <p className="owner-note">This campaign is viewable by link. Only the browser session that created it can launch a mission.</p>
          )}
        </div>

        <div className="factory-stage" aria-label="Viability Tribunal agent flow">
          <div className="factory-workers">
            {WORKER_KEYS.map(([key, name]) => {
              const state = agentState(selectedRun, key);
              return <div className={`factory-worker ${state}`} key={key}><i aria-hidden="true" /><span>{name}</span><small>{state}</small></div>;
            })}
          </div>
          <div className="factory-join" aria-hidden="true"><span /><b>independent reports</b><span /></div>
          <div className={`factory-chair ${agentState(selectedRun, "chair")}`}>
            <i aria-hidden="true" />
            <div><span>Tribunal Chair</span><small>{agentState(selectedRun, "chair")}</small></div>
          </div>
          <div className="human-return"><span>↓</span><b>Human review</b><small>No campaign changes are applied</small></div>
        </div>
      </section>

      {selectedRun ? (
        <section className="mission-live" aria-label="Mission run">
          <div className="mission-live-head">
            <div><span className="mb-kicker">Real mission run</span><h2>{selectedRun.result ? "A verdict, with its working" : "The tribunal is working"}</h2></div>
            <span className="snapshot-hash">Snapshot {selectedRun.snapshotHash.slice(0, 12)}</span>
          </div>
          <div className="mission-events" aria-live="polite">
            {selectedRun.events.map((event) => (
              <div className={`mission-event ${event.kind}`} key={event.id}>
                <i aria-hidden="true" />
                <div><b>{event.label}</b>{event.detail ? <p>{event.detail}</p> : null}</div>
                <time>{new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
              </div>
            ))}
          </div>
          {selectedRun.status === "failed" ? <p className="mb-error" role="alert">{selectedRun.error}</p> : null}
          <TribunalResult run={selectedRun} campaign={campaign} canLaunch={canLaunch} onReview={review} />
        </section>
      ) : null}

      <section className="catalogue" aria-labelledby="catalogue-title">
        <header>
          <span className="mb-kicker">The mission catalogue</span>
          <h2 id="catalogue-title">One factory, four campaign purposes</h2>
          <p>Only the Viability Tribunal runs in this prototype. The remaining missions show the bounded capabilities this factory could add next.</p>
        </header>
        {PURPOSES.map((purpose, index) => {
          const missions = purpose.id === "challenge" ? challengeMissions : MISSION_CATALOGUE.filter((mission) => mission.purpose === purpose.id);
          return (
            <section className="purpose-band" key={purpose.id}>
              <header><span>0{index + 1}</span><div><h3>{purpose.label}</h3><p>{purpose.description}</p></div></header>
              <div>{missions.map((mission) => <MissionRow mission={mission} key={mission.slug} />)}</div>
            </section>
          );
        })}
      </section>

      {runs.length ? (
        <section className="mission-history" aria-labelledby="history-title">
          <span className="mb-kicker">Audit trail</span>
          <h2 id="history-title">Previous tribunal runs</h2>
          <div>
            {runs.map((run, index) => (
              <button className={selectedRun?.id === run.id ? "selected" : ""} onClick={() => void fetchRun(run.id)} key={run.id}>
                <span>Run {runs.length - index}</span>
                <b>{run.result ? VERDICT_LABEL[run.result.verdict] : run.status === "failed" ? "No verdict" : "In progress"}</b>
                <small>{new Date(run.createdAt).toLocaleString()} · {REVIEW_LABEL[run.reviewState]}</small>
              </button>
            ))}
          </div>
          {newestRunId && selectedRun?.id !== newestRunId ? <button className="return-latest" onClick={() => void fetchRun(newestRunId)}>Return to latest run</button> : null}
        </section>
      ) : null}
    </div>
  );
}
