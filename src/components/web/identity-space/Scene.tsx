import { useEffect, useRef, type ElementRef } from "react";
import { CameraControls } from "@react-three/drei";

import { Hangar } from "./Hangar";
import { Podium } from "./Podium";

// Содержимое 3D-сцены. Свет - лёгкий (без тяжёлых источников), управление камерой -
// орбита + zoom (drei CameraControls). Стартовое кадрирование смотрит на подиум.
export function Scene() {
  const controls = useRef<ElementRef<typeof CameraControls>>(null);

  useEffect(() => {
    // Позиция камеры -> цель (подиум чуть выше пола). Плавность не нужна на старте.
    controls.current?.setLookAt(6, 3, 10, 0, 1.1, 0, false);
  }, []);

  return (
    <>
      <color attach="background" args={["#05070f"]} />
      <fog attach="fog" args={["#05070f", 24, 62]} />

      <hemisphereLight args={["#2a3a66", "#05070a", 0.5]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 14, 6]} intensity={1.1} />
      <pointLight position={[0, 5, 4]} intensity={40} color="#3a6bff" distance={30} decay={2} />

      <Hangar />
      <Podium />

      <CameraControls
        ref={controls}
        makeDefault
        minDistance={2.5}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2 - 0.03}
      />
    </>
  );
}
