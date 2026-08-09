# 02 — Architecture

## The pipeline

Every conformance run flows through one fixed pipeline. The shape is the architecture:

```
            Provider Surface            (the provider under test — held constant)
                  │
                  ▼
        Normalized Tool Surface         (discover once → one internal representation)
                  │
                  ▼
        ModelConsumerAdapter          (GPT | Claude | Gemini | future browser-native)
                  │                       decides WHAT to call + WITH WHICH ARGUMENTS
                  ▼
     Plan / Tool Selection / Arguments  (a decision — NOT an execution)
                  │
                  ▼
     ┌────────────────────────────┐
     │   COMMON EXECUTION BRIDGE   │     one bridge for every adapter
     └────────────────────────────┘
                  │
                  ▼
            Same Provider Surface       (execution lands on the exact same surface)
                  │
                  ▼
           Provider Evidence            (which tools fired, normalized args, ExecutionResult)
                  │
                  ▼
        Attribution + Report            (observed facts → derived judgments → §05/§06)
```

## Two invariants hold this together

### 1. The report is the spine

The adapters, the bridge, and the lanes exist to **populate the report contract**
(§05 + §06). They do not define it. This inverts the intuitive "adapter package" framing:
Phase II is an **evidence-and-attribution system**; adapters are merely ways of generating
comparable observations. Practically, this means:

- The report schema (§06) and attribution taxonomy (§05) are specified and versioned
  **first**, and are stable across adapters, runtimes, and future phases.
- Adding a consumer (a fourth adapter, a browser-native consumer) or a runtime (real Canary)
  must require **zero** changes to the report contract — only new *populators*.
- If a proposed feature cannot produce a trustworthy, attributable observation in the report,
  it does not belong in Phase II.

### 2. The same-surface invariant

> Consumer adapters decide **what** to call and **with which arguments**. One
> adapter-independent **execution bridge** executes that decision against the **same**
> provider/runtime surface used by every other adapter.

This is what makes the comparison an experiment instead of an anecdote. If GPT had one
execution path, Claude another, and Gemini a third, then an observed difference could be model
behavior, schema translation, consumer logic, *or* execution plumbing — and attribution would
be impossible. By holding the execution path constant, a difference can only originate in the
adapter's *decision* (tool selection / arguments) or in the provider's *response* — which is
exactly the separation the attribution taxonomy needs.

The division of responsibility is strict:

| Layer | Owns | Never touches |
|---|---|---|
| `ModelConsumerAdapter` (§03) | Reading the normalized surface; producing a **decision** (tool name + arguments, or clarification / no-action / error) | Executing anything; talking to the runtime |
| **Common execution bridge** | Discovering tools; executing a decision against the surface; collecting provider evidence and timing | Choosing what to call; interpreting model intent |

Because the bridge is the *only* thing that executes, the taxonomy can cleanly separate
`model_tool_selection` and `model_arguments` (the adapter's decision) from
`execution_bridge` and `provider_execution` (what happened when that decision ran).

## Component responsibilities

- **Normalized Tool Surface** — the provider's tools discovered once (via the bridge) and
  expressed in one internal representation (`NormalizedTool`: `{ name, description,
  inputSchema, effect }`). All adapters receive the *same* normalized surface; per-model
  formatting (e.g. `cleanSchemaForGemini`) happens *inside* each adapter as a private step and
  is itself an observed, attributable fact (a normalization failure is `consumer_adapter`, not
  `provider_definition`).
- **ModelConsumerAdapter** — one implementation per model family; see §03.
- **Common execution bridge** — see §02's invariant above and §09 for how the *same* logical
  bridge is realized in two lanes (deterministic reference runtime vs. real Chrome/WebMCP).
- **Provider Evidence** — the raw material of a verdict: the `ExecutionResult` returned by the
  surface (per the Phase I contract), which tool actually fired, the normalized arguments as
  executed, and elapsed time. Evidence is **observed fact**; verdicts are **derived** from it
  (§04).
- **Attribution + Report** — turns observations into an attributed, versioned record (§05, §06).

## A note on the browser-native consumer

The browser's own WebMCP agent is **one future `ModelConsumerAdapter`**, not the centre of the
architecture. When it arrives, it slots in at the same layer as GPT/Claude/Gemini and executes
through the same bridge. Nothing above or below it changes. That is the test of whether this
architecture is right: a new consumer is a new populator, never a new contract.
