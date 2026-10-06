import { CREATURES, key, battlePathTo, battleDistance, type Hex } from './data';
import { activeUnit, battleGround, type Action, type GameState } from './engine';
export interface AnimationPlan {
  kind: 'move' | 'attack' | 'bolt' | 'heal' | 'defend' | 'catapult';
  actor: string;
  target: string | null;
  ranged: boolean;
  path: Hex[];
  changes: { id: string; amount: number; defeated: boolean }[];
  duration: number;
}
// A frame timestamp can precede the action's performance.now() on the first frame.
// Clamp both ends so route indexing never receives a negative progress value.
export function animationProgress(start: number, now: number, duration: number): number {
  return duration <= 0 ? 1 : Math.max(0, Math.min(1, (now - start) / duration));
}
export function animationPlan(
  before: GameState,
  after: GameState,
  action: Action,
): AnimationPlan | null {
  const a = activeUnit(before),
    b = before.battle,
    next = after.battle;
  if (
    !a ||
    !b ||
    !next ||
    before === after ||
    !['attack', 'battle-move', 'spell', 'defend', 'enemy', 'catapult'].includes(action.type)
  )
    return null;
  const updated = next.units.find((u) => u.id === a.id)!;
  const moved = key(a) !== key(updated);
  const changes = next.units.flatMap((u) => {
    const old = b.units.find((x) => x.id === u.id)!;
    return u.hp !== old.hp ? [{ id: u.id, amount: u.hp - old.hp, defeated: u.hp === 0 }] : [];
  });
  const kind: AnimationPlan['kind'] =
    action.type === 'catapult' ||
    (before.battle?.siege?.wallHp ?? 0) > (after.battle?.siege?.wallHp ?? 0)
      ? 'catapult'
      : action.type === 'spell'
        ? action.spell
        : changes.some((c) => c.amount < 0)
          ? 'attack'
          : moved
            ? 'move'
            : 'defend';
  const target =
    action.type === 'attack' || action.type === 'spell'
      ? action.target
      : (changes.find((c) => c.amount < 0)?.id ?? null);
  const blocked = new Set(b.units.filter((u) => u.id !== a.id && u.hp > 0).map(key));
  return {
    kind,
    actor: a.id,
    target,
    ranged:
      CREATURES[a.creature].range > 1 &&
      (!target || battleDistance(updated, next.units.find((u) => u.id === target)!) > 1),
    path: moved
      ? [{ q: a.q, r: a.r }, ...battlePathTo(a, updated, battleGround(before), blocked)]
      : [],
    changes,
    duration:
      kind === 'attack' && moved ? 1400 : kind === 'move' ? 650 : kind === 'defend' ? 450 : 950,
  };
}
