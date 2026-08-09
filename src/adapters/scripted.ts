// The 2A ModelConsumerAdapter: a deterministic, scripted adapter.
//
// It implements the ModelConsumerAdapter contract exactly (plan() returns a decision and
// NEVER executes), with a canned decision instead of a live model call. This is what
// keeps the reference-runtime lane deterministic and hermetic (no network, no API keys),
// and is the same discipline the golden fixtures use. Real model-family adapters
// (Claude/GPT/Gemini) arrive in 2B/2C — see docs/provider-conformance/03 and 12.

import type { ConsumerDecision, ModelConsumerAdapter, PlanInput } from '../types.ts';

export interface ScriptedAdapterConfig {
  id?: string;
  version?: string;
  modelId?: string;
  /** The decision to return, or a function of the plan input. */
  decide: ConsumerDecision | ((input: PlanInput) => ConsumerDecision);
}

export function makeScriptedAdapter(config: ScriptedAdapterConfig): ModelConsumerAdapter {
  const decide = config.decide;
  return {
    id: config.id ?? 'scripted',
    version: config.version ?? '1.0.0',
    modelId: config.modelId ?? 'scripted/deterministic',
    async plan(input: PlanInput): Promise<ConsumerDecision> {
      // The invariant, enforced by construction: we only ever RETURN a decision.
      return typeof decide === 'function' ? decide(input) : decide;
    },
  };
}
