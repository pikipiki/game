import { describe, expect, it } from 'vitest';
import { newGame, reduce } from '@/game/engine';
import {
  buildCombatChromeModel,
  buildCombatToolbarModel,
  buildFighterPanelModel,
} from '@/game/battle/presentation';
import type { BattleSelection } from '@/game/battle/controls';
import { createTranslator } from '@/i18n/translate';

const empty: BattleSelection = { unit: null, hex: null, spell: null };
const tFr = createTranslator('fr');

function trainingBattle() {
  const game = newGame();
  game.hero = { q: -1, r: -2 };
  return reduce(game, { type: 'fight', site: 'camp1' });
}

describe('Chrome et panneaux de combat', () => {
  it('reflète le siège, l’initiative et les états des troupes', () => {
    const game = trainingBattle();
    game.battle!.siege = { wallHp: 0, maxWallHp: 180 };
    const chrome = buildCombatChromeModel(game, empty, false);
    expect(chrome.siege?.heading).toContain('Remparts détruits');
    expect(chrome.siege?.hint).toContain('entrer dans le château');
    game.battle!.siege.wallHp = 90;
    game.battle!.opponent = { hero: 'enemy-dusk', town: 'home' };
    const defend = buildCombatChromeModel(game, empty, false);
    expect(defend.siege?.hint).toContain('Défendez la garnison');
    game.battle!.active = 'enemy-0';
    const enemyTurn = buildCombatChromeModel(game, empty, false);
    expect(enemyTurn.turnLabel).toContain('Tour adverse');
    game.battle!.result = 'victory';
    const done = buildCombatChromeModel(game, empty, false);
    expect(done.title).toBeTruthy();
    game.battle!.result = null;
    const enemy = game.battle!.units.find((unit) => unit.id === 'enemy-0')!;
    enemy.retaliated = true;
    enemy.waited = true;
    const panel = buildFighterPanelModel(game, { ...empty, unit: 'enemy-0' });
    expect(panel.finePrint).toContain('Riposte utilisée');
    expect(panel.finePrint).toContain('Attente utilisée');
    game.battle!.active = 'enemy-0';
    const toolbar = buildCombatToolbarModel(game, empty, false, tFr);
    expect(toolbar?.roleLabel).toContain('ADVERSAIRE');
    game.battle!.result = 'defeat';
    const defeat = buildCombatToolbarModel(game, empty, false, tFr);
    expect(defeat?.summaryHeading).toContain('DÉFAITE');
  });
});
