interface Point { x: number; y: number }

type Gesture =
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'pinch'; factor: number }
  | { type: 'tap'; x: number; y: number };

/** A pinch consumes the entire contact sequence, including the last finger lifted. */
export class PointerGestures {
  private readonly points = new Map<number, Point>();
  private origin: Point | null = null;
  private last: Point | null = null;
  private distance = 0;
  private moved = false;
  private multitouch = false;

  down(id: number, point: Point) {
    this.points.set(id, point);
    if (this.points.size === 1) {
      this.origin = this.last = point;
      this.moved = false;
      this.multitouch = false;
    } else {
      this.multitouch = true;
      this.distance = this.separation();
    }
  }

  move(id: number, point: Point): Gesture | null {
    if (!this.points.has(id)) return null;
    this.points.set(id, point);
    if (this.points.size >= 2) {
      const distance = this.separation();
      const previous = this.distance;
      this.distance = distance;
      if (previous > 1 && distance > 1) {
        return { type: 'pinch', factor: distance / previous };
      }
      return null;
    }
    if (this.multitouch || !this.origin || !this.last) return null;
    this.moved ||=
      Math.hypot(point.x - this.origin.x, point.y - this.origin.y) > 8;
    if (!this.moved) return null;
    const result: Gesture = {
      type: 'pan',
      dx: point.x - this.last.x,
      dy: point.y - this.last.y,
    };
    this.last = point;
    return result;
  }

  up(id: number, point: Point, cancelled = false): Gesture | null {
    if (!this.points.has(id)) return null;
    const tap =
      !cancelled &&
      this.points.size === 1 &&
      !this.multitouch &&
      !this.moved &&
      this.origin &&
      Math.hypot(point.x - this.origin.x, point.y - this.origin.y) <= 8;
    this.points.delete(id);
    this.distance = this.separation();
    if (!this.points.size) this.reset();
    if (tap) {
      return { type: 'tap', ...point };
    }
    return null;
  }

  reset() {
    this.points.clear();
    this.origin = this.last = null;
    this.distance = 0;
    this.moved = this.multitouch = false;
  }

  get active() {
    return this.points.size > 0;
  }

  get pointerCount() {
    return this.points.size;
  }

  private separation() {
    const [pointA, pointB] = [...this.points.values()];
    if (pointA && pointB) {
      return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
    }
    return 0;
  }
}

export function bindSceneGestures(
  canvas: HTMLCanvasElement,
  callbacks: {
    pan: (dx: number, dy: number, shift: boolean) => void;
    zoom: (factor: number) => void;
    tap: (x: number, y: number) => void;
    hover?: (x: number, y: number) => void;
  },
) {
  const gestures = new PointerGestures();
  const captured = new Set<number>();
  let touchPinching = false;
  let touchPinchDistance = 0;

  const point = (event: PointerEvent) => ({
    x: event.clientX,
    y: event.clientY,
  });
  const releaseCapture = (pointerId: number) => {
    if (!captured.has(pointerId)) return;
    try {
      canvas.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    captured.delete(pointerId);
  };
  const touchSpan = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const a = touches[0]!;
    const b = touches[1]!;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || touchPinching) return;
    gestures.down(event.pointerId, point(event));
    if (gestures.pointerCount >= 2) {
      for (const pointerId of [...captured]) {
        releaseCapture(pointerId);
      }
      return;
    }
    if (event.pointerType === 'mouse') {
      try {
        canvas.setPointerCapture(event.pointerId);
        captured.add(event.pointerId);
      } catch {
        /* ignore */
      }
    }
  };
  const move = (event: PointerEvent) => {
    if (touchPinching) return;
    const action = gestures.move(event.pointerId, point(event));
    if (action?.type === 'pinch') callbacks.zoom(action.factor);
    if (action?.type === 'pan') {
      callbacks.pan(action.dx, action.dy, event.shiftKey);
    }
    if (!gestures.active) callbacks.hover?.(event.clientX, event.clientY);
  };
  const up = (event: PointerEvent) => {
    releaseCapture(event.pointerId);
    if (touchPinching) {
      gestures.up(event.pointerId, point(event), true);
      return;
    }
    const action = gestures.up(event.pointerId, point(event));
    if (action?.type === 'tap') callbacks.tap(action.x, action.y);
  };
  const cancel = (event: PointerEvent) => {
    releaseCapture(event.pointerId);
    gestures.up(event.pointerId, point(event), true);
  };
  const reset = () => {
    for (const pointerId of [...captured]) {
      releaseCapture(pointerId);
    }
    touchPinching = false;
    touchPinchDistance = 0;
    gestures.reset();
  };
  const wheel = (event: WheelEvent) => {
    event.preventDefault();
    const delta = Math.max(-100, Math.min(100, event.deltaY));
    callbacks.zoom(Math.exp(-delta * 0.001));
  };
  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length < 2) return;
    event.preventDefault();
    gestures.reset();
    for (const pointerId of [...captured]) {
      releaseCapture(pointerId);
    }
    touchPinching = true;
    touchPinchDistance = touchSpan(event.touches);
  };
  const onTouchMove = (event: TouchEvent) => {
    if (!touchPinching || event.touches.length < 2) return;
    event.preventDefault();
    const span = touchSpan(event.touches);
    if (touchPinchDistance > 1 && span > 1) {
      callbacks.zoom(span / touchPinchDistance);
    }
    touchPinchDistance = span;
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (event.touches.length < 2) {
      touchPinching = false;
      touchPinchDistance = 0;
      gestures.reset();
    }
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('lostpointercapture', cancel);
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('touchcancel', onTouchEnd);
  window.addEventListener('blur', reset);
  return {
    reset,
    dispose() {
      reset();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', cancel);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('blur', reset);
    },
  };
}
