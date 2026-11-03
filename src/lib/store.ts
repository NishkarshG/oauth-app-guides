import { promises as fs } from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import type { Guide } from "./schema";

const LIBRARY_DIR = path.join(process.cwd(), "src/data/guides");
const LOCAL_DIR = path.join(process.cwd(), ".data");
const onNetlify = () => Boolean(process.env.NETLIFY);
const safeSlug = (slug: string) => /^[a-z0-9-]{1,60}$/.test(slug);

/** Netlify Blobs in production and plain files in local development. */
export async function readJson<T>(key: string): Promise<T | null> {
  if (onNetlify()) {
    return (await getStore("guides").get(key, { type: "json", consistency: "strong" })) as T | null;
  }
  const raw = await fs.readFile(path.join(LOCAL_DIR, `${key}.json`), "utf8").catch(() => null);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  if (onNetlify()) {
    await getStore("guides").setJSON(key, value);
    return;
  }
  const file = path.join(LOCAL_DIR, `${key}.json`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

export async function listLibrary(): Promise<Guide[]> {
  const files = await fs.readdir(LIBRARY_DIR).catch(() => [] as string[]);
  const guides = await Promise.all(
    files.filter((f) => f.endsWith(".json")).map(async (f) => JSON.parse(await fs.readFile(path.join(LIBRARY_DIR, f), "utf8")) as Guide),
  );
  return guides.sort((a, b) => a.effort.waitDaysHigh - b.effort.waitDaysHigh || a.app.name.localeCompare(b.app.name));
}

export async function getGuide(slug: string): Promise<Guide | null> {
  if (!safeSlug(slug)) return null;
  const library = await fs.readFile(path.join(LIBRARY_DIR, `${slug}.json`), "utf8").catch(() => null);
  if (library) return JSON.parse(library) as Guide;
  return readJson<Guide>(`live/${slug}`);
}

export const saveGuide = (guide: Guide) => writeJson(`live/${guide.slug}`, guide);
