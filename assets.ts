import backdropImg from '../assets/images/gothic_lounge_backdrop_1795532796844.jpg';
import crimsonNocturneArt from '../assets/images/album_crimson_nocturne_1795532797759.jpg';
import obsidianCathedralArt from '../assets/images/album_obsidian_cathedral_1795532798400.jpg';
import emberRequiemArt from '../assets/images/album_ember_requiem_1795532797947.jpg';
import indianRagaArt from '../assets/images/album_indian_raga_1795534482027.jpg';
import kyotoNocturneArt from '../assets/images/album_kyoto_nocturne_1795534483445.jpg';
import tangoFadoArt from '../assets/images/album_tango_fado_1795534483666.jpg';
import crimsonPhonkArt from '../assets/images/album_crimson_phonk_1795536565631.jpg';
import noCopyrightSynthArt from '../assets/images/album_nocopyright_synth_1795536567145.jpg';

export const GOTHIC_BACKDROP = backdropImg;

export const ALBUM_ART = {
  crimsonNocturne: crimsonNocturneArt,
  obsidianCathedral: obsidianCathedralArt,
  emberRequiem: emberRequiemArt,
  indianRaga: indianRagaArt,
  kyotoNocturne: kyotoNocturneArt,
  tangoFado: tangoFadoArt,
  crimsonPhonk: crimsonPhonkArt,
  noCopyrightSynth: noCopyrightSynthArt,
} as const;

export const DEFAULT_ALBUM_COVERS = [
  crimsonNocturneArt,
  obsidianCathedralArt,
  emberRequiemArt,
  indianRagaArt,
  kyotoNocturneArt,
  tangoFadoArt,
  crimsonPhonkArt,
  noCopyrightSynthArt,
] as const;

export function pickDefaultCover(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return DEFAULT_ALBUM_COVERS[hash % DEFAULT_ALBUM_COVERS.length];
}
