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
  return (
    <button id="back-to-top" onClick={scrollToTop}>
      <i className="fa-solid fa-arrows-up-to-line" /> Haut de page
    </button>
  );
}
