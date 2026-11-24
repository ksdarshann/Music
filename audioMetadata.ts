import { pickDefaultCover } from '../data/assets';

export interface ParsedAudioMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  format: string;
  artworkUrl: string;
  lyrics: string;
}

function decodeTextFrame(bytes: Uint8Array, encoding: number): string {
  if (bytes.length === 0) return '';
  try {
    if (encoding === 0) {
      return new TextDecoder('iso-8859-1').decode(bytes).replace(/\0/g, '').trim();
    }
    if (encoding === 1) {
      return new TextDecoder('utf-16').decode(bytes).replace(/\0/g, '').trim();
    }
    if (encoding === 2) {
      return new TextDecoder('utf-16be').decode(bytes).replace(/\0/g, '').trim();
    }
    return new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim();
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/\0/g, '').trim();
  }
}

function readSynchsafeInt(b0: number, b1: number, b2: number, b3: number): number {
  return ((b0 & 0x7f) << 21) | ((b1 & 0x7f) << 14) | ((b2 & 0x7f) << 7) | (b3 & 0x7f);
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function parseID3v2Tags(buffer: ArrayBuffer): {
  title?: string;
  artist?: string;
  album?: string;
  lyrics?: string;
  artworkUrl?: string;
} {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 10) return {};

  // Check "ID3" magic header
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return {};
  }

  const versionMajor = bytes[3];
  if (versionMajor < 3 || versionMajor > 4) {
    return {};
  }

  const flags = bytes[5];
  const tagSize = readSynchsafeInt(bytes[6], bytes[7], bytes[8], bytes[9]);
  const endOffset = Math.min(bytes.length, 10 + tagSize);

  let offset = 10;
  // Skip extended header if present
  if ((flags & 0x40) !== 0 && offset + 4 <= endOffset) {
    const extSize =
      versionMajor === 4
        ? readSynchsafeInt(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
        : readUint32BE(bytes, offset);
    offset += extSize + (versionMajor === 3 ? 4 : 0);
  }

  const result: {
    title?: string;
    artist?: string;
    album?: string;
    lyrics?: string;
    artworkUrl?: string;
  } = {};

  while (offset + 10 <= endOffset) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

    const frameSize =
      versionMajor === 4
        ? readSynchsafeInt(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
        : readUint32BE(bytes, offset + 4);

    if (frameSize <= 0 || offset + 10 + frameSize > endOffset) break;

    const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize);

    if (frameId === 'TIT2' && frameData.length > 1) {
      result.title = decodeTextFrame(frameData.subarray(1), frameData[0]);
    } else if (frameId === 'TPE1' && frameData.length > 1) {
      result.artist = decodeTextFrame(frameData.subarray(1), frameData[0]);
    } else if (frameId === 'TALB' && frameData.length > 1) {
      result.album = decodeTextFrame(frameData.subarray(1), frameData[0]);
    } else if (frameId === 'USLT' && frameData.length > 4) {
      const encoding = frameData[0];
      // Skip 3-byte language + null-terminated content descriptor
      let cursor = 4;
      if (encoding === 1 || encoding === 2) {
        while (cursor + 1 < frameData.length) {
          if (frameData[cursor] === 0 && frameData[cursor + 1] === 0) {
            cursor += 2;
            break;
          }
          cursor += 2;
        }
      } else {
        while (cursor < frameData.length) {
          if (frameData[cursor] === 0) {
            cursor += 1;
            break;
          }
          cursor += 1;
        }
      }
      if (cursor < frameData.length) {
        result.lyrics = decodeTextFrame(frameData.subarray(cursor), encoding);
      }
    } else if (frameId === 'APIC' && frameData.length > 4 && !result.artworkUrl) {
      const encoding = frameData[0];
      let cursor = 1;
      let mime = 'image/jpeg';
      let mimeEnd = cursor;
      while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0) {
        mimeEnd++;
      }
      if (mimeEnd > cursor) {
        const rawMime = new TextDecoder('iso-8859-1').decode(frameData.subarray(cursor, mimeEnd));
        if (rawMime.includes('/')) mime = rawMime;
        else if (rawMime.toLowerCase() === 'png') mime = 'image/png';
      }
      cursor = mimeEnd + 1;
      // Picture type (1 byte)
      cursor += 1;
      // Description (null-terminated)
      if (encoding === 1 || encoding === 2) {
        while (cursor + 1 < frameData.length) {
          if (frameData[cursor] === 0 && frameData[cursor + 1] === 0) {
            cursor += 2;
            break;
          }
          cursor += 2;
        }
      } else {
        while (cursor < frameData.length) {
          if (frameData[cursor] === 0) {
            cursor += 1;
            break;
          }
          cursor += 1;
        }
      }
      if (cursor < frameData.length) {
        const imgBytes = frameData.subarray(cursor);
        if (imgBytes.length > 32 && imgBytes.length < 6 * 1024 * 1024) {
          result.artworkUrl = `data:${mime};base64,${uint8ToBase64(imgBytes)}`;
        }
      }
    }

    offset += 10 + frameSize;
  }

  return result;
}

function parseFilenameFallback(filename: string): { title: string; artist: string; format: string } {
  const dotIdx = filename.lastIndexOf('.');
  const ext = dotIdx > -1 ? filename.slice(dotIdx + 1).toUpperCase() : 'AUDIO';
  const baseName = dotIdx > -1 ? filename.slice(0, dotIdx) : filename;
  const cleanName = baseName.replace(/_/g, ' ').trim();

  if (cleanName.includes(' - ')) {
    const [artistPart, ...titleParts] = cleanName.split(' - ');
    return {
      artist: artistPart.trim() || 'Unknown Artist',
      title: titleParts.join(' - ').trim() || cleanName,
      format: ext,
    };
  }

  return {
    artist: 'Personal Vault',
    title: cleanName || 'Untitled Track',
    format: ext,
  };
}

function probeAudioDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
    };

    const onLoaded = () => {
      const dur = Number.isFinite(audio.duration) ? audio.duration : 0;
      cleanup();
      resolve(dur);
    };

    const onError = () => {
      cleanup();
      resolve(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = url;
  });
}

export async function extractAudioMetadata(file: File): Promise<ParsedAudioMetadata> {
  const fallback = parseFilenameFallback(file.name);
  let id3: ReturnType<typeof parseID3v2Tags> = {};

  try {
    // Read up to first 2.5MB for ID3 header + embedded cover art
    const headSlice = file.slice(0, Math.min(file.size, 2.5 * 1024 * 1024));
    const buffer = await headSlice.arrayBuffer();
    id3 = parseID3v2Tags(buffer);
  } catch {
    id3 = {};
  }

  const duration = await probeAudioDuration(file);
  const title = id3.title || fallback.title;
  const artist = id3.artist || fallback.artist;
  const album = id3.album || 'Midnight Sessions';

  return {
    title,
    artist,
    album,
    duration,
    format: fallback.format,
    artworkUrl: id3.artworkUrl || pickDefaultCover(`${title}:${album}`),
    lyrics: id3.lyrics || '',
  };
}
