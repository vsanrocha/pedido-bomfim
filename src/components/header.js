import { catalog } from "../data/catalog.js";

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

  // Chip click → scroll to section
  header.querySelectorAll(".nav-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const target = document.getElementById(chip.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
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
            // Scroll chip into view in nav bar
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
