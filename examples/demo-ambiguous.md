```
# Provider conformance report
Provider: @example/sample-cafe
Report: provider-conformance-report/1 (generator @zioladev/provider-conformance@0.1.0)
Lane: reference-runtime/1
Provider grade: PASS

## Case: coffee-clarify-vs-fabricate  (task order-coffee-underspecified/1)
Behavioral divergence: outcome (within allowable: false)
Representational difference: yes
Strategies: scripted-clarify=deferred, anthropic-claude=acted

--- scripted-clarify (scripted/deterministic) ---
Provider: PASS
Disposition: deferred
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Provider Execution: NOT REACHED

Outcome: clarification
Finding: none
Provider nonconformance: false

--- anthropic-claude (claude-opus-4-8) ---
Provider: PASS
Disposition: acted
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Model Tool Selection: PASS
Model Arguments: FAIL
Execution Bridge: PASS
Provider Execution: PASS
Evidence Contract: PASS

Outcome: executed
Finding:
  executed a state-changing tool using a required value the task did not supply while the provider declares no default
Provider nonconformance: false

## Case: coffee-clarify-vs-defer  (task order-coffee-underspecified/1)
Behavioral divergence: none
Representational difference: yes
Strategies: scripted-clarify=deferred, scripted-noinfo=deferred

--- scripted-clarify (scripted/deterministic) ---
Provider: PASS
Disposition: deferred
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Provider Execution: NOT REACHED

Outcome: clarification
Finding: none
Provider nonconformance: false

--- scripted-noinfo (scripted/deterministic) ---
Provider: PASS
Disposition: deferred
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Provider Execution: NOT REACHED

Outcome: no_tool_selected
Finding: none
Provider nonconformance: false

## Case: coffee-defer-vs-inspect  (task order-coffee-underspecified/1)
Behavioral divergence: outcome (within allowable: false)
Representational difference: yes
Strategies: scripted-clarify=deferred, openai-gpt=inspected

--- scripted-clarify (scripted/deterministic) ---
Provider: PASS
Disposition: deferred
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Provider Execution: NOT REACHED

Outcome: clarification
Finding: none
Provider nonconformance: false

--- openai-gpt (gpt-4o-mini) ---
Provider: PASS
Disposition: inspected
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Model Tool Selection: FAIL
Model Arguments: PASS
Execution Bridge: PASS
Provider Execution: PASS
Evidence Contract: PASS

Outcome: executed
Finding:
  selected an exploratory read tool that was outside the allowable terminal outcomes for this test case
Provider nonconformance: false

```
