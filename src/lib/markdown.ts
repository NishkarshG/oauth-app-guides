import { COMPOSIO_STEPS } from "./composio-hookup";
import type { Claim, Guide } from "./schema";

const tag = (c: Pick<Claim, "evidence" | "sourceUrls">) =>
  ` _[${c.evidence}${c.sourceUrls[0] ? `: ${c.sourceUrls[0]}` : ""}]_`;

const composioLine = (g: Guide) =>
  g.composio.status === "managed"
    ? "Composio provides a managed OAuth app for this toolkit. You only need your own app for your own branding, custom scopes or a dedicated quota."
    : g.composio.status === "byo"
      ? "Composio has no managed OAuth app for this toolkit, so you need to register your own."
      : "Not found in Composio's managed OAuth directory.";

/** A portable copy of the guide, for pasting into a ticket or handing to a coding agent. */
export function guideToMarkdown(g: Guide): string {
  const lines = [
    `# ${g.app.name}: OAuth app setup guide`,
    "",
    `**${g.verdict.headline}**`,
    "",
    `- Difficulty: ${g.verdict.difficulty}`,
    `- First connection in testing: ${g.effort.firstConnection}`,
    `- Hands-on time: ${g.effort.handsOn}`,
    `- Approval wait: ${g.effort.approvalWait}`,
    `- Composio: ${composioLine(g)}`,
    "",
    `Evidence labels: tested = observed by a live probe; sourced = stated by a page the agent read; uncertain = not established. Generated ${g.generatedAt.slice(0, 10)}.`,
    "",
    "## Who can connect at each stage",
    ...g.stages.map((s) => `- **${s.name}** (${s.reviewRequired ? "review required" : "no review"}): ${s.whoCanConnect}. ${s.limit.text}${tag(s.limit)}`),
    "",
    "## Steps",
    ...g.steps.flatMap((s, i) => [
      `${i + 1}. **${s.title}** (${s.owner}, ${s.estimate})${tag(s)}`,
      `   ${s.detail}`,
      `   Done when: ${s.doneWhen}${s.url ? `\n   Start at: ${s.url}` : ""}`,
    ]),
    "",
    "## Connect it to Composio",
    ...COMPOSIO_STEPS.map((s, i) => `${i + 1}. ${s}`),
    "",
    "## Requirements",
    ...g.requirements.map((r) => `- ${r.text}${tag(r)}`),
    "",
    "## Nuances",
    ...g.nuances.map((n) => `- ${n.text}${tag(n)}`),
    "",
    "## If you get blocked",
    ...g.blockers.map((b) => `- **${b.title}.** You'll see: ${b.signal} Next: ${b.nextMove}${tag(b)}`),
    "",
    "## What an agent can do",
    ...g.agentCan.map((a) => `- ${a}`),
    "",
    "## What you must do",
    ...g.youMust.map((a) => `- ${a}`),
    "",
    "## Still uncertain",
    ...g.uncertainties.map((u) => `- ${u.question} To resolve: ${u.howToResolve}`),
  ];
  return lines.join("\n");
}
