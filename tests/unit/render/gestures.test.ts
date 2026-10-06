import { afterEach, describe, expect, it, vi } from 'vitest';
import { PointerGestures, bindSceneGestures } from '@/render/gestures';

describe('Gestes des scènes 3D', () => {
  it(
    'agrandit et réduit selon l’écartement réel de deux doigts',
    () => {
    const gestures = new PointerGestures();
    gestures.down(1, { x: 100, y: 100 });
    gestures.down(2, { x: 200, y: 100 });
    expect(gestures.move(2, { x: 300, y: 100 })).toEqual({
      type: 'pinch',
      factor: 2,
    });
    expect(gestures.move(2, { x: 150, y: 100 })).toEqual({
      type: 'pinch',
      factor: 0.25,
    });
  });
  it(
    'ne sélectionne jamais une case ou un bâtiment après un pincement',
    () => {
    const gestures = new PointerGestures();
    gestures.down(1, { x: 0, y: 0 });
    gestures.down(2, { x: 100, y: 0 });
    gestures.move(2, { x: 120, y: 0 });
    expect(gestures.up(2, { x: 120, y: 0 })).toBeNull();
    expect(gestures.move(1, { x: 60, y: 0 })).toBeNull();
    expect(gestures.up(1, { x: 60, y: 0 })).toBeNull();
    gestures.down(3, { x: 40, y: 40 });
    expect(gestures.up(3, { x: 40, y: 40 })).toEqual({
      type: 'tap',
      x: 40,
      y: 40,
    });
  });
  it(
    'conserve le clic simple et distingue le glissement',
    () => {
    const gestures = new PointerGestures();
    gestures.down(1, { x: 10, y: 20 });
    expect(gestures.move(1, { x: 12, y: 22 })).toBeNull();
    expect(gestures.up(1, { x: 12, y: 22 })).toEqual({
      type: 'tap',
      x: 12,
      y: 22,
    });
    gestures.down(1, { x: 10, y: 20 });
    expect(gestures.move(1, { x: 25, y: 30 })).toEqual({
      type: 'pan',
      dx: 15,
      dy: 10,
    });
    expect(gestures.move(1, { x: 27, y: 33 })).toEqual({
      type: 'pan',
      dx: 2,
      dy: 3,
    });
    expect(gestures.up(1, { x: 27, y: 33 })).toBeNull();
  });
  it(
    'annule les contacts lors d’une rotation ou d’une perte de capture',
    () => {
    const gestures = new PointerGestures();
    gestures.down(1, { x: 0, y: 0 });
    gestures.down(2, { x: 100, y: 0 });
    expect(gestures.up(2, { x: 100, y: 0 }, true)).toBeNull();
    expect(gestures.up(1, { x: 0, y: 0 })).toBeNull();
    gestures.down(1, { x: 0, y: 0 });
    gestures.reset();
    expect(gestures.up(1, { x: 0, y: 0 })).toBeNull();
    expect(gestures.active).toBe(false);
  });
  it(
    'supporte un troisième doigt et un contact de distance nulle',
    () => {
    const gestures = new PointerGestures();
    gestures.down(1, { x: 0, y: 0 });
    gestures.down(2, { x: 0, y: 0 });
    expect(gestures.move(2, { x: 100, y: 0 })).toBeNull();
    gestures.down(3, { x: 200, y: 0 });
    gestures.up(1, { x: 0, y: 0 });
    expect(gestures.move(3, { x: 300, y: 0 })).toEqual({
      type: 'pinch',
      factor: 2,
    });
    expect(gestures.up(2, { x: 100, y: 0 })).toBeNull();
    expect(gestures.up(3, { x: 300, y: 0 })).toBeNull();
  });
});

describe('Contacts réels reliés aux commandes de caméra', () => {
  afterEach(() => vi.unstubAllGlobals());
  function surface() {
    vi.stubGlobal('window', new EventTarget());
    const canvas = Object.assign(new EventTarget(), {
      setPointerCapture: vi.fn(),
    });
    const actions = { zoom: vi.fn(), pan: vi.fn(), tap: vi.fn() };
    const input = bindSceneGestures(
      canvas as unknown as HTMLCanvasElement,
      actions,
    );
    const contact = (
      type: string,
      id: number,
      clientX: number,
      clientY = 0,
    ) => {
      canvas.dispatchEvent(
        Object.assign(new Event(type), {
          pointerId: id,
          clientX,
          clientY,
          button: 0,
          shiftKey: false,
        }),
      );
    };
    return { canvas, actions, input, contact };
  }
  it(
    'transmet le zoom aux scènes sans déplacer la caméra ni sélectionner',
    () => {
    const { contact, actions, input } = surface();
    contact('pointerdown', 1, 0);
    contact('pointerdown', 2, 100);
    contact('pointermove', 2, 150);
    contact('pointerup', 2, 150);
    contact('pointerup', 1, 0);
    expect(actions.zoom).toHaveBeenCalledWith(1.5);
    expect(actions.pan).not.toHaveBeenCalled();
    expect(actions.tap).not.toHaveBeenCalled();
    contact('pointerdown', 3, 20, 30);
    contact('pointerup', 3, 20, 30);
    expect(actions.tap).toHaveBeenCalledWith(20, 30);
    input.dispose();
  });
  it(
    'arrête les contacts en cours au redimensionnement et enlève les listeners',
    () => {
    const { contact, actions, input } = surface();
    contact('pointerdown', 1, 0);
    input.reset();
    contact('pointerup', 1, 0);
    expect(actions.tap).not.toHaveBeenCalled();
    contact('pointerdown', 1, 0);
    contact('lostpointercapture', 1, 0);
    contact('pointerup', 1, 0);
    expect(actions.tap).not.toHaveBeenCalled();
    input.dispose();
    contact('pointerdown', 1, 0);
    contact('pointerdown', 2, 100);
    contact('pointermove', 2, 200);
    expect(actions.zoom).not.toHaveBeenCalled();
  });
  it(
    'ignore le clic droit et transmet le déplacement avec Maj',
    () => {
    const { canvas, actions, input } = surface();
    canvas.dispatchEvent(
      Object.assign(new PointerEvent('pointerdown'), {
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        button: 2,
        shiftKey: false,
      }),
    );
    canvas.dispatchEvent(
      Object.assign(new PointerEvent('pointerdown'), {
        pointerId: 2,
        clientX: 0,
        clientY: 0,
        button: 0,
        shiftKey: false,
      }),
    );
    canvas.dispatchEvent(
      Object.assign(new PointerEvent('pointermove'), {
        pointerId: 2,
        clientX: 20,
        clientY: 0,
        button: 0,
        shiftKey: true,
      }),
    );
    expect(actions.pan).toHaveBeenCalledWith(20, 0, true);
    input.dispose();
  });
  it(
    'zoome à la molette et signale le survol sans contact actif',
    () => {
    const { canvas, actions, input } = surface();
    const hover = vi.fn();
    const bound = bindSceneGestures(canvas as unknown as HTMLCanvasElement, {
      ...actions,
      hover,
    });
    canvas.dispatchEvent(
      Object.assign(
        new WheelEvent('wheel', { deltaY: 120, cancelable: true }),
        {},
      ),
    );
    expect(actions.zoom).toHaveBeenCalled();
    canvas.dispatchEvent(
      Object.assign(new PointerEvent('pointermove'), {
        pointerId: 9,
        clientX: 44,
        clientY: 55,
        button: 0,
        shiftKey: false,
      }),
    );
    expect(hover).toHaveBeenCalledWith(44, 55);
    bound.dispose();
    input.dispose();
  });
});
