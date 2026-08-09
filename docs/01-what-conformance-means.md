# 01 — What "conformance" means (and what it does not)

## The question Phase II answers

> Given a provider built against the [provider contract](../provider-kit/), does its surface
> behave in a **well-characterized way** across independent consumer/model paths — and when
> something goes wrong, **which layer owns the failure**?

"Well-characterized" is the operative phrase. Phase II does not certify that a provider is
"good." It produces a **trustworthy, attributable observation**: for each test case and each
consumer path, what was discovered, what was decided, what was executed against the surface,
what evidence came back, how long it took, and — when an expectation is not met — the single
layer responsible.

## What Phase II is *not*

- **Not "which model is best."** The comparison across GPT / Claude / Gemini exists to reveal
  whether *the same provider surface* produces materially different execution behavior across
  consumers — an **interoperability signal**, not a leaderboard. A path where the model asks a
  reasonable clarifying question is not "worse" than one that calls a tool (see §07,
  *divergence ≠ failure*).
- **Not a model-consistency checker.** If we scored providers by how *identically* models
  behaved, we would quietly become a benchmark of model agreement. We score providers by
  whether their surface is conformant; we *report* divergence descriptively.
- **Not a language/narration judge.** Model narration ("Sure, I'll book that for you…") is
  captured as optional evidence and **never** affects provider conformance. Phase II cares
  about tool selection, arguments, execution, and provider-side evidence — not prose. This
  keeps the judge-dependent language layer permanently out of the scoring path.

## The wall: conformance vs. interoperability

This is the most important boundary in the phase, because without it Phase II slowly absorbs
Phase III and we wake up with itinerary state hiding inside a conformance package.

> **Provider conformance is a prerequisite for interoperability, not interoperability itself.**

| | Phase II — Provider Conformance | Phase III — Multi-Provider Runtime |
|---|---|---|
| Asks | Does *one* provider surface behave in a well-characterized way across consumer/model paths? | Can *multiple* conforming providers participate in *one continuous journey*? |
| Scope of a run | One provider, one task, N consumer paths | Provider A → B → C → D, journey state, transitions |
| Owns | Discovery, schema, invocation, evidence, attribution, single-provider divergence | Itinerary state, provider transitions, active-page discovery, passing outputs forward, recovery |
| Explicitly **out of scope** | **Journey state. Provider transitions. Cross-provider handoff. Retry/recovery orchestration.** | (These are its whole job) |

Concretely, the following belong to Phase III and **must not** appear in
`@zioladev/provider-conformance`: any notion of "next provider", itinerary/journey objects,
cross-page navigation sequencing, or passing one provider's output into another provider's
input. Phase II runs a single provider surface. Full stop.

## Why this framing is load-bearing

Phase II's durable output is a report that can say:

> *Provider X passes registration, discovery, invocation, and evidence. Under the Claude path
> it diverges on malformed-schema handling (WARN). The one failure observed belongs to the
> **consumer execution bridge**, not to the provider.*

That sentence is only possible if three things are true, and each is a design constraint the
rest of the spec enforces:

1. The **provider surface is held constant** across consumer paths (same-surface invariant, §02).
2. Failures are **attributable to a single layer** (taxonomy, §05).
3. "Same task" is **actually the same** (fixture discipline, §08).

Get those right and the report becomes something provider authors, browser vendors, model
vendors, standards people, and eventually paying customers can all reason about with the same
words. That shared vocabulary — not any individual adapter — is the product.
