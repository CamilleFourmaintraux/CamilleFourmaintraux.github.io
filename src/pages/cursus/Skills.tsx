import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

export default function Skills() {
  const { t } = useTranslation();

  const tabTextPopup = [
    {
      title: t("courses.springboot_title"),
      description: t("courses.springboot_desc"),
      picture_file_name: "spring-boot",
    },
    {
      title: t("courses.math_title"),
      description: t("courses.math_desc"),
      picture_file_name: "modelisation-mathematique",
    },
    {
      title: t("courses.nosql_title"),
      description: t("courses.nosql_desc"),
      picture_file_name: "mongodb",
    },
    {
      title: t("courses.react_title"),
      description: t("courses.react_desc"),
      picture_file_name: "react",
    },
    {
      title: t("courses.quality_title"),
      description: t("courses.quality_desc"),
      picture_file_name: "qualite-de-code",
    },
    {
      title: t("courses.ci_title"),
      description: t("courses.ci_desc"),
      picture_file_name: "cicd",
    },
    {
      title: t("courses.postman_title"),
      description: t("courses.postman_desc"),
      picture_file_name: "postman",
    },
    {
      title: t("courses.multimedia_title"),
      description: t("courses.multimedia_desc"),
      picture_file_name: "programmation-multimedia",
    },
    {
      title: t("courses.tools_title"),
      description: t("courses.tools_desc"),
      picture_file_name: "git",
    },
    {
      title: t("courses.softwareag_title"),
      description: t("courses.softwareag_desc"),
      picture_file_name: "software-ag-designer",
    },
    {
      title: t("courses.toeic_title"),
      description: t("courses.toeic_desc"),
      picture_file_name: "certification-toeic",
    },
  ];

  const [popupData, setPopupData] = useState<{
    title: string;
    description: string;
  }>({ title: "Erreur", description: "Une erreur est survenue." });

  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const handleCardClick = (index: number) => {
    console.log(`Card n°${index} clicked !`);
    if (
      !cardContainerRef.current ||
      !carouselRef.current ||
      !cardContainerRef.current.children[index] ||
      !popupRef
    ) {
      console.log("Error! No Popup.");
      return;
    }

    const card = cardContainerRef.current.children[index] as HTMLElement;
    const cardWidth = card.offsetWidth;
    const carouselWidth = carouselRef.current.offsetWidth;
    const cardOffset = card.offsetLeft;

    cardContainerRef.current.scrollTo({
      left: cardOffset - carouselWidth / 2 + cardWidth / 2,
      behavior: "smooth",
    });

    setPopupData(tabTextPopup[index]);
    /*
    console.log(
      "Test data : " +
        popupData +
        ". Autre test : {" +
        tabTextPopup[index].title +
        "," +
        tabTextPopup[index].description +
        "}"
    );*/
    showPopUp();
  };

  function showPopUp() {
    if (popupRef.current == null) {
      console.log("Error! PopUpRef.current is null.");
      return;
    }
    popupRef.current.style.display = "flex";
  }

  function hidePopUp() {
    if (popupRef.current == null) {
      console.log("Error! PopUpRef.current is null.");
      return;
    }
    popupRef.current.style.display = "none";
  }

  return (
    <div className="container" id="competences">
      <h2>{t("skills.title")}</h2>
      <ul>
        <li>
          <strong>{t("skills.language")}</strong> {t("skills.language_value")}
        </li>
        <li>
          <strong>{t("skills.programming")}</strong>{" "}
          {t("skills.programming_value")}
        </li>
        <li>
          <strong>{t("skills.tools")}</strong> {t("skills.tools_value")}
        </li>
        <li>
          <strong>{t("skills.web")}</strong> {t("skills.web_value")}
        </li>
        <li>
          <strong>{t("skills.sql")}</strong> {t("skills.sql_value")}
        </li>
        <li>
          <strong>{t("skills.nosql")}</strong> {t("skills.nosql_value")}
        </li>
        <li>
          <strong>{t("skills.api")}</strong> {t("skills.api_value")}
        </li>
        <li>
          <strong>{t("skills.collab")}</strong> {t("skills.collab_value")}
        </li>
        <li>
          <strong>{t("skills.scrum")}</strong> {t("skills.scrum_value")}
        </li>
        <li>
          <strong>{t("skills.ci")}</strong> {t("skills.ci_value")}
        </li>
        <li>
          <strong>{t("skills.quality")}</strong> {t("skills.quality_value")}
        </li>
        <li>
          <strong>{t("skills.math")}</strong> {t("skills.math_value")}
        </li>
        <li>
          <strong>{t("skills.media")}</strong> {t("skills.media_value")}
        </li>
      </ul>

      <div className="carousel" ref={carouselRef}>
        <div className="card-container" ref={cardContainerRef}>
          {tabTextPopup.map((item, index) => (
            <div
              key={index}
              className="card"
              onClick={() => handleCardClick(index)}
            >
              <img
                src={`/img/cursus/competences/${item.picture_file_name}.png`}
                alt={item.picture_file_name}
                className="cardPicture"
              />
            </div>
          ))}
        </div>
      </div>
      {popupData && (
        <div className="popup" ref={popupRef} onClick={() => hidePopUp()}>
          <div className="popup-content">
            <h2>{popupData.title}</h2>
            <p>{popupData.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
