import { formatBRL } from "../utils/currency.js";

export function renderKitCard(kit, lineImage) {
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

  const productRows = kit.products
    .map((p, i) => {
      const isLast = i === kit.products.length - 1;
      const prefix = isLast ? "└─" : "├─";
      return `
        <div class="kit-product-row">
          <span class="tree-prefix">${prefix}</span>
          <span class="product-name">${p.name}</span>
          <span class="product-volume">${p.volume}</span>
          <span class="product-price">${formatBRL(p.price)}</span>
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
    </div>
  `;

  return card;
}
