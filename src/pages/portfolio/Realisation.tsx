import { formatDate, TagsList } from "../../Utils";

export interface RealisationProps {
  idRealisation: string;
  title: string;
  tags: string[];
  date: Date;
  dateEnd: Date;
  children: React.ReactNode;
  current?: string;
}

export const Realisation: React.FC<RealisationProps> = ({
  idRealisation,
  title,
  tags,
  date,
  dateEnd,
  children,
  current,
}) => {
  function Status({ dateEnd }: { dateEnd: Date }) {
    const today = new Date();

    return dateEnd > today ? (
      <span className="tag">En cours</span>
    ) : (
      <span></span>
    );
  }

  return (
    <div className="realisation subcontainer" id={idRealisation}>
      <h2>{title}</h2>
      <div className="timeperiod">
        <span className="tag">
          Période : {formatDate(date)} - {formatDate(dateEnd)}
        </span>
        <Status dateEnd={dateEnd} />
      </div>
      <div className="realisation-content">{children}</div>

      <TagsList tags={tags} current={current} />
    </div>
  );
};
