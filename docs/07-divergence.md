# 07 — Divergence

Divergence is Phase II's distinguishing signal: proof that *the same provider surface* can
produce *materially different execution behavior* across consumer/model paths. It is also the
easiest thing to get subtly, uselessly wrong — so its definition is precise and its
consequences are deliberately narrow.

## The predicate

> **Divergence** = *same provider definition* + *same task* → **materially different observable
> execution outcome** across consumer/model paths.

Three qualifiers do the work:

- **Same provider definition** — enforced by `providerDefHash` and the same-surface invariant
  (§02). The provider is held constant; only the consumer path varies.
- **Same task** — enforced by fixture discipline (§08). If "same task" is not actually the
  same, a divergence claim is meaningless.
- **Materially different *observable* outcome** — computed over **provider-side evidence
  only**: which tool fired, the normalized arguments as executed, and the resulting
  `ExecutionResult`. Explicitly **not** over narration, tool-call wording, or phrasing.

## What is NOT divergence

- Different prose, explanations, or tone. (Narration is excluded from scoring entirely — §01,
  §04.)
- Different tool-call *ids* or serialization details that don't change the executed effect.
- A model taking a different but outcome-equivalent path (e.g. calling a read tool first) when
  the executed result is the same.

The comparison key is the **observable outcome**, e.g. `executed:place_order` +
canonicalized arguments + `ExecutionResult` shape — not the transcript.

## Divergence ≠ failure

The most important guardrail. Divergence is **descriptive, not automatically a failure.**

> Different ≠ wrong.

Example: on a task with an ambiguous quantity, GPT calls `place_order` with a default while
Claude returns a `clarification`. That is divergent behavior — and, depending on the case's
declared allowable outcomes (§08), **both may be legitimate.** A harness that marked this a
failure would quietly become a *model-consistency checker*, which is not what we are building.

So divergence is classified, not scored as pass/fail on its own:

| Kind | Definition | Verdict effect |
|---|---|---|
| `none` | All paths produce the same observable outcome. | — |
| `behavioral` | Paths differ in behavior, but **all outcomes are within the case's declared allowable set**. | Recorded, not a failure. Often the *interesting* signal. |
| `outcome` | Paths produce different observable outcomes, and **at least one is outside** the allowable set. | The out-of-set path(s) FAIL and are attributed (§05); divergence flagged. |
| `conformance` | Divergence traceable to a **provider-owned** category (§05) — the provider's surface behaves differently depending on who calls it. | Provider nonconformance. The strongest, rarest, most valuable finding. |

`conformance` divergence is the crown jewel: it means the *provider* — not the model — is the
source of cross-consumer inconsistency. That is precisely the interoperability defect Phase III
would otherwise trip over, caught early and attributed correctly. The principle, stated once so
it survives every future edit:

> **Conformance divergence is evidence that interoperability depends on the consumer path, not
> merely the provider surface.**

The interesting event is never "two models behaved differently." It is when the *same supposedly
interoperable provider surface* becomes valid under one consumer path and invalid under another.

## How it is computed

For each case:

1. Reduce every path's provider-side evidence to a canonical **observable-outcome key**
   (fired tool + canonicalized args + result shape).
2. If all keys are equal → `none`.
3. If keys differ, check each path's outcome against the case's **declared allowable outcomes**
   (§08):
   - all within allowable → `behavioral`;
   - some outside → `outcome`, and the offending paths FAIL + attribute.
4. If any divergence is attributable to a provider-owned category → escalate to `conformance`.

Canonicalization (step 1) reuses the *idea* of the existing `compareTerms`/`INVALID` primitive
(a field that can't be normalized never counts as a match) — re-authored into the package, not
imported from `@selvage/core`.

## Two levels: representational vs. behavioral

Not every difference in observable outcome is a difference in *behavior*. A live run surfaced
the case that makes this precise: a scripted baseline emitted a structured `clarification`
while real Claude returned a text-only turn — which the adapter maps to `no_tool_selected`
(we never upgrade text to "clarification" without a judge layer; see below). Different
labels, but the **same practical result**: neither acted; both deferred.

So divergence is scored at two levels:

- **Representational difference** — do the fine-grained observable keys differ?
  (`clarification` vs `no_tool_selected`, or `executed:place_order(M)` vs `…(L)`.) Reported,
  but not by itself meaningful.
- **Behavioral divergence** (`kind`) — scored over a higher-order **action disposition**:

  | Disposition | Meaning |
  |---|---|
  | `acted` | a **state-changing** tool executed (fired tool + args matter — ordering M vs L *is* behavioral) |
  | `inspected` | a **read-only** tool executed — the model interrogated the provider without changing state |
  | `deferred` | no provider tool executed (`clarification`, `no_tool_selected`, `blocked_by_provider_contract`) |
  | `failed` | the path failed before/during execution (`malformed_arguments`, `*_error`, `provider_error`) |

  Two paths that both `deferred` show **no behavioral divergence** even when their labels
  differ. This protects `different ≠ wrong` — there, different does not even mean behaviorally
  different. But `deferred` and `inspected` are **not** the same: a live run had Claude ask the
  user (`deferred`) while GPT ran a read against the provider (`inspected`) — two genuinely
  different strategies (*resolve ambiguity socially* vs. *informationally*), neither changing
  state, provider PASS. The report names both: *strategy divergence: deferred vs inspected.*

  **A read is not free-pass "progress".** An `inspected` outcome that is outside a case's frozen
  allowable set is still a task-conformance finding (attributed to `model_tool_selection` — the
  *tool choice* is the mismatch, nothing was fabricated). Whether an exploratory read is a valid
  *intermediate step* toward a later commit is a **trajectory** question — measuring a journey,
  not a single decision — and belongs to **Phase III** (`inspect → decide → commit`). Phase II
  measures single decisions and must not smuggle multi-step progress in: for Phase II the rubric
  says *terminal response expected; an exploratory read is outside allowable terminal outcomes.*

For `acted`, the fired tool and canonicalized args are part of the behavioral key, so
genuinely different actions (a different tool, a different size) remain real behavioral
divergence. The disposition layer collapses only *labels*, never *effects*.

### Narration is never inferred

The deterministic layer stops at what it can observe: a text-only model turn is
`no_tool_selected` ("no tool selected; no provider execution attempted"), **not**
`clarification` — even if a human reading the text would call it a clarifying question.
Upgrading it would contaminate the clean deterministic boundary with semantic interpretation.
If a language/judge layer is ever wanted, it is a **separate channel with a separate metric**,
never folded into conformance scoring.

## Why this matters for the roadmap

Without the `behavioral` vs `outcome` vs `conformance` split, the harness produces a single
undifferentiated "they disagreed" bit — noise. With it, the report can say *which* disagreements
are benign, which break the task, and which are the provider's fault. That is the difference
between an interoperability instrument and a diff tool.
