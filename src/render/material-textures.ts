import * as THREE from 'three';
import atlasUrl from '../assets/material-atlas.png?inline';
import { h3Image } from './h3-assets';

export type MaterialKind = 'stone' | 'roof' | 'wood' | 'grass';
const image = new Image();
const nativeStone = new Image();
nativeStone.src = h3Image('tbcscas3-0.png');
const canvases: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; kind: MaterialKind }[] =
  [];
function paint(canvas: HTMLCanvasElement, kind: MaterialKind) {
  if (kind === 'stone' && nativeStone.complete && nativeStone.naturalWidth) {
    canvas
      .getContext('2d')!
      .drawImage(nativeStone, 170, 95, 12, 30, 0, 0, canvas.width, canvas.height);
    return;
  }
  const index = ['stone', 'roof', 'wood', 'grass'].indexOf(kind);
  const size = image.naturalWidth / 2;
  canvas
    .getContext('2d')!
    .drawImage(
      image,
      (index % 2) * size,
      Math.floor(index / 2) * size,
      size,
      size,
      0,
      0,
      canvas.width,
      canvas.height,
    );
}
image.onload = () =>
  canvases.forEach(({ canvas, texture, kind }) => {
    paint(canvas, kind);
    texture.needsUpdate = true;
  });
image.src = atlasUrl;
nativeStone.onload = () =>
  canvases
    .filter((c) => c.kind === 'stone')
    .forEach(({ canvas, texture, kind }) => {
      paint(canvas, kind);
      texture.needsUpdate = true;
    });
/** Original high detail materials for the fully volumetric town, separate from H3 artwork. */
export function materialTexture(kind: MaterialKind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = { stone: '#c3b590', roof: '#395867', wood: '#674323', grass: '#5b7240' }[kind];
  ctx.fillRect(0, 0, 512, 512);
  if (image.complete && image.naturalWidth) paint(canvas, kind);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'grass' ? 24 : 2, kind === 'grass' ? 24 : 2);
  canvases.push({ canvas, texture, kind });
  return texture;
}
export function releaseMaterialTexture(texture: THREE.CanvasTexture) {
  const index = canvases.findIndex((c) => c.texture === texture);
  if (index >= 0) canvases.splice(index, 1);
  texture.dispose();
}
