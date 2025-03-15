import ThemeSwitcher from "./ThemeSwitcher";

export default function Header() {
  return (
    <header id="header">
      <h1>Camille FOURMAINTRAUX</h1>
      <p>Étudiant en BUT Informatique</p>
      <img src="/img/me_blue.png" alt="Ma Photo" id="photoPresentation"></img>
      <ThemeSwitcher />
    </header>
  );
}
