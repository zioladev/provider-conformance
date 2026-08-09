# 14 — The Chrome/WebMCP lane (next phase gate)

Phase II has established the **real-model dimension**: three independent ecosystems (Claude,
GPT, Gemini) exercised against one provider surface through one execution bridge, producing an
attributed, provider-blameless report (frozen in `provider-conformance/evidence/three-way-2026-08-09/`).
One dimension remains before Phase II is genuinely real:

> Does the same attribution/report architecture survive the **actual WebMCP browser runtime**?

This document scopes that lane. It is narrow on purpose — it must not drift into Phase III.

## The load-bearing principle

> **The lane changes. The measurement language does not.**

If the report schema has to be redesigned to accommodate Chrome, that tells us Phase II's
abstraction was incomplete. If Chrome simply becomes **another lane populating the same report
contract** (`provider-conformance-report/1`), that is the proof we want. The reference-runtime
lane and the Chrome lane must be **comparable without being conflated** (§09): same schema,
different `runtimeId` + real `browserVersion`.

## Goal (narrow)

Run the **same** provider fixture and the **same** consumer/model decision pipeline through a
real WebMCP-enabled Chrome surface — the common execution bridge invoking the actual
`document.modelContext` — and produce the **same** report contract, stamped with browser-runtime
provenance.

## Acceptance criteria

1. **Live tool registration** in a WebMCP-enabled Chrome.
2. **Discovery** of the same provider surface (`getTools()` returns the declared tools).
3. **Same normalized tool definitions** presented to adapters as in the reference lane.
4. The common execution bridge uses **actual `RegisteredTool` handles** (never a name string).
5. Both **read and state-changing** execution work against the real runtime.
6. **Provider-side evidence is preserved** (the `ExecutionResult` per the Phase I contract).
7. Failures are still **attributed cleanly** — browser runtime vs. consumer/model vs. provider.
8. The **report contract does not change** merely because the lane changed (`provider-conformance-report/1`).
9. The **exact browser/runtime version is captured** (`lane.browserVersion`).
10. **Reference-runtime and Chrome-lane outcomes are comparable** without conflation
    (`runtimeId` distinguishes them; a shim result is never labeled browser conformance — §09).

## The fault-isolation proof (not just happy path)

The lane must include **one intentionally browser-owned failure or warning** — an unsupported
runtime shape, a registration failure, or invalid tool-handle behavior — so the report can
demonstrate the isolation on the real runtime:

```
Browser Runtime: FAIL
Provider:        PASS
```

A green happy path proves the bridge works; a correctly-attributed browser-owned failure proves
the *measurement language* still separates the runtime from the provider when the runtime is the
one at fault. Both are required for the lane to count.

## Explicitly out of scope (this is not Phase III)

- No journey/itinerary state, no multi-step `inspect → decide → commit` trajectories, no
  provider-to-provider handoff. The Chrome lane runs the **same single-decision cases** the
  reference lane runs — only the runtime changes.
- No new report fields beyond what already exists (`runtimeId`, `browserVersion`). If the lane
  seems to *need* a schema change, stop and reconsider — that is a signal, not a task.

## How this composes with what exists

- The `ModelConsumerAdapter` contract, the common execution bridge's *interface*, the
  attribution engine, the report schema, and the fixtures are all **reused unchanged**. The
  Chrome lane supplies a real-runtime implementation of discovery + execution (against
  `document.modelContext`) in place of the in-process `ReferenceRuntime`.
- Like the Phase I acceptance, the real-Chrome run is driven interactively in a WebMCP-enabled
  build (Canary), not in hermetic CI. Its result is an acceptance-lane report, comparable to —
  never merged into — the reference-lane results.

## Status: the lane is built

The runtime is now **abstracted behind one interface** (`WebMcpRuntime`), satisfied by both the
in-process `ReferenceRuntime` and a real `document.modelContext` (via `detectWebMcpRuntime`). The
common bridge, the attribution engine, and the report schema are **unchanged** — Chrome is a new
*populator*, not a new contract. Proof so far:

- **Deterministic** (`tests/chrome-lane.test.ts`): the pipeline runs against a
  `document.modelContext`-shaped runtime — state-changing (`acted`) and read (`inspected`)
  execution, the same `provider-conformance-report/1` with `runtimeId: chrome-webmcp` +
  `browserVersion`, and the fault-isolation case (`Browser Runtime: FAIL / Provider: PASS`).
- **Browser** (headless smoke): the self-contained acceptance page loads, exposes the API, and
  runs the full flow (register → discover → execute → report) against an injected
  `document.modelContext` fake — all three cases as specified.
- **Real runtime — ✅ PASSED** (2026-08-09, **Chrome/152.0.0.0**): the self-contained
  `chrome-webmcp-acceptance.html` was run in a WebMCP-enabled Chrome. Live registration +
  discovery of both tools; state-changing execution (`acted`, evidence preserved,
  `confirmationId`) and read execution (`inspected`) both worked; the browser-owned failure
  isolated (`Browser Runtime: FAIL / Provider: PASS`); the report is `provider-conformance-report/1`
  with `runtimeId: chrome-webmcp` + the real `browserVersion`. Frozen in
  `provider-conformance/evidence/chrome-webmcp-2026-08-09/`. **The lane changed; the measurement
  language did not.**

With this, Phase II has **both** independent validation dimensions green: real models (the
frozen three-way run) **and** the real WebMCP runtime. Phase II is genuinely real.

## The bar this clears

Once **real models** (done) **and** the **real WebMCP runtime** (this lane) both produce clean,
attributed reports under the *same* measurement language, Phase II is genuinely real: not "we
tested three models," but "the same attribution system distinguishes interoperability behavior
across ecosystems *and* survives the actual browser runtime."
