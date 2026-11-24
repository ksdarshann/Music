import { ImagePlus, Upload, X } from 'lucide-react';
import { useState } from 'react';
import type { Playlist, Track } from '../types/music';
import { ArtworkImage } from './ArtworkImage';

interface PlaylistModalProps {
  initialPlaylist?: Playlist | null;
  onClose: () => void;
  onSave: (name: string, description: string, existingId?: string) => void;
}

export function PlaylistModal({ initialPlaylist, onClose, onSave }: PlaylistModalProps) {
  const [name, setName] = useState(initialPlaylist?.name ?? '');
  const [description, setDescription] = useState(initialPlaylist?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), initialPlaylist?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#120A0F] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
          <h3 className="font-display text-lg font-semibold text-[#F5EFEF]">
            {initialPlaylist ? 'Rename Playlist' : 'New Playlist'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E7A7E] hover:text-white"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="playlist-name" className="block text-xs font-medium text-[#B8A5A8]">
              Playlist Name
            </label>
            <input
              id="playlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Midnight Organ"
              autoFocus
              required
              className="w-full rounded-lg border border-white/10 bg-[#0A0508] px-3.5 py-2.5 text-sm text-[#F5EFEF] focus:border-[#DC2626] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="playlist-desc" className="block text-xs font-medium text-[#B8A5A8]">
              Description (Optional)
            </label>
            <input
              id="playlist-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mood or theme"
              className="w-full rounded-lg border border-white/10 bg-[#0A0508] px-3.5 py-2.5 text-sm text-[#F5EFEF] focus:border-[#DC2626] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-[#A69598] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-[#991B1B] to-[#C2410C] hover:from-[#B91C1C] hover:to-[#EA580C] px-5 py-2 text-xs font-medium text-white"
            >
              {initialPlaylist ? 'Save Changes' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditTrackModalProps {
  track: Track;
  onClose: () => void;
  onSave: (updated: Track) => void;
}

export function EditTrackModal({ track, onClose, onSave }: EditTrackModalProps) {
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album);
  const [lyrics, setLyrics] = useState(track.lyrics);
  const [artworkUrl, setArtworkUrl] = useState(track.artworkUrl ?? '');

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setArtworkUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...track,
      title: title.trim() || track.title,
      artist: artist.trim() || 'Unknown Artist',
      album: album.trim() || 'Midnight Sessions',
      lyrics,
      artworkUrl: artworkUrl || track.artworkUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#120A0F] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
          <h3 className="font-display text-lg font-semibold text-[#F5EFEF]">Edit Track Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E7A7E] hover:text-white"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="flex items-center gap-4">
            <ArtworkImage
              src={artworkUrl}
              alt={title}
              className="h-20 w-20 rounded-xl border border-white/10 shrink-0"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] px-3.5 py-2 text-xs font-medium text-[#E8DCDC] transition-colors">
              <ImagePlus size={14} />
              <span>Change Cover Artwork</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-medium text-[#B8A5A8]">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-[#0A0508] px-3.5 py-2 text-sm text-[#F5EFEF] focus:border-[#DC2626] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#B8A5A8]">Artist</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A0508] px-3.5 py-2 text-sm text-[#F5EFEF] focus:border-[#DC2626] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#B8A5A8]">Album</label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A0508] px-3.5 py-2 text-sm text-[#F5EFEF] focus:border-[#DC2626] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#B8A5A8]">Lyrics</label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={6}
              placeholder="Write or paste lyrics..."
              className="w-full rounded-lg border border-white/10 bg-[#0A0508] p-3 text-sm text-[#F5EFEF] focus:border-[#DC2626] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-[#A69598] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-[#991B1B] to-[#C2410C] px-5 py-2 text-xs font-medium text-white"
            >
              Save Track
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DragDropOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#060305]/85 backdrop-blur-md p-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#DC2626] bg-[#140A0F]/90 px-12 py-14 text-center shadow-[0_0_50px_rgba(220,38,38,0.3)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#991B1B]/30 text-[#EA580C]">
          <Upload size={28} />
        </div>
        <h3 className="font-display text-2xl font-semibold text-[#F5EFEF]">
          Drop Audio Files into Vault
        </h3>
        <p className="text-sm text-[#A69598]">Supports MP3, WAV, FLAC, OGG, and M4A</p>
      </div>
    </div>
  );
}
