import * as THREE from 'three';
import { FORWARD, RIGHT } from '../../scene';
import { PlayerEntity } from '../player';


const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();

export function formatHeading(n: number): string {
    return `00${(((n % 360) + 360) % 360).toFixed(0)}`.slice(-3);
}

export function toFeet(meters: number): number {
    return meters * 3.28084;
}

export function toKnots(metersPerSecond: number): number {
    return metersPerSecond * 1.94384;
}

export function calculatePitchRoll(actor: PlayerEntity): [number, number] {
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