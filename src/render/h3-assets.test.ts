import { describe, expect, it } from 'vitest';
import { h3Image } from './h3-assets';
import assets from '../assets/h3/adventure.json';
describe('Textures locales du jeu', () => {
  it('embarque les fonds de combat et la texture des remparts sans CDN', () => {
    for (const name of ['tbcscas3-0.png', 'battle-grass.png', 'battle-mountain.png'])
      expect(h3Image(name)).toMatch(/^data:image\/png;base64,/);
  });
  it('fournit toutes les variantes de terrain utilisées par la carte continue', () => {
    for (const kind of ['grass', 'sand', 'water'] as const) {
      expect(assets[kind].frames.length).toBeGreaterThan(1);
      for (const f of assets[kind].frames) expect(h3Image(f)).toMatch(/^data:image\/png;base64,/);
    }
  });
  it('ne charge aucun panorama de ville ni sprite de bâtiment comme modèle 3D', () => {
    expect(h3Image('town.png')).toBeUndefined();
    expect(h3Image('map-castle.png')).toBeUndefined();
  });
});
