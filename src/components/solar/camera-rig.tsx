import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { focusDistance, getBody } from "@/lib/solar/bodies";
import { bodyObjects } from "@/lib/solar/registry";
import { useSolarStore } from "@/lib/solar/store";

const OVERVIEW_POS = new THREE.Vector3(0, 14.5, 30);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);

type Fly = {
  fromPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  approachDir: THREE.Vector3;
  distance: number;
  t: number;
  duration: number;
  followAfter: boolean;
  id: string | null;
};

type OrbitHandle = {
  target: THREE.Vector3;
  update: () => void;
  enabled: boolean;
};

const tmpTarget = new THREE.Vector3();
const tmpPos = new THREE.Vector3();

export function CameraRig() {
  const focusedId = useSolarStore((s) => s.focusedId);
  const controlsRef = useRef<OrbitHandle | null>(null);
  const { camera } = useThree();
  const fly = useRef<Fly | null>(null);
  const follow = useRef(false);
  const lastTarget = useRef(new THREE.Vector3());
  const appliedId = useRef<string | null | undefined>(undefined);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const controls = controlsRef.current;
    if (!controls) return;

    if (appliedId.current !== focusedId) {
      if (focusedId && !bodyObjects[focusedId]) return;

      const fromPos = camera.position.clone();
      const fromTarget = controls.target.clone();

      if (!focusedId) {
        const dir = OVERVIEW_POS.clone().sub(OVERVIEW_TARGET).normalize();
        fly.current = {
          fromPos,
          fromTarget,
          approachDir: dir,
          distance: OVERVIEW_POS.distanceTo(OVERVIEW_TARGET),
          t: 0,
          duration: 1.2,
          followAfter: false,
          id: null,
        };
        follow.current = false;
      } else {
        const body = getBody(focusedId);
        const obj = bodyObjects[focusedId];
        if (!body || !obj) return;
        obj.getWorldPosition(tmpTarget);
        const dir = camera.position.clone().sub(tmpTarget);
        if (dir.lengthSq() < 0.0001) dir.set(0.55, 0.32, 1);
        dir.normalize();
        fly.current = {
          fromPos,
          fromTarget,
          approachDir: dir,
          distance: focusDistance(body),
          t: 0,
          duration: 1.15,
          followAfter: true,
          id: focusedId,
        };
        follow.current = false;
      }
      appliedId.current = focusedId;
    }

    const f = fly.current;
    if (f) {
      controls.enabled = false;
      if (f.id) {
        const obj = bodyObjects[f.id];
        if (obj) obj.getWorldPosition(tmpTarget);
        else tmpTarget.copy(OVERVIEW_TARGET);
      } else {
        tmpTarget.copy(OVERVIEW_TARGET);
      }
      tmpPos.copy(tmpTarget).addScaledVector(f.approachDir, f.distance);
      f.t += d;
      const u = Math.min(1, f.t / f.duration);
      const e = u * u * (3 - 2 * u);
      camera.position.lerpVectors(f.fromPos, tmpPos, e);
      controls.target.lerpVectors(f.fromTarget, tmpTarget, e);
      controls.update();
      if (u >= 1) {
        lastTarget.current.copy(controls.target);
        follow.current = f.followAfter;
        fly.current = null;
        controls.enabled = true;
      }
      return;
    }

    controls.enabled = true;

    if (follow.current) {
      const id = useSolarStore.getState().focusedId;
      if (!id) return;
      const obj = bodyObjects[id];
      if (!obj) return;
      obj.getWorldPosition(tmpTarget);
      const dx = tmpTarget.x - lastTarget.current.x;
      const dy = tmpTarget.y - lastTarget.current.y;
      const dz = tmpTarget.z - lastTarget.current.z;
      camera.position.x += dx;
      camera.position.y += dy;
      camera.position.z += dz;
      controls.target.x += dx;
      controls.target.y += dy;
      controls.target.z += dz;
      lastTarget.current.copy(tmpTarget);
    }
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef as never}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={1.4}
      maxDistance={96}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI * 0.92}
      rotateSpeed={0.72}
      zoomSpeed={0.85}
    />
  );
}
