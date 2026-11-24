import { RotateCcw, Sliders, Sparkles } from 'lucide-react';
import { EQ_FREQUENCY_LABELS, EQ_PRESETS } from '../data/eqPresets';

interface EqualizerViewProps {
  activePresetId: string;
  gains: number[];
  preamp: number;
  reverbMix: number;
  onSelectPreset: (presetId: string) => void;
  onChangeBandGain: (index: number, gainDb: number) => void;
  onChangePreamp: (preampDb: number) => void;
  onChangeReverb: (mix: number) => void;
  onReset: () => void;
}

export function EqualizerView({
  activePresetId,
  gains,
  preamp,
  reverbMix,
  onSelectPreset,
  onChangeBandGain,
  onChangePreamp,
  onChangeReverb,
  onReset,
}: EqualizerViewProps) {
  // Build SVG path for EQ response curve
  const width = 600;
  const height = 110;
  const points = gains.map((g, i) => {
    const x = (i / (gains.length - 1)) * (width - 40) + 20;
    const normY = 0.5 - g / 24; // +12 -> 0, -12 -> 1
    const y = normY * (height - 20) + 10;
    return { x, y };
  });

  const linePath = points
    .map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5EFEF]">
            Acoustic Equalizer
          </h2>
          <p className="text-sm text-[#A69598] mt-1">
            Real-time 10-band Web Audio frequency sculpting and cathedral room acoustics.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] px-4 py-2 text-xs font-medium text-[#F5EFEF] transition-colors whitespace-nowrap"
        >
          <RotateCcw size={14} />
          <span>Reset Flat</span>
        </button>
      </div>

      {/* Presets Row */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-[#8E7A7E]">Presets</p>
        <div className="flex flex-wrap gap-2">
          {EQ_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-[#991B1B] to-[#C2410C] text-white shadow-[0_4px_16px_rgba(185,28,28,0.35)]'
                    : 'border border-white/10 bg-[#140B10]/80 text-[#B8A5A8] hover:text-white hover:border-[#DC2626]/40'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
          {activePresetId === 'custom' && (
            <span className="px-3.5 py-2 rounded-lg text-xs font-medium border border-[#EA580C]/40 bg-[#EA580C]/15 text-[#FDBA74] whitespace-nowrap">
              Custom Curve
            </span>
          )}
        </div>
      </div>

      {/* Interactive Frequency Curve Preview */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#10080D]/85 p-5 sm:p-6 space-y-6">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#080406]/90 p-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-24 overflow-visible"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="eqAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(234, 88, 12, 0.36)" />
                <stop offset="100%" stopColor="rgba(153, 27, 27, 0.02)" />
              </linearGradient>
              <linearGradient id="eqStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="50%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>
            {/* 0 dB center reference */}
            <line
              x1="20"
              y1={height / 2}
              x2={width - 20}
              y2={height / 2}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="4 4"
            />
            <path d={areaPath} fill="url(#eqAreaGrad)" />
            <path d={linePath} fill="none" stroke="url(#eqStrokeGrad)" strokeWidth="2.5" />
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#F5EFEF"
                stroke="#DC2626"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>

        {/* 10-Band Vertical Sliders */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 sm:gap-2">
          {EQ_FREQUENCY_LABELS.map((label, idx) => {
            const val = gains[idx] ?? 0;
            const percent = ((val + 12) / 24) * 100;
            return (
              <div key={label} className="flex flex-col items-center gap-2.5">
                <span className="text-[11px] font-mono-tabular text-[#D6C4C7]">
                  {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                </span>

                <div className="relative flex h-44 w-9 items-center justify-center">
                  {/* Track Background */}
                  <div className="relative h-full w-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#991B1B] to-[#EA580C] rounded-full"
                      style={{ height: `${percent}%` }}
                    />
                  </div>

                  {/* Accessible Rotated Range Input */}
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={val}
                    onChange={(e) => onChangeBandGain(idx, parseFloat(e.target.value))}
                    aria-label={`${label} gain`}
                    className="gothic-slider absolute w-44 h-8 -rotate-90 opacity-90"
                  />
                </div>

                <span className="text-[11px] font-mono-tabular text-[#8E7A7E] whitespace-nowrap">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preamp & Cathedral Reverb */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/[0.08] bg-[#10080D]/85 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F5EFEF]">
              <Sliders size={16} className="text-[#DC2626]" />
              <span>Preamp Gain</span>
            </div>
            <span className="text-xs font-mono-tabular text-[#EA580C]">
              {preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)} dB
            </span>
          </div>
          <input
            type="range"
            min={-6}
            max={6}
            step={0.5}
            value={preamp}
            onChange={(e) => onChangePreamp(parseFloat(e.target.value))}
            aria-label="Preamp gain"
            className="gothic-slider w-full"
            style={{
              background: `linear-gradient(to right, #DC2626 ${((preamp + 6) / 12) * 100}%, rgba(255,255,255,0.12) ${((preamp + 6) / 12) * 100}%)`,
              height: '4px',
              borderRadius: '9999px',
            }}
          />
          <p className="text-xs text-[#7A686C]">
            Adjusts input headroom before the 10-band filter stage to prevent clipping on heavy bass curves.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#10080D]/85 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F5EFEF]">
              <Sparkles size={16} className="text-[#EA580C]" />
              <span>Cathedral Reverb</span>
            </div>
            <span className="text-xs font-mono-tabular text-[#EA580C]">
              {Math.round((reverbMix / 0.65) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={0.65}
            step={0.01}
            value={reverbMix}
            onChange={(e) => onChangeReverb(parseFloat(e.target.value))}
            aria-label="Cathedral reverb wet mix"
            className="gothic-slider w-full"
            style={{
              background: `linear-gradient(to right, #EA580C ${(reverbMix / 0.65) * 100}%, rgba(255,255,255,0.12) ${(reverbMix / 0.65) * 100}%)`,
              height: '4px',
              borderRadius: '9999px',
            }}
          />
          <p className="text-xs text-[#7A686C]">
            Convolver impulse room simulation that bathes vocals and instruments in vaulted stone acoustics.
          </p>
        </div>
      </div>
    </div>
  );
}
