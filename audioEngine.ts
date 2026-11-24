import { EQ_FREQUENCIES } from '../data/eqPresets';

class GothicAudioEngine {
  private audioEl: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preampNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private dryGainNode: GainNode | null = null;
  private wetGainNode: GainNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private masterGainNode: GainNode | null = null;

  private currentObjectUrl: string | null = null;
  private currentGains: number[] = new Array(10).fill(0);
  private currentPreamp = 0;
  private currentReverbMix = 0;
  private currentVolume = 0.8;
  private isMuted = false;

  constructor() {
    this.audioEl = new Audio();
    this.audioEl.preload = 'auto';
  }

  private createCathedralImpulse(ctx: AudioContext, duration = 2.6, decay = 3.2): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.pow(1 - t, decay);
        // Slightly warm damped noise tail
        data[i] = (Math.random() * 2 - 1) * envelope * 0.6;
      }
    }
    return impulse;
  }

  private ensureAudioGraph() {
    if (this.ctx) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    this.ctx = ctx;

    const source = ctx.createMediaElementSource(this.audioEl);
    this.sourceNode = source;

    const preamp = ctx.createGain();
    preamp.gain.value = Math.pow(10, this.currentPreamp / 20);
    this.preampNode = preamp;

    // Build 10-band BiquadFilter chain
    this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
      const filter = ctx.createBiquadFilter();
      if (idx === 0) {
        filter.type = 'lowshelf';
      } else if (idx === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }
      filter.frequency.value = freq;
      filter.gain.value = this.currentGains[idx] ?? 0;
      return filter;
    });

    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const convolver = ctx.createConvolver();
    convolver.buffer = this.createCathedralImpulse(ctx);

    this.dryGainNode = dryGain;
    this.wetGainNode = wetGain;
    this.convolverNode = convolver;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    this.analyserNode = analyser;

    const masterGain = ctx.createGain();
    masterGain.gain.value = this.isMuted ? 0 : this.currentVolume;
    this.masterGainNode = masterGain;

    // Connect chain: source -> preamp -> eq[0..9]
    source.connect(preamp);
    let lastNode: AudioNode = preamp;
    for (const filter of this.eqFilters) {
      lastNode.connect(filter);
      lastNode = filter;
    }

    // Dry / Wet Cathedral Reverb routing
    lastNode.connect(dryGain);
    lastNode.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(analyser);
    wetGain.connect(analyser);
    analyser.connect(masterGain);
    masterGain.connect(ctx.destination);

    this.applyReverbGainValues();
  }

  private applyReverbGainValues() {
    if (!this.dryGainNode || !this.wetGainNode || !this.ctx) return;
    const mix = Math.max(0, Math.min(0.65, this.currentReverbMix));
    this.dryGainNode.gain.setTargetAtTime(1 - mix * 0.45, this.ctx.currentTime, 0.03);
    this.wetGainNode.gain.setTargetAtTime(mix, this.ctx.currentTime, 0.03);
  }

  public get element(): HTMLAudioElement {
    return this.audioEl;
  }

  public async loadBlob(blob: Blob): Promise<void> {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
    const url = URL.createObjectURL(blob);
    this.currentObjectUrl = url;
    this.audioEl.src = url;
    this.audioEl.load();
  }

  public async play(): Promise<void> {
    this.ensureAudioGraph();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    await this.audioEl.play();
  }

  public pause(): void {
    this.audioEl.pause();
  }

  public seek(seconds: number): void {
    if (Number.isFinite(seconds)) {
      this.audioEl.currentTime = Math.max(0, Math.min(seconds, this.audioEl.duration || seconds));
    }
  }

  public setVolume(volume: number, muted: boolean): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    this.isMuted = muted;
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setTargetAtTime(
        muted ? 0 : this.currentVolume,
        this.ctx.currentTime,
        0.02
      );
    } else {
      this.audioEl.volume = muted ? 0 : this.currentVolume;
    }
  }

  public setEqualizer(gains: number[], preampDb: number, reverbMix: number): void {
    this.currentGains = [...gains];
    this.currentPreamp = preampDb;
    this.currentReverbMix = reverbMix;

    if (this.ctx) {
      if (this.preampNode) {
        this.preampNode.gain.setTargetAtTime(
          Math.pow(10, preampDb / 20),
          this.ctx.currentTime,
          0.03
        );
      }
      this.eqFilters.forEach((filter, idx) => {
        const val = gains[idx] ?? 0;
        filter.gain.setTargetAtTime(val, this.ctx!.currentTime, 0.03);
      });
      this.applyReverbGainValues();
    }
  }

  public getFrequencyData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyserNode) return false;
    this.analyserNode.getByteFrequencyData(target);
    return true;
  }

  public getTimeDomainData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyserNode) return false;
    this.analyserNode.getByteTimeDomainData(target);
    return true;
  }

  public getBufferLength(): number {
    return this.analyserNode ? this.analyserNode.frequencyBinCount : 1024;
  }
}

export const audioEngine = new GothicAudioEngine();
