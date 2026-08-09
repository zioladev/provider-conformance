// The second real model-family ModelConsumerAdapter: OpenAI GPT (Milestone 2C).
//
// Same discipline as the Claude adapter (03/2B): plan() DECIDES, never executes; the transport
// is injected so schema formatting + tool-call parsing are tested deterministically (no key,
// no network); the raw model response is always preserved as evidence. Zero dependencies —
// raw fetch against the Chat Completions API, no `openai` SDK.

import type { ConsumerDecision, ModelConsumerAdapter, PlanInput } from '../types.ts';

export interface OpenAiRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  tools: Array<{ type: 'function'; function: { name: string; description: string; parameters: unknown } }>;
  tool_choice?: 'auto' | 'required' | 'none';
}

export interface OpenAiToolCall {
  id?: string;
  type?: string;
  function: { name: string; arguments: string };
}

export interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string | null; tool_calls?: OpenAiToolCall[] } }>;
  [k: string]: unknown;
}

export type OpenAiTransport = (req: OpenAiRequest) => Promise<OpenAiResponse>;

export interface GptAdapterConfig {
  transport: OpenAiTransport;
  modelId?: string;
  version?: string;
  system?: string;
}

/** Tolerant JSON parse: OpenAI returns tool arguments as a JSON string. */
function parseArgs(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Not valid JSON — hand the raw string downstream so the provider's input validation
    // rejects it (malformed_arguments -> model_arguments), rather than hiding it.
    return raw;
  }
}

export function makeGptAdapter(config: GptAdapterConfig): ModelConsumerAdapter {
  const modelId = config.modelId ?? 'gpt-4o-mini';
  return {
    id: 'openai-gpt',
    version: config.version ?? '1.0.0',
    modelId,
    async plan(input: PlanInput): Promise<ConsumerDecision> {
      // 1. Format the normalized surface into OpenAI's function-tool shape (near pass-through).
      const tools = input.tools.map((t) => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.inputSchema },
      }));

      const messages: OpenAiRequest['messages'] = [];
      const system = input.system ?? config.system;
      if (system) messages.push({ role: 'system', content: system });
      messages.push({ role: 'user', content: input.task.text });

      const req: OpenAiRequest = { model: modelId, messages, tools, tool_choice: 'auto' };

      // 2. Invoke. Transport failures are the adapter's environment — never provider fault.
      let res: OpenAiResponse;
      try {
        res = await config.transport(req);
      } catch (err) {
        return { type: 'error', error: { code: 'transport_error', message: err instanceof Error ? err.message : String(err) } };
      }

      // 3. Parse. Raw is ALWAYS preserved as evidence.
      const message = res.choices?.[0]?.message;
      const toolCall = message?.tool_calls?.[0];
      if (toolCall) {
        return { type: 'tool_call', toolName: toolCall.function.name, arguments: parseArgs(toolCall.function.arguments), raw: res };
      }
      // Text without a tool call → the model selected no tool. (Not upgraded to "clarification":
      // that would require judging narration, which Phase II never does — §07.)
      const text = typeof message?.content === 'string' ? message.content : undefined;
      return { type: 'no_action', reason: text ?? 'model returned no tool call', raw: res };
    },
  };
}

/**
 * A real fetch transport to the OpenAI Chat Completions API. Node/browser-safe (global fetch +
 * optional globalThis.process). NOT used in CI — a live run needs a key:
 *   const adapter = makeGptAdapter({ transport: openaiFetchTransport({ model }) })
 */
export function openaiFetchTransport(opts: { apiKey?: string; model?: string; baseUrl?: string }): OpenAiTransport {
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
  const apiKey = opts.apiKey ?? g.process?.env?.['OPENAI_API_KEY'];
  const baseUrl = opts.baseUrl ?? 'https://api.openai.com';
  return async (req: OpenAiRequest): Promise<OpenAiResponse> => {
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`openai ${res.status}: ${await res.text()}`);
    return (await res.json()) as OpenAiResponse;
  };
}

/** Convenience for tests/demos: a transport that always returns a canned response. */
export function staticOpenAiTransport(response: OpenAiResponse): OpenAiTransport {
  return async () => response;
}
