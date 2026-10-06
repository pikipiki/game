import { SAVE_GAME_KEY } from '@/app/model/persistence';
import { SITES } from '@/game/data';
import { newGame, reduce, type GameState } from '@/game/engine';

/** Combat sur un camp (carte), une retraite doit ramener à l’exploration. */
export function campBattleFixture(): GameState {
  const state = newGame();
  const camp = SITES.find((site) => site.id === 'camp1')!;
  state.hero = { q: camp.q, r: camp.r };
  return reduce(state, { type: 'fight', site: 'camp1' });
}

/** Siège en cours + file adverse : retraite ne doit pas relancer un combat. */
export function siegeBattleWithQueueFixture(): GameState {
  const state = newGame();
  const lead = state.enemyHeroes![0]!;
  state.enemyHeroes = [{ ...lead, q: -2, r: 2 }, state.enemyHeroes![1]!];
  state.hero = { q: 3, r: -3 };
  const battled = reduce(state, { type: 'end-day' });
  battled.enemyQueue = ['enemy-dawn'];
  return battled;
}

export { SAVE_GAME_KEY };
