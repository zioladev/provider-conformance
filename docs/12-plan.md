# 12 — Implementation plan

Four milestones, each with a **single success criterion** so we don't wander. The ordering is
deliberate: the report contract and one full path first, then the machinery that makes the
phase's distinguishing feature real.

## Milestone 2A — One provider, one adapter, complete report pipeline

Prove the *spine* end to end before adding breadth.

**Build:**
- The package skeleton (`@zioladev/provider-conformance`, Apache-2.0, TS → ESM + `.d.ts`,
  zero `@selvage/*` imports).
- `NormalizedTool` + the `ModelConsumerAdapter` contract (§03); one adapter (start with the one
  whose extraction is cleanest).
- The common execution bridge (§02) against the **reference-runtime lane** (§09).
- The full report pipeline: observed signals → derived judgments → attribution → the
  `provider-conformance-report/1` JSON (§06) + the human renderer.
- One frozen fixture case (§08) against an anonymized sample provider surface.
- **The golden report fixtures locked (§13)** — the synthetic cases with known-correct
  attribution, gating CI in the reference lane. The spine is nailed down before breadth is added.

**Success criterion:** *we can produce a machine-readable conformance report for one provider
through one consumer path, with correct per-signal attribution — and the golden fixtures pin
those attribution truths as regression guards.*

## Milestone 2B — Second adapter, divergence machinery proven

Introduce the comparison and the guardrails.

**Build:**
- A second `ModelConsumerAdapter`.
- The divergence detector (§07): observable-outcome canonicalization, the behavioral / outcome
  / conformance classification, checked against each case's **declared allowable outcomes**.
- Fixture support for `allowableOutcomes` and reset-per-path provider state.
- Report support for the `divergence` block + multi-path cases.

**Success criterion:** *the report correctly classifies a case where two consumer paths produce
different observable outcomes — distinguishing `behavioral` (both allowable) from `outcome`
(one out of set) from `conformance` (provider-owned), and attributing each correctly.* This is
where **divergence ≠ failure** must demonstrably hold.

## Milestone 2C — GPT + Claude + Gemini against the same provider surface

Breadth to the full starting set, on the real runtime.

**Build:**
- All three model adapters unified (one implementation per family — no more three-copy drift).
- The **acceptance lane** (§09): the same bridge + report against real `document.modelContext`
  in a WebMCP-enabled Chrome, with real `browserVersion` provenance and the honesty rule
  enforced (no shim results labeled as browser conformance).
- Repeated-run support so residual model non-determinism is distinguishable from genuine
  divergence (§08).

**Success criterion:** *the same provider surface is exercised through GPT, Claude, and Gemini
on the real runtime, and the report compares all three paths with attribution and divergence
classification.*

## Phase II complete

**Success criterion (the phase gate):** *a machine-readable conformance report comparing all
three tested consumer paths for one provider, with fault attribution and behavioral/outcome/
conformance divergence — runnable locally, with an acceptance-lane run on a real WebMCP Chrome.*

The Phase I-style external test still applies as the north-star: **strangers can `npm install
@zioladev/provider-conformance` and produce a report for their own provider** across the
supported paths.

## Deliverables (package furniture, per Phase I precedent)

- `README` (what it is + quickstart: run a report for a sample provider).
- `docs/` (this spec, plus getting-started, writing-a-fixture, reading-a-report,
  adding-an-adapter, the two lanes).
- Apache-2.0 `LICENSE` + `NOTICE`; `CHANGELOG`, `SECURITY`, `CONTRIBUTING`.
- CI (Node 22.x + 24.x, matching Phase I) running the reference lane + typecheck + build.
- The versioned report schema published as a first-class artifact (JSON Schema for
  `provider-conformance-report/1`).
- `RELEASE-CHECKLIST` reusing the trusted-publishing path proven in Phase I.

## Explicit non-goals for Phase II (guardrails, restated)

- No journey/itinerary state, provider transitions, or cross-provider handoff (Phase III).
- No hosted/scheduled matrix, regression tracking, or alerting (Phase VI).
- No Selvage governance (Phase V; optional module on top, never a dependency).
- No narration/language scoring, ever.
