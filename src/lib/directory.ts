import directory from "../data/composio-directory.json";
import type { ComposioStatus } from "./schema";

const normalize = (s: string) =>
  s.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\.[a-z.]{2,}(\/.*)?$/, "").replace(/[^a-z0-9]/g, "");

type Entry = { name: string; doc: string; slug: string };

const find = (list: Entry[], key: string) =>
  list.find((e) => normalize(e.name) === key || normalize(e.doc) === key);

/** Exact match against the snapshot of Composio's managed OAuth directory. */
export function lookupComposio(...candidates: string[]): ComposioStatus {
  const capturedAt = directory.capturedAt;
  for (const candidate of candidates) {
    const key = normalize(candidate);
    if (!key) continue;
    const managed = find(directory.managed, key);
    const byo = managed ? undefined : find(directory.byo, key);
    const hit = managed ?? byo;
    if (hit) {
      return {
        status: managed ? "managed" : "byo",
        name: hit.name,
        slug: hit.slug,
        docUrl: `https://docs.composio.dev/toolkits/${hit.doc}`,
        capturedAt,
      };
    }
  }
  return { status: "not_listed", name: null, slug: null, docUrl: null, capturedAt };
}

export const directoryCounts = { managed: directory.managed.length, byo: directory.byo.length };
export const directorySource = directory.source;
