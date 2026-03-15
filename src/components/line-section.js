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

  // Section header
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <h2>${lineData.line}</h2>
    <span class="product-count">${totalProducts} products</span>
  `;
  section.appendChild(header);

  // Line image (for lines without kits)
  if (lineData.image && lineData.kits.length === 0) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "line-image-container";
    imgContainer.innerHTML = `
      <img class="line-image" src="${import.meta.env.BASE_URL}images/${lineData.image}"
           alt="${lineData.line}" loading="lazy" />
    `;
    section.appendChild(imgContainer);
  }

  // Kit cards grid
  if (lineData.kits.length > 0) {
    const grid = document.createElement("div");
    grid.className = "kit-grid";
    lineData.kits.forEach((kit) => {
      grid.appendChild(renderKitCard(kit, lineData.image, lineData.line));
    });
    section.appendChild(grid);
  }

  // Avulso products
  if (lineData.avulsoProducts.length > 0) {
    const avulsoSection = document.createElement("div");
    avulsoSection.className = "avulso-section";

    // Group by sub-line
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
          const qty = Math.max(1, parseInt(row.querySelector(".avulso-qty-input").value, 10) || 1);
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
