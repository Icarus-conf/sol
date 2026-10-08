import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { System } from "./system";

export function CanvasRoot() {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 14.5, 30], fov: 42, near: 0.1, far: 260 }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#07080c");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
      style={{ touchAction: "none" }}
    >
      <System />
    </Canvas>
  );
}
