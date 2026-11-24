import { Disc3 } from 'lucide-react';
import { useState } from 'react';

interface ArtworkImageProps {
  src?: string;
  alt: string;
  className?: string;
  iconSize?: number;
}

export function ArtworkImage({
  src,
  alt,
  className = '',
  iconSize = 24,
}: ArtworkImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#2a0b0f] via-[#12090d] to-[#1f0e08] text-[#dc2626]/70 ${className}`}
        aria-label={alt}
      >
        <Disc3 size={iconSize} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
