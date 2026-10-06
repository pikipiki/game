import type { Site } from '../types/world';
export const SITES: Site[] = [
  {
    id: 'home',
    q: -3,
    r: 2,
    kind: 'castle',
    name: 'Citadelle de Pompon',
    description:
      'Le cœur de votre royaume. Recrutez, bâtissez ' +
      'et préparez vos prochaines aventures.',
    difficulty: 0,
  },
  {
    id: 'gold',
    q: -2,
    r: 0,
    kind: 'gold',
    name: 'Mine de miel doré',
    description: 'Capturez la mine : +150 or chaque jour.',
    difficulty: 0,
  },
  {
    id: 'crystal',
    q: 0,
    r: 2,
    kind: 'crystal',
    name: 'Jardin de cristaux',
    description: 'Capturez le jardin : +3 cristaux chaque jour.',
    difficulty: 0,
  },
  {
    id: 'spring',
    q: 1,
    r: 0,
    kind: 'shrine',
    name: 'Source des murmures',
    description:
      'Une source enchantée restaure votre mana et soigne toute votre armée.',
    difficulty: 0,
  },
  {
    id: 'camp1',
    q: -1,
    r: -2,
    kind: 'camp',
    name: 'Clairière oubliée',
    description:
      'Des créatures égarées gardent un trésor. ' +
      'Victoire : 450 or, 6 cristaux, +55 expérience.',
    difficulty: 1,
  },
  {
    id: 'camp2',
    q: 2,
    r: 1,
    kind: 'camp',
    name: 'Vestiges de l’aurore',
    description:
      'Une troupe aguerrie défend ces ruines. ' +
      'Victoire : 700 or, 10 cristaux, +75 expérience.',
    difficulty: 2,
  },
  {
    id: 'shade-castle',
    q: -2,
    r: -1,
    kind: 'castle',
    difficulty: 1,
    name: 'Château des Brumes',
    description:
      'Une garnison ennemie garde ses remparts. ' +
      'Assiégez le château pour le conquérir : +150 or par jour ' +
      'et recrutement sur place.',
  },
  {
    id: 'dawn-castle',
    q: 3,
    r: 0,
    kind: 'castle',
    difficulty: 2,
    name: 'Château de l’Aurore',
    description:
      'Les tours du Crépuscule dominent la vallée. ' +
      'Conquérez ce château fortifié : +150 or par jour ' +
      'et recrutement sur place.',
  },
  {
    id: 'army1',
    q: -2,
    r: 3,
    kind: 'army',
    difficulty: 1,
    name: 'La bande des Ronces',
    description:
      'Une armée ennemie barre le chemin. ' +
      'Rejoignez sa case pour engager le combat : ' +
      '450 or, 6 cristaux et 55 XP.',
  },
  {
    id: 'army2',
    q: 1,
    r: -2,
    kind: 'army',
    difficulty: 2,
    name: 'La garde du Crépuscule',
    description:
      'Des créatures évoluées occupent le passage. ' +
      'Défaites cette armée : 700 or, 10 cristaux et 75 XP.',
  },
  {
    id: 'boss',
    q: 3,
    r: -2,
    kind: 'fortress',
    name: 'Forteresse du Crépuscule',
    description:
      'Battez le Seigneur du Crépuscule après les deux camps ' +
      'pour rendre sa lumière au royaume.',
    difficulty: 3,
  },
];
