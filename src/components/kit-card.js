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

  // Add full kit to cart
  card.querySelector(".add-kit-btn").addEventListener("click", () => {
    addKit({
      id: kitId,
      kitName: kit.name,
      lineName,
      kitPrice: kit.kitPrice,
      products: kit.products,
    });
  });

  // Add individual product to cart (event delegation)
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
