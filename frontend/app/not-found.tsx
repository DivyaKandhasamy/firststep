import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { Brand } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found — Firststep" };

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-6 py-16">
      <span className="pointer-events-none absolute -right-40 -top-40 size-[420px] rounded-full border-[70px] border-brand/5" />
      <span className="pointer-events-none absolute -bottom-52 -left-32 size-[420px] rounded-full bg-gradient-to-br from-[#f2edff] to-[#e7f5ff]" />

      <section className="relative z-10 flex max-w-md flex-col items-center text-center">
        <Brand />

        <div className="relative mt-12 grid size-[120px] place-items-center rounded-[30px] bg-gradient-to-br from-[#f3f0ff] to-[#e9f5ff]">
          <span className="grid size-[66px] -rotate-6 place-items-center rounded-[20px] bg-brand text-white shadow-[0_12px_24px_rgba(105,87,232,0.25)]">
            <Compass size={34} strokeWidth={1.8} />
          </span>
          <Sparkles size={18} className="absolute -right-1 top-3 text-sun" fill="currentColor" />
          <Sparkles size={13} className="absolute -left-2 bottom-4 text-coral" fill="currentColor" />
        </div>

        <p className="mt-8 text-[10px] font-extrabold tracking-[0.16em] text-brand">ERROR 404</p>
        <h1 className="mt-2 text-balance text-[34px] font-extrabold leading-tight tracking-[-0.04em]">Looks like you took a wrong step.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Don&apos;t worry, your next opportunity is just a click away.
        </p>

        <Link
          href="/"
          className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-[13px] font-bold text-white shadow-[0_9px_20px_rgba(105,87,232,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark active:translate-y-0 active:scale-[0.98]"
        >
          Back to opportunities
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </main>
  );
}
