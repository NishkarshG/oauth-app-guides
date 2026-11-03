"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Job } from "@/lib/jobs";
import type { AgentEvent } from "@/lib/schema";

type Row = { key: number; kind: string; text: string };

function toRow(event: AgentEvent, key: number): Row | null {
  switch (event.type) {
    case "status": return { key, kind: "Status", text: event.message };
    case "note": return { key, kind: "Thinking", text: event.text };
    case "search": return { key, kind: "Search", text: event.query };
    case "fetch": return { key, kind: "Read", text: event.url };
    case "results": return null;
    case "probe": {
      const { probe } = event;
      const outcome = probe.error ? `failed: ${probe.error}` : `${probe.status}${probe.loginWall ? ", login wall" : ""}${probe.clientRendered ? ", needs JavaScript" : ""}`;
      return { key, kind: "Probe", text: `${probe.url} → ${outcome}` };
    }
    case "audit":
      return { key, kind: "Audit", text: event.changed === 0 ? "Every evidence label held up" : `Downgraded ${event.changed} label${event.changed === 1 ? "" : "s"} the agent could not back up` };
    default: return null;
  }
}

const POLL_MS = 2_000;

export function GenerateView() {
  const router = useRouter();
  const params = useSearchParams();
  const app = params.get("app")?.trim() ?? "";
  const jobParam = params.get("job");
  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitle] = useState(app);
  const [error, setError] = useState<string | null>(app || jobParam ? null : "Enter an app to investigate.");
  const [seconds, setSeconds] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if ((!app && !jobParam) || started.current) return;
    started.current = true;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;

    const poll = async (id: string) => {
      try {
        const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
        const job = (await res.json()) as Job & { error: string | null };
        if (!res.ok) return setError(job.error ?? "This investigation wasn't found.");
        failures = 0;
        setTitle(job.input);
        setSeconds(Math.round((job.updatedAt - job.createdAt) / 1000));
        setRows(job.events.map(toRow).filter((r): r is Row => r !== null));
        if (job.status === "done" && job.slug) return router.replace(`/guides/${job.slug}`);
        if (job.status === "error") return setError(job.error ?? "The agent couldn't finish this guide.");
      } catch {
        if (++failures > 5) return setError("Lost the connection to the server. Please refresh.");
      }
      timer = setTimeout(() => poll(id), POLL_MS);
    };

    (async () => {
      if (jobParam) return poll(jobParam);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ app }),
        });
        const data = (await res.json()) as { slug?: string; jobId?: string; error?: string };
        if (data.slug) return router.replace(`/guides/${data.slug}`);
        if (!data.jobId) return setError(data.error ?? "Something went wrong.");
        // Keep the job in the URL, so a refresh rejoins this run instead of starting and paying for another.
        router.replace(`/generate?job=${data.jobId}`);
        poll(data.jobId);
      } catch {
        setError("Couldn't reach the server. Please try again.");
      }
    })();

    return () => clearTimeout(timer);
  }, [app, jobParam, router]);

  return (
    <>
      <p className="font-mono text-sm text-muted">Live investigation{!error && seconds > 0 && ` · ${seconds}s`}</p>
      <h1 className="mt-1 text-3xl font-semibold">{title || "No app entered"}</h1>
      {!error && (
        <p className="mt-2 max-w-2xl text-muted">
          The agent is reading the provider&rsquo;s docs and trying what it can without an account. This usually takes two to three minutes, and you&rsquo;ll get a shareable guide at the end. You can share this page while it runs.
        </p>
      )}
      {error && (
        <div role="alert" className="mt-4 max-w-2xl rounded-md border border-line bg-panel p-4">
          <p>{error}</p>
          <Link href="/" className="mt-2 inline-block underline">Back to the library</Link>
        </div>
      )}
      <ol aria-live="polite" className="mt-8 max-w-3xl space-y-2.5 text-sm">
        {rows.map((row) => (
          <li key={row.key} className="grid grid-cols-[4.5rem_1fr] gap-3">
            <span className="font-mono text-xs leading-5 text-muted">{row.kind}</span>
            <span className={`min-w-0 break-words ${row.kind === "Thinking" ? "text-muted" : ""}`}>{row.text}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
