import * as THREE from 'three';
import { PLANE_COCKPIT_OFFSET_Y, PLANE_COCKPIT_OFFSET_Z } from "../../defs";
import { PlayerEntity } from "../../scene/entities/player";
import { FORWARD, UP } from "../../scene/scene";
import { CameraUpdater } from "./cameraUpdater";

export class CockpitFrontCameraUpdater extends CameraUpdater {

    private tmpVector = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera) {
        super(actor, camera);
    }

    update(delta: number): void {
        this.tmpVector
            .copy(UP)
            .applyQuaternion(this.actor.quaternion);
        this.camera.position.copy(this.actor.position).addScaledVector(this.tmpVector, PLANE_COCKPIT_OFFSET_Y);

        this.tmpVector
            .copy(FORWARD)
            .applyQuaternion(this.actor.quaternion);
        this.camera.position.addScaledVector(this.tmpVector, PLANE_COCKPIT_OFFSET_Z);

        this.camera.quaternion.copy(this.actor.quaternion);
    }
}
