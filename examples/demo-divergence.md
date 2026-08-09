```
# Provider conformance report
Provider: @example/sample-cafe
Report: provider-conformance-report/1 (generator @zioladev/provider-conformance@0.1.0)
Lane: reference-runtime/1
Provider grade: PASS

## Case: same-surface-two-paths  (task order-latte-M/1)
Behavioral divergence: behavioral (within allowable: true)
Representational difference: yes
Strategies: scripted=acted, anthropic-claude=acted

--- scripted (scripted/deterministic) ---
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

--- anthropic-claude (claude-opus-4-8) ---
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

```
