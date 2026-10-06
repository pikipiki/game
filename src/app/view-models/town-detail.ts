import type {
  TownDetailBody,
  TownDetailModel,
  TownHallProjectModel,
} from '@/app/types/town-detail';
import { getCreature, SITES } from '@/game/data';
import {
  income,
  maxMana,
  maxMovement,
  recruitStock,
  weeklyGrowth,
  type GameState,
} from '@/game/engine';
import { builtBuildings } from '@/game/buildings';
import type { Family } from '@/game/types';
import { BUILDINGS, type BuildingId } from '@/render/town';
import { combatKindLabel } from '@/app/lib/creature-ui-copy';
import { localizedBuilding, localizedCreature } from '@/i18n/localize';
import type { TranslateFn } from '@/i18n/translate';
import { constructionStatusLabel } from '@/app/lib/town-building-copy';

function hallUpgradeNote(state: GameState, t: TranslateFn): string {
  if (state.castle !== 2) return '';
  return t('town.hall.upgradeNote');
}

function hallUpgradeCostLabel(state: GameState, t: TranslateFn): string {
  if (state.castle === 3) return t('town.hall.maxLevel');
  return t('town.hall.upgradeCost', {
    gold: state.castle * 550,
    crystals: 5,
  });
}

function hallUpgradeButtonLabel(state: GameState, t: TranslateFn): string {
  if (state.castle === 3) return t('town.hall.upgradeDone');
  return t('town.hall.upgradeBtn');
}

function hallProjects(
  state: GameState,
  atTown: boolean,
  home: boolean,
  t: TranslateFn,
): TownHallProjectModel[] {
  const projects: TownHallProjectModel[] = [];
  const paid = BUILDINGS.filter((building) => building.gold > 0);
  for (const building of paid) {
    const reason = constructionStatusLabel(state, building.id, t);
    const done = builtBuildings(state).includes(building.id);
    const labels = localizedBuilding(building, t);
    let costLine = t('town.hall.costLine', {
      gold: building.gold,
      crystals: building.crystals,
    });
    if (done) costLine = t('town.hall.built');
    let reasonText: string | null = null;
    let buildDisabled = true;
    let buildLabel = '';
    if (!done) {
      reasonText = reason ?? t('town.hall.readyBuild');
      buildDisabled = !(atTown && home && !reason);
      buildLabel = t('town.hall.buildBtn', { name: labels.name });
    }
    projects.push({
      id: building.id,
      name: labels.name,
      subtitle: labels.subtitle,
      costLine,
      built: done,
      reasonText,
      buildDisabled,
      buildLabel,
    });
  }
  return projects;
}

function keepBody(state: GameState, t: TranslateFn): TownDetailBody {
  const castles = state.owned.filter((siteId) =>
    SITES.some(
      (site) => site.id === siteId && site.kind === 'castle',
    ),
  ).length;
  return {
    kind: 'keep',
    title: t('town.keep.title'),
    lead: t('town.keep.lead', { count: castles }),
    fortLabel: t('town.stat.fortifications'),
    levelLine: t('town.stat.level', { level: state.castle }),
    incomeLabel: t('town.stat.realmIncome'),
    incomeLine: t('town.stat.goldPerDay', { gold: income(state) }),
    conquerText: t('town.keep.conquer'),
    buildCitadelLabel: t('town.keep.buildCitadel'),
  };
}

function hallBody(
  state: GameState,
  atTown: boolean,
  home: boolean,
  t: TranslateFn,
): TownDetailBody {
  let required: BuildingId = 'forge';
  if (state.castle === 1) required = 'hall';
  const canUpgrade =
    atTown &&
    home &&
    state.castle < 3 &&
    state.gold >= state.castle * 550 &&
    state.crystals >= 5 &&
    state.buildDay !== state.day &&
    builtBuildings(state).includes(required);
  let dayNotice = t('town.hall.buildToday');
  if (state.buildDay === state.day) {
    dayNotice = t('town.hall.buildDoneToday');
  }
  let homeNote: string | null = null;
  if (!home) homeNote = t('town.hall.homeNote');
  return {
    kind: 'hall',
    projectsTitle: t('town.hall.projectsTitle'),
    projectsLead: t('town.hall.projectsLead'),
    dayNotice,
    projects: hallProjects(state, atTown, home, t),
    fortTitle: t('town.hall.fortTitle', { level: state.castle }),
    fortBonus: t('town.hall.fortBonus', {
      note: hallUpgradeNote(state, t),
    }),
    upgradeCost: hallUpgradeCostLabel(state, t),
    upgradeLabel: hallUpgradeButtonLabel(state, t),
    upgradeDisabled: !canUpgrade,
    homeNote,
  };
}

function recruitBody(
  state: GameState,
  family: Family,
  atTown: boolean,
  t: TranslateFn,
): TownDetailBody {
  const unit = state.army.find(
    (stack) => getCreature(stack.creature).family === family,
  );
  const raw = getCreature(unit?.creature ?? family);
  const display = localizedCreature(raw, t);
  const cost = getCreature(family).gold * 3;
  const stock = recruitStock(state, family);
  const canRecruit = atTown && stock >= 3 && state.gold >= cost;
  const weekDay = Math.floor((state.day - 1) / 7) * 7 + 8;
  const growth = weeklyGrowth(state, family);
  return {
    kind: 'recruit',
    family,
    creatureName: display.name,
    description: display.description,
    perPurchaseLabel: t('town.recruit.perPurchase'),
    perPurchaseCount: t('town.recruit.perPurchaseCount'),
    stockLabel: t('town.recruit.available'),
    stock,
    costLine: t('town.recruit.costGold', { cost }),
    recruitLabel: t('town.recruit.recruitBtn', { name: display.name }),
    recruitDisabled: !canRecruit,
    growthFine: t('town.recruit.growthFine', { growth, weekDay }),
    combatKindValue: combatKindLabel(raw, t),
  };
}

function guildBody(state: GameState, t: TranslateFn): TownDetailBody {
  const boltDamage = 70 + state.castle * 15;
  const healAmount = 80 + state.castle * 20;
  return {
    kind: 'guild',
    title: t('town.guild.title'),
    manaLine: t('town.guild.lead', {
      mana: state.mana,
      maxMana: maxMana(state),
    }),
    boltTitle: t('town.guild.boltTitle'),
    boltDesc: t('town.guild.boltDesc', { damage: boltDamage }),
    healTitle: t('town.guild.healTitle'),
    healDesc: t('town.guild.healDesc', { amount: healAmount }),
    manaRestore: t('town.guild.manaRestore'),
  };
}

function armyUnitIds(state: GameState): string[] {
  return state.army.map((unit) => unit.id);
}

function forgeBody(state: GameState, t: TranslateFn): TownDetailBody {
  return {
    kind: 'forge',
    title: t('town.forge.title'),
    lead: t('town.forge.lead'),
    codexLabel: t('town.forge.codexBtn'),
    unitIds: armyUnitIds(state),
  };
}

function heroHallBody(state: GameState, t: TranslateFn): TownDetailBody {
  const week = Math.ceil(state.day / 7);
  return {
    kind: 'heroHall',
    title: t('town.heroHall.title'),
    lead: t('town.heroHall.lead', {
      day: state.day,
      week,
      movement: state.movement,
      maxMove: maxMovement(state),
    }),
    logHead: state.log[0] ?? '',
    unitIds: armyUnitIds(state),
  };
}

function unbuiltBody(
  state: GameState,
  townBuilding: BuildingId,
  atTown: boolean,
  home: boolean,
  t: TranslateFn,
): TownDetailBody {
  const building = BUILDINGS.find((entry) => entry.id === townBuilding)!;
  const labels = localizedBuilding(building, t);
  const reason = constructionStatusLabel(state, townBuilding, t);
  const canBuild = atTown && home && !reason;
  const reasonText = reason ?? t('town.unbuilt.buildAvailable');
  return {
    kind: 'unbuilt',
    title: t('town.unbuilt.title'),
    lead: t('town.unbuilt.lead', { subtitle: labels.subtitle }),
    buildBuildingId: townBuilding,
    costLine: t('town.hall.costLine', {
      gold: building.gold,
      crystals: building.crystals,
    }),
    reasonText,
    buildDisabled: !canBuild,
    buildLabel: t('town.unbuilt.buildBtn', { name: labels.name }),
  };
}

function detailBody(
  state: GameState,
  townBuilding: BuildingId,
  atTown: boolean,
  home: boolean,
  t: TranslateFn,
): TownDetailBody {
  if (townBuilding === 'keep') return keepBody(state, t);
  if (townBuilding === 'hall') return hallBody(state, atTown, home, t);
  if (townBuilding === 'sylve' || townBuilding === 'sol') {
    return recruitBody(state, townBuilding, atTown, t);
  }
  if (townBuilding === 'guild') return guildBody(state, t);
  if (townBuilding === 'forge') return forgeBody(state, t);
  return heroHallBody(state, t);
}

export function buildTownDetailModel(
  state: GameState,
  townBuilding: BuildingId,
  atTown: boolean,
  home: boolean,
  t: TranslateFn,
): TownDetailModel {
  const building = BUILDINGS.find((entry) => entry.id === townBuilding)!;
  const labels = localizedBuilding(building, t);
  let body = detailBody(state, townBuilding, atTown, home, t);
  if (!builtBuildings(state).includes(townBuilding)) {
    body = unbuiltBody(state, townBuilding, atTown, home, t);
  }
  let travelNotice: string | null = null;
  if (!atTown) travelNotice = t('town.travelRecruitNotice');
  return {
    heading: {
      subtitle: labels.subtitle,
      title: labels.name,
      closeAria: t('town.closeBuildingAria'),
    },
    travelNotice,
    body,
  };
}
