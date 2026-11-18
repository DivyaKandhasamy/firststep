"use client";

import { motion } from "motion/react";
import { Bookmark, Building2, Check, Clock, ExternalLink, MapPin } from "lucide-react";
import type { Job, JobType, WorkMode } from "@/lib/types";
import { accentFor, isNew, trimDescription } from "@/lib/utils";

const MODE_TONE: Record<WorkMode, string> = {
  Remote: "bg-[#e9f8f4] text-[#1f8f78]",
  Hybrid: "bg-[#fff8e7] text-[#a97c10]",
  "On-site": "bg-[#eaf3fd] text-[#2f7ec4]",
};
const TYPE_TONE: Record<JobType, string> = {
  Internship: "bg-brand-soft text-brand",
  "Full-Time": "bg-[#fff0ed] text-[#d95c43]",
};
const SKILL_TONES = ["bg-[#f6f5f9] text-[#625e72]", "bg-[#f3f1ff] text-[#5a4bc9]", "bg-[#eefaf6] text-[#26806c]"];

type Props = {
  job: Job;
  saved: boolean;
  applied: boolean;
  onSave: () => void;
  onApply: () => void;
  index?: number;
  demo?: boolean;
};

export function JobCard({ job, saved, applied, onSave, onApply, index = 0, demo }: Props) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index * 0.04, 0.25), duration: 0.28 } }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
      className="flex min-w-0 flex-col rounded-[17px] border border-line bg-white p-5 shadow-[0_5px_18px_rgba(44,38,80,0.035)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-[#cbc4fa] hover:shadow-[0_13px_30px_rgba(64,53,130,0.09)]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-[11px] text-[15px] font-extrabold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
            style={{ background: accentFor(job.company) }}
          >
            {job.company.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <small className="block truncate text-xs font-bold">{job.company}</small>
            {job.portal && !demo && <b className="mt-0.5 block text-[10px] font-semibold text-[#9996a7]">via {job.portal}</b>}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isNew(job) && (
            <span className="rounded-md bg-[#fff0ed] px-1.5 py-1 text-[9px] font-extrabold tracking-wider text-[#e7644c] shadow-[0_0_12px_rgba(255,128,102,0.45)]">
              NEW
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.8 }}
            animate={saved ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            onClick={onSave}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${job.role} from saved` : `Save ${job.role}`}
            className={`grid size-[34px] place-items-center rounded-[9px] border transition-colors ${
              saved
                ? "border-[#d3cdf7] bg-brand-soft text-brand"
                : "border-line text-[#8f8b9d] hover:border-[#d3cdf7] hover:bg-brand-soft hover:text-brand"
            }`}
          >
            <Bookmark size={19} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
          </motion.button>
        </div>
      </div>

      <div className="mt-4">
        {demo && <span className="text-[9px] font-extrabold tracking-[0.1em] text-[#aaa7b5]">DEMO OPPORTUNITY</span>}
        <h3 className="text-base font-extrabold leading-snug tracking-[-0.02em]">{job.role}</h3>
        {job.originalTitle !== job.role && (
          <p className="mt-0.5 truncate text-[11px] text-[#9996a7]">{job.originalTitle}</p>
        )}
        {job.description && (
          <p className="mt-2 line-clamp-2 min-h-[2.6em] text-xs leading-[1.65] text-muted">{trimDescription(job.description)}</p>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
        <span className="flex items-center gap-1 rounded-md bg-[#f6f5f9] px-2 py-1 text-[#625e72]">
          <MapPin size={12} /> {job.city}
        </span>
        <span className={`flex items-center gap-1 rounded-md px-2 py-1 ${MODE_TONE[job.mode]}`}>
          <Building2 size={12} /> {job.mode}
        </span>
        <span className={`flex items-center gap-1 rounded-md px-2 py-1 ${TYPE_TONE[job.type]}`}>
          <Clock size={12} /> {job.type}
        </span>
      </div>

      <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
        {job.skills.slice(0, 3).map((s, i) => (
          <span key={s} className={`rounded-[7px] px-2 py-1 text-[11px] font-semibold ${SKILL_TONES[i % 3]}`}>
            {s}
          </span>
        ))}
      </div>

      <div className="min-h-4 flex-1" />
      <div className="flex gap-2 border-t border-[#f0eef4] pt-4">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-brand text-xs font-bold text-white transition hover:-translate-y-px hover:bg-brand-dark"
        >
          Apply now
          <ExternalLink size={15} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-0.5" />
        </a>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onApply}
          aria-pressed={applied}
          className={`flex min-h-9 min-w-[112px] items-center justify-center gap-1.5 rounded-[9px] border px-2.5 text-xs font-bold transition-colors ${
            applied
              ? "border-[#c7eee5] bg-[#e9f8f4] text-[#178b73]"
              : "border-line text-[#716d81] hover:border-[#bdb6ed] hover:text-brand"
          }`}
        >
          {applied && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check size={15} strokeWidth={3} />
            </motion.span>
          )}
          {applied ? "Applied" : "Mark applied"}
        </motion.button>
      </div>
    </motion.article>
  );
}

export function SkeletonCard() {
  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-[17px] border border-line bg-white p-5 [&_i]:block [&_i]:rounded-[7px] [&_i]:bg-[#efedf4]">
      <div className="flex gap-2.5">
        <i className="size-10" />
        <span className="flex-1 space-y-2 pt-1.5">
          <i className="h-2 w-[45%]" />
          <i className="h-1.5 w-[28%]" />
        </span>
      </div>
      <i className="mt-7 h-4 w-[65%]" />
      <i className="mt-3.5 h-2 w-[90%]" />
      <i className="mt-2 h-2 w-[72%]" />
      <div className="mt-9 flex gap-2">
        <i className="h-[22px] w-[58px]" />
        <i className="h-[22px] w-[58px]" />
        <i className="h-[22px] w-[58px]" />
      </div>
      <i className="mt-10 h-9" />
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}
