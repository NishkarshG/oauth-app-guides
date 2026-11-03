import type { ComposioStatus, Difficulty, Evidence } from "@/lib/schema";

const DIFFICULTY: Record<Difficulty, { label: string; color: string }> = {
  quick: { label: "Quick", color: "var(--quick)" },
  moderate: { label: "Moderate", color: "var(--moderate)" },
  involved: { label: "Involved", color: "var(--involved)" },
  severe: { label: "Severe", color: "var(--severe)" },
};

export function DifficultyBadge({ value }: { value: Difficulty }) {
  const { label, color } = DIFFICULTY[value];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium" style={{ color }}>
      <span aria-hidden className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

const EVIDENCE: Record<Evidence, { label: string; color: string; title: string }> = {
  tested: { label: "Tested", color: "var(--tested)", title: "A live request observed this" },
  sourced: { label: "Sourced", color: "var(--sourced)", title: "A page the agent read says this" },
  uncertain: { label: "Uncertain", color: "var(--uncertain)", title: "Not established. Check before relying on it" },
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export function EvidenceTag({ evidence, sourceUrls = [], probeIds = [] }: { evidence: Evidence; sourceUrls?: string[]; probeIds?: string[] }) {
  const { label, color, title } = EVIDENCE[evidence];
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 font-mono text-[11px] leading-5" title={title}>
      <span className="rounded-sm border px-1" style={{ color, borderColor: color }}>{label}</span>
      {probeIds.map((id) => (
        <a key={id} href={`#probe-${id}`} className="text-muted underline hover:text-ink">{id}</a>
      ))}
      {sourceUrls.slice(0, 2).map((url) => (
        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-muted underline hover:text-ink">{hostOf(url)}</a>
      ))}
    </span>
  );
}

export function composioLabel(status: ComposioStatus["status"]) {
  return status === "managed" ? "Composio-managed" : status === "byo" ? "Bring your own" : "Not listed";
}

export function SectionHeading({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-4 mt-12 border-t border-line pt-5">
      <h2 className="text-xl font-semibold">{children}</h2>
      {note && <p className="mt-1 max-w-2xl text-sm text-muted">{note}</p>}
    </div>
  );
}
