"use client";

import { motion } from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { CountUp, Eyebrow, primaryButton } from "./ui";

type Props = { onExplore: () => void; total: number; today: number; remote: number };

export function Hero({ onExplore, total, today, remote }: Props) {
  const stats = [
    { value: total, label: "Active opportunities", tone: "text-brand" },
    { value: today, label: "Added today", tone: "text-coral" },
    { value: remote, label: "Remote roles", tone: "text-[#28a78d]" },
  ];
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1 }}
      className="relative grid min-h-[396px] overflow-hidden rounded-3xl border border-[#e6e0fc] bg-gradient-to-br from-[#f2edff] via-[#edf1ff] to-[#e7f5ff] px-6 pb-28 pt-10 md:px-12 md:pb-[88px] md:pt-12 lg:grid-cols-[54%_46%]"
    >
      <span className="pointer-events-none absolute -top-60 left-[35%] size-[350px] rounded-full border-[65px] border-white/35" />
      <div className="relative z-10 max-w-[590px]">
        <Eyebrow>YOUR NEXT CHAPTER STARTS HERE</Eyebrow>
        <h2 className="mt-4 max-w-[530px] text-[clamp(34px,3.6vw,55px)] font-extrabold leading-[1.06] tracking-[-0.05em]">
          Ready to make your <em className="whitespace-nowrap not-italic text-brand">next move?</em>
        </h2>
        <p className="mt-5 max-w-[485px] text-sm leading-[1.75] text-[#6d6980] md:text-[15px]">
          Discover internships and fresher opportunities from across India. Less searching, more starting.
        </p>
        <button onClick={onExplore} className={`${primaryButton} mt-7 min-h-12 px-6`}>
          Explore opportunities
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Decorative art (hidden on small screens) */}
      <div aria-hidden className="relative z-[2] hidden min-h-[255px] lg:block">
        <div className="absolute left-1/2 top-[48%] size-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 ring-1 ring-white/80" />
        <div className="absolute left-1/2 top-[48%] h-[210px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-brand/20" />
        <div className="absolute left-1/2 top-[48%] h-[250px] w-[330px] -translate-x-1/2 -translate-y-1/2 -rotate-[22deg] rounded-full border border-dashed border-brand/20" />
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-[44%] z-[3] h-[168px] w-[142px] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_16px_15px_rgba(79,68,159,0.16)]"
        >
          <svg viewBox="0 0 160 190" className="size-full">
            <path d="M80 151c-14-24-26-49-22-78C62 44 80 18 80 18s18 26 22 55c4 29-8 54-22 78Z" fill="#fff" />
            <path d="M80 18s18 26 22 55c4 29-8 54-22 78V18Z" fill="#F0EEFF" />
            <circle cx="80" cy="72" r="17" fill="#6957E8" />
            <circle cx="80" cy="72" r="10" fill="#BBDDFB" />
            <path d="M58 101c-20 10-27 33-27 50l29-15M102 101c20 10 27 33 27 50l-29-15" fill="#6957E8" />
            <path d="M69 145h22l-3 22-8 15-8-15Z" fill="#FF8066" />
            <path d="M74 146h12l-2 18-4 9-4-9Z" fill="#F6C85F" />
          </svg>
        </motion.div>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 3.8, repeat: Infinity }}
          className="absolute left-[2%] top-[19%] z-[5] flex items-center gap-2 rounded-[11px] border border-[#e1ddef]/80 bg-white/95 px-3 py-2 shadow-[0_10px_25px_rgba(65,57,112,0.12)]"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-coral text-[11px] font-extrabold text-white">R</span>
          <span>
            <b className="block whitespace-nowrap text-[10px]">Design Intern</b>
            <small className="mt-0.5 block whitespace-nowrap text-[9px] text-muted">Remote · New</small>
          </span>
        </motion.div>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity }}
          className="absolute -right-[2%] bottom-[15%] z-[5] flex items-center gap-2 rounded-[11px] border border-[#e1ddef]/80 bg-white/95 px-3 py-2 shadow-[0_10px_25px_rgba(65,57,112,0.12)]"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-mint text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          <span>
            <b className="block whitespace-nowrap text-[10px]">You&apos;re a match!</b>
            <small className="mt-0.5 block whitespace-nowrap text-[9px] text-muted">React · Bengaluru</small>
          </span>
        </motion.div>
        <motion.span animate={{ rotate: [0, 20, 0], scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bottom-[18%] left-[15%] z-[4] text-sun">
          <Sparkles size={22} fill="currentColor" />
        </motion.span>
        <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity }} className="absolute right-[13%] top-[14%] z-[4] text-coral">
          <Sparkles size={15} fill="currentColor" />
        </motion.span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/85 bg-white/65 px-6 py-3 backdrop-blur-[10px] md:px-12">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 + i * 0.1 }}
            className="flex items-baseline gap-2 border-r border-[#756c9c]/15 pr-4 last:border-0 md:min-w-[155px]"
          >
            <strong className={`text-xl font-extrabold ${s.tone}`}>
              <CountUp value={s.value} />
            </strong>
            <span className="text-[11px] font-semibold text-[#77738a]">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
