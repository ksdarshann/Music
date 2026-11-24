import {
  ArrowUpDown,
  Edit3,
  Heart,
  ListPlus,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Shuffle,
  Trash2,
  Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Playlist, Track } from '../types/music';
import { formatDuration, formatFileSize, formatTotalRuntime } from '../utils/formatters';
import { ArtworkImage } from './ArtworkImage';

type SortField = 'addedAt' | 'title' | 'artist' | 'album' | 'duration';

interface TrackListViewProps {
  mode: 'songs' | 'albums' | 'favorites' | 'recently-played' | 'playlist';
  tracks: Track[];
  allPlaylists: Playlist[];
  activePlaylist?: Playlist | null;
  currentTrackId: string | null;
  isPlaying: boolean;
  searchQuery: string;
  onPlayTrack: (track: Track, contextList: Track[]) => void;
  onTogglePlayPause: () => void;
  onToggleFavorite: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onRemoveFromPlaylist?: (playlistId: string, trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onEditTrack: (track: Track) => void;
  onRenamePlaylist?: (playlist: Playlist) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onTriggerUpload: () => void;
}

export function TrackListView({
  mode,
  tracks,
  allPlaylists,
  activePlaylist,
  currentTrackId,
  isPlaying,
  searchQuery,
  onPlayTrack,
  onTogglePlayPause,
  onToggleFavorite,
  onAddToQueue,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onDeleteTrack,
  onEditTrack,
  onRenamePlaylist,
  onDeletePlaylist,
  onTriggerUpload,
}: TrackListViewProps) {
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [openMenuTrackId, setOpenMenuTrackId] = useState<string | null>(null);

  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...tracks];

    if (mode === 'albums' && selectedAlbum) {
      list = list.filter((t) => t.album === selectedAlbum);
    }

    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)
      );
    }

    if (mode !== 'recently-played' && mode !== 'playlist') {
      list.sort((a, b) => {
        let cmp = 0;
        if (sortField === 'addedAt') cmp = a.addedAt - b.addedAt;
        else if (sortField === 'duration') cmp = a.duration - b.duration;
        else cmp = a[sortField].localeCompare(b[sortField]);
        return sortAsc ? cmp : -cmp;
      });
    }

    return list;
  }, [tracks, mode, selectedAlbum, searchQuery, sortField, sortAsc]);

  const albums = useMemo(() => {
    const map = new Map<string, { name: string; artist: string; artworkUrl?: string; tracks: Track[] }>();
    const q = searchQuery.trim().toLowerCase();
    for (const t of tracks) {
      if (
        q &&
        !t.album.toLowerCase().includes(q) &&
        !t.artist.toLowerCase().includes(q) &&
        !t.title.toLowerCase().includes(q)
      ) {
        continue;
      }
      const existing = map.get(t.album);
      if (existing) existing.tracks.push(t);
      else {
        map.set(t.album, {
          name: t.album,
          artist: t.artist,
          artworkUrl: t.artworkUrl,
          tracks: [t],
        });
      }
    }
    return Array.from(map.values());
  }, [tracks, searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(field !== 'addedAt');
    }
  };

  const handleShuffleList = () => {
    if (filteredTracks.length === 0) return;
    const shuffled = [...filteredTracks].sort(() => Math.random() - 0.5);
    onPlayTrack(shuffled[0], shuffled);
  };

  // Album Grid Overview
  if (mode === 'albums' && !selectedAlbum) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#F5EFEF]">Albums</h2>
            <p className="text-xs text-[#8E7A7E] mt-1 tabular-nums">
              {albums.length} {albums.length === 1 ? 'album' : 'albums'} · {tracks.length} tracks
            </p>
          </div>
        </div>

        {albums.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#120A0F]/80 p-10 text-center">
            <p className="text-sm text-[#A69598]">No albums match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
            {albums.map((alb) => {
              const totalDur = alb.tracks.reduce((sum, t) => sum + t.duration, 0);
              return (
                <div
                  key={alb.name}
                  onClick={() => setSelectedAlbum(alb.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedAlbum(alb.name);
                    }
                  }}
                  className="group cursor-pointer rounded-xl border border-white/[0.06] bg-[#130B10]/70 hover:bg-[#1B0F16]/90 hover:border-[#DC2626]/35 p-3.5 transition-all"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-3">
                    <ArtworkImage
                      src={alb.artworkUrl}
                      alt={alb.name}
                      className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(alb.tracks[0], alb.tracks);
                      }}
                      className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#DC2626] text-white opacity-0 group-hover:opacity-100 shadow-lg transition-all hover:scale-105"
                      aria-label={`Play ${alb.name}`}
                    >
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                  <p className="truncate text-sm font-medium text-[#F5EFEF]">{alb.name}</p>
                  <p className="truncate text-xs text-[#917D81] mt-0.5">{alb.artist}</p>
                  <p className="text-[11px] text-[#7A686C] mt-1 tabular-nums">
                    {alb.tracks.length} {alb.tracks.length === 1 ? 'track' : 'tracks'} ·{' '}
                    {formatTotalRuntime(totalDur)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const totalDur = filteredTracks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div className="space-y-1.5">
          {mode === 'albums' && selectedAlbum && (
            <button
              type="button"
              onClick={() => setSelectedAlbum(null)}
              className="text-xs font-medium text-[#EA580C] hover:text-[#FB923C] transition-colors"
            >
              All Albums /
            </button>
          )}
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5EFEF]">
            {mode === 'playlist' && activePlaylist
              ? activePlaylist.name
              : mode === 'albums' && selectedAlbum
                ? selectedAlbum
                : mode === 'favorites'
                  ? 'Favorites'
                  : mode === 'recently-played'
                    ? 'Recently Played'
                    : 'All Songs'}
          </h2>
          {mode === 'playlist' && activePlaylist?.description && (
            <p className="text-sm text-[#A69598]">{activePlaylist.description}</p>
          )}
          <p className="text-xs text-[#8E7A7E] tabular-nums">
            {filteredTracks.length} {filteredTracks.length === 1 ? 'track' : 'tracks'} ·{' '}
            {formatTotalRuntime(totalDur)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {filteredTracks.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => onPlayTrack(filteredTracks[0], filteredTracks)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#991B1B] to-[#C2410C] hover:from-[#B91C1C] hover:to-[#EA580C] px-4 py-2 text-xs font-medium text-white transition-all whitespace-nowrap"
              >
                <Play size={14} fill="currentColor" />
                <span>Play All</span>
              </button>
              <button
                type="button"
                onClick={handleShuffleList}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] px-4 py-2 text-xs font-medium text-[#F5EFEF] transition-colors whitespace-nowrap"
              >
                <Shuffle size={14} />
                <span>Shuffle</span>
              </button>
            </>
          )}

          {mode === 'playlist' && activePlaylist && onRenamePlaylist && onDeletePlaylist && (
            <>
              <button
                type="button"
                onClick={() => onRenamePlaylist(activePlaylist)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-2 text-xs text-[#D6C4C7] transition-colors whitespace-nowrap"
              >
                <Edit3 size={13} />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={() => onDeletePlaylist(activePlaylist.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DC2626]/30 bg-[#991B1B]/15 hover:bg-[#991B1B]/35 px-3 py-2 text-xs text-[#FCA5A5] transition-colors whitespace-nowrap"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredTracks.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-[#120A0F]/80 p-10 text-center">
          <p className="text-sm text-[#A69598]">
            {searchQuery
              ? 'No tracks matched your search.'
              : mode === 'favorites'
                ? 'No favorite tracks yet. Click the heart icon on any track to save it here.'
                : mode === 'playlist'
                  ? 'This playlist has no tracks yet. Use the menu on any song to add it here.'
                  : 'Your library is empty. Upload MP3 or WAV files to start listening.'}
          </p>
          {mode === 'songs' && !searchQuery && (
            <button
              type="button"
              onClick={onTriggerUpload}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#991B1B] hover:bg-[#B91C1C] px-5 py-2.5 text-sm font-medium text-white transition-colors"
            >
              <Upload size={15} />
              <span>Upload Audio Files</span>
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-[#11090E]/80 backdrop-blur-xl">
          {/* Table Column Header */}
          <div className="hidden md:grid grid-cols-[44px_minmax(0,2fr)_minmax(0,1.2fr)_100px_76px_116px] items-center gap-3 border-b border-white/[0.07] px-4 py-3 text-xs font-medium text-[#7A686C]">
            <span className="text-center">#</span>
            <button
              type="button"
              onClick={() => handleSort('title')}
              className="flex items-center gap-1.5 text-left hover:text-[#F5EFEF] transition-colors"
            >
              <span>Title</span>
              {sortField === 'title' && <ArrowUpDown size={12} />}
            </button>
            <button
              type="button"
              onClick={() => handleSort('album')}
              className="flex items-center gap-1.5 text-left hover:text-[#F5EFEF] transition-colors"
            >
              <span>Album</span>
              {sortField === 'album' && <ArrowUpDown size={12} />}
            </button>
            <span>Format</span>
            <button
              type="button"
              onClick={() => handleSort('duration')}
              className="flex items-center justify-end gap-1.5 hover:text-[#F5EFEF] transition-colors"
            >
              <span>Time</span>
              {sortField === 'duration' && <ArrowUpDown size={12} />}
            </button>
            <span className="text-right pr-2">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filteredTracks.map((track, idx) => {
              const active = currentTrackId === track.id;
              const menuOpen = openMenuTrackId === track.id;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onDoubleClick={() => onPlayTrack(track, filteredTracks)}
                  className={`group relative grid grid-cols-[36px_minmax(0,1fr)_auto] md:grid-cols-[44px_minmax(0,2fr)_minmax(0,1.2fr)_100px_76px_116px] items-center gap-3 px-3 sm:px-4 py-2.5 transition-colors ${
                    active ? 'bg-[#991B1B]/18' : 'hover:bg-white/[0.035]'
                  }`}
                >
                  {/* Index / Play Toggle */}
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (active) onTogglePlayPause();
                        else onPlayTrack(track, filteredTracks);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-[#A69598] hover:text-white"
                      aria-label={active && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                    >
                      {active && isPlaying ? (
                        <span className="flex items-end gap-0.5 h-3.5" aria-hidden="true">
                          <span className="w-0.5 h-full bg-[#EA580C] animate-eq-1 rounded-full" />
                          <span className="w-0.5 h-full bg-[#DC2626] animate-eq-2 rounded-full" />
                          <span className="w-0.5 h-full bg-[#EA580C] animate-eq-3 rounded-full" />
                        </span>
                      ) : active ? (
                        <Play size={14} fill="currentColor" className="text-[#EA580C]" />
                      ) : (
                        <>
                          <span className="text-xs font-mono-tabular text-[#7A686C] group-hover:hidden">
                            {idx + 1}
                          </span>
                          <Play
                            size={14}
                            fill="currentColor"
                            className="hidden group-hover:block text-[#F5EFEF]"
                          />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Artwork + Title & Artist */}
                  <div
                    onClick={() => onPlayTrack(track, filteredTracks)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                  >
                    <ArtworkImage
                      src={track.artworkUrl}
                      alt={track.title}
                      className="h-10 w-10 rounded-md shrink-0 border border-white/10"
                      iconSize={16}
                    />
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-medium ${
                          active ? 'text-[#FB923C]' : 'text-[#F5EFEF]'
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-[#8E7A7E]">{track.artist}</p>
                    </div>
                  </div>

                  {/* Album (Desktop) */}
                  <div className="hidden md:block min-w-0">
                    <p className="truncate text-xs text-[#A69598]">{track.album}</p>
                  </div>

                  {/* Format & Size (Desktop) */}
                  <div className="hidden md:block text-xs text-[#7A686C] tabular-nums truncate">
                    {track.format} · {formatFileSize(track.fileSize)}
                  </div>

                  {/* Duration (Desktop) */}
                  <div className="hidden md:block text-right text-xs font-mono-tabular text-[#A69598]">
                    {formatDuration(track.duration)}
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(track.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        track.isFavorite
                          ? 'text-[#F87171]'
                          : 'text-[#7A686C] hover:text-[#F5EFEF]'
                      }`}
                      aria-label={track.isFavorite ? 'Remove favorite' : 'Mark favorite'}
                    >
                      <Heart size={15} fill={track.isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddToQueue(track)}
                      className="hidden sm:inline-flex p-2 rounded-lg text-[#7A686C] hover:text-[#F5EFEF] transition-colors"
                      aria-label={`Add ${track.title} to queue`}
                      title="Add to Queue"
                    >
                      <ListPlus size={15} />
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuTrackId(menuOpen ? null : track.id)}
                        className="p-2 rounded-lg text-[#7A686C] hover:text-[#F5EFEF] transition-colors"
                        aria-label={`More actions for ${track.title}`}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {menuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setOpenMenuTrackId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-40 w-52 rounded-xl border border-white/10 bg-[#150C12] p-1.5 shadow-2xl">
                            <button
                              type="button"
                              onClick={() => {
                                onAddToQueue(track);
                                setOpenMenuTrackId(null);
                              }}
                              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[#E8DCDC] hover:bg-white/[0.06]"
                            >
                              <ListPlus size={14} />
                              <span>Add to Up Next</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onEditTrack(track);
                                setOpenMenuTrackId(null);
                              }}
                              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[#E8DCDC] hover:bg-white/[0.06]"
                            >
                              <Edit3 size={14} />
                              <span>Edit Info & Lyrics</span>
                            </button>

                            {allPlaylists.length > 0 && (
                              <div className="my-1 border-t border-white/[0.07] pt-1">
                                <p className="px-3 py-1 text-[10px] font-medium text-[#7A686C]">
                                  Add to Playlist
                                </p>
                                {allPlaylists.map((pl) => (
                                  <button
                                    key={pl.id}
                                    type="button"
                                    onClick={() => {
                                      onAddToPlaylist(pl.id, track.id);
                                      setOpenMenuTrackId(null);
                                    }}
                                    className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-[#D6C4C7] hover:bg-white/[0.06]"
                                  >
                                    <Plus size={13} className="shrink-0 text-[#EA580C]" />
                                    <span className="truncate">{pl.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {mode === 'playlist' && activePlaylist && onRemoveFromPlaylist && (
                              <button
                                type="button"
                                onClick={() => {
                                  onRemoveFromPlaylist(activePlaylist.id, track.id);
                                  setOpenMenuTrackId(null);
                                }}
                                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[#FDBA74] hover:bg-white/[0.06]"
                              >
                                <Trash2 size={14} />
                                <span>Remove from Playlist</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-white/[0.07] pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteTrack(track.id);
                                  setOpenMenuTrackId(null);
                                }}
                                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[#F87171] hover:bg-[#991B1B]/25"
                              >
                                <Trash2 size={14} />
                                <span>Delete from Vault</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
