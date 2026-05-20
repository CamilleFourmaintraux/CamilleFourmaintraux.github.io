import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";

export default function PythonPage() {
  const { t } = useTranslation();
  return (
    <div className="container">
      <h2>
        <i className="fas fa-brands fa-python"></i>{" "}
        {t("portfolio.prog.python.title")}
      </h2>
      <p>{t("portfolio.prog.python.desc")}</p>
      <iframe
        className="carousel"
        style={{ height: 300 }}
        src="https://pyodide.org/en/stable/console.html"
      ></iframe>
      <br />
      <NavLink to="/"> {t("test.back")}</NavLink>
    </div>
  );
}
