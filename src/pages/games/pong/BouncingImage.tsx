import React, { useEffect, useRef } from "react";

interface BouncingImageProps {
  width: number; // largeur du conteneur
  height: number; // hauteur du conteneur
  imageSrc: string; // URL de l'image
  imageSize?: number; // taille de l'image (largeur = hauteur)
  speed?: number; // vitesse de déplacement en pixels par frame
}

const BouncingImage: React.FC<BouncingImageProps> = ({
  width,
  height,
  imageSrc,
  imageSize = 50,
  speed = 2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs pour position et vitesse pour éviter les problèmes de closure
  const positionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ dx: speed, dy: speed });

  const imgRef = useRef<HTMLImageElement>(null);

  const HORIZONTAL_OFFSET = Math.round(width / 5);
  const VERTICAL___OFFSET = Math.round(height / 30);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      const pos = { ...positionRef.current };
      const vel = { ...velocityRef.current };

      // Calcul de la nouvelle position
      let newX = pos.x + vel.dx;
      let newY = pos.y + vel.dy;

      // Vérification collision horizontale
      if (newX <= -HORIZONTAL_OFFSET) {
        newX = -HORIZONTAL_OFFSET;
        vel.dx = Math.abs(vel.dx);
        console.log("LEFT COLLISION");
        console.log("Ball position : ", newX, ",", newY);
      } else if (newX + imageSize >= width - HORIZONTAL_OFFSET) {
        console.log("RIGHT COLLISION");
        console.log("Ball position : ", newX, ",", newY);
        newX = width - imageSize - HORIZONTAL_OFFSET;
        vel.dx = -Math.abs(vel.dx);
      }

      // Vérification collision verticale
      if (newY <= -VERTICAL___OFFSET) {
        newY = -VERTICAL___OFFSET;
        vel.dy = Math.abs(vel.dy);
      } else if (newY + imageSize >= height - VERTICAL___OFFSET) {
        newY = height - imageSize - VERTICAL___OFFSET;
        vel.dy = -Math.abs(vel.dy);
      }

      // Mise à jour des refs
      positionRef.current = { x: newX, y: newY };
      velocityRef.current = { dx: vel.dx, dy: vel.dy };

      // Appliquer la position directement à l'image
      if (imgRef.current) {
        imgRef.current.style.left = `${newX}px`;
        imgRef.current.style.top = `${newY}px`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height, imageSize]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "absolute",
        left: 0,
        top: 0,
        //border: "2px solid black",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt="bouncing"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${imageSize}px`,
          height: `${imageSize}px`,
          border: `3px #EB5353 dotted`,
        }}
      />
    </div>
  );
};

export default BouncingImage;
