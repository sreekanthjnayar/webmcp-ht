# Archflow

A WebMCP-powered system design studio. You assemble an architecture from blocks, run a traffic simulation, and an agent in the same tab can read the graph, rewire it, and prove a fix with the next run.

## Use cases

Each case loads a first-sketch architecture that **misses** its SLO. Rewire it, scale replicas, then hit Run.

| Case | Load | What the naive sketch gets wrong |
| --- | --- | --- |
| **URL shortener** | 10k redirects/s, p99 ≤ 200ms, errors ≤ 1% | API → database; hot keys have no cache |
| **News feed** | 80k timeline reads/s, p99 ≤ 250ms, errors ≤ 2% | Load balancer in front of a single DB |
| **Realtime chat** | 5k sends/s, p99 ack ≤ 180ms, queue lag ≤ 400ms | Database on the request path |
| **Video streaming** | 60k play-starts/s, p99 ≤ 300ms, errors ≤ 2% | Origin object storage serves the world |

The simulation is a toy on purpose: capacity vs incoming RPS, cache hits absorbed, overflow = errors, p99 = hottest **sync** path. Edges into a queue or pub/sub are async. Pub/sub copies the full rate to every subscriber.

Each run scores **robustness** (0–100): SLO, errors, latency, headroom, and single points of failure. Run again after a change and the inspector shows whether the design got better or worse.

## Blocks

Twenty-two blocks, grouped in the palette: **Edge** (client, DNS, WAF, CDN, load balancer, API gateway, rate limiter), **App** (auth, WebSocket gateway, API, search, ranker, transcoder), **Data** (cache, database, read replica, object store), **Async** (queue, pub/sub, worker, stream processor, notification).

## Human + agent

This is not a chatbot next to a diagram. The page registers WebMCP tools (`get_architecture`, `add_node`, `connect`, `run_simulation`, …). In [ChatGPT’s in-app browser](https://webmcp.devpost.com/) or Chrome with `chrome://flags/#enable-webmcp-testing`, ask:

> Inspect this URL shortener. Make it pass the SLO.

You should see blocks appear, packets change path, and the SLO chip flip.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. `npm test` covers the four use cases (naive fail / repaired pass).

## Stack

Next.js App Router, React Flow, Zustand, `usewebmcp` + `@mcp-b/webmcp-polyfill`. No backend; the tab is the session.

MIT licensed.
