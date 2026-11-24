import { Menu, Search, Upload, X } from 'lucide-react';

interface TopBarProps {
  title: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu: () => void;
  onTriggerUpload: () => void;
}

export function TopBar({
  title,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  onTriggerUpload,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/[0.07] bg-[#0B070A]/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#A69598] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg sm:text-xl font-semibold tracking-wide text-[#F5EFEF] truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative w-44 sm:w-64 md:w-72">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7A686C]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search songs, artists, albums..."
            aria-label="Search library"
            className="w-full rounded-lg border border-white/[0.08] bg-[#140C11]/90 py-2 pl-9 pr-8 text-sm text-[#F5EFEF] placeholder:text-[#7A686C] focus:border-[#DC2626]/60 focus:outline-none focus:ring-1 focus:ring-[#DC2626]/40 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A686C] hover:text-[#F5EFEF]"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onTriggerUpload}
          className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-[#DC2626]/40 bg-[#991B1B]/25 hover:bg-[#991B1B]/45 px-3.5 py-2 text-xs font-medium text-[#F5EFEF] transition-colors whitespace-nowrap shrink-0"
        >
          <Upload size={14} />
          <span>Add Files</span>
        </button>
      </div>
    </header>
  );
}
