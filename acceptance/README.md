# Chrome/WebMCP acceptance lane

The second validation dimension (docs §14): the **same** measurement language against the
**real** browser runtime. The lane changes; the report contract does not.

## What's here

- `chrome-webmcp-acceptance.html` — a **self-contained** page (the library is bundled in). Open
  it in a WebMCP-enabled Chrome and click **Run**. No build step, no server.
- `harness.js` — the browser-side source (registers the sample provider on the real
  `document.modelContext`, drives the runtime-agnostic pipeline, renders the report).
- Rebuild the HTML after changing `harness.js` or the library:
  `node --experimental-strip-types scripts/build-acceptance.ts`.

## Running it (in Canary)

1. Open a **WebMCP-enabled Chrome** (Canary + the WebMCP flag — the same build used for the
   Phase I acceptance).
2. Open `chrome-webmcp-acceptance.html` (File → Open, or drag it into a tab).
3. Click **Run acceptance**. Then **Download report JSON** for the evidence.

## What it proves (acceptance criteria, §14)

- Live tool **registration** + **discovery** against real `document.modelContext`.
- The common execution bridge uses actual **`RegisteredTool` handles** (never a name string).
- **Read and state-changing** execution both work; provider **evidence is preserved**.
- The report is `provider-conformance-report/1` with `runtimeId: chrome-webmcp` and the real
  `browserVersion` — **the contract does not change because the lane changed.**
- One **intentionally browser-owned failure** proves the isolation: `Browser Runtime: FAIL /
  Provider: PASS`.
- Reference-lane and Chrome-lane reports are comparable via `runtimeId`, never conflated (§09).

A PASS status means: the real WebMCP lane is green **and** the browser-owned failure isolated
correctly.

## If registration/execution shapes differ in your build

WebMCP is a moving draft. If `registerTool` or the tool-result shape differs from what
`harness.js` assumes (it returns the provider's `ExecutionResult` as the tool result, and
unwraps a `{ content: [{ text }] }` wrapper if present), adjust `registerProvider()` /
`makeChromeRuntime()` in `harness.js`, rebuild, and re-run — the same iterative approach as the
Phase I acceptance. The step-by-step log shows exactly where it stops.

## Validation already done (before Canary)

- The runtime-agnostic pipeline is proven **deterministically** against a `document.modelContext`-
  shaped runtime (`tests/chrome-lane.test.ts`): state-changing + read execution, the SAME report
  contract with browser provenance, and `Browser Runtime: FAIL / Provider: PASS`.
- The self-contained page is smoke-tested headlessly (bundle loads, API exposed, no-runtime path
  degrades gracefully, and the full flow passes against an injected `document.modelContext` fake).

The only thing left is the **real** runtime — that's your Canary run.
