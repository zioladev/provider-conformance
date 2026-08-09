# 13 — Golden report fixtures

Before the report engine grows a second adapter, it must be pinned to a small set of synthetic
cases whose **correct attribution is known in advance**. These golden fixtures are the
regression truth: every future change to the report engine — new adapter, new outcome, refactor
— must reproduce their attributions exactly, or it is a regression. Without them, Phase II
becomes philosophically unstable as adapters accumulate: the taxonomy drifts and nobody notices.

## What a golden fixture is

A fully-frozen case (§08) plus its **expected report projection**: the outcome, the per-signal
verdicts, and — the point — the **attribution owner** for each non-PASS. The inputs are
synthetic and deterministic (no live model call needed; the model decision is scripted, in the
spirit of the existing scripted-adapter fixtures), so the fixture isolates the *report engine's*
logic from model non-determinism entirely.

A golden fixture asserts on the **derived** layer (outcome + verdict + attribution) given a
fixed **observed** layer. It is the unit test of the measurement language itself.

## The starting set (lock these in 2A)

Six cases, one per attribution truth, covering each provider-owned category plus the
divergence-is-not-failure case:

| # | Scenario (scripted observed facts) | Expected outcome | Expected attribution |
|---|---|---|---|
| G1 | Provider tool declares a schema the contract forbids (or `effect` contradicts the schema). | fails at definition | `provider_definition` |
| G2 | Provider schema is valid; the adapter's formatter drops a required field (mangled schema). | `malformed_arguments` / schema signal fails | `consumer_adapter` |
| G3 | Adapter faithfully passes a valid schema; the model emits arguments missing a required field. | `malformed_arguments` | `model_arguments` |
| G4 | A valid `tool_call` decision; the bridge invokes the wrong handle (name string instead of `RegisteredTool`). | `execution_bridge_error` | `execution_bridge` |
| G5 | Provider executes but returns evidence that violates the result contract (`executed:true`, no `confirmationId`). | `provider_error` | `evidence_contract` (or `provider_execution` per the exact rule) |
| G6 | Two paths (e.g. GPT + Claude) both conform but select *different valid tools*, both within the case's allowable set. | `executed` (both) | **none** — `behavioral` divergence, **not** a failure |

G6 is the load-bearing one: it encodes *divergence ≠ failure* (§07) as a permanent regression
guard, so no future change can quietly turn "the models chose differently" into a red X.

## Rules

- **Attribution truth is authored, never inferred.** Each fixture's expected owner is decided by
  a human from the scenario, before any engine runs — the same discipline as declared allowable
  outcomes (§08). Fixtures encode what *should* happen, not what the current engine *does*.
- **Cover every provider-owned category at least once.** `provider_definition`,
  `provider_runtime`, `provider_execution`, `evidence_contract` must each appear, so the
  four-category provider grade (§05) is exercised end to end. (G1/G5 cover two; add a
  `provider_runtime` case — e.g. a tool that registration claims but discovery never surfaces —
  and a clean `provider_execution` mismatch to complete the set.)
- **Cover the non-provider categories too.** `consumer_adapter` (G2), `model_arguments` (G3),
  `execution_bridge` (G4); add `browser_runtime`, `model_tool_selection`, and `transport_error`
  as the engine matures.
- **Golden fixtures gate CI.** They run in the reference lane (§09), deterministically, on every
  change. A diff in any expected attribution fails the build.
- **Version with the report.** When `provider-conformance-report/N` bumps, the golden
  projections are re-frozen against the new version — deliberately, as part of the version bump,
  never silently.

## Why this belongs in 2A

The report pipeline (§06) and its attribution logic (§05) are the spine. Locking the golden
fixtures *as part of 2A* means the spine is nailed down before breadth is added in 2B/2C — so
when the second and third adapters arrive, "did we preserve the attribution truths?" is a
mechanical check, not a judgment call. This is the single cheapest insurance against the
taxonomy quietly rotting.
