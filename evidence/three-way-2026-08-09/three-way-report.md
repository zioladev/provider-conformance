```
# Provider conformance report
Provider: @example/sample-cafe
Report: provider-conformance-report/1 (generator @zioladev/provider-conformance@0.1.0-alpha.3)
Lane: reference-runtime/1
Provider grade: PASS

## Case: live-specified  (task order-latte-M/1)
Behavioral divergence: none
Representational difference: no
Strategies: scripted-baseline=acted, anthropic-claude=acted, openai-gpt=acted, google-gemini=acted

--- scripted-baseline (scripted/deterministic) ---
Provider: PASS
Disposition: acted
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Model Tool Selection: PASS
Model Arguments: PASS
Execution Bridge: PASS
Provider Execution: PASS
Evidence Contract: PASS

Outcome: executed
Finding: none
Provider nonconformance: false

--- anthropic-claude (claude-haiku-4-5-20251001) ---
Provider: PASS
Disposition: acted
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Model Tool Selection: PASS
Model Arguments: PASS
Execution Bridge: PASS
Provider Execution: PASS
Evidence Contract: PASS

Outcome: executed
Finding: none
Provider nonconformance: false

--- openai-gpt (gpt-4o-mini) ---
Provider: PASS
Disposition: acted
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Model Tool Selection: PASS
Model Arguments: PASS
Execution Bridge: PASS
Provider Execution: PASS
Evidence Contract: PASS

Outcome: executed
Finding: none
Provider nonconformance: false

--- google-gemini (gemini-2.5-flash) ---
Provider: PASS
Disposition: acted
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Model Tool Selection: PASS
Model Arguments: PASS
Execution Bridge: PASS
Provider Execution: PASS
Evidence Contract: PASS

Outcome: executed
Finding: none
Provider nonconformance: false

## Case: live-ambiguous  (task order-coffee-underspecified/1)
Behavioral divergence: outcome (within allowable: false)
Representational difference: yes
Strategies: scripted-baseline=deferred, anthropic-claude=deferred, openai-gpt=inspected, google-gemini=deferred

--- scripted-baseline (scripted/deterministic) ---
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

--- anthropic-claude (claude-haiku-4-5-20251001) ---
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

--- google-gemini (gemini-2.5-flash) ---
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

```
