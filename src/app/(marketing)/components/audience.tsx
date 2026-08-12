"use client";
import { Building2, User, Zap, TrendingUp } from "lucide-react";

const audiences = [
  {
    icon: Building2,
    title: "SEO-агентства",
    text: "Управляйте directory campaigns клиентов из одного workspace.",
  },
  {
    icon: User,
    title: "In-house SEO teams",
    text: "Стандартизируйте повторяющиеся SEO-операции.",
  },
  {
    icon: Zap,
    title: "Marketing teams",
    text: "Подготавливайте и запускайте размещения без ручного хаоса.",
  },
  {
    icon: TrendingUp,
    title: "Growth teams",
    text: "Находите и приоритизируйте новые SEO opportunities.",
  },
];

export function Audience() {
  return (
    <section id="audience" className="scroll-mt-20 border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Для кого</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Инструмент для команд, которые работают с размещениями регулярно.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a) => (
            <div key={a.title} className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <a.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">{a.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}