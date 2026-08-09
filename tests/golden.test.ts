// The golden gate: every fixture's authored attribution truth must hold exactly.
// A diff in any expected owner/outcome/divergence fails the build.

import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePath, evaluateCase } from '../src/index.ts';
import { GOLDEN } from './golden-fixtures.ts';

for (const g of GOLDEN) {
  test(`golden ${g.caseId}: ${g.title}`, () => {
    const c = g.build();

    if (g.expected.divergenceKind !== undefined) {
      const { divergence, deriveds } = evaluateCase(c);
      assert.equal(divergence.kind, g.expected.divergenceKind, 'divergence kind');
      for (const d of deriveds) {
        assert.equal(d.providerNonconformance, g.expected.providerNonconformance, 'no provider nonconformance');
        assert.equal(d.attribution.length, 0, 'behavioral divergence must produce no failure attribution');
      }
      return;
    }

    const p0 = c.paths[0];
    assert.ok(p0, 'fixture has a path');
    const d = evaluatePath(p0, c.task, c.expectedTool);

    if (g.expected.outcome !== undefined) {
      assert.equal(d.outcome, g.expected.outcome, 'outcome');
    }
    const owner = d.attribution.length > 0 ? d.attribution[0].category : 'none';
    assert.equal(owner, g.expected.owner, 'attribution owner');
    assert.equal(d.providerNonconformance, g.expected.providerNonconformance, 'provider nonconformance');
  });
}

test('the provider grade is computed only from provider-owned categories', () => {
  // G3 (model_arguments FAIL) must NOT make the provider nonconformant.
  const g3 = GOLDEN.find((g) => g.caseId === 'G3-model-malformed-args');
  assert.ok(g3);
  const { provider } = evaluateCase(g3.build());
  assert.equal(provider, 'PASS', 'a consumer-side failure is never provider nonconformance');
});
