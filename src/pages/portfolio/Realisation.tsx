import { useTranslation } from "react-i18next";
import { formatDate } from "../../Utils";

export interface RealisationProps {
  idRealisation: string;
  title: string;
  tags: string[];
  date: Date;
  dateEnd: Date;
  children: React.ReactNode;
  current: string;
  tagsPath: string;
  isInPeriod: boolean;
  isInProgress: boolean;
}

export const Realisation: React.FC<RealisationProps> = ({
  idRealisation,
  title,
  tags,
  date,
  dateEnd,
  children,
  current,
  tagsPath,
  isInPeriod,
  isInProgress,
}) => {
  function Status({
    dateEnd,
    isInProgress,
  }: {
    dateEnd: Date;
    isInProgress: boolean;
  }) {
    const today = new Date();

    return dateEnd > today ? (
      <span className={isInProgress ? "tag active" : "tag"}>
        {t(`portfolio.in_progress`)}
      </span>
    ) : (
      <span></span>
    );
  }
  const { t } = useTranslation();
  return (
    <div className="realisation subcontainer" id={idRealisation}>
      <h2>{title}</h2>
      <div className="timeperiod">
        <span className={isInPeriod ? "tag active" : "tag"}>
          {t(`portfolio.period`)} {formatDate(date)} - {formatDate(dateEnd)}
        </span>
        <Status dateEnd={dateEnd} isInProgress={isInProgress} />
      </div>
      <div className="realisation-content">{children}</div>
      <div className="tags-container">
        {tags.map((tag) => (
          <span key={tag} className={`tag ${current == tag ? "active" : ""}`}>
            {t(`${tagsPath}.${tag}`)}
          </span>
        ))}
      </div>
    </div>
  );
};
