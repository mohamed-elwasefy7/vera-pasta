/* VERA PASTA — ingredients.js
   Hand-drawn-style line-art ingredient pool for floating elements and
   craft tiles. Inline SVG mounts instantly; when a section approaches,
   upgradeFloats() probes assets/images/ingredients/{key}.* and swaps in
   a real cutout if one exists — drop files there later, zero code edits. */

import { $$, resolveImage } from "./utils.js";

const S = `fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;

export const INGREDIENT_SVGS = {
  basil: `<svg viewBox="0 0 64 64" ${S}><path d="M32 54V26"/><path d="M32 26C18 26 12 16 14 8c10-1 20 4 18 18Z"/><path d="M32 26c14 0 20-10 18-18-10-1-20 4-18 18Z" opacity=".55"/><path d="M32 40c-5-1-9-4-10-8"/></svg>`,
  tomato: `<svg viewBox="0 0 64 64" ${S}><circle cx="32" cy="37" r="17"/><path d="M32 20c-2-5 1-9 4-11M32 20c-5-3-10-2-13 0 3 3 8 4 13 0Zm0 0c5-3 10-2 13 0-3 3-8 4-13 0Z"/></svg>`,
  parmesan: `<svg viewBox="0 0 64 64" ${S}><path d="M8 42 50 16l6 8-4 26H14L8 42Z"/><path d="M50 16 52 50M8 42l44 0" opacity=".5"/><circle cx="26" cy="40" r="1.4"/><circle cx="36" cy="45" r="1.1"/><circle cx="20" cy="46" r="1"/></svg>`,
  "olive-branch": `<svg viewBox="0 0 64 64" ${S}><path d="M10 54C24 44 40 28 54 10"/><ellipse cx="30" cy="34" rx="4.5" ry="6.5" transform="rotate(-30 30 34)"/><ellipse cx="44" cy="20" rx="4" ry="6" transform="rotate(-35 44 20)"/><path d="M22 42c-4 1-8 0-10-2M38 28c-4 0-7-2-8-4M50 14c-3 0-5-1-6-3" opacity=".6"/></svg>`,
  wheat: `<svg viewBox="0 0 64 64" ${S}><path d="M32 58V22"/><path d="M32 30c-6 0-10-4-10-10 6 0 10 4 10 10Zm0 0c6 0 10-4 10-10-6 0-10 4-10 10Zm0 12c-6 0-10-4-10-10 6 0 10 4 10 10Zm0 0c6 0 10-4 10-10-6 0-10 4-10 10Z"/><path d="M32 14c0-4 2-7 4-8"/></svg>`,
  "pasta-nest": `<svg viewBox="0 0 64 64" ${S}><ellipse cx="32" cy="38" rx="20" ry="10"/><path d="M14 34c6-6 12-9 18-9s12 3 18 9M20 30c4-4 8-6 12-6s8 2 12 6" opacity=".6"/><path d="M26 46c4 2 8 2 12 0"/></svg>`,
  garlic: `<svg viewBox="0 0 64 64" ${S}><path d="M32 16c-3 6-14 8-14 22 0 8 6 12 14 12s14-4 14-12c0-14-11-16-14-22Z"/><path d="M32 16c0-3 1-6 3-8M32 26v22M26 30c-2 4-2 12 0 16M38 30c2 4 2 12 0 16" opacity=".55"/></svg>`,
  chili: `<svg viewBox="0 0 64 64" ${S}><path d="M46 14c-2 20-12 34-32 36 4 4 12 6 18 4 14-5 20-24 18-38"/><path d="M46 14c0-3 2-5 5-5M46 14c3-1 6 0 7 2"/></svg>`,
  shrimp: `<svg viewBox="0 0 64 64" ${S}><path d="M44 16a16 16 0 1 0 0 32h-8"/><path d="M44 16c6 0 10 3 12 7-4 2-9 2-12 0M40 48l-6 6M40 48l-8 2" /><path d="M44 24v16M36 22v18M29 26v11" opacity=".5"/><circle cx="50" cy="20" r="1.2"/></svg>`,
  lemon: `<svg viewBox="0 0 64 64" ${S}><ellipse cx="32" cy="34" rx="18" ry="13" transform="rotate(-18 32 34)"/><path d="M14 40c-2-1-3-3-2-5M50 22c2 1 3 3 2 5"/><path d="M32 26v16M24 29l4 12M40 29l-4 12" opacity=".5"/></svg>`,
  "pine-nut": `<svg viewBox="0 0 64 64" ${S}><path d="M32 12c8 8 12 16 12 24a12 12 0 1 1-24 0c0-8 4-16 12-24Z"/><path d="M32 22v26" opacity=".5"/></svg>`,
  mushroom: `<svg viewBox="0 0 64 64" ${S}><path d="M10 32c0-12 10-20 22-20s22 8 22 20c-8 3-36 3-44 0Z"/><path d="M26 34c-1 8-1 14 1 18h10c2-4 2-10 1-18"/><circle cx="24" cy="22" r="1.3" opacity=".6"/><circle cx="38" cy="19" r="1.3" opacity=".6"/></svg>`,
  cream: `<svg viewBox="0 0 64 64" ${S}><path d="M18 40c-4-2-6-6-4-10 2-3 6-4 9-2 0-6 5-10 10-10s9 4 10 9c4-1 8 1 9 5 1 4-1 7-5 8H18Z"/><path d="M22 48c6 2 14 2 20 0" opacity=".6"/></svg>`,
};

/* category fallback pools (JSON floatIngredients overrides) */
const CATEGORY_POOLS = {
  pasta: ["wheat", "basil", "tomato", "parmesan"],
  salads: ["basil", "olive-branch", "lemon", "tomato"],
  box: ["pasta-nest", "parmesan", "wheat", "basil"],
};
const DEFAULT_POOL = ["wheat", "basil", "tomato", "olive-branch"];

export function floatsFor(dish) {
  const keys = dish.floatIngredients?.length
    ? dish.floatIngredients
    : CATEGORY_POOLS[dish.category] || DEFAULT_POOL;
  return keys.filter((k) => INGREDIENT_SVGS[k]).slice(0, 4);
}

export function ingredientVisual(key, size = 48) {
  const wrap = document.createElement("span");
  wrap.className = "ingredient-visual";
  wrap.style.inlineSize = `${size}px`;
  wrap.style.blockSize = `${size}px`;
  wrap.innerHTML = INGREDIENT_SVGS[key] || INGREDIENT_SVGS.basil;
  wrap.dataset.ingredient = key;
  return wrap;
}

/* deterministic slots — top 45% of the screen, logical sides (RTL mirrors free) */
const SLOTS = [
  { side: "start", inline: "6%", block: "12%", size: 54, depth: "far" },
  { side: "end", inline: "8%", block: "20%", size: 42, depth: "near" },
  { side: "start", inline: "12%", block: "42%", size: 38, depth: "far" },
  { side: "end", inline: "6%", block: "36%", size: 60, depth: "near" },
];

export function mountFloats(section, dish) {
  const far = section.querySelector(".dish__floats-far");
  const near = section.querySelector(".dish__floats-near");
  if (!far || !near) return;
  floatsFor(dish).forEach((key, i) => {
    const slot = SLOTS[i];
    const el = document.createElement("span");
    el.className = `float float--${slot.depth}`;
    el.dataset.ingredient = key;
    el.style[slot.side === "start" ? "insetInlineStart" : "insetInlineEnd"] = slot.inline;
    el.style.insetBlockStart = slot.block;
    el.style.inlineSize = `${slot.size}px`;
    el.style.blockSize = `${slot.size}px`;
    el.innerHTML = INGREDIENT_SVGS[key];
    (slot.depth === "far" ? far : near).append(el);
  });
}

/* probe assets/images/ingredients/ for real cutouts; swap SVG -> img on hit */
const upgraded = new WeakSet();

export async function upgradeFloats(scope) {
  if (!scope || upgraded.has(scope)) return;
  upgraded.add(scope);
  for (const el of $$(".float, .ingredient-visual", scope)) {
    const key = el.dataset.ingredient;
    if (!key) continue;
    const resolved = await resolveImage(key, "assets/images/ingredients/");
    if (resolved.url && resolved.ext !== "svg") {
      const img = document.createElement("img");
      img.src = resolved.url;
      img.alt = "";
      img.decoding = "async";
      el.replaceChildren(img);
    }
  }
}
