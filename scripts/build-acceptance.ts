// Builds the self-contained Chrome/WebMCP acceptance page: bundles the library into an IIFE
// (window.ProviderConformance) and inlines it + acceptance/harness.js into one HTML file the
// user opens in a WebMCP-enabled Chrome (Canary). No build step or server needed to run it.
//
//   node --experimental-strip-types scripts/build-acceptance.ts

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = join(root, 'dist-acceptance');
mkdirSync(tmpDir, { recursive: true });
const bundlePath = join(tmpDir, 'bundle.js');

// Bundle src/index.ts -> IIFE global `ProviderConformance` (browser target). esbuild strips
// types and resolves the `.ts` import specifiers.
execFileSync('npx', ['--no-install', 'esbuild', join(root, 'src', 'index.ts'),
  '--bundle', '--format=iife', '--global-name=ProviderConformance',
  '--platform=browser', '--target=chrome110', '--legal-comments=none', `--outfile=${bundlePath}`],
  { stdio: 'inherit' });

const bundle = readFileSync(bundlePath, 'utf8');
const harness = readFileSync(join(root, 'acceptance', 'harness.js'), 'utf8');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Provider-conformance — Chrome/WebMCP acceptance</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; margin: 24px; max-width: 900px; }
  h1 { font-size: 18px; }
  .status { padding: 8px 12px; border-radius: 6px; margin: 12px 0; background: #eee; }
  .status.pass { background: #d7f5dd; color: #05630f; }
  .status.fail { background: #fde2e1; color: #8a1008; }
  .status.pending { background: #fff4ce; color: #7a5b00; }
  button { font: inherit; padding: 6px 14px; margin-right: 8px; cursor: pointer; }
  pre { background: rgba(127,127,127,.12); padding: 12px; border-radius: 6px; overflow: auto; white-space: pre-wrap; }
  textarea { width: 100%; height: 240px; font: 12px/1.4 ui-monospace, monospace; }
  small { opacity: .75; }
</style>
</head>
<body>
<h1>Provider-conformance — Chrome/WebMCP acceptance lane</h1>
<p><small>Open in a WebMCP-enabled Chrome (Canary + the WebMCP flag). Runs the same provider
surface + pipeline through the real <code>document.modelContext</code>, producing
<code>provider-conformance-report/1</code> with browser-runtime provenance — plus one
intentionally browser-owned failure. Lane: <code>chrome-webmcp</code>.</small></p>
<button id="run">Run acceptance</button>
<button id="copy">Copy report JSON</button>
<button id="download">Download report JSON</button>
<div id="status" class="status">loading…</div>
<pre id="log"></pre>
<textarea id="json" spellcheck="false" placeholder="report JSON appears here after a run"></textarea>
<script>${bundle}</script>
<script>${harness}</script>
</body>
</html>
`;

const out = join(root, 'acceptance', 'chrome-webmcp-acceptance.html');
writeFileSync(out, html);
console.log(`Wrote ${out} (${(html.length / 1024).toFixed(0)} kB, self-contained)`);
