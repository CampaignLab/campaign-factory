"use client";

// One rung of the Campaign Brief, in the ORIGINAL legacy Journey anatomy
// (original-brief redesign, 15 Jul 2026): sticky aside on the left with the
// number badge, the serif-italic title, a one-paragraph plain-English
// explainer, and a small bordered principle note — NO agent chip, no status
// chips (user decision; agent attribution lives in the Agent Build Bar).
// Right column: Decision point cards inline above the bespoke section content,
// a quiet skeleton until content lands, and an optional footer (the step-10
// Document Library). Reveal + scrollspy are driven by the parent observer via
// data-stage / data-on / the .active class, exactly like the legacy Journey.
// The page NEVER auto-jumps between sections.

import { type ReactNode } from "react";
import type { JudgementVM, SectionVM } from "@/lib/factory/client";
import type { JudgementAnswerRequest } from "@/lib/factory/contracts";
import type { CompiledDocument } from "@/lib/factory/documents";
import { YourJudgementCard } from "@/components/factory/judgement/YourJudgementCard";
import { SectionContent, type EvidenceExtras } from "./SectionContent";
import type { RungCopy } from "./stepCopy";

// First slice of a compiled document body shown inline; the remainder lives in
// a native <details> so a 10k-char pack never dumps uncollapsed (FEATURE B).
const DRAFT_HEAD = 800;

/** One compiled material rendered in the legacy draftblock anatomy (db-head =
 *  document title, db-body = the text), long bodies truncated with an expander. */
function MaterialDraft({ title, body }: { title: string; body: string }) {
  const head = body.slice(0, DRAFT_HEAD);
  const rest = body.slice(DRAFT_HEAD);
  return (
    <div className="draftblock">
      <div className="db-head">
        <b>{title}</b>
      </div>
      <div className="db-body">
        <p>
          {head}
          {rest ? "…" : null}
        </p>
        {rest ? (
          <details className="fa-material-more">
            <summary>Read the rest</summary>
            <p>{rest}</p>
          </details>
        ) : null}
      </div>
    </div>
  );
}

export function BriefSection({
  section,
  copy,
  judgements,
  onAnswer,
  canDecide = true,
  id,
  footer,
  materials,
  active = false,
  revealed = true,
  evidenceExtras,
}: {
  section: SectionVM;
  copy: RungCopy;
  judgements: JudgementVM[];
  onAnswer: (jid: string, action: JudgementAnswerRequest["action"], answer?: string) => Promise<boolean>;
  /** False for a shared-link viewer with no run token (see AssemblyView). */
  canDecide?: boolean;
  id: string;
  footer?: ReactNode;
  /** Compiled documents this step owns — their full bodies scroll by inline as
   *  legacy draftblocks below the section content (FEATURE B, terminal runs). */
  materials?: CompiledDocument[];
  active?: boolean;
  revealed?: boolean;
  /** Register-backed claim rows for the evidence rung's framed card. */
  evidenceExtras?: EvidenceExtras;
}) {
  const hasContent = section.content != null;

  return (
    <section
      className={`rung cf-reveal${active ? " active" : ""}`}
      id={id}
      data-stage={section.key}
      data-on={revealed ? "1" : "0"}
    >
      <div className="jcontainer rung-grid">
        <aside>
          <div className="n">{section.step}</div>
          <h2>{copy.title}</h2>
          {copy.limit ? <p className="limit">{copy.limit}</p> : null}
        </aside>
        <div className="rc">
          {judgements.map((j) => (
            <YourJudgementCard key={j.id} judgement={j} canDecide={canDecide} onAnswer={(action, answer) => onAnswer(j.id, action, answer)} />
          ))}

          {hasContent ? (
            <div data-anim="1">
              <SectionContent stepKey={section.key} content={section.content} evidenceExtras={evidenceExtras} />
            </div>
          ) : null}

          {footer ? <div data-anim="2">{footer}</div> : null}

          {materials && materials.length ? (
            <div data-anim="2" className="fa-materials">
              <h3 className="draftgroup">Full material text</h3>
              {materials.map((d) => (
                <MaterialDraft key={d.key} title={d.name} body={d.plainText} />
              ))}
            </div>
          ) : null}

          {!hasContent && !footer ? (
            <div>
              <div className="fa-skeleton" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <p className="fa-skeleton__hint">Not built yet — this section fills in as the agents finish their work.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
