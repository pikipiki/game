import './style.css';
import { GameAudio } from './audio';
const audio = new GameAudio();
import {
  CREATURES,
  DIRECTIONS,
  SITES,
  WALKABLE,
  WORLD,
  key,
  pathTo,
  type Hex,
  type Creature,
} from './game/data';
import {
  activeUnit,
  income,
  recruitStock,
  weeklyGrowth,
  friendlyTown,
  loadGame,
  maxMana,
  maxMovement,
  newGame,
  reduce,
  type Action,
  type GameState,
} from './game/engine';
import { battleTitle } from './game/opponent';
import { builtBuildings, constructionStatus } from './game/buildings';
import { AdventureScene } from './render/adventure';
import { GameScene, type Pick } from './render/scene';
import { TownScene, BUILDINGS, type BuildingId } from './render/town';
import { escape, icon, portrait } from './ui';
import { battleControls, type BattleSelection } from './game/battle-controls';
import { battleChrome, battleToolbar, fighterPanel, movePicker } from './battle-ui';

const SAVE = 'pompon-kingdom-save-v1';
const sandbox = new URLSearchParams(location.search).has('preview');
let storageWorks = true;
function stored(): string | null {
  if (sandbox) return null;
  try {
    return localStorage.getItem(SAVE);
  } catch {
    storageWorks = false;
    return null;
  }
}
let state: GameState = loadGame(stored()) ?? newGame();
let selected: Hex | null = state.hero;
let modal: string | null = stored() ? null : 'intro';
let detail: string = 'army-sylve';
let spell: 'bolt' | 'heal' | null = null;
let selectedFighter: string | null = null;
let selectedBattleHex: Hex | null = null;
let trainingBackup: GameState | null = null;
const currentSelection = (): BattleSelection => ({
  unit: selectedFighter,
  hex: selectedBattleHex,
  spell,
});
let enemyTimer: ReturnType<typeof setTimeout> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let scene: GameScene | AdventureScene | null = null;
let sceneBattle = false;
let resolving = false;
let town: TownScene | null = null;
let townPanel = false;
let townOpen = false;
let townBuilding: BuildingId = 'keep';
const root = document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML = `<header class="header"><a class="brand" href="#" aria-label="Les Royaumes de Pompon">${icon('castle', 30)}<span>LES ROYAUMES<small>DE POMPON</small></span></a><div id="resources" class="resources"></div><button class="icon-btn sound-toggle" data-action="sound" aria-label="Activer ou couper le son">♫</button><button class="icon-btn" data-action="settings" aria-label="Sauvegarde et paramètres">${icon('settings')}</button></header><main class="layout"><section class="world" aria-label="Carte du royaume en trois dimensions"><div class="map-heading" id="map-heading"></div><div id="scene" class="scene"></div><div class="map-tools"><button class="icon-btn" data-action="zoom-in" aria-label="Zoom avant">${icon('plus')}</button><button class="icon-btn" data-action="zoom-out" aria-label="Zoom arrière">${icon('minus')}</button><button class="icon-btn" data-action="camera" aria-label="Recentrer la caméra">${icon('target')}</button></div><div class="map-caption" id="map-caption"></div><div class="map-compass" aria-hidden="true"><span>N</span>✧</div></section><aside class="sidebar" id="sidebar"></aside></main><footer class="footer"><nav aria-label="Navigation principale"><button class="nav-btn active" data-action="map">${icon('map')}<span>Explorer</span></button><button class="nav-btn" data-action="army">${icon('shield')}<span>Armée</span></button><button class="nav-btn" data-action="castle">${icon('castle')}<span>Citadelle</span></button><button class="nav-btn" data-action="codex">${icon('book')}<span>Bestiaire</span></button></nav><div class="save-indicator" id="save-indicator"></div><button class="button gold end-day" id="end-day" data-action="end-day"></button></footer><div id="town-root"></div><div id="modal-root"></div><div id="toast" class="toast" role="status" aria-live="polite"></div><input type="file" id="import" accept="application/json,.json" hidden/>`;
try {
  scene = new AdventureScene(document.querySelector('#scene')!, onPick);
} catch {
  document.querySelector('#scene')!.innerHTML =
    '<div class="webgl-error"><h2>La 3D a besoin de WebGL</h2><p>Activez l’accélération matérielle ou utilisez un navigateur récent pour afficher le royaume.</p></div>';
}
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const resource = (name: string, value: string, cls: string, title: string) =>
  `<div class="resource ${cls}" title="${title}">${icon(name)}<span>${value}</span><small>${title}</small></div>`;
function persist() {
  if (trainingBackup || sandbox) return;
  try {
    localStorage.setItem(SAVE, JSON.stringify(state));
  } catch {
    storageWorks = false;
  }
}
function toast(message: string) {
  const t = document.querySelector('#toast')!;
  t.textContent = message;
  t.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('visible'), 3500);
}
async function dispatch(action: Action) {
  if (resolving) return;
  const next = reduce(state, action);
  if (next === state) {
    toast('Cette action n’est pas disponible pour le moment.');
    return;
  }
  audio.effect(
    action.type === 'spell'
      ? 'spell'
      : action.type === 'catapult'
        ? 'catapult'
        : action.type === 'attack' || action.type === 'enemy'
          ? 'attack'
          : action.type === 'move' || action.type === 'battle-move'
            ? 'move'
            : 'click',
  );
  if (
    scene instanceof GameScene &&
    state.battle &&
    next.battle &&
    ['attack', 'battle-move', 'spell', 'defend', 'enemy', 'catapult'].includes(action.type)
  ) {
    resolving = true;
    root.classList.add('resolving');
    document
      .querySelectorAll<HTMLButtonElement>(
        '#combat-toolbar button, #combat-chrome button, .combat-sidebar-roster button, .retreat',
      )
      .forEach((b) => (b.disabled = true));
    const status = document.querySelector('.combat-instruction');
    if (status) status.textContent = next.log[0];
    try {
      await scene.playAction(state, next, action);
    } catch (error) {
      console.warn('Animation interrompue ; l’action du jeu reste appliquée.', error);
    } finally {
      resolving = false;
      root.classList.remove('resolving');
    }
  }
  state = next;
  spell = null;
  selectedFighter = null;
  selectedBattleHex = null;
  persist();
  render();
}
function unitCard(id: string): string {
  const u = state.army.find((a) => a.id === id)!;
  const c = CREATURES[u.creature];
  const evolve = c.evolves.some((e) => u.xp >= CREATURES[e].xp);
  return `<button class="army-card" data-action="creature" data-id="${u.id}"><div class="avatar" style="--accent:${c.accent}">${portrait(c)}</div><div class="army-info"><small>${c.family === 'sylve' ? 'SYLVE · GARDIEN' : 'AURORE · MAGE'} · N${c.tier}</small><strong>${c.name}</strong><span>${evolve ? '✦ Évolution disponible' : `${u.xp} XP · ${c.range > 1 ? 'Attaque à distance' : 'Corps à corps'}`}</span></div><b class="army-count">${u.count}<small>unités</small></b></button>`;
}
function selectedCard(): string {
  if (state.battle) return battlePanel();
  const target = selected ?? state.hero,
    site = SITES.find((s) => key(s) === key(target)),
    at = key(target) === key(state.hero);
  const known = state.explored.includes(key(target));
  const path = pathTo(state.hero, target, WALKABLE),
    possible = path.length > 0 && path.length <= state.movement && known;
  const enemyHero = state.enemyHeroes?.find((e) => key(e) === key(target));
  if (enemyHero && known)
    return `<div class="location-card"><div class="eyebrow">HÉROS ADVERSE</div><h2>${escape(enemyHero.name)}</h2><p>${enemyHero.army.map((u) => `${u.count} ${CREATURES[u.creature].name}`).join(' · ')}</p><p>Il joue automatiquement à la fin de votre jour et peut capturer des lieux ou attaquer.</p><button class="button danger full" data-action="${at ? 'fight-hero' : 'travel'}" data-id="${enemyHero.id}" ${!at && !possible ? 'disabled' : ''}>${at ? 'Combattre le héros' : 'Intercepter le héros'}</button></div>`;
  const cleared = site && state.cleared.includes(site.id),
    locked =
      site?.id === 'boss' && (!state.cleared.includes('camp1') || !state.cleared.includes('camp2'));
  return `<div class="location-card"><div class="eyebrow">${icon(site?.kind === 'castle' ? 'castle' : site?.difficulty ? 'sword' : 'flag', 15)} ${site?.kind === 'army' && !cleared ? 'ARMÉE ENNEMIE' : site?.kind === 'castle' && site.difficulty && !cleared ? 'CHÂTEAU ENNEMI' : at ? 'VOTRE POSITION' : 'DESTINATION'}</div><h2>${known ? (site?.name ?? (WORLD.find((t) => key(t) === key(target))?.terrain === 'forest' ? 'Bois de velours' : 'Prairie de Sylve')) : 'Terre inexplorée'}</h2><p>${known ? (site?.description ?? 'Les chemins de Sylve recèlent encore bien des surprises. Explorez pour dévoiler le royaume.') : 'Approchez-vous pour révéler cette partie du royaume.'}</p><div class="location-action">${!at ? `<span class="travel-cost">${icon('foot', 16)} ${path.length || '—'} / ${state.movement} pas</span><button class="button primary" data-action="travel" ${possible ? '' : 'disabled'}>Se déplacer ${icon('arrow', 16)}</button>` : (site?.difficulty || (site && state.enemyOwned?.includes(site.id) && site.kind === 'castle')) && !state.owned.includes(site!.id) ? `<span class="travel-cost">${cleared ? '✓ Libéré' : locked ? '2 camps requis' : site.difficulty === 1 ? 'Difficulté : douce' : site.difficulty === 2 ? 'Difficulté : moyenne' : 'Difficulté : élevée'}</span><button class="button ${cleared ? '' : 'danger'}" data-action="fight" data-id="${site.id}" ${cleared || locked ? 'disabled' : ''}>${cleared ? 'Victoire' : locked ? 'Scellée' : site.kind === 'castle' || site.kind === 'fortress' ? 'Assiéger le château' : 'Combattre'} ${icon('sword', 16)}</button>` : site?.kind === 'castle' ? `<span class="travel-cost">Niveau ${state.castle} · +${income(state)} or/j</span><button class="button primary" data-action="castle">Entrer ${icon('arrow', 16)}</button>` : `<span class="travel-cost">${site && state.owned.includes(site.id) ? '✓ Sous votre bannière' : 'Le voyage continue'}</span><button class="button subtle" data-action="army">Voir l’armée ${icon('shield', 16)}</button>`}</div></div>`;
}
function battlePanel(): string {
  const b = state.battle!;
  if (b.result)
    return `<div class="location-card result"><div class="eyebrow">BATAILLE TERMINÉE</div><h2>${b.result === 'victory' ? 'Victoire !' : b.opponent?.armyBackup ? 'Garnison vaincue' : 'Votre héros se replie'}</h2><p>${b.result === 'victory' ? 'Votre armée a triomphé. Récoltez les récompenses pour poursuivre votre aventure.' : 'Recrutez et revenez mieux préparé.'}</p></div>`;
  return fighterPanel(state, currentSelection());
}
function render() {
  if (state.battle && townOpen) {
    closeTown();
    return;
  }
  audio.setTrack(townOpen ? 'town' : state.battle ? 'battle' : 'adventure');
  document
    .querySelector('.sound-toggle')
    ?.setAttribute('aria-label', audio.muted ? 'Activer le son' : 'Couper le son');
  document.querySelector('.sound-toggle')?.classList.toggle('muted', audio.muted);
  root.classList.toggle('in-battle', !!state.battle);
  if (scene && sceneBattle !== !!state.battle) {
    scene.dispose();
    sceneBattle = !!state.battle;
    try {
      const Scene = sceneBattle ? GameScene : AdventureScene;
      scene = new Scene(document.querySelector('#scene')!, onPick);
    } catch {
      scene = null;
    }
  }
  document.querySelector('#resources')!.innerHTML =
    resource('coin', fmt(state.gold), 'gold-text', 'Or') +
    resource('gem', fmt(state.crystals), 'purple-text', 'Cristaux') +
    resource('spark', `${state.mana}/${maxMana(state)}`, 'mint-text', 'Mana');
  document.querySelector('#map-heading')!.innerHTML =
    `<div class="region-tag"><i></i>${state.battle ? 'BATAILLE TACTIQUE' : 'CAMPAGNE · CHAPITRE I'}</div><h1>${state.battle ? battleTitle(state) : 'La vallée de Sylve'}</h1><p>${state.battle ? `Tour ${state.battle.round} · Attendre · Riposter · Tirer · Lancer un sort` : 'Un petit royaume. De grandes aventures.'}</p>`;
  document.querySelector('#map-caption')!.innerHTML = state.battle
    ? `<span class="legend-dot ally"></span> Votre armée <span class="legend-dot enemy"></span> Adversaire`
    : `${icon('foot', 15)} <span>${state.movement}/${maxMovement(state)} déplacements</span><span class="caption-divider">·</span><span class="drag-tip">Glissez pour déplacer la carte · Bannières rouges : ennemis</span>`;
  const side = document.querySelector('#sidebar')!;
  side.innerHTML = state.battle
    ? battlePanel()
    : `<div class="adventure-minimap" aria-label="Mini-carte du royaume">${Array.from(
        { length: 81 },
        (_, i) => {
          const q = (i % 9) - 4,
            r = Math.floor(i / 9) - 4,
            t = WORLD.find((t) => t.q === q && t.r === r),
            known = t && state.explored.includes(key(t));
          const site = SITES.find((s) => s.q === q && s.r === r);
          return `<button data-action="minimap" data-q="${q}" data-r="${r}" title="${known ? (site?.name ?? 'Terrain') : 'Terre inexplorée'}" aria-label="${known ? (site?.name ?? 'Terrain') : 'Terre inexplorée'} ${q},${r}" style="background:${known ? { grass: '#68863f', forest: '#315234', water: '#255278', mountain: '#918873', sand: '#b6a576' }[t!.terrain] : '#080b07'}">${q === state.hero.q && r === state.hero.r ? '✦' : site && known ? '•' : ''}</button>`;
        },
      ).join(
        '',
      )}</div><div class="adventure-hero"><div class="hero-medallion">${portrait(CREATURES[state.army[0]?.creature ?? 'sylve'])}</div><div><strong>Gardien de Sylve</strong><small>${state.movement}/${maxMovement(state)} déplacements · ${state.mana}/${maxMana(state)} mana</small></div></div><div class="army-slots" aria-label="Armée du héros">${Array.from(
        { length: 7 },
        (_, i) => {
          const u = state.army[i];
          return u
            ? `<button data-action="creature" data-id="${u.id}" aria-label="${u.count} ${CREATURES[u.creature].name}">${portrait(CREATURES[u.creature])}<b>${u.count}</b></button>`
            : '<span class="empty-slot"></span>';
        },
      ).join(
        '',
      )}</div>${selectedCard()}<div class="adventure-calendar"><strong>Jour ${state.day}</strong><span>Semaine ${Math.ceil(state.day / 7)}</span><small>+${income(state)} or / jour</small></div><div class="journal"><p>${escape(state.log[0])}</p><small>${(state.enemyHeroes ?? []).length} héros adverses · Mine : ${state.enemyOwned?.includes('gold') ? 'ennemie' : state.owned.includes('gold') ? 'alliée' : 'neutre'}</small><p>${escape(state.log[1] ?? '')}</p></div>`;
  document.querySelector('#save-indicator')!.innerHTML =
    `<i class="${storageWorks ? '' : 'unsaved'}"></i>${sandbox ? 'Aperçu sans sauvegarde' : storageWorks ? 'Sauvegarde automatique' : 'Sauvegarde indisponible'}<button class="text-button" data-action="help" aria-label="Comment jouer">${icon('help', 16)}</button>`;
  const end = document.querySelector<HTMLButtonElement>('#end-day')!;
  end.disabled = !!state.battle || state.won;
  end.innerHTML = `${icon('sun', 18)}<span>Jour ${state.day} <b>Terminer le jour</b></span>${icon('arrow', 18)}`;
  document.querySelector('#combat-chrome')!.innerHTML = state.battle
    ? battleChrome(state, currentSelection(), !!trainingBackup)
    : '';
  document.querySelector('#combat-toolbar')!.innerHTML = state.battle
    ? battleToolbar(state, currentSelection(), !!trainingBackup)
    : '';
  const selectedUnit = state.battle?.units.find((u) => u.id === selectedFighter);
  if (scene instanceof GameScene)
    scene.update(
      state,
      state.battle ? (selectedBattleHex ?? selectedUnit ?? null) : selected,
      selectedFighter,
    );
  else scene?.update(state, selected);
  document.querySelector<HTMLButtonElement>('.retreat')!.disabled = !!state.battle?.result;
  renderModal();
  renderTown();
  scheduleEnemy();
  if (state.won && modal !== 'victory') {
    modal = 'victory';
    renderModal();
  }
}
function stats(c: Creature): string {
  return `<div class="stats-grid"><span>${icon('heart')}<b>${c.hp}</b><small>Vie / unité</small></span><span>${icon('sword')}<b>${c.attack}</b><small>Attaque</small></span><span>${icon('shield')}<b>${c.defense}</b><small>Défense</small></span><span>${icon('target')}<b>${c.range > 1 ? 'Tir' : 'Mêlée'}</b><small>Combat</small></span></div>`;
}
function creatureDetail(): string {
  const unit = state.army.find((u) => u.id === detail) ?? state.army[0],
    c = CREATURES[unit.creature];
  return `<div class="creature-hero" style="--creature-color:${c.color}">${portrait(c)}<div><div class="eyebrow">${c.family === 'sylve' ? 'LIGNÉE DE SYLVE' : 'LIGNÉE DE L’AURORE'} · NIVEAU ${c.tier}</div><h2>${c.name}</h2><p>${c.description}</p><span class="badge">${unit.count} créatures · ${unit.xp} XP</span></div></div>${stats(c)}<div class="section-label"><span>CHOISIR UNE ÉVOLUTION</span><span>${unit.xp} XP acquis</span></div>${
    c.evolves.length
      ? c.evolves
          .map((id) => {
            const next = CREATURES[id],
              allowed =
                unit.xp >= next.xp &&
                state.gold >= next.gold &&
                state.crystals >= next.crystals &&
                !state.battle;
            return `<div class="evolution-card">${portrait(next)}<div><h3>${next.name}</h3><p>${next.description}</p><small>${next.xp} XP requis · ${next.gold} or · ${next.crystals} cristaux</small></div><button class="button primary" data-action="evolve" data-id="${unit.id}" data-creature="${id}" ${allowed ? '' : 'disabled'}>${icon('spark', 16)} Évoluer</button></div>`;
          })
          .join('')
      : '<div class="notice">✦ Cette troupe a atteint sa forme ultime.</div>'
  }<p class="fine-print">L’expérience se gagne au combat. L’évolution transforme toute la troupe ; vos futures recrues adoptent aussi cette forme.</p>`;
}
function openTown() {
  if (state.battle) {
    toast('La citadelle est inaccessible pendant une bataille.');
    return;
  }
  modal = null;
  renderModal();
  townOpen = true;
  audio.setTrack('town');
  townBuilding = 'keep';
  townPanel = false;
  root.classList.add('in-town');
  document.querySelector('#town-root')!.innerHTML =
    `<section class="town-screen" aria-label="Citadelle en trois dimensions"><header class="town-header"><div><span class="eyebrow">ROYAUME DE POMPON</span><h1 id="town-name">Citadelle de Pompon</h1></div><div id="town-resources" class="resources"></div><button class="icon-btn" data-action="audio-settings" aria-label="Musique et bruitages">♫</button><button class="button gold" data-action="leave-town">${icon('arrow')} <span>Retour à la carte</span></button></header><div class="town-body"><div class="town-viewport"><div id="town-scene"></div><div class="town-scene-title">✦ LA CITÉ DES FRIANDISES ✦<small>Touchez un bâtiment pour entrer</small></div><div class="town-camera"><button class="icon-btn" data-action="town-zoom-in" aria-label="Agrandir la ville">${icon('plus')}</button><button class="icon-btn" data-action="town-zoom-out" aria-label="Réduire la ville">${icon('minus')}</button><button class="icon-btn" data-action="town-camera" aria-label="Recentrer la ville">${icon('target')}</button></div><div class="town-building-markers">${BUILDINGS.map((b) => `<button class="town-marker" data-action="town-building" data-id="${b.id}" data-building="${b.id}" aria-label="Entrer dans ${b.name}">${b.name}</button>`).join('')}</div><p class="town-view-tip">Glissez pour tourner la vue · Bâtiments cliquables en 3D</p></div><aside id="town-detail" class="town-detail" aria-live="polite"></aside></div><nav class="town-building-nav" aria-label="Bâtiments de la citadelle">${BUILDINGS.map((b) => `<button data-action="town-building" data-id="${b.id}"><span>${icon(b.id === 'sylve' || b.id === 'sol' ? 'shield' : b.id === 'guild' ? 'book' : b.id === 'forge' ? 'spark' : 'castle', 22)}</span><strong>${b.name}</strong></button>`).join('')}</nav><div class="town-mobile-army" id="town-mobile-army"></div><footer class="town-garrison" id="town-garrison"></footer></section>`;
  createTownScene();
  renderTown();
}
function createTownScene() {
  town?.dispose();
  try {
    town = new TownScene(document.querySelector('#town-scene')!, (id) => {
      townBuilding = id;
      townPanel = true;
      renderTown();
    });
  } catch {
    document.querySelector('#town-scene')!.innerHTML =
      '<div class="webgl-error">Activez WebGL pour afficher la ville.</div>';
  }
  renderTown();
}
function closeTown() {
  town?.dispose();
  town = null;
  townOpen = false;
  root.classList.remove('in-town');
  document.querySelector('#town-root')!.innerHTML = '';
  render();
}
function renderTown() {
  if (!townOpen) return;
  const at = friendlyTown(state) && !state.battle;
  const home = key(state.hero) === key(SITES[0]);
  const place = SITES.find(
    (p) => p.kind === 'castle' && state.owned.includes(p.id) && key(p) === key(state.hero),
  );
  document.querySelector('#town-name')!.textContent = place?.name ?? 'Citadelle de Pompon';
  document.querySelector('#town-resources')!.innerHTML =
    resource('coin', fmt(state.gold), 'gold-text', 'Or') +
    resource('gem', fmt(state.crystals), 'purple-text', 'Cristaux');
  const building = BUILDINGS.find((b) => b.id === townBuilding)!;
  let content = '';
  if (townBuilding === 'keep')
    content = `<div class="town-crest">${icon('castle', 72)}</div><h3>Une cité sous votre bannière</h3><p>Ses tours protègent les Pompons de la vallée. Votre royaume possède ${state.owned.filter((id) => SITES.some((p) => p.id === id && p.kind === 'castle')).length} château(x).</p><div class="town-stat"><span>Fortifications</span><b>Niveau ${state.castle}</b></div><div class="town-stat"><span>Revenus du royaume</span><b>${income(state)} or / jour</b></div><p>Conquérez les châteaux des Brumes et de l’Aurore sur la carte. Vos catapultes ouvrent leurs remparts au combat.</p><button class="button gold full" data-action="town-building" data-id="hall">Construire dans la citadelle</button>`;
  else if (townBuilding === 'hall') {
    const required = state.castle === 1 ? 'hall' : 'forge';
    const canUpgrade =
      at &&
      home &&
      state.castle < 3 &&
      state.gold >= state.castle * 550 &&
      state.crystals >= 5 &&
      state.buildDay !== state.day &&
      builtBuildings(state).includes(required);
    content = `<h3>Les chantiers du royaume</h3><p>Un bâtiment par jour. Construisez les habitations dans l’ordre de leurs prérequis : elles apparaissent réellement dans la ville 3D.</p><div class="notice">${state.buildDay === state.day ? 'Le chantier du jour est terminé. Revenez demain.' : 'Un chantier est disponible aujourd’hui.'}</div><div class="town-projects">${BUILDINGS.filter(
      (b) => b.gold > 0,
    )
      .map((b) => {
        const reason = constructionStatus(state, b.id),
          done = builtBuildings(state).includes(b.id);
        return `<article class="town-project ${done ? 'built' : ''}"><h3>${b.name}</h3><p>${b.subtitle}</p><small>${done ? '✓ Construit' : `${b.gold} or · ${b.crystals} cristaux`}</small>${!done ? `<p class="fine-print">${reason ?? 'Prêt à construire'}</p><button class="button gold full" data-action="build" data-id="${b.id}" ${!at || !home || reason ? 'disabled' : ''}>Construire ${b.name}</button>` : ''}</article>`;
      })
      .join(
        '',
      )}</div><h3>Fortifications · Niveau ${state.castle}</h3><p>+50 or/jour, +1 déplacement et +2 mana maximum. ${state.castle === 2 ? 'La tour des astres requiert l’Atelier du sucre étoilé.' : ''}</p><div class="town-cost">${state.castle === 3 ? 'Niveau maximum atteint' : `${state.castle * 550} or · 5 cristaux`}</div><button class="button gold full" data-action="upgrade" ${canUpgrade ? '' : 'disabled'}>${state.castle === 3 ? 'Achevé' : 'Améliorer les fortifications'}</button>${!home ? '<p>Les constructions se font dans la citadelle de départ.</p>' : ''}`;
  } else if (townBuilding === 'sylve' || townBuilding === 'sol') {
    const f = townBuilding,
      u = state.army.find((a) => CREATURES[a.creature].family === f),
      c = CREATURES[u?.creature ?? f],
      cost = CREATURES[f].gold * 3;
    content = `<div class="town-creature">${portrait(c)}</div><h3>${c.name}</h3><p>${c.description}</p>${stats(c)}<div class="town-stat"><span>Recrues par achat</span><b>3 créatures</b></div><div class="town-stat"><span>Créatures disponibles</span><b>${recruitStock(state, f)}</b></div><div class="town-cost">${cost} or</div><button class="button gold full" data-action="recruit" data-id="${f}" ${!at || recruitStock(state, f) < 3 || state.gold < cost ? 'disabled' : ''}>Recruter 3 ${c.name}</button><p class="fine-print">+${weeklyGrowth(state, f)} recrues chaque semaine, le jour ${Math.floor((state.day - 1) / 7) * 7 + 8}. Les recrues adoptent la forme évoluée de votre troupe.</p>`;
  } else if (townBuilding === 'guild')
    content = `<div class="town-crest">${icon('book', 64)}</div><h3>Le grimoire du héros</h3><p>${state.mana} / ${maxMana(state)} points de mana. Le héros peut lancer un sort par round sans consommer le tour de sa troupe. Construire la guilde restaure toute sa réserve de mana.</p><article class="town-spell">${icon('spark', 28)}<div><h3>Éclair astral</h3><p>4 mana · ${70 + state.castle * 15} dégâts à une troupe ennemie.</p></div></article><article class="town-spell">${icon('heart', 28)}<div><h3>Souffle de vie</h3><p>4 mana · Restaure ${80 + state.castle * 20} PV à une troupe alliée.</p></div></article><p>Terminer un jour restaure 4 mana. La Source des murmures restaure toute votre réserve.</p>`;
  else if (townBuilding === 'forge')
    content = `<div class="town-crest">${icon('spark', 64)}</div><h3>Les chemins de l’évolution</h3><p>Les batailles donnent de l’expérience. Choisissez une troupe pour consulter et débloquer ses variantes.</p>${state.army.map((u) => unitCard(u.id)).join('')}<button class="button subtle full" data-action="codex">Consulter les huit formes</button>`;
  else
    content = `<div class="town-crest">${icon('flag', 64)}</div><h3>Le gardien de Sylve</h3><p>Jour ${state.day} · Semaine ${Math.ceil(state.day / 7)}. Votre héros commande ces troupes et ${state.movement}/${maxMovement(state)} déplacements lui restent aujourd’hui.</p>${state.army.map((u) => unitCard(u.id)).join('')}<div class="notice">${escape(state.log[0])}</div>`;
  if (!builtBuildings(state).includes(townBuilding)) {
    const reason = constructionStatus(state, townBuilding);
    content = `<div class="town-crest">${icon('castle', 64)}</div><h3>Terrain à bâtir</h3><p>${building.subtitle}. Ce bâtiment apparaîtra sur cette parcelle après sa construction.</p><div class="town-cost">${building.gold} or · ${building.crystals} cristaux</div><div class="notice">${reason ?? 'Votre chantier du jour est disponible.'}</div><button class="button gold full" data-action="build" data-id="${townBuilding}" ${!at || !home || reason ? 'disabled' : ''}>Construire ${building.name}</button>`;
  }
  document.querySelector('#town-detail')!.innerHTML =
    `<div class="town-detail-heading"><button class="icon-btn town-panel-close" data-action="town-close-panel" aria-label="Fermer le bâtiment">×</button><span class="eyebrow">${building.subtitle}</span><h2>${building.name}</h2></div><div class="town-detail-content">${!at ? '<div class="notice">Rejoignez un château allié sur la carte pour recruter.</div>' : ''}${content}</div>`;
  const townDetail = document.querySelector<HTMLElement>('#town-detail')!;
  townDetail.hidden = !townPanel;
  if (townDetail.dataset.building !== townBuilding) townDetail.scrollTop = 0;
  townDetail.dataset.building = townBuilding;
  document
    .querySelectorAll<HTMLElement>('.town-building-nav button, .town-marker')
    .forEach((b) => b.classList.toggle('selected', b.dataset.id === townBuilding));
  document.querySelector('#town-mobile-army')!.innerHTML =
    `<span class="eyebrow">VOTRE ARMÉE</span>${state.army.map((u) => unitCard(u.id)).join('')}<p class="fine-print">Touchez une troupe pour voir ses évolutions.</p>`;
  document.querySelector('#town-garrison')!.innerHTML =
    `<div class="town-day"><span>JOUR ${state.day}</span><b>+${income(state)} or / jour</b></div><div class="town-troops"><span>ARMÉE DU HÉROS</span>${state.army.map((u) => `<button data-action="creature" data-id="${u.id}" aria-label="${u.count} ${CREATURES[u.creature].name}">${portrait(CREATURES[u.creature])}<b>${u.count}</b></button>`).join('')}</div><button class="button gold" data-action="end-day" ${state.won ? 'disabled' : ''}>${icon('sun')} Jour suivant</button>`;
  town?.update(state.castle, builtBuildings(state));
  town?.select(townBuilding);
}
const help = `<div class="help-steps"><div><b>01</b><section><h3>Explorez votre royaume</h3><p>Touchez une case puis « Se déplacer ». Chaque pas consomme un déplacement. La brume se dissipe autour de votre héros. Glissez pour déplacer la carte. Le bouton cible recentre la vue sur votre héros.</p></section></div><div><b>02</b><section><h3>Préparez votre armée</h3><p>Capturez la mine et les cristaux pour gagner des revenus. Revenez à la citadelle pour recruter. Terminez le jour pour récupérer vos déplacements et 4 mana. L’équipe adverse joue ensuite automatiquement : surveillez ses héros, vos ressources et vos châteaux.</p></section></div><div><b>03</b><section><h3>Combattez et évoluez</h3><p>En combat, chaque troupe joue selon sa vitesse. Choisissez une case bleue puis confirmez « Déplacer ». Sélectionnez un ennemi à portée puis confirmez « Attaquer ». Pour un sort, choisissez sa cible et confirmez « Lancer le sort ». La vitesse fixe la distance de marche ; déplacement et attaque de mêlée peuvent se combiner. Les archers ont 12 tirs, tirent moins fort de loin et sont bloqués au contact. Une riposte est disponible par round. Attendre permet de rejouer en fin de round. Le héros peut lancer un sort par round sans terminer le tour de sa troupe.</p><p>Libérez les deux camps, faites évoluer vos créatures dans l’onglet Armée, puis triomphez de la Forteresse du Crépuscule.</p></section></div></div>`;
function renderModal() {
  const host = document.querySelector('#modal-root')!;
  if (!modal) {
    host.innerHTML = '';
    return;
  }
  let title = '',
    body = '',
    wide = false;
  if (modal === 'intro') {
    title = 'Une aventure à votre mesure';
    body = `<div class="intro-art">${portrait(CREATURES.sylve)}<span>✦</span>${portrait(CREATURES.sol)}</div><span class="eyebrow centered">BIENVENUE DANS LES ROYAUMES DE POMPON</span><h2 class="intro-title">Les plus petits héros<br/>font les grandes légendes.</h2><p class="intro-copy">Vos créatures prennent vie dans un royaume en 3D.<br/>Explorez, rassemblez votre armée et choisissez leurs évolutions.</p><div class="intro-features"><span>${icon('map')} Exploration</span><span>${icon('sword')} Tour par tour</span><span>${icon('spark')} Évolutions</span></div><button class="button gold full large" data-action="close">Entrer dans le royaume ${icon('arrow')}</button><p class="fine-print centered">Solo · Sans compte · Sauvegarde sur cet appareil</p>`;
  } else if (modal === 'army') {
    title = 'Votre compagnie';
    body = `<p class="modal-subtitle">Deux lignées, des chemins uniques. Touchez une troupe pour choisir son avenir.</p>${state.army.map((u) => unitCard(u.id)).join('')}<div class="notice">${icon('spark', 18)} Les victoires débloquent les évolutions. Votre armée se rétablit entre les combats ; les unités perdues doivent être recrutées.</div>`;
  } else if (modal === 'creature') {
    title = 'L’atelier des évolutions';
    body = creatureDetail();
    wide = true;
  } else if (modal === 'castle') {
    openTown();
    return;
    wide = true;
  } else if (modal === 'codex') {
    title = 'Le bestiaire de Pompon';
    wide = true;
    body = `<p class="modal-subtitle">Créatures inspirées de vos deux peluches : la barbe verte de Sylve et la houppe dorée de l’Aurore.</p><div class="codex-grid">${Object.values(
      CREATURES,
    )
      .map(
        (c) =>
          `<article class="codex-card" style="--creature-color:${c.color}">${portrait(c)}<span class="eyebrow">${c.family === 'sylve' ? 'SYLVE' : 'AURORE'} · NIVEAU ${c.tier}</span><h3>${c.name}</h3><p>${c.description}</p><small>${c.evolves.length ? `Évolue en ${c.evolves.map((x) => CREATURES[x].name).join(' ou ')}` : '✦ Forme ultime'}</small></article>`,
      )
      .join('')}</div>`;
  } else if (modal === 'help') {
    title = 'Votre premier voyage';
    body = help;
  } else if (modal === 'destinations') {
    title = 'Le carnet de voyage';
    const directionNames = ['Est', 'Ouest', 'Sud-est', 'Nord-ouest', 'Nord-est', 'Sud-ouest'];
    body = `<p class="modal-subtitle">Explorez les environs ou choisissez un lieu révélé pour préparer votre trajet.</p><div class="section-label"><span>EXPLORER AUTOUR DE MOI</span><span>${state.movement} pas disponibles</span></div><div class="direction-grid">${DIRECTIONS.map(
      (d, i) => {
        const next = { q: state.hero.q + d.q, r: state.hero.r + d.r },
          allowed =
            WALKABLE.some((t) => key(t) === key(next)) &&
            state.movement > 0 &&
            !state.battle &&
            !state.won;
        return `<button class="button subtle" data-action="step" data-q="${next.q}" data-r="${next.r}" ${allowed ? '' : 'disabled'}>${icon('foot', 15)} ${directionNames[i]}</button>`;
      },
    ).join('')}</div><div class="section-label"><span>LES LIEUX DU ROYAUME</span></div>${SITES.map(
      (site) => {
        const known = state.explored.includes(key(site)),
          path = pathTo(state.hero, site, WALKABLE);
        return `<button class="destination-row" data-action="destination" data-id="${site.id}" ${known && !state.battle ? '' : 'disabled'}><span class="destination-icon">${icon(site.kind === 'castle' ? 'castle' : site.difficulty ? 'sword' : site.kind === 'crystal' ? 'gem' : 'flag')}</span><span><strong>${known ? site.name : 'Lieu à découvrir'}</strong><small>${known ? (key(site) === key(state.hero) ? 'Vous êtes ici' : `${path.length} pas · ${state.cleared.includes(site.id) ? 'Libéré' : state.owned.includes(site.id) ? 'Sous votre bannière' : 'À explorer'}`) : 'Approchez pour révéler ce lieu'}</small></span>${icon('arrow', 16)}</button>`;
      },
    ).join('')}`;
  } else if (modal === 'tactical-moves') {
    title = 'Déplacements tactiques';
    body = movePicker(state);
  } else if (modal === 'audio') {
    title = 'Musique et bruitages';
    body = `<p>Musique du royaume, de la ville et des batailles.</p><label class="audio-setting">Musique<input type="range" min="0" max="100" value="${audio.musicVolume * 100}" data-audio="music" aria-label="Volume de la musique"></label><label class="audio-setting">Bruitages<input type="range" min="0" max="100" value="${audio.effectsVolume * 100}" data-audio="effects" aria-label="Volume des bruitages"></label><button class="button gold full" data-action="sound">${audio.muted ? 'Activer le son' : 'Couper le son'}</button>`;
  } else if (modal === 'settings') {
    title = 'Votre aventure, à garder';
    body = `<p class="modal-subtitle">La partie est enregistrée automatiquement dans ce navigateur après chaque action.</p><div class="save-summary">${icon('save', 30)}<div><strong>Jour ${state.day} · Citadelle niveau ${state.castle}</strong><p>${state.cleared.length} territoires libérés · ${state.army.reduce((n, u) => n + u.count, 0)} créatures</p></div></div><button class="button primary full" data-action="export">${icon('download')} Exporter la sauvegarde</button><button class="button subtle full" data-action="import">${icon('upload')} Importer une sauvegarde</button><button class="button subtle full" data-action="audio-settings">♫ Musique et bruitages</button><button class="button subtle full" data-action="help">${icon('help')} Comment jouer</button><button class="button danger full" data-action="restart">Recommencer l’aventure</button><p class="fine-print">L’export permet de transférer votre partie entre appareils. Une importation remplace la partie actuelle après validation du fichier.</p>`;
  } else if (modal === 'restart') {
    title = 'Un nouveau départ';
    body =
      '<p>Recommencer effacera la partie actuelle de ce navigateur. Vous pouvez d’abord exporter votre sauvegarde depuis les paramètres.</p><button class="button danger full" data-action="confirm-restart">Recommencer la partie</button><button class="button subtle full" data-action="settings">Revenir aux sauvegardes</button>';
  } else if (modal === 'retreat' && trainingBackup) {
    title = 'Quitter l’entraînement ?';
    body =
      '<p>Vous retrouvez votre campagne exactement où vous l’avez laissée, sans perdre de créatures ni de ressources.</p><button class="button gold full" data-action="confirm-retreat">Revenir à la campagne</button><button class="button subtle full" data-action="close">Continuer l’entraînement</button>';
  } else if (modal === 'retreat' && state.battle?.opponent?.armyBackup) {
    title = 'Abandonner la défense du château ?';
    body =
      '<p>La ville passe sous la bannière adverse. Votre héros et son armée, qui se trouvent ailleurs sur la carte, restent à leur position.</p><button class="button danger full" data-action="confirm-retreat">Abandonner le château</button><button class="button subtle full" data-action="close">Continuer la défense</button>';
  } else if (modal === 'retreat') {
    title = 'Battre en retraite ?';
    body =
      `<p>${state.battle?.opponent?.town ? 'Vous abandonnez ce château à l’adversaire. ' : ''}Votre héros se replie vers un château allié ou une case sûre si vous n’en possédez plus. Vous perdez 20 % des créatures survivantes et vos déplacements du jour.</p><button class="button danger full" data-action="confirm-retreat">Replier le héros</button><button class="button subtle full" data-action="close">Continuer le combat</button>`;
  } else if (modal === 'victory') {
    title = 'La vallée retrouve sa lumière';
    body = `<div class="victory-art">${icon('flag', 64)}</div><span class="eyebrow centered">CAMPAGNE TERMINÉE · JOUR ${state.day}</span><h2 class="intro-title">Un royaume de lumière.</h2><p class="intro-copy">Vos Pompons ont libéré Sylve du Crépuscule.<br/>${state.army.reduce((n, u) => n + u.count, 0)} héros rentrent chez eux, plus grands qu’au départ.</p><button class="button gold full" data-action="export">${icon('download')} Garder cette aventure</button><button class="button subtle full" data-action="restart">Commencer une nouvelle légende</button>`;
  }
  host.innerHTML = `<div class="modal-backdrop" data-action="backdrop"><section class="modal ${wide ? 'wide' : ''} ${modal === 'intro' ? 'intro-modal' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-btn" data-action="close" aria-label="Fermer">${icon('close')}</button></div><div class="modal-body">${body}</div></section></div>`;
}
function scheduleEnemy() {
  const shouldPlay = state.battle && !state.battle.result && activeUnit(state)?.side === 'enemy';
  if (!shouldPlay) {
    if (enemyTimer) clearTimeout(enemyTimer);
    enemyTimer = null;
    return;
  }
  if (!enemyTimer)
    enemyTimer = setTimeout(() => {
      enemyTimer = null;
      dispatch({ type: 'enemy' });
    }, 850);
}
function selectFighter(id: string) {
  if (!state.battle?.units.some((u) => u.id === id && u.hp > 0)) return;
  selectedFighter = id;
  selectedBattleHex = null;
  render();
}
function onPick(pick: Pick) {
  if (modal || resolving) return;
  if (state.battle) {
    if (state.battle.result) return;
    if (pick.unit) selectFighter(pick.unit);
    else if (pick.hex) {
      selectedBattleHex = pick.hex;
      selectedFighter = null;
      render();
    }
  } else if (pick.hex) {
    selected = pick.hex;
    render();
  }
}
function leaveTraining() {
  if (!trainingBackup) return;
  state = trainingBackup;
  trainingBackup = null;
  selected = state.hero;
  selectedFighter = null;
  selectedBattleHex = null;
  spell = null;
  modal = null;
  render();
}
root.addEventListener('click', (e) => {
  const button = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!button || button.hasAttribute('disabled')) return;
  const a = button.dataset.action;
  if (resolving && !['zoom-in', 'zoom-out', 'camera'].includes(a ?? '')) return;
  if (a === 'backdrop' && e.target !== button) return;
  if (a === 'castle') {
    openTown();
    return;
  }
  if (a === 'leave-town') {
    closeTown();
    return;
  }
  if (a === 'town-building') {
    townBuilding = button.dataset.id as BuildingId;
    townPanel = true;
    renderTown();
    return;
  }
  if (a === 'town-close-panel') {
    townPanel = false;
    renderTown();
    return;
  }
  if (a === 'town-zoom-in' || a === 'town-zoom-out') {
    town?.setZoom(a === 'town-zoom-in' ? 0.12 : -0.12);
    return;
  }
  if (a === 'town-camera') {
    town?.resetCamera();
    return;
  }
  if (a === 'zoom-in') {
    scene?.setZoom(0.15);
    return;
  }
  if (a === 'zoom-out') {
    scene?.setZoom(-0.15);
    return;
  }
  if (a === 'camera') {
    scene?.resetCamera();
    return;
  }
  if (a === 'close' || a === 'backdrop' || a === 'map') {
    modal = null;
    renderModal();
    return;
  }
  if (a === 'training') {
    if (state.battle) return;
    trainingBackup = state;
    const practice = newGame();
    practice.hero = { q: -1, r: -2 };
    practice.army[0].count = 12;
    practice.army[1].count = 9;
    state = reduce(practice, { type: 'fight', site: 'camp1' });
    selectedFighter = null;
    selectedBattleHex = null;
    spell = null;
    modal = null;
    render();
    return;
  }
  if (a === 'select-fighter') {
    selectFighter(button.dataset.id!);
    return;
  }
  if (a === 'select-cell') {
    selectedBattleHex = { q: Number(button.dataset.q), r: Number(button.dataset.r) };
    selectedFighter = null;
    modal = null;
    render();
    return;
  }
  if (a === 'confirm-move' || a === 'confirm-attack' || a === 'confirm-spell') {
    const c = battleControls(state, currentSelection());
    if (a === 'confirm-move' && c.move && selectedBattleHex)
      dispatch({ type: 'battle-move', to: selectedBattleHex });
    else if (a === 'confirm-attack' && c.attack && selectedFighter)
      dispatch({ type: 'attack', target: selectedFighter, from: c.approach ?? undefined });
    else if (a === 'confirm-spell' && c.cast && selectedFighter && spell)
      dispatch({ type: 'spell', spell, target: selectedFighter });
    return;
  }
  if (a === 'sound') {
    audio.toggle();
    render();
    return;
  }
  if (a === 'audio-settings') {
    modal = 'audio';
    renderModal();
    return;
  }
  if (a === 'wait') {
    dispatch({ type: 'wait' });
    return;
  }
  if (a === 'minimap') {
    selected = { q: Number(button.dataset.q), r: Number(button.dataset.r) };
    render();
    return;
  }
  if (a === 'step') {
    const next = { q: Number(button.dataset.q), r: Number(button.dataset.r) };
    selected = next;
    dispatch({ type: 'move', to: next });
    return;
  }
  if (a === 'destination') {
    const site = SITES.find((s) => s.id === button.dataset.id)!;
    selected = { q: site.q, r: site.r };
    modal = null;
    render();
    return;
  }
  if (a === 'travel' && selected) {
    dispatch({ type: 'move', to: selected });
    return;
  }
  if (a === 'end-day') {
    dispatch({ type: 'end-day' });
    toast(`Jour ${state.day} · +${income(state)} or`);
    return;
  }
  if (a === 'fight-hero') {
    dispatch({ type: 'fight-hero', hero: button.dataset.id! });
    return;
  }
  if (a === 'fight') {
    dispatch({ type: 'fight', site: button.dataset.id! });
    return;
  }
  if (a === 'recruit') {
    dispatch({ type: 'recruit', family: button.dataset.id as 'sylve' | 'sol' });
    return;
  }
  if (a === 'evolve') {
    dispatch({ type: 'evolve', id: button.dataset.id!, creature: button.dataset.creature! });
    toast('Votre troupe a évolué !');
    return;
  }
  if (a === 'build') {
    dispatch({ type: 'build', building: button.dataset.id as BuildingId });
    return;
  }
  if (a === 'upgrade') {
    dispatch({ type: 'upgrade' });
    return;
  }
  if (a === 'catapult') {
    dispatch({ type: 'catapult' });
    return;
  }
  if (a === 'defend') {
    dispatch({ type: 'defend' });
    return;
  }
  if (a === 'finish-battle') {
    if (trainingBackup) {
      leaveTraining();
      return;
    }
    dispatch({ type: 'finish-battle' });
    selected = state.hero;
    render();
    return;
  }
  if (a === 'bolt' || a === 'heal') {
    spell = spell === (a === 'bolt' ? 'bolt' : 'heal') ? null : a === 'bolt' ? 'bolt' : 'heal';
    render();
    return;
  }
  if (a === 'confirm-retreat') {
    if (trainingBackup) {
      leaveTraining();
      return;
    }
    modal = null;
    dispatch({ type: 'retreat' });
    selected = state.hero;
    render();
    return;
  }
  if (a === 'confirm-restart') {
    if (townOpen) {
      town?.dispose();
      town = null;
      townOpen = false;
      root.classList.remove('in-town');
      document.querySelector('#town-root')!.innerHTML = '';
    }
    trainingBackup = null;
    state = newGame();
    selected = state.hero;
    modal = null;
    spell = null;
    persist();
    render();
    return;
  }
  if (a === 'creature') {
    detail = button.dataset.id!;
    modal = 'creature';
    renderModal();
    return;
  }
  if (a === 'export') {
    const blob = new Blob([JSON.stringify(trainingBackup ?? state, null, 2)], {
        type: 'application/json',
      }),
      url = URL.createObjectURL(blob),
      link = document.createElement('a');
    link.href = url;
    link.download = `pompon-jour-${state.day}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Sauvegarde exportée.');
    return;
  }
  if (a === 'import') {
    document.querySelector<HTMLInputElement>('#import')!.click();
    return;
  }
  if (
    [
      'army',
      'castle',
      'codex',
      'settings',
      'help',
      'restart',
      'retreat',
      'destinations',
      'tactical-moves',
    ].includes(a ?? '')
  ) {
    modal = a!;
    renderModal();
    document.querySelector<HTMLElement>('.modal')?.focus();
  }
});
document.querySelector<HTMLInputElement>('#import')!.addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement,
    file = input.files?.[0];
  if (!file) return;
  if (file.size > 100000) {
    toast('Fichier trop volumineux.');
    input.value = '';
    return;
  }
  const loaded = loadGame(await file.text());
  if (!loaded) {
    toast('Cette sauvegarde est invalide ou incompatible.');
    input.value = '';
    return;
  }
  trainingBackup = null;
  selectedFighter = null;
  selectedBattleHex = null;
  state = loaded;
  selected = state.hero;
  modal = null;
  spell = null;
  persist();
  render();
  toast('Aventure restaurée.');
  input.value = '';
});
document.addEventListener('keydown', (e) => {
  if (resolving) return;
  if (e.key === 'Escape') {
    if (townOpen && !modal) {
      closeTown();
      return;
    }
    modal = null;
    spell = null;
    render();
  }
  if (e.key === 'Tab' && modal) {
    const buttons = [
      ...document.querySelectorAll<HTMLElement>(
        '.modal button:not([disabled]), .modal [tabindex="0"]',
      ),
    ];
    if (!buttons.length) return;
    const first = buttons[0],
      last = buttons[buttons.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === document.querySelector('.modal'))
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
// A dedicated retreat control remains available throughout a battle.
const retreat = document.createElement('button');
retreat.className = 'button subtle retreat';
retreat.dataset.action = 'retreat';
retreat.textContent = 'Retraite';
document.querySelector('.world')!.append(retreat);
const routes = document.createElement('button');
routes.className = 'icon-btn';
routes.dataset.action = 'destinations';
routes.setAttribute('aria-label', 'Ouvrir le carnet de voyage');
routes.innerHTML = icon('map');
document.querySelector('.map-tools')!.append(routes);
const tacticalGrid = document.createElement('button');
tacticalGrid.className = 'icon-btn battle-only';
tacticalGrid.dataset.action = 'tactical-moves';
tacticalGrid.setAttribute('aria-label', 'Grille de déplacement');
tacticalGrid.innerHTML = icon('map');
document.querySelector('.map-tools')!.append(tacticalGrid);
const chrome = document.createElement('div');
chrome.id = 'combat-chrome';
document.querySelector('.world')!.append(chrome);
const toolbar = document.createElement('section');
toolbar.id = 'combat-toolbar';
toolbar.className = 'combat-toolbar';
toolbar.setAttribute('aria-label', 'Commandes de bataille');
document.querySelector('.footer')!.before(toolbar);
const training = document.createElement('button');
training.className = 'button gold training-entry';
training.dataset.action = 'training';
training.innerHTML = `${icon('sword', 16)} Combat d’entraînement`;
document.querySelector('.world')!.append(training);
render();
persist();

root.addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  const kind = input.dataset.audio;
  if (kind === 'music' || kind === 'effects') audio.setVolume(kind, Number(input.value) / 100);
});
