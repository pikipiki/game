export type MusicTrack = 'adventure' | 'town' | 'battle';
export type SoundEffect = 'click' | 'move' | 'attack' | 'spell' | 'catapult';

const musicLoaders: Record<
  MusicTrack,
  () => Promise<{ default: string }>
> = {
  adventure: () => import('./assets/audio/adventure.mp3'),
  battle: () => import('./assets/audio/battle.mp3'),
  town: () => import('./assets/audio/town.mp3'),
};

const effectLoaders: Record<
  SoundEffect,
  () => Promise<{ default: string }>
> = {
  attack: () => import('./assets/audio/attack.wav'),
  catapult: () => import('./assets/audio/catapult.wav'),
  click: () => import('./assets/audio/click.wav'),
  move: () => import('./assets/audio/move.wav'),
  spell: () => import('./assets/audio/spell.wav'),
};

export class GameAudio {
  private readonly music = document.createElement('audio');
  private unlocked = false;
  private track: MusicTrack = 'adventure';
  private musicLoadGen = 0;
  private readonly musicSrcCache = new Map<MusicTrack, string>();
  private readonly effectSrcCache = new Map<SoundEffect, string>();
  muted = false;
  musicVolume = 0.28;
  effectsVolume = 0.55;
  constructor() {
    try {
      const prefs = JSON.parse(localStorage.getItem('pompon-audio') ?? '{}');
      this.muted = prefs.muted === true;
      this.musicVolume = this.volume(prefs.music, 0.28);
      this.effectsVolume = this.volume(prefs.effects, 0.55);
    } catch {
      /* optional local preferences */
    }
    this.music.loop = true;
    this.music.preload = 'none';
    this.music.hidden = true;
    this.music.dataset.role = 'game-music';
    document.body.append(this.music);
    document.addEventListener('pointerdown', () => this.unlock(), {
      once: true,
    });
    document.addEventListener('keydown', () => this.unlock(), { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.music.pause();
      else this.resume();
    });
  }
  private volume(raw: unknown, fallback: number) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return Math.max(0, Math.min(1, raw));
    }
    return fallback;
  }
  unlock() {
    this.unlocked = true;
    this.resume();
  }
  setTrack(track: MusicTrack) {
    if (this.track === track && this.music.src) {
      this.resume();
      return;
    }
    this.track = track;
    const cached = this.musicSrcCache.get(track);
    if (cached) {
      this.applyMusicSrc(track, cached);
      return;
    }
    const gen = ++this.musicLoadGen;
    void musicLoaders[track]().then((mod) => {
      if (gen !== this.musicLoadGen || this.track !== track) return;
      this.musicSrcCache.set(track, mod.default);
      this.applyMusicSrc(track, mod.default);
    });
  }
  private applyMusicSrc(track: MusicTrack, src: string) {
    this.music.src = src;
    this.music.dataset.track = track;
    this.music.load();
    this.resume();
  }
  private resume() {
    this.music.volume = this.musicVolume;
    this.music.muted = this.muted;
    if (this.unlocked && !this.muted && !document.hidden && this.music.paused)
      {void this.music.play().catch(() => {
        /* retry on the next gesture */
      });}
  }
  effect(name: SoundEffect) {
    if (!this.unlocked || this.muted || this.effectsVolume === 0) return;
    void this.playEffect(name);
  }
  private async playEffect(name: SoundEffect) {
    let src = this.effectSrcCache.get(name);
    if (!src) {
      const mod = await effectLoaders[name]();
      src = mod.default;
      this.effectSrcCache.set(name, src);
    }
    const sound = document.createElement('audio');
    sound.src = src;
    sound.volume = this.effectsVolume;
    void sound.play().catch(() => {});
  }
  toggle() {
    this.muted = !this.muted;
    this.save();
    this.resume();
  }
  setVolume(kind: 'music' | 'effects', value: number) {
    if (kind === 'music')
      {this.musicVolume = this.volume(value, this.musicVolume);}
    else this.effectsVolume = this.volume(value, this.effectsVolume);
    this.save();
    this.resume();
  }
  private save() {
    try {
      localStorage.setItem(
        'pompon-audio',
        JSON.stringify({
          muted: this.muted,
          music: this.musicVolume,
          effects: this.effectsVolume,
        }),
      );
    } catch {
      /* storage may be unavailable */
    }
  }
}
