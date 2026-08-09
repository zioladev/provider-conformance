// @zioladev/provider-conformance — public surface (Milestone 2A).
//
// An evidence-and-attribution system for WebMCP providers. Clean-room: this package
// imports nothing from @selvage/* or any proprietary source. See docs/provider-conformance/.

export type {
  Effect,
  JsonSchema,
  ToolDef,
  NormalizedTool,
  ExecutionResult,
  AdapterError,
  ConsumerDecision,
  TaskSpec,
  PlanInput,
  ModelConsumerAdapter,
  Outcome,
  ActionDisposition,
  AttributionCategory,
  Verdict,
  StepResults,
  PathObservation,
  AttributionEntry,
  PathDerived,
  DivergenceKind,
  DivergenceResult,
  ConformanceCase,
} from './types.ts';
export { PROVIDER_OWNED } from './types.ts';

export { evaluatePath, evaluateDivergence, evaluateCase, providerGrade } from './engine.ts';
export { validateDefinition, validateProvider, validateInput, normalizeDiscovered } from './normalize.ts';
export { ReferenceRuntime, REFERENCE_RUNTIME_ID } from './reference-runtime.ts';
export type { RegisteredTool, RuntimeTool, WebMcpRuntime } from './reference-runtime.ts';
export { detectWebMcpRuntime, findModelContext, captureBrowserVersion, CHROME_WEBMCP_RUNTIME_ID } from './webmcp-runtime.ts';
export { discover, execute } from './bridge.ts';
export type { BridgeOutcome } from './bridge.ts';
export { makeScriptedAdapter } from './adapters/scripted.ts';
export type { ScriptedAdapterConfig } from './adapters/scripted.ts';
export { makeClaudeAdapter, anthropicFetchTransport, staticAnthropicTransport } from './adapters/claude.ts';
export type { ClaudeAdapterConfig, AnthropicTransport, AnthropicRequest, AnthropicResponse, AnthropicContentBlock } from './adapters/claude.ts';
export { makeGptAdapter, openaiFetchTransport, staticOpenAiTransport } from './adapters/gpt.ts';
export type { GptAdapterConfig, OpenAiTransport, OpenAiRequest, OpenAiResponse, OpenAiToolCall } from './adapters/gpt.ts';
export { makeGeminiAdapter, geminiFetchTransport, staticGeminiTransport, cleanSchemaForGemini } from './adapters/gemini.ts';
export type { GeminiAdapterConfig, GeminiTransport, GeminiRequest, GeminiResponse, GeminiPart, GeminiFunctionDeclaration } from './adapters/gemini.ts';
export { runPath, runPathOnRuntime, buildCase, buildCaseOnRuntime } from './run-case.ts';
export type { ProviderTool, ProviderUnderTest } from './run-case.ts';
export { assembleReport } from './report.ts';
export type { ReportInput, ProviderConformanceReport } from './report.ts';
export { renderHuman } from './render.ts';
export { REPORT_VERSION, REPORT_GENERATOR, REPORT_GENERATOR_VERSION } from './report-version.ts';
