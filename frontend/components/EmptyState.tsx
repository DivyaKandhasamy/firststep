"use client";

import { motion } from "motion/react";
import { ArrowRight, Bookmark, Briefcase, SearchX, Sparkles } from "lucide-react";
import { primaryButton } from "./ui";

const COPY = {
  saved: { title: "Your shortlist is waiting.", text: "Found something interesting? Bookmark it and come back whenever you're ready.", button: "Explore opportunities", icon: Bookmark },
  applications: { title: "Your journey starts with one click.", text: "When you apply for an opportunity, mark it here to keep track of your applications.", button: "Discover jobs", icon: Briefcase },
  search: { title: "No opportunities found — yet.", text: "Try a different keyword or clear a few filters. Your next step may be one search away.", button: "Clear and explore", icon: SearchX },
} as const;

export function EmptyState({ type, onAction }: { type: keyof typeof COPY; onAction: () => void }) {
  const { title, text, button, icon: Icon } = COPY[type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[410px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#d9d4f0] bg-white/60 px-6 py-10 text-center"
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="relative mb-6 grid size-[110px] place-items-center rounded-[28px] bg-gradient-to-br from-[#f3f0ff] to-[#e9f5ff]"
      >
        <span className="grid size-[60px] -rotate-6 place-items-center rounded-[18px] bg-brand text-white shadow-[0_10px_22px_rgba(105,87,232,0.25)]">
          <Icon size={30} strokeWidth={1.8} fill={type === "saved" ? "currentColor" : "none"} />
        </span>
        <Sparkles size={16} className="absolute -right-1 top-2 text-sun" fill="currentColor" />
        <Sparkles size={12} className="absolute -left-2 bottom-3 text-coral" fill="currentColor" />
      </motion.div>
      <h3 className="text-xl font-extrabold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">{text}</p>
      <button onClick={onAction} className={`${primaryButton} mt-6`}>
        {button}
        <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
      </button>
    </motion.div>
  );
}
