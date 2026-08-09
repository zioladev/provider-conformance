# 06 — The report schema

The report is the spine of Phase II. It is a **versioned, machine-readable contract** that any
populator (an adapter, a runtime lane, later a hosted service) emits, and that any consumer (a
human renderer, a CI gate, the Phase IV qualifier) reads. No such generator exists in the
current codebase — this is designed here, from scratch. The `selvage-receipt/2` object is a
shape reference for provenance, nothing more.

## Design rules

1. **Versioned.** `reportVersion: "provider-conformance-report/1"`. The outcome vocabulary
   (§04) and attribution catalog (§05) are closed *per version*. New categories → version bump.
2. **Observed and derived are separate branches** (§04). Every derived judgment is
   re-computable from the observed facts stored beside it. A re-score never re-runs.
3. **Provenance makes "same" a fact, not an aspiration.** Enough identity that six months from
   now we can compare *same case, same provider, different model/runtime* with certainty —
   including the **identity of the report generator itself**, so a change in the engine that
   produced a grade is never invisible.
4. **Attribution is mandatory on every non-PASS.** No verdict without an owner.
5. **No journey state.** Nothing in the report references "next provider", itinerary, or
   cross-provider handoff (§01). One provider per report.
6. **Field names are not cute.** Be annoyingly literal. This report is the contract the rest of
   the stack builds on (Phase IV qualifies against it; Phase VI stores, compares, schedules, and
   sells it); a clever name today is a migration tomorrow.

## Provenance identifiers

Carried on every run so comparisons are exact:

| Field | Meaning |
|---|---|
| `caseId` | Stable id of the frozen test case (§08). |
| `taskId` | Stable id of the task text/intent (a case may reuse a task across providers). |
| `providerDefHash` | Hash of the provider's static definition (tools + schemas + effects). |
| `toolSurfaceHash` | Hash of the normalized tool surface actually discovered at run time. |
| `adapterId` / `adapterVersion` | Which consumer adapter, and its code version. |
| `modelId` | The exact model (e.g. `gpt-5`, `claude-opus-4-8`, `gemini-2.5-pro`). |
| `runtimeId` | Which lane/runtime (`reference-runtime/1` or `chrome-webmcp`). |
| `browserVersion` | Real browser build when in the acceptance lane; `null` in the reference lane. |
| `modelParams` | Controllable params captured for reproducibility (e.g. `temperature:0`). |
| `reportGenerator` / `reportGeneratorVersion` | Identity + version of the engine that produced this report. A grade is only meaningful paired with the code that computed it. |

`providerDefHash` vs `toolSurfaceHash` is deliberate: the first is what the provider *declared*;
the second is what the runtime *exposed*. A mismatch is itself an observation (often
`provider_runtime` or `browser_runtime`).

## Shape (illustrative)

```jsonc
{
  "reportVersion": "provider-conformance-report/1",
  "reportGenerator": "@zioladev/provider-conformance",
  "reportGeneratorVersion": "0.1.0",
  "generatedAt": "<ISO-8601>",
  "provider": {
    "name": "@example/cafe-provider",
    "providerDefHash": "sha256:…",
    "declaredTools": [ { "name": "place_order", "effect": "state-changing", "inputSchema": {…} } ]
  },
  "lane": { "runtimeId": "chrome-webmcp", "browserVersion": "146.0.7xxx", "toolSurfaceHash": "sha256:…" },

  "cases": [
    {
      "caseId": "order-happy-path/1",
      "taskId": "order-latte-oat/1",
      "paths": [
        {
          "adapterId": "anthropic-claude",
          "adapterVersion": "1.0.0",
          "modelId": "claude-opus-4-8",
          "modelParams": { "temperature": 0 },

          "observed": {
            "tool_discovered": { "present": true, "names": ["place_order","find_item"] },
            "schema_accepted": { "ok": true, "normalizationApplied": [] },
            "model_decision": { "type": "tool_call", "toolName": "place_order",
                                "rawArguments": {…}, "raw": "…narration…" },
            "normalized_arguments": { "emitted": {…}, "reconciled": null },
            "bridge_invoked": { "attempted": true, "toolName": "place_order", "arguments": {…} },
            "provider_execution": { "firedTool": "place_order",
                                    "executionResult": { "executed": true, "confirmationId": "ORDER-1562", "data": {…} } },
            "elapsed_ms": { "model": 812, "bridge": 4, "provider": 21, "total": 837 },
            "errors": []
          },

          "derived": {
            "outcome": "executed",
            "signalVerdicts": { "tool_discovered": "PASS", "schema_accepted": "PASS",
                                "model_decision": "PASS", "provider_execution": "PASS",
                                "evidence_contract": "PASS" },
            "attribution": []
          }
        }
        /* … one entry per adapter/model path … */
      ],

      "divergence": {
        "kind": "none",                       // none | behavioral | outcome | conformance (§07)
        "observedOutcomeKey": "executed:place_order",
        "byPath": { "openai-gpt": "executed:place_order",
                    "anthropic-claude": "executed:place_order",
                    "google-gemini": "executed:place_order" },
        "withinAllowable": true
      }
    }
  ],

  "summary": {
    "provider": "PASS",                       // computed ONLY from provider-owned categories (§05)
    "byLayer": {
      "provider_definition": "PASS", "provider_runtime": "PASS",
      "provider_execution": "PASS", "evidence_contract": "PASS",
      "browser_runtime": "PASS",
      "openai-gpt": "PASS", "anthropic-claude": "WARN", "google-gemini": "PASS",
      "execution_bridge": "PASS"
    },
    "notes": [ { "layer": "anthropic-claude", "verdict": "WARN",
                 "signal": "schema_accepted", "detail": "malformed-schema handling" } ]
  }
}
```

## The human rendering

A deterministic renderer turns the JSON into the qualification-style panel (§05's target
sentence) plus a per-case divergence view. The renderer is a *pure function of the report* —
it invents nothing. This keeps a single source of truth: the JSON is authoritative; the
human view is a projection.

## Relationship to Phase IV

The Phase IV "qualification report" is this report, aggregated across a tested configuration
matrix and stamped with a qualification statement:

> *Provider X passes registration, discovery, invocation, evidence, and — in Phase IV —
> cross-provider handoff, under the tested Chrome/runtime/model configurations.*

Designing the schema as a stable contract now is what lets Phase IV *aggregate* rather than
*redefine*. `provider-conformance-report/1` is the atom; the qualification report is the
molecule.
