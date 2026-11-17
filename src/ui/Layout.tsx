import { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { markNavigated, scrollToAnchor } from "@/lib/navigation";
import Floating from "./Floating";
import Footer from "./Footer";
import TopBar from "./TopBar";

function PageLoading() {
  const { t } = useTranslation();
  return (
    <p className="page-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {t("ui.loading")}
    </p>
  );
}

export default function Layout() {
  const { t } = useTranslation();
  const { pathname, hash } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    document.documentElement.dataset.ui = "v2";
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (hash) scrollToAnchor(hash.slice(1));
      return;
    }
    markNavigated();
    if (hash) scrollToAnchor(hash.slice(1));
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          // A real anchor would be read as a route by the hash router.
          event.preventDefault();
          mainRef.current?.focus();
          mainRef.current?.scrollIntoView();
        }}
      >
        {t("ui.skipToContent")}
      </a>
      <TopBar />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Suspense fallback={<PageLoading />}>
          <div className="page" key={pathname}>
            <Outlet />
          </div>
        </Suspense>
        <Floating />
      </main>
      <Footer />
    </>
  );
}
