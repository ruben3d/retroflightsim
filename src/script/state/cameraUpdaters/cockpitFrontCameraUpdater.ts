import * as THREE from 'three';
import { PLANE_COCKPIT_OFFSET_Y, PLANE_COCKPIT_OFFSET_Z } from "../../defs";
import { PlayerEntity } from "../../scene/entities/player";
import { UP } from '../../utils/math';
import { CameraUpdater } from "./cameraUpdater";

export class CockpitFrontCameraUpdater extends CameraUpdater {

    private _v = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera) {
        super(actor, camera);
    }

    update(delta: number): void {
        const forward = this.actor.getWorldDirection(this._v);
        this.camera.position
            .copy(this.actor.position)
            .addScaledVector(forward, PLANE_COCKPIT_OFFSET_Z);

        const up = this.actor.getWorldUp(this._v);
        this.camera.position
            .addScaledVector(up, PLANE_COCKPIT_OFFSET_Y);

        this.camera.quaternion.copy(this.actor.quaternion);
        // The three.js camera forward vector points towards -Z in opposition to
        // the Object3D pointing towards +Z
        this.camera.rotateOnAxis(UP, Math.PI);
    }
}
