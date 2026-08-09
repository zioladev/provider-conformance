# Provider Conformance — Phase II spec

> **Phase I created a package. Phase II creates a measurement language.**

`@zioladev/provider-conformance` answers one question: *does a provider built against
the [provider contract](../provider-kit/) behave in a well-characterized way across
independent consumer/model paths?* — and records the answer as a **trustworthy,
attributable, machine-readable observation.**

The centre of gravity is **not** the model adapters. It is the **report schema
(§06) + attribution taxonomy (§05)**. Adapters and execution lanes exist to *populate*
that contract, not to define it. Every implementation decision is judged by one test:

> Can this produce a trustworthy, attributable observation in the report?

not:

> Can this run another model?

## The documents

| # | Doc | What it fixes |
|---|-----|---------------|
| 00 | [inventory](./00-inventory.md) | What we extract from existing code vs. what is greenfield. The honest starting line. |
| 01 | [what-conformance-means](./01-what-conformance-means.md) | The question Phase II answers — and the hard wall between conformance and interoperability. |
| 02 | [architecture](./02-architecture.md) | The pipeline: provider surface → normalized tools → adapter → **common execution bridge** → same surface → evidence → report. The same-surface invariant. |
| 03 | [consumer-adapter-contract](./03-consumer-adapter-contract.md) | The model-agnostic `ModelConsumerAdapter` interface. `plan()` decides *what* to call; the bridge executes — a hard invariant. |
| 04 | [signals-and-outcomes](./04-signals-and-outcomes.md) | Observed facts vs. derived judgments; the recorded signals; the first-class outcome vocabulary. |
| 05 | [attribution-taxonomy](./05-attribution-taxonomy.md) | The nine fault categories and the rule that assigns each failure an owner. **A consumer-side failure is never provider nonconformance.** |
| 06 | [report-schema](./06-report-schema.md) | The versioned JSON report + provenance identifiers + human rendering. Seed of the Phase IV qualification report. |
| 07 | [divergence](./07-divergence.md) | The precise cross-consumer divergence predicate — and why *different ≠ wrong*. |
| 08 | [fixture-discipline](./08-fixture-discipline.md) | Freezing "the same task" so comparisons mean something. |
| 09 | [lanes](./09-lanes.md) | Deterministic reference-runtime lane vs. real Chrome/WebMCP acceptance lane. Never dress a shim as browser conformance. |
| 10 | [boundary](./10-boundary.md) | What's open vs. the Phase VI hosted matrix; the hard Selvage clean-room boundary. |
| 11 | [decision-record](./11-decision-record.md) | The decisions (D-series) that produced this spec. |
| 12 | [plan](./12-plan.md) | Milestones 2A → 2B → 2C → complete, each with a single success criterion. |
| 13 | [golden-fixtures](./13-golden-fixtures.md) | Synthetic cases with known-correct attribution — the regression truth that keeps the taxonomy from rotting. |
| 14 | [chrome-lane](./14-chrome-lane.md) | The next phase gate: the same measurement language against the real WebMCP browser runtime. The lane changes; the report contract does not. |

## Status

This is a **specification**, not an implementation. The package `@zioladev/provider-conformance`
is scoped here and built afterward, standalone and public (Apache-2.0), following the same
spec-first discipline that produced `@zioladev/provider-tools` in Phase I.

## Where Phase II sits

```
Provider Tools  →  Provider Conformance  →  Multi-Provider Runtime  →  Interoperability
   (Phase I)          (Phase II — here)          (Phase III)            Conformance (IV)
                                                                              │
        Selvage Governance (V)  ←  Hosted Qualification (VI)  ←  Long-Tail Plugins (VII)
```

Provider conformance is a **prerequisite for interoperability, not interoperability
itself** (see §01). Journey/itinerary state belongs to Phase III and must not leak
backward into this package.
