import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { Probe } from "./schema";

const MAX_REDIRECTS = 5;
const MAX_BYTES = 300_000;
const TIMEOUT_MS = 8_000;

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    if (a.startsWith("::ffff:")) return isPrivateAddress(a.slice(7));
    return a === "::1" || a === "::" || a.startsWith("fc") || a.startsWith("fd") || /^fe[89ab]/.test(a);
  }
  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

/** The model chooses these URLs, so only public https hosts on the default port are allowed. */
async function assertPublicHttps(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("only https URLs can be probed");
  if (url.port && url.port !== "443") throw new Error("only the default https port can be probed");
  if (url.username || url.password) throw new Error("URLs with credentials cannot be probed");
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error("host does not resolve to a public address");
  }
  return url;
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks));
}

const LOGIN_PATH = /\/(login|signin|sign-in|sign_in|auth|sso)(\/|$)/i;

export type ProbeOutcome = { probe: Probe; forModel: Record<string, unknown> };

/** A real, unauthenticated GET. It proves what a stranger sees at this URL, and nothing more. */
export async function runProbe(id: string, rawUrl: string, purpose: string): Promise<ProbeOutcome> {
  const at = new Date().toISOString();
  const redirects: string[] = [];
  try {
    let current = await assertPublicHttps(rawUrl);
    let res: Response;
    for (let hop = 0; ; hop++) {
      res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": "oauth-app-guides-probe/1.0", accept: "text/html,application/json;q=0.9,*/*;q=0.5" },
      });
      const location = res.headers.get("location");
      if (res.status < 300 || res.status >= 400 || !location) break;
      if (hop === MAX_REDIRECTS) throw new Error("too many redirects");
      redirects.push(location);
      current = await assertPublicHttps(new URL(location, current).toString());
    }
    const body = await readCapped(res);
    const title = body.match(/<title[^>]*>([^<]{0,200})/i)?.[1]?.trim() ?? null;
    const text = body
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const loginWall = LOGIN_PATH.test(current.pathname) || /type=["']password["']/i.test(body);
    const clientRendered = text.length < 400 && /html/i.test(res.headers.get("content-type") ?? "");
    const probe: Probe = {
      id, url: rawUrl, purpose, status: res.status, finalUrl: current.toString(),
      redirects, loginWall, clientRendered, title, error: null, at,
    };
    return {
      probe,
      forModel: {
        probeId: id,
        status: res.status,
        finalUrl: probe.finalUrl,
        redirects,
        contentType: res.headers.get("content-type"),
        loginWall,
        ...(clientRendered && {
          caution: "The page is rendered by JavaScript, so this request saw almost nothing. A 200 here does not show the page is open to anonymous visitors. It only shows the URL resolves.",
        }),
        title,
        untrustedPageExcerpt: text.slice(0, 3000),
      },
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "probe failed";
    const probe: Probe = { id, url: rawUrl, purpose, status: null, finalUrl: null, redirects, loginWall: false, clientRendered: false, title: null, error, at };
    return { probe, forModel: { probeId: id, error, note: "This probe observed nothing, so it cannot support a claim." } };
  }
}
