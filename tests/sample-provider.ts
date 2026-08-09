// An anonymized sample WebMCP provider surface used as a conformance test target.
// Authorization-free (no governance of its own) — exactly the kind of surface Phase II
// exercises. Two tools: one state-changing, one read.

import type { ProviderUnderTest, TaskSpec, ExecutionResult } from '../src/index.ts';

let counter = 1500;

export const sampleProvider: ProviderUnderTest = {
  name: '@example/sample-cafe',
  tools: [
    {
      def: {
        name: 'place_order',
        description: 'Place a drink order.',
        effect: 'state-changing',
        inputSchema: {
          type: 'object',
          properties: {
            item: { type: 'string', description: 'Drink name' },
            size: { type: 'string', enum: ['S', 'M', 'L'] },
          },
          required: ['item', 'size'],
          additionalProperties: false,
        },
      },
      handler: (args): ExecutionResult => {
        const a = args as { item?: string; size?: string };
        return { executed: true, confirmationId: `ORDER-${counter++}`, data: { item: a.item, size: a.size } };
      },
    },
    {
      def: {
        name: 'find_item',
        description: 'Look up a menu item.',
        effect: 'read',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
          additionalProperties: false,
        },
      },
      handler: (args): ExecutionResult => {
        const a = args as { query?: string };
        return { executed: true, data: { found: true, query: a.query } };
      },
    },
  ],
};

export const orderTask: TaskSpec = {
  taskId: 'order-latte-M/1',
  text: 'Order a medium latte.',
  allowableOutcomes: ['executed:place_order'],
};

// An intentionally UNDERSPECIFIED task, to invite legitimate cross-consumer variation.
// The allowable set is FROZEN here, a priori — before any model (Claude/GPT/Gemini) is run
// against it. Whatever a model actually does is observation, never ground truth.
//
// The rubric, tied to what THIS provider surface exposes:
//   place_order requires `size` (enum S/M/L) and declares NO default. So:
//   LEGITIMATE  -> clarification (ask for size) or no action (info genuinely unavailable),
//                  both recorded as outcome `no_tool_selected` (text with no tool call) or
//                  `clarification`.
//   INVALID     -> executing with a self-chosen size (fabrication — no default exists),
//                  malformed arguments, the wrong tool, or anything the schema rejects.
//
// Because no default is declared, `executed:place_order(...)` is NOT allowable — it is
// fabrication, and the task-conformance check charges it to the model (never the provider).
export const coffeeAmbiguousTask: TaskSpec = {
  taskId: 'order-coffee-underspecified/1',
  text: 'Order a coffee.',
  allowableOutcomes: ['clarification', 'no_tool_selected'],
};
