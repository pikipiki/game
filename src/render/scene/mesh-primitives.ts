import * as THREE from 'three';

export const material = (color: string, roughness = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });

export function ball(
  parent: THREE.Group,
  size: [number, number, number],
  pos: [number, number, number],
  color: string,
) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    material(color),
  );
  mesh.scale.set(...size);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function cylinder(
  parent: THREE.Group,
  top: number,
  bottom: number,
  height: number,
  pos: [number, number, number],
  color: string,
  sides = 8,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(top, bottom, height, sides),
    material(color),
  );
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function box(
  parent: THREE.Group,
  size: [number, number, number],
  pos: [number, number, number],
  color: string,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
