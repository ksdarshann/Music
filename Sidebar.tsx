import {
  Clock,
  Disc3,
  Heart,
  ListMusic,
  Music2,
  Plus,
  Sliders,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { NavSection, Playlist } from '../types/music';

interface SidebarProps {
  activeSection: NavSection;
  activePlaylistId: string | null;
  playlists: Playlist[];
  trackCount: number;
  favoritesCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectSection: (section: NavSection, playlistId?: string) => void;
  onOpenCreatePlaylist: () => void;
  onTriggerUpload: () => void;
  onOpenImmersive: () => void;
}

export function Sidebar({
  activeSection,
  activePlaylistId,
  playlists,
  trackCount,
  favoritesCount,
  isOpenMobile,
  onCloseMobile,
  onSelectSection,
  onOpenCreatePlaylist,
  onTriggerUpload,
  onOpenImmersive,
}: SidebarProps) {
  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-gradient-to-r from-[#991B1B]/35 to-[#EA580C]/15 text-[#F5EFEF] border border-[#DC2626]/35'
        : 'text-[#A69598] hover:text-[#F5EFEF] hover:bg-white/[0.04] border border-transparent'
    }`;

  const content = (
    <div className="flex h-full flex-col justify-between bg-[#0B070A]/90 backdrop-blur-xl border-r border-white/[0.07] px-4 py-5">
      <div className="flex flex-col gap-6 overflow-y-auto pr-1">
        {/* Brand Wordmark */}
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => {
              onSelectSection('listen-now');
              onCloseMobile();
            }}
            className="font-display text-2xl font-semibold tracking-[0.08em] text-[#F5EFEF] hover:text-[#FB923C] transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Nocturne
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-lg text-[#A69598] hover:text-white hover:bg-white/5"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lounge Navigation */}
        <div className="space-y-1">
          <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wider text-[#7A686C]">
            Lounge
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectSection('listen-now');
              onCloseMobile();
            }}
            className={navItemClass(activeSection === 'listen-now')}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Sparkles size={16} className="text-[#DC2626] shrink-0" />
              <span>Listen Now</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenImmersive();
              onCloseMobile();
            }}
            className={navItemClass(false)}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Disc3 size={16} className="text-[#EA580C] shrink-0" />
              <span>Visualizer Stage</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectSection('equalizer');
              onCloseMobile();
            }}
            className={navItemClass(activeSection === 'equalizer')}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Sliders size={16} className="text-[#DC2626] shrink-0" />
              <span>Equalizer</span>
            </span>
          </button>
        </div>

        {/* Library Collection */}
        <div className="space-y-1">
          <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wider text-[#7A686C]">
            Library
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectSection('songs');
              onCloseMobile();
            }}
            className={navItemClass(activeSection === 'songs')}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Music2 size={16} className="shrink-0" />
              <span>Songs</span>
            </span>
            <span className="text-xs tabular-nums text-[#7A686C]">{trackCount}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectSection('albums');
              onCloseMobile();
            }}
            className={navItemClass(activeSection === 'albums')}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Disc3 size={16} className="shrink-0" />
              <span>Albums</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectSection('favorites');
              onCloseMobile();
            }}
            className={navItemClass(activeSection === 'favorites')}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Heart size={16} className="shrink-0" />
              <span>Favorites</span>
            </span>
            <span className="text-xs tabular-nums text-[#7A686C]">{favoritesCount}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectSection('recently-played');
              onCloseMobile();
            }}
            className={navItemClass(activeSection === 'recently-played')}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Clock size={16} className="shrink-0" />
              <span>Recently Played</span>
            </span>
          </button>
        </div>

        {/* Playlists */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 pb-1.5">
            <p className="text-[11px] font-medium tracking-wider text-[#7A686C]">Playlists</p>
            <button
              type="button"
              onClick={onOpenCreatePlaylist}
              className="p-1 rounded-md text-[#A69598] hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Create playlist"
              title="Create Playlist"
            >
              <Plus size={15} />
            </button>
          </div>
          {playlists.length === 0 ? (
            <button
              type="button"
              onClick={onOpenCreatePlaylist}
              className="w-full px-3 py-2 text-left text-xs text-[#7A686C] hover:text-[#A69598] transition-colors"
            >
              Create your first playlist
            </button>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => {
                  onSelectSection('playlist', pl.id);
                  onCloseMobile();
                }}
                className={navItemClass(
                  activeSection === 'playlist' && activePlaylistId === pl.id
                )}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <ListMusic size={15} className="shrink-0 text-[#EA580C]/80" />
                  <span className="truncate">{pl.name}</span>
                </span>
                <span className="text-xs tabular-nums text-[#7A686C]">{pl.trackIds.length}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Bottom Upload Trigger */}
      <div className="pt-4 border-t border-white/[0.07]">
        <button
          type="button"
          onClick={() => {
            onTriggerUpload();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#991B1B] to-[#C2410C] hover:from-[#B91C1C] hover:to-[#EA580C] text-white text-sm font-medium shadow-[0_6px_20px_rgba(153,27,27,0.35)] transition-all whitespace-nowrap shrink-0"
        >
          <Upload size={16} />
          <span>Upload Audio</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[256px] shrink-0 h-full">{content}</aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[272px] max-w-[85vw] h-full">{content}</aside>
        </div>
      )}
    </>
  );
}
