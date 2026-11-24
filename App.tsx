import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EqualizerView } from './components/EqualizerView';
import { GothicAtmosphere } from './components/GothicAtmosphere';
import { ImmersiveStage } from './components/ImmersiveStage';
import { ListenNowView } from './components/ListenNowView';
import { MiniPlayer } from './components/MiniPlayer';
import { DragDropOverlay, EditTrackModal, PlaylistModal } from './components/Modals';
import { PlayerBar } from './components/PlayerBar';
import { RightPanel } from './components/RightPanel';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TrackListView } from './components/TrackListView';
import { EQ_PRESETS } from './data/eqPresets';
import { audioEngine } from './services/audioEngine';
import {
  deletePlaylistRecord,
  deleteTrackRecord,
  getAllPlaylists,
  getAllTracks,
  getSetting,
  getTrackAudioBlob,
  savePlaylistRecord,
  saveTrackWithAudio,
  setSetting,
  updateTrackRecord,
} from './services/db';
import type {
  NavSection,
  PlayerPreferences,
  Playlist,
  RepeatMode,
  RightPanelTab,
  Track,
  VisualizerMode,
} from './types/music';
import { extractAudioMetadata } from './utils/audioMetadata';
import { createId } from './utils/formatters';
import { generateCatalogSamples } from './utils/sampleSynth';

const CATALOG_VERSION = 3;

const DEFAULT_PREFERENCES: PlayerPreferences = {
  volume: 0.8,
  isMuted: false,
  isShuffle: false,
  repeatMode: 'off',
  activePresetId: 'cathedral-organ',
  customGains: [4.5, 5, 3, 0.5, -1, 1, 2.5, 3.5, 4, 3],
  preamp: -1,
  reverbMix: 0.24,
  visualizerMode: 'bars',
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [prefs, setPrefs] = useState<PlayerPreferences>(DEFAULT_PREFERENCES);

  const [activeSection, setActiveSection] = useState<NavSection>('listen-now');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isImmersiveOpen, setIsImmersiveOpen] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);

  // Playback state
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);

  // Modals & Drag-drop & Status notice
  const [playlistModalState, setPlaylistModalState] = useState<{
    open: boolean;
    editing?: Playlist | null;
  }>({ open: false });
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const loadedTrackIdRef = useRef<string | null>(null);

  // Show temporary user feedback toast
  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Initial IndexedDB Hydration & Catalog Seeding / Upgrade
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [storedTracks, storedPlaylists, storedPrefs, storedQueue, storedHistory, catalogVer] =
          await Promise.all([
            getAllTracks(),
            getAllPlaylists(),
            getSetting<PlayerPreferences>('preferences', DEFAULT_PREFERENCES),
            getSetting<string[]>('queueIds', []),
            getSetting<string[]>('historyIds', []),
            getSetting<number>('catalogVersion', 0),
          ]);

        let finalTracks = [...storedTracks];
        let finalPlaylists = [...storedPlaylists];

        if (catalogVer < CATALOG_VERSION) {
          const existingIds = new Set(finalTracks.map((t) => t.id));
          const existingTitles = new Set(finalTracks.map((t) => t.title.toLowerCase()));
          const newSamples = await generateCatalogSamples(existingIds, existingTitles);

          for (const item of newSamples) {
            await saveTrackWithAudio(item.track, item.blob, 'audio/wav');
          }

          if (newSamples.length > 0) {
            finalTracks = [...newSamples.map((s) => s.track), ...finalTracks].sort(
              (a, b) => b.addedAt - a.addedAt
            );
          }

          const existingPlNames = new Set(finalPlaylists.map((p) => p.name));
          const now = Date.now();

          const phonkIds = newSamples
            .filter((s) => s.category === 'phonk')
            .map((s) => s.track.id);
          const ncsIds = newSamples
            .filter((s) => s.category === 'nocopyright')
            .map((s) => s.track.id);
          const indianIds = newSamples
            .filter((s) => s.category === 'indian')
            .map((s) => s.track.id);
          const intlIds = newSamples
            .filter((s) => s.category === 'international')
            .map((s) => s.track.id);
          const gothicIds = newSamples
            .filter((s) => s.category === 'gothic')
            .map((s) => s.track.id);

          const playlistsToCreate: Array<{ name: string; description: string; trackIds: string[] }> = [
            {
              name: 'Crimson Phonk',
              description: 'Drift phonk, 808 cowbells, and distorted sub-bass',
              trackIds: phonkIds,
            },
            {
              name: 'No-Copyright Beats',
              description: 'Royalty-free darkwave, synthwave, and electronic anthems',
              trackIds: ncsIds,
            },
            {
              name: 'Indian Ragas & Sufi',
              description: 'Midnight ragas, Carnatic dusk, and Sufi echoes',
              trackIds: indianIds,
            },
            {
              name: 'World Nocturnes',
              description: 'Kyoto rain, Lisbon Fado, Tango, and Parisian waltz',
              trackIds: intlIds,
            },
            {
              name: 'Midnight Sanctuary',
              description: 'Atmospheric gothic instrumentals',
              trackIds: gothicIds,
            },
          ];

          for (const spec of playlistsToCreate) {
            if (spec.trackIds.length > 0 && !existingPlNames.has(spec.name)) {
              const pl: Playlist = {
                id: createId('pl'),
                name: spec.name,
                description: spec.description,
                trackIds: spec.trackIds,
                createdAt: now,
                updatedAt: now,
              };
              await savePlaylistRecord(pl);
              finalPlaylists.push(pl);
            }
          }

          await setSetting('catalogVersion', CATALOG_VERSION);
        }

        if (cancelled) return;

        setTracks(finalTracks);
        setPlaylists(finalPlaylists);
        setPrefs(storedPrefs);

        const validIds = new Set(finalTracks.map((t) => t.id));
        setQueueIds(storedQueue.filter((id) => validIds.has(id)));
        setHistoryIds(storedHistory.filter((id) => validIds.has(id)));

        audioEngine.setVolume(storedPrefs.volume, storedPrefs.isMuted);
        audioEngine.setEqualizer(storedPrefs.customGains, storedPrefs.preamp, storedPrefs.reverbMix);

        if (finalTracks.length > 0) {
          const first = finalTracks[0];
          setCurrentTrackId(first.id);
          setDuration(first.duration);
        }
      } catch (err) {
        console.error('Failed to initialize vault:', err);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist preferences, queue, and history
  useEffect(() => {
    if (!isReady) return;
    setSetting('preferences', prefs).catch(() => {});
  }, [prefs, isReady]);

  useEffect(() => {
    if (!isReady) return;
    setSetting('queueIds', queueIds).catch(() => {});
  }, [queueIds, isReady]);

  useEffect(() => {
    if (!isReady) return;
    setSetting('historyIds', historyIds).catch(() => {});
  }, [historyIds, isReady]);

  // Sync audio engine volume & EQ whenever prefs change
  useEffect(() => {
    audioEngine.setVolume(prefs.volume, prefs.isMuted);
  }, [prefs.volume, prefs.isMuted]);

  useEffect(() => {
    audioEngine.setEqualizer(prefs.customGains, prefs.preamp, prefs.reverbMix);
  }, [prefs.customGains, prefs.preamp, prefs.reverbMix]);

  const trackMap = useMemo(() => {
    const map = new Map<string, Track>();
    for (const t of tracks) map.set(t.id, t);
    return map;
  }, [tracks]);

  const currentTrack = useMemo(
    () => (currentTrackId ? trackMap.get(currentTrackId) ?? null : null),
    [currentTrackId, trackMap]
  );

  const queueTracks = useMemo(
    () => queueIds.map((id) => trackMap.get(id)).filter((t): t is Track => Boolean(t)),
    [queueIds, trackMap]
  );

  const historyTracks = useMemo(
    () => historyIds.map((id) => trackMap.get(id)).filter((t): t is Track => Boolean(t)),
    [historyIds, trackMap]
  );

  const recentlyPlayedTracks = useMemo(() => {
    return [...tracks]
      .filter((t) => typeof t.lastPlayedAt === 'number')
      .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0));
  }, [tracks]);

  const favoriteTracks = useMemo(() => tracks.filter((t) => t.isFavorite), [tracks]);

  const activePlaylist = useMemo(
    () => playlists.find((p) => p.id === activePlaylistId) ?? null,
    [playlists, activePlaylistId]
  );

  const activePlaylistTracks = useMemo(() => {
    if (!activePlaylist) return [];
    return activePlaylist.trackIds
      .map((id) => trackMap.get(id))
      .filter((t): t is Track => Boolean(t));
  }, [activePlaylist, trackMap]);

  // Load and start playing a specific track ID
  const startTrackById = useCallback(
    async (trackId: string, pushPreviousToHistory = true) => {
      const target = trackMap.get(trackId);
      if (!target) return;

      try {
        if (pushPreviousToHistory && currentTrackId && currentTrackId !== trackId) {
          setHistoryIds((prev) => [currentTrackId, ...prev.filter((id) => id !== currentTrackId)].slice(0, 30));
        }

        if (loadedTrackIdRef.current !== trackId) {
          const audioRec = await getTrackAudioBlob(trackId);
          if (!audioRec) {
            showNotice('Audio file could not be loaded from vault.');
            return;
          }
          await audioEngine.loadBlob(audioRec.blob);
          loadedTrackIdRef.current = trackId;
        }

        setCurrentTrackId(trackId);
        setCurrentTime(0);
        setDuration(target.duration);

        await audioEngine.play();
        setIsPlaying(true);

        const updated: Track = {
          ...target,
          playCount: target.playCount + 1,
          lastPlayedAt: Date.now(),
        };
        setTracks((prev) => prev.map((t) => (t.id === trackId ? updated : t)));
        updateTrackRecord(updated).catch(() => {});
      } catch (err) {
        console.error('Playback error:', err);
        setIsPlaying(false);
        showNotice('Unable to start playback for this file.');
      }
    },
    [trackMap, currentTrackId, showNotice]
  );

  const handlePlayTrack = useCallback(
    (track: Track, contextList?: Track[]) => {
      if (contextList && contextList.length > 0) {
        const idx = contextList.findIndex((t) => t.id === track.id);
        let upcoming = idx >= 0 ? contextList.slice(idx + 1) : contextList.filter((t) => t.id !== track.id);
        if (prefs.isShuffle) {
          upcoming = [...upcoming].sort(() => Math.random() - 0.5);
        }
        setQueueIds(upcoming.map((t) => t.id));
      }
      startTrackById(track.id);
    },
    [prefs.isShuffle, startTrackById]
  );

  const handleTogglePlayPause = useCallback(async () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      if (loadedTrackIdRef.current !== currentTrack.id) {
        await startTrackById(currentTrack.id, false);
      } else {
        await audioEngine.play();
        setIsPlaying(true);
      }
    }
  }, [currentTrack, isPlaying, startTrackById]);

  const handleNext = useCallback(() => {
    if (queueIds.length > 0) {
      const [nextId, ...rest] = queueIds;
      setQueueIds(rest);
      startTrackById(nextId);
      return;
    }

    if (tracks.length === 0) return;

    if (prefs.repeatMode === 'all') {
      if (prefs.isShuffle) {
        const pool = tracks.filter((t) => t.id !== currentTrackId);
        const pick = pool[Math.floor(Math.random() * pool.length)] ?? tracks[0];
        startTrackById(pick.id);
      } else {
        const idx = tracks.findIndex((t) => t.id === currentTrackId);
        const nextTrack = tracks[(idx + 1) % tracks.length];
        startTrackById(nextTrack.id);
      }
      return;
    }

    if (prefs.isShuffle && tracks.length > 1) {
      const pool = tracks.filter((t) => t.id !== currentTrackId);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) startTrackById(pick.id);
      return;
    }

    const idx = tracks.findIndex((t) => t.id === currentTrackId);
    if (idx >= 0 && idx + 1 < tracks.length) {
      startTrackById(tracks[idx + 1].id);
    } else {
      audioEngine.pause();
      audioEngine.seek(0);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [queueIds, tracks, prefs.repeatMode, prefs.isShuffle, currentTrackId, startTrackById]);

  const handlePrev = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }

    if (historyIds.length > 0) {
      const [prevId, ...rest] = historyIds;
      setHistoryIds(rest);
      if (currentTrackId) {
        setQueueIds((q) => [currentTrackId, ...q]);
      }
      startTrackById(prevId, false);
      return;
    }

    if (tracks.length > 0) {
      const idx = tracks.findIndex((t) => t.id === currentTrackId);
      const prevIdx = idx <= 0 ? tracks.length - 1 : idx - 1;
      startTrackById(tracks[prevIdx].id, false);
    }
  }, [currentTime, historyIds, currentTrackId, tracks, startTrackById]);

  // Keep latest handlers in refs for HTMLAudioElement listeners
  const latestHandlersRef = useRef({
    handleNext,
    repeatMode: prefs.repeatMode,
    currentTrackId,
  });
  latestHandlersRef.current = {
    handleNext,
    repeatMode: prefs.repeatMode,
    currentTrackId,
  };

  useEffect(() => {
    const el = audioEngine.element;

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime || 0);
    };
    const onLoadedMetadata = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDuration(el.duration);
      }
    };
    const onEnded = () => {
      const { repeatMode, handleNext: goNext } = latestHandlersRef.current;
      if (repeatMode === 'one') {
        audioEngine.seek(0);
        audioEngine.play().catch(() => {});
      } else {
        goNext();
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, []);

  // Keyboard shortcuts (Space to Play/Pause, Arrows to seek)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlayPause();
      } else if (e.code === 'ArrowRight' && currentTrack) {
        audioEngine.seek(Math.min(duration, currentTime + 5));
      } else if (e.code === 'ArrowLeft' && currentTrack) {
        audioEngine.seek(Math.max(0, currentTime - 5));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTogglePlayPause, currentTrack, duration, currentTime]);

  // Import Audio Files (Picker or Drag-and-Drop)
  const importAudioFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(
        (f) =>
          f.type.startsWith('audio/') ||
          /\.(mp3|wav|ogg|flac|m4a|aac|opus|webm)$/i.test(f.name)
      );
      if (files.length === 0) {
        showNotice('Please select MP3, WAV, FLAC, OGG, or M4A audio files.');
        return;
      }

      setIsImporting(true);
      const addedTracks: Track[] = [];

      try {
        for (const file of files) {
          const meta = await extractAudioMetadata(file);
          const newTrack: Track = {
            id: createId('trk'),
            title: meta.title,
            artist: meta.artist,
            album: meta.album,
            duration: meta.duration,
            format: meta.format,
            fileSize: file.size,
            artworkUrl: meta.artworkUrl,
            lyrics: meta.lyrics,
            isFavorite: false,
            playCount: 0,
            addedAt: Date.now() + addedTracks.length,
          };
          await saveTrackWithAudio(newTrack, file, file.type || 'audio/mpeg');
          addedTracks.push(newTrack);
        }

        setTracks((prev) => [...addedTracks.reverse(), ...prev]);
        if (!currentTrackId && addedTracks.length > 0) {
          setCurrentTrackId(addedTracks[0].id);
          setDuration(addedTracks[0].duration);
        }
        showNotice(
          `Added ${addedTracks.length} ${addedTracks.length === 1 ? 'track' : 'tracks'} to your vault.`
        );
      } catch (err) {
        console.error('Failed to import audio files:', err);
        showNotice('Some files could not be imported.');
      } finally {
        setIsImporting(false);
      }
    },
    [currentTrackId, showNotice]
  );

  // Global Window Drag-and-Drop
  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files');

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current += 1;
      setIsDraggingFiles(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDraggingFiles(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingFiles(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        importAudioFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [importAudioFiles]);

  // Track Mutations
  const handleToggleFavorite = async (trackId: string) => {
    const target = trackMap.get(trackId);
    if (!target) return;
    const updated: Track = { ...target, isFavorite: !target.isFavorite };
    setTracks((prev) => prev.map((t) => (t.id === trackId ? updated : t)));
    await updateTrackRecord(updated);
  };

  const handleSaveLyrics = async (trackId: string, lyrics: string) => {
    const target = trackMap.get(trackId);
    if (!target) return;
    const updated: Track = { ...target, lyrics };
    setTracks((prev) => prev.map((t) => (t.id === trackId ? updated : t)));
    await updateTrackRecord(updated);
    showNotice('Lyrics saved to local vault.');
  };

  const handleSaveEditedTrack = async (updated: Track) => {
    setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    await updateTrackRecord(updated);
    showNotice('Track details updated.');
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (currentTrackId === trackId) {
      audioEngine.pause();
      setIsPlaying(false);
      loadedTrackIdRef.current = null;
      setCurrentTrackId(null);
      setCurrentTime(0);
      setDuration(0);
    }
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setQueueIds((prev) => prev.filter((id) => id !== trackId));
    setHistoryIds((prev) => prev.filter((id) => id !== trackId));

    // Remove from any playlists
    const updatedPlaylists = playlists.map((pl) =>
      pl.trackIds.includes(trackId)
        ? { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId), updatedAt: Date.now() }
        : pl
    );
    setPlaylists(updatedPlaylists);
    for (const pl of updatedPlaylists) {
      await savePlaylistRecord(pl);
    }

    await deleteTrackRecord(trackId);
    showNotice('Track removed from vault.');
  };

  // Playlist Mutations
  const handleSavePlaylist = async (name: string, description: string, existingId?: string) => {
    const now = Date.now();
    if (existingId) {
      const existing = playlists.find((p) => p.id === existingId);
      if (!existing) return;
      const updated: Playlist = { ...existing, name, description, updatedAt: now };
      setPlaylists((prev) => prev.map((p) => (p.id === existingId ? updated : p)));
      await savePlaylistRecord(updated);
      showNotice('Playlist updated.');
    } else {
      const created: Playlist = {
        id: createId('pl'),
        name,
        description,
        trackIds: [],
        createdAt: now,
        updatedAt: now,
      };
      setPlaylists((prev) => [...prev, created]);
      await savePlaylistRecord(created);
      setActivePlaylistId(created.id);
      setActiveSection('playlist');
      showNotice(`Created playlist "${name}".`);
    }
  };

  const handleAddToPlaylist = async (playlistId: string, trackId: string) => {
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return;
    if (target.trackIds.includes(trackId)) {
      showNotice(`Already in "${target.name}".`);
      return;
    }
    const updated: Playlist = {
      ...target,
      trackIds: [...target.trackIds, trackId],
      updatedAt: Date.now(),
    };
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
    await savePlaylistRecord(updated);
    showNotice(`Added to "${target.name}".`);
  };

  const handleRemoveFromPlaylist = async (playlistId: string, trackId: string) => {
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return;
    const updated: Playlist = {
      ...target,
      trackIds: target.trackIds.filter((id) => id !== trackId),
      updatedAt: Date.now(),
    };
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
    await savePlaylistRecord(updated);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    await deletePlaylistRecord(playlistId);
    if (activePlaylistId === playlistId) {
      setActivePlaylistId(null);
      setActiveSection('listen-now');
    }
    showNotice('Playlist deleted.');
  };

  // Equalizer Handlers
  const handleSelectEqPreset = (presetId: string) => {
    const preset = EQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setPrefs((prev) => ({
      ...prev,
      activePresetId: preset.id,
      customGains: [...preset.gains],
      preamp: preset.preamp,
      reverbMix: preset.reverbMix,
    }));
  };

  const handleChangeBandGain = (index: number, gainDb: number) => {
    setPrefs((prev) => {
      const nextGains = [...prev.customGains];
      nextGains[index] = gainDb;
      return {
        ...prev,
        activePresetId: 'custom',
        customGains: nextGains,
      };
    });
  };

  // Top bar title
  const topTitle = useMemo(() => {
    if (activeSection === 'listen-now') return 'Listen Now';
    if (activeSection === 'songs') return 'Library · Songs';
    if (activeSection === 'albums') return 'Library · Albums';
    if (activeSection === 'favorites') return 'Favorites';
    if (activeSection === 'recently-played') return 'Recently Played';
    if (activeSection === 'equalizer') return 'Equalizer & Acoustics';
    if (activeSection === 'playlist' && activePlaylist) return activePlaylist.name;
    return 'Lounge';
  }, [activeSection, activePlaylist]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#060406] text-[#F5EFEF]">
      <GothicAtmosphere />

      {/* Hidden File Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            importAudioFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />

      {/* Full Lounge Shell (hidden behind MiniPlayer when minimized) */}
      {!isMiniPlayer && (
        <>
          <div className="relative z-10 flex flex-1 overflow-hidden">
            <Sidebar
              activeSection={activeSection}
              activePlaylistId={activePlaylistId}
              playlists={playlists}
              trackCount={tracks.length}
              favoritesCount={favoriteTracks.length}
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              onSelectSection={(section, playlistId) => {
                setActiveSection(section);
                if (playlistId) setActivePlaylistId(playlistId);
              }}
              onOpenCreatePlaylist={() => setPlaylistModalState({ open: true, editing: null })}
              onTriggerUpload={() => fileInputRef.current?.click()}
              onOpenImmersive={() => {
                if (currentTrack) setIsImmersiveOpen(true);
                else if (tracks.length > 0) {
                  handlePlayTrack(tracks[0], tracks);
                  setIsImmersiveOpen(true);
                }
              }}
            />

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
              <TopBar
                title={topTitle}
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                  setSearchQuery(q);
                  if (q.trim() && activeSection === 'listen-now') {
                    setActiveSection('songs');
                  }
                }}
                onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
                onTriggerUpload={() => fileInputRef.current?.click()}
              />

              <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6">
                {!isReady ? (
                  <div className="flex h-64 items-center justify-center text-sm text-[#8E7A7E]">
                    Opening vault...
                  </div>
                ) : activeSection === 'listen-now' ? (
                  <ListenNowView
                    tracks={tracks}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    recentlyPlayed={recentlyPlayedTracks}
                    playlists={playlists}
                    visualizerMode={prefs.visualizerMode}
                    onChangeVisualizerMode={(mode: VisualizerMode) =>
                      setPrefs((prev) => ({ ...prev, visualizerMode: mode }))
                    }
                    onPlayTrack={handlePlayTrack}
                    onTogglePlayPause={handleTogglePlayPause}
                    onShuffleAll={() => {
                      if (tracks.length === 0) return;
                      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                      handlePlayTrack(shuffled[0], shuffled);
                    }}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenPlaylist={(id) => {
                      setActivePlaylistId(id);
                      setActiveSection('playlist');
                    }}
                    onOpenEqualizer={() => setActiveSection('equalizer')}
                    onOpenImmersive={() => setIsImmersiveOpen(true)}
                    onTriggerUpload={() => fileInputRef.current?.click()}
                  />
                ) : activeSection === 'equalizer' ? (
                  <EqualizerView
                    activePresetId={prefs.activePresetId}
                    gains={prefs.customGains}
                    preamp={prefs.preamp}
                    reverbMix={prefs.reverbMix}
                    onSelectPreset={handleSelectEqPreset}
                    onChangeBandGain={handleChangeBandGain}
                    onChangePreamp={(preamp) =>
                      setPrefs((prev) => ({ ...prev, activePresetId: 'custom', preamp }))
                    }
                    onChangeReverb={(reverbMix) =>
                      setPrefs((prev) => ({ ...prev, activePresetId: 'custom', reverbMix }))
                    }
                    onReset={() => handleSelectEqPreset('flat')}
                  />
                ) : (
                  <TrackListView
                    mode={
                      activeSection === 'playlist'
                        ? 'playlist'
                        : activeSection === 'albums'
                          ? 'albums'
                          : activeSection === 'favorites'
                            ? 'favorites'
                            : activeSection === 'recently-played'
                              ? 'recently-played'
                              : 'songs'
                    }
                    tracks={
                      activeSection === 'favorites'
                        ? favoriteTracks
                        : activeSection === 'recently-played'
                          ? recentlyPlayedTracks
                          : activeSection === 'playlist'
                            ? activePlaylistTracks
                            : tracks
                    }
                    allPlaylists={playlists}
                    activePlaylist={activePlaylist}
                    currentTrackId={currentTrackId}
                    isPlaying={isPlaying}
                    searchQuery={searchQuery}
                    onPlayTrack={handlePlayTrack}
                    onTogglePlayPause={handleTogglePlayPause}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToQueue={(track) => {
                      setQueueIds((prev) => [...prev, track.id]);
                      showNotice(`Added "${track.title}" to Up Next.`);
                    }}
                    onAddToPlaylist={handleAddToPlaylist}
                    onRemoveFromPlaylist={handleRemoveFromPlaylist}
                    onDeleteTrack={handleDeleteTrack}
                    onEditTrack={(track) => setEditingTrack(track)}
                    onRenamePlaylist={(pl) =>
                      setPlaylistModalState({ open: true, editing: pl })
                    }
                    onDeletePlaylist={handleDeletePlaylist}
                    onTriggerUpload={() => fileInputRef.current?.click()}
                  />
                )}
              </main>
            </div>

            <RightPanel
              activeTab={rightPanelTab}
              currentTrack={currentTrack}
              queue={queueTracks}
              history={historyTracks}
              onChangeTab={setRightPanelTab}
              onSaveLyrics={handleSaveLyrics}
              onPlayFromQueue={(idx) => {
                const targetId = queueIds[idx];
                if (!targetId) return;
                setQueueIds((prev) => prev.slice(idx + 1));
                startTrackById(targetId);
              }}
              onMoveQueueItem={(idx, dir) => {
                setQueueIds((prev) => {
                  const next = [...prev];
                  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
                  if (swapIdx < 0 || swapIdx >= next.length) return prev;
                  [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
                  return next;
                });
              }}
              onRemoveFromQueue={(idx) => {
                setQueueIds((prev) => prev.filter((_, i) => i !== idx));
              }}
              onClearQueue={() => setQueueIds([])}
              onPlayHistoryTrack={(track) => startTrackById(track.id)}
            />
          </div>

          <PlayerBar
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={prefs.volume}
            isMuted={prefs.isMuted}
            isShuffle={prefs.isShuffle}
            repeatMode={prefs.repeatMode}
            rightPanelTab={rightPanelTab}
            isEqualizerOpen={activeSection === 'equalizer'}
            onTogglePlayPause={handleTogglePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={(t) => {
              audioEngine.seek(t);
              setCurrentTime(t);
            }}
            onChangeVolume={(vol) =>
              setPrefs((prev) => ({ ...prev, volume: vol, isMuted: vol === 0 }))
            }
            onToggleMute={() => setPrefs((prev) => ({ ...prev, isMuted: !prev.isMuted }))}
            onToggleShuffle={() =>
              setPrefs((prev) => ({ ...prev, isShuffle: !prev.isShuffle }))
            }
            onCycleRepeat={() => {
              const order: RepeatMode[] = ['off', 'all', 'one'];
              setPrefs((prev) => ({
                ...prev,
                repeatMode: order[(order.indexOf(prev.repeatMode) + 1) % order.length],
              }));
            }}
            onToggleFavorite={handleToggleFavorite}
            onToggleRightPanel={(tab) =>
              setRightPanelTab((prev) => (prev === tab ? null : tab))
            }
            onOpenEqualizer={() =>
              setActiveSection((prev) => (prev === 'equalizer' ? 'listen-now' : 'equalizer'))
            }
            onOpenImmersive={() => {
              if (currentTrack) setIsImmersiveOpen(true);
            }}
            onToggleMiniPlayer={() => setIsMiniPlayer(true)}
          />
        </>
      )}

      {/* Compact Floating Mini-Player Mode */}
      {isMiniPlayer && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={prefs.volume}
          isMuted={prefs.isMuted}
          onTogglePlayPause={handleTogglePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={(t) => {
            audioEngine.seek(t);
            setCurrentTime(t);
          }}
          onChangeVolume={(vol) =>
            setPrefs((prev) => ({ ...prev, volume: vol, isMuted: vol === 0 }))
          }
          onToggleMute={() => setPrefs((prev) => ({ ...prev, isMuted: !prev.isMuted }))}
          onToggleFavorite={handleToggleFavorite}
          onRestoreFull={() => setIsMiniPlayer(false)}
        />
      )}

      {/* Immersive Visualizer & Lyrics Stage */}
      {isImmersiveOpen && !isMiniPlayer && (
        <ImmersiveStage
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          isShuffle={prefs.isShuffle}
          repeatMode={prefs.repeatMode}
          visualizerMode={prefs.visualizerMode}
          onClose={() => setIsImmersiveOpen(false)}
          onTogglePlayPause={handleTogglePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={(t) => {
            audioEngine.seek(t);
            setCurrentTime(t);
          }}
          onToggleShuffle={() =>
            setPrefs((prev) => ({ ...prev, isShuffle: !prev.isShuffle }))
          }
          onCycleRepeat={() => {
            const order: RepeatMode[] = ['off', 'all', 'one'];
            setPrefs((prev) => ({
              ...prev,
              repeatMode: order[(order.indexOf(prev.repeatMode) + 1) % order.length],
            }));
          }}
          onToggleFavorite={handleToggleFavorite}
          onChangeVisualizerMode={(mode) =>
            setPrefs((prev) => ({ ...prev, visualizerMode: mode }))
          }
          onSaveLyrics={handleSaveLyrics}
          onOpenEqualizer={() => setActiveSection('equalizer')}
        />
      )}

      {/* Modals */}
      {playlistModalState.open && (
        <PlaylistModal
          initialPlaylist={playlistModalState.editing}
          onClose={() => setPlaylistModalState({ open: false })}
          onSave={handleSavePlaylist}
        />
      )}

      {editingTrack && (
        <EditTrackModal
          track={editingTrack}
          onClose={() => setEditingTrack(null)}
          onSave={handleSaveEditedTrack}
        />
      )}

      <DragDropOverlay visible={isDraggingFiles} />

      {/* Subtle Action Toast */}
      {(notice || isImporting) && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-24 right-6 z-50 rounded-xl border border-[#DC2626]/40 bg-[#140A0F]/95 px-4 py-2.5 text-xs font-medium text-[#F5EFEF] shadow-[0_12px_32px_rgba(0,0,0,0.65)] backdrop-blur-xl"
        >
          {isImporting ? 'Importing audio into vault...' : notice}
        </div>
      )}
    </div>
  );
}
