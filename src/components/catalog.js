import { catalog } from "../data/catalog.js";
import { renderLineSection } from "./line-section.js";

export function renderCatalog() {
  const container = document.createElement("main");
  container.className = "catalog-container";

  catalog.forEach((lineData) => {
    container.appendChild(renderLineSection(lineData));
  });

  // Footer
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  const logoSrc = `${import.meta.env.BASE_URL}images/page7-img3.webp`;
  footer.innerHTML = `
    <img src="${logoSrc}" alt="Distribuidora Bomfim" class="footer-logo" />
    <p>Distribuidora Bomfim &mdash; Professional hair care products</p>
    <p>Catalog for reference only. Prices may vary.</p>
  `;
  container.appendChild(footer);

  return container;
}
