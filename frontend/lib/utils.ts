import type { Job } from "./types";

const ACCENTS = ["#6957E8", "#E45A52", "#F09A4B", "#42BFA4", "#4A9CE8", "#FF8066", "#8D6DDE", "#D8A52A"];

/** Stable accent colour per company, so a logo never changes between renders. */
export function accentFor(company: string): string {
  let hash = 0;
  for (const ch of company) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

export const isNew = (job: Job, now = Date.now()) =>
  now - new Date(job.scrapedAt).getTime() < 24 * 60 * 60 * 1000;

export function isToday(iso: string, now = new Date()) {
  const d = new Date(iso);
  return d.toDateString() === now.toDateString();
}

export function timeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return "—";
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function trimDescription(text: string, max = 170): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

export function matchesQuery(job: Job, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [job.role, job.originalTitle, job.company, ...job.skills].some((v) =>
    v.toLowerCase().includes(q),
  );
}
