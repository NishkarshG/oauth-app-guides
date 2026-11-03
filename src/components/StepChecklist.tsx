"use client";

import { useEffect, useState } from "react";
import { EvidenceTag } from "@/components/ui";
import type { Guide, Owner } from "@/lib/schema";

export type PersonCheck = { step: string; minutes: number; note: string; date: string };

const OWNER: Record<Owner, string> = { agent: "Agent can do this", you: "You", provider: "Waiting on provider" };

export function StepChecklist({ slug, steps, personChecks = [] }: { slug: string; steps: Guide["steps"]; personChecks?: PersonCheck[] }) {
  const key = `steps:${slug}`;
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(key) ?? "[]"));
    } catch {}
  }, [key]);

  const toggle = (i: number) => {
    const next = done.includes(i) ? done.filter((d) => d !== i) : [...done, i];
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };

  return (
    <>
      <p className="no-print mb-3 font-mono text-xs text-muted">{done.length} of {steps.length} done</p>
      <ol className="divide-y divide-line rounded-md border border-line bg-panel">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3 p-4">
            <input
              type="checkbox"
              checked={done.includes(i)}
              onChange={() => toggle(i)}
              aria-label={`Mark "${step.title}" done`}
              className="no-print mt-1 size-4 shrink-0 accent-[var(--accent)]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className={`font-medium ${done.includes(i) ? "text-muted line-through" : ""}`}>
                  {i + 1}. {step.title}
                </h3>
                <span className="font-mono text-xs text-muted">{OWNER[step.owner]} · {step.estimate}</span>
              </div>
              <p className="mt-1 text-sm">{step.detail}</p>
              <p className="mt-1.5 text-sm text-muted">Done when: {step.doneWhen}</p>
              {personChecks.filter((c) => c.step === step.title).map((c) => (
                <p key={c.date + c.note} className="mt-2 rounded-sm border-l-2 border-[var(--tested)] pl-2 text-sm">
                  <span className="font-mono text-[11px] text-[var(--tested)]">Attempted by agent in a real account · about {c.minutes} min · {c.date}</span>
                  <br />
                  {c.note}
                </p>
              ))}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <EvidenceTag evidence={step.evidence} sourceUrls={step.sourceUrls} probeIds={step.probeIds} />
                {step.url && (
                  <a href={step.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent underline">Start here</a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
