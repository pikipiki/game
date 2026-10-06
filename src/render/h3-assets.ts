import * as THREE from 'three';

const images = import.meta.glob<string>('../assets/h3/*.png', {
  eager: true,
  query: '?inline',
  import: 'default',
});
export const h3Image = (name: string) => images[`../assets/h3/${name}`];
const textures = new Map<string, THREE.Texture>();
/** Shared textures survive scene rebuilds; URLs are embedded in the offline HTML. */
export function h3Texture(name: string): THREE.Texture {
  if (!textures.has(name)) {
    const t = new THREE.TextureLoader().load(h3Image(name));
    t.colorSpace = THREE.SRGBColorSpace;
    textures.set(name, t);
  }
  return textures.get(name)!;
}
