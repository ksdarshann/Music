import {
  Check,
  ChevronDown,
  Edit3,
  Heart,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RepeatMode, Track, VisualizerMode } from '../types/music';
import { formatDuration } from '../utils/formatters';
import { ArtworkImage } from './ArtworkImage';
import { AudioVisualizer } from './AudioVisualizer';

interface ImmersiveStageProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  visualizerMode: VisualizerMode;
  onClose: () => void;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  onSaveLyrics: (trackId: string, lyrics: string) => void;
  onOpenEqualizer: () => void;
}

export function ImmersiveStage({
  track,
  isPlaying,
  currentTime,
  duration,
  isShuffle,
  repeatMode,
  visualizerMode,
  onClose,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
  onToggleFavorite,
  onChangeVisualizerMode,
  onSaveLyrics,
  onOpenEqualizer,
}: ImmersiveStageProps) {
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [draftLyrics, setDraftLyrics] = useState('');

  useEffect(() => {
    setIsEditingLyrics(false);
    setDraftLyrics(track?.lyrics ?? '');
  }, [track?.id, track?.lyrics]);

  if (!track) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#060406] text-[#F5EFEF] overflow-y-auto">
      {/* Dynamic Artwork Backdrop */}
      <div className="pointer-events-none fixed inset-0">
        <ArtworkImage
          src={track.artworkUrl}
          alt=""
          className="h-full w-full opacity-30 blur-3xl scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070407]/85 via-[#0E060A]/80 to-[#050305]/95" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/[0.06]">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] px-3.5 py-2 text-xs font-medium text-[#E8DCDC] transition-colors"
        >
          <ChevronDown size={16} />
          <span>Back to Lounge</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-white/[0.05] p-1">
            {(['bars', 'wave', 'radial'] as VisualizerMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeVisualizerMode(mode)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  visualizerMode === mode
                    ? 'bg-[#991B1B]/70 text-white'
                    : 'text-[#A69598] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenEqualizer();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] px-3 py-2 text-xs text-[#E8DCDC]"
          >
            <Sliders size={14} />
            <span>Equalizer</span>
          </button>
        </div>
      </div>

      {/* Main Split Stage */}
      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 lg:grid-cols-12 gap-8 px-6 sm:px-10 py-8 items-center">
        {/* Left: Artwork + Visualizer + Transport */}
        <div className="lg:col-span-6 flex flex-col items-center text-center space-y-6">
          <div className="relative h-64 w-64 sm:h-80 sm:w-80 rounded-2xl overflow-hidden border border-white/15 shadow-[0_25px_70px_rgba(153,27,27,0.35)]">
            <ArtworkImage
              src={track.artworkUrl}
              alt={track.title}
              className="h-full w-full"
              iconSize={64}
            />
          </div>

          <div className="w-full max-w-md space-y-1.5">
            <div className="flex items-center justify-center gap-3">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5EFEF] truncate">
                {track.title}
              </h2>
              <button
                type="button"
                onClick={() => onToggleFavorite(track.id)}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  track.isFavorite ? 'text-[#F87171]' : 'text-[#8E7A7E] hover:text-white'
                }`}
                aria-label="Toggle favorite"
              >
                <Heart size={18} fill={track.isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="text-sm text-[#B8A5A8]">
              {track.artist} · {track.album}
            </p>
          </div>

          {/* Live Visualizer */}
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-black/45 p-3">
            <AudioVisualizer isPlaying={isPlaying} mode={visualizerMode} height={110} />
          </div>

          {/* Scrubber */}
          <div className="w-full max-w-md space-y-1.5">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              aria-label="Seek track position"
              className="gothic-slider w-full"
              style={{
                background: `linear-gradient(to right, #DC2626 ${progress}%, rgba(255,255,255,0.16) ${progress}%)`,
                height: '4px',
                borderRadius: '9999px',
              }}
            />
            <div className="flex justify-between text-xs font-mono-tabular text-[#8E7A7E]">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={onToggleShuffle}
              className={`p-2 rounded-lg transition-colors ${
                isShuffle ? 'text-[#EA580C]' : 'text-[#8E7A7E] hover:text-white'
              }`}
              aria-label="Toggle shuffle"
            >
              <Shuffle size={18} />
            </button>

            <button
              type="button"
              onClick={onPrev}
              className="p-2.5 text-[#E8DCDC] hover:text-white transition-colors"
              aria-label="Previous track"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={onTogglePlayPause}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#EA580C] text-white shadow-[0_0_28px_rgba(220,38,38,0.5)] hover:scale-105 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="p-2.5 text-[#E8DCDC] hover:text-white transition-colors"
              aria-label="Next track"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={onCycleRepeat}
              className={`p-2 rounded-lg transition-colors ${
                repeatMode !== 'off' ? 'text-[#EA580C]' : 'text-[#8E7A7E] hover:text-white'
              }`}
              aria-label="Cycle repeat mode"
            >
              {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
        </div>

        {/* Right: Lyrics Stage */}
        <div className="lg:col-span-6 flex flex-col h-full max-h-[540px] rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.07]">
            <h3 className="font-display text-lg font-semibold text-[#F5EFEF]">Lyrics</h3>
            {!isEditingLyrics ? (
              <button
                type="button"
                onClick={() => {
                  setDraftLyrics(track.lyrics);
                  setIsEditingLyrics(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] px-3 py-1.5 text-xs font-medium text-[#E8DCDC]"
              >
                <Edit3 size={12} />
                <span>Edit Lyrics</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSaveLyrics(track.id, draftLyrics);
                    setIsEditingLyrics(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#991B1B] hover:bg-[#B91C1C] px-3 py-1.5 text-xs font-medium text-white"
                >
                  <Check size={12} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftLyrics(track.lyrics);
                    setIsEditingLyrics(false);
                  }}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#A69598] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pt-5 pr-2">
            {isEditingLyrics ? (
              <textarea
                value={draftLyrics}
                onChange={(e) => setDraftLyrics(e.target.value)}
                rows={15}
                placeholder="Write or paste lyrics for this track..."
                className="w-full h-full min-h-[300px] rounded-xl border border-[#DC2626]/40 bg-[#12090E] p-4 text-sm leading-relaxed text-[#F5EFEF] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            ) : track.lyrics.trim() ? (
              <div className="whitespace-pre-wrap text-lg sm:text-xl leading-[1.9] text-[#EAE0E2]/90">
                {track.lyrics}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center py-12 space-y-3">
                <p className="text-sm text-[#8E7A7E]">No lyrics entered for this track.</p>
                <button
                  type="button"
                  onClick={() => {
                    setDraftLyrics('');
                    setIsEditingLyrics(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#991B1B]/40 hover:bg-[#991B1B]/65 border border-[#DC2626]/40 px-4 py-2 text-xs font-medium text-white"
                >
                  <Edit3 size={13} />
                  <span>Add Lyrics</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
