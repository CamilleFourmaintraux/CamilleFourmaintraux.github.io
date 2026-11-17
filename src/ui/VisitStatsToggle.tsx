import { useState } from "react";
import { useTranslation } from "react-i18next";
import { faChartSimple, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import {
  isVisitStatsDisabled,
  setVisitStatsDisabled,
} from "@/lib/visitor/visitorContext";
import Icon from "./Icon";

export default function VisitStatsToggle() {
  const { t } = useTranslation();
  const [disabled, setDisabled] = useState(isVisitStatsDisabled);

  const toggle = () => {
    setVisitStatsDisabled(!disabled);
    setDisabled(isVisitStatsDisabled());
  };

  return (
    <div className="card optout">
      <p role="status">
        {disabled
          ? t("privacy.context.optout.disabled")
          : t("privacy.context.optout.enabled")}
      </p>
      <button type="button" className="button button-small" onClick={toggle}>
        <Icon icon={disabled ? faChartSimple : faEyeSlash} />
        {disabled
          ? t("privacy.context.optout.enable")
          : t("privacy.context.optout.disable")}
      </button>
    </div>
  );
}
