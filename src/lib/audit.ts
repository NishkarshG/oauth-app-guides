import type { AgentGuide, AuditChange, Claim, Evidence, Probe } from "./schema";

const canonical = (raw: string) => {
  try {
    const u = new URL(raw);
    return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/+$/, "").toLowerCase();
  } catch {
    return raw;
  }
};

export const isHttpUrl = (raw: string | null | undefined): raw is string => {
  if (!raw) return false;
  try {
    return ["http:", "https:"].includes(new URL(raw).protocol);
  } catch {
    return false;
  }
};

type Evidenced = Pick<Claim, "evidence" | "sourceUrls" | "probeIds">;

/**
 * The model's evidence labels are claims too. A "tested" label must point at a probe that really ran,
 * and a "sourced" label at a page the agent really retrieved. Anything else is downgraded and logged.
 */
export function auditGuide(guide: AgentGuide, probes: Probe[], seen: Set<string>) {
  const seenCanonical = new Set([...seen].map(canonical));
  const goodProbes = new Set(probes.filter((p) => p.status !== null).map((p) => p.id));
  const changes: AuditChange[] = [];
  const counts: Record<Evidence, number> = { tested: 0, sourced: 0, uncertain: 0 };

  const check = (claim: Evidenced, where: string) => {
    const before = claim.evidence;
    const invented = claim.sourceUrls.filter((u) => !seenCanonical.has(canonical(u)) || !isHttpUrl(u));
    claim.sourceUrls = claim.sourceUrls.filter((u) => !invented.includes(u));
    claim.probeIds = claim.probeIds.filter((id) => goodProbes.has(id));

    let reason = "";
    if (claim.evidence === "tested" && claim.probeIds.length === 0) {
      claim.evidence = claim.sourceUrls.length > 0 ? "sourced" : "uncertain";
      reason = "marked tested, but it cites no probe that ran";
    } else if (claim.evidence === "sourced" && claim.sourceUrls.length === 0) {
      claim.evidence = "uncertain";
      reason = invented.length
        ? `marked sourced, but the agent never retrieved ${invented[0]}`
        : "marked sourced, but it cites no page";
    }
    if (reason) changes.push({ where, from: before, to: claim.evidence, reason });
    counts[claim.evidence]++;
  };

  check(guide.verdict.rationale, "Difficulty rating");
  check(guide.effort.basis, "Time estimate");
  guide.stages.forEach((s) => check(s.limit, `Stage: ${s.name}`));
  guide.steps.forEach((s) => {
    // A probe can show a URL resolves, but no one performed the step, so a step is never "tested".
    if (s.evidence === "tested") {
      const to = s.sourceUrls.length > 0 ? "sourced" : "uncertain";
      changes.push({ where: `Step: ${s.title}`, from: "tested", to, reason: "marked tested, but a probe cannot complete a setup step" });
      s.evidence = to;
    }
    check(s, `Step: ${s.title}`);
    if (!isHttpUrl(s.url)) s.url = null;
  });
  guide.requirements.forEach((r) => check(r, `Requirement: ${r.text.slice(0, 60)}`));
  guide.nuances.forEach((n) => check(n, `Nuance: ${n.text.slice(0, 60)}`));
  guide.blockers.forEach((b) => check(b, `Blocker: ${b.title}`));
  if (!isHttpUrl(guide.app.website)) guide.app.website = "";

  return { counts, changes };
}
