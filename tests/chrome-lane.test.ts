// The Chrome/WebMCP lane, proven at the seam DETERMINISTICALLY (§14). We drive the runtime-
// agnostic pipeline against a FAKE WebMcpRuntime that mimics `document.modelContext` (getTools
// returning RegisteredTool-like handles; executeTool requiring a handle, returning a JSON
// string). The point: the SAME bridge/engine/report work against any runtime, and a
// browser-owned failure attributes to browser_runtime while the provider stays PASS.
//
// The real-browser run happens in Canary via the acceptance harness; this pins the contract.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeScriptedAdapter,
  runPathOnRuntime,
  evaluatePath,
  assembleReport,
  buildCaseOnRuntime,
  CHROME_WEBMCP_RUNTIME_ID,
} from '../src/index.ts';
import type { WebMcpRuntime, RuntimeTool, ExecutionResult, ToolDef } from '../src/index.ts';
import { sampleProvider, orderTask, coffeeAmbiguousTask } from './sample-provider.ts';

const defs = sampleProvider.tools.map((t) => t.def);

/** A fake WebMCP runtime shaped like a real `document.modelContext` (handles + JSON strings). */
function fakeWebMcpRuntime(provider = sampleProvider): WebMcpRuntime {
  const handles: RuntimeTool[] = provider.tools.map((t) => ({ name: t.def.name, description: t.def.description, inputSchema: JSON.stringify(t.def.inputSchema) }));
  return {
    getTools: () => handles,
    async executeTool(tool: RuntimeTool, argsString: string): Promise<string> {
      const entry = provider.tools.find((t) => t.def.name === tool.name);
      if (!entry) throw new Error(`unknown tool: ${tool.name}`);
      const result = (await entry.handler(argsString ? JSON.parse(argsString) : {})) as ExecutionResult;
      return JSON.stringify(result);
    },
  };
}

test('state-changing execution works against a WebMCP-shaped runtime; provider PASS', async () => {
  const runtime = fakeWebMcpRuntime();
  const adapter = makeScriptedAdapter({ id: 'scripted', modelId: 'm', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } } });
  const obs = await runPathOnRuntime(runtime, defs, orderTask, adapter);
  const d = evaluatePath(obs, orderTask, 'place_order');
  assert.equal(d.outcome, 'executed');
  assert.equal(d.disposition, 'acted');
  assert.equal(d.providerNonconformance, false);
});

test('read execution works against a WebMCP-shaped runtime; disposition inspected', async () => {
  const runtime = fakeWebMcpRuntime();
  const findTask = { taskId: 'find/1', text: 'look up coffee', allowableOutcomes: ['executed:find_item'] };
  const adapter = makeScriptedAdapter({ id: 'scripted', modelId: 'm', decide: { type: 'tool_call', toolName: 'find_item', arguments: { query: 'coffee' } } });
  const obs = await runPathOnRuntime(runtime, defs, findTask, adapter);
  const d = evaluatePath(obs, findTask, 'find_item');
  assert.equal(d.outcome, 'executed');
  assert.equal(d.disposition, 'inspected', 'a read execution is inspected even on the browser lane');
  assert.equal(d.providerNonconformance, false);
});

test('the SAME report contract populates from the Chrome lane, with browser provenance', async () => {
  const runtime = fakeWebMcpRuntime();
  const adapter = makeScriptedAdapter({ id: 'scripted', modelId: 'm', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } } });
  const c = await buildCaseOnRuntime('chrome-specified', runtime, defs, orderTask, [adapter], 'place_order');
  const report = assembleReport({
    providerName: sampleProvider.name,
    declaredTools: defs,
    runtimeId: CHROME_WEBMCP_RUNTIME_ID,
    browserVersion: 'Chrome/146.0.0.0 (fake)',
    cases: [c],
    generatedAt: '2026-08-09T00:00:00.000Z',
  });
  assert.equal(report.reportVersion, 'provider-conformance-report/1', 'the report contract does not change with the lane');
  assert.equal(report.lane.runtimeId, 'chrome-webmcp');
  assert.equal(report.lane.browserVersion, 'Chrome/146.0.0.0 (fake)');
  assert.equal(report.summary.provider, 'PASS');
});

test('BROWSER-OWNED FAILURE: a broken runtime -> Browser Runtime FAIL, Provider PASS', async () => {
  // The fault-isolation proof (§14): an unsupported/broken runtime surface (getTools throws).
  const brokenRuntime: WebMcpRuntime = {
    getTools() { throw new Error('runtime surface unsupported: getTools() unavailable'); },
    async executeTool() { return '{}'; },
  };
  const adapter = makeScriptedAdapter({ id: 'scripted', modelId: 'm', decide: { type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } } });
  const obs = await runPathOnRuntime(brokenRuntime, defs, orderTask, adapter);
  const d = evaluatePath(obs, orderTask, 'place_order');

  assert.equal(d.outcome, 'runtime_error');
  assert.equal(d.attribution[0]?.category, 'browser_runtime');
  assert.equal(d.categoryVerdicts.browser_runtime, 'FAIL');
  assert.equal(d.providerNonconformance, false, 'a browser-runtime failure is NEVER provider nonconformance');
  assert.equal(d.categoryVerdicts.provider_definition, 'PASS');
});

test('a missing-tool runtime -> provider_runtime (claimed tool not discovered)', async () => {
  // The runtime is healthy but does not surface a tool the provider claims to register.
  const emptyRuntime: WebMcpRuntime = { getTools: () => [], async executeTool() { return '{}'; } };
  const adapter = makeScriptedAdapter({ id: 'scripted', modelId: 'm', decide: { type: 'clarification' } });
  const obs = await runPathOnRuntime(emptyRuntime, defs as ToolDef[], orderTask, adapter);
  const d = evaluatePath(obs, orderTask, 'place_order');
  assert.equal(d.attribution[0]?.category, 'provider_runtime');
  assert.equal(d.providerNonconformance, true, 'a claimed-but-undiscovered tool IS provider nonconformance');
});
