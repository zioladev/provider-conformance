# @zioladev/provider-conformance

**Find out where WebMCP interoperability actually broke.**

`@zioladev/provider-conformance` measures a [WebMCP](https://github.com/webmachinelearning/webmcp)
provider's behavior across independent **consumer paths** and **runtime lanes**, attributes any
failure to the **layer that caused it**, and keeps consumer or browser failures from ever
becoming *provider* failures. It is an **evidence-and-attribution system**, not a model
benchmark — the report is the product.

> **Phase I created a package. This is the measurement language.**

When an agent drives your provider and something goes wrong, the useful question isn't "did it
work?" — it's *which layer broke?* Was it the provider's schema, the browser runtime, the model's
tool choice, the model's arguments, the execution bridge, or the provider's own execution? This
package answers that, mechanically, and produces a versioned, machine-readable report that says
so.

## The prime invariant

> **A consumer-side or browser-side failure is never reported as provider nonconformance.**

The provider grade is computed **only** from the four provider-owned layers
(`provider_definition`, `provider_runtime`, `provider_execution`, `evidence_contract`). The other
five (`browser_runtime`, `consumer_adapter`, `model_tool_selection`, `model_arguments`,
`execution_bridge`) are attributed to their own owners. That fault isolation is what makes the
word "conformance" mean something.

## What a report can say

```
Provider: PASS

Claude:  deferred
GPT:     inspected
Gemini:  deferred

Cross-consumer strategy difference observed.
Provider nonconformance: false.
```

Three independent model ecosystems, one provider surface, one execution bridge — and the system
says *where they diverged, whose layer owns it, and that the provider is not at fault.* That's a
standards-relevant interoperability observation, not a leaderboard.

## The evidence behind the claim

The abstraction isn't asserted — it's demonstrated, and the runs are frozen in
[`evidence/`](./evidence/):

- **Real models** ([`evidence/three-way-2026-08-09/`](./evidence/three-way-2026-08-09/)) —
  Claude, GPT, and Gemini against the same provider surface. Convergence on a specified task; a
  2–1 strategy split on an ambiguous one (two defer, one inspects). Provider PASS throughout.
- **Real WebMCP runtime** ([`evidence/chrome-webmcp-2026-08-09/`](./evidence/chrome-webmcp-2026-08-09/)) —
  the same pipeline against a real `document.modelContext` in Chrome 152: live registration,
  discovery, read + state-changing execution, preserved evidence, and a browser-owned failure
  correctly isolated (`Browser Runtime: FAIL / Provider: PASS`).

The report contract (`provider-conformance-report/1`) is **identical** across models and lanes.
The lane changes; the measurement language does not.

## Design in one screen

```
Provider Surface → Normalized Tools → ModelConsumerAdapter → [ COMMON EXECUTION BRIDGE ]
                                        (decides what to call)   (executes — reference OR real
                                                                  document.modelContext)
                                                                        ↓
                       Attribution + Report ← Provider Evidence ← Same Provider Surface
```

- **`ModelConsumerAdapter.plan()` decides and never executes** — a hard invariant. Adapters for
  OpenAI, Anthropic, and Google ship in the box; the browser-native agent is a future adapter.
- **One adapter-independent execution bridge** runs every decision against the same surface, so a
  difference can only originate in the decision or the provider's response.
- **Two lanes, one contract:** an in-process reference runtime (deterministic, CI) and the real
  Chrome/WebMCP runtime — both populate the same report, never conflated.
- **Outcome, disposition, divergence:** a first-class outcome vocabulary; an action disposition
  (`acted` / `inspected` / `deferred` / `failed`); representational vs. behavioral divergence, so
  *different ≠ wrong*.

Full specification: [`docs/`](./docs/).

## Quickstart

```ts
import {
  makeScriptedAdapter, buildCase, assembleReport, renderHuman, REFERENCE_RUNTIME_ID,
} from '@zioladev/provider-conformance';

const adapter = makeScriptedAdapter({
  id: 'scripted',
  decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte' } }, // missing "size"
});

const c = await buildCase('order', myProvider, orderTask, [adapter], 'place_order');
const report = assembleReport({
  providerName: myProvider.name,
  declaredTools: myProvider.tools.map((t) => t.def),
  runtimeId: REFERENCE_RUNTIME_ID,
  browserVersion: null,
  cases: [c],
});

console.log(renderHuman(report));
// Provider: PASS · Model Arguments: FAIL · Outcome: malformed_arguments · Provider nonconformance: false
```

The provider passed; the failure belongs to the model's arguments. That distinction is the
whole point.

The real-model adapters (`makeGptAdapter`, `makeClaudeAdapter`, `makeGeminiAdapter`) take an
injected transport, so they're tested deterministically and a live run is one API key away. The
Chrome/WebMCP acceptance page is under [`acceptance/`](./acceptance/).

## Scripts

```
npm run typecheck   # tsc --noEmit
npm test            # node --experimental-strip-types --test  (Node >= 22.6)
npm run build       # emit dist/ (ESM + .d.ts)
npm run demo        # regenerate examples/
```

## License

Apache-2.0. Clean-room — imports nothing from any proprietary source; a test asserts it. See
[`NOTICE`](./NOTICE).
