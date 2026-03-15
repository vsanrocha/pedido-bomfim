import {
  getState,
  updateKitQty,
  removeKit,
  updateAvulsoQty,
  removeAvulso,
  clearCart,
  getTotals,
} from "../store/cart.js";
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
        <span>Total (${itemCount} ${itemCount === 1 ? "item" : "itens"})</span>
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

// Single event listener via delegation — avoids memory leaks on re-render
function handlePanelClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  const { kits, avulsoItems } = getState();

  if (action === "inc-kit") {
    updateKitQty(id, (kits.find((k) => k.id === id)?.quantity ?? 0) + 1);
  } else if (action === "dec-kit") {
    updateKitQty(id, (kits.find((k) => k.id === id)?.quantity ?? 1) - 1);
  } else if (action === "remove-kit") {
    removeKit(id);
  } else if (action === "inc-avulso") {
    updateAvulsoQty(id, (avulsoItems.find((i) => i.id === id)?.quantity ?? 0) + 1);
  } else if (action === "dec-avulso") {
    updateAvulsoQty(id, (avulsoItems.find((i) => i.id === id)?.quantity ?? 1) - 1);
  } else if (action === "remove-avulso") {
    removeAvulso(id);
  }
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
