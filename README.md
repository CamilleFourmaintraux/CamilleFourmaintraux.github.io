# Portfolio

Personal portfolio of Camille Fourmaintraux, built with React, TypeScript and Vite and hosted on
GitHub Pages: <https://camillefourmaintraux.github.io/>

## Commands

| Command              | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `npm run dev`        | Development server                                              |
| `npm run build`      | Type check, then production build in `dist/`                    |
| `npm run preview`    | Serves the production build locally                             |
| `npm run lint`       | ESLint                                                          |
| `npm run media`      | Regenerates the optimized pictures and clips (needs `ffmpeg`)   |
| `npm run check:a11y` | Checks the color pairs of the design tokens against WCAG 2.2 AA |
| `npm run deploy`     | Builds and publishes `dist/` to the `gh-pages` branch           |

## Two designs, one site

The current design answers on the usual addresses (`#/home`, `#/cursus`, `#/portfolio`...). The
previous design is kept and answers on the same addresses followed by `-old` (`#/cursus-old`,
`#/portfolio-old`...). Its home page is `#/old`.

- `src/routes.tsx` lists every page once, with its current and its previous component. Adding an
  address there creates both routes.
- `src/legacy/` holds the previous design untouched. Its stylesheets (`public/css`), Google Fonts
  and Font Awesome are only requested on the `-old` routes, by `src/legacy/LegacyLayout.tsx`.
- Every rule of the current design is nested under `:root[data-ui="v2"]`, so the two designs never
  affect each other. `index.html` sets `data-ui`, the theme and the language before the first paint.

## Project layout

```
index.html            Entry page: meta tags and the pre-paint script
scripts/              Media optimization and contrast check
public/img            Original pictures (still used by the previous design)
public/media          Generated WebP pictures and MP4 clips (npm run media)
src/app.tsx           Entry point
src/routes.tsx        Route table (current and previous design)
src/i18n.ts           Translations: French is bundled, English is loaded on demand
src/locales/          Texts in French and English
src/lib/              Logic shared by both designs (API, chatbot, Steam, visit context, maths)
src/ui/               Components of the current design (layout, icons, media, dialog, maze)
src/pages/            Pages of the current design
src/styles/           Stylesheets of the current design
src/legacy/           Previous design
```

## Working on the current design

- **Pictures.** Add the original file to `public/img`, run `npm run media`, then display it with
  `<Picture src="portfolio/file.png" alt="..." />` or `<Figure>`. Sizes are read from
  `src/data/media.json`, so the page never shifts while pictures load. GIFs become small MP4 clips
  that only play on screen, can be paused and respect the reduced motion setting.
- **Icons.** `<Icon icon={faHouse} />` draws an inline SVG from the Font Awesome path data. No icon
  font is downloaded.
- **Projects.** `src/pages/projects/workData.ts` and `passionData.ts` describe each project as data
  (sections, lists, links, pictures, videos). One component renders them all.
- **Texts.** Everything visible comes from `src/locales/*.json`. Interface texts added for the
  current design are under the `ui` key.
- **Colors.** The tokens live at the top of `src/styles/base.css`. Run `npm run check:a11y` after
  changing one.
- **CV generator.** `#/cv-generator` builds a one-page CV from a form. The code lives in
  `src/pages/cv/`. `model.ts` describes the CV as data, `presets.ts` holds the starting points,
  `latex.ts` writes the LaTeX file and `Preview.tsx` draws the on-screen preview. The preview uses
  Carlito with the LaTeX spacing, so check both after changing one of them. Exports never leave the
  browser, except the "Open in Overleaf" button, which posts the zip to Overleaf.
- **QR code generator.** `#/qr-code-generator` lives in `src/pages/qr/`. `qr.ts` encodes the
  content, builds the matrix with `qrcode-generator` and draws the SVG. After each change the page
  reads the picture back with jsQR (loaded on demand) to warn about styles that stop it from
  scanning. A link is an address plus a list of query parameters: a pasted link gives its own
  parameters to the list, and a `src` value can get `_qr-code` to tell scans from clicks. The form
  styles shared with the CV generator are in `src/pages/cv/form.css`.
- **Pong.** `#/pong` lives in `src/pages/games/Pong.tsx`, with its rules in
  `src/pages/games/pong/engine.ts` (no drawing, so tests can simulate whole matches) and the online
  mode in `pong/online.ts`. Online games run on the back end, which uses a copy of the same engine:
  after changing `engine.ts`, regenerate `pong/engine.js` in the back end with
  `npx esbuild src/pages/games/pong/engine.ts --format=esm --platform=neutral --outfile=engine.js`.
- **Background remover.** `#/background-remover` lives in `src/pages/bg/`. Everything runs in the
  browser, in a Web Worker (`worker.ts`). The AI models run with `onnxruntime-web` (WebGPU when the
  browser has it, WebAssembly otherwise). Their files are listed in `models.ts`, downloaded from
  Hugging Face at pinned revisions on first use, and kept in the Cache Storage. To add or swap a
  model, add an entry there with its repository, commit, file per backend, input size and
  normalization. `mask.ts` holds the pixel work, including the plain background method, which needs
  no model. `onnxruntime-web` and its `.wasm` file load only when an AI model runs.
- **Text adventure.** `#/text-adventure` lives in `src/pages/games/TextAdventure.tsx`, with the
  engine in `src/pages/games/text/engine/` and the story in `text/content/`. The engine knows
  nothing about React or about the story: places, objects and texts are data. Every entity has
  components (physical, container, burn...) and one position, which together form a tree. Every
  command goes through `game.ts` (parse, risk check, verb, events, journal), and time only moves
  through `advance` in `core.ts`. Messages are stored as keys, so the journal can be shown again in
  the other language. Saves keep only what differs from the starting world.
  People and fights live in `body.ts` (wounds, bleeding, fainting), `combat.ts` (reach, aim,
  protection, severity), `npc.ts` (minds, roles, encounters, social verbs) and `actions.ts` (the
  verbs about bodies and people). Rask and the tanner are data in `content/scene.ts`: a new
  character is a template with a `mind` (role, traits, topics) and an entry in `schedule` if they
  arrive later. Hunger, thirst, sleep and breath are in `needs.ts`: they are computed from the time
  elapsed, like bleeding, and only the moments worth a message are scheduled. Words the parser
  does not take as commands (moods, questions, "quit", impossible feats) are lists in the language
  files, and a question goes to the person present when there is one. To play in a terminal
  without the browser, run `npm run play:text` (add `-- en` for English), or pipe commands into
  it. The full design is in the "Jeu textuel médiéval fantastique" document.

## Accessibility

The current design targets WCAG 2.2 AA: skip link, landmarks, one `h1` per page, focus moved to the
page title after each navigation, visible focus, keyboard-operable menus and dialogs, labelled form
errors, reduced motion support, and contrast checked for both themes.

## Back-end

The site talks to a separate Node.js server (contact form, chatbot, Steam data, visit summary).
Its address comes from `VITE_BACKEND_URL` and defaults to the production server (`src/lib/utils.ts`).
