import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  faCircleCheck,
  faCopy,
  faDownload,
  faEnvelope,
  faGlobe,
  faLink,
  faLocationDot,
  faPhone,
  faQrcode,
  faRotateLeft,
  faTriangleExclamation,
  faUser,
  faWifi,
} from "@fortawesome/free-solid-svg-icons";
import {
  faDiscord,
  faGithub,
  faGitlab,
  faInstagram,
  faLinkedin,
  faSteam,
  faWhatsapp,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import Dialog from "@/ui/Dialog";
import Icon from "@/ui/Icon";
import Page from "@/ui/Page";
import { contrast } from "../cv/colors";
import {
  AddButton,
  Choice,
  ColorField,
  Field,
  ItemTools,
} from "../cv/controls";
import { useListActions } from "../cv/listActions";
import { download } from "../cv/files";
import {
  LOGO_ICON_KEYS,
  LOGO_SIZE,
  MARGIN,
  buildMatrix,
  crispSize,
  defaultSettings,
  encodeContent,
  hasLogo,
  hasSourceParam,
  linkParam,
  mergeParams,
  rasterize,
  readBack,
  readLogo,
  renderSvg,
  resolveLevel,
  splitLink,
  toPng,
  versionOf,
  type ContentKind,
  type Correction,
  type LogoIconKey,
  type QrContent,
  type QrLogo,
  type QrSettings,
  type QrStyle,
  type WifiSecurity,
} from "./qr";
import "../cv/form.css";
import "./qr.css";

const STORAGE_KEY = "qr-generator";
const SAVE_DELAY = 400;
const CHECK_DELAY = 350;
const PNG_SIZES = [512, 1024, 2048];
const KINDS: ContentKind[] = [
  "link",
  "text",
  "email",
  "phone",
  "wifi",
  "contact",
];
const CORRECTIONS: Correction[] = ["auto", "L", "M", "Q", "H"];
// Contrast below which some readers start to fail.
const MIN_QR_CONTRAST = 4;

const LOGO_ICONS: Record<LogoIconKey, IconDefinition> = {
  link: faLink,
  globe: faGlobe,
  envelope: faEnvelope,
  phone: faPhone,
  wifi: faWifi,
  user: faUser,
  location: faLocationDot,
  linkedin: faLinkedin,
  github: faGithub,
  gitlab: faGitlab,
  youtube: faYoutube,
  discord: faDiscord,
  instagram: faInstagram,
  x: faXTwitter,
  whatsapp: faWhatsapp,
  steam: faSteam,
};

function loadSettings(): QrSettings {
  const defaults = defaultSettings();
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as QrSettings | null;
    if (saved?.version !== 1) return defaults;
    // Missing keys (older drafts) fall back to the defaults.
    return {
      version: 1,
      content: {
        ...defaults.content,
        ...saved.content,
        params: Array.isArray(saved.content?.params)
          ? saved.content.params
          : defaults.content.params,
        email: { ...defaults.content.email, ...saved.content?.email },
        wifi: { ...defaults.content.wifi, ...saved.content?.wifi },
        contact: { ...defaults.content.contact, ...saved.content?.contact },
      },
      style: { ...defaults.style, ...saved.style },
      logo: { ...defaults.logo, ...saved.logo },
    };
  } catch {
    return defaults;
  }
}

const isLight = (hex: string) =>
  contrast(hex, "#000000") > contrast(hex, "#ffffff");

const canCopy = () =>
  typeof window !== "undefined" &&
  "ClipboardItem" in window &&
  typeof navigator.clipboard?.write === "function";

function Check({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="cvgen-check" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="cvgen-warning">
      <Icon icon={faTriangleExclamation} />
      <span>{children}</span>
    </p>
  );
}

type Reading = "idle" | "checking" | "ok" | "fail";

export default function QrGenerator() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(loadSettings);
  const [pngSize, setPngSize] = useState(1024);
  const [reading, setReading] = useState<Reading>("idle");
  const [message, setMessage] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { content, style, logo } = settings;

  const patchContent = (patch: Partial<QrContent>) =>
    setSettings((s) => ({ ...s, content: { ...s.content, ...patch } }));
  const params = useListActions(
    content.params,
    (next) => patchContent({ params: next }),
    {
      firstFieldId: (param) => `qr-param-${param.id}-name`,
      addButtonId: "qr-param-add",
    },
  );

  // Moves the "?name=value" part of the address into the parameter list.
  const takeParams = (value: string) => {
    const { address, params: found } = splitLink(value.trim());
    if (found.length === 0) {
      patchContent({ link: value });
      return;
    }
    setSettings((s) => ({
      ...s,
      content: {
        ...s.content,
        link: address,
        params: mergeParams(s.content.params, found),
      },
    }));
    setMessage(t("qrgen.content.paramsTaken", { count: found.length }));
  };

  const patchStyle = (patch: Partial<QrStyle>) =>
    setSettings((s) => ({ ...s, style: { ...s.style, ...patch } }));
  const patchLogo = (patch: Partial<QrLogo>) =>
    setSettings((s) => ({ ...s, logo: { ...s.logo, ...patch } }));

  // Messages from the shared list helpers.
  useEffect(() => {
    const listener = (event: Event) =>
      setMessage((event as CustomEvent<string>).detail);
    window.addEventListener("cvgen:announce", listener);
    return () => window.removeEventListener("cvgen:announce", listener);
  }, []);

  // The draft stays in this browser only.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Storage full or blocked: the page still works without it.
      }
    }, SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [settings]);

  const text = useMemo(() => encodeContent(content), [content]);
  const level = resolveLevel(style, logo);
  const matrix = useMemo(() => {
    if (!text) return null;
    try {
      return buildMatrix(text, level);
    } catch {
      return "too-long" as const;
    }
  }, [text, level]);
  const ready = matrix !== null && matrix !== "too-long";
  const total = ready ? matrix.count + 2 * style.margin : 0;

  const shortText = text.length > 80 ? `${text.slice(0, 77)}...` : text;
  const svg = useMemo(
    () =>
      ready
        ? renderSvg({
            matrix,
            style,
            logo,
            icon: LOGO_ICONS[logo.icon],
            title: t("qrgen.preview.alt", { content: shortText }),
          })
        : "",
    [ready, matrix, style, logo, t, shortText],
  );

  // Reads the picture back, as a phone would, after each pause in typing.
  useEffect(() => {
    if (!svg || !ready) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setReading("checking");
      readBack(svg, total)
        .then((decoded) => {
          if (!cancelled) setReading(decoded === text ? "ok" : "fail");
        })
        .catch(() => !cancelled && setReading("idle"));
    }, CHECK_DELAY);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [svg, ready, total, text]);

  const fileSvg = () =>
    ready
      ? renderSvg({
          matrix,
          style,
          logo,
          icon: LOGO_ICONS[logo.icon],
          pixels: crispSize(pngSize, total),
        })
      : "";

  const png = async () =>
    toPng(await rasterize(fileSvg(), crispSize(pngSize, total)));

  const downloadPng = async () => {
    download(await png(), "qr-code.png", "image/png");
    setMessage(t("qrgen.export.downloaded"));
  };
  const downloadSvg = () => {
    download(fileSvg(), "qr-code.svg", "image/svg+xml");
    setMessage(t("qrgen.export.downloaded"));
  };
  const copy = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": png() }),
      ]);
      setMessage(t("qrgen.export.copied"));
    } catch {
      setMessage(t("qrgen.export.copyFailed"));
    }
  };

  const chooseLogo = async (file: File | undefined) => {
    if (!file) return;
    try {
      const image = await readLogo(file);
      patchLogo({ kind: "image", image });
      setLogoError(false);
      setMessage(t("qrgen.logo.added"));
    } catch {
      setLogoError(true);
    }
  };

  const reset = () => {
    setSettings(defaultSettings());
    setConfirmReset(false);
    setMessage(t("qrgen.reset.done"));
  };

  // Readers need dark modules on a light, contrasted background.
  const background = style.transparent ? "#ffffff" : style.background;
  const eyeColor = style.customEyes ? style.eyeColor : style.foreground;
  const warnings: string[] = [];
  const ratio = Math.min(
    contrast(style.foreground, background),
    contrast(eyeColor, background),
  );
  if (ratio < MIN_QR_CONTRAST)
    warnings.push(
      t("qrgen.colors.lowContrast", {
        ratio: ratio.toFixed(1).replace(".", t("qrgen.decimal")),
      }),
    );
  if (
    !style.transparent &&
    (isLight(style.foreground) || isLight(eyeColor)) &&
    !isLight(style.background)
  )
    warnings.push(t("qrgen.colors.inverted"));
  if (style.transparent) warnings.push(t("qrgen.colors.transparentNote"));

  const lowLevel = hasLogo(logo) && (level === "L" || level === "M");

  const contentFields = () => {
    switch (content.kind) {
      case "link":
        return (
          <>
            <Field
              id="qr-link"
              label={t("qrgen.content.link")}
              hint={t("qrgen.content.linkHint")}
              type="url"
              value={content.link}
              placeholder="https://"
              onChange={(link) => patchContent({ link })}
              inputProps={{
                // A pasted link gives its parameters to the list at once.
                onPaste: (event) => {
                  const pasted = event.clipboardData.getData("text");
                  if (!pasted.includes("?")) return;
                  event.preventDefault();
                  const input = event.currentTarget;
                  const start = input.selectionStart ?? input.value.length;
                  const end = input.selectionEnd ?? input.value.length;
                  takeParams(
                    input.value.slice(0, start) +
                      pasted.trim() +
                      input.value.slice(end),
                  );
                },
                onBlur: (event) => takeParams(event.currentTarget.value),
                onKeyDown: (event) => {
                  if (event.key === "Enter")
                    takeParams(event.currentTarget.value);
                },
              }}
            />
            <fieldset className="qrgen-params">
              <legend>{t("qrgen.content.params")}</legend>
              {content.params.length === 0 && (
                <p className="cvgen-hint">{t("qrgen.content.noParams")}</p>
              )}
              <ul className="qrgen-param-list" role="list">
                {content.params.map((param, index) => {
                  const name = t("qrgen.content.paramName", { n: index + 1 });
                  return (
                    <li key={param.id} className="qrgen-param">
                      <Field
                        id={`qr-param-${param.id}-name`}
                        label={
                          <>
                            {t("qrgen.content.paramKey")}
                            <span className="sr-only">, {name}</span>
                          </>
                        }
                        value={param.name}
                        onChange={(value) =>
                          params.update(index, { ...param, name: value })
                        }
                      />
                      <Field
                        id={`qr-param-${param.id}-value`}
                        label={
                          <>
                            {t("qrgen.content.paramValue")}
                            <span className="sr-only">, {name}</span>
                          </>
                        }
                        value={param.value}
                        onChange={(value) =>
                          params.update(index, { ...param, value })
                        }
                      />
                      <ItemTools
                        idBase={`qr-param-${param.id}`}
                        name={name}
                        index={index}
                        count={content.params.length}
                        onMove={(delta) =>
                          params.move(index, delta, `qr-param-${param.id}`)
                        }
                        onRemove={() => params.remove(index)}
                      />
                    </li>
                  );
                })}
              </ul>
              <AddButton
                id="qr-param-add"
                label={t("qrgen.content.addParam")}
                onClick={() => params.add(linkParam())}
              />
              {hasSourceParam(content.params) && (
                <Check
                  id="qr-source-suffix"
                  label={t("qrgen.content.sourceSuffix")}
                  checked={content.sourceSuffix}
                  onChange={(sourceSuffix) => patchContent({ sourceSuffix })}
                />
              )}
            </fieldset>
            <div className="qrgen-final">
              <p id="qr-final-title" className="qrgen-final-title">
                {t("qrgen.content.finalLink")}
              </p>
              {text ? (
                <a
                  href={text}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-describedby="qr-final-title"
                >
                  {text}
                  <span className="sr-only"> {t("qrgen.content.newTab")}</span>
                </a>
              ) : (
                <p className="cvgen-hint">{t("qrgen.content.noLink")}</p>
              )}
            </div>
          </>
        );
      case "text":
        return (
          <Field
            id="qr-text"
            label={t("qrgen.content.text")}
            value={content.text}
            multiline
            rows={4}
            onChange={(value) => patchContent({ text: value })}
          />
        );
      case "email":
        return (
          <>
            <Field
              id="qr-email-to"
              label={t("qrgen.content.emailTo")}
              type="email"
              value={content.email.to}
              onChange={(to) =>
                patchContent({ email: { ...content.email, to } })
              }
            />
            <Field
              id="qr-email-subject"
              label={t("qrgen.content.emailSubject")}
              value={content.email.subject}
              onChange={(subject) =>
                patchContent({ email: { ...content.email, subject } })
              }
            />
            <Field
              id="qr-email-body"
              label={t("qrgen.content.emailBody")}
              value={content.email.body}
              multiline
              rows={3}
              onChange={(body) =>
                patchContent({ email: { ...content.email, body } })
              }
            />
          </>
        );
      case "phone":
        return (
          <Field
            id="qr-phone"
            label={t("qrgen.content.phone")}
            type="tel"
            value={content.phone}
            onChange={(phone) => patchContent({ phone })}
          />
        );
      case "wifi":
        return (
          <>
            <Field
              id="qr-wifi-ssid"
              label={t("qrgen.content.ssid")}
              value={content.wifi.ssid}
              onChange={(ssid) =>
                patchContent({ wifi: { ...content.wifi, ssid } })
              }
            />
            <div className="field">
              <label htmlFor="qr-wifi-security">
                {t("qrgen.content.security")}
              </label>
              <select
                id="qr-wifi-security"
                value={content.wifi.security}
                onChange={(event) =>
                  patchContent({
                    wifi: {
                      ...content.wifi,
                      security: event.target.value as WifiSecurity,
                    },
                  })
                }
              >
                {(["WPA", "WEP", "nopass"] as const).map((value) => (
                  <option key={value} value={value}>
                    {t(`qrgen.content.securities.${value}`)}
                  </option>
                ))}
              </select>
            </div>
            {content.wifi.security !== "nopass" && (
              <Field
                id="qr-wifi-password"
                label={t("qrgen.content.password")}
                value={content.wifi.password}
                onChange={(password) =>
                  patchContent({ wifi: { ...content.wifi, password } })
                }
              />
            )}
            <Check
              id="qr-wifi-hidden"
              label={t("qrgen.content.hidden")}
              checked={content.wifi.hidden}
              onChange={(hidden) =>
                patchContent({ wifi: { ...content.wifi, hidden } })
              }
            />
          </>
        );
      case "contact": {
        const fields = [
          ["firstName", "text", "given-name"],
          ["lastName", "text", "family-name"],
          ["organization", "text", "organization"],
          ["title", "text", "organization-title"],
          ["phone", "tel", "tel"],
          ["email", "email", "email"],
          ["url", "url", "url"],
        ] as const;
        return (
          <div className="cvgen-row">
            {fields.map(([key, type]) => (
              <Field
                key={key}
                id={`qr-contact-${key}`}
                label={t(`qrgen.content.contactFields.${key}`)}
                type={type}
                value={content.contact[key]}
                onChange={(value) =>
                  patchContent({
                    contact: { ...content.contact, [key]: value },
                  })
                }
              />
            ))}
          </div>
        );
      }
    }
  };

  const hex = (name: string) => t("qrgen.colors.hex", { name });

  return (
    <Page
      title={t("qrgen.title")}
      icon={faQrcode}
      lead={
        <>
          <p>{t("qrgen.lead")}</p>
          <p className="note">{t("qrgen.privacy")}</p>
        </>
      }
    >
      <p className="sr-only" role="status">
        {message}
      </p>

      <div className="cvgen qrgen">
        <form
          className="cvgen-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset className="cvgen-group">
            <legend>{t("qrgen.content.title")}</legend>
            <div className="field">
              <label htmlFor="qr-kind">{t("qrgen.content.kind")}</label>
              <select
                id="qr-kind"
                value={content.kind}
                onChange={(event) =>
                  patchContent({ kind: event.target.value as ContentKind })
                }
              >
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`qrgen.content.kinds.${kind}`)}
                  </option>
                ))}
              </select>
            </div>
            {contentFields()}
          </fieldset>

          <fieldset className="cvgen-group">
            <legend>{t("qrgen.shape.title")}</legend>
            <Choice
              legend={t("qrgen.shape.modules")}
              name="qr-modules"
              value={style.modules}
              options={(["square", "rounded", "dots", "leaf"] as const).map(
                (value) => ({
                  value,
                  label: t(`qrgen.shape.moduleStyles.${value}`),
                }),
              )}
              onChange={(modules) => patchStyle({ modules })}
            />
            <Choice
              legend={t("qrgen.shape.eyeFrame")}
              name="qr-eye-frame"
              value={style.eyeFrame}
              options={(["square", "rounded", "circle"] as const).map(
                (value) => ({
                  value,
                  label: t(`qrgen.shape.eyeStyles.${value}`),
                }),
              )}
              onChange={(eyeFrame) => patchStyle({ eyeFrame })}
            />
            <Choice
              legend={t("qrgen.shape.eyeCenter")}
              name="qr-eye-center"
              value={style.eyeCenter}
              options={(["square", "rounded", "circle"] as const).map(
                (value) => ({
                  value,
                  label: t(`qrgen.shape.eyeStyles.${value}`),
                }),
              )}
              onChange={(eyeCenter) => patchStyle({ eyeCenter })}
            />
            <div className="field">
              <label htmlFor="qr-margin">{t("qrgen.shape.margin")}</label>
              <input
                type="range"
                id="qr-margin"
                min={MARGIN.min}
                max={MARGIN.max}
                step={1}
                value={style.margin}
                aria-valuetext={t("qrgen.shape.modulesCount", {
                  count: style.margin,
                })}
                aria-describedby="qr-margin-hint"
                onChange={(event) =>
                  patchStyle({ margin: Number(event.target.value) })
                }
              />
              <p className="cvgen-hint" id="qr-margin-hint">
                {t("qrgen.shape.marginHint", { count: style.margin })}
              </p>
            </div>
            <Check
              id="qr-rounded-corners"
              label={t("qrgen.shape.roundedCorners")}
              checked={style.roundedCorners}
              onChange={(roundedCorners) => patchStyle({ roundedCorners })}
            />
            <div className="field">
              <label htmlFor="qr-correction">
                {t("qrgen.shape.correction")}
              </label>
              <select
                id="qr-correction"
                value={style.correction}
                aria-describedby="qr-correction-hint"
                onChange={(event) =>
                  patchStyle({ correction: event.target.value as Correction })
                }
              >
                {CORRECTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`qrgen.shape.corrections.${value}`)}
                  </option>
                ))}
              </select>
              <p className="cvgen-hint" id="qr-correction-hint">
                {t("qrgen.shape.correctionHint")}
              </p>
            </div>
          </fieldset>

          <fieldset className="cvgen-group">
            <legend>{t("qrgen.colors.title")}</legend>
            <div className="cvgen-row">
              <ColorField
                id="qr-foreground"
                label={t("qrgen.colors.foreground")}
                hexLabel={hex(t("qrgen.colors.foreground"))}
                value={style.foreground}
                onChange={(foreground) => patchStyle({ foreground })}
              />
              <ColorField
                id="qr-background"
                label={t("qrgen.colors.background")}
                hexLabel={hex(t("qrgen.colors.background"))}
                value={style.background}
                disabled={style.transparent}
                onChange={(value) => patchStyle({ background: value })}
              />
            </div>
            <Check
              id="qr-transparent"
              label={t("qrgen.colors.transparent")}
              checked={style.transparent}
              onChange={(transparent) => patchStyle({ transparent })}
            />
            <Check
              id="qr-custom-eyes"
              label={t("qrgen.colors.customEyes")}
              checked={style.customEyes}
              onChange={(customEyes) => patchStyle({ customEyes })}
            />
            {style.customEyes && (
              <ColorField
                id="qr-eye-color"
                label={t("qrgen.colors.eyeColor")}
                hexLabel={hex(t("qrgen.colors.eyeColor"))}
                value={style.eyeColor}
                onChange={(value) => patchStyle({ eyeColor: value })}
              />
            )}
            {warnings.map((warning) => (
              <Warning key={warning}>{warning}</Warning>
            ))}
          </fieldset>

          <fieldset className="cvgen-group">
            <legend>{t("qrgen.logo.title")}</legend>
            <Choice
              legend={t("qrgen.logo.kind")}
              name="qr-logo-kind"
              value={logo.kind}
              options={(["none", "icon", "image"] as const).map((value) => ({
                value,
                label: t(`qrgen.logo.kinds.${value}`),
              }))}
              onChange={(kind) => patchLogo({ kind })}
            />
            {logo.kind === "icon" && (
              <div className="cvgen-row">
                <div className="field">
                  <label htmlFor="qr-logo-icon">{t("qrgen.logo.icon")}</label>
                  <select
                    id="qr-logo-icon"
                    value={logo.icon}
                    onChange={(event) =>
                      patchLogo({ icon: event.target.value as LogoIconKey })
                    }
                  >
                    {LOGO_ICON_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(`qrgen.logo.icons.${key}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <ColorField
                  id="qr-logo-color"
                  label={t("qrgen.logo.iconColor")}
                  hexLabel={hex(t("qrgen.logo.iconColor"))}
                  value={logo.iconColor}
                  onChange={(iconColor) => patchLogo({ iconColor })}
                />
              </div>
            )}
            {logo.kind === "image" && (
              <div className="cvgen-photo">
                {logo.image ? (
                  <img
                    src={logo.image}
                    alt={t("qrgen.logo.preview")}
                    className="qrgen-logo-thumb"
                    width={64}
                    height={64}
                  />
                ) : (
                  <p className="cvgen-hint">{t("qrgen.logo.noImage")}</p>
                )}
                <div className="field">
                  <label htmlFor="qr-logo-file">{t("qrgen.logo.choose")}</label>
                  <input
                    type="file"
                    id="qr-logo-file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(event) => {
                      chooseLogo(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>
                {logo.image && (
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      patchLogo({ image: null });
                      setMessage(t("qrgen.logo.removed"));
                    }}
                  >
                    {t("qrgen.logo.remove")}
                  </button>
                )}
              </div>
            )}
            {logoError && (
              <p className="cvgen-warning" role="alert">
                <Icon icon={faTriangleExclamation} />
                {t("qrgen.logo.error")}
              </p>
            )}
            {logo.kind !== "none" && (
              <>
                <div className="field">
                  <label htmlFor="qr-logo-size">{t("qrgen.logo.size")}</label>
                  <input
                    type="range"
                    id="qr-logo-size"
                    min={LOGO_SIZE.min}
                    max={LOGO_SIZE.max}
                    step={LOGO_SIZE.step}
                    value={logo.size}
                    aria-valuetext={`${Math.round(logo.size * 100)} %`}
                    onChange={(event) =>
                      patchLogo({ size: Number(event.target.value) })
                    }
                  />
                </div>
                <Choice
                  legend={t("qrgen.logo.shape")}
                  name="qr-logo-shape"
                  value={logo.shape}
                  options={(["square", "circle"] as const).map((value) => ({
                    value,
                    label: t(`qrgen.logo.shapes.${value}`),
                  }))}
                  onChange={(shape) => patchLogo({ shape })}
                />
                <Check
                  id="qr-logo-clear"
                  label={t("qrgen.logo.clear")}
                  checked={logo.clear}
                  onChange={(clear) => patchLogo({ clear })}
                />
                {lowLevel && <Warning>{t("qrgen.logo.lowLevel")}</Warning>}
              </>
            )}
          </fieldset>

          <div className="cvgen-actions">
            <button
              type="button"
              className="button"
              onClick={() => setConfirmReset(true)}
            >
              <Icon icon={faRotateLeft} /> {t("qrgen.reset.button")}
            </button>
          </div>
        </form>

        <section
          className="cvgen-preview qrgen-preview"
          aria-labelledby="qr-preview-title"
        >
          <div className="cvgen-preview-head">
            <h2 id="qr-preview-title">{t("qrgen.preview.title")}</h2>
          </div>

          <div
            className={`qrgen-stage${style.transparent ? " is-transparent" : ""}`}
          >
            {ready ? (
              <div
                className="qrgen-code"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <p className="qrgen-empty">
                {matrix === "too-long"
                  ? t("qrgen.preview.tooLong", { count: text.length })
                  : t("qrgen.preview.empty")}
              </p>
            )}
          </div>

          {ready && (
            <>
              <p className={`qrgen-reading is-${reading}`} role="status">
                {reading === "ok" && <Icon icon={faCircleCheck} />}
                {reading === "fail" && <Icon icon={faTriangleExclamation} />}
                {reading !== "idle" && t(`qrgen.reading.${reading}`)}
              </p>
              <p className="cvgen-hint">
                {t("qrgen.preview.info", {
                  version: versionOf(matrix.count),
                  count: matrix.count,
                  level,
                })}
              </p>
              <div className="qrgen-encoded">
                <h3>{t("qrgen.preview.encoded")}</h3>
                <pre>{text}</pre>
              </div>

              <div className="qrgen-export">
                <div className="field">
                  <label htmlFor="qr-png-size">{t("qrgen.export.size")}</label>
                  <select
                    id="qr-png-size"
                    value={pngSize}
                    onChange={(event) => setPngSize(Number(event.target.value))}
                  >
                    {PNG_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {t("qrgen.export.pixels", {
                          size: crispSize(size, total),
                        })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cvgen-actions">
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={downloadPng}
                  >
                    <Icon icon={faDownload} /> {t("qrgen.export.png")}
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={downloadSvg}
                  >
                    <Icon icon={faDownload} /> {t("qrgen.export.svg")}
                  </button>
                  {canCopy() && (
                    <button type="button" className="button" onClick={copy}>
                      <Icon icon={faCopy} /> {t("qrgen.export.copy")}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t("qrgen.reset.confirmTitle")}
      >
        <p>{t("qrgen.reset.confirmText")}</p>
        <div className="cvgen-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={reset}
          >
            {t("qrgen.reset.confirm")}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setConfirmReset(false)}
          >
            {t("qrgen.reset.cancel")}
          </button>
        </div>
      </Dialog>
    </Page>
  );
}
