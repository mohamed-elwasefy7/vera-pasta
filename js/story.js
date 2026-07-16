/* VERA PASTA — story.js
   v2 narrative sections: story, philosophy, craft, menu intro, chef
   signature, gallery, order, closing. All copy from data/story.json
   (bilingual via t()); failure-tolerant — a missing story.json only
   drops the narrative screens, never the menu. */

import { $, $$, t, applyImage, ICONS } from "./utils.js";
import { ingredientVisual } from "./ingredients.js";

let story = null;

export async function loadStory() {
  try {
    const res = await fetch("data/story.json");
    if (!res.ok) throw new Error(`story.json ${res.status}`);
    story = await res.json();
  } catch (err) {
    console.warn("[vera] story.json unavailable — narrative screens skipped", err);
    story = null;
  }
  return story;
}

export function getStory() {
  return story;
}

/* ---------- shared helpers ---------- */
function section(id, mood, ariaKey, extraClass = "") {
  const s = document.createElement("section");
  s.className = `screen narrative ${extraClass}`.trim();
  s.id = id;
  s.dataset.mood = mood;
  s.dataset.animate = "";
  s.setAttribute("aria-label", t(ariaKey));
  return s;
}

const kickerHTML = (field) =>
  `<p class="section-kicker" data-enter="rise" data-enter-at="0">${t(field)}</p>`;

const maskTitleHTML = (field, cls = "section-title") =>
  `<h2 class="${cls}"><span class="reveal"><span class="reveal__inner" data-enter="mask" data-enter-at="0.08">${t(field)}</span></span></h2>`;

const ruleHTML = (at = "0.26") =>
  `<span class="gold-rule" data-enter="rule" data-enter-at="${at}" aria-hidden="true"></span>`;

const textureHTML = (word) =>
  `<div class="section-texture" aria-hidden="true" dir="ltr">${word}</div>`;

/* ---------- 1. Our Story ---------- */
export function buildStory() {
  const s = section("our-story", "cream", "screenStory");
  const paras = story.story.paragraphs
    .map((p, i) =>
      `<p class="${i === 0 ? "narrative__lead" : "narrative__body"}" data-enter="rise" data-enter-at="${0.32 + i * 0.14}">${t(p)}</p>`)
    .join("");
  s.innerHTML = `
    ${textureHTML("VERA")}
    <div class="narrative__content">
      ${kickerHTML(story.story.kicker)}
      ${maskTitleHTML(story.story.title)}
      ${ruleHTML()}
      ${paras}
    </div>`;
  return s;
}

/* ---------- 2. Philosophy ---------- */
export function buildPhilosophy() {
  const s = section("philosophy", "espresso", "screenPhilosophy", "philosophy");
  const lines = story.philosophy.lines
    .map((line, i) => {
      const emph = i === story.philosophy.emphasis;
      return `<span class="philosophy__line${emph ? " philosophy__line--emph" : ""}">
        <span class="reveal"><span class="reveal__inner" data-enter="mask" data-enter-at="${0.05 + i * 0.18}">${t(line)}</span></span>
        ${emph ? `<svg class="philosophy__underline" viewBox="0 0 220 12" aria-hidden="true" preserveAspectRatio="none"><path d="M4 8c40-5 140-6 212-2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>` : ""}
      </span>`;
    })
    .join("");
  s.innerHTML = `
    ${textureHTML("V")}
    <div class="philosophy__stack">
      ${lines}
      <p class="philosophy__signature" data-enter="fade" data-enter-at="1.2">${t(story.philosophy.signature)}</p>
    </div>`;
  return s;
}

/* ---------- 3. Crafted by Hand ---------- */
export function buildCraft() {
  const s = section("craft", "sage", "screenCraft", "craft");
  s.innerHTML = `
    ${textureHTML("a mano")}
    <div class="narrative__content narrative__content--center">
      ${kickerHTML(story.craft.kicker)}
      ${maskTitleHTML(story.craft.title)}
    </div>
    <div class="craft__grid"></div>`;
  const grid = $(".craft__grid", s);
  story.craft.items.forEach((item, i) => {
    const tile = document.createElement("div");
    tile.className = "craft-tile";
    tile.dataset.enter = "pop";
    tile.dataset.enterAt = (0.3 + i * 0.09).toFixed(2);
    tile.append(ingredientVisual(item.key, 64));
    tile.insertAdjacentHTML("beforeend",
      `<p class="craft-tile__name">${t(item.name)}</p>
       <p class="craft-tile__note">${t(item.note)}</p>`);
    grid.append(tile);
  });
  return s;
}

/* ---------- 4. Menu Introduction ---------- */
export function buildMenuIntro() {
  const s = section("menu-intro", "terracotta", "screenMenuIntro", "menu-intro");
  s.innerHTML = `
    <div class="menu-intro__floats" aria-hidden="true">
      <span class="float float--far menu-intro__float-a" data-ingredient="wheat" data-enter="pop" data-enter-at="0.2"></span>
      <span class="float float--near menu-intro__float-b" data-ingredient="basil" data-enter="pop" data-enter-at="0.3"></span>
    </div>
    <div class="narrative__content narrative__content--center">
      ${kickerHTML(story.menuIntro.kicker)}
      ${maskTitleHTML(story.menuIntro.title, "section-title section-title--poster")}
      ${ruleHTML("0.28")}
      <p class="narrative__body narrative__body--center" data-enter="rise" data-enter-at="0.4">${t(story.menuIntro.body)}</p>
    </div>
    <div class="swipe-hint" aria-hidden="true">
      <span class="swipe-hint__label">${t("swipeUp")}</span>
      <span class="swipe-hint__chevron"></span>
    </div>`;
  $$(".menu-intro__floats .float", s).forEach((el) => {
    el.innerHTML = ingredientVisual(el.dataset.ingredient, 56).innerHTML;
  });
  return s;
}

/* ---------- 5. Chef signature ---------- */
export function buildChef(dish, openSheet) {
  if (!dish) return null;
  const s = section("chef", dish.background || "rose", "screenChef", "chef");
  s.innerHTML = `
    <div class="dish__bg" aria-hidden="true"></div>
    <div class="section-texture" aria-hidden="true" dir="ltr">${(dish.subtitle || "VERA").split(" ")[0]}</div>
    <div class="dish__floats" aria-hidden="true">
      <div class="dish__floats-far"></div>
      <div class="dish__floats-near"></div>
    </div>
    <figure class="chef__figure" data-enter="photo" data-enter-at="0.05">
      <div class="dish__breathe">
        <img class="chef__img" data-image="${dish.image}" alt="${t(dish.name)}" loading="lazy" decoding="async">
      </div>
    </figure>
    <div class="chef__content">
      ${kickerHTML(story.chef.kicker)}
      <h2 class="chef__name"><span class="reveal"><span class="reveal__inner" data-enter="mask" data-enter-at="0.3">${t(dish.name)}</span></span></h2>
      <p class="chef__quote" data-enter="rise" data-enter-at="0.45">${t(story.chef.quote)}</p>
      ${dish.inspiration ? `<p class="dish__inspiration" data-enter="rise" data-enter-at="0.55">${t(dish.inspiration)}</p>` : ""}
      <p class="dish__price" data-enter-group="price">
        <span class="reveal"><span class="reveal__inner" data-enter="mask" data-enter-at="0.65">${dish.price} <span class="dish__price-cur">${t("sar")}</span></span></span><span class="dish__price-rule" data-enter="rule" data-enter-at="0.75" aria-hidden="true"></span>
      </p>
      <div class="chef__actions" data-enter="rise" data-enter-at="0.8">
        <button class="btn btn--primary chef__order" type="button">${t("order")}</button>
        <button class="chef__view" type="button" data-goto="${dish.id}">${t("viewInMenu")}</button>
      </div>
    </div>`;
  $(".chef__order", s).addEventListener("click", (e) => openSheet(dish, e.currentTarget));
  return s;
}

/* ---------- 6. Gallery ---------- */
export function buildGallery(dishes) {
  const s = section("gallery", "espresso", "screenGallery", "gallery");
  const cards = dishes
    .map((dish, i) => `
      <figure class="gallery-card ${i % 2 ? "gallery-card--square" : "gallery-card--tall"}" role="listitem">
        <div class="gallery-card__frame">
          <img data-image="${dish.image}" data-dir="assets/images/dishes/" data-sizes="80vw" alt="${t(dish.name)}" loading="lazy" decoding="async">
        </div>
        <figcaption>
          <span class="gallery-card__index" dir="ltr">${String(i + 1).padStart(2, "0")}</span>
          <span class="gallery-card__name">${t(dish.name)}</span>
        </figcaption>
      </figure>`)
    .join("");
  s.innerHTML = `
    <div class="gallery__head narrative__content--center">
      ${kickerHTML(story.gallery.kicker)}
      ${maskTitleHTML(story.gallery.title)}
      <p class="gallery__counter" dir="ltr" data-enter="fade" data-enter-at="0.3">01 / ${String(dishes.length).padStart(2, "0")}</p>
    </div>
    <div class="gallery__strip" role="list" tabindex="0" aria-label="${t(story.gallery.title)}">${cards}</div>
    <div class="gallery__arrows" data-enter="fade" data-enter-at="0.4">
      <button type="button" class="iconbtn gallery__prev" aria-label="${t("galleryPrev")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg></button>
      <button type="button" class="iconbtn gallery__next" aria-label="${t("galleryNext")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg></button>
    </div>`;
  return s;
}

/* gallery strip: rAF parallax + counter + arrows (rect math — RTL-safe) */
export function initGalleryStrip(s) {
  const strip = $(".gallery__strip", s);
  const counter = $(".gallery__counter", s);
  const cards = $$(".gallery-card", s);
  if (!strip || !cards.length) return;
  const total = String(cards.length).padStart(2, "0");
  const setters = window.gsap
    ? cards.map((c) => gsap.quickSetter($("img", c), "xPercent"))
    : null;

  let ticking = false;
  const update = () => {
    ticking = false;
    const stripRect = strip.getBoundingClientRect();
    const centerX = stripRect.left + stripRect.width / 2;
    let nearest = 0;
    let nearestDist = Infinity;
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const cardCenter = r.left + r.width / 2;
      const offset = (cardCenter - centerX) / stripRect.width;
      if (setters) setters[i](offset * -10);
      const dist = Math.abs(cardCenter - centerX);
      if (dist < nearestDist) { nearestDist = dist; nearest = i; }
    });
    if (counter) counter.textContent = `${String(nearest + 1).padStart(2, "0")} / ${total}`;
  };
  strip.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  requestAnimationFrame(update);

  const step = (dir) => {
    const sign = dir * (document.documentElement.dir === "rtl" ? -1 : 1);
    strip.scrollBy({ left: sign * strip.clientWidth * 0.7, behavior: "smooth" });
  };
  $(".gallery__prev", s)?.addEventListener("click", () => step(-1));
  $(".gallery__next", s)?.addEventListener("click", () => step(1));
  strip.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); step(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); step(1); }
  });
}

/* ---------- 7. Order experience ---------- */
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const usable = (url) => url && !url.includes("REPLACE_ME") && !url.includes("X");

export function buildOrder(restaurant) {
  const s = section("order", "cream", "screenOrder", "order");
  const channels = [];
  for (const [app, url] of Object.entries(restaurant.orderLinks || {})) {
    if (usable(url)) channels.push({ name: cap(app), role: t("roleDelivery"), url });
  }
  const wa = restaurant.whatsapp && !restaurant.whatsapp.includes("X")
    ? `https://wa.me/${restaurant.whatsapp.replace(/[^\d]/g, "")}` : "";
  if (wa) channels.push({ name: "WhatsApp", role: t("roleChat"), url: wa });
  if (usable(restaurant.instagram)) channels.push({ name: "Instagram", role: t("roleFollow"), url: restaurant.instagram });

  const cardsHTML = channels.length
    ? channels.map((c, i) => `
        <a class="order-card" href="${c.url}" target="_blank" rel="noopener" data-enter="rise" data-enter-at="${0.4 + i * 0.09}">
          <span class="order-card__name">${c.name}</span>
          <span class="order-card__role">${c.role}</span>
          <span class="order-card__arrow" aria-hidden="true">↗</span>
        </a>`).join("")
    : `<p class="narrative__body narrative__body--center" data-enter="rise" data-enter-at="0.4">${document.documentElement.lang === "ar" ? "روابط الطلب تُضاف قريباً" : "Ordering links coming soon"}</p>`;

  s.innerHTML = `
    ${textureHTML("Ciao")}
    <div class="narrative__content narrative__content--center">
      ${kickerHTML(story.order.kicker)}
      ${maskTitleHTML(story.order.title)}
      <p class="narrative__body narrative__body--center" data-enter="rise" data-enter-at="0.3">${t(story.order.body)}</p>
    </div>
    <div class="order__cards">${cardsHTML}</div>`;
  return s;
}

/* ---------- 8. Luxury closing ---------- */
export function buildClosing(restaurant) {
  const s = section("closing", "espresso", "screenClosing", "closing");
  const hours = (restaurant.hours || [])
    .map((h) => `${t(h.days)} · ${h.open}–${h.close}`)
    .join(" — ");
  const social = (url, icon, label) =>
    usable(url) ? `<a href="${url}" target="_blank" rel="noopener">${icon}<span>${label}</span></a>` : "";
  const wa = restaurant.whatsapp && !restaurant.whatsapp.includes("X")
    ? `https://wa.me/${restaurant.whatsapp.replace(/[^\d]/g, "")}` : "";
  s.innerHTML = `
    <div class="closing__particles" aria-hidden="true"></div>
    <div class="closing__stack">
      <div class="wordmark wordmark--closing" data-enter="mask-wrap">
        <span class="reveal"><span class="reveal__inner" data-enter="mask" data-enter-at="0">
          <span class="wordmark__vera">VERA</span><span class="wordmark__divider"></span><span class="wordmark__pasta">PASTA</span>
        </span></span>
      </div>
      <p class="closing__thanks" dir="ltr" lang="it" data-enter="rise" data-enter-at="0.2">${t(story.closing.thanks)}</p>
      <p class="finale__cucina" dir="ltr" lang="it" data-enter="rise" data-enter-at="0.32">${t("cucina")}</p>
      <p class="closing__sub" data-enter="rise" data-enter-at="0.42">${t(story.closing.sub)}</p>
      <div class="finale__info" data-enter="fade" data-enter-at="0.55">
        ${social(restaurant.instagram, ICONS.instagram, t("instagram"))}
        ${social(wa, ICONS.whatsapp, t("whatsapp"))}
        ${social(restaurant.mapsUrl, ICONS.pin, t(restaurant.location))}
        <p class="finale__hours">${t("hoursLabel")}: ${hours}</p>
      </div>
      ${ruleHTML("0.7")}
    </div>`;
  return s;
}
