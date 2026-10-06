import { describe, expect, it } from 'vitest';
import { h3Image, h3Texture } from '@/render/h3-assets';
import assets from '@/assets/h3/adventure.json';
describe('Textures locales du jeu', () => {
  it('embarque les fonds de combat et la texture des remparts sans CDN', () => {
    for (const name of [
      'tbcscas3-0.png',
      'battle-grass.png',
      'battle-mountain.png',
    ])
      {expect(h3Image(name)).toMatch(/^(data:image\/png;base64,|\/|\.\/|https?:)/);}
  });
  it('fournit les variantes de terrain utilisées par la carte continue', () => {
    for (const kind of ['grass', 'sand', 'water'] as const) {
      expect(assets[kind].frames.length).toBeGreaterThan(1);
      for (const frame of assets[kind].frames)
        {expect(h3Image(frame)).toMatch(/^(data:image\/png;base64,|\/|\.\/|https?:)/);}
    }
  });
  it('ne charge pas de panorama de ville ni sprite de bâtiment 3D', () => {
    expect(h3Image('town.png')).toBeUndefined();
    expect(h3Image('map-castle.png')).toBeUndefined();
  });
  it('signale une texture absente du bundle', () => {
    expect(() => h3Texture('introuvable.png')).toThrow(
      /Texture H3 introuvable/,
    );
  });
  it('met en cache les textures Three.js pour éviter les rechargements', () => {
    const first = h3Texture('battle-grass.png');
    const second = h3Texture('battle-grass.png');
    expect(first).toBe(second);
    expect(first.colorSpace).toBe('srgb');
  });
});
