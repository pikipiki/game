import { describe, expect, it } from 'vitest';
import { opponentStrikeToast } from '@/app/lib/opponent-alert';
import { newGame, reduce } from '@/game/engine';
import { createTranslator } from '@/i18n/translate';

describe('opponentStrikeToast', () => {
  const t = createTranslator('fr');

  it('signale une attaque directe après la fin du jour', () => {
    const before = newGame();
    before.hero = { q: 3, r: -3 };
    const after = reduce(before, { type: 'end-day' });
    expect(opponentStrikeToast(before, after, t)).toBe(
      'Un ennemi vous attaque !',
    );
  });

  it('signale un siège sur château allié', () => {
    const before = newGame();
    const lead = before.enemyHeroes![0]!;
    before.enemyHeroes = [{ ...lead, q: -2, r: 2 }];
    before.hero = { q: 3, r: -3 };
    const after = reduce(before, { type: 'end-day' });
    expect(after.battle?.opponent?.town).toBe('home');
    expect(opponentStrikeToast(before, after, t)).toBe(
      'Un ennemi assiège votre château !',
    );
  });

  it('reste silencieux sans nouveau combat adverse', () => {
    const state = newGame();
    expect(opponentStrikeToast(state, state, t)).toBeNull();
  });
});
