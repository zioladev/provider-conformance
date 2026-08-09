# 08 — Fixture discipline

Everything in Phase II rests on one claim: that a comparison across consumer paths is a
comparison of *the same thing*. If "same task" is only approximately the same, every verdict
and every divergence finding is unfounded. So "the same task" is not an intention — it is a
**frozen artifact**.

## The rule

> For every comparison case, freeze the inputs so that the only variable across paths is the
> **consumer adapter** (and, in the acceptance lane, the runtime).

A case is not runnable until all of the following are pinned and hashed.

## What is frozen in a case

| Frozen input | Why it must be pinned | Recorded as |
|---|---|---|
| **Task text / intent** | The prompt the model receives must be byte-identical across paths. | `taskId` |
| **Provider definition** | Same tools, schemas, declared effects. | `providerDefHash` |
| **Tool surface** | The normalized surface presented to every adapter is identical. | `toolSurfaceHash` |
| **Provider state** | The provider's starting state (inventory, availability, prior orders) is reset to a known point before each path. | part of the fixture |
| **Declared allowable outcomes** | The set of outcomes that count as legitimate for this case — the yardstick divergence (§07) is measured against. | `allowableOutcomes` |
| **Model parameters (where controllable)** | `temperature:0` and any other pinnable knobs, per model. | `modelParams` |
| **Runtime version** | In the acceptance lane, the exact browser/runtime build. | `runtimeId` / `browserVersion` |

## Declared allowable outcomes

This is the fixture's most consequential field and the one that makes *divergence ≠ failure*
(§07) operational. Each case declares, up front, the set of outcomes that are legitimate for
it. Examples:

- A fully-specified order task: `allowableOutcomes: ["executed:place_order(latte,oat)"]` —
  exactly one right answer; anything else is `outcome` divergence and a FAIL.
- An ambiguous-quantity task: `allowableOutcomes: ["executed:place_order(...)", "clarification"]`
  — both calling with a sensible default *and* asking for clarification are acceptable; the two
  paths are `behavioral` divergence, recorded but not failed.

Declaring allowable outcomes is a **human authoring decision made before the run**, never
inferred from what the models happened to do. Inferring the yardstick from the results is how a
conformance system silently degrades into "whatever the models agreed on is correct."

## Determinism techniques (reused, re-authored)

The existing `material-terms.ts` fixtures demonstrate the technique we carry over: **queued,
deterministic provider responses** so state can be injected reproducibly between calls (read #1
= initial disclosure; read #2 = a changed value), asserting on an observable like commit count.
We reuse the *technique* — deterministic, queue-driven provider stubs with reset-per-path state
— re-authored into the package with no `@selvage/*` import, and repurposed from term-drift
(governance) to provider-surface conformance.

## Non-determinism we cannot freeze

Models are not fully deterministic even at `temperature:0`. Fixture discipline reduces variance
to the model's own residual; it does not eliminate it. The report therefore treats a single
run as one observation, and the plan (§12) allows repeated runs per path so residual model
variance can be distinguished from genuine divergence. What we *can* freeze — task, provider,
surface, state, allowable outcomes, params, runtime — we freeze and hash; what we cannot, we
measure and disclose, never hide.

## Underspecified fixtures and the "no fabrication" rule

The most revealing fixtures are deliberately *underspecified* — they invite legitimate
cross-consumer variation. For a task like *"Order a coffee."* the allowable set is frozen
**a priori**, and it is tied to what the provider surface actually exposes:

- **Legitimate**: a `clarification` (ask for the missing detail), or `no_tool_selected` (no
  action when required information is genuinely unavailable). And — *only if the provider
  declares a default for the missing field* — executing with that default.
- **Invalid**: executing with a **self-chosen** value when the provider declares **no**
  default (fabrication); malformed arguments; the wrong tool; anything the schema rejects.

This is enforced by a **task-conformance** check (§05): a clean terminal response outside the
frozen allowable set is charged to a **consumer-side** category — a fabricated execution to
`model_arguments`, an illegitimate clarify/no-action to `model_tool_selection` — and **never**
moves the provider grade. Whatever a real model happens to do is recorded as **observation**,
measured against the pre-frozen rubric; the rubric is never rewritten around the model's
behavior. A run where several consumers *agree* on a fabrication is `none` divergence **and**
several `model_arguments` faults: "no disagreement, but everyone fabricated; the provider is
fine."

## The invariant, restated

If two paths produce different observable outcomes, fixture discipline guarantees that the
difference originates in the **consumer path**, not in a drifting task, a mutated provider
state, or an unpinned parameter. That guarantee is the precondition for §05 (attribution) and
§07 (divergence) to mean anything at all.
