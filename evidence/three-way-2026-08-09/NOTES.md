# Three-way conformance evidence — 2026-08-09

This artifact records observed cross-consumer behavior under a fixed provider surface and
task set. **It is not a benchmark of model quality and does not establish universal
interoperability.**

What it does record: the same provider (`@example/sample-cafe`), the same two tasks, and the
same common execution bridge, exercised through three independent consumer/model paths —
Anthropic Claude, OpenAI GPT, Google Gemini — on the **reference runtime** (`reference-runtime/1`,
NOT real Chrome/WebMCP). Raw responses from all three models are preserved verbatim under
`raw/`; provenance (hashes, model IDs, adapter/generator versions) is in `metadata.json`.

## The observation

- **Specified task** ("order a medium latte"): all three converge on `place_order{latte,M}`.
  Behavioral divergence: none. Provider: PASS.
- **Ambiguous task** ("order a coffee", no size, provider declares no default): a 2–1 strategy
  split — Claude and Gemini **defer** (ask the user); GPT **inspects** the provider
  (`find_item`). GPT's read is outside the pre-frozen allowable terminal outcomes and is
  attributed to `model_tool_selection` (not fabricated input). **No path implicated the
  provider — Provider: PASS throughout.**

The allowable-outcome rubric in `fixtures.json` was frozen BEFORE the run. Model behavior is
observation, not ground truth.
