import { describe, expect, it } from 'vitest';
import { ownedCastleAt } from '@/app/lib/town-site';
import { normalizePickedHex } from '@/render/adventure';
import { SITES, key } from '@/game/data';
import { newGame } from '@/game/engine';

describe('ownedCastleAt', () => {
  it('reconnaît la citadelle de départ', () => {
    const state = newGame();
    const home = SITES[0]!;
    expect(ownedCastleAt(home, state)?.id).toBe('home');
  });

  it('reconnaît la citadelle avec les coordonnées 3D legacy hexQ/hexR', () => {
    const state = newGame();
    const home = SITES[0]!;
    const legacy = normalizePickedHex({ hexQ: home.q, hexR: home.r });
    expect(legacy).toEqual({ q: home.q, r: home.r });
    expect(key(legacy!)).toBe(key(home));
    expect(ownedCastleAt(legacy!, state)?.id).toBe('home');
  });

  it('ignore un château ennemi', () => {
    const state = newGame();
    const enemyCastle = SITES.find(
      (site) => site.kind === 'castle' && site.difficulty,
    )!;
    expect(ownedCastleAt(enemyCastle, state)).toBeUndefined();
  });
});
