/* VERA PASTA — loader.js
   Weighted real progress: fonts (.35) + hero image (.4) + menu.json (.25).
   Reveal at max(800ms, done), hard cap 1500ms. */

import { $, emit, prefersReducedMotion, resolveImage, applyImage } from "./utils.js";

const MIN = 800;
const CAP = 1500;

let progress = 0;

function setProgress(fraction) {
  progress = Math.max(progress, fraction);
  const line = $("#loader-line");
  if (!line) return;
  if (window.gsap && !prefersReducedMotion()) {
    gsap.to(line, { scaleX: progress, duration: 0.4, ease: "power1.out", overwrite: true });
  } else {
    line.style.transform = `scaleX(${progress})`;
  }
}

export async function run(menuPromise) {
  const start = performance.now();
  const reduced = prefersReducedMotion();
  let done = 0;
  const bump = (weight) => { done += weight; setProgress(done); };

  const tasks = [
    document.fonts.ready.then(() => bump(0.35)).catch(() => bump(0.35)),
    loadHero().then(() => bump(0.4)).catch(() => bump(0.4)),
    menuPromise.then(() => bump(0.25)).catch(() => bump(0.25)),
  ];

  const cap = new Promise((r) => setTimeout(r, reduced ? 400 : CAP));
  await Promise.race([Promise.all(tasks), cap]);

  const elapsed = performance.now() - start;
  const minWait = reduced ? 400 : MIN;
  if (elapsed < minWait) await new Promise((r) => setTimeout(r, minWait - elapsed));

  await dissolve(reduced);
  emit("loader:done");
}

async function loadHero() {
  const img = $("#hero-img");
  const resolved = await resolveImage("hero", "assets/hero/");
  if (!resolved.url) return;
  await applyImage(img, "hero", "assets/hero/", "(min-width:1024px) 30vw, 58vw");
  try { await img.decode(); } catch { /* decode is best-effort */ }
}

function dissolve(reduced) {
  const loader = $("#loader");
  loader.classList.add("is-done");
  return new Promise((resolve) => {
    if (reduced || !window.gsap) {
      loader.style.display = "none";
      resolve();
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => { loader.style.display = "none"; resolve(); },
    });
    tl.to("#loader-line", { scaleX: 1, duration: 0.2, ease: "power1.out" })
      .to(".loader__inner", { y: -8, opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0.1)
      .to(loader, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, 0.25);
  });
}
