import Link from "next/link";
import { AppLookup } from "@/components/AppLookup";
import { composioLabel, DifficultyBadge } from "@/components/ui";
import { directoryCounts } from "@/lib/directory";
import { listLibrary } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const guides = await listLibrary();
  return (
    <>
      <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
        Will this OAuth app take an hour, or six weeks?
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Creating an OAuth app is the easy part. Look up any app to see what stands between &ldquo;it works for me&rdquo; and
        &ldquo;any customer can connect&rdquo;: the steps, the wait, the blockers, and what an agent can do for you.
      </p>
      <div className="mt-8 max-w-2xl">
        <AppLookup examples={["Pipedrive", "Webflow", "Klaviyo"]} />
      </div>

      <h2 className="mt-14 text-xl font-semibold">Guide library</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Sorted by how long approval takes. Of the {directoryCounts.managed + directoryCounts.byo} OAuth toolkits in Composio&rsquo;s directory,{" "}
        {directoryCounts.byo} need the developer to bring their own app.
      </p>
      {guides.length === 0 ? (
        <p className="mt-6 text-muted">No library guides yet. Enter an app above to generate one.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-line bg-panel">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">App</th>
                <th className="px-4 py-2.5 font-medium">Difficulty</th>
                <th className="px-4 py-2.5 font-medium">Hands-on</th>
                <th className="px-4 py-2.5 font-medium">Approval wait</th>
                <th className="px-4 py-2.5 font-medium">Composio</th>
              </tr>
            </thead>
            <tbody>
              {guides.map((g) => (
                <tr key={g.slug} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/guides/${g.slug}`} className="font-medium underline-offset-2 hover:underline">{g.app.name}</Link>
                    <p className="mt-0.5 max-w-xs text-xs text-muted">{g.verdict.headline}</p>
                  </td>
                  <td className="px-4 py-3"><DifficultyBadge value={g.verdict.difficulty} /></td>
                  <td className="px-4 py-3">{g.effort.handsOn}</td>
                  <td className="px-4 py-3">{g.effort.approvalWait}</td>
                  <td className="px-4 py-3 text-muted">{composioLabel(g.composio.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
