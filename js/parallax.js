/* VERA PASTA — parallax.js
   ScrollTrigger scrubbed parallax inside the snap container
   (ScrollTrigger reads positions; it never drives the snap)
   + hero floating particles. Fully skipped under reduced motion. */

import { $, $$, prefersReducedMotion } from "./utils.js";

let triggers = [];

export function init() {
  if (prefersReducedMotion() || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  spawnParticles();
  bind();
}

export function bind() {
  triggers.forEach((st) => st.kill());
  triggers = [];
  if (prefersReducedMotion() || !window.ScrollTrigger) return;

  const container = $("#snap");

  $$(".dish", container).forEach((section) => {
    const figure = $(".dish__figure", section);
    const content = $(".dish__content", section);
    if (!figure) return;
    // layers drift at different speeds while the screen passes through
    const tween = gsap.fromTo(figure, { yPercent: 6 }, {
      yPercent: -6,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        scroller: container,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      },
    });
    triggers.push(tween.scrollTrigger);
    if (content) {
      const t2 = gsap.fromTo(content, { yPercent: 2.5 }, {
        yPercent: -2.5,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          scroller: container,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.9,
        },
      });
      triggers.push(t2.scrollTrigger);
    }
  });
}

/* ---------- hero particles ---------- */
function spawnParticles() {
  const wrap = $(".hero__particles");
  if (!wrap || wrap.childElementCount) return;
  const COUNT = 12;
  for (let i = 0; i < COUNT; i++) {
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
