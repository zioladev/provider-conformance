// The ambiguous-task rubric, frozen and pinned DETERMINISTICALLY — before any live model is
// run against it. These tests encode what is legitimate vs. invalid for "Order a coffee."
// against a provider that declares no default size. Live model behavior is observation only;
// this is the ground truth it is measured against.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeScriptedAdapter,
  makeClaudeAdapter,
  staticAnthropicTransport,
  buildCase,
  evaluateCase,
  runPath,
  evaluatePath,
} from '../src/index.ts';
import { sampleProvider, coffeeAmbiguousTask } from './sample-provider.ts';

const clarify = makeScriptedAdapter({ id: 'scripted-clarify', modelId: 'm', decide: { type: 'clarification', message: 'What size would you like?' } });
const declineNoInfo = makeScriptedAdapter({ id: 'scripted-noinfo', modelId: 'm', decide: { type: 'no_action', reason: 'no size provided' } });
const fabricate = makeScriptedAdapter({ id: 'scripted-fab', modelId: 'm', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'coffee', size: 'M' } } });
// The live GPT strategy: resolve ambiguity informationally — run a read tool against the provider.
const inspect = makeScriptedAdapter({ id: 'scripted-inspect', modelId: 'm', decide: { type: 'tool_call', toolName: 'find_item', arguments: { query: 'coffee' } } });

test('LEGITIMATE: a clarification is within the frozen allowable set -> PASS, no fault', async () => {
  const obs = await runPath(sampleProvider, coffeeAmbiguousTask, clarify);
  const d = evaluatePath(obs, coffeeAmbiguousTask, undefined);
  assert.equal(d.outcome, 'clarification');
  assert.equal(d.attribution.length, 0);
  assert.equal(d.providerNonconformance, false);
});

test('LEGITIMATE: no action (info unavailable) is allowable -> PASS, no fault', async () => {
  const obs = await runPath(sampleProvider, coffeeAmbiguousTask, declineNoInfo);
  const d = evaluatePath(obs, coffeeAmbiguousTask, undefined);
  assert.equal(d.outcome, 'no_tool_selected');
  assert.equal(d.attribution.length, 0, 'no_action is legitimate here because the task allows it');
  assert.equal(d.providerNonconformance, false);
});

test('INVALID: fabricating a size (no provider default) -> model_arguments FAIL, provider PASS', async () => {
  const obs = await runPath(sampleProvider, coffeeAmbiguousTask, fabricate);
  const d = evaluatePath(obs, coffeeAmbiguousTask, undefined);
  assert.equal(d.outcome, 'executed'); // the schema accepted "M" — it DID execute
  assert.equal(d.attribution[0]?.category, 'model_arguments');
  assert.equal(d.attribution[0]?.signal, 'task_conformance');
  assert.equal(d.providerNonconformance, false, 'fabrication is a model fault — the provider is fine');
});

test('DIVERGENCE (outcome): clarify vs. fabricate -> outcome divergence, provider PASS', async () => {
  const c = await buildCase('ambiguous', sampleProvider, coffeeAmbiguousTask, [clarify, fabricate]);
  const { divergence, provider, deriveds } = evaluateCase(c);
  assert.equal(divergence.kind, 'outcome');
  assert.equal(provider, 'PASS', 'a model-side disagreement never moves the provider grade');
  assert.equal(deriveds[0]?.providerNonconformance, false);
  assert.equal(deriveds[1]?.providerNonconformance, false);
});

test('DIVERGENCE (none) but both invalid: two fabrications agree -> no divergence, both model_arguments FAIL', async () => {
  // Real Claude (canned) fabricates the same size as the scripted fabricator. They AGREE, so
  // divergence is none — yet both invented a size, so both carry a model_arguments fault. The
  // system says: "no disagreement, but both consumers fabricated; the provider is fine."
  const claudeFab = makeClaudeAdapter({ transport: staticAnthropicTransport({ content: [{ type: 'tool_use', id: 'tu', name: 'place_order', input: { item: 'coffee', size: 'M' } }], stop_reason: 'tool_use' }) });
  const c = await buildCase('ambiguous', sampleProvider, coffeeAmbiguousTask, [fabricate, claudeFab]);
  const { divergence, provider, deriveds } = evaluateCase(c);
  assert.equal(divergence.kind, 'none');
  assert.equal(provider, 'PASS');
  for (const d of deriveds) {
    assert.equal(d.attribution[0]?.category, 'model_arguments');
    assert.equal(d.providerNonconformance, false);
  }
});

test('INSPECTED: a read execution is inspected (not acted); out-of-allowable -> model_tool_selection', async () => {
  // GPT's live coffee behavior: find_item(query:"coffee"). Nothing changed; "coffee" came from
  // the task (nothing fabricated). The tool selection itself is outside allowable → tool_selection.
  const obs = await runPath(sampleProvider, coffeeAmbiguousTask, inspect);
  const d = evaluatePath(obs, coffeeAmbiguousTask, undefined);
  assert.equal(d.outcome, 'executed');
  assert.equal(d.disposition, 'inspected', 'a read execution is inspected, not acted');
  assert.equal(d.attribution[0]?.category, 'model_tool_selection', 'the fault is tool choice, not fabricated args');
  assert.match(d.attribution[0]?.detail ?? '', /exploratory read/);
  assert.doesNotMatch(d.attribution[0]?.detail ?? '', /fabricat/);
  assert.equal(d.providerNonconformance, false);
});

test('DIVERGENCE: clarify (deferred) vs inspect (inspected) -> outcome divergence, provider PASS', async () => {
  // The real live result: Claude deferred (asked the user); GPT inspected (queried the provider).
  // Different strategies, neither changed state, provider untouched.
  const c = await buildCase('ambiguous', sampleProvider, coffeeAmbiguousTask, [clarify, inspect]);
  const { divergence, provider, deriveds } = evaluateCase(c);
  assert.equal(divergence.kind, 'outcome');
  assert.equal(provider, 'PASS');
  assert.equal(deriveds[0]?.disposition, 'deferred');
  assert.equal(deriveds[1]?.disposition, 'inspected');
  assert.equal(deriveds[1]?.attribution[0]?.category, 'model_tool_selection');
});

test('REPRESENTATIONAL only: clarification vs no_tool_selected -> no behavioral divergence', async () => {
  // The live coffee case: a scripted clarification vs. a text-only model turn (no_tool_selected).
  // Both DEFERRED action, both allowable. The labels differ (representational), but the practical
  // result is identical — so behavioral divergence is `none`, not `behavioral`. Provider PASS.
  const c = await buildCase('ambiguous', sampleProvider, coffeeAmbiguousTask, [clarify, declineNoInfo]);
  const { divergence, provider, deriveds } = evaluateCase(c);

  assert.equal(divergence.kind, 'none', 'both deferred → no meaningful behavioral divergence');
  assert.equal(divergence.representationalDifference, true, 'the labels (clarification vs no_tool_selected) differ');
  assert.equal(provider, 'PASS');
  assert.equal(deriveds[0]?.disposition, 'deferred');
  assert.equal(deriveds[1]?.disposition, 'deferred');
  for (const d of deriveds) assert.equal(d.attribution.length, 0);
});

test('regression: the fully-specified task is unaffected by task-conformance', async () => {
  // "Order a medium latte" with a valid execution stays a clean PASS (executed is allowable).
  const good = makeScriptedAdapter({ id: 's', modelId: 'm', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } } });
  const { orderTask } = await import('./sample-provider.ts');
  const obs = await runPath(sampleProvider, orderTask, good);
  const d = evaluatePath(obs, orderTask, 'place_order');
  assert.equal(d.outcome, 'executed');
  assert.equal(d.attribution.length, 0);
});
