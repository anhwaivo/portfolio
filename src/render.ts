/**
 * Renders the bio page to HTML from `config.ts`.
 *
 * The original site was a Next.js app that shipped a giant JSON blob and then
 * hydrated it in the browser. This does the same job on the server instead: it
 * returns the finished markup, so the page paints without waiting on React.
 * The markup classes are the same Tailwind classes the original used, and
 * `static/bio.css` is the original compiled stylesheet, so the result matches
 * the captured page.
 */

import { bio, presence, type Presence } from "./config";
import { icons, eyeIcon } from "./icons";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Escape for use inside a CSS url("...") token. */
const cssUrl = (u: string) => esc(u).replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");

const px = (n: number) => `${n}px`;

/**
 * A social's url may be a full URL or a bare email address (that is how the
 * e-z.bio config stored the Email entry). Turn a bare address into a mailto:
 * link; leave everything else alone.
 */
const href = (url: string) =>
  /^[^/:\s]+@[^/:\s]+\.[^/:\s]+$/.test(url) ? `mailto:${url}` : url;

export interface RenderOptions {
  views: number;
  presence: Presence;
}

function renderSocials(): string {
  return bio.socials
    .map((s) => {
      const icon = icons[s.name];
      const inner = icon
        ? `<span class="h-7 w-7 block" style="filter: drop-shadow(${bio.iconcolor} 0px 0px 3.5px);">${icon}</span>`
        : `<span class="text-sm font-semibold px-1">${esc(s.name)}</span>`;
      return `
        <li class="group flex flex-col items-center relative">
          <a href="${esc(href(s.url))}" target="_blank" rel="noopener noreferrer"
             aria-label="${esc(s.name)}" title="${esc(s.name)}"
             style="border-color: ${bio.accentcolor}; border-width: ${px(bio.borderWidth)}; border-radius: 9999px; background-color: ${bio.secondarycolor}80; color: ${bio.iconcolor};"
             class="p-2 duration-300 flex hover:brightness-50">${inner}</a>
          <span class="pointer-events-none absolute top-full mt-1 px-4 py-1 opacity-0 group-hover:opacity-100 duration-300 whitespace-nowrap font-semibold text-sm"
                style="border-color: ${bio.accentcolor}; border-width: ${px(bio.borderWidth)}; border-radius: ${bio.borderRadius}rem; background-color: ${bio.secondarycolor}; color: ${bio.textcolor}; box-shadow: 0 3px 9px rgba(0,0,0,0.4);">${esc(s.name)}</span>
        </li>`;
    })
    .join("");
}

function statusDot(p: Presence): string {
  const colours: Record<string, string> = {
    online: "#23a55a",
    idle: "#f0b232",
    dnd: "#f23f43",
    offline: "#80848e",
  };
  return colours[p.status] ?? colours.offline;
}

function renderPresence(p: Presence): string {
  const avatar = p.pfp || bio.pfp.url;
  const statusText = p.customStatus ?? (p.status === "dnd" ? "dnd" : p.status);
  const badges = bio.showBadges ? p.badges.map((badge) => `<span class="discord-badge" title="${esc(badge)}" aria-label="${esc(badge)}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="#45ddc0" fill-rule="evenodd" d="m11.8622 4.05696c.076-.07595.1996-.07595.2756 0l7.8048 7.80474c.0371.0362.0574.0865.0574.1377 0 .0513-.0212.1016-.0574.1378l-7.8048 7.8047c-.038.038-.0883.0574-.1378.0574s-.0998-.0194-.1378-.0574l-7.8048-7.8047c-.03709-.0362-.0574-.0857-.0574-.1378s.02031-.1015.0574-.1377zm.9299 8.29474 3.6146-2.37377c.0909-.05917.2013.03977.151.13597l-1.4986 2.9416c-.0354.0707.0158.1537.0944.1537h.8973c.1033 0 .1457.1316.0618.1916l-4.0517 2.9028c-.0362.0265-.0856.0265-.1227 0l-4.05168-2.9028c-.08301-.06-.04062-.1916.06182-.1916h.89634c.07948 0 .1307-.083.09449-.1537l-1.49862-2.9416c-.04945-.0962.06094-.19514.1519-.13597l3.61545 2.37377c.0627.0415.113.098.1465.1651l.5511 1.1057c.0389.0777.1501.0777.189 0l.551-1.1057c.0336-.0671.0839-.1245.1466-.1651z"/></svg></span>`).join("") : "";
  return `
    <div class="glass-panel discord-panel" aria-label="Discord profile" style="border-color: ${bio.accentcolor}; border-width: ${px(bio.borderWidth)}; border-radius: ${bio.borderRadius}rem; background-color: ${bio.primarycolor}${Math.round(bio.opacity * 255).toString(16).padStart(2, "0")}; backdrop-filter: blur(${px(bio.blur)}); border-style: solid;">
      <div class="discord-user">
        <div class="discord-avatar-wrap">
          <img draggable="false" class="discord-avatar" src="${esc(avatar)}" alt="${esc(p.tag)}" onerror="this.src='/pfp.jpg'">
          <span class="presence-dot" data-status="${esc(p.status)}" aria-label="${esc(p.status)}"></span>
        </div>
        <div class="discord-identity">
          <div class="discord-name-row"><strong style="color: ${bio.textcolor};">${esc(p.tag)}</strong>${badges}</div>
        </div>
      </div>
      <a class="discord-join" href="https://discord.com/users/${esc(p._id)}" target="_blank" rel="noopener noreferrer" style="color: ${bio.textcolor};">Add on Discord</a>
    </div>`;
}

function renderMusic(): string {
  if (!bio.songs.length) return "";
  const song = bio.songs[0];
  const panelStyle = `border-color: ${bio.accentcolor}; border-width: ${px(bio.borderWidth)}; border-radius: ${bio.borderRadius}rem; background-color: ${bio.primarycolor}${Math.round(bio.opacity * 255).toString(16).padStart(2, "0")}; backdrop-filter: blur(${px(bio.blur)}); border-style: solid;`;
  // The player is driven entirely from this array; each song may carry an
  // optional `intro` that plays once before its `url` loops forever.
  // One JSON array so the inline script can parse it directly. An empty or
  // missing `intro` means the song loops its `url` from the start.
  const tracks = JSON.stringify(
    bio.songs.map((s) => ({
      name: s.name,
      intro: s.intro ? s.intro : null,
      url: s.url,
      link: s.link ? s.link : null,
    })),
  );
  return `
    <div class="glass-panel music-panel" aria-label="Music player" style="${panelStyle}">
      <div class="music-head">
        <div class="music-volume" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a3.5 3.5 0 0 0-2-3.16v6.32a3.5 3.5 0 0 0 2-3.16zm-2-8.87v2.06a7 7 0 0 1 0 13.62v2.06a9 9 0 0 0 0-17.74z"/></svg></div>
        <div class="music-title-wrap">
          <a class="music-title" href="${esc(song.link ?? "#")}" target="_blank" rel="noopener noreferrer">${esc(song.name)}</a>
          ${bio.songs.length > 1 ? `<button class="music-list-toggle" type="button" aria-label="Choose song" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></button>` : ""}
        </div>
      </div>
      <ul class="music-list" hidden>${bio.songs
        .map((s, i) => `<li><button type="button" class="music-list-item${i === 0 ? " is-current" : ""}" data-track="${i}">${esc(s.name)}</button></li>`)
        .join("")}</ul>
      <audio class="music-audio" preload="metadata" data-tracks='${tracks.replace(/'/g, "&#39;")}'></audio>
      <div class="music-controls">
        <span class="music-time current-time">00:00</span>
        <input class="music-seek" type="range" min="0" max="1000" value="0" aria-label="Seek audio">
        <span class="music-time total-time">01:21</span>
        <button class="music-skip music-restart" type="button" aria-label="Restart track"><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6L18 6v12z"/></svg></button>
        <button class="music-toggle" type="button" aria-label="Play" aria-pressed="false">
          <svg class="music-icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <svg class="music-icon-pause" viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>
        </button>
        <button class="music-skip music-next" type="button" aria-label="Next track"><svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"/></svg></button>
      </div>
    </div>`;
}

function renderCustomLinks(): string {
  if (!bio.showCustomLink || !bio.customLinks.length) return "";
  return `<ul class="flex flex-col gap-2">${bio.customLinks
    .map(
      (l) =>
        `<li><a href="${esc(href(l.url))}" target="_blank" rel="noopener noreferrer" class="block p-2 text-center font-semibold duration-300 hover:brightness-125" style="border-color: ${bio.accentcolor}; border-width: ${px(
          bio.borderWidth,
        )}; border-radius: ${bio.borderRadius}rem; background-color: ${bio.secondarycolor}80; color: ${bio.textcolor};">${esc(
          l.name,
        )}</a></li>`,
    )
    .join("")}</ul>`;
}

/** Section renderers keyed by the names `layoutOrder` uses. */
const sections: Record<string, (p: Presence) => string> = {
  customLinks: () => renderCustomLinks(),
  discordPresence: (p) => (bio.presence ? renderPresence(p) : ""),
  discordInvite: () =>
    bio.inviteCode
      ? `<iframe src="https://discord.com/widget?id=${esc(
          bio.inviteCode,
        )}&theme=dark" width="100%" height="120" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" title="Discord invite"></iframe>`
      : "",
  musicPlayer: () => renderMusic(),
  mediaEmbeds: () =>
    bio.embeds
      .map(
        (e) =>
          `<iframe src="${esc(e)}" class="w-full" height="180" frameborder="0" allowfullscreen title="Embed"></iframe>`,
      )
      .join(""),
};

function renderSections(p: Presence): string {
  return bio.layoutOrder.map((key) => sections[key]?.(p) ?? "").join("");
}

function renderBanner(): string {
  if (!bio.banner.enabled) return "";
  const radius = `${bio.borderRadius}rem`;
  const top = `border-top-left-radius: ${radius}; border-top-right-radius: ${radius};`;
  const base = `border-color: ${bio.accentcolor}; border-style: solid; background-color: ${bio.primarycolor}80;`;
  return bio.banner.type === "video"
    ? `<video src="${esc(bio.banner.url)}" autoplay loop muted playsinline class="object-cover w-full h-32" style="${base}${top}border-width: ${px(bio.borderWidth)} ${px(bio.borderWidth)} 0;"></video>`
    : `<img draggable="false" alt="" src="${esc(bio.banner.url)}" class="object-cover w-full h-32" style="${base}${top}border-width: ${px(bio.borderWidth)} ${px(bio.borderWidth)} 0;">`;
}

function renderBackground(): string {
  const { background } = bio;
  const filter = `blur(${px(background.blur)}) brightness(${background.brightness}%)`;
  const aside = `<aside style="background-color: ${bio.backgroundcolor}; filter: ${filter};" class="blur-none fixed w-screen h-screen z-[-5] duration-500">`;
  if (background.type === "video") {
    return `${aside}<video loop muted playsinline autoplay src="${esc(
      background.url,
    )}" class="absolute object-cover w-full h-full"></video></aside>`;
  }
  if (background.type === "image") {
    return `${aside}<img alt="" src="${esc(
      background.url,
    )}" class="absolute object-cover w-full h-full"></aside>`;
  }
  return `${aside}</aside>`;
}

/** Fonts each family must be requested from Google Fonts. */
function fontHref(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(
    /%20/g,
    "+",
  )}:wght@400;500;600;700&display=swap`;
}

export function renderPage({ views, presence: p }: RenderOptions): string {
  const desc = bio.description.trim();
  const title = esc(bio.title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index,follow">
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="${esc(bio.color)}">
<meta property="og:title" content="${esc(bio.name)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="profile">
<meta property="og:image" content="${esc(bio.pfp.url)}">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="${esc(fontHref(bio.font))}">
<link rel="stylesheet" href="/bio.css">
<link rel="stylesheet" href="/bio-overrides.css">
<link rel="icon" href="${esc(bio.pfp.url)}">
<style>
  ::selection { background-color: ${bio.primarycolor} !important; color: ${bio.accentcolor} !important; }
  ::-moz-selection { background-color: ${bio.primarycolor} !important; color: ${bio.accentcolor} !important; }
  body { font-family: ${esc(bio.font)}, sans-serif; font-optical-sizing: auto; }
  .typewriter::after {
    content: '|';
    animation: bio-cursor 1.1s infinite step-start;
  }
  @keyframes bio-cursor { 50% { opacity: 0; } }
  /*
   * The reset's [hidden] display:none rule has the same specificity as .flex
   * but comes earlier in bio.css, so a flex element would stay visible when
   * hidden. Force it with !important; the splash depends on this.
   */
  [hidden] { display: none !important; }
  /* The splash fades in rather than popping. */
  #bio-splash { transition: opacity 300ms ease; }
  #bio-splash[hidden] { display: none !important; }
  /* Oneko sits absolutely at the cursor; keep it out of the text flow. */
  #oneko { pointer-events: none; z-index: 9999; }
</style>
</head>
<body>
${renderBackground()}

<!-- Click-to-enter splash, shown only when bio.message is set. -->
<div id="bio-splash" class="fixed w-screen h-screen z-[100] flex items-center justify-center cursor-pointer" style="background-color: ${bio.color};" hidden>
  <h1 class="font-semibold text-3xl text-center px-4" style="color: ${bio.textcolor};">${esc(bio.message ?? "")}</h1>
</div>

<main class="flex min-h-screen py-8 duration-500">
  <div class="max-w-[42rem] w-full m-auto px-4">
    <div class="flex flex-col gap-3">
      <div class="profile-card tilt-card" style="border-color: ${bio.accentcolor}; border-width: ${px(bio.borderWidth)}; border-radius: ${bio.borderRadius}rem; background-color: ${bio.primarycolor}${Math.round(bio.opacity * 255).toString(16).padStart(2, "0")}; backdrop-filter: blur(${px(bio.blur)}); border-style: solid;">
        ${renderBanner()}
        <div class="profile-content main-box" style="border: 0; border-radius: 0 0 ${bio.borderRadius}rem ${bio.borderRadius}rem; background-color: ${bio.primarycolor}${Math.round(bio.opacity * 255).toString(16).padStart(2, "0")}; padding: 1rem;">
          ${bio.showViews ? `<div class="views flex gap-1 items-center" style="color: ${bio.textcolor};" title="visitors today"><span class="w-4 h-4 block" style="fill: ${bio.iconcolor};">${eyeIcon}</span><p id="view-count">${views}</p></div>` : ""}
          <div class="flex flex-col">
            <div class="my-[-3.2rem] -translate-y-[3.2rem] flex items-center justify-center">
              <img draggable="false" alt="${esc(bio.name)}" src="${esc(bio.pfp.url)}"
                   class="h-[120px] w-[120px] rounded-full relative object-cover"
                   style="border-color: ${bio.accentcolor}; border-width: ${px(bio.borderWidth)};">
            </div>
            <div class="flex flex-col">
              <div class="flex flex-col justify-center gap-y-1 mx-auto items-center mt-2 mb-1">
                <h1 class="font-semibold text-[32px] break-all text-center"
                    style="color: ${bio.textcolor};${
                      bio.animatedTitle
                        ? ` background-image: url('${cssUrl("/_assets/sparkles/whitesparkle.gif")}'); line-height: 32px;`
                        : ""
                    }">${esc(bio.name)}</h1>
              </div>
              <div class="mx-auto text-center text-base whitespace-pre-wrap break-all mt-0.5"
                   style="color: ${bio.textcolor};"><span id="bio-desc"${
                     bio.typewriter ? ' class="typewriter"' : ""
                   }>${esc(bio.description)}</span></div>
              <ul class="socials">${renderSocials()}</ul>
            </div>
          </div>
        </div>
      </div>
      ${renderSections(p)}
    </div>
  </div>
</main>

<script>
(function () {
  var typed = ${JSON.stringify(bio.typewriter)};
  var once = ${JSON.stringify(bio.typeOnce)};
  var message = ${JSON.stringify(bio.message ?? "")};
  var main = document.querySelector("main");
  var splash = document.getElementById("bio-splash");
  var desc = document.getElementById("bio-desc");
  var fullText = desc ? desc.textContent : "";

  function startTypewriter() {
    if (!typed || !desc) return;
    desc.classList.remove("typewriter");
    desc.textContent = "";
    var i = 0;
    (function step() {
      desc.textContent = fullText.slice(0, ++i);
      if (i < fullText.length) {
        setTimeout(step, 35);
      } else {
        desc.classList.add("typewriter");
        if (!once) setTimeout(startTypewriter, 2000);
      }
    })();
  }

  if (message && splash) {
    splash.hidden = false;
    splash.addEventListener("click", function () {
      splash.hidden = true;
      if (main) main.style.opacity = "1";
      startTypewriter();
      // A real click is a user gesture, so the browser lets us start audio
      // here. Autoplaying before the click would be blocked.
      autoplayMusic();
    }, { once: true });
  } else {
    startTypewriter();
  }

  // The song is one <audio> whose src is swapped from the intro to the loop
  // when the intro ends. A single element is essential: the browser only
  // grants playback permission to the element the user's splash click
  // unlocked, so a second element's play() is rejected with NotAllowedError.
  var autoplayMusic = function () {};
  document.querySelectorAll(".music-panel").forEach(function (el) {
    var audio = el.querySelector(".music-audio");
    var toggle = el.querySelector(".music-toggle");
    var seek = el.querySelector(".music-seek");
    var current = el.querySelector(".current-time");
    var total = el.querySelector(".total-time");
    var titleEl = el.querySelector(".music-title");
    var list = el.querySelector(".music-list");
    var listToggle = el.querySelector(".music-list-toggle");
    if (!audio || !toggle || !seek) return;

    var tracks = [];
    try { tracks = JSON.parse(audio.getAttribute("data-tracks") || "[]"); } catch (e) { tracks = []; }
    if (!tracks.length) return;

    // Each entry plays its intro once and then its url forever. A track with
    // no intro simply loops its url from the first second.
    var index = 0;
    var introSrc = "";
    var loopSrc = "";
    var looping = false;
    var introDuration = 0;
    var seeking = false;

    var clock = function (n) {
      if (!Number.isFinite(n)) return "00:00";
      return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(Math.floor(n % 60)).padStart(2, "0");
    };
    var setButton = function (playing) {
      toggle.setAttribute("aria-pressed", playing ? "true" : "false");
      toggle.setAttribute("aria-label", playing ? "Pause" : "Play");
    };
    // Compare only the final path segment of the loaded source, so the check
    // works no matter how the browser expanded the URL. (A regex literal here
    // would break: the '/' inside the character class closes it in the HTML.)
    var lastSegment = function (u) {
      if (!u) return "";
      var clean = String(u).split("?")[0].split("#")[0];
      var i = clean.lastIndexOf("/");
      return i === -1 ? clean : clean.slice(i + 1);
    };
    var currentSegment = function () {
      return decodeURI(lastSegment(audio.currentSrc || audio.getAttribute("src")));
    };
    var onLoopFile = function () {
      return Boolean(loopSrc) && currentSegment() === decodeURI(lastSegment(loopSrc));
    };

    // Point the player at tracks[i] without loading anything yet.
    var select = function (i) {
      var t = tracks[i];
      introSrc = t.intro || t.url;
      loopSrc = t.url;
      // No intro (or an intro that IS the loop) means one file repeats forever,
      // which is the case that used to stop after a single pass.
      looping = introSrc === loopSrc;
      introDuration = 0;
      audio.loop = looping;
      if (titleEl) {
        titleEl.textContent = t.name;
        if (t.link) titleEl.setAttribute("href", t.link);
        else titleEl.removeAttribute("href");
      }
      if (list) {
        var items = list.querySelectorAll(".music-list-item");
        for (var n = 0; n < items.length; n++) items[n].classList.toggle("is-current", n === i);
      }
    };
    // Measure the intro so the seek bar can be mapped before the loop loads.
    var measureIntro = function () {
      if (looping || !introSrc) { introDuration = 0; return; }
      var want = introSrc;
      var m = document.createElement("audio");
      m.preload = "metadata";
      m.src = want;
      m.addEventListener("loadedmetadata", function () {
        if (introSrc !== want) return;
        introDuration = Number.isFinite(m.duration) ? m.duration : 0;
        sync();
      });
    };
    // The seek bar spans the intro plus one pass of the loop.
    var timeline = function () {
      var loopLen = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (looping) return loopLen;
      return introDuration + loopLen;
    };
    var sync = function () {
      // audio.currentTime is the offset within whichever file is loaded.
      var position = looping ? audio.currentTime : (onLoopFile() ? introDuration + audio.currentTime : audio.currentTime);
      if (current) current.textContent = clock(position);
      var duration = timeline();
      if (duration && !seeking && seek) seek.value = String(Math.round(position / duration * 1000));
      if (duration && total) total.textContent = clock(duration);
    };
    // Load the selected track from an offset, optionally starting playback.
    // The element keeps its gesture authorisation across src swaps, so
    // playback continues uninterrupted.
    var load = function (i, startPlaying, at) {
      index = i;
      select(i);
      measureIntro();
      var target = looping ? loopSrc : introSrc;
      var apply = function () {
        audio.removeEventListener("loadedmetadata", apply);
        var pos = Number.isFinite(at) ? at : 0;
        if (pos > 0) { try { audio.currentTime = pos; } catch (e) {} }
        if (startPlaying) {
          var p = audio.play();
          if (p && p.catch) p.catch(function () { setButton(false); });
        }
        sync();
      };
      if (currentSegment() === decodeURI(lastSegment(target))) {
        apply();
      } else {
        audio.src = target;
        audio.addEventListener("loadedmetadata", apply);
        audio.load();
      }
    };

    audio.addEventListener("loadedmetadata", sync);
    audio.addEventListener("durationchange", sync);
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("play", function () { setButton(true); });
    audio.addEventListener("pause", function () { setButton(false); });
    audio.addEventListener("ended", function () {
      // The intro finished: switch this same element to the loop and repeat.
      // Reusing the element is what keeps playback authorised, and setting
      // audio.loop is what makes the loop actually repeat.
      if (looping || onLoopFile()) return;
      looping = true;
      introDuration = 0;
      audio.loop = true;
      audio.src = loopSrc;
      var apply = function () {
        audio.removeEventListener("loadedmetadata", apply);
        var p = audio.play();
        if (p && p.catch) p.catch(function () {});
        sync();
      };
      audio.addEventListener("loadedmetadata", apply);
      audio.load();
    });

    var toggleList = function (open) {
      if (!list) return;
      var next = typeof open === "boolean" ? open : list.hasAttribute("hidden");
      if (next) list.removeAttribute("hidden"); else list.setAttribute("hidden", "");
      if (listToggle) listToggle.setAttribute("aria-expanded", next ? "true" : "false");
    };
    if (listToggle) listToggle.addEventListener("click", function (e) { e.stopPropagation(); toggleList(); });
    if (list) {
      var items = list.querySelectorAll(".music-list-item");
      for (var k = 0; k < items.length; k++) {
        (function (btn) {
          btn.addEventListener("click", function () {
            toggleList(false);
            // A click is a user gesture, so starting playback here is allowed.
            load(Number(btn.getAttribute("data-track")) || 0, true, 0);
          });
        })(items[k]);
      }
      document.addEventListener("click", function (e) {
        if (list.contains(e.target) || e.target === listToggle) return;
        toggleList(false);
      });
    }

    // Nothing is loaded at render time (the audio tag carries no src), so the
    // first track is selected here purely to populate the title and duration.
    select(0);
    measureIntro();
    if (!audio.currentSrc) audio.src = looping ? loopSrc : introSrc;

    toggle.addEventListener("click", function () {
      if (audio.paused) {
        var resume = audio.play();
        if (resume && resume.catch) resume.catch(function () {});
      } else {
        audio.pause();
      }
    });
    seek.addEventListener("input", function () {
      seeking = true;
      var duration = timeline();
      if (!duration) return;
      var overall = Number(seek.value) / 1000 * duration;
      var wasPlaying = !audio.paused;
      if (looping) {
        // One looping file: seek straight into it.
        try { audio.currentTime = overall; } catch (e) {}
        sync();
      } else if (overall < introDuration) {
        if (onLoopFile()) load(index, wasPlaying, overall);
        else { try { audio.currentTime = overall; } catch (e) {} sync(); }
      } else {
        // Past the intro: move onto the looping file, keeping the position.
        looping = true;
        audio.loop = true;
        var intoLoop = overall - introDuration;
        if (onLoopFile()) {
          try { audio.currentTime = intoLoop; } catch (e) {}
          sync();
        } else {
          load(index, wasPlaying, 0);
        }
      }
    });
    seek.addEventListener("change", function () { seeking = false; sync(); });
    var restart = el.querySelector(".music-restart");
    if (restart) restart.addEventListener("click", function () { load(index, !audio.paused, 0); });
    var next = el.querySelector(".music-next");
    if (next) next.addEventListener("click", function () { load((index + 1) % tracks.length, true, 0); });
    // Starts the song from the beginning. Called from the splash click, which
    // is a real user gesture, so the browser permits the audio to start.
    autoplayMusic = function () { load(index, true, 0); };
  });

  // The public Lanyard endpoint provides live presence only after the account
  // is monitored there; keep the site-rendered snapshot as a reliable fallback.
  var applyPresence = function (p) {
    if (!p) return;
    var dot = document.querySelector(".presence-dot");
    var activity = document.getElementById("discord-activity");
    var avatar = document.querySelector(".discord-avatar");
    if (dot && p.status) {
      dot.setAttribute("data-status", p.status);
      dot.setAttribute("aria-label", p.status);
    }
    if (activity) {
      var custom = p.custom_status && p.custom_status.state;
      var game = (p.activities || []).find(function (a) { return a.type === 0; });
      activity.textContent = custom || (game ? game.name : p.status || "offline");
    }
    if (avatar && p.discord_user && p.discord_user.avatar) {
      avatar.src = "https://cdn.discordapp.com/avatars/" + p.discord_user.id + "/" + p.discord_user.avatar + ".png?size=128";
    }
    if (p.discord_user && p.discord_user.username) {
      var name = document.querySelector(".discord-name-row strong");
      if (name) name.textContent = p.discord_user.username;
    }
  };
  var refreshPresence = function () {
    fetch("/api/discord-presence", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.success && d.data) applyPresence(d.data); })
      .catch(function () {});
  };
  refreshPresence();
  window.setInterval(refreshPresence, 30000);
  fetch("/presence.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      var count = document.getElementById("view-count");
      if (count && Number.isFinite(d.views)) count.textContent = d.views;
    })
    .catch(function () {});

    var cards = document.querySelectorAll(".tilt-card, .discord-panel, .music-panel");
    if (${JSON.stringify(bio.tilt)}) cards.forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        if (event.pointerType === "touch") return;
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - .5;
        var y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = "perspective(1000px) rotateX(" + (-y * 12) + "deg) rotateY(" + (x * 12) + "deg)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      });
    });
})();
</script>
${bio.cursor.enabled && bio.cursor.type === "Cat" ? '<script src="/scripts/oneko/oneko.js" defer></script>' : ""}
</body>
</html>`;
}
