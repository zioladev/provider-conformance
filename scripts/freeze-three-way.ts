// Freezes the FIRST live three-way run (Claude + GPT + Gemini, 2026-08-09) into a durable,
// reproducible evidence artifact. It replays the exact raw model responses through the real
// adapters + pipeline, so the frozen report is faithful and independently verifiable: re-run
// this script and the files (and their hashes in MANIFEST.sha256) reproduce byte-for-byte.
//
//   node --experimental-strip-types scripts/freeze-three-way.ts
//
// This is not part of CI. It records observation, not a benchmark (see the artifact's NOTES.md).

import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  makeScriptedAdapter,
  makeClaudeAdapter,
  makeGptAdapter,
  makeGeminiAdapter,
  staticAnthropicTransport,
  staticOpenAiTransport,
  staticGeminiTransport,
  buildCase,
  assembleReport,
  renderHuman,
  REFERENCE_RUNTIME_ID,
  REPORT_GENERATOR_VERSION,
} from '../src/index.ts';
import { sampleProvider, orderTask, coffeeAmbiguousTask } from '../tests/sample-provider.ts';

// ── The exact raw model responses from the live run (verbatim) ──────────────────────────────
const CLAUDE_SPECIFIED = { model: 'claude-haiku-4-5-20251001', id: 'msg_011CdsqGCn3sVhaQ3BVxCtpN', type: 'message', role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_01KzJNhyWRJWSc3gXQupLgyK', name: 'place_order', input: { item: 'latte', size: 'M' }, caller: { type: 'direct' } }], stop_reason: 'tool_use', stop_sequence: null, stop_details: null, usage: { input_tokens: 661, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 }, output_tokens: 72, service_tier: 'standard', inference_geo: 'not_available' } };
const CLAUDE_AMBIGUOUS = { model: 'claude-haiku-4-5-20251001', id: 'msg_011CdsqGRyo88qcRnTp4dvEG', type: 'message', role: 'assistant', content: [{ type: 'text', text: "I'd be happy to help you order a coffee! I just need to know what size you'd like:\n\n- **S** (Small)\n- **M** (Medium)\n- **L** (Large)\n\nWhich size would you prefer?" }], stop_reason: 'end_turn', stop_sequence: null, stop_details: null, usage: { input_tokens: 659, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 }, output_tokens: 56, service_tier: 'standard', inference_geo: 'not_available' } };

const GPT_SPECIFIED = { id: 'chatcmpl-EB4k75OlpUWI1AMi0t3GPqAlynrLO', object: 'chat.completion', created: 1786308547, model: 'gpt-4o-mini-2024-07-18', choices: [{ index: 0, message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_AaOEdJU2OULsysOdINmDHtTD', type: 'function', function: { name: 'place_order', arguments: '{"item":"latte","size":"M"}' } }], refusal: null, annotations: [] }, logprobs: null, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 84, completion_tokens: 19, total_tokens: 103, prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 }, completion_tokens_details: { reasoning_tokens: 0, audio_tokens: 0, accepted_prediction_tokens: 0, rejected_prediction_tokens: 0 } }, service_tier: 'default', system_fingerprint: 'fp_25b7d0bd77' };
const GPT_AMBIGUOUS = { id: 'chatcmpl-EB4kA6qgxrvmtNkJsnIgpzB4uO2vz', object: 'chat.completion', created: 1786308550, model: 'gpt-4o-mini-2024-07-18', choices: [{ index: 0, message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_ltZJKYu7NEYvBIDuu9rWo33O', type: 'function', function: { name: 'find_item', arguments: '{"query":"coffee"}' } }], refusal: null, annotations: [] }, logprobs: null, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 83, completion_tokens: 14, total_tokens: 97, prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 }, completion_tokens_details: { reasoning_tokens: 0, audio_tokens: 0, accepted_prediction_tokens: 0, rejected_prediction_tokens: 0 } }, service_tier: 'default', system_fingerprint: 'fp_25b7d0bd77' };

const GEMINI_SPECIFIED = { candidates: [{ content: { parts: [{ functionCall: { name: 'place_order', args: { item: 'latte', size: 'M' } }, thoughtSignature: 'CogCARFNMg8s1UNXvonGN0TLjErRXnPxJUVWyYceW7AyvSBfbP14LrdRfdsOcydfmddwvnh4PH+lwE1Vf6YRnvzP/Q4XMm2qroiMhtfBQRemd2MIsWDleOym/ovBsrvpig2HrMLRCWbJ/QA2fQCQVB1zA73U2AO89ApxxVoGGv2fmJwBOHZshtkQ6HKYElyuv6j3LTMQcN13EKhsbBy7QXFGJ478rpQZmdrP1HamsF2sie01ZZPZa4WVpuihAr8rxC5+RWY9m0dn7oNNiJCOuXeXTgQQd/HDz3W0I841203Shg37HKSmTLiQd+/xKEkw1o/EnKeo3GY5YGyu0uI/9XbOXVI8HfLtSwU4' }], role: 'model' }, finishReason: 'STOP', index: 0, finishMessage: 'Model generated function call(s).' }], usageMetadata: { promptTokenCount: 101, candidatesTokenCount: 21, totalTokenCount: 188, promptTokensDetails: [{ modality: 'TEXT', tokenCount: 101 }], thoughtsTokenCount: 66, serviceTier: 'standard' }, modelVersion: 'gemini-2.5-flash', responseId: 'xOd4aqmUIYGez7IPtNS10As' };
const GEMINI_AMBIGUOUS = { candidates: [{ content: { parts: [{ text: 'What size coffee would you like?' }], role: 'model' }, finishReason: 'STOP', index: 0 }], usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 7, totalTokenCount: 107, promptTokensDetails: [{ modality: 'TEXT', tokenCount: 100 }], serviceTier: 'standard' }, modelVersion: 'gemini-2.5-flash', responseId: 'xud4apbjM6XVz7IP08-M-Qg' };

// ── Replay each recorded decision through the real adapters ──────────────────────────────────
const specifiedPaths = [
  makeScriptedAdapter({ id: 'scripted-baseline', modelId: 'scripted/deterministic', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } } }),
  makeClaudeAdapter({ modelId: 'claude-haiku-4-5-20251001', transport: staticAnthropicTransport(CLAUDE_SPECIFIED) }),
  makeGptAdapter({ modelId: 'gpt-4o-mini', transport: staticOpenAiTransport(GPT_SPECIFIED) }),
  makeGeminiAdapter({ modelId: 'gemini-2.5-flash', transport: staticGeminiTransport(GEMINI_SPECIFIED) }),
];
const ambiguousPaths = [
  makeScriptedAdapter({ id: 'scripted-baseline', modelId: 'scripted/deterministic', decide: { type: 'clarification', message: 'What size would you like?' } }),
  makeClaudeAdapter({ modelId: 'claude-haiku-4-5-20251001', transport: staticAnthropicTransport(CLAUDE_AMBIGUOUS) }),
  makeGptAdapter({ modelId: 'gpt-4o-mini', transport: staticOpenAiTransport(GPT_AMBIGUOUS) }),
  makeGeminiAdapter({ modelId: 'gemini-2.5-flash', transport: staticGeminiTransport(GEMINI_AMBIGUOUS) }),
];

const specified = await buildCase('live-specified', sampleProvider, orderTask, specifiedPaths, 'place_order');
const ambiguous = await buildCase('live-ambiguous', sampleProvider, coffeeAmbiguousTask, ambiguousPaths);

// generatedAt derived from the run's own model timestamps (GPT `created` 1786308547).
const RUN_ISO = new Date(1786308547 * 1000).toISOString();
const report = assembleReport({
  providerName: sampleProvider.name,
  declaredTools: sampleProvider.tools.map((t) => t.def),
  runtimeId: REFERENCE_RUNTIME_ID,
  browserVersion: null,
  cases: [specified, ambiguous],
  generatedAt: RUN_ISO,
});

// ── Write the artifact ──────────────────────────────────────────────────────────────────────
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'evidence', 'three-way-2026-08-09');
mkdirSync(join(outDir, 'raw'), { recursive: true });

const files: Record<string, string> = {};
const put = (rel: string, content: string): void => { files[rel] = content; };

put('three-way-report.json', JSON.stringify(report, null, 2) + '\n');
put('three-way-report.md', '```\n' + renderHuman(report) + '\n```\n');
put('fixtures.json', JSON.stringify({ provider: { name: sampleProvider.name, tools: sampleProvider.tools.map((t) => t.def) }, tasks: [orderTask, coffeeAmbiguousTask] }, null, 2) + '\n');
put('raw/anthropic-claude.json', JSON.stringify({ 'live-specified': CLAUDE_SPECIFIED, 'live-ambiguous': CLAUDE_AMBIGUOUS }, null, 2) + '\n');
put('raw/openai-gpt.json', JSON.stringify({ 'live-specified': GPT_SPECIFIED, 'live-ambiguous': GPT_AMBIGUOUS }, null, 2) + '\n');
put('raw/google-gemini.json', JSON.stringify({ 'live-specified': GEMINI_SPECIFIED, 'live-ambiguous': GEMINI_AMBIGUOUS }, null, 2) + '\n');

put('metadata.json', JSON.stringify({
  runDate: RUN_ISO,
  lane: { runtimeId: REFERENCE_RUNTIME_ID, browserVersion: null, note: 'reference lane — NOT real Chrome/WebMCP' },
  reportGeneratorVersion: REPORT_GENERATOR_VERSION,
  reportVersion: report.reportVersion,
  providerDefHash: report.provider.providerDefHash,
  toolSurfaceHash: report.lane.toolSurfaceHash,
  models: [
    { adapterId: 'anthropic-claude', adapterVersion: '1.0.0', modelId: 'claude-haiku-4-5-20251001', responseIds: [CLAUDE_SPECIFIED.id, CLAUDE_AMBIGUOUS.id] },
    { adapterId: 'openai-gpt', adapterVersion: '1.0.0', modelId: 'gpt-4o-mini', resolvedModel: 'gpt-4o-mini-2024-07-18', responseIds: [GPT_SPECIFIED.id, GPT_AMBIGUOUS.id] },
    { adapterId: 'google-gemini', adapterVersion: '1.0.0', modelId: 'gemini-2.5-flash', responseIds: [GEMINI_SPECIFIED.responseId, GEMINI_AMBIGUOUS.responseId] },
  ],
  workflowRun: 'GitHub Actions — "Provider-conformance — live smoke (multi-model)". The original evidence-bundle artifact is attached to that run.',
}, null, 2) + '\n');

put('NOTES.md', [
  '# Three-way conformance evidence — 2026-08-09',
  '',
  'This artifact records observed cross-consumer behavior under a fixed provider surface and',
  'task set. **It is not a benchmark of model quality and does not establish universal',
  'interoperability.**',
  '',
  'What it does record: the same provider (`@example/sample-cafe`), the same two tasks, and the',
  'same common execution bridge, exercised through three independent consumer/model paths —',
  'Anthropic Claude, OpenAI GPT, Google Gemini — on the **reference runtime** (`reference-runtime/1`,',
  'NOT real Chrome/WebMCP). Raw responses from all three models are preserved verbatim under',
  '`raw/`; provenance (hashes, model IDs, adapter/generator versions) is in `metadata.json`.',
  '',
  '## The observation',
  '',
  '- **Specified task** ("order a medium latte"): all three converge on `place_order{latte,M}`.',
  '  Behavioral divergence: none. Provider: PASS.',
  '- **Ambiguous task** ("order a coffee", no size, provider declares no default): a 2–1 strategy',
  '  split — Claude and Gemini **defer** (ask the user); GPT **inspects** the provider',
  '  (`find_item`). GPT\'s read is outside the pre-frozen allowable terminal outcomes and is',
  '  attributed to `model_tool_selection` (not fabricated input). **No path implicated the',
  '  provider — Provider: PASS throughout.**',
  '',
  'The allowable-outcome rubric in `fixtures.json` was frozen BEFORE the run. Model behavior is',
  'observation, not ground truth.',
  '',
].join('\n'));

// Manifest of sha256 over every content file (excludes the manifest + README).
const manifestLines = Object.keys(files).sort().map((rel) => `${createHash('sha256').update(files[rel] as string).digest('hex')}  ${rel}`);
put('MANIFEST.sha256', manifestLines.join('\n') + '\n');

put('README.md', [
  '# Three-way conformance evidence — 2026-08-09',
  '',
  'The first live three-way (Claude + GPT + Gemini) provider-conformance run, frozen. Same',
  'provider, same tasks, one execution bridge; reference runtime lane.',
  '',
  '- `three-way-report.json` — machine-readable report (raw responses embedded, full provenance)',
  '- `three-way-report.md` — human-readable rendering',
  '- `fixtures.json` — provider definition + the frozen task fixtures / allowable-outcome rubric',
  '- `raw/*.json` — verbatim raw responses per model, per case',
  '- `metadata.json` — model IDs, adapter/generator versions, hashes, response IDs, run date',
  '- `MANIFEST.sha256` — sha256 of each file (reproducible via `scripts/freeze-three-way.ts`)',
  '- `NOTES.md` — claim-free interpretation',
  '',
  'Reproduce: `node --experimental-strip-types scripts/freeze-three-way.ts` regenerates these',
  'files identically (the manifest hashes will match).',
  '',
].join('\n'));

for (const [rel, content] of Object.entries(files)) writeFileSync(join(outDir, rel), content);
console.log(`Froze ${Object.keys(files).length} files to ${outDir}`);
console.log('\n' + renderHuman(report));
