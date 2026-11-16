import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isVisitStatsDisabled, setVisitStatsDisabled } from "./visitorContext";

export default function VisitStatsToggle() {
  const { t } = useTranslation();
  const [disabled, setDisabled] = useState(isVisitStatsDisabled);

  const toggle = () => {
    setVisitStatsDisabled(!disabled);
    setDisabled(isVisitStatsDisabled());
  };

  return (
    <div className="privacy-optout">
      <p role="status">
        {disabled
          ? t("privacy.context.optout.disabled")
          : t("privacy.context.optout.enabled")}
      </p>
      <button type="button" onClick={toggle} aria-pressed={disabled}>
        <i
          className={disabled ? "fas fa-chart-simple" : "fas fa-eye-slash"}
          aria-hidden="true"
        ></i>{" "}
        {disabled
          ? t("privacy.context.optout.enable")
          : t("privacy.context.optout.disable")}
      </button>
    </div>
  );
}
