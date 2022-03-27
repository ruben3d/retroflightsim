import * as THREE from 'three';
import { SceneMaterialUniforms } from './materials/materials';

const camDir = new THREE.Vector3();
const camPos = new THREE.Vector3();
const pos = new THREE.Vector3();

export function updateUniforms(this: THREE.Mesh, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group) {
    const m = (material as THREE.ShaderMaterial);
    const u = m.uniforms as SceneMaterialUniforms;

    if ('isPerspectiveCamera' in camera === false) {
        camDir.set(0, -1, 0);
    } else {
        camera.getWorldDirection(camDir).setY(0.0).normalize();
    }
    camPos.copy(camera.position);
    const camD = camPos.negate().dot(camDir);

    if (m.userData?.shaded) {
        this.getWorldPosition(pos.copy(this.position));
        (u.normalModelMatrix.value as THREE.Matrix3).getNormalMatrix(this.matrixWorld);
        u.distance.value = pos.dot(camDir) + camD;
    } else {
        (u.vCameraNormal.value as THREE.Vector3).copy(camDir);
        u.vCameraD.value = camD;
    }
    m.uniformsNeedUpdate = true;
}
