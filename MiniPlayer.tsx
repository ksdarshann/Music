import {
  GripHorizontal,
  Heart,
  Maximize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { Track } from '../types/music';
import { formatDuration } from '../utils/formatters';
import { ArtworkImage } from './ArtworkImage';
import { AudioVisualizer } from './AudioVisualizer';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onChangeVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleFavorite: (trackId: string) => void;
  onRestoreFull: () => void;
}

export function MiniPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onChangeVolume,
  onToggleMute,
  onToggleFavorite,
  onRestoreFull,
}: MiniPlayerProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    setOffset({
      x: dragStartRef.current.origX + (e.clientX - dragStartRef.current.startX),
      y: dragStartRef.current.origY + (e.clientY - dragStartRef.current.startY),
    });
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const effectiveVol = isMuted ? 0 : volume;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      <div
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
        className="pointer-events-auto w-full max-w-[360px] rounded-2xl border border-[#DC2626]/35 bg-[#0D070B]/95 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        {/* Drag Handle Header */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-2 text-xs text-[#A69598]">
            <GripHorizontal size={15} />
            <span className="font-display font-semibold tracking-wider text-[#F5EFEF]">
              Nocturne
            </span>
          </div>

          <button
            type="button"
            onClick={onRestoreFull}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1 text-[11px] font-medium text-[#F5EFEF] transition-colors"
          >
            <Maximize2 size={12} />
            <span>Expand</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {currentTrack ? (
            <>
              <div className="flex items-center gap-3.5">
                <ArtworkImage
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="h-16 w-16 rounded-xl shrink-0 border border-white/10 shadow-lg"
                  iconSize={26}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-semibold text-[#F5EFEF]">
                    {currentTrack.title}
                  </p>
                  <p className="truncate text-xs text-[#917D81] mt-0.5">{currentTrack.artist}</p>
                  <p className="truncate text-[11px] text-[#7A686C] mt-0.5">{currentTrack.album}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(currentTrack.id)}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    currentTrack.isFavorite
                      ? 'text-[#F87171]'
                      : 'text-[#7A686C] hover:text-white'
                  }`}
                  aria-label="Toggle favorite"
                >
                  <Heart size={16} fill={currentTrack.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-black/45 px-2 py-1.5">
                <AudioVisualizer isPlaying={isPlaying} mode="bars" height={42} compact />
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  aria-label="Seek position"
                  className="gothic-slider w-full"
                  style={{
                    background: `linear-gradient(to right, #DC2626 ${progress}%, rgba(255,255,255,0.14) ${progress}%)`,
                    height: '4px',
                    borderRadius: '9999px',
                  }}
                />
                <div className="flex justify-between text-[11px] font-mono-tabular text-[#8E7A7E]">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className="p-1.5 text-[#8E7A7E] hover:text-white"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={effectiveVol}
                    onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                    aria-label="Volume"
                    className="gothic-slider w-20"
                    style={{
                      background: `linear-gradient(to right, #EA580C ${effectiveVol * 100}%, rgba(255,255,255,0.14) ${effectiveVol * 100}%)`,
                      height: '4px',
                      borderRadius: '9999px',
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPrev}
                    className="p-2 text-[#D6C4C7] hover:text-white"
                    aria-label="Previous"
                  >
                    <SkipBack size={17} fill="currentColor" />
                  </button>
                  <button
                    type="button"
                    onClick={onTogglePlayPause}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#EA580C] text-white shadow-lg"
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
                    className="p-2 text-[#D6C4C7] hover:text-white"
                    aria-label="Next"
                  >
                    <SkipForward size={17} fill="currentColor" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-[#8E7A7E]">No track currently playing.</p>
              <button
                type="button"
                onClick={onRestoreFull}
                className="rounded-lg bg-[#991B1B] px-4 py-2 text-xs font-medium text-white"
              >
                Open Lounge
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
