// Usage: npx tsx --env-file=.env.local scripts/generate-library.ts Notion Slack "Google Gmail"
import { writeFileSync } from "node:fs";
import { generateGuide } from "../src/lib/agent";

async function main() {
  const apps = process.argv.slice(2);
  await Promise.all(
    apps.map(async (app) => {
      const guide = await generateGuide({
        input: app,
        origin: "library",
        emit: (e) => {
          if (e.type === "search") console.log(`[${app}] search: ${e.query}`);
          if (e.type === "probe") console.log(`[${app}] probe ${e.probe.url} -> ${e.probe.status ?? e.probe.error}`);
          if (e.type === "audit") console.log(`[${app}] audit downgraded ${e.changed}`);
        },
      });
      writeFileSync(`src/data/guides/${guide.slug}.json`, JSON.stringify(guide, null, 2));
      console.log(`[${app}] wrote ${guide.slug}.json in ${Math.round(guide.durationMs / 1000)}s`, guide.audit.counts);
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
