import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { atMigration } from './migrations.fixtures.js';

const flagsByMarket = async () => {
  const { results } = await env.PRIOR_DB.prepare(
    'SELECT code, feature_flags AS flags FROM markets ORDER BY code',
  ).all<{ code: string; flags: string | null }>();
  return Object.fromEntries(
    results.map(({ code, flags }) => [
      code,
      JSON.parse(flags ?? '{}') as Record<string, unknown>,
    ]),
  );
};

describe('0076 — hackathons in Algeria (B-LCH-06, real D1)', () => {
  it('turns hackathons on in Algeria alone, and keeps its other flags', async () => {
    const { apply } = await atMigration('0076_enable_hackathons_dz.sql');
    const before = await flagsByMarket();

    await apply();

    const after = await flagsByMarket();
    expect(after.DZ).toEqual({ ...before.DZ, hackathons: true });
    for (const code of Object.keys(after).filter((name) => name !== 'DZ'))
      expect(after[code]).toEqual(before[code]);
  });
});
