/* VERA PASTA — parallax.js (v2)
   Multi-layer ScrollTrigger scrubs inside the snap container.
   Every layer is a transform-only scrub with ease:none; at snap rest
   all layers sit at 0, so nothing is misaligned when idle.
   Gallery's internal parallax lives in story.js (rect math, RTL-safe). */

import { $, $$, prefersReducedMotion } from "./utils.js";

let triggers = [];

export function init() {
  if (prefersReducedMotion() || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  spawnParticles(".hero__particles", 12);
  bind();
}

/* per-dish layer table: [selector, amplitude yPercent, scrub lag] */
const DISH_LAYERS = [
  [".dish__bg", 2, 1.2],
  [".dish__texture", 4, 1.0],
  [".dish__floats-far", 8, 0.8],
  [".dish__floats-near", 12, 0.6],
  [".dish__figure", 6, 0.6],
  [".dish__content", 2.5, 0.9],
  [".dish__foot", 1.2, 1.1],
];

const NARRATIVE_LAYERS = [
  [".section-texture", 4, 1.0],
  [".narrative__content", 2.5, 0.9],
  [".philosophy__stack", 3, 0.9],
  [".cucina__stack", 3, 0.9],
  [".craft__grid", 2.5, 1.0],
  [".menu-intro__floats", 8, 0.8],
  [".chef__figure", 6, 0.6],
  [".chef__content", 2.5, 0.9],
  [".dish__floats-far", 8, 0.8],
  [".dish__floats-near", 12, 0.6],
  [".closing__stack", 2, 1.0],
];

export function bind() {
  triggers.forEach((st) => st.kill());
  triggers = [];
  if (prefersReducedMotion() || !window.ScrollTrigger) return;

  const container = $("#snap");

  const scrub = (el, section, amp, lag) => {
    const tween = gsap.fromTo(el, { yPercent: amp }, {
      yPercent: -amp,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        scroller: container,
        start: "top bottom",
        end: "bottom top",
        scrub: lag,
        fastScrollEnd: true,
      },
    });
    triggers.push(tween.scrollTrigger);
  };

  $$(".dish", container).forEach((section) => {
    DISH_LAYERS.forEach(([sel, amp, lag]) => {
      const el = section.querySelector(sel);
      if (el) scrub(el, section, amp, lag);
    });
  });

  $$(".narrative", container).forEach((section) => {
    if (section.id === "gallery") return; // gallery parallax is horizontal, handled in story.js
    NARRATIVE_LAYERS.forEach(([sel, amp, lag]) => {
      const el = section.querySelector(sel);
      if (el) scrub(el, section, amp, lag);
    });
  });

  // closing screen particles (idempotent)
  spawnParticles(".closing__particles", 9);
}

/* ---------- ambient particles (hero + closing) ---------- */
export function spawnParticles(containerSel, count = 12) {
  const wrap = $(containerSel);
  if (!wrap || wrap.childElementCount) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.style.insetInlineStart = `${8 + Math.random() * 84}%`;
    p.style.insetBlockStart = `${10 + Math.random() * 78}%`;
    p.style.setProperty("--dur", `${9 + Math.random() * 7}s`);
    p.style.setProperty("--delay", `${-Math.random() * 9}s`);
    p.style.setProperty("--dx", `${(Math.random() * 16 - 8).toFixed(1)}px`);
    p.style.opacity = (0.12 + Math.random() * 0.2).toFixed(2);
    const size = (3 + Math.random() * 3).toFixed(1);
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    wrap.append(p);
  }
}
