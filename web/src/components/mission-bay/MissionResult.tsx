"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import { type Campaign } from "@/lib/pipeline/types";
import {
  type DecisionRouteItem,
  type EvidenceBasis,
  type MissionCitation,
  type MissionDefinition,
  type MissionRun,
  type ReviewState,
} from "@/lib/missions/types";

const REVIEW_LABEL: Record<ReviewState, string> = {
  unreviewed: "Awaiting human review",
  reviewed: "Reviewed",
  rejected: "Rejected",
  needs_local_knowledge: "Needs local verification",
};

const VERDICT_LABEL = {
  viable: "Viable",
  viable_with_changes: "Viable with changes",
  uncertain: "Uncertain",
  not_currently_viable: "Not currently viable",
};

function Basis({ value }: { value: EvidenceBasis }) {
  return <span className={`basis-pill ${value}`}>{value}</span>;
}

function Citations({ citations }: { citations: MissionCitation[] }) {
  if (!citations.length) return <span className="mb-no-citation">No valid citation</span>;
  return (
    <span className="evidence-refs">
      {citations.map((citation) => (
        <a href={citation.url} key={`${citation.id}-${citation.url}`} rel="noopener noreferrer" target="_blank">
          <span>{citation.id || citation.organisation}</span>
          {citation.date ? <small>{citation.date}</small> : null}
          <ExternalLink aria-hidden="true" />
        </a>
      ))}
    </span>
  );
}

function TextList({ title, items, empty = "None recorded." }: { title: string; items: string[]; empty?: string }) {
  return (
    <section className="result-list">
      <h4>{title}</h4>
      {items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mb-muted">{empty}</p>}
    </section>
  );
}

function ViabilityOutput({ run }: { run: MissionRun }) {
  const result = run.result?.missionType === "viability_tribunal" ? run.result : null;
  if (!result) return null;
  return (
    <div className="mb-result">
      <header className="mb-result-lead">
        <span className="mb-kicker">Tribunal verdict</span>
        <h3>{VERDICT_LABEL[result.verdict]}</h3>
        <p>{result.executiveSummary}</p>
      </header>
      <div className="rationale-list">
        {result.rationale.map((item, index) => (
          <article key={index}><Basis value={item.basis} /><p>{item.point}</p><Citations citations={item.citations} /></article>
        ))}
      </div>
      <div className="result-columns">
        <TextList title="What the examiners agree on" items={result.agreements} />
        <TextList title="Failure conditions" items={result.failureConditions} />
        <TextList title="Changes for review" items={result.recommendedChanges} />
        <TextList title="Local knowledge questions" items={result.localKnowledgeQuestions} />
      </div>
      {result.disagreements.length ? (
        <div className="mb-pastel-callout yellow">
          <h4>Disagreement retained</h4>
          {result.disagreements.map((item, index) => (
            <details key={index}><summary>{item.issue}</summary><ul>{item.positions.map((position) => <li key={position}>{position}</li>)}</ul><p><b>Chair assessment:</b> {item.chairAssessment}</p></details>
          ))}
        </div>
      ) : null}
      <TextList title="Limits of this verdict" items={result.limitations} />
    </div>
  );
}

function EvidenceOutput({ run }: { run: MissionRun }) {
  const result = run.result?.missionType === "evidence_audit" ? run.result : null;
  if (!result) return null;
  const counts = result.findings.reduce<Record<string, number>>((all, finding) => {
    all[finding.status] = (all[finding.status] || 0) + 1;
    return all;
  }, {});
  return (
    <div className="mb-result">
      <header className="mb-result-lead"><span className="mb-kicker">Evidence audit</span><h3>{result.findings.length} claims and lint items inventoried</h3><p>{result.executiveSummary}</p></header>
      <div className="mb-count-strip" aria-label="Evidence audit status counts">
        {Object.entries(counts).map(([status, count]) => <span key={status}><b>{count}</b>{status.replaceAll("_", " ")}</span>)}
      </div>
      <div className="mb-finding-list">
        {result.findings.map((finding) => (
          <details key={finding.itemId}>
            <summary><span className="mb-source-id">{finding.itemId}</span><b>{finding.claim}</b><span className={`mb-finding-status ${finding.status}`}>{finding.status.replaceAll("_", " ")}</span></summary>
            <div className="mb-finding-detail">
              <p>{finding.explanation}</p>
              <p><b>Original label:</b> {finding.originalLabel}</p>
              <p><b>Original evidence:</b> {finding.originalEvidence || "None supplied"}</p>
              <div><Basis value={finding.basis} /><Citations citations={finding.citations} /></div>
            </div>
          </details>
        ))}
      </div>
      <section className="mb-queue">
        <h4>Prioritised verification queue</h4>
        {result.verificationQueue.length ? <ol>{result.verificationQueue.map((item) => <li key={item.itemId}><b>{item.itemId} · {item.priority}</b><span>{item.reason}</span></li>)}</ol> : <p className="mb-muted">No further verification was prioritised.</p>}
      </section>
      <div className="result-columns"><TextList title="Gaps" items={result.gaps} /><TextList title="Limits" items={result.limitations} /></div>
    </div>
  );
}

function RouteItems({ title, items }: { title: string; items: DecisionRouteItem[] }) {
  return (
    <section className="mb-route-group">
      <h4>{title}</h4>
      {items.length ? items.map((item, index) => (
        <article key={`${item.title}-${index}`}>
          <div><Basis value={item.basis} />{item.date ? <time>{item.date}</time> : null}</div>
          <h5>{item.title}</h5><p>{item.detail}</p><Citations citations={item.citations} />
        </article>
      )) : <p className="mb-muted">No supported item returned.</p>}
    </section>
  );
}

function DecisionRouteOutput({ run }: { run: MissionRun }) {
  const result = run.result?.missionType === "decision_route_audit" ? run.result : null;
  if (!result) return null;
  return (
    <div className="mb-result">
      <header className="mb-result-lead"><span className="mb-kicker">Route audit</span><h3>Formal route and live intervention window</h3><p>{result.executiveSummary}</p></header>
      <div className="mb-route-layout">
        <RouteItems title="Formal authority" items={result.formalAuthority} />
        <RouteItems title="Ordered decision route" items={result.orderedRoute} />
        <RouteItems title="Intervention points" items={result.interventionPoints} />
        <RouteItems title="Upcoming meetings" items={result.upcomingMeetings} />
        <RouteItems title="Recent minutes and decisions" items={result.recentMinutesAndDecisions} />
        <RouteItems title="Consultations and deadlines" items={result.consultationsAndDeadlines} />
        <RouteItems title="Conflicting evidence" items={result.conflictingEvidence} />
      </div>
      <section className="mb-provider-ledger">
        <h4>Provider coverage ledger</h4>
        {result.providerCoverage.map((provider) => (
          <div key={`${provider.kind}-${provider.provider}`}><span className={`mb-coverage ${provider.status}`}>{provider.status.replaceAll("_", " ")}</span><b>{provider.provider}</b><p>{provider.detail}</p></div>
        ))}
      </section>
      <div className="result-columns"><TextList title="Unresolved gaps" items={result.unresolvedGaps} /><TextList title="Limits" items={result.limitations} /></div>
    </div>
  );
}

function PrecedentOutput({ run }: { run: MissionRun }) {
  const result = run.result?.missionType === "precedent_review" ? run.result : null;
  if (!result) return null;
  return (
    <div className="mb-result">
      <header className="mb-result-lead"><span className="mb-kicker">Precedent review</span><h3>{result.precedents.length} comparable campaigns</h3><p>{result.executiveSummary}</p></header>
      <div className="mb-precedents">
        {result.precedents.map((precedent, index) => (
          <article key={`${precedent.campaign}-${precedent.location}`}>
            <header><span>0{index + 1}</span><div><h4>{precedent.campaign}</h4><p>{precedent.location} · {precedent.institution}</p></div><span className="mb-quality">{precedent.evidenceQuality} evidence</span></header>
            <p><b>Decision and outcome:</b> {precedent.decisionType}. {precedent.outcome}</p>
            <p><b>Pressure mechanism:</b> {precedent.pressureMechanism} <Basis value={precedent.causalBasis} /></p>
            <div className="result-columns">
              <TextList title="Similarities" items={precedent.similarities} />
              <TextList title="Material differences" items={precedent.materialDifferences} />
              <TextList title="Transferable lessons" items={precedent.transferableLessons} />
              <TextList title="Do not transfer" items={precedent.nonTransferableAssumptions} />
            </div>
            <TextList title="Failures or unintended outcomes" items={precedent.failedOrUnintendedOutcomes} />
            <Citations citations={precedent.citations} />
          </article>
        ))}
      </div>
      <div className="result-columns"><TextList title="Cross-case lessons" items={result.crossCaseLessons} /><TextList title="Local knowledge questions" items={result.localKnowledgeQuestions} /></div>
      <TextList title="Limits" items={result.limitations} />
    </div>
  );
}

export function MissionOutput({ run }: { run: MissionRun }) {
  if (run.result?.missionType === "viability_tribunal") return <ViabilityOutput run={run} />;
  if (run.result?.missionType === "evidence_audit") return <EvidenceOutput run={run} />;
  if (run.result?.missionType === "decision_route_audit") return <DecisionRouteOutput run={run} />;
  if (run.result?.missionType === "precedent_review") return <PrecedentOutput run={run} />;
  return null;
}

export function SpecialistReports({ run }: { run: MissionRun }) {
  if (!run.workerReports.length) return null;
  return (
    <details className="worker-reports">
      <summary>Specialist reports <span>{run.workerReports.length}</span></summary>
      <div>
        {run.workerReports.map((report) => (
          <details key={report.agentKey}>
            <summary><b>{report.agentName}</b><span>{report.assessment}</span></summary>
            <p>{report.summary}</p>
            {report.findings.map((finding, index) => (
              <article key={index}><Basis value={finding.basis} /><div><p>{finding.finding}</p><small>{finding.implication}</small></div><Citations citations={finding.citations} /></article>
            ))}
          </details>
        ))}
      </div>
    </details>
  );
}

export function HumanDecisionGate({ mission, run, canReview, onReview }: {
  mission: MissionDefinition;
  run: MissionRun;
  canReview: boolean;
  onReview: (state: Exclude<ReviewState, "unreviewed">) => Promise<void>;
}) {
  return (
    <div className="mission-gate">
      <div className="stagegate"><ShieldCheck aria-hidden="true" /><span><b>{REVIEW_LABEL[run.reviewState]}</b>The campaign has not been changed. This review is an audit note only.</span></div>
      {canReview ? (
        <div className="review-actions">
          <button onClick={() => void onReview("reviewed")} type="button">{mission.reviewActions[0]}</button>
          <button className="secondary" onClick={() => void onReview("needs_local_knowledge")} type="button">{mission.reviewActions[1]}</button>
          <button className="quiet" onClick={() => void onReview("rejected")} type="button">{mission.reviewActions[2]}</button>
        </div>
      ) : <p className="mb-muted">Only the campaign owner can record this human decision.</p>}
    </div>
  );
}

export function CampaignSourceContext({ campaign }: { campaign: Campaign }) {
  return <span className="mb-source-context">{campaign.sources.length} labelled source{campaign.sources.length === 1 ? "" : "s"}</span>;
}
