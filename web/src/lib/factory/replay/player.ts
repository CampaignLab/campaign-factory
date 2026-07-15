// Replay playback engine (ADR 0001 / parameters §7). Pure client-side: it takes
// a manifest's public Factory Event array and re-emits the events over time,
// preserving the ORIGINAL inter-event timing relative to run start. This is a
// recording of real work, so it is NOT compressed by default (1x). A
// presenter-only speed multiplier (1x/2x/4x) is offered for rehearsal.
//
// The emitted events feed the SAME pure fold W4 built (foldEvents) through the
// SAME W5 gallery renderer, so live and recorded runs render identically. The
// player itself is framework-neutral (no react, no next, no EventSource); the
// clock + frame scheduler are injectable so it is unit-testable off the DOM.

import type { FactoryEvent } from "../contracts/core";

export type ReplaySpeed = 1 | 2 | 4;

export type ReplayStatus = "idle" | "playing" | "paused" | "ended";

export interface ReplayPlayerState {
  status: ReplayStatus;
  speed: ReplaySpeed;
  /** Playback position in run-relative ms (0 .. totalMs). */
  virtualMs: number;
  /** Full recorded duration (last event offset), ms. */
  totalMs: number;
  /** startMs + virtualMs — the playback clock in the run's ORIGINAL time frame.
   *  Pass this as `now` to the gallery so completion choreography matches live. */
  virtualNowMs: number;
  /** ms of the first recorded event (the run-start anchor). */
  startMs: number;
  emittedCount: number;
  total: number;
}

export interface ReplayPlayerCallbacks {
  /** Newly crossed events, in order. The consumer appends them to its buffer. */
  onEmit?: (events: FactoryEvent[]) => void;
  /** State change (status/speed) or throttled progress tick. */
  onState?: (state: ReplayPlayerState) => void;
  /** Playback was reset to the start; the consumer clears its buffer. */
  onReset?: () => void;
}

export interface ReplayPlayerOptions {
  autoStart?: boolean;
  speed?: ReplaySpeed;
  /** Minimum ms between progress `onState` ticks (default 200). Status changes
   *  always fire immediately regardless of this. */
  progressIntervalMs?: number;
  clock?: () => number; // monotonic ms
  schedule?: (cb: () => void) => unknown; // frame scheduler
  cancel?: (handle: unknown) => void;
}

export interface ReplayTimeline {
  ordered: FactoryEvent[];
  offsets: number[]; // per-event run-relative ms, monotonic non-decreasing
  startMs: number;
  totalMs: number;
}

function parseAt(e: FactoryEvent): number {
  const t = Date.parse(e.at);
  return Number.isFinite(t) ? t : NaN;
}

/** Sort events by wall time (then sequence) and compute run-relative offsets.
 *  Tolerates missing/invalid timestamps by holding the previous offset. */
export function prepareReplayTimeline(events: FactoryEvent[]): ReplayTimeline {
  const withT = events.map((e) => ({ e, t: parseAt(e) }));
  const valid = withT.filter((x) => Number.isFinite(x.t));
  const startMs = valid.length ? Math.min(...valid.map((x) => x.t)) : 0;

  const sorted = [...withT].sort((a, b) => {
    const at = Number.isFinite(a.t) ? a.t : startMs;
    const bt = Number.isFinite(b.t) ? b.t : startMs;
    if (at !== bt) return at - bt;
    return (a.e.sequence ?? 0) - (b.e.sequence ?? 0);
  });

  const ordered: FactoryEvent[] = [];
  const offsets: number[] = [];
  let prev = 0;
  for (const { e, t } of sorted) {
    const off = Number.isFinite(t) ? Math.max(0, t - startMs) : prev;
    const mono = Math.max(off, prev);
    ordered.push(e);
    offsets.push(mono);
    prev = mono;
  }
  const totalMs = offsets.length ? offsets[offsets.length - 1] : 0;
  return { ordered, offsets, startMs, totalMs };
}

const defaultClock = (): number =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const defaultSchedule = (cb: () => void): unknown =>
  typeof requestAnimationFrame === "function" ? requestAnimationFrame(() => cb()) : setTimeout(cb, 16);

const defaultCancel = (h: unknown): void => {
  if (h == null) return;
  if (typeof cancelAnimationFrame === "function" && typeof h === "number") cancelAnimationFrame(h);
  else clearTimeout(h as ReturnType<typeof setTimeout>);
};

export class ReplayPlayer {
  private readonly timeline: ReplayTimeline;
  private readonly cb: ReplayPlayerCallbacks;
  private readonly clock: () => number;
  private readonly schedule: (cb: () => void) => unknown;
  private readonly cancel: (handle: unknown) => void;
  private readonly progressIntervalMs: number;

  private status: ReplayStatus = "idle";
  private speed: ReplaySpeed;
  private virtualMs = 0;
  private cursor = 0; // index of next unemitted event

  private anchorReal = 0; // clock() at the last play/rebaseline
  private anchorVirtual = 0; // virtualMs at the last play/rebaseline
  private frame: unknown = null;
  private lastTickAt = 0;

  constructor(events: FactoryEvent[], callbacks: ReplayPlayerCallbacks = {}, opts: ReplayPlayerOptions = {}) {
    this.timeline = prepareReplayTimeline(events);
    this.cb = callbacks;
    this.clock = opts.clock ?? defaultClock;
    this.schedule = opts.schedule ?? defaultSchedule;
    this.cancel = opts.cancel ?? defaultCancel;
    this.progressIntervalMs = opts.progressIntervalMs ?? 200;
    this.speed = opts.speed ?? 1;
    this.emitState(true);
    if (opts.autoStart) this.play();
  }

  getState(): ReplayPlayerState {
    return {
      status: this.status,
      speed: this.speed,
      virtualMs: this.virtualMs,
      totalMs: this.timeline.totalMs,
      virtualNowMs: this.timeline.startMs + this.virtualMs,
      startMs: this.timeline.startMs,
      emittedCount: this.cursor,
      total: this.timeline.ordered.length,
    };
  }

  play(): void {
    if (this.status === "playing") return;
    if (this.virtualMs >= this.timeline.totalMs && this.cursor >= this.timeline.ordered.length) {
      // Nothing left to play; a fresh viewing needs restart().
      return;
    }
    this.status = "playing";
    this.anchorReal = this.clock();
    this.anchorVirtual = this.virtualMs;
    this.emitState(true);
    this.tick();
  }

  pause(): void {
    if (this.status !== "playing") return;
    this.advanceToNow();
    this.status = "paused";
    this.cancelFrame();
    this.emitState(true);
  }

  toggle(): void {
    if (this.status === "playing") this.pause();
    else if (this.status === "ended") this.restart();
    else this.play();
  }

  jumpToEnd(): void {
    this.cancelFrame();
    this.virtualMs = this.timeline.totalMs;
    this.emitUpTo(this.virtualMs);
    this.status = "ended";
    this.emitState(true);
  }

  /** Reset to the start and begin playing again. Fires onReset so the consumer
   *  clears its accumulated event buffer. */
  restart(): void {
    this.cancelFrame();
    this.cursor = 0;
    this.virtualMs = 0;
    this.status = "idle";
    this.cb.onReset?.();
    this.emitState(true);
    this.play();
  }

  setSpeed(speed: ReplaySpeed): void {
    if (this.status === "playing") this.advanceToNow(); // rebaseline before switching rate
    this.speed = speed;
    if (this.status === "playing") {
      this.anchorReal = this.clock();
      this.anchorVirtual = this.virtualMs;
    }
    this.emitState(true);
  }

  dispose(): void {
    this.cancelFrame();
  }

  // ---- internals ----

  private advanceToNow(): void {
    const real = this.clock();
    let v = this.anchorVirtual + (real - this.anchorReal) * this.speed;
    if (v < 0) v = 0;
    if (v > this.timeline.totalMs) v = this.timeline.totalMs;
    this.virtualMs = v;
    this.emitUpTo(v);
  }

  private tick = (): void => {
    this.frame = null;
    if (this.status !== "playing") return;
    const real = this.clock();
    let v = this.anchorVirtual + (real - this.anchorReal) * this.speed;
    if (v < 0) v = 0;
    const ended = v >= this.timeline.totalMs;
    if (ended) v = this.timeline.totalMs;
    this.virtualMs = v;
    this.emitUpTo(v);
    if (ended) {
      this.status = "ended";
      this.emitState(true);
      return;
    }
    this.emitState(false);
    this.frame = this.schedule(this.tick);
  };

  private emitUpTo(v: number): void {
    const batch: FactoryEvent[] = [];
    while (
      this.cursor < this.timeline.ordered.length &&
      this.timeline.offsets[this.cursor] <= v
    ) {
      batch.push(this.timeline.ordered[this.cursor]);
      this.cursor += 1;
    }
    if (batch.length) this.cb.onEmit?.(batch);
  }

  private cancelFrame(): void {
    if (this.frame != null) {
      this.cancel(this.frame);
      this.frame = null;
    }
  }

  private emitState(force: boolean): void {
    if (!this.cb.onState) return;
    const now = this.clock();
    if (!force && now - this.lastTickAt < this.progressIntervalMs) return;
    this.lastTickAt = now;
    this.cb.onState(this.getState());
  }
}
