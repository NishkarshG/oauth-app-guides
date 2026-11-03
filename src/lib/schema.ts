import { z } from "zod";

export const Evidence = z.enum(["tested", "sourced", "uncertain"]);
export type Evidence = z.infer<typeof Evidence>;

const evidenceFields = {
  evidence: Evidence.describe(
    "tested = you observed it yourself with probe_url (cite probeIds). sourced = a page you actually read says so (cite sourceUrls). uncertain = inference or memory, or sources conflict.",
  ),
  sourceUrls: z.array(z.string()).describe("Pages you read that support this. Empty if none."),
  probeIds: z.array(z.string()).describe("probe_url ids that show this. Empty if none."),
};

const Claim = z.object({ text: z.string(), ...evidenceFields });
export type Claim = z.infer<typeof Claim>;

const Owner = z.enum(["agent", "you", "provider"]);
export type Owner = z.infer<typeof Owner>;

export const Difficulty = z.enum(["quick", "moderate", "involved", "severe"]);
export type Difficulty = z.infer<typeof Difficulty>;

/** What the agent must hand back. Everything else on a Guide is added by the server. */
export const AgentGuide = z.object({
  app: z.object({
    name: z.string().describe("The product's canonical name."),
    website: z.string(),
    category: z.string().describe("Two or three words, e.g. 'Team chat'."),
    summary: z.string().describe("One sentence on what access to this app gives an agent."),
  }),
  hasOAuth: z.enum(["yes", "no", "unclear"]),
  verdict: z.object({
    difficulty: Difficulty.describe(
      "quick = self-serve, no review, under about an hour to production. moderate = self-serve with a light or optional review. involved = mandatory review or certification lasting days to weeks. severe = a gate many teams cannot pass (scale minimums, paid security audit, partner-only).",
    ),
    headline: z.string().describe("The single most decision-relevant sentence, under 20 words. Lead with what will surprise the developer."),
    rationale: Claim,
  }),
  effort: z.object({
    handsOn: z.string().describe("Human hands-on time to reach production, e.g. '2-4 hours'."),
    approvalWait: z.string().describe("Elapsed wait for provider approval, e.g. 'None' or '2-6 weeks'."),
    firstConnection: z.string().describe("Time until a developer can connect their own account in testing."),
    handsOnMinutesHigh: z.number().describe("Upper bound of handsOn, in minutes."),
    waitDaysHigh: z.number().describe("Upper bound of approvalWait, in days. 0 when there is no wait."),
    basis: Claim.describe("Where the estimates come from. If the provider publishes no timeline, say so and mark uncertain."),
  }),
  stages: z
    .array(
      z.object({
        name: z.string().describe("e.g. 'Test on your own workspace', 'Any customer can connect'."),
        whoCanConnect: z.string(),
        reviewRequired: z.boolean(),
        limit: Claim.describe("The limit at this stage, or what moves you past it."),
      }),
    )
    .describe("The ladder from first test to unrestricted production. Usually 2-4 rungs."),
  steps: z.array(
    z.object({
      title: z.string(),
      detail: z.string().describe("Exactly what to do, with the names used in the provider's UI."),
      owner: Owner.describe("agent = an agent could do it given access. you = needs a human (identity, legal, billing, consent). provider = waiting on the provider."),
      estimate: z.string(),
      doneWhen: z.string().describe("The observable sign this step is finished."),
      url: z.string().nullable().describe("The page to start from, or null."),
      ...evidenceFields,
    }),
  ),
  requirements: z.array(Claim).describe("Things needed before or during setup: accounts, plans, verified domain, privacy policy, entity documents."),
  nuances: z.array(Claim).describe("Non-obvious behaviour: token expiry, per-tenant apps, scope tiers, rate limits on unapproved apps."),
  blockers: z.array(
    z.object({
      title: z.string(),
      signal: z.string().describe("How the developer will recognise it: the error or the rejection reason."),
      nextMove: z.string().describe("What to do next."),
      ...evidenceFields,
    }),
  ),
  agentCan: z.array(z.string()).describe("Concrete things an agent can do for this app."),
  youMust: z.array(z.string()).describe("Things only a human can do, and why."),
  uncertainties: z.array(
    z.object({ question: z.string(), howToResolve: z.string() }),
  ).describe("What you could not establish. Be specific, and never leave this empty out of politeness."),
  providerContact: z
    .object({
      channel: z.string().describe("Where to ask. A real channel you found, otherwise describe how to find it."),
      draftMessage: z.string().describe("A short message the developer can send that gets a useful answer."),
    })
    .nullable(),
});
export type AgentGuide = z.infer<typeof AgentGuide>;

export type Probe = {
  id: string;
  url: string;
  purpose: string;
  status: number | null;
  finalUrl: string | null;
  redirects: string[];
  loginWall: boolean;
  title: string | null;
  error: string | null;
  at: string;
};

export type AuditChange = { where: string; from: Evidence; to: Evidence; reason: string };

export type ComposioStatus = {
  status: "managed" | "byo" | "not_listed";
  name: string | null;
  slug: string | null;
  docUrl: string | null;
  capturedAt: string;
};

export type Guide = AgentGuide & {
  slug: string;
  origin: "library" | "live";
  input: string;
  generatedAt: string;
  durationMs: number;
  model: string;
  composio: ComposioStatus;
  probes: Probe[];
  sourcesSeen: string[];
  audit: { counts: Record<Evidence, number>; changes: AuditChange[] };
};

/** Streamed to the browser while a guide is being generated. */
export type AgentEvent =
  | { type: "status"; message: string }
  | { type: "note"; text: string }
  | { type: "search"; query: string }
  | { type: "fetch"; url: string }
  | { type: "results"; count: number }
  | { type: "probe"; probe: Probe }
  | { type: "audit"; changed: number }
  | { type: "done"; slug: string }
  | { type: "error"; message: string };

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.[a-z.]{2,}(\/.*)?$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
