// Usage: npx tsx --env-file=.env.local scripts/generate-library.ts Notion Slack "Meta Ads"
// Runs a few at a time and carries on past failures, so re-running only pays for what's missing.
import { writeFileSync } from "node:fs";
import { generateGuide } from "../src/lib/agent";

const CONCURRENCY = 4;

async function main() {
  const queue = process.argv.slice(2);
  const failed: string[] = [];
  const worker = async () => {
    for (let app = queue.shift(); app; app = queue.shift()) {
      try {
        const guide = await generateGuide({ input: app, origin: "library" });
        writeFileSync(`src/data/guides/${guide.slug}.json`, JSON.stringify(guide, null, 2));
        console.log(`[${app}] wrote ${guide.slug}.json in ${Math.round(guide.durationMs / 1000)}s`, guide.audit.counts, `downgraded ${guide.audit.changes.length}`);
      } catch (err) {
        failed.push(app);
        console.error(`[${app}] failed:`, err instanceof Error ? err.message : err);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (failed.length > 0) console.log("Failed:", failed.join(", "));
}

main();
