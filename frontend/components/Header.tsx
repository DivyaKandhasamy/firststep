"use client";

import { CalendarDays } from "lucide-react";
import { Brand } from "./ui";

export function DashboardHeader() {
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());
  return (
    <header className="flex min-h-[96px] items-center justify-between gap-4 py-5 lg:h-[116px] lg:py-0">
      <div className="lg:hidden">
        <Brand compact />
      </div>
      <div className="hidden lg:block">
        <span className="block text-[10px] font-extrabold tracking-[0.16em] text-brand">YOUR CAREER JOURNEY STARTS HERE</span>
        <h1 className="mt-1.5 text-[19px] font-extrabold tracking-[-0.025em]">Hey there, future professional!</h1>
        <p className="mt-0.5 text-xs text-muted">Let&apos;s find something worth starting.</p>
      </div>
      <span
        suppressHydrationWarning
        className="flex h-[37px] items-center gap-2 rounded-[11px] border border-line bg-white px-3 text-xs font-semibold text-[#656276]"
      >
        <CalendarDays size={16} className="text-brand" />
        {date}
      </span>
    </header>
  );
}
