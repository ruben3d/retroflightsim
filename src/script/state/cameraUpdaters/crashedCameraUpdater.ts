import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { FORWARD, UP } from '../../utils/math';
import { CameraUpdater } from "./cameraUpdater";


const ROTATION_SPEED = 2; // RPM

export class CrashedCameraUpdater extends CameraUpdater {

    private progress: number = 0;

    private _v = new THREE.Vector3();
    private _p = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera) {
        super(actor, camera);
    }

    update(delta: number): void {
        this.progress += delta * 0.5;
        while (this.progress >= (2 * Math.PI)) {
            this.progress -= (2 * Math.PI)
        }

        this.camera.quaternion.setFromAxisAngle(UP, this.progress);

        this._v
            .copy(FORWARD)
            .applyQuaternion(this.camera.quaternion)
            .setY(0)
            .normalize();
        this.camera.position
            .copy(this.actor.position)
        this.camera.position
            .addScaledVector(UP, 25)
            .addScaledVector(this._v, 50.0 * -1);
        this._p
            .copy(this.actor.position)
            .addScaledVector(this._v, 50);
        this.camera.lookAt(this._p);
    }
}