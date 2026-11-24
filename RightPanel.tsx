import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  FileText,
  ListMusic,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RightPanelTab, Track } from '../types/music';
import { formatDuration } from '../utils/formatters';
import { ArtworkImage } from './ArtworkImage';

interface RightPanelProps {
  activeTab: RightPanelTab;
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  onChangeTab: (tab: RightPanelTab) => void;
  onSaveLyrics: (trackId: string, lyrics: string) => void;
  onPlayFromQueue: (index: number) => void;
  onMoveQueueItem: (index: number, direction: 'up' | 'down') => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  onPlayHistoryTrack: (track: Track) => void;
}

export function RightPanel({
  activeTab,
  currentTrack,
  queue,
  history,
  onChangeTab,
  onSaveLyrics,
  onPlayFromQueue,
  onMoveQueueItem,
  onRemoveFromQueue,
  onClearQueue,
  onPlayHistoryTrack,
}: RightPanelProps) {
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [draftLyrics, setDraftLyrics] = useState('');

  useEffect(() => {
    setIsEditingLyrics(false);
    setDraftLyrics(currentTrack?.lyrics ?? '');
  }, [currentTrack?.id, currentTrack?.lyrics]);

  if (!activeTab) return null;

  const handleSave = () => {
    if (!currentTrack) return;
    onSaveLyrics(currentTrack.id, draftLyrics);
    setIsEditingLyrics(false);
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[360px] xl:static xl:z-10 xl:w-[340px] shrink-0 flex flex-col border-l border-white/[0.08] bg-[#0B0609]/95 backdrop-blur-2xl">
      {/* Header Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3.5">
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => onChangeTab('lyrics')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'lyrics'
                ? 'bg-[#991B1B]/65 text-white'
                : 'text-[#917D81] hover:text-[#F5EFEF]'
            }`}
          >
            <FileText size={13} />
            <span>Lyrics</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeTab('queue')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'queue'
                ? 'bg-[#991B1B]/65 text-white'
                : 'text-[#917D81] hover:text-[#F5EFEF]'
            }`}
          >
            <ListMusic size={13} />
            <span>Up Next</span>
            {queue.length > 0 && (
              <span className="text-[11px] font-mono-tabular opacity-80">{queue.length}</span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onChangeTab(null)}
          className="p-1.5 rounded-lg text-[#8E7A7E] hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Close side panel"
        >
          <X size={17} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 pb-28 xl:pb-6">
        {activeTab === 'lyrics' ? (
          currentTrack ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold text-[#F5EFEF] truncate">
                    {currentTrack.title}
                  </h3>
                  <p className="text-xs text-[#8E7A7E] truncate">{currentTrack.artist}</p>
                </div>

                {!isEditingLyrics ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftLyrics(currentTrack.lyrics);
                      setIsEditingLyrics(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#E8DCDC] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Edit3 size={12} />
                    <span>Edit Lyrics</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#991B1B] hover:bg-[#B91C1C] px-2.5 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      <Check size={12} />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftLyrics(currentTrack.lyrics);
                        setIsEditingLyrics(false);
                      }}
                      className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-[#A69598] hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingLyrics ? (
                <textarea
                  value={draftLyrics}
                  onChange={(e) => setDraftLyrics(e.target.value)}
                  rows={16}
                  placeholder="Write or paste lyrics here..."
                  className="w-full rounded-xl border border-[#DC2626]/40 bg-[#140B10] p-4 text-sm leading-relaxed text-[#F5EFEF] placeholder:text-[#6B5A5E] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              ) : currentTrack.lyrics.trim() ? (
                <div className="whitespace-pre-wrap text-[15px] leading-[1.85] text-[#E6D9DC] font-normal">
                  {currentTrack.lyrics}
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 text-center space-y-3">
                  <p className="text-sm text-[#8E7A7E]">
                    No lyrics stored for this track yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftLyrics('');
                      setIsEditingLyrics(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#991B1B]/40 hover:bg-[#991B1B]/65 border border-[#DC2626]/40 px-4 py-2 text-xs font-medium text-white transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>Add Lyrics</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#8E7A7E]">Select a track to view or edit its lyrics.</p>
          )
        ) : (
          <div className="space-y-6">
            {/* Currently Playing */}
            {currentTrack && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#7A686C]">Playing Now</p>
                <div className="flex items-center gap-3 rounded-xl border border-[#DC2626]/30 bg-[#991B1B]/15 p-2.5">
                  <ArtworkImage
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="h-11 w-11 rounded-md shrink-0"
                    iconSize={18}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#FB923C]">
                      {currentTrack.title}
                    </p>
                    <p className="truncate text-xs text-[#A69598]">{currentTrack.artist}</p>
                  </div>
                  <span className="text-xs font-mono-tabular text-[#8E7A7E]">
                    {formatDuration(currentTrack.duration)}
                  </span>
                </div>
              </div>
            )}

            {/* Up Next Queue */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[#7A686C]">
                  Up Next ({queue.length})
                </p>
                {queue.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearQueue}
                    className="text-xs text-[#DC2626] hover:text-[#F87171] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-[#7A686C]">
                  Queue is clear. Add tracks from your library using the queue icon.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {queue.map((track, idx) => (
                    <div
                      key={`${track.id}-${idx}`}
                      className="group flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] p-2 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onPlayFromQueue(idx)}
                        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md"
                        aria-label={`Play ${track.title}`}
                      >
                        <ArtworkImage
                          src={track.artworkUrl}
                          alt={track.title}
                          className="h-full w-full"
                          iconSize={14}
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={12} fill="currentColor" className="text-white" />
                        </span>
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[#F5EFEF]">
                          {track.title}
                        </p>
                        <p className="truncate text-[11px] text-[#8E7A7E]">{track.artist}</p>
                      </div>

                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onMoveQueueItem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-[#7A686C] hover:text-white disabled:opacity-25"
                          aria-label="Move up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveQueueItem(idx, 'down')}
                          disabled={idx === queue.length - 1}
                          className="p-1 text-[#7A686C] hover:text-white disabled:opacity-25"
                          aria-label="Move down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveFromQueue(idx)}
                          className="p-1 text-[#7A686C] hover:text-[#F87171]"
                          aria-label="Remove from queue"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                <p className="text-xs font-medium text-[#7A686C]">History</p>
                <div className="space-y-1">
                  {history.slice(0, 6).map((track, idx) => (
                    <button
                      key={`${track.id}-hist-${idx}`}
                      type="button"
                      onClick={() => onPlayHistoryTrack(track)}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.04] transition-colors"
                    >
                      <ArtworkImage
                        src={track.artworkUrl}
                        alt={track.title}
                        className="h-8 w-8 rounded shrink-0"
                        iconSize={12}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-[#D6C4C7]">{track.title}</p>
                        <p className="truncate text-[11px] text-[#7A686C]">{track.artist}</p>
                      </div>
                      <span className="text-[11px] font-mono-tabular text-[#7A686C]">
                        {formatDuration(track.duration)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
