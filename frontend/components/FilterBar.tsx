"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";
import { DEFAULT_FILTERS, type Filters } from "@/lib/types";

type Props = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  cities: string[];
  inputRef: React.RefObject<HTMLInputElement | null>;
};

const TYPES = ["All", "Internship", "Full-Time"];
const MODES = ["All", "Remote", "Hybrid", "On-site"];

function Pills({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 items-center gap-1 border-l border-line pl-3">
      <small className="mr-1 text-[10px] font-bold uppercase tracking-wider text-[#9693a4]">{label}</small>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`h-8 whitespace-nowrap rounded-lg px-2.5 text-[11px] font-semibold transition ${
            value === o
              ? "bg-brand text-white shadow-[0_4px_10px_rgba(105,87,232,0.18)]"
              : "bg-[#f5f4f8] text-[#716e81] hover:bg-brand-soft hover:text-brand"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function FilterBar({ filters, setFilters, cities, inputRef }: Props) {
  const set = (k: "query" | "type" | "mode", v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const dirty = filters.query || filters.cities.length > 0 || filters.type !== "All" || filters.mode !== "All";
  const cityActive = filters.cities.length > 0;
  const cityLabel =
    filters.cities.length === 0
      ? "All Cities"
      : filters.cities.length === 1
        ? filters.cities[0]
        : `${filters.cities.length} Cities`;
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [cityMenuPosition, setCityMenuPosition] = useState({ top: 0, left: 0 });
  const cityFilterRef = useRef<HTMLDivElement>(null);
  const cityTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!cityMenuOpen) return;

    const updatePosition = () => {
      const trigger = cityTriggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const menuHeight = Math.min(320, window.innerHeight - 32);
      setCityMenuPosition({
        top:
          bounds.bottom + 8 + menuHeight <= window.innerHeight
            ? bounds.bottom + 8
            : Math.max(16, bounds.top - menuHeight - 8),
        left: Math.max(16, Math.min(bounds.left, window.innerWidth - 256)),
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const clickedCityMenu = target instanceof Element && target.closest("[data-city-menu]");
      if (!cityFilterRef.current?.contains(target) && !clickedCityMenu) {
        setCityMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCityMenuOpen(false);
        cityTriggerRef.current?.focus();
      }
    };

    updatePosition();
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [cityMenuOpen]);

  return (
    <div className="sticky top-2 z-20 rounded-2xl border border-line bg-white/90 p-3.5 shadow-[0_9px_28px_rgba(37,36,58,0.07)] backdrop-blur-md">
      <div className="flex h-[49px] items-center gap-2.5 rounded-[11px] border border-[#e1deeb] bg-[#fbfafe] px-3.5 text-[#9692a7] transition focus-within:border-[#a99ef3] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(105,87,232,0.09)]">
        <Search size={20} strokeWidth={1.8} />
        <input
          ref={inputRef}
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
          placeholder="Search roles, companies, or skills..."
          aria-label="Search opportunities"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-[#aaa7b7]"
        />
        <AnimatePresence>
          {filters.query && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => set("query", "")}
              aria-label="Clear search"
              className="grid size-7 place-items-center rounded-lg hover:bg-[#eeeafc] hover:text-brand"
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>
        <kbd className="hidden rounded-md border border-line bg-white px-2 py-1 font-sans text-[10px] font-bold text-[#aaa7b6] sm:block">⌘ K</kbd>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pt-3">
        <div ref={cityFilterRef} className="shrink-0">
          <button
            ref={cityTriggerRef}
            type="button"
            aria-label="Filter by city"
            aria-haspopup="listbox"
            aria-expanded={cityMenuOpen}
            onClick={() => setCityMenuOpen((open) => !open)}
            className={`flex h-[36px] items-center gap-2 rounded-[10px] border px-3 text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 ${
            cityActive
              ? "border-[#d8d1ff] bg-brand-soft text-brand"
              : "border-line bg-white text-[#6f6c7e] hover:border-[#d8d1ff] hover:bg-[#fbfaff]"
          }`}
          >
            <MapPin size={15} className={cityActive ? "text-brand" : "text-[#9693a4]"} />
            <span className="font-bold">{cityLabel}</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${cityMenuOpen ? "rotate-180" : ""} ${cityActive ? "text-brand" : "text-[#9693a4]"}`}
            />
          </button>
          {cityMenuOpen &&
            typeof document !== "undefined" &&
            createPortal(
              <motion.div
                data-city-menu
                role="listbox"
                aria-label="Choose a city"
                aria-multiselectable="true"
                onPointerDown={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="fixed z-[100] flex max-h-[min(320px,calc(100vh-32px))] w-60 flex-col overflow-hidden rounded-2xl border border-[#eae8f0] bg-white p-2 shadow-[0_16px_40px_rgba(37,36,58,0.16)]"
                style={{ top: cityMenuPosition.top, left: cityMenuPosition.left }}
              >
                <div className="shrink-0 px-3 pb-2 pt-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9693a4]">
                    Location
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-ink">Choose one or more cities</p>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                  {["All Cities", ...cities].map((city) => {
                    const selected = city === "All Cities" ? !cityActive : filters.cities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          if (city === "All Cities") {
                            setFilters((current) => ({ ...current, cities: [] }));
                          } else {
                            setFilters((current) => ({
                              ...current,
                              cities: current.cities.includes(city)
                                ? current.cities.filter((selectedCity) => selectedCity !== city)
                                : [...current.cities, city],
                            }));
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                          selected
                            ? "bg-brand-soft font-bold text-brand"
                            : "font-medium text-[#5f5c70] hover:bg-[#f8f7fc] hover:text-brand"
                        }`}
                      >
                        {city}
                        {selected && <Check size={15} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>,
              document.body,
            )}
        </div>
        <Pills label="Type" options={TYPES} value={filters.type} onChange={(v) => set("type", v)} />
        <Pills label="Mode" options={MODES} value={filters.mode} onChange={(v) => set("mode", v)} />
        <AnimatePresence>
          {dirty && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="ml-auto flex shrink-0 items-center gap-1 text-[11px] font-bold text-coral"
            >
              <X size={14} /> Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
