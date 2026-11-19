import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  faCode,
  faDownload,
  faFileArrowUp,
  faFileCode,
  faFileLines,
  faFloppyDisk,
  faPrint,
  faTriangleExclamation,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { normalizeLanguage } from "@/i18n";
import Dialog from "@/ui/Dialog";
import Icon from "@/ui/Icon";
import Page from "@/ui/Page";
import { contrast, isHexColor, MIN_CONTRAST, sidebarTextColor } from "./colors";
import { Choice, Field } from "./controls";
import { announce, focusMoved, focusSoon } from "./listActions";
import { download, fileBase, openInOverleaf, zip, type ZipFile } from "./files";
import { PHOTO_FILE, toLatex, unsupportedCharacters } from "./latex";
import {
  SIDEBAR_WIDTH,
  newSection,
  type Column,
  type CvDocument,
  type Section,
  type SectionKind,
} from "./model";
import { cropPhoto, dataUrlToBytes, readPicture } from "./photo";
import {
  PORTRAIT_FRAMING,
  PORTRAIT_URL,
  PRESETS,
  createPreset,
  presetHasPortrait,
  type PresetKey,
} from "./presets";
import Preview from "./Preview";
import SectionEditor, { type SectionActions } from "./SectionEditor";
import "./cv.css";

const STORAGE_KEY = "cv-generator";
const SAVE_DELAY = 600;
// A4 at the 96 dpi of CSS pixels.
const PAGE_WIDTH = (210 / 25.4) * 96;
const PAGE_HEIGHT = (297 / 25.4) * 96;
const KINDS: SectionKind[] = [
  "text",
  "entries",
  "skills",
  "list",
  "contact",
  "portfolio",
];

function isDocument(value: unknown): value is CvDocument {
  const doc = value as CvDocument;
  return (
    typeof doc === "object" &&
    doc !== null &&
    doc.version === 1 &&
    typeof doc.name === "string" &&
    typeof doc.layout === "object" &&
    Array.isArray(doc.sections) &&
    doc.sections.every(
      (section) =>
        KINDS.includes(section?.kind) && typeof section.id === "string",
    )
  );
}

function readDraft(): CvDocument | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function withPortrait(cv: CvDocument): Promise<CvDocument> {
  try {
    return {
      ...cv,
      photo: { source: await readPicture(PORTRAIT_URL), ...PORTRAIT_FRAMING },
    };
  } catch {
    return cv;
  }
}

/** Measures the preview, scales it to its column and tells when it overflows A4. */
function usePreviewSize() {
  const stageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(PAGE_HEIGHT);
  useEffect(() => {
    const stage = stageRef.current;
    const paper = paperRef.current;
    if (!stage || !paper) return;
    const observer = new ResizeObserver(() => {
      setScale(Math.min(1, stage.clientWidth / PAGE_WIDTH));
      setHeight(paper.offsetHeight);
    });
    observer.observe(stage);
    observer.observe(paper);
    return () => observer.disconnect();
  }, []);
  return {
    stageRef,
    paperRef,
    scale,
    height,
    overflow: height > PAGE_HEIGHT + 2,
  };
}

export default function CvGenerator() {
  const { t, i18n } = useTranslation();
  const uiLanguage = normalizeLanguage(i18n.language);
  const [cv, setCv] = useState<CvDocument>(
    () => readDraft() ?? createPreset("generic-fr", "fr"),
  );
  const [photo, setPhoto] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetKey>("generic-fr");
  const [confirmPreset, setConfirmPreset] = useState(false);
  const [removing, setRemoving] = useState<Section | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<SectionKind>("text");
  const [newColumn, setNewColumn] = useState<Column>("main");
  const [showCode, setShowCode] = useState(false);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [importError, setImportError] = useState(false);
  const [printing, setPrinting] = useState(false);
  const preview = usePreviewSize();
  const importRef = useRef<HTMLInputElement>(null);

  // First visit: the generic CV comes with the portrait.
  useEffect(() => {
    if (readDraft()) return;
    let cancelled = false;
    withPortrait(createPreset("generic-fr", "fr")).then((next) => {
      if (!cancelled)
        setCv((current) =>
          current.photo ? current : { ...current, photo: next.photo },
        );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The draft is kept on this device only.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
    }, SAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [cv]);

  useEffect(() => {
    let cancelled = false;
    if (!cv.photo) {
      setPhoto(null);
      return;
    }
    cropPhoto(cv.photo)
      .then((cropped) => !cancelled && setPhoto(cropped))
      .catch(() => !cancelled && setPhoto(null));
    return () => {
      cancelled = true;
    };
  }, [cv.photo]);

  useEffect(() => {
    const onAnnounce = (event: Event) =>
      setMessage((event as CustomEvent<string>).detail);
    window.addEventListener("cvgen:announce", onAnnounce);
    return () => window.removeEventListener("cvgen:announce", onAnnounce);
  }, []);

  // Printing shows the CV alone, at its real size.
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const patch = useCallback((change: Partial<CvDocument>) => {
    setCv((current) => ({ ...current, ...change }));
  }, []);
  const patchLayout = (change: Partial<CvDocument["layout"]>) =>
    setCv((current) => ({
      ...current,
      layout: { ...current.layout, ...change },
    }));

  // The section callbacks read the latest state through a ref: they stay
  // stable, so typing in one section does not render the others again.
  const cvRef = useRef(cv);
  cvRef.current = cv;

  const actions = useMemo<SectionActions>(
    () => ({
      update: (section) =>
        setCv((current) => ({
          ...current,
          sections: current.sections.map((item) =>
            item.id === section.id ? section : item,
          ),
        })),
      move: (id, delta) => {
        const current = cvRef.current;
        const section = current.sections.find((item) => item.id === id);
        if (!section) return;
        const column = current.sections.filter(
          (item) => item.column === section.column,
        );
        const position = column.indexOf(section);
        const neighbour = column[position + delta];
        if (!neighbour) return;
        const sections = [...current.sections];
        const a = sections.indexOf(section);
        const b = sections.indexOf(neighbour);
        [sections[a], sections[b]] = [sections[b], sections[a]];
        setCv({ ...current, sections });
        announce(
          t("cvgen.status.moved", {
            position: position + delta + 1,
            count: column.length,
          }),
        );
        focusMoved(`cv-${id}`, position + delta, column.length, delta);
      },
      switchColumn: (id) => {
        const current = cvRef.current;
        const section = current.sections.find((item) => item.id === id);
        if (!section) return;
        const column: Column = section.column === "main" ? "side" : "main";
        setCv({
          ...current,
          sections: [
            ...current.sections.filter((item) => item.id !== id),
            { ...section, column },
          ],
        });
        announce(t(`cvgen.status.${column}`));
        focusSoon(`cv-${id}-column`);
      },
      remove: (id) =>
        setRemoving(
          cvRef.current.sections.find((item) => item.id === id) ?? null,
        ),
    }),
    [t],
  );

  const confirmRemove = () => {
    if (!removing) return;
    const id = removing.id;
    setCv((current) => ({
      ...current,
      sections: current.sections.filter((item) => item.id !== id),
    }));
    setRemoving(null);
    announce(t("cvgen.status.sectionRemoved"));
    focusSoon("cv-add-section");
  };

  const addSection = () => {
    const title = t(`cvgen.sections.defaultTitles.${newKind}`);
    const section = newSection(newKind, title, newColumn);
    setCv((current) => ({
      ...current,
      sections: [...current.sections, section],
    }));
    setJustAdded(section.id);
    announce(t("cvgen.status.sectionAdded"));
    focusSoon(`cv-${section.id}-title`);
  };

  const loadPreset = async () => {
    setConfirmPreset(false);
    let next = createPreset(preset, uiLanguage);
    if (presetHasPortrait(preset)) next = await withPortrait(next);
    setCv(next);
    announce(t("cvgen.status.presetLoaded"));
  };

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const source = await readPicture(file);
      setPhotoError(false);
      setCv((current) => ({
        ...current,
        photo: {
          source,
          shape: current.photo?.shape ?? "round",
          zoom: 1,
          x: 0.5,
          y: 0.3,
        },
      }));
      announce(t("cvgen.status.photoAdded"));
    } catch {
      setPhotoError(true);
    }
  };

  const files = (): ZipFile[] => {
    const encoder = new TextEncoder();
    const list: ZipFile[] = [
      { name: `${fileBase(cv.name)}.tex`, data: encoder.encode(toLatex(cv)) },
    ];
    if (cv.photo && photo)
      list.push({ name: PHOTO_FILE, data: dataUrlToBytes(photo) });
    return list;
  };

  const importForm = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isDocument(parsed)) throw new Error("Not a CV");
      setCv(parsed);
      setImportError(false);
      announce(t("cvgen.status.imported"));
    } catch {
      setImportError(true);
    }
  };

  const latex = useMemo(() => (showCode ? toLatex(cv) : ""), [showCode, cv]);
  const unsupported = useMemo(
    () => unsupportedCharacters(JSON.stringify({ ...cv, photo: null })),
    [cv],
  );
  const sideText = sidebarTextColor(cv.layout.sidebarColor);
  const accentOnSide = contrast(cv.layout.accentColor, cv.layout.sidebarColor);
  const accentOnWhite = contrast(cv.layout.accentColor, "#ffffff");

  const columns: { key: Column; sections: Section[] }[] = [
    {
      key: "main",
      sections: cv.sections.filter((section) => section.column === "main"),
    },
    {
      key: "side",
      sections: cv.sections.filter((section) => section.column === "side"),
    },
  ];

  // A typed color applies on Enter or when the field loses focus.
  const applyHex = (
    key: "sidebarColor" | "accentColor",
    input: HTMLInputElement,
  ) => {
    const value = input.value.trim();
    const hex = value.startsWith("#") ? value : `#${value}`;
    if (isHexColor(hex)) patchLayout({ [key]: hex.toLowerCase() });
    else input.value = cv.layout[key];
  };

  const colorField = (key: "sidebarColor" | "accentColor") => {
    const id = `cv-${key}`;
    return (
      <div className="field">
        <label htmlFor={id}>{t(`cvgen.layout.${key}`)}</label>
        <div className="cvgen-color">
          <input
            type="color"
            id={id}
            value={cv.layout[key]}
            onChange={(event) => patchLayout({ [key]: event.target.value })}
          />
          <input
            type="text"
            aria-label={t("cvgen.layout.hex", {
              name: t(`cvgen.layout.${key}`),
            })}
            defaultValue={cv.layout[key]}
            key={cv.layout[key]}
            maxLength={7}
            spellCheck={false}
            onBlur={(event) => applyHex(key, event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyHex(key, event.currentTarget);
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <Page
      title={t("cvgen.title")}
      icon={faFileLines}
      lead={
        <>
          <p>{t("cvgen.lead")}</p>
          <p className="note">{t("cvgen.privacy")}</p>
        </>
      }
    >
      <p className="sr-only" role="status">
        {message}
      </p>

      <div className="cvgen">
        <form
          className="cvgen-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset className="cvgen-group">
            <legend>{t("cvgen.start.title")}</legend>
            <div className="field">
              <label htmlFor="cv-preset">{t("cvgen.start.label")}</label>
              <select
                id="cv-preset"
                value={preset}
                onChange={(event) => setPreset(event.target.value as PresetKey)}
              >
                {PRESETS.map((key) => (
                  <option key={key} value={key}>
                    {t(`cvgen.presets.${key}`)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="button button-small cvgen-add"
              onClick={() => setConfirmPreset(true)}
              aria-haspopup="dialog"
            >
              {t("cvgen.start.load")}
            </button>
            {saveError && (
              <p className="cvgen-warning" role="alert">
                <Icon icon={faTriangleExclamation} />
                {t("cvgen.saveError")}
              </p>
            )}
          </fieldset>

          <fieldset className="cvgen-group">
            <legend>{t("cvgen.header.title")}</legend>
            <Field
              id="cv-name"
              label={t("cvgen.header.name")}
              value={cv.name}
              autoComplete="name"
              onChange={(name) => patch({ name })}
            />
            <Field
              id="cv-headline"
              label={t("cvgen.header.headline")}
              value={cv.headline}
              onChange={(headline) => patch({ headline })}
            />
            <Choice
              legend={t("cvgen.header.language")}
              name="cv-language"
              value={cv.language}
              options={[
                { value: "fr", label: t("cvgen.lang.fr") },
                { value: "en", label: t("cvgen.lang.en") },
              ]}
              onChange={(language) => patch({ language })}
            />
            <p className="cvgen-hint">{t("cvgen.header.languageHint")}</p>
          </fieldset>

          <fieldset className="cvgen-group">
            <legend>{t("cvgen.layout.title")}</legend>
            <Choice
              legend={t("cvgen.layout.sidebar")}
              name="cv-sidebar"
              value={cv.layout.sidebar}
              options={[
                { value: "left", label: t("cvgen.layout.left") },
                { value: "right", label: t("cvgen.layout.right") },
              ]}
              onChange={(sidebar) => patchLayout({ sidebar })}
            />
            <div className="field">
              <label htmlFor="cv-width">
                {t("cvgen.layout.width")} ({cv.layout.sidebarWidth} %)
              </label>
              <input
                type="range"
                id="cv-width"
                min={SIDEBAR_WIDTH.min}
                max={SIDEBAR_WIDTH.max}
                value={cv.layout.sidebarWidth}
                aria-valuetext={`${cv.layout.sidebarWidth} %`}
                onChange={(event) =>
                  patchLayout({ sidebarWidth: Number(event.target.value) })
                }
              />
            </div>
            <div className="cvgen-row">
              {colorField("sidebarColor")}
              {colorField("accentColor")}
            </div>
            <p className="cvgen-hint">
              {t("cvgen.layout.textAuto", {
                color: t(
                  sideText === "#000000"
                    ? "cvgen.layout.black"
                    : "cvgen.layout.white",
                ),
              })}
            </p>
            {accentOnSide < MIN_CONTRAST && (
              <p className="cvgen-warning">
                <Icon icon={faTriangleExclamation} />
                {t("cvgen.layout.lowContrast", {
                  ratio: accentOnSide.toFixed(1),
                  background: t("cvgen.layout.onSidebar"),
                })}
              </p>
            )}
            {accentOnWhite < MIN_CONTRAST && (
              <p className="cvgen-warning">
                <Icon icon={faTriangleExclamation} />
                {t("cvgen.layout.lowContrast", {
                  ratio: accentOnWhite.toFixed(1),
                  background: t("cvgen.layout.onWhite"),
                })}
              </p>
            )}
          </fieldset>

          <fieldset className="cvgen-group">
            <legend>{t("cvgen.photo.title")}</legend>
            <div className="cvgen-photo">
              {cv.photo && photo ? (
                <img
                  src={photo}
                  alt={t("cvgen.photo.preview")}
                  className={
                    cv.photo.shape === "round" ? "is-round" : undefined
                  }
                  width={96}
                  height={96}
                />
              ) : (
                <p className="cvgen-hint">{t("cvgen.photo.none")}</p>
              )}
              <div className="field">
                <label htmlFor="cv-photo">{t("cvgen.photo.choose")}</label>
                <input
                  type="file"
                  id="cv-photo"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    choosePhoto(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </div>
            </div>
            {photoError && (
              <p className="cvgen-warning" role="alert">
                <Icon icon={faTriangleExclamation} />
                {t("cvgen.photo.error")}
              </p>
            )}
            {cv.photo && (
              <>
                <Choice
                  legend={t("cvgen.photo.shape")}
                  name="cv-shape"
                  value={cv.photo.shape}
                  options={[
                    { value: "round", label: t("cvgen.photo.round") },
                    { value: "square", label: t("cvgen.photo.square") },
                  ]}
                  onChange={(shape) =>
                    cv.photo && patch({ photo: { ...cv.photo, shape } })
                  }
                />
                {(["zoom", "x", "y"] as const).map((key) => (
                  <div className="field" key={key}>
                    <label htmlFor={`cv-photo-${key}`}>
                      {t(`cvgen.photo.${key}`)}
                    </label>
                    <input
                      type="range"
                      id={`cv-photo-${key}`}
                      min={key === "zoom" ? 1 : 0}
                      max={key === "zoom" ? 3 : 1}
                      step={0.01}
                      value={cv.photo![key]}
                      aria-valuetext={
                        key === "zoom"
                          ? `× ${cv.photo![key].toFixed(2)}`
                          : `${Math.round(cv.photo![key] * 100)} %`
                      }
                      onChange={(event) =>
                        cv.photo &&
                        patch({
                          photo: {
                            ...cv.photo,
                            [key]: Number(event.target.value),
                          },
                        })
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="button button-small cvgen-add"
                  onClick={() => {
                    patch({ photo: null });
                    announce(t("cvgen.status.photoRemoved"));
                    focusSoon("cv-photo");
                  }}
                >
                  {t("cvgen.photo.remove")}
                </button>
              </>
            )}
          </fieldset>

          <section className="cvgen-group" aria-labelledby="cv-sections-title">
            <h2 className="cvgen-group-title" id="cv-sections-title">
              {t("cvgen.sections.title")}
            </h2>
            <p className="cvgen-hint">{t("cvgen.sections.hint")}</p>
            {columns.map(({ key, sections }) => (
              <div className="cvgen-column" key={key}>
                <h3 className="cvgen-column-title" id={`cv-column-${key}`}>
                  {t(`cvgen.sections.${key}`)}
                </h3>
                {sections.length === 0 ? (
                  <p className="cvgen-hint">{t("cvgen.sections.empty")}</p>
                ) : (
                  <ol
                    className="cvgen-sections"
                    aria-labelledby={`cv-column-${key}`}
                  >
                    {sections.map((section, index) => (
                      <SectionEditor
                        key={section.id}
                        section={section}
                        index={index}
                        count={sections.length}
                        language={cv.language}
                        defaultOpen={section.id === justAdded}
                        actions={actions}
                      />
                    ))}
                  </ol>
                )}
              </div>
            ))}
            <div className="cvgen-row">
              <div className="field">
                <label htmlFor="cv-new-kind">
                  {t("cvgen.sections.addKind")}
                </label>
                <select
                  id="cv-new-kind"
                  value={newKind}
                  onChange={(event) =>
                    setNewKind(event.target.value as SectionKind)
                  }
                >
                  {KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {t(`cvgen.sections.kinds.${kind}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="cv-new-column">
                  {t("cvgen.sections.addColumn")}
                </label>
                <select
                  id="cv-new-column"
                  value={newColumn}
                  onChange={(event) =>
                    setNewColumn(event.target.value as Column)
                  }
                >
                  <option value="main">{t("cvgen.sections.main")}</option>
                  <option value="side">{t("cvgen.sections.side")}</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              id="cv-add-section"
              className="button button-small cvgen-add"
              onClick={addSection}
            >
              {t("cvgen.sections.add")}
            </button>
          </section>

          <section className="cvgen-group" aria-labelledby="cv-export-title">
            <h2 className="cvgen-group-title" id="cv-export-title">
              {t("cvgen.export.title")}
            </h2>
            {unsupported.length > 0 && (
              <p className="cvgen-warning">
                <Icon icon={faTriangleExclamation} />
                {t("cvgen.export.unsupported", {
                  chars: unsupported.join(" "),
                })}
              </p>
            )}
            <div className="cvgen-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => openInOverleaf(zip(files()))}
              >
                <Icon icon={faUpRightFromSquare} />
                {t("cvgen.export.overleaf")}
                <span className="sr-only"> ({t("ui.newTab")})</span>
              </button>
              <button
                type="button"
                className="button"
                onClick={() =>
                  download(
                    toLatex(cv),
                    `${fileBase(cv.name)}.tex`,
                    "application/x-tex",
                  )
                }
              >
                <Icon icon={faFileCode} />
                {t("cvgen.export.tex")}
              </button>
              <button
                type="button"
                className="button"
                onClick={() =>
                  download(
                    zip(files()),
                    `${fileBase(cv.name)}.zip`,
                    "application/zip",
                  )
                }
              >
                <Icon icon={faDownload} />
                {t("cvgen.export.zip")}
              </button>
              <button
                type="button"
                className="button"
                onClick={() => window.print()}
              >
                <Icon icon={faPrint} />
                {t("cvgen.export.print")}
              </button>
            </div>
            <p className="cvgen-hint">{t("cvgen.export.overleafHint")}</p>
            <p className="cvgen-hint">{t("cvgen.export.printHint")}</p>

            <div className="cvgen-actions">
              <button
                type="button"
                className="button button-small"
                onClick={() =>
                  download(
                    JSON.stringify(cv, null, 2),
                    `${fileBase(cv.name)}.json`,
                    "application/json",
                  )
                }
              >
                <Icon icon={faFloppyDisk} />
                {t("cvgen.export.save")}
              </button>
              <button
                type="button"
                className="button button-small"
                onClick={() => importRef.current?.click()}
              >
                <Icon icon={faFileArrowUp} />
                {t("cvgen.export.load")}
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(event) => {
                  importForm(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className="button button-small"
                aria-expanded={showCode}
                aria-controls="cv-code"
                onClick={() => setShowCode(!showCode)}
              >
                <Icon icon={faCode} />
                {showCode ? t("cvgen.export.hideCode") : t("cvgen.export.code")}
              </button>
            </div>
            {importError && (
              <p className="cvgen-warning" role="alert">
                <Icon icon={faTriangleExclamation} />
                {t("cvgen.export.loadError")}
              </p>
            )}
            <pre
              id="cv-code"
              className="cvgen-code"
              hidden={!showCode}
              tabIndex={0}
              aria-label={t("cvgen.export.code")}
            >
              {latex}
            </pre>
          </section>
        </form>

        {/* Focusable so that keyboard users can scroll the preview on its own. */}
        <section
          className="cvgen-preview"
          aria-labelledby="cv-preview-title"
          tabIndex={0}
        >
          <div className="cvgen-preview-head">
            <h2 id="cv-preview-title">{t("cvgen.preview.title")}</h2>
            <p className="cvgen-hint">{t("cvgen.preview.note")}</p>
          </div>
          {preview.overflow && (
            <p className="cvgen-warning">
              <Icon icon={faTriangleExclamation} />
              {t("cvgen.preview.overflow")}
            </p>
          )}
          <div
            className="cvgen-stage"
            ref={preview.stageRef}
            style={{
              height: Math.max(PAGE_HEIGHT, preview.height) * preview.scale,
            }}
            role="img"
            aria-label={t("cvgen.preview.label")}
          >
            <div
              className="cvgen-scale"
              style={{ transform: `scale(${preview.scale})` }}
              aria-hidden="true"
            >
              <Preview ref={preview.paperRef} cv={cv} photo={photo} />
            </div>
            {preview.overflow && (
              <span
                className="cvgen-page-break"
                style={{ top: PAGE_HEIGHT * preview.scale }}
              />
            )}
          </div>
        </section>
      </div>

      <Dialog
        open={confirmPreset}
        onClose={() => setConfirmPreset(false)}
        title={t("cvgen.start.confirmTitle")}
      >
        <p>
          {t("cvgen.start.confirmText", {
            preset: t(`cvgen.presets.${preset}`),
          })}
        </p>
        <div className="cvgen-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={loadPreset}
          >
            {t("cvgen.start.confirm")}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setConfirmPreset(false)}
          >
            {t("cvgen.cancel")}
          </button>
        </div>
      </Dialog>

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={t("cvgen.section.confirmTitle", {
          title: removing?.title.trim() || t("cvgen.section.untitled"),
        })}
      >
        <p>{t("cvgen.section.confirmText")}</p>
        <div className="cvgen-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={confirmRemove}
          >
            {t("cvgen.section.confirm")}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setRemoving(null)}
          >
            {t("cvgen.cancel")}
          </button>
        </div>
      </Dialog>

      {printing &&
        createPortal(
          <div className="cv-print-root">
            <Preview cv={cv} photo={photo} />
          </div>,
          document.body,
        )}
    </Page>
  );
}
