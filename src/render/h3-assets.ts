import * as THREE from 'three';

const images = import.meta.glob<string>('../assets/h3/*.png', {
  eager: true,
  import: 'default',
});
export function h3Image(name: string): string | undefined {
  return images[`../assets/h3/${name}`];
}
const textures = new Map<string, THREE.Texture>();
/** Shared textures survive scene rebuilds; URLs come from the Vite asset pipeline. */
export function h3Texture(name: string): THREE.Texture {
  if (!textures.has(name)) {
    const url = h3Image(name);
    if (!url) {
      throw new Error(`Texture H3 introuvable : ${name}`);
    }
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.set(name, texture);
  }
  return textures.get(name)!;
}
