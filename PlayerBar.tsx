import {
  FileText,
  Heart,
  ListMusic,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { RepeatMode, RightPanelTab, Track } from '../types/music';
import { formatDuration } from '../utils/formatters';
import { ArtworkImage } from './ArtworkImage';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  rightPanelTab: RightPanelTab;
  isEqualizerOpen: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onChangeVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onToggleRightPanel: (tab: Exclude<RightPanelTab, null>) => void;
  onOpenEqualizer: () => void;
  onOpenImmersive: () => void;
  onToggleMiniPlayer: () => void;
}

export function PlayerBar({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  rightPanelTab,
  isEqualizerOpen,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onChangeVolume,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onToggleFavorite,
  onToggleRightPanel,
  onOpenEqualizer,
  onOpenImmersive,
  onToggleMiniPlayer,
}: PlayerBarProps) {
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const effectiveVol = isMuted ? 0 : volume;

  return (
    <footer className="relative z-30 border-t border-white/[0.08] bg-[#0B0609]/92 backdrop-blur-2xl px-4 sm:px-6 py-2.5">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-3 md:gap-6">
        {/* Left: Current Track Identity */}
        <div className="flex items-center justify-between md:justify-start gap-3 min-w-0">
          {currentTrack ? (
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onOpenImmersive}
                className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10"
                title="Expand Visualizer Stage"
                aria-label="Open expanded visualizer stage"
              >
                <ArtworkImage
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="h-full w-full"
                  iconSize={20}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={14} className="text-white" />
                </span>
              </button>

              <div className="min-w-0">
                <button
                  type="button"
                  onClick={onOpenImmersive}
                  className="block max-w-full truncate text-left text-sm font-medium text-[#F5EFEF] hover:text-[#FB923C] transition-colors"
                >
                  {currentTrack.title}
                </button>
                <p className="truncate text-xs text-[#8E7A7E]">{currentTrack.artist}</p>
              </div>

              <button
                type="button"
                onClick={() => onToggleFavorite(currentTrack.id)}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  currentTrack.isFavorite
                    ? 'text-[#F87171]'
                    : 'text-[#7A686C] hover:text-white'
                }`}
                aria-label={currentTrack.isFavorite ? 'Remove favorite' : 'Favorite track'}
              >
                <Heart size={15} fill={currentTrack.isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg border border-white/[0.06] bg-white/[0.03]" />
              <div>
                <p className="text-sm text-[#8E7A7E]">No track loaded</p>
                <p className="text-xs text-[#6B5A5E]">Select or upload audio</p>
              </div>
            </div>
          )}

          {/* Mobile Quick Play/Pause */}
          <div className="flex items-center gap-1 md:hidden shrink-0">
            <button
              type="button"
              onClick={onTogglePlayPause}
              disabled={!currentTrack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#EA580C] text-white disabled:opacity-40"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!currentTrack}
              className="p-2 text-[#D6C4C7] disabled:opacity-40"
              aria-label="Next track"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Center: Transport & Seek Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleShuffle}
              className={`p-1.5 rounded-md transition-colors ${
                isShuffle ? 'text-[#EA580C]' : 'text-[#8E7A7E] hover:text-white'
              }`}
              aria-label="Toggle shuffle"
              title="Shuffle"
            >
              <Shuffle size={15} />
            </button>

            <button
              type="button"
              onClick={onPrev}
              disabled={!currentTrack}
              className="p-1.5 text-[#D6C4C7] hover:text-white disabled:opacity-35 transition-colors"
              aria-label="Previous track"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={onTogglePlayPause}
              disabled={!currentTrack}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#EA580C] text-white shadow-[0_0_18px_rgba(220,38,38,0.45)] hover:scale-105 disabled:opacity-40 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!currentTrack}
              className="p-1.5 text-[#D6C4C7] hover:text-white disabled:opacity-35 transition-colors"
              aria-label="Next track"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={onCycleRepeat}
              className={`p-1.5 rounded-md transition-colors ${
                repeatMode !== 'off' ? 'text-[#EA580C]' : 'text-[#8E7A7E] hover:text-white'
              }`}
              aria-label={`Repeat mode: ${repeatMode}`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
            </button>
          </div>

          {/* Seek Bar */}
          <div className="flex w-full max-w-xl items-center gap-2.5">
            <span className="w-10 text-right text-[11px] font-mono-tabular text-[#8E7A7E]">
              {formatDuration(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              disabled={!currentTrack}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              aria-label="Seek audio position"
              className="gothic-slider flex-1 disabled:opacity-40"
              style={{
                background: `linear-gradient(to right, #DC2626 ${progress}%, rgba(255,255,255,0.14) ${progress}%)`,
                height: '4px',
                borderRadius: '9999px',
              }}
            />
            <span className="w-10 text-[11px] font-mono-tabular text-[#8E7A7E]">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Right: Utility Controls & Volume */}
        <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleRightPanel('lyrics')}
              className={`p-2 rounded-lg transition-colors ${
                rightPanelTab === 'lyrics'
                  ? 'bg-[#991B1B]/45 text-white'
                  : 'text-[#8E7A7E] hover:text-white hover:bg-white/[0.05]'
              }`}
              aria-label="Toggle lyrics panel"
              title="Lyrics"
            >
              <FileText size={16} />
            </button>

            <button
              type="button"
              onClick={() => onToggleRightPanel('queue')}
              className={`p-2 rounded-lg transition-colors ${
                rightPanelTab === 'queue'
                  ? 'bg-[#991B1B]/45 text-white'
                  : 'text-[#8E7A7E] hover:text-white hover:bg-white/[0.05]'
              }`}
              aria-label="Toggle queue panel"
              title="Up Next Queue"
            >
              <ListMusic size={16} />
            </button>

            <button
              type="button"
              onClick={onOpenEqualizer}
              className={`p-2 rounded-lg transition-colors ${
                isEqualizerOpen
                  ? 'bg-[#991B1B]/45 text-white'
                  : 'text-[#8E7A7E] hover:text-white hover:bg-white/[0.05]'
              }`}
              aria-label="Open equalizer"
              title="Equalizer"
            >
              <Sliders size={16} />
            </button>

            <button
              type="button"
              onClick={onToggleMiniPlayer}
              className="p-2 rounded-lg text-[#8E7A7E] hover:text-white hover:bg-white/[0.05] transition-colors"
              aria-label="Switch to mini player"
              title="Mini Player"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-white/[0.07]">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 text-[#8E7A7E] hover:text-white transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={effectiveVol}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              aria-label="Volume"
              className="gothic-slider w-20 sm:w-24"
              style={{
                background: `linear-gradient(to right, #EA580C ${effectiveVol * 100}%, rgba(255,255,255,0.14) ${effectiveVol * 100}%)`,
                height: '4px',
                borderRadius: '9999px',
              }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
