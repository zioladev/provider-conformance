# 03 — The `ModelConsumerAdapter` contract

A `ModelConsumerAdapter` is a model-agnostic way to turn *(task + normalized tool surface)*
into a **decision**. It is the generalization of the existing production `ModelAdapter`
(`refraktor-v2-backend/lib/adapters/`).

## Naming: deliberately, painfully explicit

The type is called **`ModelConsumerAdapter`**, not `ConsumerAdapter`, on purpose. `@selvage/core`
already has a type named `ConsumerAdapter` that means something completely different — the
*enforcement host seam* (`execute` / `readExecute` / `approvalUI` / `receipts`). Two unrelated
abstractions sharing a name is exactly how, six months from now, someone imports the wrong one.
So we rename aggressively past any possible collision. In this package the abstraction is always
`ModelConsumerAdapter`; the Selvage type is never imported and never referenced (§10).

## The architectural invariant

> **`plan()` decides. It never executes.** This is an architectural invariant, not an
> interface preference.

An adapter returns a *decision* — what it would call and with what arguments — and stops.
Execution belongs to the single common bridge (§02). This is load-bearing for the entire
attribution model:

```
model/consumer decided X  →  bridge attempted X  →  provider observed Y
```

If an adapter were allowed to execute, every vendor path could hide different execution
behavior inside itself, and the taxonomy (§05) would immediately collapse into "something went
weird over there." An adapter that touches the runtime, calls `executeTool`, mutates provider
state, or returns a "result" has violated the invariant and contaminated the experiment. The
bridge is the *only* thing that executes, for *every* adapter, so a difference across paths can
originate only in the **decision** or in the **provider's response** — never in hidden plumbing.

## Interface (illustrative)

```ts
interface ModelConsumerAdapter {
  /** Stable identity, e.g. "openai-gpt". Recorded as `adapterId` in the report. */
  readonly id: string;
  /** Adapter code version, recorded as `adapterVersion`. Bump on behavior change. */
  readonly version: string;
  /** The model this adapter drives, recorded as `modelId` (e.g. "gpt-5", "claude-opus-4-8"). */
  readonly modelId: string;

  /**
   * Produce a decision for one turn. MUST NOT execute tools or touch the runtime.
   * `tools` is the SAME normalized surface given to every other adapter.
   */
  plan(input: PlanInput): Promise<ConsumerDecision>;
}

interface PlanInput {
  task: TaskSpec;                 // frozen task text + allowable outcomes (§08)
  tools: NormalizedTool[];        // { name, description, inputSchema, effect }
  system?: string;                // fixed system instruction for the case
  priorTurns?: Turn[];            // prior decisions + bridge outcomes, for multi-turn cases
}

interface AdapterError { code: string; message: string }

type ConsumerDecision =
  | { type: "tool_call";     toolName: string; arguments: unknown; raw?: unknown }
  | { type: "clarification"; message?: string;                     raw?: unknown }
  | { type: "no_action";     reason?: string;                      raw?: unknown }
  | { type: "error";         error: AdapterError;                  raw?: unknown };
```

### The four decision types

| `ConsumerDecision.type` | Meaning | Maps to outcome (§04) | Attribution if faulted (§05) |
|---|---|---|---|
| `tool_call` | The adapter chose a tool + arguments. The bridge will attempt it; downstream outcome follows from what the surface does. | `executed` / `malformed_arguments` / `blocked_by_provider_contract` / `provider_error` / `execution_bridge_error` | depends on where it broke |
| `clarification` | The model asked a reasonable clarifying question instead of acting. | `clarification` | none — a legitimate non-action (§07) |
| `no_action` | The model produced neither a tool call nor a clarification. | `no_tool_selected` | `model_tool_selection` |
| `error` | The adapter's own logic or its transport to the model failed. | `adapter_error` / `transport_error` | `consumer_adapter` / `transport_error` — **never** provider nonconformance |

The decision vocabulary (four `type`s) is intentionally *narrower* than the outcome vocabulary
(ten outcomes): the adapter reports only what it decided; the bridge + provider determine which
of the richer outcomes actually results. Keeping the two layers distinct is what lets the report
say "the model selected a valid tool, but the bridge mis-invoked it" — decision `tool_call`,
outcome `execution_bridge_error`.

### `raw` is preserved, never scored

Each decision may carry the model's `raw` response (narration included). It is stored as
**observed evidence** (§04) and is **never** an input to any verdict, outcome, attribution, or
divergence computation. We keep the facts; we do not judge the prose.

## What the adapter owns internally (and is accountable for)

Each adapter privately performs, and is attributable for, these steps — all `consumer_adapter`
territory:

1. **Schema formatting** — translate each `NormalizedTool.inputSchema` into the model's tool
   format. GPT/Claude are near pass-through; Gemini needs the OpenAPI-subset rewrite
   (`cleanSchemaForGemini`). A failure here is `consumer_adapter`, not `provider_definition` —
   the provider's schema was valid; the adapter mis-translated it.
2. **Model invocation** — call the model with the formatted tools + task. Transport failures
   are `transport_error` (surfaced as a `type: "error"` decision).
3. **Tool-call parsing** — extract `{ toolName, arguments }` from the raw response. Note the
   Gemini quirk: no tool-call id, so adapters synthesize one — a documented normalization.
4. **Optional argument reconciliation** — the existing `reconcileArgs` (schema-driven repair of
   sensible-but-wrong keys) is available but is **itself an observed fact**: the report records
   both the model's raw arguments and the reconciled arguments, so repair never silently masks a
   `model_arguments` observation.

## What the adapter must NOT do

- Execute a tool, call `executeTool`, or touch `document.modelContext` (the invariant).
- Read or mutate provider state.
- Vary the *execution* path in any way — all adapters share one bridge.
- Consult journey/itinerary state or "the next provider" — that is Phase III (§01).

## The starting set

| Adapter `id` | Model family | Source of truth to generalize |
|---|---|---|
| `openai-gpt` | OpenAI | `lib/adapters/gpt.ts` |
| `anthropic-claude` | Anthropic | `lib/adapters/claude.ts` |
| `google-gemini` | Google | `lib/adapters/gemini.ts` (+ `cleaner.ts`) |
| `browser-native` *(future)* | Browser WebMCP agent | — (slots in unchanged; still a `ModelConsumerAdapter`) |

The three model adapters exist today in three hand-maintained copies (backend TS, study `.mjs`,
extension JS) that have already drifted. Extraction **unifies them to one** implementation per
family inside the package.
