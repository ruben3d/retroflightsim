import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { FORWARD, UP } from '../../utils/math';
import { CameraUpdater } from "./cameraUpdater";


export enum ExteriorViewHeading {
    FRONT,
    BACK
}

export class ExteriorFrontBehindCameraUpdater extends CameraUpdater {

    private _v = new THREE.Vector3();
    private _p = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera, private heading: ExteriorViewHeading) {
        super(actor, camera);
    }

    update(delta: number): void {
        this._v
            .copy(FORWARD)
            .applyQuaternion(this.actor.quaternion)
            .setY(0)
            .normalize();
        this._p
            .copy(this.actor.position)
            .addScaledVector(this._v, this.heading === ExteriorViewHeading.FRONT ? 1 : -1);
        this.camera.position
            .copy(this.actor.position)
        this.camera.lookAt(this._p);
        this.camera.position
            .addScaledVector(UP, 5)
            .addScaledVector(this._v, 40.0 * (this.heading === ExteriorViewHeading.BACK ? 1 : -1));
    }
}
