// The real WebMCP browser runtime, wrapped as a WebMcpRuntime (the Chrome/WebMCP lane, §14).
//
// detectWebMcpRuntime() adapts whatever the browser exposes (document.modelContext /
// navigator.modelContextTesting / navigator.modelContext) to the SAME interface the common
// bridge already speaks. No bridge/engine/report changes are needed — Chrome is just another
// lane populating provider-conformance-report/1. The lane changes; the measurement language
// does not.

import type { RuntimeTool, WebMcpRuntime } from './reference-runtime.ts';

export const CHROME_WEBMCP_RUNTIME_ID = 'chrome-webmcp';

interface RawContext {
  getTools?: () => unknown;
  listTools?: () => unknown;
  executeTool?: (tool: unknown, argsString: string) => unknown;
  registerTool?: (def: unknown, handler?: unknown) => unknown;
}

/** Find a live WebMCP context, or null when there is no runtime (no-op, §01/§09). */
export function findModelContext(): RawContext | null {
  const g = globalThis as unknown as { document?: { modelContext?: RawContext }; navigator?: { modelContext?: RawContext; modelContextTesting?: RawContext } };
  const ctx = g.document?.modelContext ?? g.navigator?.modelContextTesting ?? g.navigator?.modelContext ?? null;
  if (!ctx || typeof ctx.executeTool !== 'function') return null;
  if (typeof ctx.getTools !== 'function' && typeof ctx.listTools !== 'function') return null;
  return ctx;
}

/**
 * Wrap the real WebMCP context as a WebMcpRuntime. Returns null when no runtime is present.
 * executeTool passes the actual RegisteredTool handle straight through (never a name string).
 */
export function detectWebMcpRuntime(): WebMcpRuntime | null {
  const ctx = findModelContext();
  if (!ctx) return null;
  const list = typeof ctx.getTools === 'function' ? ctx.getTools.bind(ctx) : ctx.listTools!.bind(ctx);
  return {
    async getTools(): Promise<RuntimeTool[]> {
      const tools = await Promise.resolve(list());
      return Array.isArray(tools) ? (tools as RuntimeTool[]) : [];
    },
    async executeTool(tool: RuntimeTool, argsString: string): Promise<string> {
      const raw = await Promise.resolve(ctx.executeTool!(tool, argsString));
      return typeof raw === 'string' ? raw : JSON.stringify(raw);
    },
  };
}

/** Capture the exact browser build for report provenance (lane.browserVersion). */
export function captureBrowserVersion(): string | null {
  const nav = (globalThis as unknown as { navigator?: { userAgent?: string } }).navigator;
  return typeof nav?.userAgent === 'string' ? nav.userAgent : null;
}
