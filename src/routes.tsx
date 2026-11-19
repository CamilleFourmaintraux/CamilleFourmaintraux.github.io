import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { Route, Routes } from "react-router-dom";
import { LEGACY_HOME, LEGACY_SUFFIX } from "./lib/paths";
import Layout from "./ui/Layout";

type Page = LazyExoticComponent<ComponentType>;

type PageRoute = {
  /** Every address of the page. The first one is the main address. */
  paths: string[];
  /** Current design. */
  page: Page;
  /** Previous design, served on the same addresses followed by "-old". */
  legacy: Page;
};

// Each page is a separate chunk, downloaded when it is first visited.
const ROUTES: PageRoute[] = [
  {
    paths: [
      "",
      "index",
      "home",
      "welcome",
      "reception",
      "bienvenue",
      "accueil",
    ],
    page: lazy(() => import("./pages/Home")),
    legacy: lazy(() => import("./legacy/pages/Introduction")),
  },
  {
    paths: ["cursus", "cursus/stage", "parcours", "courses", "curriculum"],
    page: lazy(() => import("./pages/cursus/Cursus")),
    legacy: lazy(() => import("./legacy/pages/cursus/Curriculum")),
  },
  {
    paths: ["portfolio", "saes", "projets", "projects"],
    page: lazy(() => import("./pages/projects/Work")),
    legacy: lazy(() => import("./legacy/pages/portfolio/work/Work")),
  },
  {
    paths: ["passions", "loisirs", "hobbies"],
    page: lazy(() => import("./pages/projects/Passions")),
    legacy: lazy(() => import("./legacy/pages/portfolio/passion/Passions")),
  },
  {
    paths: ["contact", "mail", "email"],
    page: lazy(() => import("./pages/Contact")),
    legacy: lazy(() => import("./legacy/pages/contact/Contact")),
  },
  {
    paths: ["documents", "files", "fichiers"],
    page: lazy(() => import("./pages/Documents")),
    legacy: lazy(() => import("./legacy/pages/Documents")),
  },
  {
    paths: ["chatbot"],
    page: lazy(() => import("./pages/chatbot/Chatbot")),
    legacy: lazy(() => import("./legacy/pages/Chatbot")),
  },
  {
    paths: ["steam"],
    page: lazy(() => import("./pages/steam/Steam")),
    legacy: lazy(() => import("./legacy/pages/steam/SteamPage")),
  },
  {
    paths: ["privacy", "confidentialite"],
    page: lazy(() => import("./pages/Privacy")),
    legacy: lazy(() => import("./legacy/pages/Privacy")),
  },
  {
    paths: ["matrix"],
    page: lazy(() => import("./pages/games/Matrix")),
    legacy: lazy(() => import("./legacy/pages/games/matrix/DemoMatrix")),
  },
  {
    paths: ["pong", "pingpong"],
    page: lazy(() => import("./pages/games/Pong")),
    legacy: lazy(() => import("./legacy/pages/games/pong/DemoPong")),
  },
  {
    paths: ["python"],
    page: lazy(() => import("./pages/games/Python")),
    legacy: lazy(() => import("./legacy/pages/games/prog/Python")),
  },
  {
    paths: ["pacman"],
    page: lazy(() => import("./pages/games/PacMan")),
    legacy: lazy(() => import("./legacy/pages/games/pacman/PacMan")),
  },
  {
    paths: ["minecraft"],
    page: lazy(() => import("./pages/games/Minicraft")),
    legacy: lazy(() => import("./legacy/pages/games/minecraft/minicraft")),
  },
  {
    paths: ["test"],
    page: lazy(() => import("./pages/Test")),
    legacy: lazy(() => import("./legacy/pages/Test")),
  },
];

// Hidden page: full screen, without the site layout or an "-old" twin.
const Miku = lazy(() => import("./pages/miku/Miku"));
// Pages added with the current design: they have no "-old" version.
const NEW_PAGES: { paths: string[]; page: Page }[] = [
  {
    paths: ["cv-generator", "generateur-cv", "cv"],
    page: lazy(() => import("./pages/cv/CvGenerator")),
  },
  {
    paths: ["qr-code-generator", "generateur-qr-code", "qr-code", "qr"],
    page: lazy(() => import("./pages/qr/QrGenerator")),
  },
  {
    paths: ["background-remover", "retirer-le-fond", "detourage"],
    page: lazy(() => import("./pages/bg/BackgroundRemover")),
  },
];

const NotFound = lazy(() => import("./pages/NotFound"));
const LegacyNotFound = lazy(() => import("./legacy/pages/Redirection"));
const LegacyLayout = lazy(() => import("./legacy/LegacyLayout"));

const legacyAddress = (path: string) =>
  path === "" ? LEGACY_HOME : `/${path}${LEGACY_SUFFIX}`;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/miku" element={<Miku />} />

      <Route element={<Layout />}>
        {ROUTES.flatMap(({ paths, page: Page }) =>
          paths.map((path) => (
            <Route key={path} path={`/${path}`} element={<Page />} />
          )),
        )}
        {NEW_PAGES.flatMap(({ paths, page: Page }) =>
          paths.map((path) => (
            <Route key={path} path={`/${path}`} element={<Page />} />
          )),
        )}
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<LegacyLayout />}>
        {ROUTES.flatMap(({ paths, legacy: Legacy }) =>
          paths.map((path) => (
            <Route key={path} path={legacyAddress(path)} element={<Legacy />} />
          )),
        )}
        <Route
          path={legacyAddress("redirection")}
          element={<LegacyNotFound />}
        />
      </Route>
    </Routes>
  );
}
