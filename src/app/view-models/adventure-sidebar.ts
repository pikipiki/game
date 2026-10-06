import type { AdventureSidebarViewModel } from '@/app/types/adventure-sidebar';
import { buildLocationCardModel } from '@/app/view-models/location-card';
import { localizedSite } from '@/i18n/localize';
import { createTranslator, type AppLocale } from '@/i18n/translate';
import {
  getCreature,
  SITES,
  worldTileAt,
  key,
  type Hex,
} from '@/game/data';
import { income, maxMovement, maxMana, type GameState } from '@/game/engine';

const TERRAIN_COLORS: Record<string, string> = {
  grass: '#68863f',
  forest: '#315234',
  water: '#255278',
  mountain: '#918873',
  sand: '#b6a576',
};

function minimapTileBackground(
  known: boolean,
  terrain: string | undefined,
): string {
  if (!known || !terrain) return '#080b07';
  const color = TERRAIN_COLORS[terrain];
  if (color) return color;
  return '#080b07';
}

function minimapLabel(
  known: boolean,
  site: (typeof SITES)[number] | undefined,
  t: ReturnType<typeof createTranslator>,
): string {
  if (!known) return t('sidebar.unknownLand');
  if (site) return localizedSite(site, t).name;
  return t('sidebar.terrain');
}

function minimapCellContent(
  state: GameState,
  hexQ: number,
  hexR: number,
  site: (typeof SITES)[number] | undefined,
  known: boolean,
): string {
  if (hexQ === state.hero.q && hexR === state.hero.r) return '✦';
  if (site && known) return '•';
  return '';
}

function mineOwnershipLabel(
  state: GameState,
  t: ReturnType<typeof createTranslator>,
): string {
  if (state.enemyOwned?.includes('gold')) return t('sidebar.mineEnemy');
  if (state.owned.includes('gold')) return t('sidebar.mineAlly');
  return t('sidebar.mineNeutral');
}

export function buildAdventureSidebarViewModel(
  state: GameState,
  selected: Hex | null,
  locale: AppLocale,
): AdventureSidebarViewModel {
  const t = createTranslator(locale);
  const lead = state.army[0];
  const creatureId = lead?.creature ?? 'sylve';
  const week = Math.ceil(state.day / 7);
  const enemyCount = (state.enemyHeroes ?? []).length;
  const minimapCells = [];

  for (let cellIndex = 0; cellIndex < 81; cellIndex += 1) {
    const hexQ = (cellIndex % 9) - 4;
    const hexR = Math.floor(cellIndex / 9) - 4;
    const tile = worldTileAt({ q: hexQ, r: hexR });
    const known = Boolean(tile && state.explored.includes(key(tile)));
    const site = SITES.find(
      (siteEntry) => siteEntry.q === hexQ && siteEntry.r === hexR,
    );
    minimapCells.push({
      hexQ,
      hexR,
      label: minimapLabel(known, site, t),
      background: minimapTileBackground(known, tile?.terrain),
      inner: minimapCellContent(state, hexQ, hexR, site, known),
    });
  }

  const armySlots = [];
  for (let slot = 0; slot < 7; slot += 1) {
    const unit = state.army[slot];
    if (!unit) {
      armySlots.push({ kind: 'empty' as const, slot });
      continue;
    }
    const creature = getCreature(unit.creature);
    armySlots.push({
      kind: 'unit' as const,
      slot,
      unitId: unit.id,
      count: unit.count,
      creatureId: unit.creature,
      ariaLabel: `${unit.count} ${creature.name}`,
    });
  }

  return {
    heroCreatureId: creatureId,
    movementLine: t('map.movementMana', {
      moveCurrent: state.movement,
      moveMax: maxMovement(state),
      manaCurrent: state.mana,
      manaMax: maxMana(state),
    }),
    locationCard: buildLocationCardModel(state, selected, t),
    minimapCells,
    armySlots,
    day: state.day,
    week,
    dailyIncome: income(state),
    logHead: state.log[0] ?? '',
    logTail: state.log[1] ?? '',
    enemyCount,
    mineLabel: mineOwnershipLabel(state, t),
    heroTitle: t('sidebar.heroTitle'),
    dayLabel: t('sidebar.day', { day: state.day }),
    weekLabel: t('sidebar.week', { week }),
    incomeLabel: t('sidebar.income', { gold: income(state) }),
    journalEnemies: t('sidebar.journalEnemies', {
      count: enemyCount,
      mine: mineOwnershipLabel(state, t),
    }),
    minimapAria: t('sidebar.minimapAria'),
    armyAria: t('sidebar.armyAria'),
  };
}
