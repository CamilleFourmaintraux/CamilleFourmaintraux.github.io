import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./i18n";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/pages.css";
import AppRoutes from "./routes";
import VisitTracker from "./lib/visitor/VisitTracker";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <VisitTracker />
      {/* Covers the lazy chunks of the previous design and the English texts. */}
      <Suspense fallback={null}>
        <AppRoutes />
      </Suspense>
    </HashRouter>
  </StrictMode>,
);
