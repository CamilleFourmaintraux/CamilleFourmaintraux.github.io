import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { currentPath } from "@/lib/paths";
import Header from "./parts/Header";
import Footer from "./parts/Footer";
import Main from "./Main";

// The previous design keeps its own stylesheets, fonts and icon font. They
// are only requested here, so the current pages never pay for them.
const STYLESHEETS = [
  "/css/all.css",
  "https://fonts.googleapis.com/css2?family=Oswald&family=Roboto:wght@400;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
];

function useLegacyStyles(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.ui = "legacy";
    const links = STYLESHEETS.map((href, index) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      if (index === 0) {
        link.onload = () => setReady(true);
        link.onerror = () => setReady(true);
      }
      document.head.appendChild(link);
      return link;
    });
    return () => {
      links.forEach((link) => link.remove());
      root.dataset.ui = "v2";
    };
  }, []);
  return ready;
}

const noticeStyle = {
  margin: 0,
  padding: "8px 12px",
  textAlign: "center",
  background: "#fff4c2",
  color: "#1c1c1c",
  fontSize: "0.95rem",
} as const;

export default function LegacyLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const ready = useLegacyStyles();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    document.title = `Camille Fourmaintraux (${t("ui.oldVersionShort")})`;
  }, [t]);

  // Rendering waits for the stylesheet to avoid a flash of unstyled content.
  if (!ready) return null;

  return (
    <>
      <p style={noticeStyle}>
        {t("ui.oldVersionNotice")}{" "}
        <Link to={currentPath(pathname)} style={{ color: "#0b3d91" }}>
          {t("ui.backToCurrent")}
        </Link>
      </p>
      <Header />
      {/* Main renders the navigation menu, which holds the page itself. */}
      <Main />
      <Footer />
    </>
  );
}
