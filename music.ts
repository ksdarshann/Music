export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerMode = 'bars' | 'wave' | 'radial';

export type NavSection =
  | 'listen-now'
  | 'songs'
  | 'albums'
  | 'favorites'
  | 'recently-played'
  | 'equalizer'
  | 'playlist';

export type RightPanelTab = 'lyrics' | 'queue' | null;

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  format: string;
  fileSize: number;
  artworkUrl?: string;
  lyrics: string;
  isFavorite: boolean;
  playCount: number;
  lastPlayedAt?: number;
  addedAt: number;
  isSample?: boolean;
}

export interface StoredAudioRecord {
  id: string;
  blob: Blob;
  mimeType: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface EqualizerPreset {
  id: string;
  name: string;
  gains: number[]; // 10 bands: 32, 64, 125, 250, 500, 1k, 2k, 4k, 8k, 16k Hz
  preamp: number; // dB (-6 to +6)
  reverbMix: number; // 0 to 0.65
}

export interface PlayerPreferences {
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  activePresetId: string;
  customGains: number[];
  preamp: number;
  reverbMix: number;
  visualizerMode: VisualizerMode;
}
