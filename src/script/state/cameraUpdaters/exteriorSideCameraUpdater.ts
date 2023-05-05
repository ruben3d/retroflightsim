import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { FORWARD, UP } from '../../utils/math';
import { CameraUpdater } from "./cameraUpdater";

export enum ExteriorViewSide {
    LEFT,
    RIGHT
}

export class ExteriorSideCameraUpdater extends CameraUpdater {

    private tmpVector = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera, private side: ExteriorViewSide) {
        super(actor, camera);
    }

    update(delta: number): void {
        const isUp = this.tmpVector
            .copy(UP)
            .applyQuaternion(this.actor.quaternion)
            .dot(UP) >= 0;

        this.tmpVector
            .copy(FORWARD)
            .applyQuaternion(this.actor.quaternion)
            .setY(0)
            .multiplyScalar(isUp ? 1.0 : -1)
            .normalize()
            .set(this.tmpVector.z, this.tmpVector.y, -this.tmpVector.x);
        this.camera.position
            .copy(this.actor.position)
            .addScaledVector(this.tmpVector, 35 * (this.side === ExteriorViewSide.RIGHT && isUp ? -1 : 1));
        this.camera.lookAt(this.actor.position);
    }
}
