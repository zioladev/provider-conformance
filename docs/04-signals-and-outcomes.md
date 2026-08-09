# 04 — Signals and outcomes

The report separates two kinds of thing, and the separation is a first-class design rule:

> **Observed facts** are recorded raw. **Derived judgments** are computed from them.
> A future version may change how we interpret an observation without invalidating the
> underlying evidence.

This means every run stores the primary observations *and* the verdicts derived from them.
Re-scoring a stored run under new rules must never require re-executing it.

## Observed signals (facts)

Recorded per consumer path, per test case. These are what happened, not what it means.

| Signal | What is recorded |
|---|---|
| `tool_discovered` | Was the tool present in the normalized surface returned by discovery? (list of tool names + schemas as discovered) |
| `schema_accepted` | Did the adapter successfully format the tool's `inputSchema` into the model's tool format? (+ the formatted schema, + any normalization applied) |
| `model_decision` | The raw model response and the parsed `ConsumerDecision` (`tool_call` / `clarification` / `no_action` / `error`). The decision `type` is distinct from the derived `outcome` below — see the mapping in §03. |
| `normalized_arguments` | The arguments as the model emitted them, **and** (if repair ran) the reconciled arguments — both, separately. |
| `bridge_invoked` | Did the common execution bridge attempt execution? Against which tool, with which arguments. |
| `provider_execution` | What the surface did: which tool actually fired, and the `ExecutionResult` returned (per the Phase I contract). |
| `elapsed_ms` | Wall-clock timing, segmented where possible: model latency, bridge latency, provider latency. |
| `execution_result` | The returned structured `ExecutionResult` (`{ executed, confirmationId, data }` or `{ executed:false, error }`). |
| `errors` | Any error surfaced at any layer, with its origin, retained verbatim. |
| `runtime_context` | Runtime + browser identity (which lane, `document.modelContext` vs shim, browser version). |

## Derived judgments (computed)

Never stored as if primary; always computed from the observations above, and always
re-derivable.

| Judgment | Derived from |
|---|---|
| `outcome` | The outcome category (below), from `model_decision` + `bridge_invoked` + `provider_execution` + `errors`. |
| `signal_verdict` | `PASS` / `WARN` / `FAIL` per signal, against the case's expectations (§08). |
| `attribution` | The owning layer for any non-PASS signal (§05). |
| `divergence` | Cross-consumer divergence classification for the case (§07). |

`WARN` is first-class: behavior that is acceptable-but-notable (e.g. an unusual-but-valid
argument shape, a recoverable retry, a tolerated schema quirk) is a WARN, not a silent PASS
and not a FAIL.

## The outcome vocabulary

The single most important anti-pattern to avoid: collapsing many distinct situations into one
blunt `not_executed`. Our own prior study proved "no provider call" can mean at least seven
different things. The outcome of a run is exactly one of:

| Outcome | Meaning | Typical attribution (§05) |
|---|---|---|
| `executed` | The decision ran and the provider executed it. | (success — or `provider_execution` if evidence is wrong) |
| `blocked_by_provider_contract` | The provider surface legitimately refused (e.g. read tool asked to change state, contract violation). | `provider_definition` / `provider_execution` (correct behavior) |
| `clarification` | The model asked a reasonable clarifying question instead of calling a tool. | none (legitimate non-action — §07) |
| `no_tool_selected` | The model produced no tool call and no clarification. | `model_tool_selection` |
| `malformed_arguments` | A tool call was made but arguments failed the provider's input validation. | `model_arguments` (or `consumer_adapter` if the adapter corrupted valid args) |
| `adapter_error` | The adapter's own logic failed (formatting, parsing). | `consumer_adapter` |
| `runtime_error` | The runtime/browser surface failed independent of the provider. | `browser_runtime` / `provider_runtime` |
| `transport_error` | The call to the model provider (network/API) failed. | `transport_error` |
| `execution_bridge_error` | The bridge failed to invoke a valid decision (e.g. invalid `RegisteredTool` handling). | `execution_bridge` |
| `provider_error` | The provider executed but errored, or returned malformed/absent evidence. | `provider_execution` / `evidence_contract` |

Two rules govern this vocabulary:

1. **No collapsing.** A harness that reports `malformed_arguments`, `no_tool_selected`,
   `transport_error`, and `execution_bridge_error` all as "failed" is useless for the one job
   Phase II exists to do. Each is distinct and separately attributed.
2. **Extensible, not open-ended.** The list is a closed catalog per report version. New
   outcomes require a report-version bump (§06), so consumers can rely on the set.

## Narration is evidence, not score

The model's prose is retained under `model_decision.raw` as optional evidence. It is available
for humans and future analysis. It is **never** an input to `outcome`, `signal_verdict`,
`attribution`, or `divergence`. Phase II scores tool selection, arguments, execution, and
provider evidence — never language.
