// Generates the intentionally-ugly demo report: a boring JSON artifact + a readable
// text/Markdown rendering. Deterministic (fixed timestamp) so the committed artifacts are
// stable. Run: node --experimental-strip-types scripts/gen-demo.ts

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { makeScriptedAdapter, makeClaudeAdapter, staticAnthropicTransport, makeGptAdapter, staticOpenAiTransport, buildCase, assembleReport, renderHuman, REFERENCE_RUNTIME_ID } from '../src/index.ts';
import { sampleProvider, orderTask, coffeeAmbiguousTask } from '../tests/sample-provider.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'examples');
mkdirSync(outDir, { recursive: true });

const good = makeScriptedAdapter({ id: 'scripted', modelId: 'scripted/deterministic', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } } });
const bad = makeScriptedAdapter({ id: 'scripted', modelId: 'scripted/deterministic', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte' } } });

const happy = await buildCase('happy-path', sampleProvider, orderTask, [good], 'place_order');
const malformed = await buildCase('malformed-arguments', sampleProvider, orderTask, [bad], 'place_order');

const report = assembleReport({
  providerName: sampleProvider.name,
  declaredTools: sampleProvider.tools.map((t) => t.def),
  runtimeId: REFERENCE_RUNTIME_ID,
  browserVersion: null,
  cases: [happy, malformed],
  generatedAt: '2026-08-09T00:00:00.000Z',
});

writeFileSync(join(outDir, 'demo-report.json'), JSON.stringify(report, null, 2) + '\n');
writeFileSync(join(outDir, 'demo-report.md'), '```\n' + renderHuman(report) + '\n```\n');

// 2B: a two-path, same-surface comparison producing a behavioral divergence. The scripted
// reference path and the Claude path (via a canned transport — deterministic) pick the same
// tool with different but allowable arguments. Divergence is real; the provider stays PASS.
const claude = makeClaudeAdapter({
  transport: staticAnthropicTransport({ content: [{ type: 'tool_use', id: 'tu', name: 'place_order', input: { item: 'latte', size: 'L' } }], stop_reason: 'tool_use' }),
});
const divergenceCase = await buildCase('same-surface-two-paths', sampleProvider, orderTask, [good, claude], 'place_order');
const divergenceReport = assembleReport({
  providerName: sampleProvider.name,
  declaredTools: sampleProvider.tools.map((t) => t.def),
  runtimeId: REFERENCE_RUNTIME_ID,
  browserVersion: null,
  cases: [divergenceCase],
  generatedAt: '2026-08-09T00:00:00.000Z',
});

writeFileSync(join(outDir, 'demo-divergence.json'), JSON.stringify(divergenceReport, null, 2) + '\n');
writeFileSync(join(outDir, 'demo-divergence.md'), '```\n' + renderHuman(divergenceReport) + '\n```\n');

// Ambiguous task (frozen allowable set): a legitimate clarification vs. a fabricated size.
// This is `outcome` divergence — the fabricating path is charged to the model; provider PASS.
const clarify = makeScriptedAdapter({ id: 'scripted-clarify', modelId: 'scripted/deterministic', decide: { type: 'clarification', message: 'What size would you like?' } });
const declineNoInfo = makeScriptedAdapter({ id: 'scripted-noinfo', modelId: 'scripted/deterministic', decide: { type: 'no_action', reason: 'no size provided' } });
const fabricate = makeClaudeAdapter({ transport: staticAnthropicTransport({ content: [{ type: 'tool_use', id: 'tu', name: 'place_order', input: { item: 'coffee', size: 'M' } }], stop_reason: 'tool_use' }) });
// Case A: clarify vs. fabricate -> outcome divergence (fabrication charged to the model).
const outcomeCase = await buildCase('coffee-clarify-vs-fabricate', sampleProvider, coffeeAmbiguousTask, [clarify, fabricate]);
// Case B: clarification vs. no_tool_selected -> both DEFERRED. Representational difference,
// but NO behavioral divergence (the live coffee finding, resolved).
const representationalCase = await buildCase('coffee-clarify-vs-defer', sampleProvider, coffeeAmbiguousTask, [clarify, declineNoInfo]);
// Case C: the real live result — Claude deferred (asked the user); GPT inspected (ran a read).
// Different strategies, neither changed state, provider PASS. GPT's read is `inspected`, not
// `acted`, and its fault is model_tool_selection, not model_arguments.
const inspect = makeGptAdapter({ transport: staticOpenAiTransport({ choices: [{ message: { content: null, tool_calls: [{ id: 'call_x', type: 'function', function: { name: 'find_item', arguments: '{"query":"coffee"}' } }] } }] }) });
const inspectedCase = await buildCase('coffee-defer-vs-inspect', sampleProvider, coffeeAmbiguousTask, [clarify, inspect]);
const ambiguousReport = assembleReport({
  providerName: sampleProvider.name,
  declaredTools: sampleProvider.tools.map((t) => t.def),
  runtimeId: REFERENCE_RUNTIME_ID,
  browserVersion: null,
  cases: [outcomeCase, representationalCase, inspectedCase],
  generatedAt: '2026-08-09T00:00:00.000Z',
});
writeFileSync(join(outDir, 'demo-ambiguous.json'), JSON.stringify(ambiguousReport, null, 2) + '\n');
writeFileSync(join(outDir, 'demo-ambiguous.md'), '```\n' + renderHuman(ambiguousReport) + '\n```\n');

console.log('wrote examples/demo-report.{json,md}, demo-divergence.{json,md}, demo-ambiguous.{json,md}');
console.log('\n' + renderHuman(report));
console.log('\n=== 2B same-surface divergence ===\n' + renderHuman(divergenceReport));
console.log('\n=== ambiguous task (frozen rubric): clarify vs fabricate ===\n' + renderHuman(ambiguousReport));
