```
# Provider conformance report
Provider: @example/sample-cafe
Report: provider-conformance-report/1 (generator @zioladev/provider-conformance@0.1.0-alpha.3)
Lane: chrome-webmcp · browser Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36
Provider grade: PASS

## Case: chrome-specified  (task order-latte-M/1)
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

## Case: chrome-read  (task order-coffee-underspecified/1)
Behavioral divergence: none
Representational difference: no
Strategies: scripted=inspected

--- scripted (scripted/deterministic) ---
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

## Case: chrome-browser-owned-failure  (task order-latte-M/1)
Behavioral divergence: none
Representational difference: no
Strategies: scripted=failed

--- scripted (scripted/deterministic) ---
Provider: PASS
Disposition: failed
Provider Definition: PASS
Browser Runtime: FAIL
Provider Execution: NOT REACHED

Outcome: runtime_error
Finding:
  injected: runtime surface unsupported
Provider nonconformance: false

```
