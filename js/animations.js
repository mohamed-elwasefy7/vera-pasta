/* VERA PASTA — animations.js
   Atmosphere crossfade · per-dish enter timelines · breathing/float.
   One paused timeline per dish, built once at render; IO plays/resets. */

import { $, $$, on, prefersReducedMotion } from "./utils.js";

const MOODS = ["cream", "sage", "rose", "olive", "terracotta", "espresso"];
const THEME_COLORS = {
  cream: "#F5EFE0", sage: "#E2E5CC", rose: "#EACBB9",
  olive: "#5E6C36", terracotta: "#7E2718", espresso: "#241C16",
};

let reduced = false;
let frontSlot = "a";
let timelines = new Map();     // section -> gsap timeline
let ambients = new Map();      // section -> [breathe, float] tweens
let playTimers = new Map();    // section -> deferred play timer
let enterIO = null;
let loadIO = null;

export function init() {
  reduced = prefersReducedMotion();
  on("dish:active", ({ mood }) => setMood(mood || "cream"));
}

/* ---------- atmosphere ---------- */
let currentMood = "cream";

function setMood(mood) {
  if (!MOODS.includes(mood)) mood = "cream";
  if (mood === currentMood) return;
  currentMood = mood;

  document.body.dataset.mood = mood;
  $("meta[name='theme-color']")?.setAttribute("content", THEME_COLORS[mood]);

  const back = $(`.atmo-layer[data-slot="${frontSlot === "a" ? "b" : "a"}"]`);
  const front = $(`.atmo-layer[data-slot="${frontSlot}"]`);
  back.className = `atmo-layer atmo--${mood}`;

  if (reduced || !window.gsap || document.visibilityState === "hidden") {
    back.style.opacity = 1;
    front.style.opacity = 0;
  } else {
    gsap.killTweensOf([back, front]);
    gsap.to(back, { opacity: 1, duration: 0.9, ease: "power2.inOut" });
    gsap.to(front, { opacity: 0, duration: 0.9, ease: "power2.inOut" });
  }
  frontSlot = frontSlot === "a" ? "b" : "a";
}

/* ---------- per-dish timelines ---------- */
export function bindDishes() {
  // clean previous (language re-render)
  timelines.forEach((tl) => tl.kill());
  ambients.forEach((tweens) => tweens.forEach((t2) => t2.kill()));
  playTimers.forEach((t2) => clearTimeout(t2));
  timelines = new Map(); ambients = new Map(); playTimers = new Map();
  enterIO?.disconnect();
  loadIO?.disconnect();

  const container = $("#snap");
  const dishes = $$(".dish", container);
  if (!window.gsap || reduced) return;

  dishes.forEach((section) => {
    section.classList.add("anim-ready");
    timelines.set(section, buildTimeline(section));
    ambients.set(section, buildAmbient(section));
  });

  enterIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const section = entry.target;
        const tl = timelines.get(section);
        const amb = ambients.get(section) || [];
        if (!tl) continue;
        if (entry.intersectionRatio >= 0.6) {
          clearTimeout(playTimers.get(section));
          // small defer so fast flings only animate the landing dish
          playTimers.set(section, setTimeout(() => {
            tl.play(0);
            amb.forEach((t2) => t2.resume());
            $(".dish__figure", section)?.classList.add("is-active");
          }, 120));
        } else if (entry.intersectionRatio <= 0.15) {
          clearTimeout(playTimers.get(section));
          tl.pause(0);
          amb.forEach((t2) => t2.pause());
          $(".dish__figure", section)?.classList.remove("is-active");
        }
      }
    },
    { root: container, threshold: [0.15, 0.6] },
  );
  dishes.forEach((s) => enterIO.observe(s));
}

function buildTimeline(section) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  const add = (sel, fromVars, toVars, pos) => {
    const targets = section.querySelectorAll(sel);
    if (targets.length) tl.fromTo(targets, fromVars, toVars, pos);
  };
  add(".dish__kicker", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0);
  add(".dish__name", { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.05);
  add(".dish__subtitle", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, 0.14);
  add(".dish__desc", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.2);
  add(".dish__ingredients li", { y: 14, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.4, stagger: 0.045, ease: "power2.out" }, 0.26);
  add(".dish__meta", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.34);
  add(".dish__badges .badge", { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" }, 0.38);
  add(".dish__actions > *", { scale: 0.92, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.35, stagger: 0.06, ease: "back.out(1.4)" }, 0.4);
  return tl;
}

function buildAmbient(section) {
  const breathe = $(".dish__breathe", section);
  const figure = $(".dish__figure", section);
  const tweens = [];
  if (breathe) {
    tweens.push(gsap.to(breathe, {
      scale: 1.05, duration: 8, ease: "sine.inOut",
      yoyo: true, repeat: -1, paused: true,
    }));
    tweens.push(gsap.to(figure, {
      y: -6, duration: 6, ease: "sine.inOut",
      yoyo: true, repeat: -1, paused: true,
    }));
  }
  return tweens;
}

/* ---------- lazy image loading + next-only preload ---------- */
let offPreload = null;

export function bindImages(applyImageFn) {
  const container = $("#snap");
  const imgs = $$("img[data-image]", container);
  const load = (img) => {
    loadIO.unobserve(img);
    applyImageFn(
      img,
      img.dataset.image,
      img.dataset.dir || "assets/images/dishes/",
      img.dataset.sizes || undefined,
    );
  };

  loadIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) load(entry.target);
      }
    },
    { root: container, rootMargin: "100% 0px" },
  );
  imgs.forEach((img) => loadIO.observe(img));

  // active screen + next-only preload (re-registered per render — drop the old one)
  offPreload?.();
  offPreload = on("dish:active", ({ index }) => {
    const screens = $$(".screen", container);
    // current screen too: IO can lag behind instant jumps (deep links)
    [screens[index], screens[index + 1]].forEach((screen) => {
      if (!screen) return;
      $$("img[data-image]", screen).forEach((img) => {
        if (!img.src) load(img);
      });
    });
  });
}

/* ---------- hero entrance ---------- */
export function heroEntrance() {
  if (!window.gsap || reduced) return;
  const hero = $(".hero");
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  const add = (sel, fromVars, toVars, pos) => {
    const el = $(sel, hero);
    if (el) tl.fromTo(el, fromVars, toVars, pos);
  };
  add(".hero__figure", { scale: 1.06, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9 }, 0);
  add(".wordmark--hero", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.15);
  add(".hero__tagline", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.3);
  add(".hero__intro", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.42);
  add(".hero__cta", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.52);
  add(".swipe-hint", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.7);

  // hero image ambient breathing
  const breathe = $(".hero__breathe", hero);
  if (breathe) {
    gsap.to(breathe, { scale: 1.04, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }
}
