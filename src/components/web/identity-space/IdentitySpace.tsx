import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import { Scene } from "./Scene";
import { detectWebGL } from "./webgl";

// Корневой контейнер Identity Space: полноэкранный, гейт по WebGL (иначе 2D-fallback),
// оверлей с кнопкой «Назад». Очистку Three.js ресурсов R3F делает сам при размонтировании
// <Canvas> (уход с роута) - отдельного teardown не требуется.
export default function IdentitySpace() {
  const navigate = useNavigate();
  const webglOk = useMemo(() => detectWebGL(), []);

  return (
    <div style={styles.root}>
      {webglOk ? (
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ position: [6, 3, 10], fov: 35, near: 0.1, far: 300 }}
          style={styles.canvas}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      ) : (
        <div style={styles.fallback}>
          <p>Твоё устройство пока не поддерживает 3D-сцену.</p>
        </div>
      )}

      <div style={styles.topbar}>
        <button style={styles.back} onClick={() => navigate(-1)}>← Назад</button>
        <span style={styles.title}>Identity Space</span>
        <span style={styles.spacer} />
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  root: { position: "fixed", inset: 0, background: "#05070f", overflow: "hidden" },
  canvas: { position: "absolute", inset: 0 },
  fallback: {
    position: "absolute", inset: 0, display: "flex", alignItems: "center",
    justifyContent: "center", color: "rgba(255,255,255,0.7)", padding: 24, textAlign: "center",
  },
  topbar: {
    position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "16px 18px", pointerEvents: "none",
  },
  back: {
    pointerEvents: "auto", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
    color: "#fff", borderRadius: 999, padding: "8px 14px", fontSize: 14, cursor: "pointer",
  },
  title: {
    color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
  },
  spacer: { width: 84 },
};
