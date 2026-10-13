import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initTheme } from "./utils/theme";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

initTheme();

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
