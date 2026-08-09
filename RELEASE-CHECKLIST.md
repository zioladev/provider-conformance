# Release checklist — @zioladev/provider-conformance

The same boring, repeatable path we used for `@zioladev/provider-tools`. No architectural
expansion at release time. `0.1.0` is exactly the thing that was proven:

> A model-agnostic WebMCP provider-conformance system that produces a versioned, fault-attributed
> report across independent consumer paths and runtime lanes, without assigning provider
> nonconformance to failures outside the provider-owned layers.

## Release gate (v0.1): ✅ SATISFIED

Both independent validation dimensions are green and frozen in `evidence/`:
- **Real models** — Claude + GPT + Gemini on the same surface (`evidence/three-way-2026-08-09/`).
- **Real WebMCP runtime** — Chrome 152 acceptance (`evidence/chrome-webmcp-2026-08-09/`).

## Pre-flight (in this repo)

- [x] `npm run typecheck` — clean.
- [x] `npm test` — all green (incl. the clean-room guard).
- [x] `npm run build` — `dist/` emits ESM + `.d.ts`.
- [x] `version` = `0.1.0`; `private` removed; `publishConfig.access = public`, `provenance = true`.
- [x] `README.md` leads with the problem (not the models).
- [x] `npm pack --dry-run` — ships `dist/`, `LICENSE`, `NOTICE`, `README.md` **only**
      (no `src/`, `tests/`, `evidence/`, `acceptance/`, `scripts/`, `docs/`, secrets).

## Extract to the standalone public repo

The package is drafted at `provider-conformance/` inside the `valentincoffee` repo. To move it to
its canonical home (`github.com/zioladev/provider-conformance`), history-preserving:

```bash
# 1. From the valentincoffee working copy, split the subdirectory's history:
git subtree split --prefix=provider-conformance -b provider-conformance-export

# 2. Create the empty public repo github.com/zioladev/provider-conformance (no README/license),
#    then push the split branch as main:
git push git@github.com:zioladev/provider-conformance.git provider-conformance-export:main

# 3. Clone fresh and verify:
git clone git@github.com:zioladev/provider-conformance.git && cd provider-conformance
npm install && npm run typecheck && npm test && npm run build
```

The package is self-contained: `docs/` (the spec), `evidence/` (frozen runs), `acceptance/`
(the Chrome harness), `src/`, `tests/`, CI, and the release furniture all travel with it.

## Publish (first version — token bootstrap)

npm Trusted Publishing can't configure a package that doesn't exist yet, so the **first** publish
uses a token (exactly as we bootstrapped `@zioladev/provider-tools`):

- [ ] On npm: create an **automation** token (classic) or a granular token with publish rights to
      `@zioladev` (bypasses 2FA in CI).
- [ ] On the repo: add it as the secret **`NPM_TOKEN`**.
- [ ] `npm pack --dry-run` via **Actions → Publish → Run workflow → Dry run** — confirm the tarball.
- [ ] Publish for real: draft a **GitHub Release `v0.1.0`**, or **Actions → Publish → uncheck Dry run**.
- [ ] Verify: `npm view @zioladev/provider-conformance version` → `0.1.0`; provenance shows on npm.

## After the first version (switch to Trusted Publishing)

- [ ] On the npm package settings, add a **Trusted Publisher** → `zioladev/provider-conformance` +
      `.github/workflows/publish.yml` (no environment).
- [ ] Delete the `NPM_TOKEN` secret; revoke the bootstrap token. Future releases publish via OIDC.

## Notes

- **Zero runtime dependencies** — keep it that way; a new dependency is a release blocker.
- **Clean-room** — nothing from `@selvage/*` or the Refraktor extension may be required to build,
  test, or run. A test asserts it.
- Published surface is `dist/` only. Source, tests, docs, evidence, and the acceptance harness ship
  on GitHub, not in the npm tarball.
- Post-`0.1.0`: fixes bump to `0.1.1`; new capability bumps the minor. **Do not** add features
  before cutting `0.1.0`.
