/**
 * Bio content — this is the thing you edit.
 *
 * Every value below was taken verbatim from the `__NEXT_DATA__` payload of the
 * original e-z.bio page (captured in bio.htm). It is the same object the
 * original site used to render your page, just written down as real code so it
 * lives in your repo instead of inside someone else's page.
 *
 * Field names are kept identical to e-z.bio's, so if you ever copy a value out
 * of the old dashboard it will still mean the same thing here.
 */

export interface Social {
  name: string;
  url: string;
}

export interface Song {
  name: string;
  url: string;
  /**
   * Plays once before `url` starts looping. Omit it for a song that simply
   * loops from the beginning — a song without an intro works fine.
   */
  intro?: string;
  /** Where the title links to. Omit it and the title is plain text. */
  link?: string;
}

export interface CustomLink {
  name: string;
  url: string;
}

/** Matches the shape e-z.bio stores for a linked Discord account. */
export interface Presence {
  /** Discord user id. */
  _id: string;
  /** Discord username (not display name). */
  tag: string;
  /** Avatar URL — set to `""` to fall back to `pfp.url`. */
  pfp: string;
  status: "online" | "idle" | "dnd" | "offline";
  customStatus: string | null;
  activities: string[];
  platform: Record<string, string>;
  badges: string[];
}

export const bio = {
  /** Header name, shown with the sparkle background. */
  name: "Anhwaivo",

  /** Browser tab / og:title. */
  title: "bio cua tui!!",

  /** The multi-line bio under your name. */
  description:
    "helu tui la Anhwaivo (aka Anhtlauncher)\nsinh nhat cua tui: 11/12 (dd/mm)\ntui code toàn những thứ linh tinh :)\nCurrently into robotics motion control algorithms :D",

  /** Opens with a typewriter effect instead of showing all at once. */
  typewriter: true,
  /** Only type it once, don't loop. */
  typeOnce: true,
  /** Sparkle background behind your name. */
  animatedTitle: true,
  /** Message typed on the blank page before the profile appears. */
  message: "nhan vao cho bat ki",

  // ---- colours -----------------------------------------------------------
  /** Page background / theme-color meta. */
  color: "#000000",
  /** Card background, tinted over the banner. */
  primarycolor: "#09090b",
  /** Sidebar / muted surfaces. */
  secondarycolor: "#101013",
  /** The teal used for borders, links, buttons, sparkle accents. */
  accentcolor: "#74cdc6",
  textcolor: "#ffffff",
  backgroundcolor: "#101013",
  iconcolor: "#ffffff",
  useThemeColor: true,

  /** Any Google Fonts family name. Loaded at runtime. */
  font: "Poppins",

  // ---- card chrome -------------------------------------------------------
  borderWidth: 2,
  borderRadius: 0.4,
  /** Frosted-glass blur behind the card, in px. 0 = off. */
  blur: 10,
  /** Card opacity, 0..1. */
  opacity: 0.5,
  glow: true,
  fullRoundedSocials: true,
  tilt: true,
  animated: true,

  // ---- counters ----------------------------------------------------------
  /** Visitor counter shown at the top of the card. */
  showViews: true,
  countViews: true,
  /** Starting value, used when there is no KV binding (local dev, or before
   *  you attach one). With the BIO binding wired up this is the seed. */
  views: 0,

  showBadges: true,
  presence: true,
  moneyBadge: false,

  // ---- layout ------------------------------------------------------------
  /** 1 = single centered column (the only layout in use here). */
  layout: 1,
  /** Top-to-bottom order of the card sections. Reorder or remove freely. */
  layoutOrder: [
    "musicPlayer",
    "discordPresence",
  ],
  badgeLayout: "center",
  showCustomLink: true,
  openByDefault: false,
  inviteCode: "",
  alias: "",
  featured: false,

  // ---- media -------------------------------------------------------------
  background: {
    type: "video",
    /**
     * Served from this Worker. Swap in any URL you like.
     * (Was https://r2-bios.e-z.host/cbd17d0d-.../iv8un8qe2q.mp4 on e-z.bio.)
     */
    url: "/background.mp4",
    /** 0..100 — applied as a brightness filter over the background. */
    brightness: 100,
    /** Extra blur over the background, in px. 0 = off. */
    blur: 0,
  },
  banner: {
    enabled: true,
    type: "image" as "image" | "video",
    url: "/banner.gif",
  },
  pfp: {
    url: "/pfp.jpg",
    /** Use the Discord avatar from `presence` instead of `url`. */
    discord: false,
  },

  /** The music player. Remove entries (or the whole array) to hide it. */
  songs: [
    {
      name: "♪ Infinite Cat Cafe - AZALI",
      intro: "/songs/Infinite%20Cat%20Cafe%20(loop%20start).ogg",
      url: "/songs/Infinite%20Cat%20Cafe%20(loop).ogg",
      link: "https://youtu.be/AUL0AXVQ9c",
    },
    {
      name: "♪ theme of a shop that sells things you dont want - AZALI",
      intro: "",
      url: "/songs/theme%20of%20a%20shop%20that%20sells%20things%20you%20dont%20want%20-%20AZALI.ogg",
      link: "https://youtu.be/mB6YotDQ_ow",
    },
    {
      name: "♪ earth - Flups",
      intro: "",
      url: "/songs/earth%20-%20Flups.opus",
      link: "https://youtu.be/MQdL6XnqdHQ",
    },
  ] as Song[],
  /** Whether audio starts automatically. Browsers usually block this. */
  useBackgroundAudio: false,
  autoplayfix: true,

  socials: [
    { name: "Github", url: "https://github.com/anhwaivo" },
    { name: "YouTube", url: "https://www.youtube.com/channel/UClIbG40fLbY1isw5VKUPlIw" },
    { name: "Steam", url: "https://steamcommunity.com/profiles/76561199442973255/" },
    { name: "osu!", url: "https://osu.ppy.sh/users/35952399" },
    { name: "Email", url: "anhwaivo@duck.com" },
  ] as Social[],

  customLinks: [] as CustomLink[],
  embeds: [] as string[],

  /** The click-following cat. `type` is "Cat" or "None". */
  cursor: {
    enabled: true,
    type: "Cat",
    url: "",
  } as { enabled: boolean; type: string; url: string },
  /** `type` is "White" or "None". */
  sparkles: {
    enabled: true,
    type: "White",
  } as { enabled: boolean; type: string },

  /** Linked Discord presence. Edit these values to match your account. */
  presence_is_discord: false,
} as const;

/**
 * Discord presence block.
 *
 * Kept separate from `bio` because this is the one part you may want to update
 * on a schedule. `src/index.ts` serves it at `/presence.json`; point a cron or
 * an external updater at that route (or just edit here and redeploy).
 */
export const presence: Presence = {
  _id: "925243366529191977",
  tag: "anhwaivo",
  // Empty string = fall back to pfp.url, so the page still works if Discord
  // ever changes their CDN layout.
  pfp: "",
  status: "dnd",
  customStatus: null,
  activities: [],
  platform: { web: "dnd" },
  badges: ["HypeSquad Balance"],
};

export type Bio = typeof bio;
