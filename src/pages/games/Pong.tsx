import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { faTableTennisPaddleBall } from "@fortawesome/free-solid-svg-icons";
import BackHome from "@/ui/BackHome";
import { prefersReducedMotion } from "@/ui/motion";
import Page from "@/ui/Page";

const WIDTH = 600;
const HEIGHT = 400;
const SIZE = 50;

/** Picture bouncing on the edges of a canvas, paused when off screen. */
function BouncingPicture({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const picture = new Image();
    let x = Math.random() * (WIDTH - SIZE);
    let y = Math.random() * (HEIGHT - SIZE);
    let dx = 5;
    let dy = 3;
    let frame = 0;
    let visible = true;

    const draw = () => {
      context.clearRect(0, 0, WIDTH, HEIGHT);
      context.drawImage(picture, x, y, SIZE, SIZE);
    };
    const step = () => {
      x += dx;
      y += dy;
      if (x <= 0 || x + SIZE >= WIDTH) dx = -dx;
      if (y <= 0 || y + SIZE >= HEIGHT) dy = -dy;
      draw();
      if (visible) frame = requestAnimationFrame(step);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (prefersReducedMotion()) draw();
      else frame = requestAnimationFrame(step);
    };

    picture.onload = start;
    picture.src = src;

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && picture.complete) start();
    });
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className="pong-canvas"
      width={WIDTH}
      height={HEIGHT}
      aria-hidden="true"
    />
  );
}

export default function Pong() {
  const { t } = useTranslation();
  return (
    <Page
      title={t("test.title")}
      icon={faTableTennisPaddleBall}
      lead={<p>Ceci est la page de Pong !</p>}
    >
      <BouncingPicture src="/img/oldFavicon.ico" />
      <p>{t("test.main")}</p>
      <BackHome />
    </Page>
  );
}
