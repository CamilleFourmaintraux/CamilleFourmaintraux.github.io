import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import Navigator from "./Navigator.tsx";
import Header from "./parts/Header.tsx";
import Footer from "./parts/Footer.tsx";
import ResetScroll from "./parts/nav/ResetScroll.ts";
import Main from "./Main.tsx";
import VisitTracker from "./parts/visitor/VisitTracker.tsx";
import "../i18n";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <ResetScroll />
      <VisitTracker />
      <Header />
      <Main />
      <Navigator />
      <Footer />
    </HashRouter>
  </StrictMode>,
);
