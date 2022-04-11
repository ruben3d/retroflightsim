import * as THREE from 'three';


const EPSILON = 0.0001;

export function isZero(n: number): boolean {
    return -EPSILON <= n && n <= EPSILON;
}

export function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(n, max));
}

export function vectorBearing(v: THREE.Vector3): number {
    let bearing = Math.round(Math.atan2(v.x, -v.z) / (2 * Math.PI) * 360);
    if (bearing < 0) {
        bearing = 360 + bearing;
    }
    return bearing;
}
