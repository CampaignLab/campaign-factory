"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CircleAlert, Clock3, FileOutput, ShieldCheck, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FUTURE_MISSIONS, getMissionByType, RUNNABLE_MISSIONS } from "@/lib/missions/catalogue";
import {
  type MissionDefinition,
  type MissionRun,
  type MissionRunSummary,
  type MissionType,
  type ReviewState,
} from "@/lib/missions/types";
import { type Campaign } from "@/lib/pipeline/types";
import { MissionSelector } from "./MissionSelector";
import { AgentTeam, missionIcon } from "./MissionVisuals";
import { HumanDecisionGate, MissionOutput, SpecialistReports } from "./MissionResult";

function runStatusLabel(run: MissionRun | null): string {
  if (!run) return "Ready to run";
  if (run.status === "queued") return "Queued";
  if (run.status === "running") return "Running";
  if (run.status === "partial") return "Partial output";
  if (run.status === "failed") return "Failed, no output";
  return "Output ready";
}

function resultHeadline(run: MissionRunSummary): string {
  const result = run.result;
  if (!result) return run.status === "failed" ? "No output" : "In progress";
  if (result.missionType === "viability_tribunal") return result.verdict.replaceAll("_", " ");
  if (result.missionType === "evidence_audit") return `${result.findings.length} items audited`;
  if (result.missionType === "decision_route_audit") return `${result.orderedRoute.length} route steps`;
  return `${result.precedents.length} precedents`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/London" }).format(new Date(value));
}

function MissionHistory({ mission, runs, selectedRun, onSelect }: {
  mission: MissionDefinition & { type: MissionType };
  runs: MissionRunSummary[];
  selectedRun: MissionRun | null;
  onSelect: (run: MissionRunSummary) => Promise<void>;
}) {
  return (
    <details className="mission-history" open={runs.length > 0 && !selectedRun}>
      <summary><span className="mb-step-number">4</span><span><b>Previous runs</b><small>{runs.length ? `${runs.length} saved run${runs.length === 1 ? "" : "s"}` : "No previous runs"}</small></span></summary>
      {runs.length ? (
        <div className="mission-history-list">
          {runs.map((run) => {
            const href = `/c/${run.campaignId}/missions?mission=${mission.slug}&run=${run.id}`;
            return (
              <a
                aria-current={selectedRun?.id === run.id ? "true" : undefined}
                href={href}
                key={run.id}
                onClick={(event) => { event.preventDefault(); void onSelect(run); }}
              >
                <span><b>{resultHeadline(run)}</b><small>{formatDate(run.createdAt)}</small></span>
                <span className={`mb-run-status ${run.status}`}>{run.status}</span>
              </a>
            );
          })}
        </div>
      ) : <p className="mb-empty">The first completed run will appear here with its event history and human review note.</p>}
    </details>
  );
}

function RunExperience({ mission, run, history, canReview, onReview, onSelectHistory }: {
  mission: MissionDefinition & { type: MissionType };
  run: MissionRun;
  history: MissionRunSummary[];
  canReview: boolean;
  onReview: (state: Exclude<ReviewState, "unreviewed">) => Promise<void>;
  onSelectHistory: (run: MissionRunSummary) => Promise<void>;
}) {
  const outputReady = run.status === "complete" || run.status === "partial";
  return (
    <div className="mission-run" aria-label={`${mission.name} run`}>
      <section className="mission-run-step">
        <header><span className="mb-step-number">1</span><div><h3>Running</h3><p>Specialists work independently before the final reconciliation.</p></div><span className={`mb-run-status ${run.status}`}>{runStatusLabel(run)}</span></header>
        <AgentTeam mission={mission} run={run} />
        <div className="mission-events" aria-live="polite">
          {run.events.map((event) => (
            <div className={`mission-event ${event.kind}`} key={event.id}>
              <span className="event-marker" aria-hidden="true" />
              <div><b>{event.label}</b>{event.detail ? <p>{event.detail}</p> : null}</div>
              <time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time>
            </div>
          ))}
        </div>
      </section>

      <section className="mission-run-step">
        <header><span className="mb-step-number">2</span><div><h3>Mission output</h3><p>The result stays beside the evidence and event history that produced it.</p></div></header>
        {run.status === "queued" || run.status === "running" ? (
          <div className="mb-output-skeleton" aria-label="Mission output is being prepared"><span /><span /><span /></div>
        ) : null}
        {run.status === "failed" ? <p className="mb-error" role="alert"><CircleAlert aria-hidden="true" />{run.error || "The mission stopped before synthesis."}</p> : null}
        {outputReady ? <MissionOutput run={run} /> : null}
        {outputReady ? <SpecialistReports run={run} /> : null}
      </section>

      <section className="mission-run-step">
        <header><span className="mb-step-number">3</span><div><h3>Human decision</h3><p>{mission.humanDecision}</p></div></header>
        {outputReady ? <HumanDecisionGate canReview={canReview} mission={mission} onReview={onReview} run={run} /> : <p className="mb-empty">The review gate opens only when a complete or partial output is available.</p>}
      </section>

      <MissionHistory mission={mission} runs={history} selectedRun={run} onSelect={onSelectHistory} />
    </div>
  );
}

export function MissionBay({ campaign, canLaunch, initialRuns, initialRunByType, initialMissionType }: {
  campaign: Campaign;
  canLaunch: boolean;
  initialRuns: MissionRunSummary[];
  initialRunByType: Partial<Record<MissionType, MissionRun>>;
  initialMissionType: MissionType;
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [selectedRuns, setSelectedRuns] = useState<Partial<Record<MissionType, MissionRun>>>(initialRunByType);
  const [selectedType, setSelectedType] = useState<MissionType>(initialMissionType);
  const [launching, setLaunching] = useState<MissionType | null>(null);
  const [errors, setErrors] = useState<Partial<Record<MissionType, string>>>({});
  const runButtons = useRef<Partial<Record<MissionType, HTMLButtonElement | null>>>({});

  const activeSummary = runs.find((run) => run.status === "queued" || run.status === "running") || null;
  const activeMission = activeSummary ? getMissionByType(activeSummary.missionType) : null;

  const updateUrl = useCallback((type: MissionType, runId?: string) => {
    const mission = getMissionByType(type);
    const url = new URL(window.location.href);
    url.searchParams.set("mission", mission.slug);
    if (runId) url.searchParams.set("run", runId);
    else url.searchParams.delete("run");
    window.history.replaceState({}, "", url);
  }, []);

  const fetchRun = useCallback(async (id: string, updateLocation = false) => {
    const response = await fetch(`/api/missions/${id}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Mission progress could not be loaded.");
    const run = await response.json() as MissionRun;
    setSelectedRuns((current) => ({ ...current, [run.missionType]: run }));
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
    if (updateLocation) {
      setSelectedType(run.missionType);
      updateUrl(run.missionType, run.id);
    }
    return run;
  }, [updateUrl]);

  useEffect(() => {
    if (!activeSummary) return;
    const timer = window.setInterval(() => void fetchRun(activeSummary.id).catch(() => {}), 1_800);
    return () => window.clearInterval(timer);
  }, [activeSummary, fetchRun]);

  function selectMission(type: MissionType) {
    setSelectedType(type);
    updateUrl(type, selectedRuns[type]?.id);
  }

  function openMission(type: MissionType) {
    selectMission(type);
    window.requestAnimationFrame(() => {
      const button = runButtons.current[type];
      if (!button) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      button.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      button.focus({ preventScroll: true });
    });
  }

  async function launch(type: MissionType) {
    if (!canLaunch || launching || activeSummary) return;
    const mission = getMissionByType(type);
    setLaunching(type);
    setErrors((current) => ({ ...current, [type]: undefined }));
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/missions/${mission.slug}`, { method: "POST" });
      const body = await response.json() as { missionRunId?: string; missionType?: MissionType; error?: string };
      if (!response.ok && body.missionRunId) {
        await fetchRun(body.missionRunId, true);
        throw new Error(body.error || "Another mission is already active.");
      }
      if (!response.ok || !body.missionRunId) throw new Error(body.error || `${mission.name} could not be launched.`);
      await fetchRun(body.missionRunId, true);
    } catch (reason) {
      setErrors((current) => ({ ...current, [type]: reason instanceof Error ? reason.message : `${mission.name} could not be launched.` }));
    } finally {
      setLaunching(null);
    }
  }

  async function review(type: MissionType, reviewState: Exclude<ReviewState, "unreviewed">) {
    const run = selectedRuns[type];
    if (!run) return;
    setErrors((current) => ({ ...current, [type]: undefined }));
    const response = await fetch(`/api/missions/${run.id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewState }),
    });
    const body = await response.json() as { error?: string };
    if (!response.ok) {
      setErrors((current) => ({ ...current, [type]: body.error || "The review decision could not be saved." }));
      return;
    }
    await fetchRun(run.id);
  }

  const location = campaign.research?.location;
  const place = campaign.input.location || location?.area || "Place unresolved";
  const decision = campaign.plan?.objective.dm || campaign.research?.decisionMaker?.formal || "Decision route unresolved";
  const historyByType = useMemo(() => Object.fromEntries(RUNNABLE_MISSIONS.map((mission) => [
    mission.type,
    runs.filter((run) => run.missionType === mission.type),
  ])) as Record<MissionType, MissionRunSummary[]>, [runs]);

  return (
    <div className="mission-bay-shell">
      <header className="jhero mb-jhero">
        <Link className="back-link" href={`/c/${campaign.id}`}><ArrowLeft aria-hidden="true" />Back to campaign</Link>
        <div className="eyebrow">Mission Bay</div>
        <h1>{campaign.name}</h1>
        <p className="obj">{place}. Run one bounded investigation at a time, inspect its evidence, then make the political judgement yourself.</p>
      </header>

      <div className="jcontainer">
        <section className="mb-context-pills" aria-label="Campaign context">
          <span><b>Place</b>{place}</span>
          {location?.authority ? <span><b>Authority</b>{location.authority}</span> : null}
          <span><b>Decision target</b>{decision}</span>
          <span><b>Evidence</b>{campaign.sources.length} labelled source{campaign.sources.length === 1 ? "" : "s"}</span>
        </section>

        <MissionSelector onOpen={openMission} onSelect={selectMission} selectedType={selectedType} />

        <div className="mb-runnable" aria-label="Runnable missions">
          {RUNNABLE_MISSIONS.map((mission, index) => {
            const run = selectedRuns[mission.type] || null;
            const history = historyByType[mission.type];
            const Icon = missionIcon(mission);
            const missionIsActive = activeSummary?.missionType === mission.type;
            const launchBlocked = !canLaunch || Boolean(activeSummary) || launching !== null;
            const buttonLabel = !canLaunch
              ? "Owner-only launch"
              : launching === mission.type
                ? "Starting mission…"
                : missionIsActive
                  ? `${mission.shortName} is running`
                  : activeMission
                    ? `${activeMission.shortName} is running`
                    : `Run ${mission.name}`;
            return (
              <section className={`rung mission-rung ${mission.type === selectedType ? "active" : ""}`} id={`mission-${mission.slug}`} key={mission.type}>
                <div className="rung-grid">
                  <aside>
                    <span className="n">0{index + 1}</span>
                    <span className="mb-kicker">{mission.pattern}</span>
                    <h2>{mission.name}</h2>
                    <p className="whatsnew">{mission.question}</p>
                    <span className={`mb-run-status ${run?.status || "ready"}`}>{runStatusLabel(run)}</span>
                    <p className="limit"><ShieldCheck aria-hidden="true" />{mission.boundary}</p>
                  </aside>

                  <div className="rc mission-rung-content">
                    <div className="mb-mission-intro"><Icon aria-hidden="true" /><p>{mission.artefact}</p></div>
                    <dl className="mb-contract-list">
                      <div><dt>Agent team</dt><dd><AgentTeam mission={mission} run={missionIsActive ? run : null} /></dd></div>
                      <div><dt><Wrench aria-hidden="true" />Tools and evidence</dt><dd className="mb-tool-list">{mission.tools.map((tool) => <span key={tool}>{tool}</span>)}</dd></div>
                      <div><dt><FileOutput aria-hidden="true" />Artefact returned</dt><dd>{mission.artefact}</dd></div>
                      <div><dt><Clock3 aria-hidden="true" />Human decision</dt><dd>{mission.humanDecision}</dd></div>
                    </dl>

                    {errors[mission.type] ? <p className="mb-error" role="alert"><CircleAlert aria-hidden="true" />{errors[mission.type]}</p> : null}
                    <button
                      aria-disabled={launchBlocked}
                      className="launch-button"
                      id={`run-${mission.slug}`}
                      onClick={() => void launch(mission.type)}
                      ref={(node) => { runButtons.current[mission.type] = node; }}
                      type="button"
                    >{buttonLabel}<span aria-hidden="true"><ArrowUpRight /></span></button>
                    {!canLaunch ? <p className="owner-note">This shared campaign is read-only. Only the browser session that created it can launch or review missions.</p> : null}
                    {activeMission && !missionIsActive ? <p className="owner-note">Only one mission can be active. This launch unlocks when {activeMission.name} finishes.</p> : null}

                    {run ? (
                      <RunExperience
                        canReview={canLaunch}
                        history={history}
                        mission={mission}
                        onReview={(state) => review(mission.type, state)}
                        onSelectHistory={async (summary) => { await fetchRun(summary.id, true); }}
                        run={run}
                      />
                    ) : <MissionHistory mission={mission} onSelect={async (summary) => { await fetchRun(summary.id, true); }} runs={history} selectedRun={null} />}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <section className="mb-future" aria-labelledby="future-missions-title">
          <header><span className="eyebrow">Prioritised next</span><h2 id="future-missions-title">Future missions</h2><p>Persistent watching starts only after durable scheduling and stop controls exist.</p></header>
          <div>
            {FUTURE_MISSIONS.map((mission) => (
              <details key={mission.slug}>
                <summary><span className="mb-priority">{String(mission.priority).padStart(2, "0")}</span><span><b>{mission.name}</b><small>{mission.question}</small></span><span className={`mb-availability ${mission.availability}`}>{mission.availability}</span></summary>
                <p><b>Returns:</b> {mission.artefact}</p><p><b>Boundary:</b> {mission.boundary}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
