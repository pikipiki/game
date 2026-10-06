import { SAVE_GAME_KEY } from '@/app/model/persistence';
import { newGame, reduce, type GameState } from '@/game/engine';

export interface OpponentStrikeEndDayFixture {
  readonly game: GameState;
  readonly leaderHexBefore: string;
  readonly leaderHexAfter: string;
  readonly strikeToast: RegExp;
  readonly strikeEnemyId: string;
}

/** Héros loin, chef adverse proche de la citadelle → siège après fin de journée. */
export function opponentStrikeEndDayFixture(): OpponentStrikeEndDayFixture {
  const game = newGame();
  const leader = game.enemyHeroes![0]!;
  game.enemyHeroes = [{ ...leader, q: -2, r: 2 }, game.enemyHeroes![1]!];
  game.hero = { q: 3, r: -3 };
  const leaderHexBefore = '-2,2';
  const after = reduce(structuredClone(game), { type: 'end-day' });
  const moved = after.enemyHeroes!.find((hero) => hero.id === leader.id)!;
  const leaderHexAfter = `${moved.q},${moved.r}`;
  const strikeEnemyId = after.battle?.opponent?.hero ?? leader.id;
  return {
    game,
    leaderHexBefore,
    leaderHexAfter,
    strikeEnemyId,
    strikeToast: /assiège votre château/i,
  };
}

/** @deprecated Utiliser {@link opponentStrikeEndDayFixture}. */
export function gameStateForOpponentAttackOnEndDay(): GameState {
  return opponentStrikeEndDayFixture().game;
}

export { SAVE_GAME_KEY };
