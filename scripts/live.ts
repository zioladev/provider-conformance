// Optional LIVE conformance smoke, multi-model. Runs whichever real model families have an
// API key present — Anthropic (ANTHROPIC_API_KEY), OpenAI (OPENAI_API_KEY) — against the SAME
// provider surface, bridge, report schema, and attribution taxonomy, for two cases:
//   1. a fully-specified task (expect convergence);
//   2. the FROZEN ambiguous task (invite divergence — observation vs. the pre-frozen rubric).
//
// NOT part of CI (which stays hermetic). Deterministic everything else uses injected transports.
//   ANTHROPIC_API_KEY=... OPENAI_API_KEY=... node --experimental-strip-types scripts/live.ts

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  makeScriptedAdapter,
  makeClaudeAdapter,
  makeGptAdapter,
  makeGeminiAdapter,
  anthropicFetchTransport,
  openaiFetchTransport,
  geminiFetchTransport,
  buildCase,
  assembleReport,
  renderHuman,
  REFERENCE_RUNTIME_ID,
} from '../src/index.ts';
import type { ModelConsumerAdapter } from '../src/index.ts';
import { sampleProvider, orderTask, coffeeAmbiguousTask } from '../tests/sample-provider.ts';

const g = globalThis as unknown as { process: { env: Record<string, string | undefined>; exit(code: number): never } };
const env = g.process.env;

// Which real model families can we run? (A key present → include it.)
const live: ModelConsumerAdapter[] = [];
if (env['ANTHROPIC_API_KEY']) {
  const model = env['ANTHROPIC_MODEL'] ?? 'claude-haiku-4-5-20251001';
  live.push(makeClaudeAdapter({ modelId: model, transport: anthropicFetchTransport({ model }) }));
}
if (env['OPENAI_API_KEY']) {
  const model = env['OPENAI_MODEL'] ?? 'gpt-4o-mini';
  live.push(makeGptAdapter({ modelId: model, transport: openaiFetchTransport({ model }) }));
}
if (env['GEMINI_API_KEY'] || env['GOOGLE_API_KEY']) {
  const model = env['GEMINI_MODEL'] ?? 'gemini-2.5-flash';
  live.push(makeGeminiAdapter({ modelId: model, transport: geminiFetchTransport({ model }) }));
}

if (live.length === 0) {
  console.error('No model API keys set (ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY) — skipping the live run.');
  console.error('The deterministic tests still prove every adapter. Add a secret and re-run.');
  g.process.exit(0);
}

console.log(`Live model paths: ${live.map((a) => `${a.id} (${a.modelId})`).join(', ')}\n`);

// Scripted baselines: a valid execution for the specified task, a clarification for the ambiguous.
const scriptedExec = makeScriptedAdapter({ id: 'scripted-baseline', modelId: 'scripted/deterministic', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } } });
const scriptedClarify = makeScriptedAdapter({ id: 'scripted-baseline', modelId: 'scripted/deterministic', decide: { type: 'clarification', message: 'What size would you like?' } });

const specified = await buildCase('live-specified', sampleProvider, orderTask, [scriptedExec, ...live], 'place_order');
const ambiguous = await buildCase('live-ambiguous', sampleProvider, coffeeAmbiguousTask, [scriptedClarify, ...live]);

const report = assembleReport({
  providerName: sampleProvider.name,
  declaredTools: sampleProvider.tools.map((t) => t.def),
  runtimeId: REFERENCE_RUNTIME_ID,
  browserVersion: null,
  cases: [specified, ambiguous],
});

console.log(renderHuman(report));

// Raw decision per live model, per case — the preserved evidence (incl. what each model actually did).
for (const rc of report.cases) {
  for (const a of live) {
    const p = rc.paths.find((pp) => pp.adapterId === a.id);
    console.log(`\n--- raw ${a.id} decision for case "${rc.caseId}" (verbatim) ---`);
    console.log(JSON.stringify((p?.observed as { decision?: unknown })?.decision, null, 2));
  }
}

// Freeze a self-contained evidence bundle (GPT's request): machine-readable report (with raw
// responses + all provenance), human-readable report, the frozen fixtures/rubric, and a
// claim-free note. This is the "look at this" artifact once all three models run.
const bundleDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'bundle');
mkdirSync(bundleDir, { recursive: true });
writeFileSync(join(bundleDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
writeFileSync(join(bundleDir, 'report.md'), '```\n' + renderHuman(report) + '\n```\n');
writeFileSync(join(bundleDir, 'fixtures.json'), JSON.stringify({
  provider: { name: sampleProvider.name, tools: sampleProvider.tools.map((t) => t.def) },
  tasks: [orderTask, coffeeAmbiguousTask],
}, null, 2) + '\n');
writeFileSync(join(bundleDir, 'NOTES.md'), [
  '# Provider-conformance evidence bundle',
  '',
  `Models: ${live.map((a) => `${a.id} (${a.modelId})`).join(', ')}`,
  `Runtime: ${REFERENCE_RUNTIME_ID} — the REFERENCE lane, NOT real Chrome/WebMCP.`,
  '',
  'This bundle records OBSERVED behavior measured against a rubric frozen BEFORE the run',
  '(the allowableOutcomes in fixtures.json). It makes no claims beyond the per-layer verdicts',
  'and attributions in report.json. Provider-definition hash, adapter versions, model IDs, and',
  'the generator version are recorded in report.json for exact reproduction.',
  '',
].join('\n'));
console.log(`\nWrote evidence bundle to ${bundleDir}: report.json, report.md, fixtures.json, NOTES.md`);
