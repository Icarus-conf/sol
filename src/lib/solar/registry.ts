import type { Object3D } from "three";

/** Live scene-graph nodes keyed by body id. Written from the 3D tree, read by the camera rig. */
export const bodyObjects: Record<string, Object3D | null> = {};
