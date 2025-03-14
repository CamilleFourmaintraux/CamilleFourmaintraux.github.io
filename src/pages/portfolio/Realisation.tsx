import { formatDate, TagsList } from "../../Utils";

export interface RealisationProps {
  idRealisation: string;
  title: string;
  tags: string[];
  date: Date;
  dateEnd: Date;
  children: React.ReactNode;
  current: string;
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
      <span className={isInProgress ? "tag active" : "tag"}>En cours</span>
    ) : (
      <span></span>
    );
  }

  return (
    <div className="realisation subcontainer" id={idRealisation}>
      <h2>{title}</h2>
      <div className="timeperiod">
        <span className={isInPeriod ? "tag active" : "tag"}>
          Période : {formatDate(date)} - {formatDate(dateEnd)}
        </span>
        <Status dateEnd={dateEnd} isInProgress={isInProgress} />
      </div>
      <div className="realisation-content">{children}</div>

      <TagsList tags={tags} current={current} />
    </div>
  );
};
