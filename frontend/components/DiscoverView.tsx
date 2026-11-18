"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lightbulb, Sparkles } from "lucide-react";
import { DEFAULT_FILTERS, type Filters, type Job } from "@/lib/types";
import { matchesQuery } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import { Hero } from "./Hero";
import { JobCard, SkeletonCard } from "./JobCard";
import { StatsBar } from "./StatsBar";
import { Eyebrow } from "./ui";

type Props = {
  jobs: Job[];
  loading: boolean;
  demo: boolean;
  stats: { total: number; today: number; remote: number; lastUpdate: string };
  savedIds: string[];
  appliedIds: string[];
  toggleSaved: (id: string) => void;
  toggleApplied: (id: string) => void;
  exploreTick: number;
};

function Aside({ skills }: { skills: string[] }) {
  const tones = ["bg-[#efedff] text-brand", "bg-[#e9f8f4] text-[#239b82]", "bg-[#fff1ed] text-[#df674e]", "bg-[#fff8e7] text-[#bd8b18]"];
  return (
    <aside className="hidden space-y-3.5 xl:block">
      {skills.length > 0 && (
        <div className="rounded-[15px] border border-line bg-white p-[17px]">
          <span className="text-[10px] font-extrabold tracking-widest text-[#9b98a9]">TRENDING NOW</span>
          <h3 className="mt-2 text-[13px] font-extrabold leading-normal">Skills in demand right now</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span key={s} className={`rounded-[7px] px-2 py-1.5 text-[11px] font-bold ${tones[i % 4]}`}>{s}</span>
            ))}
          </div>
        </div>
      )}
      <div className="relative overflow-hidden rounded-[15px] border border-[#f3e8ca] bg-[#fffaf0] p-[17px] pt-[58px]">
        <span className="absolute left-[17px] top-[15px] grid size-8 place-items-center rounded-[10px] bg-sun text-[#a57408]">
          <Lightbulb size={17} />
        </span>
        <span className="text-[10px] font-extrabold tracking-widest text-[#9b98a9]">A LITTLE CAREER ADVICE</span>
        <h3 className="mt-2 text-[13px] font-extrabold leading-normal">Start before you feel ready.</h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#77717b]">
          Don&apos;t wait until graduation to build experience. Even a small internship can be your biggest first step.
        </p>
      </div>
      <div className="flex items-start gap-2.5 rounded-[15px] border border-line bg-white p-[17px]">
        <span className="mt-1 grid size-[11px] place-items-center rounded-full bg-[#d8f3ed]">
          <i className="size-[5px] animate-pulse-dot rounded-full bg-mint" />
        </span>
        <div>
          <b className="text-xs">Fresh opportunities</b>
          <p className="mt-1 text-[11px] leading-snug text-muted">New listings are added every morning.</p>
        </div>
      </div>
    </aside>
  );
}

export function DiscoverView({ jobs, loading, demo, stats, savedIds, appliedIds, toggleSaved, toggleApplied, exploreTick }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusSearch = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 450);
  };

  useEffect(() => {
    if (exploreTick > 0) focusSearch();
  }, [exploreTick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cities = useMemo(() => [...new Set(jobs.map((j) => j.city))].sort((a, b) => a.localeCompare(b)), [jobs]);

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((j) => j.skills.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s]) => s);
  }, [jobs]);

  // Pure client-side filtering: instant, no reloads.
  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) =>
          matchesQuery(j, filters.query) &&
          (filters.cities.length === 0 || filters.cities.includes(j.city)) &&
          (filters.type === "All" || j.type === filters.type) &&
          (filters.mode === "All" || j.mode === filters.mode),
      ),
    [jobs, filters],
  );

  return (
    <>
      <Hero onExplore={focusSearch} total={stats.total} today={stats.today} remote={stats.remote} />
      <StatsBar total={stats.total} today={stats.today} lastUpdate={stats.lastUpdate} source={loading ? "loading" : demo ? "demo" : "live"} />

      <section ref={sectionRef} className="scroll-mt-5 pb-10 pt-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>FRESH OPPORTUNITIES</Eyebrow>
            <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] md:text-3xl">Explore opportunities</h2>
            <p className="mt-1.5 text-[13px] text-muted">Find your next opportunity. We&apos;ve brought everything together for you.</p>
          </div>
          <span className="text-xs text-muted" aria-live="polite">
            <b className="mr-1 inline-grid h-[25px] min-w-[25px] place-items-center rounded-lg bg-brand-soft px-1 text-xs text-brand">{filtered.length}</b>
            opportunities found
          </span>
        </div>

        <FilterBar filters={filters} setFilters={setFilters} cities={cities} inputRef={inputRef} />

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_230px]">
          <div>
            {demo && !loading && (
              <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[#858294]">
                <Sparkles size={14} className="text-sun" />
                Demonstration listings, not verified live vacancies. Add Supabase keys to see real jobs.
              </div>
            )}
            {loading ? (
              <div className="grid gap-3.5 md:grid-cols-2">{[1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)}</div>
            ) : filtered.length ? (
              <motion.div layout className="grid gap-3.5 md:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {filtered.map((job, i) => (
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
                </AnimatePresence>
              </motion.div>
            ) : (
              <EmptyState type="search" onAction={() => setFilters(DEFAULT_FILTERS)} />
            )}
          </div>
          <Aside skills={topSkills} />
        </div>
      </section>
    </>
  );
}
