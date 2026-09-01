import { CATALOG } from "./catalog";
import { defaultProtocol, type ArchEdge, type ArchNode } from "./graph";
import type { BlockData, BlockKind, Challenge, EdgeData } from "./types";

function block(
  id: string,
  kind: BlockKind,
  x: number,
  y: number,
  label?: string,
): ArchNode {
  const spec = CATALOG[kind];
  const data: BlockData = {
    kind,
    label: label ?? spec.label,
    replicas: spec.replicas,
    rpsCapacity: spec.rpsCapacity,
    baseLatencyMs: spec.baseLatencyMs,
    hitRate: spec.hitRate,
    findings: [],
  };
  return {
    id,
    type: "block",
    position: { x, y },
    data,
    sourcePosition: undefined,
    targetPosition: undefined,
  };
}

function link(from: string, to: string, targetKind: BlockKind): ArchEdge {
  const data: EdgeData = { protocol: defaultProtocol(targetKind) };
  return {
    id: `${from}->${to}`,
    source: from,
    target: to,
    type: "packet",
    data,
  };
}

export interface ChallengeGraph {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

export interface PlayableChallenge extends Challenge {
  starter: ChallengeGraph;
}

const COL = 280;
const ROW = 170;

export const CHALLENGES: PlayableChallenge[] = [
  {
    id: "url-shortener",
    title: "URL shortener",
    subtitle: "TinyURL-style redirects at 10k RPS",
    brief:
      "Design a URL shortening service. Users create short links; the public follows them. Almost all traffic is reads (redirects). A handful of popular links get the majority of hits.",
    constraints: [
      "10,000 redirects per second",
      "p99 latency ≤ 200ms",
      "error rate ≤ 1%",
    ],
    hints: [
      "Hot keys belong in a cache, in front of the database — not beside it.",
      "A CDN can take the most popular redirects at the edge.",
      "Writes (new links) are rare; optimize the read path first.",
    ],
    ingressRps: 10_000,
    slo: { maxP99Ms: 200, maxErrorRate: 0.01 },
    starter: {
      nodes: [
        block("client-1", "client", 40, ROW, "Web clients"),
        block("api-1", "api", 40 + COL, ROW, "Shortener API"),
        block("database-1", "database", 40 + COL * 2, ROW, "Links DB"),
      ],
      edges: [
        link("client-1", "api-1", "api"),
        link("api-1", "database-1", "database"),
      ],
    },
  },
  {
    id: "news-feed",
    title: "News feed",
    subtitle: "Twitter-style home timeline at 80k reads/s",
    brief:
      "Design the home timeline for a social network. Users open the app and expect a precomputed feed. Reads dwarf writes. A single application tier in front of one database is the classic first sketch — and it will melt.",
    constraints: [
      "80,000 timeline reads per second",
      "p99 latency ≤ 250ms",
      "error rate ≤ 2%",
    ],
    hints: [
      "Most reads should never reach the primary database.",
      "Scale the CDN: one edge node will not absorb 80k RPS.",
      "Fan-out-on-write into a cache is the usual pattern; this simulator treats that as a cache in front of the DB.",
    ],
    ingressRps: 80_000,
    slo: { maxP99Ms: 250, maxErrorRate: 0.02 },
    starter: {
      nodes: [
        block("client-1", "client", 40, ROW, "Mobile + web"),
        block("load-balancer-1", "load_balancer", 40 + COL, ROW, "Edge LB"),
        block("api-1", "api", 40 + COL * 2, ROW, "Timeline API"),
        block("database-1", "database", 40 + COL * 3, ROW, "Posts DB"),
      ],
      edges: [
        link("client-1", "load-balancer-1", "load_balancer"),
        link("load-balancer-1", "api-1", "api"),
        link("api-1", "database-1", "database"),
      ],
    },
  },
  {
    id: "realtime-chat",
    title: "Realtime chat",
    subtitle: "WhatsApp-style messaging at 5k sends/s",
    brief:
      "Design 1:1 and small-group messaging. The sender should get an ack quickly. Persisting the message and fanning it out to other devices can happen behind a queue. If you write to the database on the request path, both latency and capacity will miss the SLO.",
    constraints: [
      "5,000 message sends per second",
      "p99 ack ≤ 180ms",
      "error rate ≤ 1%",
      "queue lag ≤ 400ms if you decouple with a queue",
    ],
    hints: [
      "Ack the client before fan-out finishes. Incoming edges to a queue are async and drop off the p99 path.",
      "Workers + database replicas must drain the queue or lag blows the SLO.",
      "A cache is the right shape for presence and recent threads — not for durable history.",
    ],
    ingressRps: 5_000,
    slo: { maxP99Ms: 180, maxErrorRate: 0.01, maxQueueLagMs: 400 },
    starter: {
      nodes: [
        block("client-1", "client", 40, ROW - 40, "Chat clients"),
        block("api-1", "api", 40 + COL, ROW - 40, "Chat service"),
        block("database-1", "database", 40 + COL * 2, ROW - 40, "Messages DB"),
      ],
      edges: [
        link("client-1", "api-1", "api"),
        link("api-1", "database-1", "database"),
      ],
    },
  },
  {
    id: "video-streaming",
    title: "Video streaming",
    subtitle: "YouTube-style playback at 60k play-starts/s",
    brief:
      "Design video playback. A play-start is a request for a manifest plus segments. Almost every byte should come from an edge cache. Origin object storage is for misses and uploads; it cannot serve the world directly. Metadata (title, URL) is a cheaper, cacheable read than the media itself.",
    constraints: [
      "60,000 play-start requests per second",
      "p99 latency ≤ 300ms",
      "error rate ≤ 2%",
    ],
    hints: [
      "Put a CDN in front. Origin object storage should barely see play-start traffic.",
      "Scale the CDN: 60k RPS is more than one edge node in this catalog.",
      "A cache in front of metadata beats sending every start to a database.",
    ],
    ingressRps: 60_000,
    slo: { maxP99Ms: 300, maxErrorRate: 0.02 },
    starter: {
      nodes: [
        block("client-1", "client", 40, ROW, "Players"),
        block("api-1", "api", 40 + COL, ROW, "Playback API"),
        block("object-store-1", "object_store", 40 + COL * 2, ROW, "Video origin"),
      ],
      edges: [
        link("client-1", "api-1", "api"),
        link("api-1", "object-store-1", "object_store"),
      ],
    },
  },
];

export function challengeById(id: string): PlayableChallenge {
  return CHALLENGES.find((c) => c.id === id) ?? CHALLENGES[0];
}