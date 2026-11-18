"use client";

import { motion } from "motion/react";
import { ArrowRight, Bookmark, Briefcase } from "lucide-react";
import type { Job } from "@/lib/types";
import { EmptyState } from "./EmptyState";
import { JobCard } from "./JobCard";
import { Eyebrow } from "./ui";

type Props = {
  type: "saved" | "applications";
  jobs: Job[]; // already filtered to this collection
  demo: boolean;
  savedIds: string[];
  appliedIds: string[];
  toggleSaved: (id: string) => void;
  toggleApplied: (id: string) => void;
  onExplore: () => void;
};

export function CollectionView({ type, jobs, demo, savedIds, appliedIds, toggleSaved, toggleApplied, onExplore }: Props) {
  const isSaved = type === "saved";
  const Icon = isSaved ? Bookmark : Briefcase;
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="min-h-[60vh]">
      <div className="flex min-h-[190px] flex-wrap items-center justify-between gap-5 rounded-[22px] border border-[#e6e0fb] bg-gradient-to-br from-[#f4f1ff] to-[#eef5ff] px-6 py-8 md:px-10">
        <div>
          <Eyebrow>{isSaved ? "YOUR SHORTLIST" : "YOUR PROGRESS"}</Eyebrow>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] md:text-3xl">{isSaved ? "Your saved opportunities" : "Your applications"}</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            {isSaved ? "Good things are worth keeping. Here's your shortlist." : "Every big career starts with one application."}
          </p>
        </div>
        <div className="grid min-w-40 grid-cols-[42px_auto] items-center gap-x-1 rounded-2xl bg-white/80 p-[18px] shadow-[0_8px_20px_rgba(55,46,107,0.06)]">
          <span className={`row-span-2 grid size-[38px] place-items-center rounded-[11px] ${isSaved ? "bg-brand-soft text-brand" : "bg-[#e9f8f4] text-[#279a82]"}`}>
            <Icon size={22} strokeWidth={1.8} />
          </span>
          <strong className="text-xl font-extrabold">{jobs.length}</strong>
          <small className="text-[10px] uppercase tracking-wider text-muted">{isSaved ? "saved" : "applied"}</small>
        </div>
      </div>

      {jobs.length ? (
        <>
          <div className="mb-4 mt-6 flex items-center justify-between">
            <p className="text-xs text-muted">
              <b className="text-ink">{jobs.length}</b> {jobs.length === 1 ? "opportunity" : "opportunities"} in your {isSaved ? "shortlist" : "tracker"}
            </p>
            <button onClick={onExplore} className="group flex items-center gap-1.5 text-xs font-bold text-brand">
              Explore more <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                demo={demo}
                saved={savedIds.includes(job.id)}
                applied={appliedIds.includes(job.id)}
                onSave={() => toggleSaved(job.id)}
                onApply={() => toggleApplied(job.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6">
          <EmptyState type={type} onAction={onExplore} />
        </div>
      )}
    </motion.section>
  );
}
