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
