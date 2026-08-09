# 00 — Extraction inventory

Phase II is grounded, not assumed. Before designing anything, we read the existing
production code (`Ugly-Tool/refraktor-v2`, which contains the `@selvage/*` monorepo under
`packages/*`) to separate **what already works and lifts out cleanly** from **what is
genuinely new**. This document is that separation. It is the honest starting line.

The headline finding shapes the whole phase:

> The expensive *plumbing* already exists and extracts cleanly. The two features that make
> Phase II a **product** — the fault-attributed report and cross-consumer divergence — are
> **greenfield**. The existing "conformance suite" and "divergence fixtures" solve a
> *different* problem (enforcement-boundary integration and term-drift), and are reused as
> **patterns**, not as the mechanism.

## A. Lifts cleanly — the reusable plumbing

These are Selvage-free and are the real head start. They are re-authored into the new
package (never imported from `@selvage/*` — see the clean-room rule in §10), but the
design and most of the code carry over.

| Asset | Where it lives today | What it gives us |
|---|---|---|
| **Model adapters** (`ModelAdapter`) | `refraktor-v2-backend/lib/adapters/{types,gpt,claude,gemini}.ts` | Three working production adapters — OpenAI, Anthropic, Google — behind one contract: `call(messages, tools, systemInstruction) → AdapterResponse`. Import only provider SDKs. **This is the part that is painful to build from scratch, and it is done.** |
| **Schema normalization** | `refraktor-v2-backend/lib/adapters/cleaner.ts` (`cleanSchemaForGemini`) | The one place real JSON-Schema → model-format translation is needed (GPT/Claude are near pass-through; Gemini needs the OpenAPI-subset rewrite). Pure function, no deps. |
| **Tool-call parsing + arg repair** | per-adapter `call()`; `reconcileArgs` in `gemini.js` | Extract `{name, arguments}` from each provider's raw response; schema-driven repair of sensible-but-wrong arg keys. |
| **WebMCP runtime bridge** | repo-root `bridge.js` | The only genuine `document.modelContext` / `executeTool`(RegisteredTool handle) translator — the exact API facts our Phase I Canary acceptance confirmed. Feature-detects `document.modelContext` / `navigator.modelContextTesting` / `navigator.modelContext`. |
| **Cross-model matrix skeleton** | `refraktor-v2-backend/study/{runOne,parity}.ts` | `runOne(model, scenario, arm)` already runs the *same task across GPT/Claude/Gemini with full per-turn trace capture*. The structural bones of the conformance matrix. |
| **Deterministic fixture technique** | `oracle-webmcp/test/material-terms.ts` | Queued per-tool provider responses so state can be injected between calls; assert on an observable (e.g. commit count). A reusable *technique* for making runs deterministic. |
| **Authorization-free provider surfaces** | `demos/injection/src/provider.ts`; `studies/reliability/tools.mjs` | Ready sample WebMCP surfaces with no governance of their own — usable as conformance test targets (anonymized). |

## B. Greenfield — the differentiators

These do **not** exist to extract. They are the reason Phase II is a measurement language
and not "three vendor integrations."

| New thing | Why it is new |
|---|---|
| **Machine-readable conformance report** | No such generator exists today. The current suites print `PASS/FAIL` to stdout and set an exit code. The only structured JSON in the repo is the extension-specific Playwright acceptance output. We design the report from scratch (§06); the `selvage-receipt/2` object is a shape reference only. |
| **Attribution taxonomy** | The existing 8-property suite certifies *enforcement-boundary* behavior ("did the call traverse the authorization boundary", "was a receipt emitted") — Selvage-framed. Provider-surface fault attribution across nine layers (§05) is new. |
| **Cross-consumer divergence** | The existing "divergence fixtures" test **term drift** — whether a provider's terms changed *between disclosure and commit* (a governance concern). That is a different axis. Phase II divergence is *same provider + same task → materially different observable outcome across model paths* (§07). New predicate, new detector. |

## C. Two decisions the code forces

1. **Naming — rename aggressively past the `ConsumerAdapter` collision.** In `@selvage/core`,
   `ConsumerAdapter` already means the *enforcement host seam* (`execute` / `readExecute` /
   `approvalUI` / `receipts`). The thing that lets a model family drive tool use is called
   **`ModelAdapter`**. Phase II's public type is named **`ModelConsumerAdapter`** (§03) — the
   generalization of `ModelAdapter`, renamed explicitly enough that no one can import Selvage's
   identically-named type by accident. The Selvage type is never imported and never referenced.

2. **Re-home types; import nothing from `@selvage/*`.** Every reusable oracle/compare/type in
   the monorepo currently imports the proprietary core (if only for shared types and the
   `INVALID` sentinel). The clean-room rule for `@zioladev/provider-conformance` is absolute:
   **zero imports from `@selvage/*` or the Refraktor extension.** The handful of shared types
   is re-authored inside the new package. See §10.

## D. Extraction hazards (imports that reach into the proprietary layer)

Recorded so they are severed on extraction, not carried along:

- `consumer.ts → enforce.ts` — the contract file imports the enforcement engine. Lift the
  interface out standalone; drop `mountSelvage`.
- `oracle.ts` / `domain.ts` / `material-terms.ts → @selvage/core` — re-home the shared types.
- `consumer-refraktor/test/paths.ts → results.js / itinerary.js` — shipping-extension code;
  leave behind.
- `consumer-refraktor/test/loop.ts → refraktor-v2-backend/.../loop.ts` — proprietary
  production loop; re-author the driver seam instead.
- `oracle-webmcp/test/run.ts` (Part B) → `studies/reliability/*.mjs` — golden parity against
  the frozen proprietary kernel; leave behind.
- Reference tables `cafeQuoteMap` / `SURFACE` and all of `domain.ts` — proprietary demo
  vocabulary; ship only as anonymized sample fixtures, if at all.

## E. Never extract (the proprietary Selvage layer)

`enforce.ts`, `binding.ts`, `approval.ts` (the kernel); `studies/**`; the Refraktor
consumer / extension / backend loop; the café/textile authorization demos; the acceptance
harness. These are Phase V's concern and stay behind Selvage's boundary.
