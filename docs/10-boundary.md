# 10 — Boundaries

Two boundaries protect Phase II: the **open/paid** line (what ships in the package vs. what is
the Phase VI service) and the **clean-room** line (what may never cross from the proprietary
Selvage layer). Both are load-bearing for the commercial and legal shape of the whole roadmap.

## Open vs. hosted

`@zioladev/provider-conformance` is open (Apache-2.0) and runs on one machine. The recurring,
at-scale matrix is the paid Phase VI service. The split:

| Open — in the package | Paid — Phase VI hosted service |
|---|---|
| The `ModelConsumerAdapter` contract + GPT/Claude/Gemini adapters | Cross-model execution *at scale*, on a schedule |
| The common execution bridge + reference-runtime lane | A hosted **browser matrix** (many real builds) |
| The report schema, attribution taxonomy, divergence detector | Regression testing across time; version tracking |
| Local single-provider, single-machine runs (incl. an on-demand acceptance lane) | Interoperability runs (Phase IV), CI gating, alerting when Chrome/model behavior changes |
| Examples, docs, fixtures | Qualification reports as a service |

The design rule that makes this split clean: the package produces the **atom** (one
`provider-conformance-report/1`), and the hosted service **aggregates and schedules** it. The
service never needs a different report format or a private fork of the logic — it runs the open
machinery more, on more configurations, over time. Open stays genuinely useful; paid is
"someone will pay to avoid running and maintaining the matrix themselves" (Phase VI's success
criterion), not a paywall on core function.

## The clean-room boundary (Selvage)

Phase II extracts *generalizable consumer-conformance machinery* and **nothing** of Selvage's
governance layer. This is both an architectural and a licensing boundary.

**Absolute rule — total build/runtime independence:**

> **No runtime dependency, development dependency, type-only import, generated artifact,
> fixture, or source path from `@selvage/*` (or the Refraktor extension) may be required for
> `@zioladev/provider-conformance` to build, test, or execute.**

This is stronger than "don't import the kernel." A type-only import, a copied generated file, a
shared fixture, or a build that reaches into a Selvage path would all quietly make Selvage a de
facto dependency of the open package — exactly what we are preventing. Patterns can be
reimplemented; publicly documented behavior can be reproduced; empirical lessons carry over. But
the open package must **stand alone**: clone it with no access to any `@selvage/*` repo and it
still builds, tests, and runs. A CI check should assert the absence of any `@selvage`
import/path so the boundary can't erode silently.

Stays out, permanently:

- The enforcement kernel — `enforce.ts` (`wrapExecuteTool`), `binding.ts`, `approval.ts`.
- Selvage's `ConsumerAdapter` (the enforcement host seam), `mountSelvage`, receipts/approval.
- The frozen `.mjs` reference kernel and the `studies/**` evidence corpus.
- The Refraktor consumer/extension/backend loop; the café/textile authorization demos.

Comes across (re-authored, no proprietary import):

- The `ModelAdapter` → public `ModelConsumerAdapter` generalization + GPT/Claude/Gemini logic.
- `cleanSchemaForGemini` and tool-call parsing / `reconcileArgs`.
- The `document.modelContext` bridge logic from `bridge.js`.
- The canonical-compare *idea* (`compareTerms`/`INVALID`) for divergence canonicalization.
- The deterministic queued-fixture *technique*; anonymized sample provider surfaces.

## Why the boundary is strategic, not just tidy

The public stack must stay clean so that:

1. **Governance logic never leaks into open tooling.** Selvage decides *whether a consequential
   step is allowed to become real*; conformance decides *what a provider's surface does*. Phase
   V brings Selvage in as an **optional governance module on top** of a stable interoperability
   runtime — it is not a dependency of, and does not appear in, the open conformance package.
2. **The open package can be adopted by anyone** — including parties who will never touch
   Selvage — which is what makes the conformance report a candidate shared vocabulary for
   standards, browser, and model people (§01).

The separation to keep repeating, because the whole roadmap depends on it:

> **Interoperability decides what happens next. Selvage decides whether a consequential step is
> allowed to become real.** Phase II lives entirely on the first side of that line.
