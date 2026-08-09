// Chrome/WebMCP acceptance harness (browser side). Runs in a WebMCP-enabled Chrome (Canary +
// flag). Registers the sample provider on the REAL document.modelContext, drives the
// runtime-agnostic pipeline (window.ProviderConformance) against it, and produces the SAME
// report contract with browser-runtime provenance. Also runs one intentionally browser-owned
// failure to prove Browser Runtime: FAIL / Provider: PASS.
//
// This file is bundled into chrome-webmcp-acceptance.html by scripts/build-acceptance.ts.

(function () {
  'use strict';
  const PC = window.ProviderConformance;
  const $ = (id) => document.getElementById(id);
  const log = (m) => { $('log').textContent += m + '\n'; };
  const setStatus = (m, cls) => { const el = $('status'); el.textContent = m; el.className = 'status ' + (cls || ''); };

  // The provider surface (matches evidence/three-way-2026-08-09/fixtures.json).
  let orderCounter = 3000;
  const providerDefs = [
    { name: 'place_order', description: 'Place a drink order.', effect: 'state-changing',
      inputSchema: { type: 'object', properties: { item: { type: 'string' }, size: { type: 'string', enum: ['S', 'M', 'L'] } }, required: ['item', 'size'], additionalProperties: false } },
    { name: 'find_item', description: 'Look up a menu item.', effect: 'read',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false } },
  ];
  const handlers = {
    place_order: (a) => ({ executed: true, confirmationId: 'ORDER-' + (orderCounter++), data: { item: a.item, size: a.size } }),
    find_item: (a) => ({ executed: true, data: { found: true, query: a.query } }),
  };

  const orderTask = { taskId: 'order-latte-M/1', text: 'Order a medium latte.', allowableOutcomes: ['executed:place_order'] };
  const coffeeTask = { taskId: 'order-coffee-underspecified/1', text: 'Order a coffee.', allowableOutcomes: ['clarification', 'no_tool_selected'] };
  const scripted = (decide) => PC.makeScriptedAdapter({ id: 'scripted', modelId: 'scripted/deterministic', decide });

  // Wrap the real context as a WebMcpRuntime, unwrapping a WebMCP ToolResult { content:[{text}] }
  // back to our ExecutionResult if the runtime wraps handler returns. (If your Canary build
  // returns the handler value verbatim, the unwrap is a no-op.)
  function makeChromeRuntime(ctx) {
    const list = typeof ctx.getTools === 'function' ? ctx.getTools.bind(ctx) : ctx.listTools.bind(ctx);
    return {
      async getTools() { const t = await Promise.resolve(list()); return Array.isArray(t) ? t : []; },
      async executeTool(tool, argsString) {
        const raw = await Promise.resolve(ctx.executeTool(tool, argsString));
        let s = typeof raw === 'string' ? raw : JSON.stringify(raw);
        try {
          const parsed = JSON.parse(s);
          if (parsed && Array.isArray(parsed.content)) {
            const part = parsed.content.find((p) => typeof p.text === 'string');
            if (part) return part.text;
          }
        } catch (_) { /* not JSON / not wrapped */ }
        return s;
      },
    };
  }

  async function registerProvider(ctx) {
    for (const def of providerDefs) {
      const h = handlers[def.name];
      await Promise.resolve(ctx.registerTool({
        name: def.name,
        description: def.description,
        inputSchema: def.inputSchema,
        async execute(input) {
          const args = input && input.arguments ? input.arguments : (input || {});
          return await h(args); // ExecutionResult; executeTool serializes it as the tool result
        },
      }));
    }
  }

  async function run() {
    $('log').textContent = '';
    setStatus('running…', 'pending');
    const browserVersion = PC.captureBrowserVersion();
    log('Browser: ' + browserVersion);

    const ctx = PC.findModelContext();
    if (!ctx) { setStatus('No WebMCP runtime. Open in a WebMCP-enabled Chrome (Canary + the WebMCP flag).', 'fail'); log('findModelContext() -> null'); return; }
    log('WebMCP runtime detected.');
    if (typeof ctx.registerTool !== 'function') { setStatus('runtime has no registerTool()', 'fail'); return; }

    try { await registerProvider(ctx); log('Registered: ' + providerDefs.map((d) => d.name).join(', ')); }
    catch (e) { setStatus('registration failed: ' + e.message, 'fail'); log('registerTool threw: ' + e.message + '\n(Adjust registerProvider() to your build’s registerTool shape and re-run.)'); return; }

    const runtime = makeChromeRuntime(ctx);
    const cases = [];
    try {
      // A: specified latte -> state-changing execution (acted).
      cases.push(await PC.buildCaseOnRuntime('chrome-specified', runtime, providerDefs, orderTask,
        [scripted({ type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } })], 'place_order'));
      // B: read execution against the real runtime (inspected).
      cases.push(await PC.buildCaseOnRuntime('chrome-read', runtime, providerDefs, coffeeTask,
        [scripted({ type: 'tool_call', toolName: 'find_item', arguments: { query: 'coffee' } })]));
      // C: intentionally browser-owned failure (broken runtime) -> Browser Runtime FAIL / Provider PASS.
      const broken = { getTools() { throw new Error('injected: runtime surface unsupported'); }, async executeTool() { return '{}'; } };
      cases.push(await PC.buildCaseOnRuntime('chrome-browser-owned-failure', broken, providerDefs, orderTask,
        [scripted({ type: 'tool_call', toolName: 'place_order', arguments: { item: 'latte', size: 'M' } })], 'place_order'));
    } catch (e) { setStatus('run error: ' + e.message, 'fail'); log('threw: ' + (e.stack || e.message)); return; }

    const report = PC.assembleReport({
      providerName: '@example/sample-cafe', declaredTools: providerDefs,
      runtimeId: PC.CHROME_WEBMCP_RUNTIME_ID, browserVersion, cases,
    });
    window.__report = report;
    log('\n' + PC.renderHuman(report));
    $('json').value = JSON.stringify(report, null, 2);

    const providerPass = report.summary.provider === 'PASS';
    const bof = report.cases.find((c) => c.caseId === 'chrome-browser-owned-failure');
    const bp = bof && bof.paths[0];
    const isolated = !!(bp && bp.derived.attribution.some((a) => a.category === 'browser_runtime') && bp.derived.providerNonconformance === false);
    if (providerPass && isolated) setStatus('PASS — real WebMCP lane green; browser-owned failure isolated (Browser Runtime FAIL / Provider PASS).', 'pass');
    else setStatus('Review report — providerPass=' + providerPass + ', isolated=' + isolated, 'fail');
  }

  function copyJson() { $('json').select(); document.execCommand && document.execCommand('copy'); }
  function downloadJson() {
    const blob = new Blob([$('json').value || '{}'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'chrome-webmcp-report.json'; a.click();
  }

  window.addEventListener('DOMContentLoaded', () => {
    $('run').addEventListener('click', run);
    $('copy').addEventListener('click', copyJson);
    $('download').addEventListener('click', downloadJson);
    setStatus('ready — open in a WebMCP-enabled Chrome, then click Run.', '');
  });
})();
