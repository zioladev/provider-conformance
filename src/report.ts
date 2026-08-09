// Report assembly: the versioned, machine-readable contract (§06). Observed facts and
// derived judgments are kept in separate branches so a re-score never re-runs. Provenance
// (including the report generator's own identity) makes "same" a fact, not an aspiration.

import type {
  AttributionCategory,
  ConformanceCase,
  PathDerived,
  Verdict,
} from './types.ts';
import { evaluateCase } from './engine.ts';
import { REPORT_GENERATOR, REPORT_GENERATOR_VERSION, REPORT_VERSION } from './report-version.ts';
import type { ToolDef } from './types.ts';

/** A small, dependency-free stable hash (FNV-1a, hex) over canonical JSON. */
function stableHash(value: unknown): string {
  const json = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `fnv1a:${(h >>> 0).toString(16).padStart(8, '0')}`;
}

export interface ReportInput {
  providerName: string;
  declaredTools: ToolDef[];
  runtimeId: string;
  browserVersion: string | null;
  cases: ConformanceCase[];
  /** Fixed timestamp for deterministic artifacts; defaults to now. */
  generatedAt?: string;
}

export interface ProviderConformanceReport {
  reportVersion: string;
  reportGenerator: string;
  reportGeneratorVersion: string;
  generatedAt: string;
  provider: {
    name: string;
    providerDefHash: string;
    declaredTools: Array<{ name: string; effect: string }>;
  };
  lane: { runtimeId: string; browserVersion: string | null; toolSurfaceHash: string };
  cases: Array<{
    caseId: string;
    taskId: string;
    paths: Array<{
      adapterId: string;
      adapterVersion: string;
      modelId: string;
      observed: unknown;
      derived: {
        outcome: string;
        disposition: string;
        signalVerdicts: Partial<Record<AttributionCategory, Verdict>>;
        attribution: PathDerived['attribution'];
        providerNonconformance: boolean;
        observableOutcomeKey: string;
      };
    }>;
    divergence: { kind: string; representationalDifference: boolean; withinAllowable: boolean; byPath: Record<string, string> };
    provider: Verdict;
  }>;
  summary: {
    provider: Verdict;
    byLayer: Record<string, Verdict>;
    notes: Array<{ layer: string; verdict: Verdict; signal: string; detail: string }>;
  };
}

export function assembleReport(input: ReportInput): ProviderConformanceReport {
  const providerDefHash = stableHash(input.declaredTools);
  const toolSurfaceHash = stableHash(input.declaredTools.map((t) => ({ name: t.name, inputSchema: t.inputSchema, effect: t.effect })));

  const notes: ProviderConformanceReport['summary']['notes'] = [];
  const byLayer: Record<string, Verdict> = {};
  let providerGrade: Verdict = 'PASS';

  const cases = input.cases.map((c: ConformanceCase) => {
    const { deriveds, divergence, provider } = evaluateCase(c);
    if (provider === 'FAIL') providerGrade = 'FAIL';
    else if (provider === 'WARN' && providerGrade === 'PASS') providerGrade = 'WARN';

    const paths = c.paths.map((p, i) => {
      const d = deriveds[i] as PathDerived;
      // Fold per-adapter + per-category verdicts into the summary.
      for (const [cat, v] of Object.entries(d.categoryVerdicts)) {
        if (!v) continue;
        const key = cat;
        const rank: Record<Verdict, number> = { PASS: 0, NOT_REACHED: 0, WARN: 1, FAIL: 2 };
        if (byLayer[key] === undefined || rank[v] > rank[byLayer[key]]) byLayer[key] = v;
      }
      byLayer[p.adapterId] = worst(byLayer[p.adapterId], adapterVerdict(d));
      for (const a of d.attribution) {
        notes.push({ layer: a.category, verdict: a.verdict, signal: a.signal, detail: a.detail });
      }
      return {
        adapterId: p.adapterId,
        adapterVersion: p.adapterVersion,
        modelId: p.modelId,
        observed: p.steps,
        derived: {
          outcome: d.outcome,
          disposition: d.disposition,
          signalVerdicts: d.categoryVerdicts,
          attribution: d.attribution,
          providerNonconformance: d.providerNonconformance,
          observableOutcomeKey: d.observableOutcomeKey,
        },
      };
    });

    return {
      caseId: c.caseId,
      taskId: c.task.taskId,
      paths,
      divergence: { kind: divergence.kind, representationalDifference: divergence.representationalDifference, withinAllowable: divergence.withinAllowable, byPath: divergence.byPath },
      provider,
    };
  });

  byLayer['provider'] = providerGrade;

  return {
    reportVersion: REPORT_VERSION,
    reportGenerator: REPORT_GENERATOR,
    reportGeneratorVersion: REPORT_GENERATOR_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    provider: {
      name: input.providerName,
      providerDefHash,
      declaredTools: input.declaredTools.map((t) => ({ name: t.name, effect: t.effect })),
    },
    lane: { runtimeId: input.runtimeId, browserVersion: input.browserVersion, toolSurfaceHash },
    cases,
    summary: { provider: providerGrade, byLayer, notes },
  };
}

function adapterVerdict(d: PathDerived): Verdict {
  // An adapter's own verdict reflects consumer-side categories (never the provider's).
  const consumerCats: AttributionCategory[] = ['consumer_adapter', 'model_tool_selection', 'model_arguments'];
  let v: Verdict = 'PASS';
  for (const c of consumerCats) {
    if (d.categoryVerdicts[c] === 'FAIL') return 'FAIL';
    if (d.categoryVerdicts[c] === 'WARN') v = 'WARN';
  }
  return v;
}

function worst(a: Verdict | undefined, b: Verdict): Verdict {
  const rank: Record<Verdict, number> = { PASS: 0, NOT_REACHED: 0, WARN: 1, FAIL: 2 };
  if (a === undefined) return b;
  return rank[b] > rank[a] ? b : a;
}
