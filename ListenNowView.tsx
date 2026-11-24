import { Disc3, Heart, Pause, Play, Shuffle, Sliders, Upload } from 'lucide-react';
import type { Playlist, Track, VisualizerMode } from '../types/music';
import { formatDuration, formatTotalRuntime } from '../utils/formatters';
import { ArtworkImage } from './ArtworkImage';
import { AudioVisualizer } from './AudioVisualizer';

interface ListenNowViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  recentlyPlayed: Track[];
  playlists: Playlist[];
  visualizerMode: VisualizerMode;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  onPlayTrack: (track: Track, contextList?: Track[]) => void;
  onTogglePlayPause: () => void;
  onShuffleAll: () => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenPlaylist: (playlistId: string) => void;
  onOpenEqualizer: () => void;
  onOpenImmersive: () => void;
  onTriggerUpload: () => void;
}

export function ListenNowView({
  tracks,
  currentTrack,
  isPlaying,
  recentlyPlayed,
  playlists,
  visualizerMode,
  onChangeVisualizerMode,
  onPlayTrack,
  onTogglePlayPause,
  onShuffleAll,
  onToggleFavorite,
  onOpenPlaylist,
  onOpenEqualizer,
  onOpenImmersive,
  onTriggerUpload,
}: ListenNowViewProps) {
  const heroTrack = currentTrack ?? tracks[0] ?? null;
  const favorites = tracks.filter((t) => t.isFavorite);
  const totalRuntime = tracks.reduce((acc, t) => acc + t.duration, 0);

  // Group into albums for quick visual browsing
  const albumMap = new Map<string, { album: string; artist: string; artworkUrl?: string; tracks: Track[] }>();
  for (const t of tracks) {
    const existing = albumMap.get(t.album);
    if (existing) {
      existing.tracks.push(t);
    } else {
      albumMap.set(t.album, {
        album: t.album,
        artist: t.artist,
        artworkUrl: t.artworkUrl,
        tracks: [t],
      });
    }
  }
  const albums = Array.from(albumMap.values()).slice(0, 6);

  if (tracks.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-16 px-4 text-center">
        <div className="rounded-2xl border border-white/[0.08] bg-[#120A0F]/80 backdrop-blur-xl p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#991B1B]/20 border border-[#DC2626]/30 text-[#EA580C]">
            <Disc3 size={30} />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5EFEF] [text-wrap:balance]">
            Your Gothic Vault Awaits
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#A69598] leading-relaxed">
            Drop MP3, WAV, FLAC, or OGG audio files anywhere in the lounge. Embedded album art,
            titles, and lyrics are preserved locally in your browser vault.
          </p>
          <button
            type="button"
            onClick={onTriggerUpload}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#991B1B] to-[#C2410C] hover:from-[#B91C1C] hover:to-[#EA580C] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(153,27,27,0.4)] transition-all whitespace-nowrap"
          >
            <Upload size={16} />
            <span>Upload MP3 / WAV Files</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-8">
      {/* Hero Lounge Showcase */}
      {heroTrack && (
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#120A0F]/85 backdrop-blur-xl">
          {/* Scrimmed Artwork Background */}
          <div className="pointer-events-none absolute inset-0">
            <ArtworkImage
              src={heroTrack.artworkUrl}
              alt=""
              className="h-full w-full opacity-25 blur-2xl scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090508]/95 via-[#0F080C]/85 to-[#180A0D]/75" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <button
                type="button"
                onClick={onOpenImmersive}
                className="group relative h-36 w-36 sm:h-44 sm:w-44 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.65)]"
                title="Open Visualizer Stage"
              >
                <ArtworkImage
                  src={heroTrack.artworkUrl}
                  alt={`${heroTrack.title} artwork`}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                  iconSize={40}
                />
              </button>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#D6B8B8]">
                  <span>{currentTrack ? 'Now Playing' : 'Featured in Vault'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{heroTrack.album}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{formatDuration(heroTrack.duration)}</span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#F5EFEF] tracking-wide [text-wrap:balance]">
                  {heroTrack.title}
                </h2>
                <p className="text-sm sm:text-base text-[#B8A5A8]">{heroTrack.artist}</p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentTrack?.id === heroTrack.id) {
                        onTogglePlayPause();
                      } else {
                        onPlayTrack(heroTrack, tracks);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#991B1B] to-[#C2410C] hover:from-[#B91C1C] hover:to-[#EA580C] px-5 py-2.5 text-sm font-medium text-white shadow-[0_6px_20px_rgba(185,28,28,0.4)] transition-all whitespace-nowrap shrink-0"
                  >
                    {currentTrack?.id === heroTrack.id && isPlaying ? (
                      <>
                        <Pause size={16} fill="currentColor" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="currentColor" />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onShuffleAll}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] px-4 py-2.5 text-sm font-medium text-[#F5EFEF] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Shuffle size={15} />
                    <span>Shuffle Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFavorite(heroTrack.id)}
                    className={`p-2.5 rounded-lg border transition-colors shrink-0 ${
                      heroTrack.isFavorite
                        ? 'border-[#DC2626]/50 bg-[#991B1B]/25 text-[#F87171]'
                        : 'border-white/10 bg-white/[0.03] text-[#A69598] hover:text-white'
                    }`}
                    aria-label={heroTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={16} fill={heroTrack.isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={onOpenEqualizer}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3.5 py-2.5 text-xs font-medium text-[#D6C4C7] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Sliders size={14} />
                    <span>Equalizer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Reactive Visualizer Strip */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-white/[0.07] bg-[#0A0508]/75 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-[#A69598]">Spectrum</span>
                <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-0.5">
                  {(['bars', 'wave', 'radial'] as VisualizerMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onChangeVisualizerMode(mode)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                        visualizerMode === mode
                          ? 'bg-[#991B1B]/60 text-white'
                          : 'text-[#8F7B7F] hover:text-[#F5EFEF]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <AudioVisualizer
                isPlaying={isPlaying}
                mode={visualizerMode}
                height={116}
                compact
              />

              <div className="mt-3 flex items-center justify-between text-xs text-[#7A686C]">
                <span className="tabular-nums">{tracks.length} tracks in vault</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatTotalRuntime(totalRuntime)} total</span>
                <button
                  type="button"
                  onClick={onOpenImmersive}
                  className="text-[#EA580C] hover:text-[#FB923C] font-medium transition-colors whitespace-nowrap"
                >
                  Open Stage
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recently Played Shelf */}
      {recentlyPlayed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl font-semibold text-[#F5EFEF]">Recently Played</h3>
            <span className="text-xs text-[#7A686C] tabular-nums">
              {recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {recentlyPlayed.slice(0, 6).map((track) => {
              const active = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track, recentlyPlayed)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPlayTrack(track, recentlyPlayed);
                    }
                  }}
                  className="group cursor-pointer rounded-xl border border-white/[0.06] bg-[#130B10]/70 hover:bg-[#1B0F16]/90 hover:border-[#DC2626]/35 p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-3">
                    <ArtworkImage
                      src={track.artworkUrl}
                      alt={track.title}
                      className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity ${
                        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DC2626] text-white shadow-lg">
                        {active && isPlaying ? (
                          <Pause size={16} fill="currentColor" />
                        ) : (
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        )}
                      </span>
                    </div>
                  </div>
                  <p className="truncate text-sm font-medium text-[#F5EFEF]">{track.title}</p>
                  <p className="truncate text-xs text-[#917D81] mt-0.5">{track.artist}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Albums & Curated Playlists Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Albums */}
        <section className="xl:col-span-7 space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl font-semibold text-[#F5EFEF]">Vault Albums</h3>
            <span className="text-xs text-[#7A686C] tabular-nums">{albums.length} albums</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {albums.map((alb) => (
              <button
                key={alb.album}
                type="button"
                onClick={() => onPlayTrack(alb.tracks[0], alb.tracks)}
                className="group text-left rounded-xl border border-white/[0.06] bg-[#130B10]/70 hover:bg-[#1B0F16]/90 hover:border-[#EA580C]/35 p-3 transition-all"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-3">
                  <ArtworkImage
                    src={alb.artworkUrl}
                    alt={alb.album}
                    className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="truncate text-sm font-medium text-[#F5EFEF]">{alb.album}</p>
                <p className="truncate text-xs text-[#917D81] mt-0.5">
                  {alb.artist} · <span className="tabular-nums">{alb.tracks.length}</span>{' '}
                  {alb.tracks.length === 1 ? 'track' : 'tracks'}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Favorites & Playlists Summary */}
        <section className="xl:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-xl font-semibold text-[#F5EFEF]">Favorites</h3>
              <span className="text-xs text-[#7A686C] tabular-nums">{favorites.length} saved</span>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#130B10]/70 divide-y divide-white/[0.05]">
              {favorites.length === 0 ? (
                <p className="p-5 text-sm text-[#8E7A7E]">
                  Mark tracks with a heart to keep your favorite nocturnal pieces within reach.
                </p>
              ) : (
                favorites.slice(0, 4).map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => onPlayTrack(track, favorites)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ArtworkImage
                        src={track.artworkUrl}
                        alt={track.title}
                        className="h-10 w-10 rounded-md shrink-0"
                        iconSize={16}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#F5EFEF]">{track.title}</p>
                        <p className="truncate text-xs text-[#917D81]">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono-tabular text-[#8E7A7E] shrink-0">
                      {formatDuration(track.duration)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Playlists List */}
          {playlists.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-xl font-semibold text-[#F5EFEF]">Your Playlists</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
                {playlists.slice(0, 6).map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => onOpenPlaylist(pl.id)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#130B10]/70 hover:bg-[#1B0F16]/90 hover:border-[#DC2626]/35 px-4 py-3 text-left transition-all"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#F5EFEF]">{pl.name}</p>
                      <p className="truncate text-xs text-[#8E7A7E]">
                        {pl.description || 'Custom collection'}
                      </p>
                    </div>
                    <span className="text-xs tabular-nums text-[#A69598] shrink-0">
                      {pl.trackIds.length} tracks
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
