import { battleTitle } from './game/opponent';
import { CREATURES, BATTLE_TILES, BATTLE_WIDTH } from './game/data';
import { activeUnit, reachable, unitCount, type GameState } from './game/engine';
import { battleControls, cellName, turnOrder, type BattleSelection } from './game/battle-controls';
import { escape, icon, portrait } from './ui';
export function battleRoster(s: GameState, selection: BattleSelection): string {
  return s
    .battle!.units.filter((u) => u.hp > 0)
    .map(
      (u) =>
        `<button class="combat-roster-unit ${u.side} ${u.id === selection.unit ? 'chosen' : ''} ${u.id === s.battle!.active ? 'playing' : ''}" data-action="select-fighter" data-id="${u.id}" aria-label="Sélectionner ${CREATURES[u.creature].name} ${u.side === 'ally' ? 'allié' : 'ennemi'}">${portrait(CREATURES[u.creature])}<span><strong>${CREATURES[u.creature].name}</strong><small>${unitCount(u)} unités · ${u.hp} PV · ${cellName(u)}</small><i class="health-track"><i style="width:${(u.hp / u.maxHp) * 100}%"></i></i></span></button>`,
    )
    .join('');
}
export function battleChrome(s: GameState, selection: BattleSelection, training: boolean): string {
  const b = s.battle!;
  return `<div class="combat-heading"><span class="eyebrow">${training ? 'COMBAT D’ENTRAÎNEMENT' : b.opponent?.town ? 'DÉFENSE DU CHÂTEAU' : b.siege ? 'SIÈGE DU CHÂTEAU' : 'CHAMP DE BATAILLE'} · TOUR ${b.round}</span><h1>${training ? 'L’arène de Pompon' : battleTitle(s)}</h1></div><div class="hero-banner ally-hero">${icon('shield', 25)}<span>${b.opponent?.armyBackup ? 'Votre garnison' : 'Votre héros'}<small>${b.opponent?.armyBackup ? 'Héros absent · aucun sort' : `${s.mana} points de mana`}</small></span></div><div class="hero-banner enemy-hero">${icon('sword', 25)}<span>Le Crépuscule<small>${b.units.filter((u) => u.side === 'enemy' && u.hp > 0).reduce((n, u) => n + unitCount(u), 0)} créatures</small></span></div><div class="initiative-bar" aria-label="Ordre des tours"><span>INITIATIVE</span>${turnOrder(
    s,
  )
    .map(
      (u, i) =>
        `<button class="initiative-unit ${u.side} ${i === 0 ? 'current' : ''}" data-action="select-fighter" data-id="${u.id}" title="${CREATURES[u.creature].name} · ${i === 0 ? 'Tour actuel' : 'À venir'}" aria-label="${i === 0 ? 'Tour actuel' : 'Prochain tour'} : ${CREATURES[u.creature].name}">${portrait(CREATURES[u.creature])}<b>${unitCount(u)}</b></button>`,
    )
    .join(
      '',
    )}<small>${b.result ? 'Bataille terminée' : activeUnit(s)?.side === 'ally' ? 'Votre tour' : 'Tour adverse'}</small></div>${b.siege ? `<div class="siege-status">${b.siege.wallHp ? `Remparts : ${b.siege.wallHp} / ${b.siege.maxWallHp} PV` : 'Remparts détruits'}<small>${b.opponent?.town ? (b.siege.wallHp ? 'Défendez la garnison pendant les tirs de la catapulte adverse' : 'Les remparts sont ouverts : repoussez les assaillants') : b.siege.wallHp ? 'Utilisez la catapulte pour ouvrir le passage' : 'Votre armée peut entrer dans le château'}</small></div>` : ''}<div class="combat-roster-strip">${battleRoster(s, selection)}</div><div class="combat-event" role="status" aria-live="polite">${icon('sword', 14)}${escape(s.log[0])}</div>`;
}
export function battleToolbar(s: GameState, selection: BattleSelection, training: boolean): string {
  const b = s.battle!,
    a = activeUnit(s)!;
  if (b.result)
    return `<div class="combat-summary"><strong>${b.result === 'victory' ? 'VICTOIRE !' : 'DÉFAITE'}</strong><span>${b.result === 'victory' ? 'Vos troupes ont remporté la bataille.' : 'Reconstituez votre armée à la citadelle.'}</span><button class="button gold" data-action="finish-battle">${training ? 'Retour à la campagne' : 'Continuer'} ${icon('arrow')}</button></div>`;
  const c = battleControls(s, selection);
  const hint = selection.spell
    ? `Sélectionnez ${selection.spell === 'bolt' ? 'un ennemi' : 'un allié'}, puis confirmez le sort.`
    : c.attack
      ? `${c.hits} dégâts prévus · ${c.loss} créatures éliminées`
      : c.move
        ? `Destination ${cellName(selection.hex!)} : confirmez le déplacement.`
        : c.target?.side === 'enemy'
          ? 'Ennemi hors de portée. Choisissez une case bleue pour avancer.'
          : 'Sélectionnez une case bleue ou une troupe ennemie.';
  return `<div class="combat-active">${portrait(CREATURES[a.creature])}<span><small>${a.side === 'ally' ? 'TROUPE ACTIVE' : 'L’ADVERSAIRE JOUE'}</small><strong>${CREATURES[a.creature].name}</strong><b>${unitCount(a)} unités · ${a.hp} PV</b></span></div><div class="combat-command-area"><div class="combat-instruction">${hint}</div><div class="combat-commands"><button class="combat-command" data-action="audio-settings" aria-label="Musique et bruitages">♫</button><button class="combat-command" data-action="confirm-move" ${c.move && !selection.spell ? '' : 'disabled'}>${icon('foot')}<span>Déplacer</span></button><button class="combat-command attack-command" data-action="confirm-attack" ${c.attack && !selection.spell ? '' : 'disabled'}>${icon('sword')}<span>Attaquer</span></button><button class="combat-command" data-action="defend" ${c.canPlay ? '' : 'disabled'}>${icon('shield')}<span>Défendre</span></button><button class="combat-command" data-action="wait" ${c.canPlay && !a.waited ? '' : 'disabled'}>${icon('sun')}<span>Attendre</span></button><button class="combat-command ${selection.spell === 'bolt' ? 'armed' : ''}" data-action="bolt" ${c.canPlay && !b.opponent?.armyBackup && s.mana >= 4 && b.spellRound !== b.round ? '' : 'disabled'}>${icon('spark')}<span>Éclair · 4</span></button><button class="combat-command ${selection.spell === 'heal' ? 'armed' : ''}" data-action="heal" ${c.canPlay && !b.opponent?.armyBackup && s.mana >= 4 && b.spellRound !== b.round ? '' : 'disabled'}>${icon('heart')}<span>Soin · 4</span></button>${b.siege && !b.opponent?.town ? `<button class="combat-command" data-action="catapult" ${c.canPlay && b.siege.wallHp > 0 ? '' : 'disabled'}>${icon('castle')}<span>Catapulte</span></button>` : ''}${selection.spell ? `<button class="button gold cast-button" data-action="confirm-spell" ${c.cast ? '' : 'disabled'}>Lancer le sort</button>` : ''}</div></div>`;
}
export function fighterPanel(s: GameState, selection: BattleSelection): string {
  const c = battleControls(s, selection),
    u = c.target ?? activeUnit(s)!,
    creature = CREATURES[u.creature];
  return `<div class="fighter-detail"><div class="eyebrow">${u.side === 'ally' ? 'VOTRE TROUPE' : 'TROUPE ADVERSE'} · ${cellName(u)}</div><div class="active-creature">${portrait(creature)}<div><h2>${creature.name}</h2><p>${unitCount(u)} créatures · Niveau ${creature.tier}</p></div></div><div class="fighter-health"><span>${u.hp} / ${u.maxHp} PV</span><i class="health-track"><i style="width:${(u.hp / u.maxHp) * 100}%"></i></i></div><div class="fighter-stats"><span>Attaque <b>${creature.attack}</b></span><span>Défense <b>${creature.defense}</b></span><span>Tirs <b>${creature.range > 1 ? (u.shots ?? 12) : 'Mêlée'}</b></span><span>Vitesse <b>${creature.speed}</b></span></div><p>${creature.description}</p><p class="fine-print">${u.retaliated ? 'Riposte utilisée ce round' : 'Riposte disponible'}${u.waited ? ' · Attente utilisée' : ''}</p>${c.attack ? `<div class="damage-forecast">${icon('sword')} ${c.hits} dégâts · ${c.loss} pertes prévues</div>` : ''}</div><div class="combat-roster-heading">LES TROUPES SUR LE TERRAIN</div><div class="combat-sidebar-roster">${battleRoster(s, selection)}</div><button class="button subtle full" data-action="tactical-moves">${icon('map')} Choisir une case de déplacement</button><div class="combat-history"><span class="eyebrow">JOURNAL DE BATAILLE</span>${s.log
    .slice(0, 4)
    .map((line) => `<p>${escape(line)}</p>`)
    .join('')}</div>`;
}
export function movePicker(s: GameState): string {
  const moves = reachable(s);
  return `<p>Sélectionnez une destination sur cette grille ou directement sur le plateau 3D. Le bouton « Déplacer » confirme votre choix.</p><div class="tactical-grid" role="group" aria-label="Cases accessibles">${Array.from(
    { length: BATTLE_TILES.length },
    (_, i) => {
      const q = i % BATTLE_WIDTH,
        r = Math.floor(i / BATTLE_WIDTH),
        allowed = moves.some((h) => h.q === q && h.r === r);
      return `<button data-action="select-cell" data-q="${q}" data-r="${r}" ${allowed ? '' : 'disabled'}>${cellName({ q, r })}</button>`;
    },
  ).join('')}</div>`;
}
