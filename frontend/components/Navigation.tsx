"use client";

import { motion } from "motion/react";
import { Bookmark, Briefcase, Rocket, Search, Sparkles, type LucideIcon } from "lucide-react";
import type { View } from "@/lib/types";
import { Brand } from "./ui";

type Counts = { discover: number; saved: number; applications: number };
type Props = { view: View; setView: (v: View) => void; counts: Counts };

const ITEMS: { id: View; label: string; short: string; icon: LucideIcon }[] = [
  { id: "discover", label: "All Jobs", short: "Discover", icon: Search },
  { id: "saved", label: "Saved Jobs", short: "Saved", icon: Bookmark },
  { id: "applications", label: "My Applications", short: "Applied", icon: Briefcase },
];

export function Sidebar({ view, setView, counts }: Props) {
  return (
    <motion.aside
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-y-0 left-0 z-30 hidden w-[245px] flex-col border-r border-line bg-white px-5 pb-5 pt-[30px] lg:flex"
    >
      <div>
        <Brand />
        <p className="ml-[47px] mt-2 text-[11px] font-semibold text-[#9895a8]">Start somewhere great.</p>
      </div>

      <nav aria-label="Primary" className="mt-12">
        <p className="px-3 pb-2.5 text-[10px] font-extrabold tracking-[0.15em] text-[#aaa7b8]">YOUR SPACE</p>
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              aria-current={active ? "page" : undefined}
              className={`relative my-1 flex h-[50px] w-full items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors ${
                active ? "text-brand" : "text-muted hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="side-active"
                  className="absolute inset-0 rounded-xl bg-brand-soft"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              {active && <span className="absolute left-0 z-10 h-[21px] w-[3px] rounded bg-brand" />}
              <Icon size={19} strokeWidth={1.8} className="relative" />
              <span className="relative flex-1 whitespace-nowrap text-left">{label}</span>
              <motion.span
                key={counts[id]}
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                className={`relative grid h-[21px] min-w-[25px] place-items-center rounded-lg px-1.5 text-[11px] font-bold ${
                  active ? "bg-white text-brand" : "bg-[#f4f3f7] text-[#9996a9]"
                }`}
              >
                {counts[id]}
              </motion.span>
            </button>
          );
        })}
      </nav>

      <div className="relative mt-auto overflow-hidden rounded-[17px] bg-gradient-to-br from-[#f3f0ff] to-[#e9f5ff] px-[18px] pb-5 pt-[78px]">
        <span className="absolute -right-7 -top-9 size-24 rounded-full border border-brand/10" />
        <span className="absolute left-[19px] top-5 grid size-[45px] -rotate-[9deg] place-items-center rounded-[15px] bg-brand text-white shadow-[0_10px_20px_rgba(105,87,232,0.2)]">
          <Rocket size={25} strokeWidth={1.8} />
        </span>
        <Sparkles size={13} className="absolute left-20 top-7 text-coral" />
        <Sparkles size={10} className="absolute left-[105px] top-[54px] text-sun" />
        <h3 className="relative max-w-[160px] text-[13px] font-extrabold leading-[1.55]">Big careers start with small steps.</h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">Keep exploring. Your opportunity is out there.</p>
      </div>
      <p className="mt-4 text-center text-[10px] text-[#aaa7b6]">Made for students, with care.</p>
    </motion.aside>
  );
}

export function BottomNav({ view, setView, counts }: Props) {
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden"
    >
      {ITEMS.map(({ id, short, icon: Icon }) => {
        const active = view === id;
        const count = id === "discover" ? 0 : counts[id];
        return (
          <button
            key={id}
            onClick={() => setView(id)}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-bold ${
              active ? "text-brand" : "text-[#8f8b9d]"
            }`}
          >
            <span className="relative">
              <Icon size={21} strokeWidth={1.8} />
              {count > 0 && (
                <b className="absolute -right-3 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[9px] text-white">
                  {count}
                </b>
              )}
            </span>
            {short}
          </button>
        );
      })}
    </nav>
  );
}
