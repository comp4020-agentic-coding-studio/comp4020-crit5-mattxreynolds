export type Sound = "select" | "roll" | "blocked" | "sand" | "hole" | "fall" | "fail" | "restart" | "finish";

interface AudioSettings {
  music: boolean;
  effects: boolean;
}

const SETTINGS_KEY = "card-golf-audio";
// An original D-major/add9 progression. The roomy chords, sparse piano-like
// notes and quiet pulse borrow the soundtrack's broad ambient/downtempo
// vocabulary without borrowing any of its melodies.
const MUSIC_CHORDS = [
  [146.83, 220, 329.63, 369.99],
  [123.47, 185, 220, 293.66],
  [98, 146.83, 185, 220],
  [110, 164.81, 246.94, 293.66],
];
const MUSIC_PATTERN = [2, -1, 3, 1, -1, 2, 1, 3];

/** Small procedural soundtrack: no download, no licensing surface, and the
 * browser's user-gesture rule remains in charge of when audio may begin. */
export class GameAudio {
  private context: AudioContext | null = null;
  private resumePromise: Promise<void> | null = null;
  private settings: AudioSettings = this.readSettings();
  private musicTimer: number | null = null;
  private musicStep = 0;

  get music(): boolean { return this.settings.music; }
  get effects(): boolean { return this.settings.effects; }

  async unlock(): Promise<void> {
    await this.ensureRunning();
    if (this.settings.music) this.startMusic();
  }

  toggle(kind: "music" | "effects"): boolean {
    this.settings[kind] = !this.settings[kind];
    this.saveSettings();
    if (kind === "music") {
      if (this.settings.music) this.startMusic();
      else this.stopMusic();
    }
    return this.settings[kind];
  }

  play(sound: Sound): void {
    if (!this.settings.effects) return;
    void this.ensureRunning().then(() => this.playNow(sound));
  }

  private playNow(sound: Sound): void {
    if (!this.settings.effects || !this.context || this.context.state !== "running") return;
    const now = this.context.currentTime;
    switch (sound) {
      case "select": this.tone(520, 0.07, now, 0.42); break;
      case "roll":
        this.tone(220, 0.09, now, 0.33, "triangle");
        this.tone(277, 0.08, now + 0.07, 0.27, "triangle");
        break;
      case "blocked": this.tone(130, 0.16, now, 0.42, "square", 92); break;
      case "sand": this.tone(185, 0.2, now, 0.33, "triangle", 115); break;
      case "fall": this.tone(260, 0.38, now, 0.39, "sine", 75); break;
      case "fail":
        this.tone(293.66, 0.24, now, 0.36, "triangle", 220);
        this.tone(220, 0.34, now + 0.18, 0.36, "triangle", 110);
        break;
      case "restart": this.tone(330, 0.1, now, 0.33, "triangle", 440); break;
      case "hole":
        [392, 523.25, 659.25].forEach((note, i) => this.tone(note, 0.2, now + i * 0.09, 0.36));
        break;
      case "finish":
        [261.63, 329.63, 392, 523.25].forEach((note, i) => this.tone(note, 0.42, now + i * 0.11, 0.33));
        break;
    }
  }

  private audioContext(): AudioContext {
    const AudioContextClass = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is not supported by this browser");
    this.context ??= new AudioContextClass();
    return this.context;
  }

  private ensureRunning(): Promise<void> {
    let context: AudioContext;
    try {
      context = this.audioContext();
    } catch {
      return Promise.resolve();
    }
    if (context.state === "running") return Promise.resolve();
    this.resumePromise ??= context
      .resume()
      .catch(() => undefined)
      .finally(() => { this.resumePromise = null; });
    return this.resumePromise;
  }

  private startMusic(): void {
    if (!this.settings.music || this.musicTimer !== null || !this.context) return;
    const playNext = (): void => {
      if (!this.context || this.context.state !== "running") return;
      const step = this.musicStep % 32;
      const chord = MUSIC_CHORDS[Math.floor(step / 8)];
      const within = step % 8;
      const now = this.context.currentTime;

      // Each two-and-a-half-second phrase breathes under the shorter notes.
      if (within === 0) {
        chord.forEach((note, i) => this.pad(note, 2.35, now, i === 0 ? 0.09 : 0.052));
        this.tone(76, 0.16, now, 0.22, "sine", 46);
      } else if (within === 4) {
        this.tone(68, 0.11, now, 0.12, "sine", 48);
      }

      const voice = MUSIC_PATTERN[within];
      if (voice >= 0) this.pluck(chord[voice], now, within === 3 || within === 7 ? 0.16 : 0.13);
      this.musicStep += 1;
    };
    playNext();
    this.musicTimer = window.setInterval(playNext, 305);
  }

  private stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private tone(
    frequency: number,
    duration: number,
    at: number,
    volume: number,
    wave: OscillatorType = "sine",
    endFrequency = frequency,
  ): void {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }

  private pluck(frequency: number, at: number, volume: number): void {
    this.tone(frequency, 0.42, at, volume, "sine", frequency * 0.997);
    this.tone(frequency * 2, 0.18, at, volume * 0.24, "sine", frequency * 1.99);
  }

  private pad(frequency: number, duration: number, at: number, volume: number): void {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.detune.setValueAtTime(-4, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.28);
    gain.gain.setValueAtTime(volume, at + duration * 0.58);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }

  private readSettings(): AudioSettings {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as Partial<AudioSettings> | null;
      return { music: saved?.music ?? false, effects: saved?.effects ?? true };
    } catch {
      return { music: false, effects: true };
    }
  }

  private saveSettings(): void {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* optional */ }
  }
}
