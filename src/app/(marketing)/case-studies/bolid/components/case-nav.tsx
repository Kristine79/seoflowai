"use client";

import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { id: "context", label: "Контекст" },
  { id: "methodology", label: "Как измеряли" },
  { id: "results", label: "Результаты" },
  { id: "intent", label: "Intent" },
  { id: "sources", label: "Источники" },
  { id: "competitors", label: "Конкуренты" },
  { id: "positioning", label: "Positioning" },
  { id: "actions", label: "Гэпы → действия" },
  { id: "verification", label: "Verification" },
  { id: "limitations", label: "Ограничения" },
];

export function CaseNav() {
  const [active, setActive] = useState(NAV_ITEMS[0].id);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const mid = window.innerHeight * 0.5;
      let current = NAV_ITEMS[0].id;
      let bestTop = -Infinity;
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= mid && top > bestTop) {
          bestTop = top;
          current = item.id;
        }
      }
      setActive(current);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [active]);

  return (
    <nav
      aria-label="Разделы кейса"
      className="sticky top-16 z-40 border-b border-zinc-200/70 bg-white/85 backdrop-blur"
    >
      <div
        ref={listRef}
        className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive ? "true" : undefined}
              className={
                isActive
                  ? "whitespace-nowrap border-b-2 border-zinc-900 px-3 py-3 text-[13px] font-semibold text-zinc-900"
                  : "whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              }
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}