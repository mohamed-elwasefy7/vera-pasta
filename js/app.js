/* VERA PASTA — app.js
   Boot orchestration only. Feature logic lives in the modules. */

import {
  $, on, initI18n, getLang, setLang, t, applyStaticI18n, applyImage,
} from "./utils.js";
import * as menu from "./menu.js";
import * as story from "./story.js";
import * as swipe from "./swipe.js";
import * as animations from "./animations.js";
import * as parallax from "./parallax.js";
import * as loader from "./loader.js";

async function boot() {
  // 1) kick every fetch off in parallel — nothing gates the hero image
  const stringsPromise = fetch("data/i18n.json").then((r) => r.json());
  const dataPromise = menu.loadData();
  const storyPromise = story.loadStory(); // tolerant — never throws
  const loaderDone = loader.run(dataPromise, storyPromise);

  let strings = { en: {}, ar: {} };
  try {
    strings = await stringsPromise;
  } catch (err) {
    console.warn("[vera] i18n load failed", err);
  }
  initI18n(strings);
  applyStaticI18n();
  updateLangButton();
  // wire the toggle before the data gate so it works on the error screen too
  $("#lang-toggle").addEventListener("click", onLangToggle);

  try {
    await dataPromise;
  } catch (err) {
    console.error("[vera] menu load failed", err);
    menu.renderError();
    await loaderDone;
    return;
  }
  await storyPromise;

  menu.render();
  menu.initSheet();

  // engines (dish DOM exists now)
  swipe.init();
  swipe.initNavAutoHide();
  animations.init();
  animations.bindImages(applyImage);
  // heavy GSAP work (20 timelines + ~80 scrubs) waits for idle — the loader
  // covers this window; unbound sections degrade to fully-visible content
  idle(() => {
    animations.bindDishes();
    parallax.init();
  });

  // reveal
  await loaderDone;
  animations.heroEntrance();
}

const idle = (fn) =>
  ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 400 }) : setTimeout(fn, 120));

function onLangToggle() {
  const next = getLang() === "ar" ? "en" : "ar";
  setLang(next);
  applyStaticI18n();
  updateLangButton();
  if (!menu.getData()) {
    menu.renderError();          // menu never loaded — re-render the error card
    return;
  }
  const keepIndex = swipe.getActiveIndex();
  menu.render();                 // rebuild dish/drinks/finale DOM in new language
  swipe.rebind(keepIndex);       // re-observe new sections, restore position
  animations.bindDishes();       // rebuild timelines for new DOM
  animations.bindImages(applyImage);
  parallax.bind();
}

function updateLangButton() {
  const btn = $("#lang-toggle");
  const ar = getLang() === "ar";
  btn.textContent = ar ? "EN" : "ع";
  btn.setAttribute("aria-label", ar ? "Switch to English" : "التبديل إلى العربية");
}

/* GSAP CDN scripts are deferred like this module — wait for full parse */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
