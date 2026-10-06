import {
  getCreature,
  key,
  battlePathTo,
  battleDistance,
  type Hex,
} from '../data';
import {
  activeUnit,
  battleGround,
  type Action,
  type GameState,
} from '../engine';

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
export function animationProgress(
  start: number,
  now: number,
  duration: number,
): number {
  if (duration <= 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, (now - start) / duration));
}

interface HpChange {
  id: string;
  amount: number;
  defeated: boolean;
}

function collectHpChanges(
  priorBattle: NonNullable<GameState['battle']>,
  nextBattle: NonNullable<GameState['battle']>,
): HpChange[] {
  return nextBattle.units.flatMap((unit) => {
    const prior = priorBattle.units.find(
      (oldUnit) => oldUnit.id === unit.id,
    );
    if (!prior || unit.hp === prior.hp) {
      return [];
    }
    return [
      {
        id: unit.id,
        amount: unit.hp - prior.hp,
        defeated: unit.hp === 0,
      },
    ];
  });
}

function animationKind(
  before: GameState,
  after: GameState,
  action: Action,
  moved: boolean,
  changes: HpChange[],
): AnimationPlan['kind'] {
  if (action.type === 'catapult') {
    return 'catapult';
  }
  const priorWall = before.battle?.siege?.wallHp ?? 0;
  const nextWall = after.battle?.siege?.wallHp ?? 0;
  if (priorWall > nextWall) {
    return 'catapult';
  }
  if (action.type === 'spell') {
    return action.spell;
  }
  if (changes.some((change) => change.amount < 0)) {
    return 'attack';
  }
  if (moved) {
    return 'move';
  }
  return 'defend';
}

function animationDuration(
  kind: AnimationPlan['kind'],
  moved: boolean,
): number {
  if (kind === 'attack' && moved) {
    return 1400;
  }
  if (kind === 'move') {
    return 650;
  }
  if (kind === 'defend') {
    return 450;
  }
  return 950;
}

function resolveTargetId(
  action: Action,
  changes: HpChange[],
): string | null {
  if (action.type === 'attack' || action.type === 'spell') {
    return action.target;
  }
  const wounded = changes.find((change) => change.amount < 0);
  if (wounded) {
    return wounded.id;
  }
  return null;
}

export function animationPlan(
  before: GameState,
  after: GameState,
  action: Action,
): AnimationPlan | null {
  const actorUnit = activeUnit(before);
  const priorBattle = before.battle;
  const nextBattle = after.battle;
  if (
    !actorUnit ||
    !priorBattle ||
    !nextBattle ||
    before === after ||
    !['attack', 'battle-move', 'spell', 'defend', 'enemy', 'catapult'].includes(
      action.type,
    )
  ) {
    return null;
  }
  const updated = nextBattle.units.find(
    (unit) => unit.id === actorUnit.id,
  );
  if (!updated) {
    return null;
  }
  const moved = key(actorUnit) !== key(updated);
  const changes = collectHpChanges(priorBattle, nextBattle);
  const kind = animationKind(before, after, action, moved, changes);
  const target = resolveTargetId(action, changes);
  const blocked = new Set(
    priorBattle.units
      .filter((unit) => unit.id !== actorUnit.id && unit.hp > 0)
      .map(key),
  );
  let ranged = false;
  if (getCreature(actorUnit.creature).range > 1) {
    if (!target) {
      ranged = true;
    } else {
      const targetUnit = nextBattle.units.find((unit) => unit.id === target);
      if (targetUnit && battleDistance(updated, targetUnit) > 1) {
        ranged = true;
      }
    }
  }
  let path: Hex[] = [];
  if (moved) {
    path = [
      { q: actorUnit.q, r: actorUnit.r },
      ...battlePathTo(actorUnit, updated, battleGround(before), blocked),
    ];
  }
  return {
    kind,
    actor: actorUnit.id,
    target,
    ranged,
    path,
    changes,
    duration: animationDuration(kind, moved),
  };
}
