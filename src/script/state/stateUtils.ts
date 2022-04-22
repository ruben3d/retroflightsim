import * as THREE from 'three';
import { COCKPIT_FAR, COCKPIT_FOV, PLANE_DISTANCE_TO_GROUND } from "../defs";

export function restoreMainCameraParameters(camera: THREE.PerspectiveCamera) {
    camera.fov = COCKPIT_FOV;
    camera.near = PLANE_DISTANCE_TO_GROUND;
    camera.far = COCKPIT_FAR;
    camera.updateProjectionMatrix();
}
