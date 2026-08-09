```
# Provider conformance report
Provider: @example/sample-cafe
Report: provider-conformance-report/1 (generator @zioladev/provider-conformance@0.1.0)
Lane: reference-runtime/1
Provider grade: PASS

## Case: happy-path  (task order-latte-M/1)
Behavioral divergence: none
Representational difference: no
Strategies: scripted=acted

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

## Case: malformed-arguments  (task order-latte-M/1)
Behavioral divergence: none
Representational difference: no
Strategies: scripted=failed

--- scripted (scripted/deterministic) ---
Provider: PASS
Disposition: failed
Provider Definition: PASS
Browser Runtime: PASS
Provider Runtime: PASS
Consumer Adapter: PASS
Model Tool Selection: PASS
Model Arguments: FAIL
Execution Bridge: PASS
Provider Execution: NOT REACHED

Outcome: malformed_arguments
Finding:
  model produced invalid/missing field(s): size
Provider nonconformance: false

```
