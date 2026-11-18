"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useLocalIds } from "@/hooks/useLocalIds";
import { loadJobs } from "@/lib/jobs";
import type { Job, View } from "@/lib/types";
import { isToday, timeAgo } from "@/lib/utils";
import { CollectionView } from "./CollectionView";
import { DiscoverView } from "./DiscoverView";
import { DashboardHeader } from "./Header";
import { BottomNav, Sidebar } from "./Navigation";
import { Brand } from "./ui";

export default function FirstStepApp() {
  const [view, setView] = useState<View>("discover");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(true);
  const [exploreTick, setExploreTick] = useState(0);
  const saved = useLocalIds("saved_job_ids");
  const applied = useLocalIds("applied_job_ids");

  useEffect(() => {
    let alive = true;
    loadJobs().then((res) => {
      if (!alive) return;
      setJobs(res.jobs);
      setDemo(res.source === "demo");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Only count ids that still exist (jobs older than 14 days get purged server-side).
  const savedJobs = useMemo(() => jobs.filter((j) => saved.ids.includes(j.id)), [jobs, saved.ids]);
  const appliedJobs = useMemo(() => jobs.filter((j) => applied.ids.includes(j.id)), [jobs, applied.ids]);

  const stats = useMemo(() => {
    const latest = jobs.reduce<string | null>((m, j) => (!m || j.scrapedAt > m ? j.scrapedAt : m), null);
    return {
      total: jobs.length,
      today: jobs.filter((j) => isToday(j.scrapedAt)).length,
      remote: jobs.filter((j) => j.mode === "Remote").length,
      lastUpdate: loading ? "—" : timeAgo(latest),
    };
  }, [jobs, loading]);

  const counts = { discover: jobs.length, saved: savedJobs.length, applications: appliedJobs.length };

  const changeView = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goDiscover = () => {
    changeView("discover");
    setExploreTick((t) => t + 1);
  };

  const shared = { demo, savedIds: saved.ids, appliedIds: applied.ids, toggleSaved: saved.toggle, toggleApplied: applied.toggle };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen">
        <Sidebar view={view} setView={changeView} counts={counts} />
        <main className="mx-auto max-w-[1700px] px-4 pb-24 sm:px-6 lg:ml-[245px] lg:px-[38px] lg:pb-7">
          <DashboardHeader />
          <AnimatePresence mode="wait">
            {view === "discover" && (
              <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DiscoverView jobs={jobs} loading={loading} stats={stats} exploreTick={exploreTick} {...shared} />
              </motion.div>
            )}
            {view === "saved" && <CollectionView key="saved" type="saved" jobs={savedJobs} onExplore={goDiscover} {...shared} />}
            {view === "applications" && <CollectionView key="applications" type="applications" jobs={appliedJobs} onExplore={goDiscover} {...shared} />}
          </AnimatePresence>
          <footer className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[11px] text-muted">
            <Brand compact />
            <span>{demo ? "Opportunities shown are demo data for exploration." : "Listings are aggregated from public portals. Always verify on the source site."}</span>
            <b className="sm:ml-auto">© {new Date().getFullYear()} Firststep</b>
          </footer>
        </main>
        <BottomNav view={view} setView={changeView} counts={counts} />
      </div>
    </MotionConfig>
  );
}
