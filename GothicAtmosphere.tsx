import { GOTHIC_BACKDROP } from '../data/assets';

export function GothicAtmosphere() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#060406]"
      aria-hidden="true"
    >
      {/* Subtle Cathedral Vault Backdrop */}
      <img
        src={GOTHIC_BACKDROP}
        alt=""
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.16] mix-blend-screen filter contrast-125 saturate-110"
      />

      {/* Swirling Crimson & Blood-Orange Atmospheric Mist */}
      <div className="animate-mist-slow absolute -top-[20%] -left-[15%] h-[85vh] w-[85vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.22)_0%,rgba(127,29,29,0.08)_42%,transparent_72%)] blur-3xl" />
      <div className="animate-mist-counter absolute -right-[15%] -bottom-[20%] h-[80vh] w-[80vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.16)_0%,rgba(154,52,18,0.06)_45%,transparent_75%)] blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(185,28,28,0.09)_0%,transparent_55%)]" />

      {/* Subtle Drifting Bat Silhouettes */}
      <svg
        viewBox="0 0 64 28"
        className="animate-bat-one absolute top-0 left-0 h-5 w-11 text-[#2a0a0d] drop-shadow-[0_0_6px_rgba(185,28,28,0.25)]"
        fill="currentColor"
      >
        <path d="M32 14c-1.8-4.5-6.5-8.5-13-9.5 2.5 2.5 3.5 5 2 8-4.5-3.5-11.5-5-18.5-3.5 4.5 2.8 7 6.5 6.5 11.2 3.8-2.2 8.2-2.6 12-1.2 1.8 1.8 3.6 3.5 5 5 1.2-1.5 2.2-3 2.8-4.5.8 1.5 1.6 3 3.2 4.5 1.4-1.5 3.2-3.2 5-5 3.8-1.4 8.2-1 12 1.2-.5-4.7 2-8.4 6.5-11.2-7-1.5-14 0-18.5 3.5-1.5-3-0.5-5.5 2-8-6.5 1-11.2 5-13 9.5z" />
      </svg>

      <svg
        viewBox="0 0 64 28"
        className="animate-bat-two absolute top-0 left-0 h-4 w-9 text-[#3b0f12] drop-shadow-[0_0_6px_rgba(234,88,12,0.2)]"
        fill="currentColor"
      >
        <path d="M32 14c-1.8-4.5-6.5-8.5-13-9.5 2.5 2.5 3.5 5 2 8-4.5-3.5-11.5-5-18.5-3.5 4.5 2.8 7 6.5 6.5 11.2 3.8-2.2 8.2-2.6 12-1.2 1.8 1.8 3.6 3.5 5 5 1.2-1.5 2.2-3 2.8-4.5.8 1.5 1.6 3 3.2 4.5 1.4-1.5 3.2-3.2 5-5 3.8-1.4 8.2-1 12 1.2-.5-4.7 2-8.4 6.5-11.2-7-1.5-14 0-18.5 3.5-1.5-3-0.5-5.5 2-8-6.5 1-11.2 5-13 9.5z" />
      </svg>

      {/* Deep Edge Vignette for Readability */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(4,2,4,0.88)_100%)]" />
    </div>
  );
}
