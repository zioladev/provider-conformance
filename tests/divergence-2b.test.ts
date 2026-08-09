// Milestone 2B acceptance: one real model adapter (Claude, via injected transport) runs
// against the SAME provider surface, bridge, report schema, and attribution taxonomy as the
// scripted reference path. We compare the two observable paths and assert divergence is
// classified correctly — without altering the provider grade unless a provider-owned layer
// actually failed.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeScriptedAdapter,
  makeClaudeAdapter,
  staticAnthropicTransport,
  buildCase,
  evaluateCase,
} from '../src/index.ts';
import type { ProviderUnderTest, ExecutionResult } from '../src/index.ts';
import { sampleProvider, orderTask } from './sample-provider.ts';

const scripted = makeScriptedAdapter({
  id: 'scripted',
  modelId: 'scripted/deterministic',
  decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } },
});

function claudeReturning(input: unknown) {
  return makeClaudeAdapter({
    transport: staticAnthropicTransport({
      content: [{ type: 'tool_use', id: 'tu', name: 'place_order', input }],
      stop_reason: 'tool_use',
    }),
  });
}

test('behavioral divergence: same tool, different VALID args -> not a failure, provider PASS', async () => {
  // Claude picks a different (but allowable) size than the scripted reference.
  const claude = claudeReturning({ item: 'latte', size: 'L' });
  const c = await buildCase('order', sampleProvider, orderTask, [scripted, claude], 'place_order');
  const { divergence, provider, deriveds } = evaluateCase(c);

  assert.equal(divergence.kind, 'behavioral');
  assert.equal(divergence.withinAllowable, true);
  assert.equal(provider, 'PASS');
  for (const d of deriveds) assert.equal(d.providerNonconformance, false);
  // The two observable paths really did differ.
  assert.notEqual(deriveds[0]?.observableOutcomeKey, deriveds[1]?.observableOutcomeKey);
});

test('outcome divergence: Claude emits malformed args -> model_arguments FAIL, provider still PASS', async () => {
  const claude = claudeReturning({ item: 'latte' }); // missing required "size"
  const c = await buildCase('order', sampleProvider, orderTask, [scripted, claude], 'place_order');
  const { divergence, provider, deriveds } = evaluateCase(c);

  assert.equal(divergence.kind, 'outcome');
  assert.equal(provider, 'PASS', 'a model-side failure never moves the provider grade');
  const claudePath = deriveds[1];
  assert.equal(claudePath?.outcome, 'malformed_arguments');
  assert.equal(claudePath?.attribution[0]?.category, 'model_arguments');
  assert.equal(claudePath?.providerNonconformance, false);
});

test('conformance divergence: provider surface behaves differently by caller -> provider FAIL', async () => {
  // A provider whose evidence is contract-violating only for size "L": the SAME surface is
  // valid under one consumer path and non-conformant under another. This is the crown-jewel
  // finding — and the ONE case where the provider grade legitimately drops.
  const flakyProvider: ProviderUnderTest = {
    name: '@example/flaky-evidence',
    tools: [
      {
        def: sampleProvider.tools[0]!.def,
        handler: (args): ExecutionResult => {
          const a = args as { item?: string; size?: string };
          if (a.size === 'L') return { executed: true }; // violates the contract: no confirmationId
          return { executed: true, confirmationId: 'ORDER-1', data: a };
        },
      },
    ],
  };

  const claude = claudeReturning({ item: 'latte', size: 'L' });
  const c = await buildCase('order', flakyProvider, orderTask, [scripted, claude], 'place_order');
  const { divergence, provider, deriveds } = evaluateCase(c);

  assert.equal(divergence.kind, 'conformance');
  assert.equal(provider, 'FAIL', 'a provider-owned failure DOES move the provider grade');
  assert.equal(deriveds[1]?.attribution[0]?.category, 'evidence_contract');
  assert.equal(deriveds[1]?.providerNonconformance, true);
  assert.equal(deriveds[0]?.providerNonconformance, false, 'the other path is clean — divergence depends on the consumer path');
});
