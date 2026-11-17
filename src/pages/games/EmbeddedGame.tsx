import { faGamepad } from "@fortawesome/free-solid-svg-icons";
import BackHome from "@/ui/BackHome";
import Page from "@/ui/Page";

type Props = { title: string; game: string; width: number; height: number };

/** Game embedded from funhtml5games.com, at its native size. */
export default function EmbeddedGame({ title, game, width, height }: Props) {
  return (
    <Page title={title} icon={faGamepad}>
      <div className="embed-scroll">
        <iframe
          className="embed embed-game"
          src={`https://funhtml5games.com?embed=${game}`}
          title={title}
          width={width}
          height={height}
          scrolling="no"
          loading="lazy"
        />
      </div>
      <BackHome />
    </Page>
  );
}
