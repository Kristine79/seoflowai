import Link from "next/link";
import { Search } from "lucide-react";
import { Hero } from "./components/hero";
import { CaseNav } from "./components/case-nav";
import { Context } from "./components/context";
import { Methodology } from "./components/methodology";
import { Results } from "./components/results";
import { Intent } from "./components/intent";
import { Sources } from "./components/sources";
import { Competitors } from "./components/competitors";
import { Positioning } from "./components/positioning";
import { Gaps } from "./components/gaps";
import { Verification } from "./components/verification";
import { About } from "./components/about";
import { Limitations } from "./components/limitations";
import { Summary } from "./components/summary";
import { Cta } from "./components/cta";

export default function BolidCaseView() {
  return (
    <div className="min-h-full bg-white">
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm transition-shadow group-hover:shadow-md">
              <Search className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
              SEOFlow <span className="text-zinc-400">AI</span>
            </span>
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-400">
            Case study
          </span>
        </div>
      </header>
      <main>
        <Hero />
        <CaseNav />
        <Context />
        <Methodology />
        <Results />
        <Intent />
        <Sources />
        <Competitors />
        <Positioning />
        <Gaps />
        <Verification />
        <About />
        <Limitations />
        <Summary />
        <Cta />
      </main>
      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Search className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
              SEOFlow <span className="text-zinc-400">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-5 text-sm text-zinc-500">
            <Link href="/" className="transition-colors hover:text-zinc-900">
              Главная
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-zinc-900">
              Политика
            </Link>
            <Link href="/terms" className="transition-colors hover:text-zinc-900">
              Условия
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}