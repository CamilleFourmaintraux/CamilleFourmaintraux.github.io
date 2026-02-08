import * as React from "react";
import { useEffect, useRef } from "react";

type BouncingImageCanvasProps = {
  canvasWidth: number;
  canvasHeight: number;
  imageSrc: string;

  imageWidth?: number;
  imageHeight?: number;

  speedX?: number;
  speedY?: number;

  backgroundColor?: string;
};

const BouncingImageCanvas: React.FC<BouncingImageCanvasProps> = ({
  canvasWidth = 1000,
  canvasHeight = 1000,
  imageSrc = "public/img/placeholder.png",
  imageWidth = 80,
  imageHeight = 80,
  speedX = 2,
  speedY = 2,
  backgroundColor = "transparent",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = imageSrc;

    let x = Math.random() * (canvasWidth - imageWidth);
    let y = Math.random() * (canvasHeight - imageHeight);
    let dx = speedX;
    let dy = speedY;

    const draw = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      ctx.drawImage(image, x, y, imageWidth, imageHeight);

      x += dx;
      y += dy;

      // Collision horizontale
      if (x <= 0 || x + imageWidth >= canvasWidth) {
        dx *= -1;
      }

      // Collision verticale
      if (y <= 0 || y + imageHeight >= canvasHeight) {
        dy *= -1;
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    image.onload = () => {
      draw();
    };

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [
    canvasWidth,
    canvasHeight,
    imageSrc,
    imageWidth,
    imageHeight,
    speedX,
    speedY,
    backgroundColor,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{ display: "block" }}
    />
  );
};

export default BouncingImageCanvas;
