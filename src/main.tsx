import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./app/i18n.ts";
import { initTheme, initColorAccent } from "./app/theme.ts";
import { AppRouter } from "./app/router.tsx";

initTheme();
initColorAccent();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
