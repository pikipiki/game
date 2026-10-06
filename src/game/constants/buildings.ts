import type { BuildingBlueprint, BuildingId } from '../types/buildings';

export const BUILDINGS: BuildingBlueprint[] = [
  {
    id: 'keep',
    name: 'Château des biscuits',
    subtitle: 'Remparts de caramel',
    gold: 0,
    crystals: 0,
    requires: [],
  },
  {
    id: 'hall',
    name: 'Maison du grand donut',
    subtitle: 'Construction & revenus',
    gold: 0,
    crystals: 0,
    requires: ['keep'],
  },
  {
    id: 'sylve',
    name: 'Cabane de Barbe-Mousse',
    subtitle: 'Gardiens de la forêt sucrée',
    gold: 0,
    crystals: 0,
    requires: ['hall'],
  },
  {
    id: 'sol',
    name: 'Pâtisserie de l’Aurore',
    subtitle: 'Pompons & pains au chocolat',
    gold: 450,
    crystals: 2,
    requires: ['sylve'],
  },
  {
    id: 'guild',
    name: 'Tour des macarons',
    subtitle: 'Guilde des mages',
    gold: 600,
    crystals: 3,
    requires: ['sol'],
  },
  {
    id: 'tavern',
    name: 'Auberge des friandises',
    subtitle: 'Héros & troupes',
    gold: 0,
    crystals: 0,
    requires: ['hall'],
  },
  {
    id: 'forge',
    name: 'Atelier du sucre étoilé',
    subtitle: 'Évolutions & tour des astres',
    gold: 750,
    crystals: 4,
    requires: ['guild'],
  },
];

export const INITIAL_BUILDINGS: BuildingId[] = [
  'keep',
  'hall',
  'sylve',
  'tavern',
];
