import { ALBUM_ART } from '../data/assets';
import type { Track } from '../types/music';

function encodeWavFromAudioBuffer(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

type SynthStyle =
  | 'vespers'
  | 'lanterns'
  | 'ember'
  | 'bhairav'
  | 'sufi'
  | 'monsoon'
  | 'chandni'
  | 'kyoto'
  | 'fado'
  | 'tango'
  | 'paris'
  | 'phonk_drift'
  | 'phonk_shadow'
  | 'phonk_funk'
  | 'ncs_horizon'
  | 'ncs_velocity'
  | 'ncs_eclipse';

function createSoftClipCurve(amount = 4): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

function createNoiseBuffer(ctx: OfflineAudioContext, lengthSec = 0.5): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * lengthSec);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buf;
}

function scheduleNoiseHit(
  ctx: OfflineAudioContext,
  noiseBuf: AudioBuffer,
  dest: AudioNode,
  startTime: number,
  dur: number,
  filterType: BiquadFilterType,
  freq: number,
  gainAmount: number
) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(freq, startTime);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.linearRampToValueAtTime(gainAmount, startTime + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(startTime);
  src.stop(startTime + dur + 0.02);
}

function schedule808Bass(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startTime: number,
  freq: number,
  dur: number,
  gainAmount: number,
  saturator?: WaveShaperNode
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 2.2, startTime);
  osc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.045);

  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.linearRampToValueAtTime(gainAmount, startTime + 0.01);
  g.gain.setValueAtTime(gainAmount * 0.85, startTime + Math.max(0.05, dur * 0.65));
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

  osc.connect(g);
  if (saturator) {
    g.connect(saturator);
  } else {
    g.connect(dest);
  }
  osc.start(startTime);
  osc.stop(startTime + dur + 0.03);
}

function scheduleCowbell(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startTime: number,
  baseFreq: number,
  dur: number,
  gainAmount: number
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const bp = ctx.createBiquadFilter();
  const g = ctx.createGain();

  osc1.type = 'square';
  osc2.type = 'square';
  osc1.frequency.setValueAtTime(baseFreq, startTime);
  osc2.frequency.setValueAtTime(baseFreq * 1.487, startTime);

  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(baseFreq * 1.85, startTime);
  bp.Q.setValueAtTime(2.2, startTime);

  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.linearRampToValueAtTime(gainAmount, startTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

  osc1.connect(bp);
  osc2.connect(bp);
  bp.connect(g);
  g.connect(dest);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + dur + 0.02);
  osc2.stop(startTime + dur + 0.02);
}

function scheduleDrumPulse(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startTime: number,
  freqStart: number,
  freqEnd: number,
  decay: number,
  gainAmount: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freqStart, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(28, freqEnd), startTime + decay);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(gainAmount, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + decay + 0.02);
}

function schedulePluck(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startTime: number,
  freq: number,
  dur: number,
  gainAmount: number,
  waveform: OscillatorType = 'triangle',
  glideFromFreq?: number,
  panPos = 0
) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();

  osc.type = waveform;
  if (glideFromFreq) {
    osc.frequency.setValueAtTime(glideFromFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq, startTime + Math.min(0.14, dur * 0.25));
  } else {
    osc.frequency.setValueAtTime(freq, startTime);
  }

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(5200, freq * 4.2), startTime);
  filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 1.4), startTime + dur);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(gainAmount, startTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

  pan.pan.setValueAtTime(panPos, startTime);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(pan);
  pan.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + dur + 0.05);
}

async function renderMusicalPiece(durationSec: number, style: SynthStyle): Promise<Blob> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.001, 0);
  master.gain.exponentialRampToValueAtTime(0.62, 0.35);
  master.gain.setValueAtTime(0.62, durationSec - 1.5);
  master.gain.exponentialRampToValueAtTime(0.0001, durationSec);
  master.connect(ctx.destination);

  const warmth = ctx.createBiquadFilter();
  warmth.type = 'lowpass';
  warmth.frequency.setValueAtTime(style.startsWith('phonk') || style.startsWith('ncs') ? 8500 : 2800, 0);
  warmth.connect(master);

  // PHONK ENGINE (Distorted 808s, 808 Cowbell Memphis Melody, Trap Hi-Hat Rolls, Claps)
  if (style === 'phonk_drift' || style === 'phonk_shadow' || style === 'phonk_funk') {
    const noiseBuf = createNoiseBuffer(ctx);
    const saturator = ctx.createWaveShaper();
    saturator.curve = createSoftClipCurve(style === 'phonk_drift' ? 5.5 : 4.2);
    saturator.oversample = '2x';
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(920, 0);
    saturator.connect(bassFilter);
    bassFilter.connect(warmth);

    const bpm = style === 'phonk_drift' ? 144 : style === 'phonk_shadow' ? 132 : 128;
    const step16 = 60 / bpm / 4; // 16th note duration
    const totalSteps = Math.floor((durationSec - 0.5) / step16);

    // Dark Phrygian / Memphis cowbell motifs (Hz)
    const motifs: Record<'phonk_drift' | 'phonk_shadow' | 'phonk_funk', number[]> = {
      phonk_drift: [523.25, 0, 523.25, 554.37, 659.25, 0, 554.37, 523.25, 493.88, 0, 523.25, 554.37, 659.25, 783.99, 659.25, 554.37],
      phonk_shadow: [440, 466.16, 0, 440, 523.25, 0, 466.16, 440, 392, 0, 440, 466.16, 587.33, 523.25, 466.16, 440],
      phonk_funk: [587.33, 0, 659.25, 698.46, 0, 659.25, 587.33, 0, 523.25, 587.33, 0, 659.25, 783.99, 0, 698.46, 659.25],
    };

    const bassRoots: Record<'phonk_drift' | 'phonk_shadow' | 'phonk_funk', number[]> = {
      phonk_drift: [41.2, 41.2, 43.65, 38.89], // E1 -> F1 -> Eb1
      phonk_shadow: [36.71, 36.71, 41.2, 34.65], // D1 -> E1 -> C#1
      phonk_funk: [49.0, 49.0, 43.65, 46.25], // G1 -> F1 -> F#1
    };

    const cowbellSeq = motifs[style];
    const bassSeq = bassRoots[style];

    for (let s = 0; s < totalSteps; s++) {
      const t = 0.25 + s * step16;
      const barStep = s % 16;
      const barNum = Math.floor(s / 16) % bassSeq.length;

      // Punchy 808 Kick + Sub
      const kickPattern =
        style === 'phonk_funk'
          ? [0, 3, 6, 8, 11, 14]
          : [0, 3, 6, 10, 14];
      if (kickPattern.includes(barStep)) {
        schedule808Bass(ctx, warmth, t, bassSeq[barNum], step16 * 3.1, 0.42, saturator);
      }

      // Snappy Snare / Clap on beat 3 (step 8) and ghost hit
      if (barStep === 8 || (style === 'phonk_funk' && barStep === 12)) {
        scheduleNoiseHit(ctx, noiseBuf, warmth, t, 0.14, 'bandpass', 1750, 0.34);
        scheduleDrumPulse(ctx, warmth, t, 220, 115, 0.09, 0.22);
      }

      // Crisp Trap Hi-Hats + 32nd-note trap rolls on bars 3/4
      if (barStep % 2 === 0 || (barNum % 2 === 1 && barStep >= 12)) {
        scheduleNoiseHit(ctx, noiseBuf, warmth, t, 0.045, 'highpass', 6200, 0.14);
        if (barNum === 3 && barStep >= 12) {
          scheduleNoiseHit(ctx, noiseBuf, warmth, t + step16 * 0.5, 0.035, 'highpass', 7200, 0.11);
        }
      }

      // 808 Cowbell Lead Hook
      const cbFreq = cowbellSeq[barStep];
      if (cbFreq > 0) {
        scheduleCowbell(ctx, warmth, t, cbFreq, step16 * 1.45, 0.24);
      }
    }

    const rendered = await ctx.startRendering();
    return encodeWavFromAudioBuffer(rendered);
  }

  // NO-COPYRIGHT ELECTRONIC / SYNTHWAVE / FUTURE BASS ENGINE
  if (style === 'ncs_horizon' || style === 'ncs_velocity' || style === 'ncs_eclipse') {
    const noiseBuf = createNoiseBuffer(ctx);
    const bpm = style === 'ncs_velocity' ? 128 : style === 'ncs_horizon' ? 122 : 110;
    const beat = 60 / bpm;
    const step16 = beat / 4;

    const chordBanks: Record<'ncs_horizon' | 'ncs_velocity' | 'ncs_eclipse', number[][]> = {
      ncs_horizon: [
        [110.0, 220.0, 261.63, 329.63, 440.0], // Am
        [87.31, 174.61, 220.0, 261.63, 349.23], // F
        [130.81, 261.63, 329.63, 392.0, 523.25], // C
        [98.0, 196.0, 246.94, 293.66, 392.0], // G
      ],
      ncs_velocity: [
        [73.42, 146.83, 174.61, 220.0, 293.66], // Dm
        [116.54, 233.08, 293.66, 349.23, 466.16], // Bb
        [87.31, 174.61, 220.0, 261.63, 349.23], // F
        [130.81, 261.63, 329.63, 392.0, 523.25], // C
      ],
      ncs_eclipse: [
        [82.41, 164.81, 196.0, 246.94, 329.63], // Em
        [130.81, 261.63, 329.63, 392.0, 493.88], // Cmaj7
        [98.0, 196.0, 246.94, 293.66, 392.0], // G
        [110.0, 220.0, 261.63, 329.63, 440.0], // Am
      ],
    };

    const chords = chordBanks[style];
    const barDur = beat * 4;
    const totalBars = Math.floor((durationSec - 0.6) / barDur);

    for (let b = 0; b < totalBars; b++) {
      const barStart = 0.3 + b * barDur;
      const chord = chords[b % chords.length];

      // Sidechained Supersaw Pad
      chord.slice(1).forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * (1 + (idx % 2 === 0 ? -0.004 : 0.004)), barStart);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, barStart);

        // Pump envelope on every beat
        g.gain.setValueAtTime(0.01, barStart);
        for (let beatIdx = 0; beatIdx < 4; beatIdx++) {
          const bt = barStart + beatIdx * beat;
          g.gain.setValueAtTime(0.012, bt);
          g.gain.linearRampToValueAtTime(0.085, bt + beat * 0.45);
          g.gain.linearRampToValueAtTime(0.055, bt + beat * 0.95);
        }

        osc.connect(filter);
        filter.connect(g);
        g.connect(warmth);
        osc.start(barStart);
        osc.stop(barStart + barDur + 0.05);
      });

      // Driving Kick, Clap, Off-beat Hi-Hat, and Synth Arp
      for (let s = 0; s < 16; s++) {
        const t = barStart + s * step16;
        if (s % 4 === 0) {
          scheduleDrumPulse(ctx, warmth, t, 140, 44, 0.22, 0.36);
          schedule808Bass(ctx, warmth, t, chord[0] * 0.5, step16 * 3.5, 0.22);
        }
        if (s === 4 || s === 12) {
          scheduleNoiseHit(ctx, noiseBuf, warmth, t, 0.13, 'bandpass', 1900, 0.28);
        }
        if (s % 4 === 2) {
          scheduleNoiseHit(ctx, noiseBuf, warmth, t, 0.07, 'highpass', 5800, 0.14);
        }

        // Uplifting Synth Pluck Arpeggio
        const arpNote = chord[1 + (s % 4)] * (s >= 8 ? 2 : 1);
        if (s % 2 === 0 || s === 15) {
          schedulePluck(
            ctx,
            warmth,
            t,
            arpNote,
            step16 * 1.9,
            0.13,
            'sawtooth',
            undefined,
            ((s % 3) - 1) * 0.22
          );
        }
      }
    }

    const rendered = await ctx.startRendering();
    return encodeWavFromAudioBuffer(rendered);
  }

  // Indian Raga / Sufi engines (Tanpura drone + Meend Sitar/Sarangi + Tabla pulse)
  if (style === 'bhairav' || style === 'sufi' || style === 'monsoon' || style === 'chandni') {
    const root = style === 'bhairav' ? 130.81 : style === 'sufi' ? 146.83 : style === 'monsoon' ? 123.47 : 138.59;
    const fifth = root * 1.5;

    [root * 0.5, root, fifth, root * 2].forEach((droneFreq, idx) => {
      const osc = ctx.createOscillator();
      const droneGain = ctx.createGain();
      const droneFilter = ctx.createBiquadFilter();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(droneFreq * (1 + (idx - 1.5) * 0.0018), 0);
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(850 + idx * 140, 0);

      const amp = idx === 0 ? 0.14 : 0.075;
      droneGain.gain.setValueAtTime(0.0001, 0);
      droneGain.gain.linearRampToValueAtTime(amp, 2.0);
      droneGain.gain.setValueAtTime(amp, durationSec - 2.0);
      droneGain.gain.exponentialRampToValueAtTime(0.0001, durationSec);

      osc.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(warmth);
      osc.start(0);
      osc.stop(durationSec);
    });

    const scaleRatios: Record<'bhairav' | 'sufi' | 'monsoon' | 'chandni', number[]> = {
      bhairav: [1, 16 / 15, 5 / 4, 4 / 3, 3 / 2, 8 / 5, 15 / 8, 2],
      sufi: [1, 9 / 8, 6 / 5, 4 / 3, 3 / 2, 8 / 5, 9 / 5, 2],
      monsoon: [1, 9 / 8, 6 / 5, 4 / 3, 3 / 2, 8 / 5, 15 / 8, 2],
      chandni: [1, 9 / 8, 5 / 4, 45 / 32, 3 / 2, 5 / 3, 15 / 8, 2],
    };

    const phrases: Record<'bhairav' | 'sufi' | 'monsoon' | 'chandni', number[]> = {
      bhairav: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 4, 5, 6, 7, 5, 4, 2, 1, 0],
      sufi: [4, 3, 2, 1, 0, 2, 4, 5, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 0],
      monsoon: [0, 2, 3, 4, 6, 7, 6, 5, 4, 3, 2, 0, 4, 5, 6, 7, 5, 3, 2, 0],
      chandni: [6, 7, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 6, 4, 2, 1, 0],
    };

    const ratios = scaleRatios[style];
    const melody = phrases[style];
    const stepDur = (durationSec - 1.5) / melody.length;

    melody.forEach((deg, idx) => {
      const t = 0.8 + idx * stepDur;
      const freq = root * 2 * ratios[deg];
      const prevDeg = melody[Math.max(0, idx - 1)];
      const prevFreq = root * 2 * ratios[prevDeg];
      schedulePluck(
        ctx,
        warmth,
        t,
        freq,
        stepDur * 1.45,
        0.18,
        style === 'sufi' ? 'sawtooth' : 'triangle',
        idx > 0 ? prevFreq : undefined,
        Math.sin(idx * 0.7) * 0.25
      );
    });

    const beatDur = 0.62;
    for (let t = 0.6; t < durationSec - 0.8; t += beatDur) {
      const beatIndex = Math.round(t / beatDur) % 8;
      if (beatIndex === 0 || beatIndex === 4) {
        scheduleDrumPulse(ctx, warmth, t, 145, 58, 0.28, 0.24);
      } else if (beatIndex === 2 || beatIndex === 6) {
        scheduleDrumPulse(ctx, warmth, t, 310, 175, 0.14, 0.14);
      } else if (beatIndex % 2 === 1) {
        scheduleDrumPulse(ctx, warmth, t, 240, 130, 0.1, 0.08);
      }
    }

    const rendered = await ctx.startRendering();
    return encodeWavFromAudioBuffer(rendered);
  }

  // Japanese Hirajoshi Koto + Taiko (Kyoto)
  if (style === 'kyoto') {
    const hirajoshi = [220, 246.94, 261.63, 329.63, 349.23, 440, 493.88, 523.25, 659.25];
    const pattern = [0, 2, 3, 4, 5, 4, 3, 2, 0, 3, 5, 7, 8, 7, 5, 4, 3, 2, 1, 0];

    [110, 164.81, 261.63].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, 0);
      g.gain.setValueAtTime(0.0001, 0);
      g.gain.linearRampToValueAtTime(idx === 0 ? 0.16 : 0.09, 2.2);
      g.gain.setValueAtTime(idx === 0 ? 0.16 : 0.09, durationSec - 2.2);
      g.gain.exponentialRampToValueAtTime(0.0001, durationSec);
      osc.connect(g);
      g.connect(warmth);
      osc.start(0);
      osc.stop(durationSec);
    });

    const step = (durationSec - 1.6) / pattern.length;
    pattern.forEach((deg, idx) => {
      const t = 0.8 + idx * step;
      schedulePluck(
        ctx,
        warmth,
        t,
        hirajoshi[deg],
        step * 1.6,
        0.2,
        'triangle',
        undefined,
        (idx % 2 === 0 ? -1 : 1) * 0.3
      );
    });

    for (let t = 1.0; t < durationSec - 1.0; t += 2.4) {
      scheduleDrumPulse(ctx, warmth, t, 105, 42, 0.55, 0.32);
    }

    const rendered = await ctx.startRendering();
    return encodeWavFromAudioBuffer(rendered);
  }

  // Iberian Fado / Latin Tango / Parisian Waltz
  if (style === 'fado' || style === 'tango' || style === 'paris') {
    const chords: Record<'fado' | 'tango' | 'paris', number[][]> = {
      fado: [
        [82.41, 164.81, 207.65, 246.94, 329.63],
        [87.31, 174.61, 220.0, 261.63, 349.23],
        [98.0, 196.0, 246.94, 293.66, 392.0],
        [82.41, 164.81, 207.65, 246.94, 329.63],
      ],
      tango: [
        [65.41, 130.81, 155.56, 196.0, 261.63],
        [51.91, 103.83, 155.56, 196.0, 246.94],
        [43.65, 87.31, 130.81, 174.61, 207.65],
        [49.0, 98.0, 146.83, 196.0, 246.94],
      ],
      paris: [
        [55.0, 110.0, 130.81, 164.81, 220.0],
        [73.42, 146.83, 174.61, 220.0, 261.63],
        [49.0, 98.0, 146.83, 196.0, 246.94],
        [65.41, 130.81, 164.81, 196.0, 246.94],
      ],
    };

    const prog = chords[style];
    const barDur = durationSec / prog.length;

    prog.forEach((chord, barIdx) => {
      const barStart = barIdx * barDur;
      chord.forEach((freq, vIdx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = style === 'paris' || style === 'tango' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq * (1 + (vIdx % 2 === 0 ? -0.002 : 0.002)), barStart);

        const amp = vIdx === 0 ? 0.16 : 0.065;
        g.gain.setValueAtTime(0.0001, barStart);
        g.gain.linearRampToValueAtTime(amp, barStart + 0.35);
        g.gain.setValueAtTime(amp * 0.8, barStart + barDur - 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, barStart + barDur + 0.15);

        osc.connect(g);
        g.connect(warmth);
        osc.start(barStart);
        osc.stop(barStart + barDur + 0.2);
      });

      const subCount = style === 'paris' ? 6 : 8;
      for (let step = 0; step < subCount; step++) {
        const noteTime = barStart + step * (barDur / subCount);
        const noteFreq = chord[1 + (step % (chord.length - 1))] * (step % 3 === 0 ? 2 : 1);
        schedulePluck(
          ctx,
          warmth,
          noteTime,
          noteFreq,
          (barDur / subCount) * 1.4,
          0.14,
          'triangle',
          undefined,
          ((step % 3) - 1) * 0.25
        );
      }

      if (style === 'tango') {
        [0, 0.375, 0.5, 0.75].forEach((offsetRatio) => {
          scheduleDrumPulse(
            ctx,
            warmth,
            barStart + offsetRatio * barDur,
            120,
            48,
            0.22,
            offsetRatio === 0 ? 0.25 : 0.16
          );
        });
      }
    });

    const rendered = await ctx.startRendering();
    return encodeWavFromAudioBuffer(rendered);
  }

  // Original Gothic Lounge Tracks ('vespers', 'lanterns', 'ember')
  const chords: Record<'vespers' | 'lanterns' | 'ember', number[][]> = {
    vespers: [
      [73.42, 146.83, 220.0, 261.63, 349.23],
      [58.27, 116.54, 174.61, 220.0, 293.66],
      [65.41, 130.81, 196.0, 233.08, 349.23],
      [55.0, 110.0, 164.81, 220.0, 277.18],
    ],
    lanterns: [
      [65.41, 130.81, 196.0, 311.13, 392.0],
      [51.91, 103.83, 155.56, 246.94, 311.13],
      [58.27, 116.54, 174.61, 233.08, 349.23],
      [49.0, 98.0, 146.83, 246.94, 293.66],
    ],
    ember: [
      [55.0, 110.0, 164.81, 220.0, 329.63],
      [43.65, 87.31, 130.81, 220.0, 261.63],
      [49.0, 98.0, 146.83, 196.0, 293.66],
      [41.2, 82.41, 123.47, 196.0, 246.94],
    ],
  };

  const progression = chords[style];
  const barDur = durationSec / progression.length;

  progression.forEach((freqs, idx) => {
    const start = idx * barDur;
    freqs.forEach((freq, voiceIdx) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      const pan = ctx.createStereoPanner();

      osc.type =
        style === 'vespers'
          ? voiceIdx === 0
            ? 'sawtooth'
            : 'triangle'
          : style === 'lanterns'
            ? voiceIdx < 2
              ? 'sine'
              : 'triangle'
            : voiceIdx === 0
              ? 'sawtooth'
              : 'sine';

      osc.frequency.setValueAtTime(freq * (1 + (voiceIdx % 2 === 0 ? -0.0025 : 0.0025)), start);
      pan.pan.setValueAtTime(((voiceIdx % 3) - 1) * 0.38, start);

      const amp = voiceIdx === 0 ? 0.2 : 0.1;
      voiceGain.gain.setValueAtTime(0.0001, start);
      voiceGain.gain.linearRampToValueAtTime(amp, start + 1.0);
      voiceGain.gain.setValueAtTime(amp * 0.88, start + barDur - 1.0);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, start + barDur + 0.25);

      osc.connect(voiceGain);
      voiceGain.connect(pan);
      pan.connect(warmth);

      osc.start(start);
      osc.stop(start + barDur + 0.3);
    });

    const melodyNotes =
      style === 'lanterns'
        ? [freqs[3] * 2, freqs[4] * 2, freqs[2] * 2, freqs[3] * 2]
        : [freqs[2] * 2, freqs[3] * 2, freqs[4] * 2, freqs[3] * 2];

    melodyNotes.forEach((noteFreq, step) => {
      const noteStart = start + step * (barDur / 4);
      schedulePluck(ctx, warmth, noteStart, noteFreq, barDur / 3.2, 0.07, 'sine');
    });
  });

  const rendered = await ctx.startRendering();
  return encodeWavFromAudioBuffer(rendered);
}

export type SampleCategory = 'gothic' | 'indian' | 'international' | 'phonk' | 'nocopyright';

export interface GeneratedSampleTrack {
  track: Track;
  blob: Blob;
  category: SampleCategory;
}

interface SampleSpec {
  id: string;
  style: SynthStyle;
  category: SampleCategory;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  isFavorite: boolean;
  duration: number;
  lyrics: string;
}

const SAMPLE_CATALOG: SampleSpec[] = [
  {
    id: 'sample_phonk_drift',
    style: 'phonk_drift',
    category: 'phonk',
    title: 'Crimson Drift (Phonk)',
    artist: 'Kurogane 808 · No Copyright',
    album: 'Shadow Drift Phonk',
    artworkUrl: ALBUM_ART.crimsonPhonk,
    isFavorite: true,
    duration: 24,
    lyrics: `Wet obsidian asphalt under crimson streetlights,
808 sub-bass rattling the iron sky.
Cowbell echoes tearing through the midnight fog,
Tail lights burning orange as the shadows fly.

No brakes, no mercy on the midnight avenue,
Smoke rising off the steel into the velvet dark.`,
  },
  {
    id: 'sample_phonk_shadow',
    style: 'phonk_shadow',
    category: 'phonk',
    title: 'Obsidian Cowbell (Phonk)',
    artist: 'Vortex Memphis · No Copyright',
    album: 'Shadow Drift Phonk',
    artworkUrl: ALBUM_ART.crimsonPhonk,
    isFavorite: true,
    duration: 24,
    lyrics: `Static tape hiss in the subterranean vault,
Low-end thunder rolling through the darkened lane.
Chrome blades spinning in the blood-red mist,
Heavy 808s pulsing through the midnight rain.`,
  },
  {
    id: 'sample_phonk_funk',
    style: 'phonk_funk',
    category: 'phonk',
    title: 'Bloodline Bounce (Phonk)',
    artist: 'Sanguine Drift · No Copyright',
    album: 'Shadow Drift Phonk',
    artworkUrl: ALBUM_ART.emberRequiem,
    isFavorite: false,
    duration: 24,
    lyrics: `Syncopated shadows on the concrete floor,
Embers sparking upward with every bassline drop.
Cowbell cadence driving through the crimson haze,
Midnight tempo burning and it will not stop.`,
  },
  {
    id: 'sample_ncs_horizon',
    style: 'ncs_horizon',
    category: 'nocopyright',
    title: 'Crimson Horizon (No Copyright)',
    artist: 'Aether Pulse · Royalty-Free',
    album: 'No-Copyright Vault',
    artworkUrl: ALBUM_ART.noCopyrightSynth,
    isFavorite: true,
    duration: 24,
    lyrics: `Light beams cutting through the obsidian sea,
Zero chains, open sky, every frequency free.
Chasing blood-orange horizons past the edge of night,
Turning every shadow into surging light.`,
  },
  {
    id: 'sample_ncs_velocity',
    style: 'ncs_velocity',
    category: 'nocopyright',
    title: 'Blood Moon Velocity (No Copyright)',
    artist: 'Noctis Audio · Royalty-Free',
    album: 'No-Copyright Vault',
    artworkUrl: ALBUM_ART.noCopyrightSynth,
    isFavorite: false,
    duration: 24,
    lyrics: `Accelerate into the crimson atmosphere,
Arpeggios climbing higher as the bass draws near.
Monolith silhouettes reflecting on the glass,
Momentum built for streams and nights that never pass.`,
  },
  {
    id: 'sample_ncs_eclipse',
    style: 'ncs_eclipse',
    category: 'nocopyright',
    title: 'Eclipse Anthem (No Copyright)',
    artist: 'Solstice Wave · Royalty-Free',
    album: 'No-Copyright Vault',
    artworkUrl: ALBUM_ART.noCopyrightSynth,
    isFavorite: false,
    duration: 24,
    lyrics: `When the crimson ring surrounds the midnight sun,
Wide synth chords rise until the dark and light are one.
Pure open resonance, royalty-free and bold,
A modern nocturnal anthem forged in fire and gold.`,
  },
  {
    id: 'sample_gothic_vespers',
    style: 'vespers',
    category: 'gothic',
    title: 'Crimson Vespers',
    artist: 'Nocturne Ensemble',
    album: 'Velvet Sanctum',
    artworkUrl: ALBUM_ART.crimsonNocturne,
    isFavorite: true,
    duration: 24,
    lyrics: `Beneath the vaulted stone and silent rain,
The crimson embers drift across the floor.
An echo rises from the organ's vein,
And midnight opens every iron door.

Stay where the candle shadows softly bend,
Where velvet stillness holds the dying light.
No hurried pulse, no fractured world to mend—
Only the resonance of quiet night.`,
  },
  {
    id: 'sample_indian_bhairav',
    style: 'bhairav',
    category: 'indian',
    title: 'Raag Bhairav — Midnight Raga',
    artist: 'Varanasi Sanctum',
    album: 'Ragas in Crimson',
    artworkUrl: ALBUM_ART.indianRaga,
    isFavorite: true,
    duration: 24,
    lyrics: `अंधेरे मंदिर की सीढ़ियों पर,
दीपक की लौ काँप उठी।
राग भैरव की गूँज में,
ख़ामोश रात सँवर उठी।

(Translation)
Upon the shadowed temple steps,
The earthen lamp begins to glow.
Inside the echoes of Bhairav,
The silent night begins to flow.`,
  },
  {
    id: 'sample_indian_sufi',
    style: 'sufi',
    category: 'indian',
    title: 'Ishq-e-Shab (Night of Devotion)',
    artist: 'Sufi Caravan',
    album: 'Sufi Shadows',
    artworkUrl: ALBUM_ART.indianRaga,
    isFavorite: true,
    duration: 24,
    lyrics: `चाँद की परछाईं में जलता रहा ये दिल,
शब-ए-ग़म में भी तेरा नाम सदाबहार रहा।
सितारों के साये में गूँजी वो दास्ताँ,
हर साँस में बस एक ही इक़रार रहा।

(Translation)
In the shadow of the crimson moon, this heart burned bright,
Through deepest dark, your name remained eternal light.`,
  },
  {
    id: 'sample_indian_monsoon',
    style: 'monsoon',
    category: 'indian',
    title: 'Kaveri Monsoon (Carnatic Dusk)',
    artist: 'Deccan Chamber',
    album: 'Ragas in Crimson',
    artworkUrl: ALBUM_ART.crimsonNocturne,
    isFavorite: false,
    duration: 24,
    lyrics: `கருமேகம் சூழும் மாலை நேரத்தில்,
நதியின் அலைகள் பாடும் கீதம்.
வீணையின் நாதம் காற்றில் மிதக்க,
மழையின் துளிகள் சொல்லும் வேதம்.

(Translation)
As storm clouds gather at the edge of dusk,
The river currents sing their ancient verse.`,
  },
  {
    id: 'sample_indian_chandni',
    style: 'chandni',
    category: 'indian',
    title: 'Chandni Raat (Moonlit Sitara)',
    artist: 'Bombay Nocturne',
    album: 'Sufi Shadows',
    artworkUrl: ALBUM_ART.emberRequiem,
    isFavorite: false,
    duration: 24,
    lyrics: `चाँदनी रात में खामोश हैं गलियाँ सारी,
लहरों पे तैरती है एक पुरानी धुन हमारी।
सुर्ख़ रोशनी में लिपटा है आसमाँ सारा,
धड़कनों में बसा है इक भूला हुआ तारा।

(Translation)
Quiet lie the lanes beneath the velvet moon,
Across the water drifts an ancient, gentle tune.`,
  },
  {
    id: 'sample_intl_kyoto',
    style: 'kyoto',
    category: 'international',
    title: 'Sakura in Obsidian Rain',
    artist: 'Koto & Mist (Japan)',
    album: 'Kyoto After Midnight',
    artworkUrl: ALBUM_ART.kyotoNocturne,
    isFavorite: true,
    duration: 24,
    lyrics: `夜の雨に濡れる朱色の提灯、
黒い水面に揺れる桜の花びら。
静寂の中で響く琴の音色、
時を忘れて夜を見つめる。

(Translation)
Crimson paper lanterns glistening in midnight rain,
Cherry petals drifting on obsidian water.`,
  },
  {
    id: 'sample_intl_fado',
    style: 'fado',
    category: 'international',
    title: 'Fado da Lua Vermelha',
    artist: 'Lisboa Noturna (Portugal)',
    album: 'Fado & Ember',
    artworkUrl: ALBUM_ART.tangoFado,
    isFavorite: false,
    duration: 24,
    lyrics: `Na calçada escura brilha a lua vermelha,
Doze cordas choram a saudade do mar.
Entre sombras antigas a chama se espelha,
E o vento da noite começa a cantar.`,
  },
  {
    id: 'sample_intl_tango',
    style: 'tango',
    category: 'international',
    title: 'Noche de Obsidiana',
    artist: 'Buenos Aires Echo (Argentina)',
    album: 'Tango Carmesí',
    artworkUrl: ALBUM_ART.tangoFado,
    isFavorite: true,
    duration: 24,
    lyrics: `Bajo la luz naranja de un farol antiguo,
Respiran las sombras un tango olvidado.
El bandoneón suspira su fuego ambiguo,
En cada paso lento del pasado.`,
  },
  {
    id: 'sample_intl_paris',
    style: 'paris',
    category: 'international',
    title: 'Chanson de Minuit',
    artist: 'Lumière Noire (France)',
    album: 'Tango Carmesí',
    artworkUrl: ALBUM_ART.obsidianCathedral,
    isFavorite: false,
    duration: 24,
    lyrics: `Sous les arches de pierre et la brume carmin,
Une valse s'éveille au bord de la Seine.
Les réverbères brûlent jusqu'au petit matin,
Dans le velours sombre d'une nuit sereine.`,
  },
  {
    id: 'sample_gothic_lanterns',
    style: 'lanterns',
    category: 'gothic',
    title: 'Lanterns in the Mist',
    artist: 'Obsidian Choir',
    album: 'Ashen Reliquary',
    artworkUrl: ALBUM_ART.obsidianCathedral,
    isFavorite: false,
    duration: 24,
    lyrics: `Through vaulted arches draped in drifting red,
A solitary lantern guards the stair.
Each chime dissolves the weight of things unsaid,
And turns the cold horizon into prayer.`,
  },
  {
    id: 'sample_gothic_ember',
    style: 'ember',
    category: 'gothic',
    title: 'Ember & Iron',
    artist: 'Sanguine Forge',
    album: 'Twilight Requiem',
    artworkUrl: ALBUM_ART.emberRequiem,
    isFavorite: false,
    duration: 24,
    lyrics: `Basalt fractures glowing warm beneath the ash,
Silver filigree etched into the night.
A steady cadence where the shadows clash,
And slow horizons catch the blood-orange light.`,
  },
];

export async function generateCatalogSamples(
  existingIds: Set<string>,
  existingTitles: Set<string>
): Promise<GeneratedSampleTrack[]> {
  const now = Date.now();
  const results: GeneratedSampleTrack[] = [];

  for (let i = 0; i < SAMPLE_CATALOG.length; i++) {
    const spec = SAMPLE_CATALOG[i];
    if (existingIds.has(spec.id) || existingTitles.has(spec.title.toLowerCase())) {
      continue;
    }

    const blob = await renderMusicalPiece(spec.duration, spec.style);
    const track: Track = {
      id: spec.id,
      title: spec.title,
      artist: spec.artist,
      album: spec.album,
      duration: spec.duration,
      format: 'WAV',
      fileSize: blob.size,
      artworkUrl: spec.artworkUrl,
      lyrics: spec.lyrics,
      isFavorite: spec.isFavorite,
      playCount: i < 4 ? 3 : 1,
      lastPlayedAt: i < 6 ? now - i * 2400_000 : undefined,
      addedAt: now - (SAMPLE_CATALOG.length - i) * 1000,
      isSample: true,
    };
    results.push({ track, blob, category: spec.category });
  }

  return results;
}
