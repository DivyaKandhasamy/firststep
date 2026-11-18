export type View = "discover" | "saved" | "applications";
export type JobType = "Internship" | "Full-Time";
export type WorkMode = "Remote" | "Hybrid" | "On-site";

export type Job = {
  id: string;
  role: string; // ai_role
  originalTitle: string;
  company: string;
  city: string;
  mode: WorkMode;
  type: JobType;
  skills: string[];
  description: string;
  url: string;
  portal: string;
  scrapedAt: string; // ISO
};

/** Row shape of public.jobs in Supabase. */
export type JobRow = {
  id: string;
  source_url: string;
  original_title: string;
  company_name: string;
  raw_description: string | null;
  ai_role: string | null;
  ai_city: string | null;
  ai_work_mode: string | null;
  ai_job_type: string | null;
  ai_skills: string[] | null;
  source_portal: string | null;
  scraped_at: string;
};

export type Filters = { query: string; cities: string[]; type: string; mode: string };
export const DEFAULT_FILTERS: Filters = { query: "", cities: [], type: "All", mode: "All" };
