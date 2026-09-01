# Archflow

A WebMCP-powered system design studio. You assemble an architecture from blocks, run a traffic simulation, and an agent in the same tab can read the graph, rewire it, and prove a fix with the next run.

**Live app:** [webmcp-ht.vercel.app](https://webmcp-ht.vercel.app/)

## Use cases

Each case loads a first-sketch architecture that **misses** its SLO. Rewire it, scale replicas, then hit Run.

| Case | Load | What the naive sketch gets wrong |
| --- | --- | --- |
| **URL shortener** | 10k redirects/s, p99 ≤ 200ms, errors ≤ 1% | API → database; hot keys have no cache |
| **News feed** | 80k timeline reads/s, p99 ≤ 250ms, errors ≤ 2% | Load balancer in front of a single DB |
| **Realtime chat** | 5k sends/s, p99 ack ≤ 180ms, queue lag ≤ 400ms | Database on the request path |
| **Video streaming** | 60k play-starts/s, p99 ≤ 300ms, errors ≤ 2% | Origin object storage serves the world |


## Blocks

Twenty-two blocks, grouped in the palette: **Edge** (client, DNS, WAF, CDN, load balancer, API gateway, rate limiter), **App** (auth, WebSocket gateway, API, search, ranker, transcoder), **Data** (cache, database, read replica, object store), **Async** (queue, pub/sub, worker, stream processor, notification).

## Human + agent

The page registers WebMCP tools (`get_architecture`, `get_selected_node`, `repair_graph`, `add_node`, `connect`, `run_simulation`, …). `get_selected_node` returns the block the human clicked and what that kind of block means. Test in [ChatGPT’s in-app browser](https://webmcp.devpost.com/) or Chrome with `chrome://flags/#enable-webmcp-testing`, ask:

> Inspect this URL shortener. Make it pass the SLO.

You should see blocks appear, packets change path, and the SLO chip flip.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. `npm test` covers the four use cases (naive fail / repaired pass).

## Stack

Next.js App Router, React Flow, Zustand, `usewebmcp` + `@mcp-b/webmcp-polyfill`.

## License

This software is open source, released under the [MIT License](https://opensource.org/licenses/MIT).
