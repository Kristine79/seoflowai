import Image from "next/image";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
      {children}
    </p>
  );
}

export function ScopeTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-500">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  scope,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  scope?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Eyebrow>{eyebrow}</Eyebrow>
        {scope && <ScopeTag>{scope}</ScopeTag>}
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{title}</h2>
      {lead && <p className="max-w-3xl text-base leading-relaxed text-zinc-600">{lead}</p>}
    </div>
  );
}

export function Screenshot({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
      <Image
        src={src}
        alt={alt}
        width={1120}
        height={640}
        className="h-auto w-full"
        unoptimized
        loading="eager"
      />
      {caption && (
        <figcaption className="border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function NoteCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-600">
      {children}
    </div>
  );
}

export function BlueNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm leading-relaxed text-blue-900">
      {children}
    </div>
  );
}

export function StatCard({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <p className="text-2xl font-bold tabular-nums tracking-tight text-zinc-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-zinc-700">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}