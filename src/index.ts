/**
 * Cloudflare Worker entry point.
 *
 * Routes:
 *   GET /                 the bio page
 *   GET /presence.json    linked Discord presence + current view count
 *   GET /api/views        current view count only
 *   everything else       static assets from ./static
 *
 * Bindings are optional. With no bindings at all the page still works — the
 * view counter just starts from `bio.views` and resets when the Worker
 * restarts. Add the KV namespace in wrangler.jsonc to make it persist.
 */

import { bio, presence as configPresence, type Presence } from "./config";
import { renderPage } from "./render";

export interface Env {
  /** Static assets binding (configured in wrangler.jsonc). */
  ASSETS: Fetcher;
  /**
   * Optional KV namespace. Key `views` holds the counter, key `presence`
   * holds a JSON Presence object. Create it with:
   *   npx wrangler kv namespace create BIO
   */
  BIO?: KVNamespace;
}

const VIEWS_KEY = "views";
const PRESENCE_KEY = "presence";

/**
 * Mixed into the visitor hash so the stored digests cannot be reproduced from
 * an IP and User-Agent alone. It is not a secret worth protecting; changing it
 * simply starts a fresh set of visitor identities.
 */
const VISITOR_SALT = "anhwaivo-bio-visitors";

/**
 * True when the request looks like a crawler or link-preview fetcher rather
 * than a person. Cheap substring test on the User-Agent; it does not need to
 * be exhaustive, it only keeps obvious bots from bumping the counter.
 */
function isBot(request: Request): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua) return true; // no UA at all is not a browser
  return /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|discordbot|preview|curl|wget|python|headless/i.test(
    ua,
  );
}

async function readViews(env: Env): Promise<number> {
  if (!env.BIO) return bio.views;
  const raw = await env.BIO.get(VIEWS_KEY);
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) ? n : bio.views;
}

/** SHA-256 hex, used to turn a visitor into an opaque key. */
async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * One visitor is counted once per day.
 *
 * The visitor is identified by a salted hash of IP + User-Agent, stored as a
 * short-lived KV key with a TTL. No cookie is set and no raw IP is written to
 * KV — only the digest, which expires on its own. Reloading, or coming back
 * later the same day, does not add another visitor; a new day does.
 *
 * Cloudflare always provides `request.cf`; it is missing only when the Worker
 * runs somewhere else, in which case we fall back to the raw headers.
 */
async function countVisit(env: Env, request: Request): Promise<number> {
  const total = await readViews(env);
  if (!env.BIO) return total + 1;

  const cf = (request as { cf?: { country?: string } }).cf;
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const ua = request.headers.get("user-agent") ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const visitorKey = `v:${day}:${await hash(`${ip}|${ua}|${cf?.country ?? ""}|${VISITOR_SALT}`)}`;

  // `expirationTtl` is 48h so yesterday's keys expire without a cleanup job.
  const seen = await env.BIO.get(visitorKey);
  if (seen !== null) return total;

  const next = total + 1;
  await Promise.all([
    env.BIO.put(VIEWS_KEY, String(next)),
    env.BIO.put(visitorKey, "1", { expirationTtl: 172800 }),
  ]);
  return next;
}

/** Stored presence overrides the one in config.ts, when present and valid. */
async function readPresence(env: Env): Promise<Presence> {
  if (!env.BIO) return configPresence;
  const raw = await env.BIO.get(PRESENCE_KEY);
  if (!raw) return configPresence;
  try {
    const parsed = JSON.parse(raw) as Partial<Presence>;
    if (parsed && typeof parsed === "object" && typeof parsed.status === "string") {
      return { ...configPresence, ...parsed } as Presence;
    }
  } catch {
    // Malformed KV value — fall through to the configured presence.
  }
  return configPresence;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers ?? {}),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }

    // The page is only served at the root so the cursor sprite's relative
    // `./scripts/oneko/oneko.gif` resolves correctly.
    if (url.pathname === "/" || url.pathname === "/index.html") {
      // Only count a visit when a browser actually asks for the page. HEAD
      // probes, link-preview crawlers and the like would otherwise inflate it.
      const counted = request.method === "GET" && !isBot(request);
      const [views, presence] = await Promise.all([
        counted ? countVisit(env, request) : readViews(env),
        readPresence(env),
      ]);
      return new Response(request.method === "HEAD" ? null : renderPage({ views, presence }), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=0, must-revalidate",
        },
      });
    }

    if (url.pathname === "/api/discord-presence") {
      try {
        const response = await fetch("https://api.lanyard.rest/v1/users/925243366529191977", {
          headers: { accept: "application/json" },
        });
        return new Response(response.body, {
          status: response.status,
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        });
      } catch {
        return json({ success: false, error: "Presence provider unavailable" }, { status: 502 });
      }
    }

    if (url.pathname === "/presence.json") {
      const [views, presence] = await Promise.all([readViews(env), readPresence(env)]);
      return json({ presence, views });
    }

    if (url.pathname === "/api/views") {
      return json({ views: await readViews(env) });
    }

    // Anything else is a static file.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
