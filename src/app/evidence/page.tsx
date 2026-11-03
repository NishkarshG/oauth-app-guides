import { EvidenceTag } from "@/components/ui";
import rawVerification from "@/data/verification.json";

export const metadata = { title: "How we check this | OAuth App Guides" };

type Entry = { app: string; claim: string; result: string; method: string; note: string; source?: string };
const verification = rawVerification as { summary: string; entries: Entry[] };

const RESULT: Record<string, string> = { confirmed: "Confirmed", corrected: "Corrected", unverified: "Could not verify" };

export default function EvidencePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold">How we check this</h1>
      <p className="mt-3 text-muted">
        A confident guide that&rsquo;s wrong costs a developer more than having no guide. So every claim carries a label, and the labels are checked by code instead of being taken on trust.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What the labels mean</h2>
      <dl className="mt-3 space-y-4 text-sm">
        <div><dt><EvidenceTag evidence="tested" /></dt><dd className="mt-1">A live, anonymous request observed this, such as a page that needs a login or an authorize URL rejecting a fake client ID. It only shows what a stranger sees. It doesn&rsquo;t mean anyone completed the logged-in flow or got approved.</dd></div>
        <div><dt><EvidenceTag evidence="sourced" /></dt><dd className="mt-1">A page the agent actually retrieved says this, and the page is linked. The source could still be out of date.</dd></div>
        <div><dt><EvidenceTag evidence="uncertain" /></dt><dd className="mt-1">Inference, or sources that conflict. Review times are often here, because few providers publish them.</dd></div>
      </dl>

      <h2 className="mt-8 text-xl font-semibold">The automatic check</h2>
      <p className="mt-2 text-sm">
        After the agent finishes, the server compares each label with its own record of the run. &ldquo;Tested&rdquo; has to cite a probe that really ran. &ldquo;Sourced&rdquo; has to cite a page the agent really retrieved. Any label that fails is downgraded, and the change is listed on the guide.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What a person checked</h2>
      <p className="mt-2 text-sm">{verification.summary}</p>
      {verification.entries.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-panel text-sm">
          {verification.entries.map((e) => (
            <li key={e.app + e.claim} className="p-4">
              <p className="font-mono text-xs text-muted">{e.app} · {RESULT[e.result] ?? e.result} · {e.method}</p>
              <p className="mt-1 font-medium">{e.claim}</p>
              <p className="mt-1 text-muted">{e.note}</p>
              {e.source && <a href={e.source} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block break-all text-xs underline">{e.source}</a>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
