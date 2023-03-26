import * as THREE from 'three';


const EPSILON = 0.0001;

export function isZero(n: number): boolean {
    return -EPSILON <= n && n <= EPSILON;
}

export function equals(a: number, b: number, epsilon: number = EPSILON): boolean {
    return a - epsilon <= b && b <= a + epsilon;
}

export function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(n, max));
}

export function vectorHeading(v: THREE.Vector3): number {
    let bearing = Math.round(Math.atan2(v.x, -v.z) / (2 * Math.PI) * 360);
    if (bearing < 0) {
        bearing = 360 + bearing;
    }
    return bearing;
}

export function roundToZero(v: THREE.Vector3, epsilon: number = EPSILON): THREE.Vector3 {
    if (equals(v.x, 0.0, epsilon)) {
        v.x = 0;
    }
    if (equals(v.y, 0.0, epsilon)) {
        v.y = 0;
    }
    if (equals(v.z, 0.0, epsilon)) {
        v.z = 0;
    }
    return v;
}

export function easeOutCirc(x: number): number {
    return Math.sqrt(1 - (x - 1) * (x - 1));
}
