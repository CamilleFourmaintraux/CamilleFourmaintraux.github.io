import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = { videoId: string; title: string };

// Shows a thumbnail first: the YouTube player (and its console noise) only
// loads once the visitor clicks play.
export default function YouTubeEmbed({ videoId, title }: Props) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        className="youtube-embed"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    );
  }

  return (
    <button
      type="button"
      className="youtube-embed youtube-facade"
      onClick={() => setPlaying(true)}
      aria-label={t("youtube.play", { title })}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
      />
      <span className="youtube-play" aria-hidden="true">
        <i className="fas fa-play"></i>
      </span>
    </button>
  );
}
