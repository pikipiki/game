import { describe, expect, it } from 'vitest';
import { opponentStrikeToast } from '@/app/lib/opponent-alert';
import { loadGame } from '@/game/engine-load';
import { reduce } from '@/game/engine';
import { createTranslator } from '@/i18n/translate';
import { opponentStrikeEndDayFixture } from '../../../tests/e2e/helpers/opponent-strike-seed';

describe('opponentStrikeEndDayFixture', () => {
  it('déclenche une attaque adverse après fin de journée', () => {
    const { game, leaderHexBefore, leaderHexAfter } =
      opponentStrikeEndDayFixture();
    expect(leaderHexBefore).not.toBe(leaderHexAfter);
    const loaded = loadGame(JSON.stringify(game));
    expect(loaded).not.toBeNull();
    const afterDirect = reduce(structuredClone(game), { type: 'end-day' });
    const after = reduce(structuredClone(loaded!), { type: 'end-day' });
    const t = createTranslator('fr');
    expect(opponentStrikeToast(game, afterDirect, t)).toMatch(/assiège/i);
    expect(opponentStrikeToast(loaded!, after, t)).toMatch(/assiège/i);
    expect(after.battle?.opponent?.hero).toBeTruthy();
    expect(leaderHexBefore).not.toBe(leaderHexAfter);
  });
});
