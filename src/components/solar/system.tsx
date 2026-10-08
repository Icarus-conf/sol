import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import {
  BODIES,
  childrenOf,
  EARTH_YEAR,
  PRIMARY_BODIES,
  getBody,
  type Body,
} from "@/lib/solar/bodies";
import { bodyObjects } from "@/lib/solar/registry";
import { simClock, useSolarStore } from "@/lib/solar/store";
import {
  createCloudTexture,
  createPlanetTexture,
  createRingTexture,
} from "@/lib/solar/textures";
import { CameraRig } from "./camera-rig";

const tmpVec = new THREE.Vector3();

const SUN_VERT = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SUN_FRAG = /* glsl */ `
varying vec3 vPos;
uniform float uTime;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 p = normalize(vPos) * 3.0;
  float n = fbm(p + vec3(uTime * 0.07, uTime * 0.03, -uTime * 0.045));
  vec3 cool = vec3(0.78, 0.28, 0.05);
  vec3 mid = vec3(1.0, 0.6, 0.16);
  vec3 hot = vec3(1.0, 0.93, 0.74);
  vec3 col = mix(cool, mid, clamp(n * 1.35, 0.0, 1.0));
  col = mix(col, hot, clamp((n - 0.42) * 2.1, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

const ATM_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const ATM_FRAG = /* glsl */ `
uniform vec3 uColor;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = pow(1.0 - abs(dot(vV, normalize(vN))), 2.6);
  gl_FragColor = vec4(uColor, f * 0.62);
}
`;

function SimulationClock() {
  useFrame((_, delta) => {
    const { paused, speed } = useSolarStore.getState();
    if (paused) return;
    const d = Math.min(delta, 0.1) * speed;
    simClock.time += d;
    simClock.years += d / EARTH_YEAR;
  });
  return null;
}

function pointerSelect(id: string) {
  const start = { x: 0, y: 0 };
  return {
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
      useSolarStore.getState().setHoveredId(id);
    },
    onPointerOut: () => {
      document.body.style.cursor = "auto";
      const s = useSolarStore.getState();
      if (s.hoveredId === id) s.setHoveredId(null);
    },
    onPointerDown: (e: { clientX: number; clientY: number }) => {
      start.x = e.clientX;
      start.y = e.clientY;
    },
    onClick: (e: { clientX: number; clientY: number; stopPropagation: () => void }) => {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (dx * dx + dy * dy > 36) return;
      e.stopPropagation();
      useSolarStore.getState().setFocusedId(id);
    },
  };
}

function Atmosphere({ radius, color }: { radius: number; color: string }) {
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) } }),
    [color],
  );
  return (
    <mesh scale={1.055}>
      <sphereGeometry args={[radius, 32, 24]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
        uniforms={uniforms}
        vertexShader={ATM_VERT}
        fragmentShader={ATM_FRAG}
      />
    </mesh>
  );
}

function Sun({ body }: { body: Body }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: SUN_VERT,
        fragmentShader: SUN_FRAG,
      }),
    [],
  );
  const spin = useRef<THREE.Group>(null);
  const focus = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    bodyObjects[body.id] = focus.current;
    return () => {
      bodyObjects[body.id] = null;
    };
  }, [body.id]);

  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((_, delta) => {
    mat.uniforms.uTime.value += Math.min(delta, 0.1);
    const { paused, speed } = useSolarStore.getState();
    if (paused || !spin.current) return;
    const d = Math.min(delta, 0.1) * speed;
    spin.current.rotation.y += ((Math.PI * 2) / body.rotationPeriod) * d;
  });

  const events = pointerSelect(body.id);

  return (
    <group ref={focus}>
      <group ref={spin} rotation={[0, 0, body.tilt]}>
        <mesh {...events}>
          <sphereGeometry args={[body.radius, 64, 48]} />
          <primitive object={mat} attach="material" />
        </mesh>
      </group>
      {[1.12, 1.28, 1.52].map((s, i) => (
        <mesh key={s} scale={s}>
          <sphereGeometry args={[body.radius, 32, 24]} />
          <meshBasicMaterial
            color={i === 2 ? "#f0b45a" : "#ffd089"}
            transparent
            opacity={i === 0 ? 0.22 : i === 1 ? 0.1 : 0.045}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      <pointLight color="#fff4dd" intensity={4.8} decay={0.42} />
      <BodyLabel body={body} />
    </group>
  );
}

function Rings({
  inner,
  outer,
  kind,
}: {
  inner: number;
  outer: number;
  kind: "saturn" | "uranus";
}) {
  const map = useMemo(() => createRingTexture(kind), [kind]);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 128]} />
      <meshBasicMaterial
        map={map}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        opacity={0.95}
      />
    </mesh>
  );
}

function Planet({ body }: { body: Body }) {
  const orbit = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const focus = useRef<THREE.Group>(null);
  const map = useMemo(() => createPlanetTexture(body.id), [body.id]);
  const clouds = useMemo(
    () => (body.clouds ? createCloudTexture() : null),
    [body.clouds],
  );

  useLayoutEffect(() => {
    bodyObjects[body.id] = focus.current;
    return () => {
      bodyObjects[body.id] = null;
    };
  }, [body.id]);

  useEffect(() => {
    return () => {
      map.dispose();
      clouds?.dispose();
    };
  }, [map, clouds]);

  useFrame((_, delta) => {
    const { paused, speed } = useSolarStore.getState();
    if (paused) return;
    const d = Math.min(delta, 0.1) * speed;
    if (orbit.current) {
      orbit.current.rotation.y += ((Math.PI * 2) / body.orbitPeriod) * d;
    }
    if (spin.current) {
      spin.current.rotation.y += ((Math.PI * 2) / body.rotationPeriod) * d;
    }
  });

  const events = pointerSelect(body.id);
  const kids = childrenOf(body.id);
  const roughness = body.kind === "planet" && body.radius > 0.9 ? 0.55 : 0.82;

  return (
    <group rotation={[body.inclination, 0, 0]}>
      <group ref={orbit} rotation={[0, body.phase, 0]}>
        <group ref={focus} position={[body.orbitRadius, 0, 0]}>
          <group rotation={[0, 0, body.tilt]}>
            <group ref={spin}>
              <mesh {...events}>
                <sphereGeometry args={[body.radius, 48, 32]} />
                <meshStandardMaterial
                  map={map}
                  roughness={roughness}
                  metalness={0.04}
                  emissive={body.color}
                  emissiveIntensity={0.1}
                />
              </mesh>
              {clouds && (
                <mesh scale={1.02}>
                  <sphereGeometry args={[body.radius, 48, 32]} />
                  <meshStandardMaterial
                    map={clouds}
                    transparent
                    depthWrite={false}
                    roughness={1}
                    metalness={0}
                  />
                </mesh>
              )}
            </group>
            {body.rings && (
              <Rings
                inner={body.radius * body.rings.inner}
                outer={body.radius * body.rings.outer}
                kind={body.id === "uranus" ? "uranus" : "saturn"}
              />
            )}
          </group>
          {body.atmosphere && (
            <Atmosphere radius={body.radius} color={body.atmosphere} />
          )}
          <BodyLabel body={body} />
          {kids.map((child) => (
            <Planet key={child.id} body={child} />
          ))}
        </group>
      </group>
      <OrbitRing radius={body.orbitRadius} color={body.color} />
    </group>
  );
}

function BodyLabel({ body }: { body: Body }) {
  const show = useSolarStore((s) => s.showLabels);
  const focused = useSolarStore((s) => s.focusedId);
  const hovered = useSolarStore((s) => s.hoveredId);
  const { camera } = useThree();
  const wrapRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obj = bodyObjects[body.id];
    if (!obj) return;
    obj.getWorldPosition(tmpVec);
    const dist = camera.position.distanceTo(tmpVec);
    const near = dist < Math.max(7.5, body.radius * 12);
    const force = focused === body.id || hovered === body.id;
    const moonOk =
      body.kind !== "moon" ||
      focused === body.id ||
      hovered === body.id ||
      focused === body.parent;
    const visible = Boolean(show && moonOk && (force || near));
    el.style.opacity = visible ? "1" : "0";
    el.style.visibility = visible ? "visible" : "hidden";
  });

  if (!show) return null;

  return (
    <Html
      position={[0, body.radius + 0.22, 0]}
      center
      sprite
      pointerEvents="none"
      zIndexRange={[8, 0]}
    >
      <div
        ref={wrapRef}
        className="rounded-full border border-border bg-card/90 px-2 py-0.5 font-sans text-xs tracking-wide text-foreground whitespace-nowrap"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        {body.name}
      </div>
    </Html>
  );
}

function OrbitRing({ radius, color }: { radius: number; color: string }) {
  const visible = useSolarStore((s) => s.showOrbits);
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = 160;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    const obj = new THREE.Line(geom, mat);
    obj.frustumCulled = false;
    return obj;
  }, [radius, color]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, [line]);

  if (!visible) return null;
  return <primitive object={line} />;
}

function MotionTrail({ id, color, length = 140 }: { id: string; color: string; length?: number }) {
  const visible = useSolarStore((s) => s.showTrails);
  const pos = useMemo(() => new Float32Array(length * 3), [length]);
  const line = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const obj = new THREE.Line(geom, mat);
    obj.frustumCulled = false;
    return obj;
  }, [color, pos]);
  const primed = useRef(false);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, [line]);

  useFrame(() => {
    if (!visible) {
      primed.current = false;
      return;
    }
    const obj = bodyObjects[id];
    if (!obj) return;
    obj.getWorldPosition(tmpVec);
    const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
    if (!primed.current) {
      for (let i = 0; i < length; i++) {
        pos[i * 3] = tmpVec.x;
        pos[i * 3 + 1] = tmpVec.y;
        pos[i * 3 + 2] = tmpVec.z;
      }
      primed.current = true;
    } else {
      pos.copyWithin(0, 3);
      const o = (length - 1) * 3;
      pos[o] = tmpVec.x;
      pos[o + 1] = tmpVec.y;
      pos[o + 2] = tmpVec.z;
    }
    attr.needsUpdate = true;
  });

  if (!visible) return null;
  return <primitive object={line} />;
}

function AsteroidBelt() {
  const COUNT = 280;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const items: { r: number; theta: number; y: number; s: number; speed: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      items.push({
        r: 16.05 + Math.random() * 3.5,
        theta: Math.random() * Math.PI * 2,
        y: (Math.random() - 0.5) * 0.42,
        s: 0.018 + Math.random() * 0.045,
        speed: (Math.PI * 2) / (EARTH_YEAR * (4.2 + Math.random() * 3.4)),
      });
    }
    return items;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const primed = useRef(false);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { paused, speed } = useSolarStore.getState();
    const t = simClock.time;
    if (paused && primed.current) return;
    for (let i = 0; i < COUNT; i++) {
      const a = data[i];
      const th = a.theta + t * a.speed;
      dummy.position.set(Math.cos(th) * a.r, a.y, Math.sin(th) * a.r);
      dummy.rotation.set(th, th * 0.4, a.y);
      dummy.scale.setScalar(a.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    primed.current = true;
    void speed;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#7a746c"
        roughness={0.95}
        metalness={0.08}
        emissive="#7a746c"
        emissiveIntensity={0.06}
      />
    </instancedMesh>
  );
}

export function System() {
  return (
    <>
      <color attach="background" args={["#07080c"]} />
      <Stars radius={140} depth={70} count={5500} factor={2.6} saturation={0} fade speed={0.35} />
      <ambientLight intensity={0.055} />
      <hemisphereLight args={["#222a3c", "#0c0a08", 0.2]} />
      <SimulationClock />
      <Sun body={getBody("sun")!} />
      {PRIMARY_BODIES.filter((b) => b.id !== "sun").map((b) => (
        <Planet key={b.id} body={b} />
      ))}
      {BODIES.filter((b) => b.orbitRadius > 0).map((b) => (
        <MotionTrail key={`trail-${b.id}`} id={b.id} color={b.color} />
      ))}
      <AsteroidBelt />
      <CameraRig />
    </>
  );
}
