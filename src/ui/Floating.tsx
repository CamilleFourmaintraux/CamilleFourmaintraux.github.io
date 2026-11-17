import { useEffect, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { faArrowUp, faHouse, faRobot } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

const SHOW_AFTER = 480;

// Shortcuts kept within reach of the thumb: back to top and the chatbot.
export default function Floating() {
  const { t } = useTranslation();
  const onChatbot = useMatch("/chatbot");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="floating">
      {scrolled && (
        <button
          type="button"
          className="floating-button"
          onClick={() => window.scrollTo({ top: 0 })}
          aria-label={t("topOfPage")}
          title={t("topOfPage")}
        >
          <Icon icon={faArrowUp} />
        </button>
      )}
      <Link
        to={onChatbot ? "/" : "/chatbot"}
        className="floating-button floating-chat"
        aria-label={
          onChatbot ? t("header.mainnav.home") : t("header.mainnav.chatbot")
        }
        title={
          onChatbot ? t("header.mainnav.home") : t("header.mainnav.chatbot")
        }
      >
        <Icon icon={onChatbot ? faHouse : faRobot} />
      </Link>
    </div>
  );
}
