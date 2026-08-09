# Changelog

All notable changes to `@zioladev/provider-conformance` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.3] - unreleased

Ambiguous-task divergence experiment, the action-disposition refinement it surfaced, and the
start of 2C (the GPT adapter) — the bridge into the three-way report. Still **not published to
npm** (the first public-worthy artifact is the three-way same-surface report, not the package).

### Added
- **The Chrome/WebMCP lane** (docs §14). The runtime is now abstracted behind one
  `WebMcpRuntime` interface, satisfied by both the in-process `ReferenceRuntime` and a real
  `document.modelContext` (`detectWebMcpRuntime`). The common bridge, attribution engine, and
  report schema are **unchanged** — Chrome is a new populator, not a new contract (the bridge and
  `runPathOnRuntime`/`buildCaseOnRuntime` now take a runtime; `runPath` wraps the reference
  runtime). Browser-runtime health is detected at discovery, so an unavailable/malformed runtime
  attributes to `browser_runtime` with **Provider PASS**.
  - `tests/chrome-lane.test.ts`: proves the pipeline against a `document.modelContext`-shaped
    runtime — state-changing (`acted`) + read (`inspected`) execution, the same report contract
    with `runtimeId: chrome-webmcp` + `browserVersion`, and the fault-isolation case
    (`Browser Runtime: FAIL / Provider: PASS`), plus a claimed-but-undiscovered tool →
    `provider_runtime`.
  - `acceptance/chrome-webmcp-acceptance.html`: a **self-contained** page (library bundled via
    esbuild) that registers the provider on the real `document.modelContext` and runs the lane in
    a WebMCP-enabled Chrome — the interactive Canary run. Built by `scripts/build-acceptance.ts`
    from `acceptance/harness.js`. Smoke-tested headlessly (loads, API exposed, no-runtime path
    graceful, and the full flow passes against an injected `document.modelContext` fake).
- **Frozen three-way evidence artifact** (`evidence/three-way-2026-08-09/`): the first live
  Claude + GPT + Gemini run against the same provider surface, made durable and reproducible.
  Contains the machine + human report (raw responses embedded), the frozen fixtures/rubric,
  per-model raw responses, `metadata.json` (model IDs, adapter/generator versions, hashes,
  response IDs, run date), a `MANIFEST.sha256`, and a claim-free `NOTES.md`. `scripts/freeze-
  three-way.ts` regenerates it byte-for-byte (replays the recorded raw responses through the
  real pipeline). Records the specified-task convergence and the ambiguous-task **2–1 strategy
  split** (Claude + Gemini defer; GPT inspects) — provider PASS throughout.
- **Chrome/WebMCP lane scope** (docs §14, decision D24): the next phase gate — the same
  measurement language against the real browser runtime. *The lane changes; the report contract
  does not.* Includes acceptance criteria and a required intentionally-browser-owned failure
  (`Browser Runtime: FAIL / Provider: PASS`). Explicitly not Phase III.

### Changed (from the first live three-way run)
- **`inspected` disposition** — a read-only provider execution is now `inspected`, not `acted`
  (a read changed nothing). Dispositions are now `acted` (state-changing exec) / `inspected`
  (read exec) / `deferred` (no exec) / `failed`. Surfaced by a live run where Claude deferred
  (asked the user) and GPT ran `find_item` (inspected) on the same task.
- **Effect-aware, first-failing-layer task-conformance attribution.** An out-of-allowable read
  or non-execution → `model_tool_selection` ("selected an exploratory read outside allowable
  terminal outcomes"); a state-changing execution with a constraint-violating required value →
  `model_arguments`. Removed the inaccurate "fabricated input" wording where nothing was
  fabricated. The frozen rubric is unchanged (a read is not retroactively blessed; whether it's
  valid trajectory progress is a Phase III / journey question). Render shows a per-case
  `Strategies:` line (e.g. `anthropic-claude=deferred, openai-gpt=inspected`).

### Added (2C, steps 1–2)
- **OpenAI GPT adapter** (`makeGptAdapter`) — second real model family, same discipline as
  Claude: `plan()` never executes; transport injected (deterministic tests, no key); zero-dep
  raw `fetch` against Chat Completions; raw preserved. Tests cover formatting, tool-call parsing
  (JSON-string args), text-only → `no_action`, transport failure → `transport_error`.
- **Google Gemini adapter** (`makeGeminiAdapter`) — third real model family. Adds the schema
  normalization Gemini needs (`cleanSchemaForGemini` reduces JSON Schema to Gemini's OpenAPI
  subset — drops `additionalProperties`/`$ref`, rewrites `["T","null"]` → `type`+`nullable`);
  parses `functionCall` args as an **object** (Gemini's shape); raw preserved. Same deterministic
  test coverage plus schema-clean tests.
- **Multi-model live runner** (`scripts/live.ts`): runs whichever families have a key
  (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY`) against the same surface for the
  specified and frozen-ambiguous cases; prints each model's raw decision. Now also **freezes an
  evidence bundle** (`bundle/report.json`, `report.md`, `fixtures.json`, `NOTES.md`) — the
  machine + human report, the frozen rubric, and a claim-free note; the live workflows upload it.
  Workflows pass all three keys (optional) with per-model inputs.


### Added
- **Action disposition** (`acted` / `deferred` / `failed`) as a higher-order class over
  outcomes, and **two-level divergence**: raw observable outcomes stay distinct
  (representational difference), while *behavioral* divergence is scored over disposition. Two
  paths that both `deferred` (one `clarification`, one `no_tool_selected`) show **no** behavioral
  divergence — only a representational difference — instead of a spurious `behavioral` result.
  For `acted`, the fired tool + args stay part of the behavioral key (ordering M vs L is real).
  Text-only model output is never upgraded to `clarification` without a separate judge layer.
  The report now carries `disposition` per path and `representationalDifference` per case.
- **Frozen ambiguous fixture** `order-coffee-underspecified` ("Order a coffee.") with its
  allowable set decided **a priori** — `clarification` / `no_tool_selected` are legitimate;
  executing (fabricating a size) is invalid **because this provider declares no default**.
  Model behavior is observation, never ground truth.
- **Task-conformance check** in the attribution engine: a clean terminal response outside the
  case's frozen allowable set is charged to a **consumer-side** category (fabricated execution
  → `model_arguments`; illegitimate clarify/no-action → `model_tool_selection`) and **never**
  moves the provider grade. Reuses existing categories, so the report contract stays
  `provider-conformance-report/1` (no version bump). A pipeline fault still takes precedence.
- Deterministic tests pinning the rubric before any live run: clarify PASS, no-action PASS,
  fabrication → `model_arguments` FAIL (provider PASS), clarify-vs-fabricate → `outcome`
  divergence, two-agreeing-fabrications → `none` divergence but both `model_arguments` FAIL.
- `examples/demo-ambiguous.{json,md}` and the ambiguous case wired into the live workflow so a
  real run can surface genuine cross-consumer divergence.

## [0.1.0-alpha.2] - unreleased

Milestone 2B — the abstraction meets a real consumer. Still **not published to npm** (release
held until at least 2C). Narrow by design: one live model family, one same-surface comparison,
one real divergence.

### Added
- **First real model-family adapter: Anthropic Claude** (`makeClaudeAdapter`). Obeys the
  invariant — `plan()` only talks to the model and returns a `ConsumerDecision`, never executes.
  The transport is **injected**, so schema formatting + tool-call parsing are tested
  deterministically against real Anthropic response shapes (no network, no key); a live run is
  one real transport away (`anthropicFetchTransport`, env-gated, never in CI).
- **Same-surface comparison**: the scripted reference path and the Claude path run against the
  **same** provider fixture, task, bridge, report schema, and attribution taxonomy — only the
  adapter varies.
- **Real divergence, correctly classified**: tests prove `behavioral` (same tool, different
  valid args → provider stays PASS), `outcome` (Claude emits malformed args → `model_arguments`
  FAIL, provider still PASS), and `conformance` (the surface is valid under one caller and
  non-conformant under another → provider grade FAIL — the one case where it legitimately drops).
- **Raw preserved**: the model's full raw response rides on the decision and into the report
  JSON as observed evidence. The weirdness is never normalized away.
- `examples/demo-divergence.{json,md}`: a committed two-path, same-surface behavioral-divergence
  report.
- `scripts/live-claude.ts`: the optional live end-to-end (needs `ANTHROPIC_API_KEY`).

## [0.1.0-alpha.1] - unreleased

Milestone 2A — the spine, proven end to end. **Not published to npm** (the package's thesis is
cross-consumer attribution, which does not exist at one-consumer scope; release is held until at
least 2C).

### Added
- **Report contract** `provider-conformance-report/1`: versioned, with observed facts and
  derived judgments in separate branches, provenance identifiers (including the report
  generator's own identity), and mandatory attribution on every non-PASS.
- **Attribution engine** (nine categories): assigns each failure a single owning layer; the
  provider grade is computed only from the four provider-owned categories, so a consumer-side
  failure is never provider nonconformance.
- **First-class outcome vocabulary** (ten outcomes) — no collapsing into "not executed".
- **Divergence classification** — `none` / `behavioral` / `outcome` / `conformance`;
  divergence is descriptive, not automatically a failure.
- **Reference-runtime lane** (`reference-runtime/1`): a faithful in-process WebMCP surface
  (`registerTool` / `getTools` / `executeTool` with RegisteredTool handles).
- **Common execution bridge** — the single, adapter-independent executor (same-surface invariant).
- **`ModelConsumerAdapter`** contract + one scripted, deterministic adapter (`plan()` never
  executes — a hard invariant).
- **Six golden report fixtures** with authored, known-correct attribution, gating CI (§13).
- **Clean-room guard**: a CI test asserts no source file imports from `@selvage/*` or the
  Refraktor extension; the package has zero runtime dependencies.
- **Live end-to-end**: one real provider surface on the reference runtime produces a fully
  attributable report; the intentionally-ugly demo report is committed under `examples/`.

### Not yet (2B / 2C)
- Second and third model-family adapters (GPT / Claude / Gemini) and live cross-consumer divergence.
- The real Chrome/WebMCP acceptance lane run.
- The npm release.
