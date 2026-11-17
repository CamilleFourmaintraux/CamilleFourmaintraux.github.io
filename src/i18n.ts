import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";

export type Language = "fr" | "en";

const STORAGE_KEY = "lang";

function readStoredLanguage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function normalizeLanguage(value: string | null | undefined): Language {
  return value?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/** Saved choice first, then the browser language. */
export function detectLanguage(): Language {
  return normalizeLanguage(readStoredLanguage() ?? navigator.language);
}

export function setLanguage(language: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Without storage the choice only lasts for this visit.
  }
  document.documentElement.lang = language;
  return i18n.changeLanguage(language);
}

i18n
  // French ships with the app, English is downloaded when it is needed.
  .use({
    type: "backend" as const,
    read(
      language: string,
      _namespace: string,
      callback: (error: unknown, data?: unknown) => void,
    ) {
      if (language !== "en") return callback(null, {});
      import("./locales/en.json")
        .then((module) => callback(null, module.default))
        .catch((error) => callback(error));
    },
  })
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr } },
    partialBundledLanguages: true,
    lng: detectLanguage(),
    supportedLngs: ["fr", "en"],
    fallbackLng: "fr",
    initAsync: false,
    interpolation: { escapeValue: false },
  });

document.documentElement.lang = detectLanguage();

export default i18n;
