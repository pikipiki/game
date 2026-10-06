import { describe, expect, it } from 'vitest';
import { getCreature } from '@/game/data';
import { activeUnit, newGame, reduce } from '@/game/engine';
import {
  activeUnitRoleLabel,
  allyBannerSubtitle,
  allyBannerTitle,
  battleResultHeading,
  battleResultSummary,
  combatEyebrow,
  combatInstructionHint,
  combatTitle,
  enemyFactionLabel,
  fighterEyebrow,
  finishBattleLabel,
  healthBarPercent,
  htmlDisabledWhenInactive,
  initiativeAriaPrefix,
  initiativeButtonClass,
  initiativeTitleSuffix,
  initiativeTurnLabel,
  rangedStatLabel,
  retaliationFinePrint,
  rosterUnitCssClass,
  siegeHint,
  spellButtonClass,
  spellPressed,
  spellTargetLabel,
  unitSideLabel,
  waitFinePrint,
  wallStatusHeading,
} from '@/game/battle/labels';

function battleState() {
  const state = newGame();
  state.hero = { q: -1, r: -2 };
  return reduce(state, { type: 'fight', site: 'camp1' });
}

describe('battle labels', () => {
  it('couvre les helpers de présentation', () => {
    const state = battleState();
    const battle = state.battle!;
    const unit = activeUnit(state)!;

    expect(htmlDisabledWhenInactive(false)).toBe('disabled');
    expect(healthBarPercent(5, 10)).toBe(50);
    expect(rosterUnitCssClass(unit.id, unit.id, battle.active)).toContain(
      'chosen',
    );
    expect(unitSideLabel('ally')).toBeTruthy();
    expect(combatEyebrow(state, true)).toContain('ENTRAÎNEMENT');
    expect(combatTitle(state, false)).toBeTruthy();
    expect(allyBannerTitle(true)).toBeTruthy();
    expect(allyBannerSubtitle(state, true)).toBeTruthy();
    expect(initiativeTurnLabel(state)).toBeTruthy();
    expect(initiativeButtonClass(0)).toContain('current');
    expect(initiativeTitleSuffix(1)).toBeTruthy();
    expect(initiativeAriaPrefix(2)).toBeTruthy();
    expect(wallStatusHeading(10, 20)).toContain('Remparts');
    expect(siegeHint(true, 5)).toBeTruthy();
    expect(battleResultHeading('victory')).toBeTruthy();
    expect(battleResultSummary('defeat')).toBeTruthy();
    expect(finishBattleLabel(true)).toBeTruthy();
    expect(spellTargetLabel('bolt')).toBeTruthy();
    const creature = getCreature(unit.creature);
    expect(rangedStatLabel(creature, unit)).toBeTruthy();
    expect(retaliationFinePrint(unit)).toBeTruthy();
    expect(waitFinePrint(unit)).toBe('');
    expect(spellButtonClass('bolt', 'bolt')).toContain('armed');
    expect(spellPressed('heal', 'bolt')).toBe('false');
    expect(enemyFactionLabel()).toBeTruthy();
    expect(activeUnitRoleLabel('enemy')).toBeTruthy();
    expect(fighterEyebrow('ally', unit)).toContain('·');
    expect(
      combatInstructionHint(
        { spell: null, hex: null, unit: null },
        {
          move: false,
          attack: false,
          hits: 0,
          loss: 0,
          target: null,
        },
      ),
    ).toBeTruthy();
  });
});
