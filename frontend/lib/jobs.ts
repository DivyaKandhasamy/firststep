import { MOCK_JOBS } from "./mock-data";
import { supabase } from "./supabase";
import type { Job, JobRow, JobType, WorkMode } from "./types";

const MODES: WorkMode[] = ["Remote", "Hybrid", "On-site"];
const TYPES: JobType[] = ["Internship", "Full-Time"];

export function rowToJob(r: JobRow): Job {
  return {
    id: r.id,
    role: r.ai_role || r.original_title,
    originalTitle: r.original_title,
    company: r.company_name,
    city: r.ai_city || "India",
    mode: MODES.find((m) => m === r.ai_work_mode) ?? "On-site",
    type: TYPES.find((t) => t === r.ai_job_type) ?? "Full-Time",
    skills: (r.ai_skills ?? []).slice(0, 3),
    description: r.raw_description ?? "",
    url: r.source_url,
    portal: r.source_portal ?? "",
    scrapedAt: r.scraped_at,
  };
}

export type JobsResult = { jobs: Job[]; source: "live" | "demo" };

/** Fetch active jobs (newest first). Falls back to mock data if Supabase is unset or fails. */
export async function loadJobs(): Promise<JobsResult> {
  if (!supabase) return { jobs: MOCK_JOBS(), source: "demo" };
  try {
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .gte("scraped_at", cutoff)
      .order("scraped_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    if (!data?.length) return { jobs: MOCK_JOBS(), source: "demo" }; // empty DB → still show something
    return { jobs: (data as JobRow[]).map(rowToJob), source: "live" };
  } catch (err) {
    console.warn("Supabase fetch failed, using demo data:", err);
    return { jobs: MOCK_JOBS(), source: "demo" };
  }
}
