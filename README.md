# anhwaivo bio

My [e-z.bio/anhwaivo](https://e-z.bio/anhwaivo) bio, moved off e-z.bio and onto my own
Cloudflare Worker so I can edit it myself.

The page is rendered from data instead of being a frozen HTML dump, so changing
anything means editing one file: **`src/config.ts`**.

## Layout

```
src/
  config.ts   <- all content and settings (edit this)
  render.ts   <- turns config into HTML
  icons.ts    <- inline SVG icon set
  index.ts    <- Worker routes, view counter, presence
static/       <- served as-is (media, CSS, oneko cursor script)
reference/    <- the original e-z.bio page, kept for comparison
```

## Editing it

Everything visual comes from `src/config.ts`: name, title, description, colors,
socials, songs, banner, profile picture, background, and every effect toggle
(typewriter, tilt, sparkles, cat cursor, blur, glow...).

The field names match e-z.bio's own config, so values from the old dashboard can
be copied in directly. Media lives in `static/` and is referenced by path, e.g.
`url: "/banner.gif"`.

Add a social link:

```ts
socials: [
  { name: "Github", url: "https://github.com/anhwaivo" },
  { name: "Discord", url: "https://discord.com/users/925243366529191977" },
],
```

## Run locally

```sh
npm install
npm run dev          # prints the local URL (default port 8787)
npm run check        # typecheck
```

## Deploy

```sh
npx wrangler login   # once
npm run deploy
```

## Live site

<https://anhwaivo-bio.not-a.workers.dev>

## Visitors and live Discord status

The counter shows **visitors, not page views** — one per person per day. Reload
your own page ten times and it still counts once; come back tomorrow and you
count again.

It is stored in a Cloudflare KV namespace (`BIO`), already created and wired up
in `wrangler.jsonc`. It survives redeploys and Worker restarts.

A visitor is identified by a salted SHA-256 hash of their IP + User-Agent.
The raw IP is never written to KV, and the identifying key carries a 48h TTL so
it expires on its own — no cookie, no stored personal data, nothing to clean up.

Reset or set the count:

```sh
npx wrangler kv key put --binding BIO --remote views "0"
npx wrangler kv key get --binding BIO --remote views
```

Presence can be pushed any time — no redeploy:

```sh
npx wrangler kv key put --binding BIO --remote presence \
  '{"status":"online","customStatus":"coding","activities":["with DeepSeek"]}'
```

`status` is one of `online`, `idle`, `dnd`, `offline`. Anything not provided
falls back to the value in `src/config.ts`.

Only real browser page loads are counted — crawlers, link previews and `HEAD`
requests are ignored, and static files and API routes never count.

Endpoints: `/` (the page), `/presence.json`, `/api/views`,
`/api/discord-presence` (live status proxy).

## Music

The song starts when you click the splash (`nhan vao cho bat ki`). That click is
treated by the browser as a user gesture, which is why the audio is allowed to
play — autoplaying before any interaction is blocked by every modern browser.

The track is `loop start` then `loop`, played by a **single** `<audio>` element
whose `src` is swapped when the first part ends. Keep it that way: a second
element's `play()` is rejected with `NotAllowedError` because only the element
the click unlocked has playback permission.

## Editing notes

- `static/bio.css` is the original page's compiled Tailwind, so it only contains
  the classes that page happened to use. A new class name in `render.ts` that
  isn't already in that file will silently do nothing — check first.
- Avoid regex literals inside the inline `<script>` in `render.ts`. A `/` inside
  a character class (e.g. `[^/]`) ends the literal early and the whole script
  fails to parse. Compare URL segments with string helpers instead.
