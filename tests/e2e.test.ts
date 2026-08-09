// The live spine end-to-end (§12, 2A gate): a real provider surface on the reference
// runtime, a real ModelConsumerAdapter, a real ConsumerDecision through the common bridge,
// real provider evidence — producing a fully attributable report. Deterministic: the
// adapter's decision is scripted, so no network/model non-determinism.

import test from 'node:test';
import assert from 'node:assert/strict';
import { makeScriptedAdapter, runPath, evaluatePath, buildCase, assembleReport, REFERENCE_RUNTIME_ID } from '../src/index.ts';
import { sampleProvider, orderTask } from './sample-provider.ts';

test('happy path: valid decision executes and grades PASS', async () => {
  const adapter = makeScriptedAdapter({
    id: 'scripted', modelId: 'scripted/deterministic',
    decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } },
  });
  const obs = await runPath(sampleProvider, orderTask, adapter);
  const d = evaluatePath(obs, orderTask, 'place_order');

  assert.equal(d.outcome, 'executed');
  assert.equal(d.providerNonconformance, false);
  assert.equal(d.attribution.length, 0);
  assert.match(d.observableOutcomeKey, /^executed:place_order\(/);
});

test('malformed arguments: attributed to model, provider stays PASS, execution NOT REACHED', async () => {
  const adapter = makeScriptedAdapter({
    id: 'scripted', modelId: 'scripted/deterministic',
    decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte' } }, // missing required "size"
  });
  const obs = await runPath(sampleProvider, orderTask, adapter);
  const d = evaluatePath(obs, orderTask, 'place_order');

  assert.equal(d.outcome, 'malformed_arguments');
  assert.equal(d.attribution[0]?.category, 'model_arguments');
  assert.equal(d.providerNonconformance, false);
  assert.equal(d.categoryVerdicts.provider_execution, 'NOT_REACHED');
});

test('the full report assembles and is well-formed', async () => {
  const good = makeScriptedAdapter({ id: 'scripted', modelId: 'm', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } } });
  const bad = makeScriptedAdapter({ id: 'scripted', modelId: 'm', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte' } } });

  const c1 = await buildCase('happy', sampleProvider, orderTask, [good], 'place_order');
  const c2 = await buildCase('malformed-args', sampleProvider, orderTask, [bad], 'place_order');

  const report = assembleReport({
    providerName: sampleProvider.name,
    declaredTools: sampleProvider.tools.map((t) => t.def),
    runtimeId: REFERENCE_RUNTIME_ID,
    browserVersion: null,
    cases: [c1, c2],
    generatedAt: '2026-08-09T00:00:00.000Z',
  });

  assert.equal(report.reportVersion, 'provider-conformance-report/1');
  assert.equal(report.summary.provider, 'PASS'); // no provider-owned failure across either case
  assert.equal(report.lane.runtimeId, 'reference-runtime/1');
  assert.equal(report.lane.browserVersion, null);
  assert.ok(report.provider.providerDefHash.startsWith('fnv1a:'));
  assert.equal(report.cases.length, 2);
});
