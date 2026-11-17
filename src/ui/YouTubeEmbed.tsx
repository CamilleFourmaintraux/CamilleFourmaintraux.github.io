import { useState } from "react";
import { useTranslation } from "react-i18next";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

type Props = { videoId: string; title: string };

// Shows a thumbnail first: the YouTube player (and its trackers) only loads
// once the visitor asks for the video.
export default function YouTubeEmbed({ videoId, title }: Props) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        className="youtube"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className="youtube youtube-facade"
      onClick={() => setPlaying(true)}
      aria-label={t("youtube.play", { title })}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        width={480}
        height={360}
        loading="lazy"
        decoding="async"
      />
      <span className="youtube-play" aria-hidden="true">
        <Icon icon={faPlay} />
      </span>
    </button>
  );
}
