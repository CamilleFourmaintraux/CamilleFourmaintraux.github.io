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
  (sections, lists, links, pictures). One component renders them all.
- **Texts.** Everything visible comes from `src/locales/*.json`. Interface texts added for the
  current design are under the `ui` key.
- **Colors.** The tokens live at the top of `src/styles/base.css`. Run `npm run check:a11y` after
  changing one.

## Accessibility

The current design targets WCAG 2.2 AA: skip link, landmarks, one `h1` per page, focus moved to the
page title after each navigation, visible focus, keyboard-operable menus and dialogs, labelled form
errors, reduced motion support, and contrast checked for both themes.

## Back-end

The site talks to a separate Node.js server (contact form, chatbot, Steam data, visit summary).
Its address comes from `VITE_BACKEND_URL` and defaults to the production server (`src/lib/utils.ts`).
