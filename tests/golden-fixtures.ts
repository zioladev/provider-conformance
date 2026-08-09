// Golden report fixtures (§13): synthetic cases with KNOWN, authored-in-advance correct
// attribution. They feed scripted observed facts straight into the attribution engine, so
// they isolate the report engine's logic from model non-determinism entirely. Every future
// change to the engine must reproduce these attributions exactly — they are regression truth.

import type { ConformanceCase, StepResults, PathObservation } from '../src/index.ts';

function happySteps(): StepResults {
  return {
    definition: { valid: true, violations: [] },
    browserRuntime: { ok: true },
    discovery: { ok: true, names: ['place_order', 'order_item'] },
    adapterFormat: { ok: true, normalizationApplied: [], droppedRequiredFields: [] },
    decision: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } },
    bridge: { attempted: true, ok: true, toolName: 'place_order', arguments: { item: 'latte', size: 'M' } },
    providerExec: { reached: true, ok: true, firedTool: 'place_order' },
    argsValidation: { checked: true, ok: true, missingOrInvalidFields: [] },
    evidence: { checked: true, ok: true, executionResult: { executed: true, confirmationId: 'ORDER-1' }, violations: [] },
  };
}

function path(adapterId: string, steps: StepResults): PathObservation {
  return { adapterId, adapterVersion: '1.0.0', modelId: `${adapterId}/model`, steps };
}

function merge(base: StepResults, over: Partial<StepResults>): StepResults {
  return { ...base, ...over };
}

export interface GoldenFixture {
  caseId: string;
  title: string;
  build: () => ConformanceCase;
  expected: {
    outcome?: string;
    owner?: string; // attribution category, or 'none'
    providerNonconformance: boolean;
    divergenceKind?: string;
  };
}

export const GOLDEN: GoldenFixture[] = [
  {
    caseId: 'G1-provider-schema-invalid',
    title: 'provider schema invalid -> provider_definition',
    build: () => ({
      caseId: 'G1',
      task: { taskId: 't-G1', text: 'order', allowableOutcomes: ['executed:place_order'] },
      expectedTool: 'place_order',
      paths: [path('scripted', merge(happySteps(), {
        definition: { valid: false, violations: ['unsupported schema keyword "$ref" at place_order'] },
      }))],
    }),
    expected: { outcome: 'provider_error', owner: 'provider_definition', providerNonconformance: true },
  },
  {
    caseId: 'G2-adapter-mangles-schema',
    title: 'adapter drops a required field -> consumer_adapter',
    build: () => ({
      caseId: 'G2',
      task: { taskId: 't-G2', text: 'order', allowableOutcomes: ['executed:place_order'] },
      expectedTool: 'place_order',
      paths: [path('scripted', merge(happySteps(), {
        adapterFormat: { ok: true, normalizationApplied: ['rewrote schema for model'], droppedRequiredFields: ['size'] },
        decision: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte' } },
        bridge: { attempted: true, ok: true, toolName: 'place_order', arguments: { item: 'latte' } },
        argsValidation: { checked: true, ok: false, missingOrInvalidFields: ['size'] },
        providerExec: { reached: false, ok: false },
        evidence: { checked: false, ok: true, violations: [] },
      }))],
    }),
    expected: { outcome: 'malformed_arguments', owner: 'consumer_adapter', providerNonconformance: false },
  },
  {
    caseId: 'G3-model-malformed-args',
    title: 'model emits malformed args (adapter faithful) -> model_arguments',
    build: () => ({
      caseId: 'G3',
      task: { taskId: 't-G3', text: 'order', allowableOutcomes: ['executed:place_order'] },
      expectedTool: 'place_order',
      paths: [path('scripted', merge(happySteps(), {
        adapterFormat: { ok: true, normalizationApplied: [], droppedRequiredFields: [] },
        decision: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte' } },
        bridge: { attempted: true, ok: true, toolName: 'place_order', arguments: { item: 'latte' } },
        argsValidation: { checked: true, ok: false, missingOrInvalidFields: ['size'] },
        providerExec: { reached: false, ok: false },
        evidence: { checked: false, ok: true, violations: [] },
      }))],
    }),
    expected: { outcome: 'malformed_arguments', owner: 'model_arguments', providerNonconformance: false },
  },
  {
    caseId: 'G4-bridge-wrong-handle',
    title: 'bridge invokes the wrong handle -> execution_bridge',
    build: () => ({
      caseId: 'G4',
      task: { taskId: 't-G4', text: 'order', allowableOutcomes: ['executed:place_order'] },
      expectedTool: 'place_order',
      paths: [path('scripted', merge(happySteps(), {
        bridge: { attempted: true, ok: false, toolName: 'place_order', arguments: { item: 'latte', size: 'M' }, error: { code: 'bridge_bad_handle', message: 'passed a name string instead of a RegisteredTool handle' } },
        argsValidation: { checked: false, ok: true, missingOrInvalidFields: [] },
        providerExec: { reached: false, ok: false },
        evidence: { checked: false, ok: true, violations: [] },
      }))],
    }),
    expected: { outcome: 'execution_bridge_error', owner: 'execution_bridge', providerNonconformance: false },
  },
  {
    caseId: 'G5-evidence-contract-violation',
    title: 'provider executes but violates the result contract -> evidence_contract',
    build: () => ({
      caseId: 'G5',
      task: { taskId: 't-G5', text: 'order', allowableOutcomes: ['executed:place_order'] },
      expectedTool: 'place_order',
      paths: [path('scripted', merge(happySteps(), {
        providerExec: { reached: true, ok: true, firedTool: 'place_order' },
        evidence: { checked: true, ok: false, executionResult: { executed: true }, violations: ['state-changing tool reported executed:true without a confirmationId'] },
      }))],
    }),
    expected: { outcome: 'provider_error', owner: 'evidence_contract', providerNonconformance: true },
  },
  {
    caseId: 'G6-behavioral-divergence',
    title: 'two paths conform but select different valid tools -> behavioral divergence (not failure)',
    build: () => ({
      caseId: 'G6',
      task: { taskId: 't-G6', text: 'order', allowableOutcomes: ['executed:place_order', 'executed:order_item'] },
      // No single expectedTool: both tools are legitimate for this task.
      paths: [
        path('openai-gpt', merge(happySteps(), {
          decision: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } },
          bridge: { attempted: true, ok: true, toolName: 'place_order', arguments: { item: 'latte', size: 'M' } },
          providerExec: { reached: true, ok: true, firedTool: 'place_order' },
        })),
        path('anthropic-claude', merge(happySteps(), {
          decision: { type: 'tool_call', toolName: 'order_item', arguments: { item: 'latte', size: 'M' } },
          bridge: { attempted: true, ok: true, toolName: 'order_item', arguments: { item: 'latte', size: 'M' } },
          providerExec: { reached: true, ok: true, firedTool: 'order_item' },
        })),
      ],
    }),
    expected: { divergenceKind: 'behavioral', providerNonconformance: false },
  },
];
