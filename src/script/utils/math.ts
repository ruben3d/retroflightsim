import * as THREE from 'three';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();

const EPSILON = 0.0001;

export const ZERO = new THREE.Vector3(0, 0, 0);
export const UP = new THREE.Vector3(0, 1, 0);
export const FORWARD = new THREE.Vector3(0, 0, 1);
export const RIGHT = new THREE.Vector3(1, 0, 0);

export function isZero(n: number): boolean {
    return -EPSILON <= n && n <= EPSILON;
}

export function equals(a: number, b: number, epsilon: number = EPSILON): boolean {
    return a - epsilon <= b && b <= a + epsilon;
}

export function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(n, max));
}

export function lerp(t: number, n0: number, n1: number): number {
    return n0 + t * (n1 - n0);
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

export function easeOutQuad(x: number) {
    return 1 - (1 - x) * (1 - x);
}
export function easeOutQuint(x: number) {
    return 1 - Math.pow(1 - x, 5);
}

export const PI_OVER_180 = Math.PI / 180.0;
export const N180_OVER_PI = 180.0 / Math.PI;

export function toRadians(degrees: number): number {
    return PI_OVER_180 * degrees;
}

export function toDegrees(radians: number): number {
    return N180_OVER_PI * radians;
}

// Returns [pitch, roll] in radians
export function calculatePitchRoll(actor: {
    quaternion: THREE.Quaternion;
    getWorldDirection: (v: THREE.Vector3) => THREE.Vector3;
}): [number, number] {
    const forward = actor.getWorldDirection(_v);
    const prjForward = _w.copy(forward)
        .setY(0)
        .normalize();
    const pitch = forward.angleTo(prjForward) * Math.sign(forward.y);

    _q.setFromUnitVectors(forward, prjForward);

    const right = _v.copy(RIGHT)
        .applyQuaternion(actor.quaternion)
        .applyQuaternion(_q);
    _q.setFromUnitVectors(prjForward, FORWARD);
    right.applyQuaternion(_q);
    let roll = Math.acos(right.x) * Math.sign(right.y);
    roll = isNaN(roll) ? 0.0 : roll;

    return [pitch, roll];
}
