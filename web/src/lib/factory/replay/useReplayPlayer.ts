"use client";

// React binding for the framework-neutral ReplayPlayer. Owns the accumulated
// event buffer that the player feeds; the consuming route folds this buffer
// through the SAME W4 fold + W5 gallery as a live run. Keeping the player itself
// react-free (player.ts) means this hook is the only client-coupled piece.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FactoryEvent } from "../contracts/core";
import {
  ReplayPlayer,
  prepareReplayTimeline,
  type ReplayPlayerState,
  type ReplaySpeed,
} from "./player";

export interface UseReplayPlayerResult {
  events: FactoryEvent[]; // emitted so far, oldest → newest
  state: ReplayPlayerState;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  jumpToEnd: () => void;
  restart: () => void;
  setSpeed: (speed: ReplaySpeed) => void;
}

export interface UseReplayPlayerOptions {
  autoStart?: boolean;
}

export function useReplayPlayer(
  allEvents: FactoryEvent[],
  opts: UseReplayPlayerOptions = {},
): UseReplayPlayerResult {
  const autoStart = opts.autoStart ?? false;

  const initialState = useMemo<ReplayPlayerState>(() => {
    const tl = prepareReplayTimeline(allEvents);
    return {
      status: "idle",
      speed: 1,
      virtualMs: 0,
      totalMs: tl.totalMs,
      virtualNowMs: tl.startMs,
      startMs: tl.startMs,
      emittedCount: 0,
      total: tl.ordered.length,
    };
  }, [allEvents]);

  const [events, setEvents] = useState<FactoryEvent[]>([]);
  const [state, setState] = useState<ReplayPlayerState>(initialState);
  const playerRef = useRef<ReplayPlayer | null>(null);

  useEffect(() => {
    setEvents([]);
    const player = new ReplayPlayer(
      allEvents,
      {
        onEmit: (batch) => setEvents((prev) => (batch.length ? [...prev, ...batch] : prev)),
        onReset: () => setEvents([]),
        onState: (s) => setState(s),
      },
      { autoStart },
    );
    playerRef.current = player;
    setState(player.getState());
    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [allEvents, autoStart]);

  const play = useCallback(() => playerRef.current?.play(), []);
  const pause = useCallback(() => playerRef.current?.pause(), []);
  const toggle = useCallback(() => playerRef.current?.toggle(), []);
  const jumpToEnd = useCallback(() => playerRef.current?.jumpToEnd(), []);
  const restart = useCallback(() => playerRef.current?.restart(), []);
  const setSpeed = useCallback((speed: ReplaySpeed) => playerRef.current?.setSpeed(speed), []);

  return { events, state, play, pause, toggle, jumpToEnd, restart, setSpeed };
}
