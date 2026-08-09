# Chrome/WebMCP acceptance evidence — 2026-08-09

This artifact records a **real** run of the acceptance lane on an actual WebMCP-enabled Chrome.
It is not a benchmark; it records observed behavior of the measurement system against the real
browser runtime under a fixed provider surface and task set.

- **Lane:** `chrome-webmcp` — real `document.modelContext`.
- **Browser:** `Chrome/152.0.0.0` (from `lane.browserVersion`).
- **Report contract:** `provider-conformance-report/1` — **unchanged** from the reference lane.
  The lane changed; the measurement language did not (§14).

## What it proves (all §14 acceptance criteria, on the real runtime)

- **Registration + discovery:** both declared tools (`place_order`, `find_item`) registered on
  the real `document.modelContext` and were surfaced by discovery.
- **State-changing execution:** `place_order` executed and returned preserved provider
  evidence (`executed:true`, `confirmationId: ORDER-3000`). Disposition `acted`. Provider PASS.
- **Read execution:** `find_item` executed. Disposition `inspected`. The read is outside the
  frozen allowable terminal outcomes → `model_tool_selection` (consumer-side), Provider PASS.
- **Fault isolation (browser-owned failure):** an injected unsupported runtime surface →
  `browser_runtime` FAIL, `provider_execution` NOT_REACHED, **Provider PASS**. A browser-runtime
  fault is never provider nonconformance.
- **Provenance:** exact `browserVersion` captured; `providerDefHash` / `toolSurfaceHash` recorded;
  `runtimeId` distinguishes this from the reference lane (comparable, never conflated).

## Both dimensions now green

Paired with `evidence/three-way-2026-08-09/` (real models: Claude + GPT + Gemini on the
reference lane), Phase II now has **both** independent validation dimensions:

- **Real models** — three ecosystems, same surface, attributed, provider-blameless.
- **Real WebMCP runtime** — the same attribution/report architecture survives the actual browser.

`chrome-webmcp-report.json` is the verbatim run output; `chrome-webmcp-report.md` is its
rendering.
