import * as THREE from 'three';
import { getCreature } from '../../game/data';
import { ball, cylinder } from './mesh-primitives';

// eslint-disable-next-line sonarjs/cognitive-complexity -- creature mesh assembly
export function creatureModel(id: string): THREE.Group {
  const creature = getCreature(id);
  const group = new THREE.Group();
  ball(group, [0.57, 0.72, 0.42], [0, 0.79, 0], creature.color);
  ball(group, [0.47, 0.36, 0.4], [0, 0.47, 0.035], creature.color);
  for (const side of [-1, 1]) {
    ball(group, [0.25, 0.12, 0.28], [side * 0.34, 0.14, 0.16], creature.color);
    const arm = ball(
      group,
      [0.34, 0.12, 0.13],
      [side * 0.65, 0.67, 0],
      creature.color,
    );
    arm.rotation.z = side * -0.2;
    for (let index = 0; index < 3; index++) {
      ball(
        group,
        [0.08, 0.13, 0.09],
        [side * (0.84 - index * 0.065), 0.6, 0.08 + index * 0.07],
        creature.color,
      );
    }
    ball(group, [0.14, 0.18, 0.06], [side * 0.2, 1.13, 0.355], '#fff8e7');
    ball(group, [0.08, 0.105, 0.035], [side * 0.18, 1.1, 0.413], '#24203b');
    ball(
      group,
      [0.025, 0.031, 0.015],
      [side * 0.18 - 0.02, 1.14, 0.449],
      '#ffffff',
    );
  }
  const nose = ball(
    group,
    [0.19, 0.3, 0.22],
    [0, 0.83, 0.49],
    (function ternaryValue() {
      if (creature.family === 'sylve') {
        return '#9c75d0';
      }
      return '#df8cd2';
    })(),
  );
  nose.rotation.x = -0.3;
  if (creature.family === 'sylve') {
    for (let index = 0; index < 9; index++) {
      const hair = cylinder(
        group,
        0,
        0.055,
        0.35 + (index % 3) * 0.06,
        [(index - 4) * 0.047, 0.42, 0.36],
        creature.accent,
        5,
      );
      hair.rotation.z = (index - 4) * 0.05;
    }
    if (creature.tier >= 2) {
      for (const side of [-1, 1]) {
        const leaf = ball(
          group,
          [0.27, 0.07, 0.18],
          [side * 0.49, 0.95, 0.015],
          creature.accent,
        );
        leaf.rotation.z = side * 0.3;
        if (creature.tier === 3) {
          const horn = cylinder(
            group,
            0.035,
            0.07,
            0.5,
            [side * 0.3, 1.57, 0],
            '#e0cca2',
          );
          horn.rotation.z = side * -0.45;
          cylinder(group, 0, 0.04, 0.28, [side * 0.43, 1.69, 0.02], '#e0cca2');
        }
      }
    }
  } else {
    for (let index = 0; index < 7; index++) {
      const hair = cylinder(
        group,
        0,
        0.07,
        0.4 + (index % 3) * 0.11,
        [(index - 3) * 0.054, 1.57, 0],
        creature.accent,
        5,
      );
      hair.rotation.z = (index - 3) * -0.13;
    }
    if (creature.tier >= 2) {
      for (const side of [-1, 1]) {
        const wing = ball(
          group,
          [0.33, 0.08, 0.28],
          [side * 0.5, 0.99, -0.12],
          creature.accent,
        );
        wing.rotation.z = side * 0.6;
      }
    }
    if (creature.tier === 3) {
      for (const side of [-1, 1]) {
        const wing = ball(
          group,
          [0.48, 0.09, 0.4],
          [side * 0.7, 1.05, -0.19],
          creature.accent,
        );
        wing.rotation.z = side * 0.7;
      }
    }
  }
  if (creature.tier > 1) {
    cylinder(
      group,
      0.61,
      0.61,
      0.06,
      [0, 0.47, 0],
      (function ternaryValue() {
        if (creature.family === 'sylve') {
          return '#c9ab74';
        }
        return '#e9c27f';
      })(),
      16,
    );
  }
  group.userData.creature = true;
  return group;
}
