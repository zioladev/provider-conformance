# Three-way conformance evidence — 2026-08-09

The first live three-way (Claude + GPT + Gemini) provider-conformance run, frozen. Same
provider, same tasks, one execution bridge; reference runtime lane.

- `three-way-report.json` — machine-readable report (raw responses embedded, full provenance)
- `three-way-report.md` — human-readable rendering
- `fixtures.json` — provider definition + the frozen task fixtures / allowable-outcome rubric
- `raw/*.json` — verbatim raw responses per model, per case
- `metadata.json` — model IDs, adapter/generator versions, hashes, response IDs, run date
- `MANIFEST.sha256` — sha256 of each file (reproducible via `scripts/freeze-three-way.ts`)
- `NOTES.md` — claim-free interpretation

Reproduce: `node --experimental-strip-types scripts/freeze-three-way.ts` regenerates these
files identically (the manifest hashes will match).
