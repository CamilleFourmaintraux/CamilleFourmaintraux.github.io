// Online Pong through the portfolio server: it runs the game, each player only
// sends the position of their own paddle. Two players at most, no lobby.
import type { Side } from "./engine";

export type OnlineStatus =
  | "connecting"
  /** The free server was asleep: it takes up to a minute to wake up. */
  | "waking"
  | "waiting"
  | "playing"
  | "busy"
  | "opponent-left"
  | "idle"
  | "lost"
  | "unreachable";

/** Last state sent by the server, in server sides. */
export type Snapshot = {
  ball: { x: number; y: number; vx: number; vy: number };
  paddles: Record<Side, number>;
  score: Record<Side, number>;
  /** The ball waits in the middle before a serve. */
  serving: boolean;
  /** Arrival time, for moving the ball between two messages. */
  at: number;
};

// Shown when the first answer takes longer than this.
const WAKING_AFTER_MS = 2500;
// A sleeping free Render service takes about a minute to start.
const WAKE_LIMIT_MS = 100_000;
const HEARTBEAT_MS = 30_000;
// Paddle updates sent at most this often.
const SEND_MS = 1000 / 30;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class OnlineMatch {
  /** Side given by the server once the game starts. */
  side: Side | null = null;
  snapshot: Snapshot | null = null;
  private socket: WebSocket | null = null;
  private stopped = false;
  private finished = false;
  private heartbeat = 0;
  private sentAt = 0;
  private sentY = Number.NaN;

  constructor(
    private readonly base: string,
    private readonly onStatus: (status: OnlineStatus) => void,
    /** A point was scored, by the server side given. */
    private readonly onPoint: (side: Side, score: Record<Side, number>) => void,
  ) {}

  async start() {
    this.onStatus("connecting");
    const waking = setTimeout(() => {
      if (!this.stopped) this.onStatus("waking");
    }, WAKING_AFTER_MS);
    // Plain HTTP first: a sleeping service answers a WebSocket with its
    // loading page, while a request wakes it up and waits.
    let status: { busy: boolean } | null = null;
    const deadline = Date.now() + WAKE_LIMIT_MS;
    while (!this.stopped && Date.now() < deadline) {
      try {
        const response = await fetch(`${this.base}/pong/status`, {
          cache: "no-store",
          signal: AbortSignal.timeout(25_000),
        });
        if (response.ok) {
          status = await response.json();
          break;
        }
      } catch {
        // Still waking up: try again.
      }
      await sleep(2000);
    }
    clearTimeout(waking);
    if (this.stopped) return;
    if (!status) return this.finish("unreachable");
    if (status.busy) return this.finish("busy");
    this.connect();
  }

  private connect() {
    const url = `${this.base.replace(/^http/, "ws")}/pong`;
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onmessage = (event) => this.receive(event.data);
    socket.onclose = () => {
      window.clearInterval(this.heartbeat);
      if (!this.stopped && !this.finished) this.finish("lost");
    };
    // Messages keep the free server awake while someone waits.
    this.heartbeat = window.setInterval(
      () => this.send({ t: "ping" }),
      HEARTBEAT_MS,
    );
  }

  private receive(data: unknown) {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(String(data));
    } catch {
      return;
    }
    switch (message.t) {
      case "waiting":
        this.onStatus("waiting");
        return;
      case "busy":
        this.finish("busy");
        return;
      case "start":
        this.side = message.side === "right" ? "right" : "left";
        this.onStatus("playing");
        return;
      case "end": {
        const reason = message.reason === "idle" ? "idle" : "opponent-left";
        this.finish(reason);
        return;
      }
      case "s": {
        const [x, y, vx, vy] = message.b as number[];
        const [left, right] = message.p as number[];
        const [scoreLeft, scoreRight] = message.s as number[];
        const previous = this.snapshot?.score;
        this.snapshot = {
          ball: { x, y, vx, vy },
          paddles: { left, right },
          score: { left: scoreLeft, right: scoreRight },
          serving: message.w === 1,
          at: performance.now(),
        };
        if (previous) {
          if (scoreLeft > previous.left)
            this.onPoint("left", this.snapshot.score);
          if (scoreRight > previous.right)
            this.onPoint("right", this.snapshot.score);
        }
      }
    }
  }

  private send(message: object) {
    if (this.socket?.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify(message));
  }

  /** Position of the local paddle (its top), sent about 30 times a second. */
  sendPaddle(y: number) {
    const now = performance.now();
    if (now - this.sentAt < SEND_MS || Math.abs(y - this.sentY) < 0.5) return;
    this.sentAt = now;
    this.sentY = y;
    this.send({ t: "paddle", y: Math.round(y * 10) / 10 });
  }

  private finish(status: OnlineStatus) {
    this.finished = true;
    this.socket?.close(1000);
    window.clearInterval(this.heartbeat);
    this.onStatus(status);
  }

  /** Leaves the search or the game. */
  stop() {
    this.stopped = true;
    window.clearInterval(this.heartbeat);
    this.socket?.close(1000);
  }
}
