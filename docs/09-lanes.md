# 09 — Execution lanes

WebMCP today runs only in a flag-gated Chrome (our Phase I acceptance ran by hand in Chrome
Canary; headless Chromium had no `document.modelContext` at all). That reality forces a
two-lane design — and a rule about honesty.

## The two lanes

| | Reference-runtime lane | Acceptance lane |
|---|---|---|
| `runtimeId` | `reference-runtime/1` | `chrome-webmcp` |
| Surface | A faithful in-process **reference runtime** implementing the WebMCP provider API (`registerTool` / `getTools` / `executeTool` with RegisteredTool handles) exactly as Phase I confirmed it. | The **real** `document.modelContext` in a WebMCP-enabled Chrome. |
| Runs | Automatically, in CI, Node — deterministic. | Against a real browser build; semi-manual or a dedicated lane. |
| Proves | Adapter logic, schema normalization, argument handling, the report/attribution/divergence machinery — everything that does not depend on the real browser. | That the provider + the real runtime behave as the reference lane assumed. |
| `browserVersion` | `null` | the real build string |

Both lanes drive the **same** common execution bridge (§02) and emit the **same** report schema
(§06). The lane is provenance (`runtimeId`), so any result is always self-describing about where
it ran.

## The honesty rule

> **A reference-runtime result is never presented as browser conformance.**

The reference runtime is a faithful shim, and faithful shims are invaluable for testing
everything above the browser. But a shim cannot prove the *real* runtime's behavior — that is
exactly the gap Phase I closed by running the acceptance matrix in real Canary. So:

- Reference-lane results are labeled `runtimeId: "reference-runtime/1"` and may **never** be
  aggregated into, or reported as, a `chrome-webmcp` qualification.
- Any provider-facing qualification claim ("passes under Chrome X") must cite acceptance-lane
  runs with a real `browserVersion`.
- The two lanes' results can be *compared* (a divergence between shim and real runtime is a
  `browser_runtime` finding), but never *conflated*.

This mirrors, and reuses the lesson of, the Phase I acceptance discipline: the shim tells you
your logic is right; only the browser tells you the world agrees.

## What is deferred to Phase VI

Full, automated, real-browser × real-model matrix execution — many browser builds × many model
versions, on a schedule, with regression tracking and alerting — is the **hosted qualification
service** (Phase VI), and is out of scope here. Phase II delivers:

- the reference lane, fully automated;
- the acceptance lane, runnable on demand against a real build;
- a report that is identical in shape across both, so the hosted service later *scales* the
  acceptance lane rather than *reinventing* it.

If real-browser automation becomes easy earlier (e.g. a headless WebMCP build ships), we may
pull some acceptance-lane automation forward — but never by lowering the honesty rule.
