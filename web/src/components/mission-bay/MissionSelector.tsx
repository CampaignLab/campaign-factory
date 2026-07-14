"use client";

import { ArrowDown } from "lucide-react";
import { useRef } from "react";
import { RUNNABLE_MISSIONS } from "@/lib/missions/catalogue";
import { type MissionType } from "@/lib/missions/types";
import { MissionFlow, missionIcon } from "./MissionVisuals";

export function MissionSelector({ selectedType, onSelect, onOpen }: {
  selectedType: MissionType;
  onSelect: (type: MissionType) => void;
  onOpen: (type: MissionType) => void;
}) {
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = RUNNABLE_MISSIONS.findIndex((mission) => mission.type === selectedType);
  const selected = RUNNABLE_MISSIONS[selectedIndex] || RUNNABLE_MISSIONS[0];

  function moveFocus(index: number) {
    const next = (index + RUNNABLE_MISSIONS.length) % RUNNABLE_MISSIONS.length;
    tabs.current[next]?.focus();
    onSelect(RUNNABLE_MISSIONS[next].type);
  }

  return (
    <section className="mb-onboarding" aria-labelledby="choose-mission-title">
      <div className="mb-section-heading">
        <span className="eyebrow">Choose the next question</span>
        <h2 id="choose-mission-title">Four missions are ready to run</h2>
        <p>Explore the team, output and decision before spending any mission budget.</p>
      </div>

      <div className="mb-tabs" role="tablist" aria-label="Runnable missions">
        {RUNNABLE_MISSIONS.map((mission, index) => {
          const Icon = missionIcon(mission);
          const active = mission.type === selected.type;
          return (
            <button
              aria-controls={`mission-panel-${mission.slug}`}
              aria-selected={active}
              className={active ? "selected" : ""}
              id={`mission-tab-${mission.slug}`}
              key={mission.type}
              onClick={() => onSelect(mission.type)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); moveFocus(index + 1); }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); moveFocus(index - 1); }
                if (event.key === "Home") { event.preventDefault(); moveFocus(0); }
                if (event.key === "End") { event.preventDefault(); moveFocus(RUNNABLE_MISSIONS.length - 1); }
              }}
              ref={(node) => { tabs.current[index] = node; }}
              role="tab"
              tabIndex={active ? 0 : -1}
              type="button"
            >
              <Icon aria-hidden="true" />
              <span><b>{mission.shortName}</b><small>{mission.question}</small></span>
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={`mission-tab-${selected.slug}`}
        className="mb-tab-panel"
        id={`mission-panel-${selected.slug}`}
        role="tabpanel"
      >
        <div className="mb-selected-copy">
          <span className="mb-kicker">{selected.pattern}</span>
          <h3>{selected.name}</h3>
          <p>{selected.artefact}</p>
          <button className="mb-open-mission" onClick={() => onOpen(selected.type)} type="button">
            Open this mission <ArrowDown aria-hidden="true" />
          </button>
        </div>
        <MissionFlow mission={selected} />
      </div>
    </section>
  );
}
