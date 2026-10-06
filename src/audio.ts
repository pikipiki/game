export type MusicTrack = 'adventure' | 'town' | 'battle';
export type SoundEffect = 'click' | 'move' | 'attack' | 'spell' | 'catapult';
const files = import.meta.glob<string>('./assets/audio/*.{mp3,wav}', {
  eager: true,
  query: '?inline',
  import: 'default',
});
export class GameAudio {
  private music = document.createElement('audio');
  private unlocked = false;
  private track: MusicTrack = 'adventure';
  muted = false;
  musicVolume = 0.28;
  effectsVolume = 0.55;
  constructor() {
    try {
      const p = JSON.parse(localStorage.getItem('pompon-audio') ?? '{}');
      this.muted = p.muted === true;
      this.musicVolume = this.volume(p.music, 0.28);
      this.effectsVolume = this.volume(p.effects, 0.55);
    } catch {
      /* optional local preferences */
    }
    this.music.loop = true;
    this.music.preload = 'none';
    this.music.hidden = true;
    this.music.dataset.role = 'game-music';
    document.body.append(this.music);
    document.addEventListener('pointerdown', () => this.unlock(), { once: true });
    document.addEventListener('keydown', () => this.unlock(), { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.music.pause();
      else this.resume();
    });
  }
  private volume(n: unknown, fallback: number) {
    return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
  }
  unlock() {
    this.unlocked = true;
    this.resume();
  }
  setTrack(track: MusicTrack) {
    if (this.track !== track || !this.music.src) {
      this.track = track;
      this.music.src = files[`./assets/audio/${track}.mp3`];
      this.music.dataset.track = track;
      this.music.load();
    }
    this.resume();
  }
  private resume() {
    this.music.volume = this.musicVolume;
    this.music.muted = this.muted;
    if (this.unlocked && !this.muted && !document.hidden && this.music.paused)
      void this.music.play().catch(() => {
        /* retry on the next gesture */
      });
  }
  effect(name: SoundEffect) {
    if (!this.unlocked || this.muted || this.effectsVolume === 0) return;
    const sound = new Audio(files[`./assets/audio/${name}.wav`]);
    sound.volume = this.effectsVolume;
    void sound.play().catch(() => {});
  }
  toggle() {
    this.muted = !this.muted;
    this.save();
    this.resume();
  }
  setVolume(kind: 'music' | 'effects', value: number) {
    if (kind === 'music') this.musicVolume = this.volume(value, this.musicVolume);
    else this.effectsVolume = this.volume(value, this.effectsVolume);
    this.save();
    this.resume();
  }
  private save() {
    try {
      localStorage.setItem(
        'pompon-audio',
        JSON.stringify({ muted: this.muted, music: this.musicVolume, effects: this.effectsVolume }),
      );
    } catch {
      /* storage may be unavailable */
    }
  }
}
