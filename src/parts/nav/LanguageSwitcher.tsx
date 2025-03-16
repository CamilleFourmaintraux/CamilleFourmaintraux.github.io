import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "fr");

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("lang", lang);
  }, [lang]);

  const toggleLang = () => setLang(lang === "fr" ? "en" : "fr");

  return (
    <button onClick={toggleLang} id="langSwitcher">
      {lang === "fr" ? "🇬🇧" : "🇫🇷"}
    </button>
  );
}
