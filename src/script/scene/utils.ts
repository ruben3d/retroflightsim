import * as THREE from 'three';
import { FogQuality } from '../config/profiles/profile';
import { COCKPIT_FOV, H_RES, V_RES } from '../defs';
import { visibleWidthAtDistance } from '../render/helpers';
import { GroundTargetEntity } from './entities/groundTarget';
import { PlayerEntity } from './entities/player';
import { SceneMaterialData, SceneMaterialUniforms } from './materials/materials';

const camDir = new THREE.Vector3();
const camPos = new THREE.Vector3();
const pos = new THREE.Vector3();

export function updateUniforms(this: THREE.Mesh, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group) {
    const m = (material as THREE.ShaderMaterial);
    const u = m.uniforms as SceneMaterialUniforms;
    const data = m.userData as SceneMaterialData | undefined;

    if ('isPerspectiveCamera' in camera === false) {
        camDir.set(0, -1, 0);
    } else {
        camera.getWorldDirection(camDir).setY(0.0).normalize();
    }
    camPos.copy(camera.position);
    const camD = camPos.negate().dot(camDir);
    const fogType = data ? data.fog : FogQuality.LOW;

    if (data?.shaded) {
        this.getWorldPosition(pos.copy(this.position));

        if (fogType === FogQuality.HIGH) {
            u.distance.value = pos.distanceTo(camera.position);
        } else if (fogType === FogQuality.LOW) {
            u.distance.value = pos.dot(camDir) + camD;
        } else {
            u.distance.value = 0;
        }

        (u.normalModelMatrix.value as THREE.Matrix3).getNormalMatrix(this.matrixWorld);
    } else {
        (u.vCameraPos.value as THREE.Vector3).copy(camera.position);
        (u.vCameraNormal.value as THREE.Vector3).copy(camDir);
        u.vCameraD.value = camD;
    }
    u.fogType.value = fogType;

    const target = renderer.getRenderTarget();
    u.halfWidth.value = Math.floor((target?.width || H_RES) * 0.5);
    u.halfHeight.value = Math.floor((target?.height || V_RES) * 0.5);

    m.uniformsNeedUpdate = true;
}

const TARGET_SIZE_FACTOR = 2.0;
const TARGET_MAX_SIZE = 250;
const TARGET_CAMERA_MIN_ALTITUDE = 15;
const TARGET_CAMERA_ADAPTIVE_THRESHOLD = 5000;
const TARGET_CAMERA_CONSTANT_NEAR = 10;
const TARGET_CAMERA_CONSTANT_FAR = 10000;

// Returns the camera zoom factor
export function updateTargetCamera(actor: PlayerEntity, mainCamera: THREE.PerspectiveCamera, targetCamera: THREE.PerspectiveCamera): number {
    const weaponsTarget = actor.weaponsTarget;
    if (!weaponsTarget) return 0;

    const d = actor.position.distanceTo(weaponsTarget.position);
    const weaponsTargetZoomFactor = getWeaponsTargetZoomFactor(mainCamera, weaponsTarget, d);

    targetCamera.position.copy(actor.position).setY(Math.max(TARGET_CAMERA_MIN_ALTITUDE, actor.position.y));
    camPos.addVectors(weaponsTarget.position, weaponsTarget.localCenter);
    targetCamera.lookAt(camPos);
    targetCamera.fov = COCKPIT_FOV * 1 / weaponsTargetZoomFactor;
    if (d > TARGET_CAMERA_ADAPTIVE_THRESHOLD) {
        targetCamera.near = actor.position.distanceTo(weaponsTarget.position) / 2;
        targetCamera.far = actor.position.distanceTo(weaponsTarget.position) * 2;
    } else {
        targetCamera.near = TARGET_CAMERA_CONSTANT_NEAR;
        targetCamera.far = TARGET_CAMERA_CONSTANT_FAR;
    }
    targetCamera.updateProjectionMatrix();
    return weaponsTargetZoomFactor;
}

function getWeaponsTargetZoomFactor(mainCamera: THREE.PerspectiveCamera, weaponsTarget: GroundTargetEntity, distance: number): number {
    const farWidth = visibleWidthAtDistance(mainCamera, distance);
    const relativeSize = TARGET_SIZE_FACTOR * Math.min(TARGET_MAX_SIZE, weaponsTarget.maxSize) / farWidth;
    return Math.pow(2, relativeSize >= 1 ? 0 : Math.max(0, Math.floor(-Math.log2(relativeSize))));
}