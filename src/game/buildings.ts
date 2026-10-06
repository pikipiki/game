export type BuildingId = 'keep' | 'hall' | 'sylve' | 'sol' | 'guild' | 'tavern' | 'forge';
export const BUILDINGS: {
  id: BuildingId;
  name: string;
  subtitle: string;
  gold: number;
  crystals: number;
  requires: BuildingId[];
}[] = [
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
export const INITIAL_BUILDINGS: BuildingId[] = ['keep', 'hall', 'sylve', 'tavern'];
/** Missing fields denote older saves, whose existing buildings are preserved. */
export const builtBuildings = (s: { built?: BuildingId[] }) =>
  s.built ?? BUILDINGS.map((b) => b.id);
export function constructionStatus(
  s: { built?: BuildingId[]; buildDay?: number; day: number; gold: number; crystals: number },
  id: BuildingId,
): string | null {
  const b = BUILDINGS.find((b) => b.id === id);
  if (!b) return 'Bâtiment inconnu';
  const built = builtBuildings(s);
  if (built.includes(id)) return 'Déjà construit';
  const missing = b.requires.filter((id) => !built.includes(id));
  if (missing.length)
    return `Requis : ${missing.map((id) => BUILDINGS.find((b) => b.id === id)!.name).join(', ')}`;
  if (s.buildDay === s.day) return 'Un bâtiment a déjà été construit aujourd’hui';
  if (s.gold < b.gold || s.crystals < b.crystals) return 'Ressources insuffisantes';
  return null;
}
