import * as THREE from 'three';
import { MAX_ALTITUDE, MAX_SPEED, PITCH_RATE, PLANE_DISTANCE_TO_GROUND, ROLL_RATE, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, YAW_RATE } from "../../defs";
import { FORWARD, UP } from '../../scene/scene';
import { isZero } from "../../utils/math";
import { FlightModel } from './flightModel';

export class DebugFlightModel extends FlightModel {

    private speed: number = 0;

    private _v: THREE.Vector3 = new THREE.Vector3();
    private _w: THREE.Vector3 = new THREE.Vector3();

    step(delta: number): void {
        this.effectiveThrottle = this.throttle;

        // Roll control
        if (!isZero(this.roll)) {
            this.obj.rotateZ(this.roll * ROLL_RATE * delta);
        }

        // Pitch control
        if (!isZero(this.pitch)) {
            this.obj.rotateX(-this.pitch * PITCH_RATE * delta);
        }

        // Yaw control
        if (!isZero(this.yaw)) {
            this.obj.rotateY(-this.yaw * YAW_RATE * delta);
        }

        // Automatic yaw when rolling
        const forward = this.obj.getWorldDirection(this._v);
        if (-0.99 < forward.y && forward.y < 0.99) {
            const prjForward = forward.setY(0);
            const up = this._w.copy(UP).applyQuaternion(this.obj.quaternion);
            const prjUp = up.projectOnPlane(prjForward).setY(0);
            const sign = (prjForward.x * prjUp.z - prjForward.z * prjUp.x) > 0 ? -1 : 1;
            this.obj.rotateOnWorldAxis(UP, sign * prjUp.length() * prjUp.length() * prjForward.length() * 2.0 * YAW_RATE * delta);
        }

        // Movement
        this.speed = this.effectiveThrottle * MAX_SPEED;
        this.obj.translateZ(this.speed * delta);

        // Avoid ground crashes
        if (this.obj.position.y < PLANE_DISTANCE_TO_GROUND) {
            this.obj.position.y = PLANE_DISTANCE_TO_GROUND;
            const d = this.obj.getWorldDirection(this._v);
            if (d.y > 0.0) {
                d.setY(0).add(this.obj.position);
                this.obj.lookAt(d);
            }
        }

        // Avoid flying too high
        if (this.obj.position.y > MAX_ALTITUDE) {
            this.obj.position.y = MAX_ALTITUDE;
        }

        // Avoid flying out of bounds, wraps around
        const terrainHalfSize = 2.5 * TERRAIN_SCALE * TERRAIN_MODEL_SIZE;
        if (this.obj.position.x > terrainHalfSize) this.obj.position.x = -terrainHalfSize;
        if (this.obj.position.x < -terrainHalfSize) this.obj.position.x = terrainHalfSize;
        if (this.obj.position.z > terrainHalfSize) this.obj.position.z = -terrainHalfSize;
        if (this.obj.position.z < -terrainHalfSize) this.obj.position.z = terrainHalfSize;

        // Velocity
        this.velocity.copy(FORWARD).applyQuaternion(this.obj.quaternion).multiplyScalar(this.speed);

        this.landed = false;
    }

    getStallStatus(): number {
        return -1;
    }
}
