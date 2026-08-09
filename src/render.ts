// The human rendering — a pure projection of the report JSON. It invents nothing.
// Intentionally boring: a readable text block, not a dashboard (§06).

import type { ProviderConformanceReport } from './report.ts';
import type { Verdict } from './types.ts';

const LABELS: Record<string, string> = {
  provider: 'Provider',
  provider_definition: 'Provider Definition',
  provider_runtime: 'Provider Runtime',
  browser_runtime: 'Browser Runtime',
  consumer_adapter: 'Consumer Adapter',
  model_tool_selection: 'Model Tool Selection',
  model_arguments: 'Model Arguments',
  execution_bridge: 'Execution Bridge',
  provider_execution: 'Provider Execution',
  evidence_contract: 'Evidence Contract',
};

// Pipeline order (§02), used to render category rows top-to-bottom.
const ROW_ORDER = [
  'provider_definition',
  'browser_runtime',
  'provider_runtime',
  'consumer_adapter',
  'model_tool_selection',
  'model_arguments',
  'execution_bridge',
  'provider_execution',
  'evidence_contract',
] as const;

function showVerdict(v: Verdict): string {
  return v === 'NOT_REACHED' ? 'NOT REACHED' : v;
}

export function renderHuman(report: ProviderConformanceReport): string {
  const lines: string[] = [];
  lines.push(`# Provider conformance report`);
  lines.push(`Provider: ${report.provider.name}`);
  lines.push(`Report: ${report.reportVersion} (generator ${report.reportGenerator}@${report.reportGeneratorVersion})`);
  lines.push(`Lane: ${report.lane.runtimeId}${report.lane.browserVersion ? ` · browser ${report.lane.browserVersion}` : ''}`);
  lines.push(`Provider grade: ${showVerdict(report.summary.provider)}`);
  lines.push('');

  for (const c of report.cases) {
    lines.push(`## Case: ${c.caseId}  (task ${c.taskId})`);
    lines.push(`Behavioral divergence: ${c.divergence.kind}${c.divergence.kind !== 'none' ? ` (within allowable: ${c.divergence.withinAllowable})` : ''}`);
    lines.push(`Representational difference: ${c.divergence.representationalDifference ? 'yes' : 'no'}`);
    lines.push(`Strategies: ${c.paths.map((p) => `${p.adapterId}=${p.derived.disposition}`).join(', ')}`);
    lines.push('');

    for (const p of c.paths) {
      lines.push(`--- ${p.adapterId} (${p.modelId}) ---`);
      lines.push(`Provider: ${showVerdict(c.provider)}`);
      lines.push(`Disposition: ${p.derived.disposition}`);
      const cv = p.derived.signalVerdicts;
      for (const cat of ROW_ORDER) {
        const v = cv[cat];
        if (v === undefined) continue;
        lines.push(`${LABELS[cat]}: ${showVerdict(v)}`);
      }
      lines.push('');
      lines.push(`Outcome: ${p.derived.outcome}`);
      if (p.derived.attribution.length > 0) {
        lines.push('Finding:');
        for (const a of p.derived.attribution) {
          lines.push(`  ${a.detail}`);
        }
      } else {
        lines.push('Finding: none');
      }
      lines.push(`Provider nonconformance: ${p.derived.providerNonconformance}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
