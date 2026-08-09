# 05 — Attribution taxonomy

Attribution is the product. A report that says "test failed" is worthless; a report that says
"the failure belongs to the consumer execution bridge, not the provider" is something a
provider author, a model vendor, and a browser team can each act on. This document defines the
closed set of layers a failure can be charged to, and the rule for charging it.

## The prime invariant

> **A consumer-side failure must never be reported as provider nonconformance.**

The provider is on trial. Everything between the model's decision and the provider's execution
is the harness's own apparatus. When the apparatus fails, that is *our* fault to report as
such — not a mark against the provider. Fault isolation is what makes the word "conformance"
serious.

## The nine categories

A closed catalog per report version. Every non-PASS signal is charged to **exactly one**.

| Category | Owns failures in… | Example |
|---|---|---|
| `provider_definition` | The provider's static definition: schema, declared `effect`, tool naming, registration shape. | A tool declares `effect:'read'` but its schema implies mutation; a schema the contract forbids. |
| `provider_runtime` | The provider's own registration/runtime behavior on the page. | The provider throws during `registerTool`; duplicate/stale registration; the tool never appears in discovery though registration claimed success. |
| `browser_runtime` | The browser's WebMCP implementation itself. | `document.modelContext` absent when it should be present; `getTools()` returns malformed handles; runtime version regression. |
| `consumer_adapter` | The adapter's private steps: schema formatting, model invocation setup, response parsing, arg reconciliation. | `cleanSchemaForGemini` drops a required field; the parser mis-reads a tool call; reconciliation corrupts valid args. |
| `model_tool_selection` | The model choosing the wrong tool, or no tool, when the case expected one. | Model calls `find_item` when the task required `place_order`; `no_tool_selected`. |
| `model_arguments` | The model producing arguments that fail valid input validation. | Model omits a required field; sends the wrong type; `malformed_arguments` traced to the model, not the adapter. |
| `execution_bridge` | The common bridge failing to execute a valid decision. | Passing a name string where a `RegisteredTool` handle is required; failing to serialize args per the runtime contract. |
| `provider_execution` | The provider executing incorrectly given valid input. | Wrong side effect; success claimed without the effect; a state-changing tool that returns no confirmation. |
| `evidence_contract` | The provider returning execution evidence that violates the `ExecutionResult` contract. | `executed:true` with no `confirmationId`; malformed/absent structured result; unparimseable data. |

## Only four categories are provider nonconformance

This is the whole point. Of the nine, exactly **four** reflect on the provider — its
definition, its runtime behavior, its execution, and its evidence:

- `provider_definition`
- `provider_runtime`
- `provider_execution`
- `evidence_contract`

The other five (`browser_runtime`, `consumer_adapter`, `model_tool_selection`,
`model_arguments`, `execution_bridge`) are **environment or consumer** faults. A report must
never let one of those five degrade the provider's verdict. The provider-facing conformance
grade is computed **only** from the four provider-owned categories; the other five are reported
alongside, attributed to their own owners.

## The attribution decision rule

For any signal that is not `PASS`, walk the pipeline (§02) from the provider outward and assign
the **first** layer whose contract was violated:

1. Was the **provider definition** itself invalid (schema/effect/naming)? → `provider_definition`.
2. Did the **browser runtime** misbehave (absent/malformed surface)? → `browser_runtime`.
3. Did the **provider runtime** fail to register/expose the tool it claimed? → `provider_runtime`.
4. Did the **adapter** mis-format, mis-invoke, or mis-parse? → `consumer_adapter`.
5. Did the **model** pick the wrong/no tool? → `model_tool_selection`.
6. Did the **model** produce invalid arguments (adapter passed them faithfully)? → `model_arguments`.
7. Did the **bridge** fail to execute a valid decision? → `execution_bridge`.
8. Did the **provider execute** incorrectly given valid input? → `provider_execution`.
9. Did the provider execute but return **bad evidence**? → `evidence_contract`.

Because the execution bridge is adapter-independent (§02), steps 5–6 (the model's decision) are
cleanly separable from steps 7–9 (what happened when a valid decision ran) — the same decision,
executed by the same bridge, isolates model faults from execution and provider faults.

## The report says

The target sentence, now mechanically producible:

```
Provider:                  PASS
GPT adapter:               PASS
Claude adapter:            WARN   (malformed-schema handling)
Gemini adapter:            PASS
Browser runtime:           PASS
Consumer execution bridge: FAIL   (invalid RegisteredTool invocation)
```

Here the provider is PASS because none of the four provider-owned categories failed; the one
FAIL is charged to `execution_bridge`, and the one WARN to `consumer_adapter` (Claude path).
That is the difference between a diagnostic instrument and a red X.
