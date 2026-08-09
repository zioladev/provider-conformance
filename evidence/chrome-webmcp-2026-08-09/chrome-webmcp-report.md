{
  "reportVersion": "provider-conformance-report/1",
  "reportGenerator": "@zioladev/provider-conformance",
  "reportGeneratorVersion": "0.1.0-alpha.3",
  "generatedAt": "2026-08-09T21:48:27.214Z",
  "provider": {
    "name": "@example/sample-cafe",
    "providerDefHash": "fnv1a:9f314796",
    "declaredTools": [
      {
        "name": "place_order",
        "effect": "state-changing"
      },
      {
        "name": "find_item",
        "effect": "read"
      }
    ]
  },
  "lane": {
    "runtimeId": "chrome-webmcp",
    "browserVersion": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    "toolSurfaceHash": "fnv1a:9da57571"
  },
  "cases": [
    {
      "caseId": "chrome-specified",
      "taskId": "order-latte-M/1",
      "paths": [
        {
          "adapterId": "scripted",
          "adapterVersion": "1.0.0",
          "modelId": "scripted/deterministic",
          "observed": {
            "definition": {
              "valid": true,
              "violations": []
            },
            "browserRuntime": {
              "ok": true
            },
            "discovery": {
              "ok": true,
              "names": [
                "find_item",
                "place_order"
              ]
            },
            "adapterFormat": {
              "ok": true,
              "normalizationApplied": [],
              "droppedRequiredFields": []
            },
            "decision": {
              "type": "tool_call",
              "toolName": "place_order",
              "arguments": {
                "item": "latte",
                "size": "M"
              }
            },
            "bridge": {
              "attempted": true,
              "ok": true,
              "toolName": "place_order",
              "arguments": {
                "item": "latte",
                "size": "M"
              }
            },
            "providerExec": {
              "reached": true,
              "ok": true,
              "firedTool": "place_order",
              "firedEffect": "state-changing"
            },
            "argsValidation": {
              "checked": true,
              "ok": true,
              "missingOrInvalidFields": []
            },
            "evidence": {
              "checked": true,
              "ok": true,
              "executionResult": {
                "executed": true,
                "confirmationId": "ORDER-3000",
                "data": {
                  "item": "latte",
                  "size": "M"
                }
              },
              "violations": []
            }
          },
          "derived": {
            "outcome": "executed",
            "disposition": "acted",
            "signalVerdicts": {
              "provider_definition": "PASS",
              "browser_runtime": "PASS",
              "provider_runtime": "PASS",
              "consumer_adapter": "PASS",
              "model_tool_selection": "PASS",
              "execution_bridge": "PASS",
              "model_arguments": "PASS",
              "provider_execution": "PASS",
              "evidence_contract": "PASS"
            },
            "attribution": [],
            "providerNonconformance": false,
            "observableOutcomeKey": "executed:place_order({\"item\":\"latte\",\"size\":\"M\"})"
          }
        }
      ],
      "divergence": {
        "kind": "none",
        "representationalDifference": false,
        "withinAllowable": true,
        "byPath": {
          "scripted": "executed:place_order({\"item\":\"latte\",\"size\":\"M\"})"
        }
      },
      "provider": "PASS"
    },
    {
      "caseId": "chrome-read",
      "taskId": "order-coffee-underspecified/1",
      "paths": [
        {
          "adapterId": "scripted",
          "adapterVersion": "1.0.0",
          "modelId": "scripted/deterministic",
          "observed": {
            "definition": {
              "valid": true,
              "violations": []
            },
            "browserRuntime": {
              "ok": true
            },
            "discovery": {
              "ok": true,
              "names": [
                "find_item",
                "place_order"
              ]
            },
            "adapterFormat": {
              "ok": true,
              "normalizationApplied": [],
              "droppedRequiredFields": []
            },
            "decision": {
              "type": "tool_call",
              "toolName": "find_item",
              "arguments": {
                "query": "coffee"
              }
            },
            "bridge": {
              "attempted": true,
              "ok": true,
              "toolName": "find_item",
              "arguments": {
                "query": "coffee"
              }
            },
            "providerExec": {
              "reached": true,
              "ok": true,
              "firedTool": "find_item",
              "firedEffect": "read"
            },
            "argsValidation": {
              "checked": true,
              "ok": true,
              "missingOrInvalidFields": []
            },
            "evidence": {
              "checked": true,
              "ok": true,
              "executionResult": {
                "executed": true,
                "data": {
                  "found": true,
                  "query": "coffee"
                }
              },
              "violations": []
            }
          },
          "derived": {
            "outcome": "executed",
            "disposition": "inspected",
            "signalVerdicts": {
              "provider_definition": "PASS",
              "browser_runtime": "PASS",
              "provider_runtime": "PASS",
              "consumer_adapter": "PASS",
              "model_tool_selection": "FAIL",
              "execution_bridge": "PASS",
              "model_arguments": "PASS",
              "provider_execution": "PASS",
              "evidence_contract": "PASS"
            },
            "attribution": [
              {
                "category": "model_tool_selection",
                "verdict": "FAIL",
                "signal": "task_conformance",
                "detail": "selected an exploratory read tool that was outside the allowable terminal outcomes for this test case"
              }
            ],
            "providerNonconformance": false,
            "observableOutcomeKey": "executed:find_item({\"query\":\"coffee\"})"
          }
        }
      ],
      "divergence": {
        "kind": "none",
        "representationalDifference": false,
        "withinAllowable": false,
        "byPath": {
          "scripted": "executed:find_item({\"query\":\"coffee\"})"
        }
      },
      "provider": "PASS"
    },
    {
      "caseId": "chrome-browser-owned-failure",
      "taskId": "order-latte-M/1",
      "paths": [
        {
          "adapterId": "scripted",
          "adapterVersion": "1.0.0",
          "modelId": "scripted/deterministic",
          "observed": {
            "definition": {
              "valid": true,
              "violations": []
            },
            "browserRuntime": {
              "ok": false,
              "detail": "injected: runtime surface unsupported"
            },
            "discovery": {
              "ok": false,
              "names": []
            },
            "adapterFormat": {
              "ok": true,
              "normalizationApplied": [],
              "droppedRequiredFields": []
            },
            "decision": {
              "type": "no_action",
              "reason": "runtime surface unavailable"
            },
            "bridge": {
              "attempted": false,
              "ok": false
            },
            "providerExec": {
              "reached": false,
              "ok": false
            },
            "argsValidation": {
              "checked": false,
              "ok": true,
              "missingOrInvalidFields": []
            },
            "evidence": {
              "checked": false,
              "ok": true,
              "violations": []
            }
          },
          "derived": {
            "outcome": "runtime_error",
            "disposition": "failed",
            "signalVerdicts": {
              "provider_definition": "PASS",
              "browser_runtime": "FAIL",
              "provider_execution": "NOT_REACHED"
            },
            "attribution": [
              {
                "category": "browser_runtime",
                "verdict": "FAIL",
                "signal": "runtime",
                "detail": "injected: runtime surface unsupported"
              }
            ],
            "providerNonconformance": false,
            "observableOutcomeKey": "runtime_error"
          }
        }
      ],
      "divergence": {
        "kind": "none",
        "representationalDifference": false,
        "withinAllowable": false,
        "byPath": {
          "scripted": "runtime_error"
        }
      },
      "provider": "PASS"
    }
  ],
  "summary": {
    "provider": "PASS",
    "byLayer": {
      "provider_definition": "PASS",
      "browser_runtime": "FAIL",
      "provider_runtime": "PASS",
      "consumer_adapter": "PASS",
      "model_tool_selection": "FAIL",
      "execution_bridge": "PASS",
      "model_arguments": "PASS",
      "provider_execution": "PASS",
      "evidence_contract": "PASS",
      "scripted": "FAIL",
      "provider": "PASS"
    },
    "notes": [
      {
        "layer": "model_tool_selection",
        "verdict": "FAIL",
        "signal": "task_conformance",
        "detail": "selected an exploratory read tool that was outside the allowable terminal outcomes for this test case"
      },
      {
        "layer": "browser_runtime",
        "verdict": "FAIL",
        "signal": "runtime",
        "detail": "injected: runtime surface unsupported"
      }
    ]
  }
}
