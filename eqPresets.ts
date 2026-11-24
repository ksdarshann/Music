import type { EqualizerPreset } from '../types/music';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

export const EQ_FREQUENCY_LABELS = [
  '32 Hz',
  '64 Hz',
  '125 Hz',
  '250 Hz',
  '500 Hz',
  '1 kHz',
  '2 kHz',
  '4 kHz',
  '8 kHz',
  '16 kHz',
] as const;

export const EQ_PRESETS: EqualizerPreset[] = [
  {
    id: 'flat',
    name: 'Flat',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    preamp: 0,
    reverbMix: 0,
  },
  {
    id: 'cathedral-organ',
    name: 'Cathedral Organ',
    gains: [4.5, 5, 3, 0.5, -1, 1, 2.5, 3.5, 4, 3],
    preamp: -1,
    reverbMix: 0.34,
  },
  {
    id: 'crimson-bass',
    name: 'Crimson Bass',
    gains: [6.5, 5.5, 4, 1.5, -0.5, -1, 0, 1.5, 2, 1.5],
    preamp: -1.5,
    reverbMix: 0.08,
  },
  {
    id: 'midnight-acoustic',
    name: 'Midnight Acoustic',
    gains: [2, 1.5, 1, 0, 1.5, 2.5, 3, 3.5, 2.5, 1.5],
    preamp: 0,
    reverbMix: 0.16,
  },
  {
    id: 'vocal-clarity',
    name: 'Vocal Clarity',
    gains: [-2, -1.5, -1, 0.5, 2.5, 4.5, 4, 3, 1.5, 0.5],
    preamp: 0,
    reverbMix: 0.12,
  },
  {
    id: 'dark-synth',
    name: 'Dark Synth',
    gains: [5, 4, 2, -1.5, -2, 0.5, 2.5, 4.5, 5, 4],
    preamp: -1,
    reverbMix: 0.22,
  },
];
