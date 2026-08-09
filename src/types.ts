// Core contracts for @zioladev/provider-conformance (Milestone 2A).
//
// This package is an evidence-and-attribution system: it turns (provider + task +
// consumer path) into a versioned, attributable, machine-readable observation.
// See docs/provider-conformance/ for the full specification.

/** A provider tool's declared effect. */
export type Effect = 'read' | 'state-changing';

/** A minimal JSON-Schema shape (the supported subset). */
export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  description?: string;
  [k: string]: unknown;
}

/** A provider tool definition. */
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  effect: Effect;
}

/** A tool as presented to every adapter after normalization (identical across paths). */
export type NormalizedTool = ToolDef;

/** The structured execution evidence a state-changing tool must return (Phase I contract). */
export interface ExecutionResult {
  executed: boolean;
  confirmationId?: string;
  data?: unknown;
  error?: { code: string; message: string };
}

/** An error surfaced by an adapter (its own logic or its transport to the model). */
export interface AdapterError {
  code: string;
  message: string;
}

/**
 * The decision a ModelConsumerAdapter produces. It DECIDES; it never executes.
 * The four types are intentionally narrower than the outcome vocabulary — the
 * adapter reports only what it decided; the bridge + provider determine the outcome.
 */
export type ConsumerDecision =
  | { type: 'tool_call'; toolName: string; arguments: unknown; raw?: unknown }
  | { type: 'clarification'; message?: string; raw?: unknown }
  | { type: 'no_action'; reason?: string; raw?: unknown }
  | { type: 'error'; error: AdapterError; raw?: unknown };

/** A frozen task (fixture discipline — §08). */
export interface TaskSpec {
  taskId: string;
  text: string;
  /** The set of observable outcomes that count as legitimate for this case. */
  allowableOutcomes: string[];
}

export interface PlanInput {
  task: TaskSpec;
  tools: NormalizedTool[];
  system?: string;
}

/**
 * A model-agnostic consumer. Named ModelConsumerAdapter, deliberately, to avoid the
 * @selvage/core `ConsumerAdapter` collision. INVARIANT: plan() never executes.
 */
export interface ModelConsumerAdapter {
  readonly id: string;
  readonly version: string;
  readonly modelId: string;
  plan(input: PlanInput): Promise<ConsumerDecision>;
}

/** The ten first-class outcomes (§04). Closed per report version. */
export type Outcome =
  | 'executed'
  | 'blocked_by_provider_contract'
  | 'clarification'
  | 'no_tool_selected'
  | 'malformed_arguments'
  | 'adapter_error'
  | 'runtime_error'
  | 'transport_error'
  | 'execution_bridge_error'
  | 'provider_error';

/** The nine fault categories (§05). Closed per report version. */
export type AttributionCategory =
  | 'provider_definition'
  | 'provider_runtime'
  | 'browser_runtime'
  | 'consumer_adapter'
  | 'model_tool_selection'
  | 'model_arguments'
  | 'execution_bridge'
  | 'provider_execution'
  | 'evidence_contract';

/** The four categories that reflect on the provider itself. */
export const PROVIDER_OWNED: readonly AttributionCategory[] = [
  'provider_definition',
  'provider_runtime',
  'provider_execution',
  'evidence_contract',
];

export type Verdict = 'PASS' | 'WARN' | 'FAIL' | 'NOT_REACHED';

/**
 * A higher-order class over outcomes, used for *behavioral* divergence scoring (§07). It keeps
 * meaningful strategy differences without exaggerating them into failures.
 *   acted     ← a STATE-CHANGING tool executed
 *   inspected ← a READ-ONLY tool executed (interrogated the provider; nothing changed)
 *   deferred  ← no provider tool executed (clarification | no_tool_selected | blocked)
 *   failed    ← the path failed before/during execution
 * Claude asking the user (deferred) and GPT running a read (inspected) are NOT the same
 * behavior — and neither changed state.
 */
export type ActionDisposition = 'acted' | 'inspected' | 'deferred' | 'failed';

/**
 * The neutral, observed facts of one consumer path through the pipeline. These are
 * FACTS, not judgments — the attribution engine derives blame from them (§04).
 * The live pipeline produces this by running; golden fixtures supply it directly.
 */
export interface StepResults {
  /** Static validation of the provider definition (schema subset, declared effect). */
  definition: { valid: boolean; violations: string[] };
  /** The browser/WebMCP runtime surface is present and well-formed. */
  browserRuntime: { ok: boolean; detail?: string };
  /** The provider's tool was discovered on the surface as it claimed. */
  discovery: { ok: boolean; names: string[]; missingClaimedTool?: string };
  /** The adapter formatted the schema into the model's tool format. */
  adapterFormat: { ok: boolean; normalizationApplied: string[]; droppedRequiredFields: string[]; error?: AdapterError };
  /** What the adapter decided. */
  decision: ConsumerDecision;
  /** The common execution bridge's attempt to invoke a tool_call decision. */
  bridge: { attempted: boolean; ok: boolean; toolName?: string; arguments?: unknown; error?: { code: string; message: string } };
  /** Whether/how the provider actually executed. `firedEffect` distinguishes read vs. state-changing. */
  providerExec: { reached: boolean; ok: boolean; firedTool?: string; firedEffect?: Effect; error?: { code: string; message: string } };
  /** The provider's own input validation on the arguments. */
  argsValidation: { checked: boolean; ok: boolean; missingOrInvalidFields: string[] };
  /** The ExecutionResult contract check. */
  evidence: { checked: boolean; ok: boolean; executionResult?: ExecutionResult; violations: string[] };
  /** Optional segmented timing. */
  timing?: { model?: number; bridge?: number; provider?: number; total?: number };
}

/** One consumer path's identity + its observed facts. */
export interface PathObservation {
  adapterId: string;
  adapterVersion: string;
  modelId: string;
  steps: StepResults;
}

/** A single attributed finding. */
export interface AttributionEntry {
  category: AttributionCategory;
  verdict: 'FAIL' | 'WARN';
  signal: string;
  detail: string;
}

/** The derived judgments for one path — all re-computable from StepResults. */
export interface PathDerived {
  outcome: Outcome;
  /** The higher-order action class, for behavioral divergence scoring (§07). */
  disposition: ActionDisposition;
  categoryVerdicts: Partial<Record<AttributionCategory, Verdict>>;
  attribution: AttributionEntry[];
  providerNonconformance: boolean;
  /** Fine-grained key (fired tool + args) — used for representational comparison. */
  observableOutcomeKey: string;
  /** Coarse key over disposition (args collapse for deferred/failed) — used for behavior. */
  behavioralKey: string;
}

export type DivergenceKind = 'none' | 'behavioral' | 'outcome' | 'conformance';

export interface DivergenceResult {
  /** Meaningful *behavioral* divergence (scored over action disposition, §07). */
  kind: DivergenceKind;
  /** Do the fine-grained observable keys differ (e.g. clarification vs no_tool_selected)? */
  representationalDifference: boolean;
  observedOutcomeKey?: string;
  byPath: Record<string, string>;
  withinAllowable: boolean;
}

/** A conformance case: one task, one or more consumer paths. */
export interface ConformanceCase {
  caseId: string;
  task: TaskSpec;
  /** The tool the task expects to be called, if the case grades tool selection. */
  expectedTool?: string;
  paths: PathObservation[];
}
