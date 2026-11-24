import { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import type { VisualizerMode } from '../types/music';

interface AudioVisualizerProps {
  isPlaying: boolean;
  mode: VisualizerMode;
  height?: number;
  compact?: boolean;
  className?: string;
}

export function AudioVisualizer({
  isPlaying,
  mode,
  height = 180,
  compact = false,
  className = '',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;
    let phase = 0;

    const freqLen = 1024;
    const freqData = new Uint8Array(new ArrayBuffer(freqLen));
    const timeData = new Uint8Array(new ArrayBuffer(freqLen));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = () => {
      const width = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (width === 0 || h === 0) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, width, h);
      phase += isPlaying ? 0.045 : 0.014;

      const hasFreq = isPlaying && audioEngine.getFrequencyData(freqData);
      const hasTime = isPlaying && audioEngine.getTimeDomainData(timeData);

      if (mode === 'bars') {
        const barCount = compact ? 36 : 56;
        const gap = compact ? 3 : 4;
        const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);

        for (let i = 0; i < barCount; i++) {
          let norm = 0;
          if (hasFreq) {
            const bin = Math.floor((i / barCount) * 180) + 2;
            norm = freqData[bin] / 255;
          } else {
            // Gentle idle ember pulse
            norm =
              (Math.sin(phase + i * 0.28) * 0.5 + 0.5) * 0.16 +
              (Math.cos(phase * 0.7 - i * 0.15) * 0.5 + 0.5) * 0.08;
          }

          const barH = Math.max(4, norm * (h * 0.88));
          const x = i * (barWidth + gap);
          const y = h - barH;

          const grad = ctx.createLinearGradient(x, h, x, y);
          grad.addColorStop(0, 'rgba(127, 29, 29, 0.75)');
          grad.addColorStop(0.55, 'rgba(220, 38, 38, 0.92)');
          grad.addColorStop(1, 'rgba(249, 115, 22, 0.98)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          const radius = Math.min(barWidth / 2, 3);
          ctx.roundRect(x, y, barWidth, barH, [radius, radius, 0, 0]);
          ctx.fill();

          if (!compact && norm > 0.35) {
            ctx.fillStyle = 'rgba(251, 146, 60, 0.85)';
            ctx.fillRect(x, Math.max(0, y - 4), barWidth, 2);
          }
        }
      } else if (mode === 'wave') {
        const midY = h / 2;
        const points = 128;

        // Outer ambient crimson glow wave
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const t = i / points;
          const x = t * width;
          let amp = 0;
          if (hasTime) {
            const idx = Math.floor(t * (timeData.length - 1));
            amp = ((timeData[idx] - 128) / 128) * (h * 0.42);
          } else {
            amp = Math.sin(t * Math.PI * 4 + phase) * (h * 0.08) * Math.sin(t * Math.PI);
          }
          const y = midY + amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const waveGrad = ctx.createLinearGradient(0, 0, width, 0);
        waveGrad.addColorStop(0, 'rgba(153, 27, 27, 0.4)');
        waveGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.95)');
        waveGrad.addColorStop(1, 'rgba(185, 28, 28, 0.4)');
        ctx.strokeStyle = waveGrad;
        ctx.lineWidth = compact ? 2 : 2.5;
        ctx.shadowColor = 'rgba(220, 38, 38, 0.65)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();

        // Secondary harmonic trace
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const t = i / points;
          const x = t * width;
          let amp = 0;
          if (hasTime) {
            const idx = Math.floor(t * (timeData.length - 1));
            amp = -((timeData[idx] - 128) / 128) * (h * 0.24);
          } else {
            amp = Math.cos(t * Math.PI * 3 - phase * 1.2) * (h * 0.05) * Math.sin(t * Math.PI);
          }
          const y = midY + amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.35)';
        ctx.lineWidth = 1.25;
        ctx.stroke();
      } else {
        // Cathedral Radial Rose Spectrum
        const cx = width / 2;
        const cy = h / 2;
        const baseRadius = Math.min(width, h) * (compact ? 0.24 : 0.26);
        const maxSpike = Math.min(width, h) * 0.21;
        const spokes = 64;

        ctx.save();
        ctx.strokeStyle = 'rgba(185, 28, 28, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < spokes; i++) {
          const angle = (i / spokes) * Math.PI * 2 - Math.PI / 2 + phase * 0.08;
          let norm = 0;
          if (hasFreq) {
            const bin = Math.floor(((i % (spokes / 2)) / (spokes / 2)) * 120) + 2;
            norm = freqData[bin] / 255;
          } else {
            norm = (Math.sin(phase * 1.4 + i * 0.35) * 0.5 + 0.5) * 0.2;
          }

          const len = 4 + norm * maxSpike;
          const x1 = cx + Math.cos(angle) * baseRadius;
          const y1 = cy + Math.sin(angle) * baseRadius;
          const x2 = cx + Math.cos(angle) * (baseRadius + len);
          const y2 = cy + Math.sin(angle) * (baseRadius + len);

          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, 'rgba(153, 27, 27, 0.8)');
          grad.addColorStop(1, 'rgba(249, 115, 22, 0.98)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = compact ? 2 : 2.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [isPlaying, mode, compact]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height: `${height}px` }}
      className={`block w-full ${className}`}
      aria-label="Live audio spectrum visualizer"
    />
  );
}
