import { createJob, findActiveJob, runJob, takeQuota } from "@/lib/jobs";
import { slugify } from "@/lib/schema";
import { getGuide } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { app?: unknown };
  const input = typeof body.app === "string" ? body.app.trim() : "";
  if (input.length < 2 || input.length > 120 || !/[a-z0-9]/i.test(input)) {
    return Response.json({ error: "Enter an app name or website." }, { status: 400 });
  }

  const slug = slugify(input) || "app";
  const existing = await getGuide(slug);
  if (existing) return Response.json({ slug: existing.slug });

  const active = await findActiveJob(slug);
  if (active) return Response.json({ jobId: active.id });

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Live generation isn't configured on this deployment." }, { status: 503 });
  }
  const ip = req.headers.get("x-nf-client-connection-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await takeQuota(ip))) {
    return Response.json({ error: "That's today's limit for live guides. The library is still available." }, { status: 429 });
  }

  const job = await createJob(input, slug);
  if (process.env.NETLIFY) {
    const res = await fetch(`${process.env.URL}/.netlify/functions/generate-background`, {
      method: "POST",
      body: JSON.stringify({ id: job.id }),
    });
    if (!res.ok) {
      console.error("could not start background function", res.status);
      return Response.json({ error: "Couldn't start the agent. Please try again." }, { status: 502 });
    }
  } else {
    void runJob(job.id);
  }
  return Response.json({ jobId: job.id });
}
