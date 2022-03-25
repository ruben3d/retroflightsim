import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { FORWARD, UP } from "../../scene/scene";
import { CameraUpdater } from "./cameraUpdater";

export class ExteriorBehindCameraUpdater extends CameraUpdater {

    private tmpVector = new THREE.Vector3();
    private tmpPos = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera) {
        super(actor, camera);
    }

    update(delta: number): void {
        this.tmpVector
            .copy(FORWARD)
            .applyQuaternion(this.actor.quaternion)
            .setY(0)
            .normalize();
        this.tmpPos
            .copy(this.actor.position)
            .add(this.tmpVector);
        this.camera.position
            .copy(this.actor.position)
        this.camera.lookAt(this.tmpPos);
        this.camera.position
            .addScaledVector(UP, 5)
            .addScaledVector(this.tmpVector, -40.0);
    }
}
