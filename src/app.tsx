import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Navigator from "./Navigator.tsx";
import Header from "./parts/Header.tsx";
import Footer from "./parts/Footer.tsx";
import ScrollToTop from "./parts/nav/ResetScroll.ts";
import Main from "./Main.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <Main />
      <Navigator />
      <Footer />
    </BrowserRouter>
  </StrictMode>
);
