import {
  Archive,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  CircleDashed,
  CircleX,
  FileCheck2,
  GitCompareArrows,
  Landmark,
  ListChecks,
  Merge,
  Route,
  Scale,
  ScanSearch,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { type MissionDefinition, type MissionRun } from "@/lib/missions/types";

export type AgentState = "waiting" | "working" | "complete" | "failed";

const ICONS: LucideIcon[] = [ScanSearch, ListChecks, Route, CalendarDays, Merge];

const MISSION_ICON: Record<string, LucideIcon> = {
  "viability-tribunal": Scale,
  "whole-campaign-evidence-audit": FileCheck2,
  "decision-route-meetings-audit": Landmark,
  "campaign-precedent-review": GitCompareArrows,
};

export function missionIcon(mission: MissionDefinition): LucideIcon {
  return MISSION_ICON[mission.slug] || Workflow;
}

export function agentState(run: MissionRun | null | undefined, key: string): AgentState {
  if (!run) return "waiting";
  const events = run.events.filter((event) => event.agentKey === key);
  if (events.some((event) => event.kind === "agent_failed" || (key === "chair" && event.kind === "mission_failed"))) return "failed";
  if (events.some((event) => event.kind === "agent_completed" || (key === "chair" && event.kind === "mission_completed"))) return "complete";
  if (events.some((event) => event.kind === "agent_started" || (key === "chair" && event.kind === "synthesis_started"))) return "working";
  return "waiting";
}

function StateIcon({ state }: { state: AgentState }) {
  if (state === "complete") return <CircleCheck aria-hidden="true" />;
  if (state === "failed") return <CircleX aria-hidden="true" />;
  return <CircleDashed aria-hidden="true" />;
}

export function AgentTeam({ mission, run, compact = false, excludeReconciler = false }: {
  mission: MissionDefinition;
  run?: MissionRun | null;
  compact?: boolean;
  excludeReconciler?: boolean;
}) {
  const members = excludeReconciler ? mission.team.slice(0, -1) : mission.team;
  return (
    <div className={`mb-agent-team ${compact ? "compact" : ""}`} aria-label={`${mission.name} agent team`}>
      {members.map((agent, index) => {
        const Icon = ICONS[index % ICONS.length];
        const state = agentState(run, agent.key);
        return (
          <span className={`mb-agent-pill tone-${index % 4} state-${state}`} key={agent.key}>
            <Icon className="role-icon" aria-hidden="true" />
            <span>{agent.name}</span>
            {run ? <span className="agent-state"><StateIcon state={state} />{state}</span> : null}
          </span>
        );
      })}
    </div>
  );
}

export function MissionFlow({ mission }: { mission: MissionDefinition }) {
  return (
    <div className="mb-flow" aria-label={`${mission.name} mission flow`}>
      <div className="mb-flow-node snapshot"><Archive aria-hidden="true" /><span>Campaign snapshot</span></div>
      <ArrowRight className="mb-flow-arrow" aria-hidden="true" />
      <div className="mb-flow-agents"><AgentTeam mission={mission} compact excludeReconciler /></div>
      <ArrowRight className="mb-flow-arrow" aria-hidden="true" />
      <div className="mb-flow-node reconcile"><Merge aria-hidden="true" /><span>{mission.team.at(-1)?.name}</span></div>
      <ArrowRight className="mb-flow-arrow" aria-hidden="true" />
      <div className="mb-flow-node output"><FileCheck2 aria-hidden="true" /><span>Mission output</span></div>
      <ArrowRight className="mb-flow-arrow" aria-hidden="true" />
      <div className="mb-flow-node human"><ShieldCheck aria-hidden="true" /><span>Human decision</span></div>
    </div>
  );
}
