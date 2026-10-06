import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameAudio } from '@/audio';

const memory = new Map<string, string>();

describe('Audio du jeu', () => {
  beforeEach(() => {
    memory.clear();
    vi.stubGlobal('localStorage', {
      getItem: (storageKey: string) => memory.get(storageKey) ?? null,
      setItem: (storageKey: string, value: string) =>
        memory.set(storageKey, value),
      clear: () => memory.clear(),
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });
  afterEach(() => {
    document
      .querySelectorAll('[data-role="game-music"]')
      .forEach((node) => node.remove());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('restaure les préférences et bascule le mode silencieux', () => {
    localStorage.setItem(
      'pompon-audio',
      JSON.stringify({ muted: true, music: 0.5, effects: 0.2 }),
    );
    const audio = new GameAudio();
    expect(audio.muted).toBe(true);
    expect(audio.musicVolume).toBe(0.5);
    expect(audio.effectsVolume).toBe(0.2);
    audio.toggle();
    expect(audio.muted).toBe(false);
    expect(JSON.parse(localStorage.getItem('pompon-audio')!).muted).toBe(false);
  });

  it('déverrouille la lecture après un geste et change de piste', () => {
    const audio = new GameAudio();
    audio.effect('click');
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    audio.unlock();
    audio.setTrack('battle');
    audio.setTrack('town');
    audio.setVolume('music', 0.4);
    audio.setVolume('effects', 1.2);
    audio.effect('attack');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(audio.muted).toBe(false);
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it('ignore les effets silencieux et les erreurs de lecture', () => {
    const audio = new GameAudio();
    document.dispatchEvent(new PointerEvent('pointerdown'));
    document.dispatchEvent(new KeyboardEvent('keydown'));
    audio.effectsVolume = 0;
    audio.effect('spell');
    audio.effectsVolume = 0.5;
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValueOnce(
      new Error('blocked'),
    );
    audio.unlock();
    audio.setTrack('adventure');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('ignore les préférences corrompues et les écritures impossibles', () => {
    localStorage.setItem('pompon-audio', '{');
    const audio = new GameAudio();
    expect(audio.musicVolume).toBeGreaterThan(0);
    const set = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota');
      });
    audio.toggle();
    set.mockRestore();
    const again = new GameAudio();
    again.toggle();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    again.toggle();
  });
});
