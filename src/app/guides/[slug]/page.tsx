import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideActions } from "@/components/GuideActions";
import { StepChecklist, type PersonCheck } from "@/components/StepChecklist";
import { DifficultyBadge, EvidenceTag, SectionHeading } from "@/components/ui";
import { COMPOSIO_AUTH_DOCS, COMPOSIO_STEPS } from "@/lib/composio-hookup";
import { guideToMarkdown } from "@/lib/markdown";
import personChecks from "@/data/person-checks.json";
import verification from "@/data/verification.json";
import type { Claim, Guide } from "@/lib/schema";
import { getGuide } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = await getGuide((await params).slug);
  return guide
    ? { title: `${guide.app.name} OAuth app guide`, description: guide.verdict.headline }
    : { title: "Guide not found" };
}

function ClaimList({ items }: { items: Claim[] }) {
  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <li key={c.text}>
          <p className="text-sm">{c.text}</p>
          <EvidenceTag evidence={c.evidence} sourceUrls={c.sourceUrls} probeIds={c.probeIds} />
        </li>
      ))}
    </ul>
  );
}

function composioAdvice(g: Guide) {
  if (g.composio.status === "managed") {
    return {
      title: "You may not need any of this",
      body: "Composio already provides an OAuth app for this toolkit. Follow this guide only if you want your own app name on the consent screen, custom scopes, or your own rate-limit quota.",
    };
  }
  if (g.composio.status === "byo") {
    return { title: "You need your own OAuth app", body: "Composio has no managed OAuth app for this toolkit, so you register one with the provider and add its credentials to a Composio auth config." };
  }
  return { title: "Not in Composio's directory", body: `No exact match in the snapshot from ${g.composio.capturedAt}. It may be listed under another name, so check the directory before you start.` };
}

export default async function GuidePage({ params }: Props) {
  const g = await getGuide((await params).slug);
  if (!g) notFound();
  const advice = composioAdvice(g);
  const checked = verification.entries.filter((e) => e.app === g.app.name);

  return (
    <article>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">{g.app.category} · OAuth app guide</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{g.app.name}</h1>
        </div>
        <GuideActions markdown={guideToMarkdown(g)} />
      </div>

      <p className="mt-4 max-w-3xl text-xl font-medium leading-snug">{g.verdict.headline}</p>
      <div className="mt-2 max-w-3xl">
        <p className="text-sm text-muted">{g.verdict.rationale.text}</p>
        <EvidenceTag evidence={g.verdict.rationale.evidence} sourceUrls={g.verdict.rationale.sourceUrls} probeIds={g.verdict.rationale.probeIds} />
      </div>

      {g.hasOAuth !== "yes" && (
        <p role="note" className="mt-4 max-w-3xl rounded-md border border-line bg-panel p-3 text-sm">
          {g.hasOAuth === "no" ? "This app doesn't appear to offer OAuth for third-party apps." : "The agent couldn't establish whether this app offers OAuth for third-party apps."}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
        <div className="bg-panel p-4"><dt className="text-xs text-muted">Difficulty</dt><dd className="mt-1"><DifficultyBadge value={g.verdict.difficulty} /></dd></div>
        <div className="bg-panel p-4"><dt className="text-xs text-muted">First test connection</dt><dd className="mt-1 font-medium">{g.effort.firstConnection}</dd></div>
        <div className="bg-panel p-4"><dt className="text-xs text-muted">Hands-on to production</dt><dd className="mt-1 font-medium">{g.effort.handsOn}</dd></div>
        <div className="bg-panel p-4"><dt className="text-xs text-muted">Approval wait</dt><dd className="mt-1 font-medium">{g.effort.approvalWait}</dd></div>
      </dl>
      <div className="mt-2 max-w-3xl">
        <p className="text-sm text-muted">{g.effort.basis.text}</p>
        <EvidenceTag evidence={g.effort.basis.evidence} sourceUrls={g.effort.basis.sourceUrls} probeIds={g.effort.basis.probeIds} />
      </div>

      <div className="mt-6 max-w-3xl rounded-md border border-line bg-panel p-4">
        <p className="font-medium">{advice.title}</p>
        <p className="mt-1 text-sm text-muted">{advice.body}</p>
        {g.composio.docUrl && <a href={g.composio.docUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-accent underline">Composio&rsquo;s {g.composio.name} toolkit docs</a>}
      </div>

      <SectionHeading note="Most of the wait sits between these rungs, so check how far up you need to go.">Who can connect at each stage</SectionHeading>
      <ol className="grid gap-3 md:grid-flow-col md:auto-cols-fr">
        {g.stages.map((s, i) => (
          <li key={s.name} className="rounded-md border border-line bg-panel p-4">
            <p className="font-mono text-xs text-muted">Stage {i + 1} · {s.reviewRequired ? "Review required" : "No review"}</p>
            <h3 className="mt-1 font-medium">{s.name}</h3>
            <p className="mt-1 text-sm">{s.whoCanConnect}</p>
            <p className="mt-2 text-sm text-muted">{s.limit.text}</p>
            <div className="mt-1"><EvidenceTag evidence={s.limit.evidence} sourceUrls={s.limit.sourceUrls} probeIds={s.limit.probeIds} /></div>
          </li>
        ))}
      </ol>

      <SectionHeading note="Your progress is saved in this browser.">What to do, in order</SectionHeading>
      <StepChecklist slug={g.slug} steps={g.steps} personChecks={(personChecks.entries as (PersonCheck & { app: string })[]).filter((c) => c.app === g.app.name)} />

      <SectionHeading note={`These steps come from Composio's docs, not the agent.`}>Connect it to Composio</SectionHeading>
      <ol className="max-w-3xl list-decimal space-y-2 pl-5 text-sm">
        {COMPOSIO_STEPS.map((s) => <li key={s} className="break-words">{s}</li>)}
      </ol>
      <a href={COMPOSIO_AUTH_DOCS} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-accent underline">Composio&rsquo;s auth config docs</a>

      <SectionHeading>If you get blocked</SectionHeading>
      <div className="grid gap-3 md:grid-cols-2">
        {g.blockers.map((b) => (
          <div key={b.title} className="rounded-md border border-line bg-panel p-4">
            <h3 className="font-medium">{b.title}</h3>
            <p className="mt-1 text-sm text-muted">You&rsquo;ll see: {b.signal}</p>
            <p className="mt-1 text-sm">Next: {b.nextMove}</p>
            <div className="mt-1"><EvidenceTag evidence={b.evidence} sourceUrls={b.sourceUrls} probeIds={b.probeIds} /></div>
          </div>
        ))}
      </div>
      {g.providerContact && (
        <details className="mt-3 max-w-3xl rounded-md border border-line bg-panel p-4">
          <summary className="cursor-pointer font-medium">Need to ask the provider? Here&rsquo;s a message to send</summary>
          <p className="mt-2 text-sm text-muted">Where: {g.providerContact.channel}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm">{g.providerContact.draftMessage}</p>
        </details>
      )}

      <SectionHeading>What you&rsquo;ll need, and what might catch you out</SectionHeading>
      <div className="grid gap-8 md:grid-cols-2">
        <div><h3 className="mb-3 font-medium">Requirements</h3><ClaimList items={g.requirements} /></div>
        <div><h3 className="mb-3 font-medium">Nuances</h3><ClaimList items={g.nuances} /></div>
      </div>

      <SectionHeading>What an agent can do, and where you take over</SectionHeading>
      <div className="grid gap-8 md:grid-cols-2">
        <div><h3 className="mb-2 font-medium">An agent can</h3><ul className="list-disc space-y-1.5 pl-5 text-sm">{g.agentCan.map((a) => <li key={a}>{a}</li>)}</ul></div>
        <div><h3 className="mb-2 font-medium">You must</h3><ul className="list-disc space-y-1.5 pl-5 text-sm">{g.youMust.map((a) => <li key={a}>{a}</li>)}</ul></div>
      </div>

      <SectionHeading note="The agent couldn't establish these, so check them before you plan around them.">Still uncertain</SectionHeading>
      <ul className="max-w-3xl space-y-3 text-sm">
        {g.uncertainties.map((u) => (
          <li key={u.question}><p className="font-medium">{u.question}</p><p className="text-muted">To resolve: {u.howToResolve}</p></li>
        ))}
      </ul>

      <SectionHeading note={`Generated ${g.generatedAt.slice(0, 10)} in ${Math.round(g.durationMs / 1000)}s by ${g.model}. Providers change their rules, so re-check anything critical.`}>Evidence</SectionHeading>
      <p className="text-sm">
        {g.audit.counts.tested} tested, {g.audit.counts.sourced} sourced, {g.audit.counts.uncertain} uncertain.{" "}
        <Link href="/evidence" className="underline">What these labels mean</Link>
        {checked.length > 0 && ` ${checked.length} claim${checked.length === 1 ? " was" : "s were"} also checked separately against the provider's pages, ${checked.filter((e) => e.result === "corrected").length} needing a correction.`}
      </p>
      {g.audit.changes.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">{g.audit.changes.length} label{g.audit.changes.length === 1 ? " was" : "s were"} downgraded by the automatic check</summary>
          <ul className="mt-2 space-y-1 text-muted">{g.audit.changes.map((c) => <li key={c.where + c.reason}>{c.where}: {c.from} → {c.to}, because it was {c.reason}.</li>)}</ul>
        </details>
      )}
      {g.probes.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-md border border-line bg-panel">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-line text-muted"><tr><th className="p-2.5 font-medium">Probe</th><th className="p-2.5 font-medium">Tried</th><th className="p-2.5 font-medium">Why</th><th className="p-2.5 font-medium">Saw</th></tr></thead>
            <tbody>
              {g.probes.map((p) => (
                <tr key={p.id} id={`probe-${p.id}`} className="border-b border-line align-top last:border-0">
                  <td className="p-2.5 font-mono">{p.id}</td>
                  <td className="break-all p-2.5 font-mono">{p.url}</td>
                  <td className="p-2.5">{p.purpose}</td>
                  <td className="p-2.5">{p.error ?? `${p.status}${p.loginWall ? ", login wall" : ""}${p.clientRendered ? ", page needs JavaScript so login status is unknown" : ""}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
