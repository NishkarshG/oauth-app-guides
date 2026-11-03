import { getJob } from "@/lib/jobs";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const job = await getJob((await params).id);
  if (!job) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json(job, { headers: { "cache-control": "no-store" } });
}
