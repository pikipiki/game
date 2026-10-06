import { CREATURES, key, type Hex } from './data';
import {
  activeUnit,
  attackPosition,
  damage,
  reachable,
  unitCount,
  type Fighter,
  type GameState,
} from './engine';
export interface BattleSelection {
  unit: string | null;
  hex: Hex | null;
  spell: 'bolt' | 'heal' | null;
}
export const cellName = (h: Hex) => `${String.fromCharCode(65 + h.q)}${h.r + 1}`;
export function turnOrder(s: GameState): Fighter[] {
  const b = s.battle;
  if (!b || b.result) return [];
  return [b.active, ...b.queue, ...(b.waiting ?? [])]
    .map((id) => b.units.find((u) => u.id === id))
    .filter((u): u is Fighter => !!u && u.hp > 0);
}
export function battleControls(s: GameState, selection: BattleSelection) {
  const b = s.battle,
    a = activeUnit(s);
  const target = b?.units.find((u) => u.id === selection.unit && u.hp > 0);
  const canPlay = !!b && !b.result && a?.side === 'ally';
  const move =
    !!canPlay && !!selection.hex && reachable(s).some((t) => key(t) === key(selection.hex!));
  const approach = canPlay && target ? attackPosition(s, target) : null;
  const attack = !!approach;
  const cast =
    !!canPlay &&
    !!target &&
    !!selection.spell &&
    s.mana >= 4 &&
    !b?.opponent?.armyBackup &&
    b?.spellRound !== b?.round &&
    target.side === (selection.spell === 'bolt' ? 'enemy' : 'ally');
  const hits = attack && a && target ? damage({ ...a, ...approach! }, target) : 0;
  const loss = target
    ? unitCount(target) - Math.ceil(Math.max(0, target.hp - hits) / CREATURES[target.creature].hp)
    : 0;
  return { target, canPlay, move, attack, cast, hits, loss, approach };
}
