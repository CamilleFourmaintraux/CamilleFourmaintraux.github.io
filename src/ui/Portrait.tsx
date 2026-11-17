import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const MAX_HP = 5;
const HURT_MS = 300;
const PICTURES = {
  idle: "/media/header/me_green-480.webp",
  hurt: "/media/header/me_red-480.webp",
  gone: "/media/header/but_nobody_came-480.webp",
};
// 7 x 6 pixel heart.
const HEART =
  "M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z";

function play(audio: HTMLAudioElement) {
  audio.currentTime = 0;
  // Browsers may refuse to play a sound: the picture still reacts.
  audio.play().catch(() => {});
}

/** Portrait of the home page, with its hidden mini-game: five hits and it is gone. */
export default function Portrait() {
  const { t } = useTranslation();
  const [hp, setHp] = useState(MAX_HP);
  const [hurt, setHurt] = useState(false);
  const sounds = useRef<{
    hurt: HTMLAudioElement;
    reward: HTMLAudioElement;
  } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // The sounds and alternate pictures are fetched on first interest only.
  const warmUp = () => {
    if (sounds.current) return;
    sounds.current = {
      hurt: new Audio("/sfx/oof.mp3"),
      reward: new Audio("/sfx/experience.mp3"),
    };
    new Image().src = PICTURES.hurt;
    new Image().src = PICTURES.gone;
  };

  const hit = () => {
    if (hp <= 0) return;
    warmUp();
    const remaining = hp - 1;
    setHp(remaining);
    setHurt(true);
    if (sounds.current) play(sounds.current.hurt);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setHurt(false);
      if (remaining === 0 && sounds.current) play(sounds.current.reward);
    }, HURT_MS);
  };

  const state = hurt ? "hurt" : hp === 0 ? "gone" : "idle";

  return (
    <div className="portrait">
      <button
        type="button"
        className={`portrait-button is-${state}`}
        onClick={hit}
        onPointerEnter={warmUp}
        onFocus={warmUp}
        aria-label={t("ui.portraitAlt")}
      >
        <img
          src={PICTURES[state]}
          alt=""
          width={480}
          height={640}
          decoding="async"
          fetchPriority="high"
        />
      </button>
      {hp < MAX_HP && (
        <p className="portrait-hp">
          <span className="sr-only" role="status">
            {hp} / {MAX_HP}
          </span>
          {Array.from({ length: MAX_HP }, (_, index) => (
            <svg
              key={index}
              viewBox="0 0 7 6"
              className={index < hp ? "heart" : "heart is-lost"}
              shapeRendering="crispEdges"
              aria-hidden="true"
            >
              <path d={HEART} />
            </svg>
          ))}
        </p>
      )}
    </div>
  );
}
