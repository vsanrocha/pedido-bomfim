# Cart Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shopping cart to the Distribuidora Bomfim catalog that lets the user add kits (with quantity) and individual products from those kits (with custom quantities), displaying a detailed slide-out panel with kit contents and avulso item source flags.

**Architecture:** Vanilla JS singleton store (`cart.js`) emits `CustomEvent` on `window` whenever state changes — components subscribe and re-render their own fragments. A fixed slide-out cart panel renders the full order summary. No framework, no bundler plugins — pure DOM manipulation consistent with the rest of the codebase.

**Tech Stack:** Vite + vanilla HTML/CSS/JS (existing), CSS custom properties (existing design tokens), `CustomEvent` for cross-component communication.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `src/store/cart.js` | Singleton cart state: add/remove/update kit + avulso items; emit `cart:change` events |
| **Create** | `src/components/cart-panel.js` | Slide-out cart panel component: renders kits section + avulso section + totals |
| **Create** | `src/styles/cart.css` | Styles for cart button (header), slide-out panel, cart item rows, totals |
| **Modify** | `src/styles/variables.css` | Add `--cart-panel-width`, `--z-cart` tokens |
| **Modify** | `src/components/header.js` | Add cart button with counter badge; open/close panel on click |
| **Modify** | `src/components/kit-card.js` | Add "Adicionar Kit" button + stepper; add per-product "+" button |
| **Modify** | `src/components/line-section.js` | Add qty stepper + "Adicionar" button to each avulso row |
| **Modify** | `src/main.js` | Import cart CSS + cart panel; mount panel to `#app` |

---

## Cart Data Model

```js
// src/store/cart.js internal state
{
  kits: [
    {
      id: "nano-reconstrutor-profissional",   // slugified kit name
      kitName: "Nano Reconstrutor Profissional",
      lineName: "Nano Reconstrutor",
      kitPrice: 631.80,
      quantity: 1,
      products: [                             // informational only (display in cart)
        { name: "Shampoo Intensive Cleaning", volume: "1000 ml", price: 135.90 },
        // ...
      ],
    }
  ],
  avulsoItems: [
    {
      id: "nano-reconstrutor-profissional--shampoo-intensive-cleaning--1000ml",
      name: "Shampoo Intensive Cleaning",
      volume: "1000 ml",
      price: 135.90,
      quantity: 3,
      fromKit: "Nano Reconstrutor Profissional",  // badge label
      lineName: "Nano Reconstrutor",
    }
  ]
}
```

---

## Task 1: Cart store (`src/store/cart.js`)

**Files:**
- Create: `src/store/cart.js`

- [ ] **Step 1.1 — Create the store module**

```js
// src/store/cart.js
const state = {
  kits: [],
  avulsoItems: [],
};

function emit() {
  window.dispatchEvent(new CustomEvent("cart:change", { detail: getState() }));
}

export function getState() {
  return {
    kits: [...state.kits],
    avulsoItems: [...state.avulsoItems],
  };
}

export function addKit(kitData) {
  const existing = state.kits.find((k) => k.id === kitData.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.kits.push({ ...kitData, quantity: 1 });
  }
  emit();
}

export function removeKit(id) {
  state.kits = state.kits.filter((k) => k.id !== id);
  emit();
}

export function updateKitQty(id, quantity) {
  if (quantity <= 0) { removeKit(id); return; }
  const kit = state.kits.find((k) => k.id === id);
  if (kit) { kit.quantity = quantity; emit(); }
}

export function addAvulso(itemData) {
  const existing = state.avulsoItems.find((i) => i.id === itemData.id);
  if (existing) {
    existing.quantity += itemData.quantity ?? 1;
  } else {
    state.avulsoItems.push({ ...itemData, quantity: itemData.quantity ?? 1 });
  }
  emit();
}

export function removeAvulso(id) {
  state.avulsoItems = state.avulsoItems.filter((i) => i.id !== id);
  emit();
}

export function updateAvulsoQty(id, quantity) {
  if (quantity <= 0) { removeAvulso(id); return; }
  const item = state.avulsoItems.find((i) => i.id === itemData.id);
  if (item) { item.quantity = quantity; emit(); }
}

export function clearCart() {
  state.kits = [];
  state.avulsoItems = [];
  emit();
}

export function getTotals() {
  const kitsTotal = state.kits.reduce((s, k) => s + k.kitPrice * k.quantity, 0);
  const avulsoTotal = state.avulsoItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = state.kits.reduce((s, k) => s + k.quantity, 0)
    + state.avulsoItems.reduce((s, i) => s + i.quantity, 0);
  return { kitsTotal, avulsoTotal, total: kitsTotal + avulsoTotal, itemCount };
}
```

> **Bug to fix before commit:** `updateAvulsoQty` references `itemData.id` — change to `id`.

- [ ] **Step 1.2 — Fix the bug:**

In `updateAvulsoQty`, change:
```js
const item = state.avulsoItems.find((i) => i.id === itemData.id);
```
to:
```js
const item = state.avulsoItems.find((i) => i.id === id);
```

- [ ] **Step 1.3 — Verify the file has no syntax errors**

Run: `cd /home/viniciusrocha/projetos-pessoais/pedido-bomfim && node --input-type=module < src/store/cart.js 2>&1 || echo "SYNTAX ERROR"`

Expected: no output (or just a blank line, no SYNTAX ERROR).

- [ ] **Step 1.4 — Commit**

```bash
git add src/store/cart.js
git commit -m "feat: add cart singleton store with kit + avulso item management"
```

---

## Task 2: CSS tokens + cart styles

**Files:**
- Modify: `src/styles/variables.css`
- Create: `src/styles/cart.css`

- [ ] **Step 2.1 — Add cart tokens to `variables.css`**

Append inside `:root {}` (before the closing brace):
```css
  --cart-panel-width: 420px;
  --z-cart: 200;
  --cart-bg: #FFFCF8;
  --cart-header-bg: var(--dark-brown);
```

And in the `@media (max-width: 768px)` block:
```css
  :root {
    --cart-panel-width: 100vw;
  }
```

- [ ] **Step 2.2 — Create `src/styles/cart.css`**

```css
/* ── Cart Button (in header) ── */
.cart-btn {
  position: relative;
  background: var(--dark-brown);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  padding: 6px 14px;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.cart-btn:hover {
  background: var(--section-bg);
}

.cart-btn-count {
  background: var(--gold);
  color: var(--dark-brown);
  border-radius: 10px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
  display: inline-block;
}

.cart-btn-count[data-empty="true"] {
  display: none;
}

/* ── Overlay ── */
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(61, 43, 31, 0.45);
  z-index: calc(var(--z-cart) - 1);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.cart-overlay.open {
  opacity: 1;
  pointer-events: all;
}

/* ── Slide-out Panel ── */
.cart-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: var(--cart-panel-width);
  height: 100dvh;
  background: var(--cart-bg);
  z-index: var(--z-cart);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 32px rgba(61, 43, 31, 0.18);
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.cart-panel.open {
  transform: translateX(0);
}

/* ── Panel Header ── */
.cart-panel-header {
  background: var(--cart-header-bg);
  color: var(--white);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.cart-panel-title {
  font-family: var(--font-heading);
  font-size: 1.2rem;
}

.cart-close-btn {
  background: none;
  border: none;
  color: var(--white);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.cart-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* ── Panel Body (scrollable) ── */
.cart-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Empty state */
.cart-empty {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--space-2xl) var(--space-md);
  font-size: 0.9rem;
}

/* ── Cart Section (Kits / Avulso) ── */
.cart-section-title {
  font-family: var(--font-heading);
  font-size: 1rem;
  color: var(--dark-brown);
  border-bottom: 2px solid var(--medium-brown);
  padding-bottom: var(--space-xs);
  margin-bottom: var(--space-sm);
}

/* ── Kit Row in Cart ── */
.cart-kit-item {
  background: var(--white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-bottom: var(--space-sm);
}

.cart-kit-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  gap: var(--space-sm);
}

.cart-kit-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--dark-brown);
  flex: 1;
}

.cart-kit-line {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.cart-kit-price {
  font-family: var(--font-heading);
  font-size: 1rem;
  color: var(--gold);
  font-weight: 700;
  white-space: nowrap;
}

/* Qty stepper inside cart */
.cart-qty-stepper {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 var(--space-md) var(--space-sm);
}

.cart-qty-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid var(--medium-brown);
  background: var(--white);
  color: var(--dark-brown);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  font-weight: 600;
}

.cart-qty-btn:hover {
  background: var(--light-tan);
}

.cart-qty-value {
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 20px;
  text-align: center;
}

.cart-remove-btn {
  background: none;
  border: none;
  color: #B71C1C;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  margin-left: auto;
  transition: background 0.15s;
}

.cart-remove-btn:hover {
  background: #FFEBEE;
}

/* Kit contents (collapsible list inside cart) */
.cart-kit-contents {
  background: var(--kit-content-bg);
  padding: var(--space-xs) var(--space-md);
  border-top: 1px solid var(--border-light);
}

.cart-kit-content-row {
  display: flex;
  align-items: baseline;
  font-size: 0.78rem;
  color: var(--text-secondary);
  padding: 3px 0;
  gap: 4px;
}

.cart-kit-content-row .tree-prefix {
  color: var(--medium-brown);
  font-family: monospace;
  flex-shrink: 0;
}

.cart-kit-content-row .product-name {
  flex: 1;
}

.cart-kit-content-row .product-volume {
  margin: 0 4px;
}

/* ── Avulso Item Row in Cart ── */
.cart-avulso-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-xs) var(--space-sm);
  background: var(--white);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--space-xs);
}

.cart-avulso-name {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--dark-brown);
  grid-column: 1;
}

.cart-avulso-price {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  color: var(--gold);
  font-weight: 700;
  text-align: right;
  grid-column: 2;
}

.cart-avulso-meta {
  grid-column: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.cart-avulso-controls {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.kit-source-badge {
  font-size: 0.65rem;
  background: var(--light-tan);
  color: var(--dark-brown);
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avulso-volume-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

/* ── Panel Footer (totals) ── */
.cart-panel-footer {
  flex-shrink: 0;
  border-top: 2px solid var(--border-light);
  padding: var(--space-md) var(--space-lg);
  background: var(--white);
}

.cart-totals {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--space-md);
}

.cart-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.cart-total-row.grand-total {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--dark-brown);
  font-family: var(--font-heading);
  margin-top: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--border-light);
}

.cart-total-value {
  font-family: var(--font-heading);
  font-weight: 600;
}

.cart-clear-btn {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1.5px solid var(--medium-brown);
  background: var(--white);
  color: var(--dark-brown);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.cart-clear-btn:hover {
  background: var(--light-tan);
}

/* ── Add-to-cart controls (on cards / avulso rows) ── */
.add-kit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--dark-brown);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.add-kit-btn:hover {
  background: var(--section-bg);
}

.kit-product-add-btn {
  background: none;
  border: 1px solid var(--medium-brown);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 0.9rem;
  line-height: 1;
  color: var(--dark-brown);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
  margin-left: auto;
}

.kit-product-add-btn:hover {
  background: var(--light-tan);
  border-color: var(--dark-brown);
}

/* Avulso row add controls */
.avulso-row-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.avulso-qty-input {
  width: 44px;
  padding: 3px 4px;
  border: 1.5px solid var(--medium-brown);
  border-radius: var(--radius-sm);
  text-align: center;
  font-family: var(--font-body);
  font-size: 0.82rem;
  color: var(--dark-brown);
}

.avulso-add-btn {
  background: var(--dark-brown);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.avulso-add-btn:hover {
  background: var(--section-bg);
}

@media (max-width: 768px) {
  .avulso-row {
    grid-template-columns: 1fr auto;
  }
}
```

- [ ] **Step 2.3 — Verify CSS file has no broken rules**

Run: `cd /home/viniciusrocha/projetos-pessoais/pedido-bomfim && npm run build 2>&1 | tail -5`

Expected: build succeeds (no errors).

- [ ] **Step 2.4 — Commit**

```bash
git add src/styles/variables.css src/styles/cart.css
git commit -m "feat: add cart design tokens and cart panel CSS"
```

---

## Task 3: Cart panel component (`src/components/cart-panel.js`)

**Files:**
- Create: `src/components/cart-panel.js`

- [ ] **Step 3.1 — Create the component**

```js
// src/components/cart-panel.js
import { getState, updateKitQty, removeKit, updateAvulsoQty, removeAvulso, clearCart, getTotals } from "../store/cart.js";
import { formatBRL } from "../utils/currency.js";

let panelEl, overlayEl, bodyEl, footerEl;

function buildKitItem(kit) {
  const subtotal = formatBRL(kit.kitPrice * kit.quantity);
  const contentRows = kit.products
    .map((p, i) => {
      const prefix = i === kit.products.length - 1 ? "└─" : "├─";
      return `
        <div class="cart-kit-content-row">
          <span class="tree-prefix">${prefix}</span>
          <span class="product-name">${p.name}</span>
          <span class="product-volume">${p.volume}</span>
          <span class="product-price">${formatBRL(p.price)}</span>
        </div>
      `;
    })
    .join("");

  const el = document.createElement("div");
  el.className = "cart-kit-item";
  el.innerHTML = `
    <div class="cart-kit-header">
      <div>
        <div class="cart-kit-name">${kit.kitName}</div>
        <div class="cart-kit-line">${kit.lineName}</div>
      </div>
      <div class="cart-kit-price">${subtotal}</div>
    </div>
    <div class="cart-qty-stepper">
      <button class="cart-qty-btn" data-action="dec-kit" data-id="${kit.id}">−</button>
      <span class="cart-qty-value">${kit.quantity}</span>
      <button class="cart-qty-btn" data-action="inc-kit" data-id="${kit.id}">+</button>
      <button class="cart-remove-btn" data-action="remove-kit" data-id="${kit.id}">Remover</button>
    </div>
    <div class="cart-kit-contents">${contentRows}</div>
  `;
  return el;
}

function buildAvulsoItem(item) {
  const subtotal = formatBRL(item.price * item.quantity);
  const el = document.createElement("div");
  el.className = "cart-avulso-item";
  el.innerHTML = `
    <span class="cart-avulso-name">${item.name}</span>
    <span class="cart-avulso-price">${subtotal}</span>
    <div class="cart-avulso-meta">
      <span class="avulso-volume-label">${item.volume}</span>
      <span class="kit-source-badge">do kit: ${item.fromKit}</span>
    </div>
    <div class="cart-avulso-controls">
      <button class="cart-qty-btn" data-action="dec-avulso" data-id="${item.id}">−</button>
      <span class="cart-qty-value">${item.quantity}</span>
      <button class="cart-qty-btn" data-action="inc-avulso" data-id="${item.id}">+</button>
      <button class="cart-remove-btn" data-action="remove-avulso" data-id="${item.id}">✕</button>
    </div>
  `;
  return el;
}

function renderBody() {
  const { kits, avulsoItems } = getState();
  bodyEl.innerHTML = "";

  if (kits.length === 0 && avulsoItems.length === 0) {
    bodyEl.innerHTML = `<p class="cart-empty">Seu carrinho está vazio.</p>`;
    return;
  }

  if (kits.length > 0) {
    const section = document.createElement("div");
    section.innerHTML = `<h3 class="cart-section-title">Kits (${kits.length})</h3>`;
    kits.forEach((k) => section.appendChild(buildKitItem(k)));
    bodyEl.appendChild(section);
  }

  if (avulsoItems.length > 0) {
    const section = document.createElement("div");
    section.innerHTML = `<h3 class="cart-section-title">Itens Avulsos (${avulsoItems.length})</h3>`;
    avulsoItems.forEach((i) => section.appendChild(buildAvulsoItem(i)));
    bodyEl.appendChild(section);
  }
}

function renderFooter() {
  const { kitsTotal, avulsoTotal, total, itemCount } = getTotals();
  footerEl.innerHTML = `
    <div class="cart-totals">
      <div class="cart-total-row">
        <span>Kits</span>
        <span class="cart-total-value">${formatBRL(kitsTotal)}</span>
      </div>
      <div class="cart-total-row">
        <span>Avulsos</span>
        <span class="cart-total-value">${formatBRL(avulsoTotal)}</span>
      </div>
      <div class="cart-total-row grand-total">
        <span>Total (${itemCount} itens)</span>
        <span class="cart-total-value">${formatBRL(total)}</span>
      </div>
    </div>
    <button class="cart-clear-btn">Limpar carrinho</button>
  `;
  footerEl.querySelector(".cart-clear-btn").addEventListener("click", () => {
    if (confirm("Limpar todo o carrinho?")) clearCart();
  });
}

function refresh() {
  renderBody();
  renderFooter();
}

// Event delegation for stepper buttons inside the panel
function handlePanelClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === "inc-kit") updateKitQty(id, (getState().kits.find((k) => k.id === id)?.quantity ?? 0) + 1);
  if (action === "dec-kit") updateKitQty(id, (getState().kits.find((k) => k.id === id)?.quantity ?? 1) - 1);
  if (action === "remove-kit") removeKit(id);
  if (action === "inc-avulso") updateAvulsoQty(id, (getState().avulsoItems.find((i) => i.id === id)?.quantity ?? 0) + 1);
  if (action === "dec-avulso") updateAvulsoQty(id, (getState().avulsoItems.find((i) => i.id === id)?.quantity ?? 1) - 1);
  if (action === "remove-avulso") removeAvulso(id);
}

export function openCart() {
  panelEl.classList.add("open");
  overlayEl.classList.add("open");
  document.body.style.overflow = "hidden";
}

export function closeCart() {
  panelEl.classList.remove("open");
  overlayEl.classList.remove("open");
  document.body.style.overflow = "";
}

export function createCartPanel() {
  overlayEl = document.createElement("div");
  overlayEl.className = "cart-overlay";
  overlayEl.addEventListener("click", closeCart);

  panelEl = document.createElement("aside");
  panelEl.className = "cart-panel";
  panelEl.setAttribute("aria-label", "Carrinho de compras");

  const header = document.createElement("div");
  header.className = "cart-panel-header";
  header.innerHTML = `
    <span class="cart-panel-title">Carrinho</span>
    <button class="cart-close-btn" aria-label="Fechar carrinho">×</button>
  `;
  header.querySelector(".cart-close-btn").addEventListener("click", closeCart);

  bodyEl = document.createElement("div");
  bodyEl.className = "cart-panel-body";

  footerEl = document.createElement("div");
  footerEl.className = "cart-panel-footer";

  panelEl.appendChild(header);
  panelEl.appendChild(bodyEl);
  panelEl.appendChild(footerEl);
  panelEl.addEventListener("click", handlePanelClick);

  window.addEventListener("cart:change", refresh);

  refresh();

  return { panel: panelEl, overlay: overlayEl };
}
```

- [ ] **Step 3.2 — Verify no syntax errors**

Run: `cd /home/viniciusrocha/projetos-pessoais/pedido-bomfim && npm run build 2>&1 | tail -10`

Expected: build succeeds.

- [ ] **Step 3.3 — Commit**

```bash
git add src/components/cart-panel.js
git commit -m "feat: add cart slide-out panel component"
```

---

## Task 4: Update `main.js` — mount cart panel

**Files:**
- Modify: `src/main.js`

- [ ] **Step 4.1 — Update `main.js`**

Replace the entire file with:
```js
import "./styles/variables.css";
import "./styles/reset.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/cart.css";

import { renderHeader, setupScrollSpy } from "./components/header.js";
import { renderCatalog } from "./components/catalog.js";
import { createCartPanel } from "./components/cart-panel.js";

const app = document.getElementById("app");
app.appendChild(renderHeader());
app.appendChild(renderCatalog());

const { panel, overlay } = createCartPanel();
app.appendChild(overlay);
app.appendChild(panel);

requestAnimationFrame(() => {
  setupScrollSpy();
});
```

- [ ] **Step 4.2 — Verify build**

Run: `cd /home/viniciusrocha/projetos-pessoais/pedido-bomfim && npm run build 2>&1 | tail -5`

Expected: succeeds.

- [ ] **Step 4.3 — Commit**

```bash
git add src/main.js
git commit -m "feat: mount cart panel and overlay in app bootstrap"
```

---

## Task 5: Update `header.js` — add cart button

**Files:**
- Modify: `src/components/header.js`

- [ ] **Step 5.1 — Import `openCart` and add cart button**

Replace the `renderHeader` function. The button must:
- Show cart icon (🛒) + "Carrinho" label + count badge
- Call `openCart()` on click
- Listen to `cart:change` to update the badge count

```js
import { catalog } from "../data/catalog.js";
import { openCart } from "./cart-panel.js";
import { getTotals } from "../store/cart.js";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function renderHeader() {
  const header = document.createElement("header");
  header.className = "site-header";

  const logoSrc = `${import.meta.env.BASE_URL}images/page7-img3.webp`;

  header.innerHTML = `
    <div class="header-top">
      <img src="${logoSrc}" alt="Distribuidora Bomfim" class="header-logo" />
      <div>
        <div class="header-title">Distribuidora Bomfim</div>
        <div class="header-subtitle">Catalog of professional hair care products</div>
      </div>
      <button class="cart-btn" id="open-cart-btn" aria-label="Abrir carrinho">
        🛒 Carrinho
        <span class="cart-btn-count" data-empty="true">0</span>
      </button>
    </div>
    <nav class="nav-chips" role="navigation" aria-label="Product lines">
      ${catalog
        .map(
          (line) =>
            `<button class="nav-chip" data-target="${slugify(line.line)}">${line.line}</button>`
        )
        .join("")}
    </nav>
  `;

  const cartBtn = header.querySelector("#open-cart-btn");
  const countBadge = header.querySelector(".cart-btn-count");

  cartBtn.addEventListener("click", openCart);

  window.addEventListener("cart:change", () => {
    const { itemCount } = getTotals();
    countBadge.textContent = itemCount;
    countBadge.dataset.empty = itemCount === 0 ? "true" : "false";
  });

  header.querySelectorAll(".nav-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const target = document.getElementById(chip.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  return header;
}

export function setupScrollSpy() {
  const sections = document.querySelectorAll(".line-section");
  const chips = document.querySelectorAll(".nav-chip");

  if (!sections.length || !chips.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          chips.forEach((c) => c.classList.remove("active"));
          const activeChip = document.querySelector(
            `.nav-chip[data-target="${entry.target.id}"]`
          );
          if (activeChip) {
            activeChip.classList.add("active");
            activeChip.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
          }
        }
      });
    },
    {
      rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue("--header-height")} 0px -60% 0px`,
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}
```

- [ ] **Step 5.2 — Verify build**

Run: `cd /home/viniciusrocha/projetos-pessoais/pedido-bomfim && npm run build 2>&1 | tail -5`

- [ ] **Step 5.3 — Commit**

```bash
git add src/components/header.js
git commit -m "feat: add cart button with live item count to header"
```

---

## Task 6: Update `kit-card.js` — add kit + individual product buttons

**Files:**
- Modify: `src/components/kit-card.js`

The kit card needs:
1. "Adicionar Kit" button at the bottom → calls `addKit()`
2. Per-product "+" button at the end of each product row → calls `addAvulso()` with `fromKit` set to the kit name

ID generation for avulso items from kits:
```
id = slugify(lineName) + "--" + slugify(kitName) + "--" + slugify(p.name) + "--" + slugify(p.volume)
```

- [ ] **Step 6.1 — Rewrite `kit-card.js`**

```js
// src/components/kit-card.js
import { formatBRL } from "../utils/currency.js";
import { addKit, addAvulso } from "../store/cart.js";

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function renderKitCard(kit, lineImage, lineName) {
  const card = document.createElement("div");
  card.className = "kit-card";

  const imgSrc = lineImage
    ? `${import.meta.env.BASE_URL}images/${lineImage}`
    : "";

  const typeClass = kit.type.toLowerCase().includes("home")
    ? "home-care"
    : "profissional";

  const hasSavings = kit.savings > 0;
  const savingsClass = hasSavings ? "has-savings" : "no-savings";
  const savingsText = hasSavings
    ? `↓ ${formatBRL(kit.savings)}`
    : "Same as individual";

  const kitId = slugify(kit.name);

  const productRows = kit.products
    .map((p, i) => {
      const isLast = i === kit.products.length - 1;
      const prefix = isLast ? "└─" : "├─";
      const avulsoId = `${slugify(lineName)}--${slugify(kit.name)}--${slugify(p.name)}--${slugify(p.volume)}`;
      return `
        <div class="kit-product-row">
          <span class="tree-prefix">${prefix}</span>
          <span class="product-name">${p.name}</span>
          <span class="product-volume">${p.volume}</span>
          <span class="product-price">${formatBRL(p.price)}</span>
          <button
            class="kit-product-add-btn"
            title="Adicionar ${p.name} avulso ao carrinho"
            data-avulso-id="${avulsoId}"
            data-name="${p.name}"
            data-volume="${p.volume}"
            data-price="${p.price}"
            data-from-kit="${kit.name}"
            data-line="${lineName}"
          >+</button>
        </div>
      `;
    })
    .join("");

  card.innerHTML = `
    ${imgSrc ? `<img class="kit-card-image" src="${imgSrc}" alt="${kit.name}" loading="lazy" />` : ""}
    <div class="kit-card-body">
      <h3 class="kit-card-name">${kit.name}</h3>
      <span class="kit-type-badge ${typeClass}">${kit.type}</span>
      <div class="kit-pricing">
        <div>
          <div class="kit-price-label">Kit Price</div>
          <div class="kit-price">${formatBRL(kit.kitPrice)}</div>
        </div>
        <span class="savings-badge ${savingsClass}">${savingsText}</span>
      </div>
      <div class="kit-products">
        ${productRows}
      </div>
      <button class="add-kit-btn" data-kit-id="${kitId}">
        🛒 Adicionar Kit
      </button>
    </div>
  `;

  // Add kit to cart
  card.querySelector(".add-kit-btn").addEventListener("click", () => {
    addKit({
      id: kitId,
      kitName: kit.name,
      lineName,
      kitPrice: kit.kitPrice,
      products: kit.products,
    });
  });

  // Add individual product to cart (event delegation on kit-products)
  card.querySelector(".kit-products").addEventListener("click", (e) => {
    const btn = e.target.closest(".kit-product-add-btn");
    if (!btn) return;
    addAvulso({
      id: btn.dataset.avulsoId,
      name: btn.dataset.name,
      volume: btn.dataset.volume,
      price: parseFloat(btn.dataset.price),
      fromKit: btn.dataset.fromKit,
      lineName: btn.dataset.line,
      quantity: 1,
    });
  });

  return card;
}
```

- [ ] **Step 6.2 — Update the call-site in `line-section.js`**

The `renderKitCard` signature now requires `lineName` as third argument. In [line-section.js:47](src/components/line-section.js#L47), change:
```js
grid.appendChild(renderKitCard(kit, lineData.image));
```
to:
```js
grid.appendChild(renderKitCard(kit, lineData.image, lineData.line));
```

- [ ] **Step 6.3 — Verify build**

Run: `cd /home/viniciusrocha/projetos-pessoais/pedido-bomfim && npm run build 2>&1 | tail -5`

- [ ] **Step 6.4 — Commit**

```bash
git add src/components/kit-card.js src/components/line-section.js
git commit -m "feat: add kit and per-product cart buttons to kit cards"
```

---

## Task 7: Update `line-section.js` — add qty + add button to avulso rows

**Files:**
- Modify: `src/components/line-section.js`

Avulso rows need a qty number input and "Adicionar" button. The avulso item `id` for cart purposes is:
```
id = slugify(lineName) + "--avulso--" + slugify(p.name) + "--" + slugify(p.volume)
```

- [ ] **Step 7.1 — Update `line-section.js`**

Add import of `addAvulso` at the top and rewrite the avulso row render to include controls.

Replace the full file content:
```js
import { renderKitCard } from "./kit-card.js";
import { formatBRL } from "../utils/currency.js";
import { addAvulso } from "../store/cart.js";

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function renderLineSection(lineData) {
  const section = document.createElement("section");
  section.className = "line-section";
  section.id = slugify(lineData.line);

  const totalProducts =
    lineData.kits.reduce((sum, k) => sum + k.products.length, 0) +
    lineData.avulsoProducts.length;

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <h2>${lineData.line}</h2>
    <span class="product-count">${totalProducts} products</span>
  `;
  section.appendChild(header);

  if (lineData.image && lineData.kits.length === 0) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "line-image-container";
    imgContainer.innerHTML = `
      <img class="line-image" src="${import.meta.env.BASE_URL}images/${lineData.image}"
           alt="${lineData.line}" loading="lazy" />
    `;
    section.appendChild(imgContainer);
  }

  if (lineData.kits.length > 0) {
    const grid = document.createElement("div");
    grid.className = "kit-grid";
    lineData.kits.forEach((kit) => {
      grid.appendChild(renderKitCard(kit, lineData.image, lineData.line));
    });
    section.appendChild(grid);
  }

  if (lineData.avulsoProducts.length > 0) {
    const avulsoSection = document.createElement("div");
    avulsoSection.className = "avulso-section";

    const groups = {};
    lineData.avulsoProducts.forEach((p) => {
      const key = p.sub || "Products";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    Object.entries(groups).forEach(([subName, products]) => {
      const subHeader = document.createElement("h4");
      subHeader.className = "avulso-sub-header";
      subHeader.textContent = subName;
      avulsoSection.appendChild(subHeader);

      const table = document.createElement("div");
      table.className = "avulso-table";

      products.forEach((p) => {
        const itemId = `${slugify(lineData.line)}--avulso--${slugify(p.name)}--${slugify(p.volume)}`;
        const row = document.createElement("div");
        row.className = "avulso-row";
        row.innerHTML = `
          <span class="product-name">${p.name}</span>
          <span class="product-volume">${p.volume}</span>
          <span class="product-price">${formatBRL(p.price)}</span>
          <div class="avulso-row-controls">
            <input
              class="avulso-qty-input"
              type="number"
              min="1"
              max="99"
              value="1"
              aria-label="Quantidade de ${p.name}"
            />
            <button
              class="avulso-add-btn"
              data-item-id="${itemId}"
              data-name="${p.name}"
              data-volume="${p.volume}"
              data-price="${p.price}"
            >+ Adicionar</button>
          </div>
        `;

        row.querySelector(".avulso-add-btn").addEventListener("click", (e) => {
          const btn = e.currentTarget;
          const qty = parseInt(row.querySelector(".avulso-qty-input").value, 10) || 1;
          addAvulso({
            id: btn.dataset.itemId,
            name: btn.dataset.name,
            volume: btn.dataset.volume,
            price: parseFloat(btn.dataset.price),
            fromKit: "Avulso",
            lineName: lineData.line,
            quantity: qty,
          });
        });

        table.appendChild(row);
      });

      avulsoSection.appendChild(table);
    });

    section.appendChild(avulsoSection);
  }

  return section;
}
```

- [ ] **Step 7.2 — Update `.avulso-row` grid in CSS**

The avulso row now has 4 columns (name, volume, price, controls). In [components.css:272](src/styles/components.css#L272), change:
```css
grid-template-columns: 1fr auto auto;
```
to:
```css
grid-template-columns: 1fr auto auto auto;
```

- [ ] **Step 7.3 — Verify build**

Run: `cd /home/viniciusrocha/projetos-pessoais/pedido-bomfim && npm run build 2>&1 | tail -5`

- [ ] **Step 7.4 — Commit**

```bash
git add src/components/line-section.js src/styles/components.css
git commit -m "feat: add qty input and add-to-cart button to avulso product rows"
```

---

## Task 8: Final verification + deploy

- [ ] **Step 8.1 — Run full build**

```bash
cd /home/viniciusrocha/projetos-pessoais/pedido-bomfim && npm run build
```

Expected: `✓ built in Xms`, no errors.

- [ ] **Step 8.2 — Push to GitHub → trigger deploy**

```bash
git push origin main
```

- [ ] **Step 8.3 — Watch workflow**

```bash
gh run list --repo vsanrocha/pedido-bomfim --limit 1
gh run watch --repo vsanrocha/pedido-bomfim $(gh run list --repo vsanrocha/pedido-bomfim --json databaseId --jq '.[0].databaseId')
```

Expected: all steps green, URL returned is `https://vsanrocha.github.io/pedido-bomfim/`

- [ ] **Step 8.4 — Smoke-check checklist (manual or Playwright)**

Open `https://vsanrocha.github.io/pedido-bomfim/` and verify:
- [ ] Cart button visible in header, count badge hidden when empty
- [ ] Clicking "Adicionar Kit" adds kit, badge shows "1"
- [ ] Cart panel opens with kit section, kit products listed (tree style)
- [ ] Clicking "+" on a product row inside kit card adds avulso item with "do kit: <name>" badge
- [ ] Avulso rows show qty input + "Adicionar" button
- [ ] Setting qty to 3 and clicking "Adicionar" shows qty=3 in cart
- [ ] Kit stepper (+ / −) in cart panel updates count and price
- [ ] Grand total updates correctly
- [ ] "Limpar carrinho" clears everything after confirm
- [ ] Panel closes on overlay click
- [ ] Responsive: panel uses full width on mobile

---

## Notes for executor

- The `slugify` function is currently duplicated in `header.js`, `line-section.js`, and will be added to `kit-card.js`. This is intentional — do NOT extract to a utility (YAGNI) unless the user asks for it.
- There is no persistence (localStorage) — cart resets on page reload. This is intentional per the scope.
- The `fromKit` field for avulso-only products (not from any kit) is set to `"Avulso"`. Items added from kit product rows use the actual kit name.
