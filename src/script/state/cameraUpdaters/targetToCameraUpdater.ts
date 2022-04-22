import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { updateTargetCamera } from '../../scene/utils';
import { restoreMainCameraParameters } from '../stateUtils';
import { CameraUpdater } from "./cameraUpdater";

export class TargetToCameraUpdater extends CameraUpdater {

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera) {
        super(actor, camera);
    }

    update(delta: number): void {
        restoreMainCameraParameters(this.camera);
        updateTargetCamera(this.actor, this.camera, this.camera);
    }
}
