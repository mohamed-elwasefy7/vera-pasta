/* VERA PASTA — menu.js
   Data fetch/validation + full v2 screen composition:
   [story, philosophy, craft, menu-intro] → dishes → drinks →
   chef signature → gallery → order → closing.
   Everything reads from data; language re-render rebuilds it all. */

import {
  $, $$, emit, t, getLang, storage, toast, ICONS,
} from "./utils.js";
import * as story from "./story.js";
import { mountFloats } from "./ingredients.js";

let data = null;
const REQUIRED = ["id", "name", "price", "image", "background"];

export function getData() {
  return data;
}

export function getSignatureDish() {
  if (!data) return null;
  return data.dishes.find((d) => d.signature) ?? data.dishes.find((d) => d.chefChoice) ?? null;
}

export async function loadData() {
  const res = await fetch("data/menu.json");
  if (!res.ok) throw new Error(`menu.json ${res.status}`);
  data = await res.json();
  data.dishes = (data.dishes || []).filter((d) => {
    const ok = REQUIRED.every((k) => d[k] !== undefined && d[k] !== "");
    if (!ok) console.warn("[vera] dish skipped (missing keys):", d.id || d);
    return ok && d.available !== false;
  });
  data.drinks = (data.drinks || []).filter((d) => d.available !== false);
  return data;
}

export function renderError() {
  const main = $("#snap");
  main.innerHTML = `
    <section class="screen" data-mood="cream">
      <div class="error-card">
        <h2>${t("errorTitle")}</h2>
        <p>${t("errorBody")}</p>
      </div>
    </section>`;
}

/* ---------- render: the 19-screen composition ---------- */
export function render() {
  const main = $("#snap");
  // clear everything after the hero (re-render on language switch)
  $$(".screen", main).forEach((s, i) => { if (i > 0) s.remove(); });

  const st = story.getStory();
  const append = (node) => { if (node) main.append(node); };

  // Food-first flow (v2.2): the narrative intro screens are intentionally not
  // composed — first dish is one swipe from the hero. To restore them, append
  // story.buildStory/buildCucina/buildPhilosophy/buildCraft/buildMenuIntro here.
  renderHeroCategories();

  const catLabel = (id) => {
    const cat = data.categories?.find((c) => c.id === id);
    return cat ? t(cat.label) : id;
  };
  const tpl = $("#dish-template");
  const favs = new Set(storage.get("vera:favorites", []));
  data.dishes.forEach((dish) => {
    main.append(buildDish(dish, tpl, catLabel, favs));
  });

  if (data.drinks.length) append(renderDrinks());

  if (st) {
    append(story.buildChef(getSignatureDish(), openSheet));
    const gallery = story.buildGallery(data.dishes);
    append(gallery);
    story.initGalleryStrip(gallery);
    append(story.buildOrder(data.restaurant || {}));
    append(story.buildClosing(data.restaurant || {}));
  }

  emit("menu:rendered", { dishes: data.dishes });
}

/* ---------- hero: quick category chips (rebuilt every render → bilingual) ---------- */
function renderHeroCategories() {
  const wrap = $(".hero__cats");
  if (!wrap) return;
  wrap.innerHTML = "";
  const firstOf = (catId) => data.dishes.find((d) => d.category === catId)?.id;

  (data.categories || []).forEach((cat) => {
    const target = firstOf(cat.id);
    if (!target) return;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "hero__cat";
    chip.dataset.goto = target;
    chip.textContent = t(cat.label);
    wrap.append(chip);
  });
  if (data.drinks.length) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "hero__cat";
    chip.dataset.goto = "drinks";
    chip.textContent = t("drinksTitle");
    wrap.append(chip);
  }
  // primary CTA jumps straight to the first dish
  const cta = $(".hero__cta");
  if (cta && data.dishes[0]) cta.dataset.goto = data.dishes[0].id;
}

/* ---------- dish v2 ---------- */
function buildDish(dish, tpl, catLabel, favs) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.id = dish.id;
  node.dataset.mood = dish.background;
  node.dataset.presentation = dish.presentation || "plate";
  node.setAttribute("aria-label", t(dish.name));

  // L2 ghost texture word = first word of the Italian subtitle
  $(".dish__texture", node).textContent = (dish.subtitle || "VERA").split(" ")[0];

  // L3 floating ingredients
  mountFloats(node, dish);

  const img = $(".dish__img", node);
  img.alt = `${t(dish.name)} — ${dish.subtitle || ""}`;
  img.dataset.image = dish.image;

  $(".dish__kicker", node).textContent = catLabel(dish.category);
  $(".dish__name .reveal__inner", node).textContent = t(dish.name);

  const sub = $(".dish__subtitle", node);
  if (dish.subtitle) {
    const span = $("span", sub);
    span.textContent = dish.subtitle;
    span.lang = "it";
  } else sub.remove();

  const insp = $(".dish__inspiration", node);
  if (dish.inspiration) insp.textContent = t(dish.inspiration);
  else insp.remove();

  $(".dish__desc", node).textContent = t(dish.description);

  const ul = $(".dish__ingredients", node);
  (t(dish.ingredients) || []).forEach((ing) => {
    const li = document.createElement("li");
    li.textContent = ing;
    ul.append(li);
  });

  $(".dish__price-num", node).textContent = dish.price;
  $(".dish__price-cur", node).textContent = t("sar");

  const cal = $(".dish__cal", node);
  if (dish.calories) cal.innerHTML = `${ICONS.flame}<span>${dish.calories} ${t("kcal")}</span>`;
  else cal.remove();

  const time = $(".dish__time", node);
  if (dish.prepTime) time.innerHTML = `${ICONS.clock}<span>${dish.prepTime} ${t("min")}</span>`;
  else time.remove();

  const badges = $(".dish__badges", node);
  const badge = (icon, label) => {
    const b = document.createElement("span");
    b.className = "badge";
    b.innerHTML = `${icon}<span>${label}</span>`;
    badges.append(b);
  };
  if (dish.chefChoice) badge(ICONS.toque, t("chefChoice"));
  if (dish.vegetarian) badge(ICONS.leaf, t("vegetarian"));
  if (dish.spicy) badge(ICONS.chili, t("spicy"));

  const orderBtn = $(".dish__order", node);
  orderBtn.textContent = t("order");
  orderBtn.addEventListener("click", () => openSheet(dish, orderBtn));

  const favBtn = $(".dish__fav", node);
  favBtn.innerHTML = ICONS.heart;
  const isFav = favs.has(dish.id);
  favBtn.setAttribute("aria-pressed", String(isFav));
  favBtn.setAttribute("aria-label", t(isFav ? "unfavorite" : "favorite"));
  favBtn.addEventListener("click", () => toggleFavorite(dish.id, favBtn));

  const shareBtn = $(".dish__share", node);
  shareBtn.innerHTML = ICONS.share;
  shareBtn.setAttribute("aria-label", t("share"));
  shareBtn.addEventListener("click", () => {
    if (window.gsap) {
      const icon = shareBtn.querySelector("svg");
      gsap.fromTo(icon, { y: 0 }, { y: -3, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1 });
    }
    share(dish);
  });

  return node;
}

/* ---------- drinks screen ---------- */
function renderDrinks() {
  const s = document.createElement("section");
  s.className = "screen drinks";
  s.id = "drinks";
  s.dataset.mood = "cream";
  s.dataset.animate = "";
  s.setAttribute("aria-label", t("drinksTitle"));
  s.innerHTML = `
    <div class="drinks__head">
      <p class="dish__kicker drinks__kicker" dir="ltr" lang="it" data-enter="rise" data-enter-at="0">${t("drinksKicker")}</p>
      <h2 class="drinks__title"><span class="reveal"><span class="reveal__inner" data-enter="mask" data-enter-at="0.08">${t("drinksTitle")}</span></span></h2>
    </div>
    <div class="drinks__strip" role="list" tabindex="0" aria-label="${t("drinksTitle")}"></div>`;
  const strip = $(".drinks__strip", s);
  data.drinks.forEach((drink, i) => {
    const card = document.createElement("div");
    card.className = "drink-card";
    card.setAttribute("role", "listitem");
    if (i < 6) {
      card.dataset.enter = "pop";
      card.dataset.enterAt = (0.25 + i * 0.05).toFixed(2);
    }
    card.innerHTML = `
      <img alt="${t(drink.name)}" loading="lazy" decoding="async">
      <p class="drink-card__name">${t(drink.name)}</p>
      <p class="drink-card__price">${drink.price} ${t("sar")}</p>`;
    const img = $("img", card);
    img.dataset.image = drink.image;
    img.dataset.dir = "assets/images/drinks/";
    img.dataset.sizes = "80px";
    strip.append(card);
  });
  return s;
}

/* ---------- favorites ---------- */
function toggleFavorite(id, btn) {
  const favs = new Set(storage.get("vera:favorites", []));
  const nowFav = !favs.has(id);
  if (nowFav) favs.add(id);
  else favs.delete(id);
  storage.set("vera:favorites", [...favs]);
  btn.setAttribute("aria-pressed", String(nowFav));
  btn.setAttribute("aria-label", t(nowFav ? "unfavorite" : "favorite"));
  if (!window.gsap) return;
  gsap.killTweensOf(btn);
  if (nowFav) {
    // double heartbeat
    gsap.timeline()
      .to(btn, { scale: 1.28, duration: 0.14, ease: "power2.out" })
      .to(btn, { scale: 0.94, duration: 0.12, ease: "power2.inOut" })
      .to(btn, { scale: 1.1, duration: 0.12, ease: "power2.inOut" })
      .to(btn, { scale: 1, duration: 0.18, ease: "power2.out" });
  } else {
    gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.25, ease: "power2.out" });
  }
}

/* ---------- share ---------- */
async function share(dish) {
  const url = `${location.origin}${location.pathname}#${dish.id}`;
  const payload = { title: `VERA PASTA — ${t(dish.name)}`, text: t(dish.description), url };
  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast(t("linkCopied"));
  } catch (err) {
    if (err?.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(url);
      toast(t("linkCopied"));
    } catch {
      toast(url);
    }
  }
}

/* ---------- order bottom sheet ---------- */
let lastTrigger = null;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function openSheet(dish, trigger) {
  const sheet = $("#order-sheet");
  lastTrigger = trigger;
  $("#sheet-title").textContent = t(dish.name);

  const linksEl = $("#sheet-links");
  const merged = { ...(data.restaurant?.orderLinks || {}) };
  for (const [app, url] of Object.entries(dish.orderLinks || {})) {
    if (url) merged[app] = url;
  }
  const entries = Object.entries(merged).filter(([, url]) => url && !url.includes("REPLACE_ME"));
  linksEl.innerHTML = entries.length
    ? entries.map(([app, url]) =>
        `<a href="${url}" target="_blank" rel="noopener">${cap(app)}</a>`).join("")
    : `<p class="sheet__sub">${getLang() === "ar" ? "روابط الطلب تُضاف قريباً" : "Ordering links coming soon"}</p>`;

  sheet.showModal();
  if (window.gsap) {
    gsap.fromTo(sheet, { y: "100%" }, { y: 0, duration: 0.38, ease: "power3.out" });
  } else {
    sheet.style.transform = "translateY(0)";
  }
}

export function initSheet() {
  const sheet = $("#order-sheet");
  const close = () => {
    if (!sheet.open) return;
    const done = () => {
      sheet.close();
      lastTrigger?.focus({ preventScroll: true });
    };
    if (window.gsap) {
      gsap.to(sheet, { y: "100%", duration: 0.26, ease: "power2.in", onComplete: done });
    } else done();
  };
  $(".sheet__close", sheet).addEventListener("click", close);
  sheet.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
  // close only on real backdrop clicks — clicks on the dialog's own padding
  // and grid gaps also have e.target === sheet, so test the coordinates
  sheet.addEventListener("click", (e) => {
    if (e.target !== sheet) return;
    const r = sheet.getBoundingClientRect();
    const inside =
      e.clientX >= r.left && e.clientX <= r.right &&
      e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) close();
  });
}
