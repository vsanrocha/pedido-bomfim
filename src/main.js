import "./styles/variables.css";
import "./styles/reset.css";
import "./styles/layout.css";
import "./styles/components.css";

import { renderHeader, setupScrollSpy } from "./components/header.js";
import { renderCatalog } from "./components/catalog.js";

const app = document.getElementById("app");
app.appendChild(renderHeader());
app.appendChild(renderCatalog());

// Setup scroll-spy after DOM is fully rendered
requestAnimationFrame(() => {
  setupScrollSpy();
});
