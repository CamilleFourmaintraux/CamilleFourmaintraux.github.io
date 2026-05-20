import { useTranslation } from "react-i18next";

export function smoothScrollTo(newPosition: number) {
  window.scrollTo({
    top: newPosition,
    behavior: "smooth",
  });
}

// Fonction pour faire défiler vers le haut de la page
export function scrollToTop() {
  smoothScrollTo(0);
}

export default function BackToTopButton() {
  const { t } = useTranslation();
  return (
    <button id="back-to-top" onClick={scrollToTop}>
      <i className="fa-solid fa-arrows-up-to-line" /> {t("topOfPage")}
    </button>
  );
}
