import { useLayoutEffect, useRef } from "react";

// Analog snow, drawn live: nothing to download, so it shows up at once and
// never repeats. Each frame is fresh noise, shaped by the empty screen.

// Size of the noise before it is stretched over the screen: one grain is
// about 1.5 pixel of the displayed screen.
const GRAIN_WIDTH = 128;
const GRAIN_HEIGHT = 96;
// Bluish white of the phosphors, as on the reference capture.
const TINT = [0.93, 1, 1.08];

type Props = {
  active: boolean;
  /** Picture of the empty screen: the snow takes its shape and tint. */
  screen: () => HTMLImageElement | null;
};

// xorshift32: fast enough to fill every frame.
function random(seed: number) {
  let state = seed | 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function fillNoise(data: Uint8ClampedArray, frame: number, next: () => number) {
  // A brighter band rolls down the picture, as when the signal is lost.
  const band = ((frame * 7) % (GRAIN_HEIGHT * 2)) - GRAIN_HEIGHT / 2;
  for (let y = 0; y < GRAIN_HEIGHT; y++) {
    // Each line has its own strength, as the beam sweeps it.
    const distance = Math.abs(y - band);
    const gain =
      0.9 + next() * 0.2 + (distance < 8 ? (1 - distance / 8) * 0.2 : 0);
    let previous = next();
    for (let x = 0; x < GRAIN_WIDTH; x++) {
      // Grains lean on their left neighbor: analog noise streaks sideways.
      const value = next() * 0.65 + previous * 0.35;
      previous = value;
      // Mid grays around 135 out of 255, with bright and dark specks.
      // The pixel array clamps values to 0..255 by itself.
      const level = ((value - 0.5) * 1.45 + 0.56) * 255 * gain;
      const i = (y * GRAIN_WIDTH + x) * 4;
      data[i] = level * TINT[0];
      data[i + 1] = level * TINT[1];
      data[i + 2] = level * TINT[2];
      data[i + 3] = 255;
    }
  }
}

/** Snow over the screen while active, for the switch between two faces. */
export default function Snow({ active, screen }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // A layout effect draws the first frame before the browser paints, so the
  // snow appears in the same frame as the switch.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) return;
    const context = canvas.getContext("2d");
    const grain = document.createElement("canvas");
    grain.width = GRAIN_WIDTH;
    grain.height = GRAIN_HEIGHT;
    const grainContext = grain.getContext("2d");
    if (!context || !grainContext) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    const pixels = grainContext.createImageData(GRAIN_WIDTH, GRAIN_HEIGHT);
    const next = random(Date.now());
    let frame = Math.floor(next() * 1000);
    let request = 0;

    const draw = () => {
      fillNoise(pixels.data, frame++, next);
      grainContext.putImageData(pixels, 0, 0);
      context.globalCompositeOperation = "copy";
      context.imageSmoothingEnabled = true;
      context.drawImage(grain, 0, 0, canvas.width, canvas.height);
      // The empty screen keeps the frame black and lights the glass.
      const picture = screen();
      if (picture?.complete && picture.naturalWidth > 0) {
        context.globalCompositeOperation = "multiply";
        context.drawImage(picture, 0, 0, canvas.width, canvas.height);
      }
      request = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(request);
  }, [active, screen]);

  return (
    <canvas
      ref={canvasRef}
      className={`miku-snow${active ? " is-shown" : ""}`}
      aria-hidden="true"
    />
  );
}
