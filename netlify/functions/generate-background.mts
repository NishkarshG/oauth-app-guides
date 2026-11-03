import { runJob } from "../../src/lib/jobs";

// The "-background" suffix gives this function up to 15 minutes, and the caller gets a 202 straight away.
export default async (req: Request) => {
  const { id } = (await req.json().catch(() => ({}))) as { id?: unknown };
  if (typeof id === "string") await runJob(id);
};
