"use client";

import { Briefcase, Clock, Sparkles } from "lucide-react";
import { CountUp } from "./ui";

type Props = { total: number; today: number; lastUpdate: string; source: "live" | "demo" | "loading" };

export function StatsBar({ total, today, lastUpdate, source }: Props) {
  const items = [
    { icon: Briefcase, tone: "text-brand bg-brand-soft", value: <CountUp value={total} />, label: "Total active jobs" },
    { icon: Sparkles, tone: "text-coral bg-[#fff0ed]", value: <CountUp value={today} />, label: "Jobs added today" },
    { icon: Clock, tone: "text-[#27a78c] bg-[#eaf9f5]", value: lastUpdate, label: "Latest update" },
  ];
  return (
    <section className="mt-[18px] flex flex-wrap items-center gap-y-3 rounded-2xl border border-line bg-white px-5 py-3.5 shadow-[0_5px_18px_rgba(38,35,74,0.035)]">
      {items.map(({ icon: Icon, tone, value, label }, i) => (
        <div
          key={label}
          className={`flex min-w-[170px] flex-1 items-center gap-3 py-1 sm:border-r sm:border-line sm:px-6 ${i === 0 ? "sm:pl-0" : ""} sm:last-of-type:border-0`}
        >
          <span className={`grid size-10 place-items-center rounded-[11px] ${tone}`}>
            <Icon size={20} strokeWidth={1.8} />
          </span>
          <span>
            <strong className="block text-base font-extrabold" suppressHydrationWarning>{value}</strong>
            <small className="mt-0.5 block text-[11px] text-muted">{label}</small>
          </span>
        </div>
      ))}
      <p className="flex w-full items-center gap-2 text-[11px] text-[#9693a3] sm:ml-auto sm:w-auto">
        <span className={`size-[7px] rounded-full ring-4 ${source === "live" ? "bg-mint ring-[#eaf9f5]" : "bg-sun ring-[#fff8e7]"}`} />
        {source === "live" ? "Live data, refreshed daily" : source === "demo" ? "Demo data — connect Supabase for live jobs" : "Loading…"}
      </p>
    </section>
  );
}
