import { randomUUID, createHash } from "node:crypto";
import { generateGuide } from "./agent";
import type { AgentEvent } from "./schema";
import { readJson, saveGuide, writeJson } from "./store";

export type Job = {
  id: string;
  input: string;
  status: "queued" | "running" | "done" | "error";
  events: AgentEvent[];
  slug: string | null;
  error: string | null;
  createdAt: number;
  updatedAt: number;
};

const QUEUE_TIMEOUT_MS = 90_000;
const SILENCE_TIMEOUT_MS = 5 * 60_000;
const FLUSH_EVERY_MS = 1_500;
const DAILY_LIMIT = 40;
const PER_IP_PER_DAY = 6;

export async function getJob(id: string): Promise<Job | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const job = await readJson<Job>(`jobs/${id}`);
  if (!job) return null;
  const idle = Date.now() - job.updatedAt;
  const lost = (job.status === "queued" && idle > QUEUE_TIMEOUT_MS) || (job.status === "running" && idle > SILENCE_TIMEOUT_MS);
  return lost ? { ...job, status: "error", error: "The agent stopped responding. Please try again." } : job;
}

/** One running job per app, so a double click or two reviewers don't pay for the same guide twice. */
export async function findActiveJob(slug: string): Promise<Job | null> {
  const active = await readJson<{ id: string }>(`active/${slug}`);
  if (!active) return null;
  const job = await getJob(active.id);
  return job && (job.status === "queued" || job.status === "running") ? job : null;
}

/** Stored, so it holds across function instances. Not atomic: a burst can overshoot by a little. */
export async function takeQuota(ip: string): Promise<boolean> {
  const key = `usage/${new Date().toISOString().slice(0, 10)}`;
  const usage = (await readJson<{ total: number; byIp: Record<string, number> }>(key)) ?? { total: 0, byIp: {} };
  const who = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  if (usage.total >= DAILY_LIMIT || (usage.byIp[who] ?? 0) >= PER_IP_PER_DAY) return false;
  usage.total++;
  usage.byIp[who] = (usage.byIp[who] ?? 0) + 1;
  await writeJson(key, usage);
  return true;
}

export async function createJob(input: string, slug: string): Promise<Job> {
  const now = Date.now();
  const job: Job = { id: randomUUID(), input, status: "queued", events: [], slug: null, error: null, createdAt: now, updatedAt: now };
  await writeJson(`jobs/${job.id}`, job);
  await writeJson(`active/${slug}`, { id: job.id });
  return job;
}

/** Runs the agent to completion. Only a job the API route queued can start, and only once. */
export async function runJob(id: string): Promise<void> {
  const job = await readJson<Job>(`jobs/${id}`);
  if (!job || job.status !== "queued") return;
  job.status = "running";
  job.events.push({ type: "status", message: `Starting the investigation of ${job.input}` });

  const save = () => {
    job.updatedAt = Date.now();
    return writeJson(`jobs/${id}`, job);
  };
  await save();

  let lastFlush = Date.now();
  let flushing: Promise<void> = Promise.resolve();
  const emit = (event: AgentEvent) => {
    job.events.push(event);
    if (Date.now() - lastFlush > FLUSH_EVERY_MS) {
      lastFlush = Date.now();
      flushing = flushing.then(save).catch((err) => console.error("job flush failed", err));
    }
  };

  try {
    const guide = await generateGuide({ input: job.input, origin: "live", emit });
    await saveGuide(guide);
    job.slug = guide.slug;
    job.status = "done";
    job.events.push({ type: "done", slug: guide.slug });
  } catch (err) {
    console.error("generate failed", err);
    job.status = "error";
    job.error = "The agent couldn't finish this guide. Please try again.";
  }
  await flushing;
  await save();
}
