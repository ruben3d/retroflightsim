import * as THREE from 'three';
import { SceneMaterialUniforms } from './materials/materials';

const camDir = new THREE.Vector3();
const camPos = new THREE.Vector3();

export function updateUniforms(this: THREE.Mesh, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group) {
    const m = (material as THREE.ShaderMaterial);
    const u = m.uniforms as SceneMaterialUniforms;

    camera.getWorldDirection(camDir).setY(0.0).normalize();
    camera.getWorldPosition(camPos);
    const camD = camPos.negate().dot(camDir);

    if (m.userData?.shaded) {
        (u.normalModelMatrix.value as THREE.Matrix3).getNormalMatrix(this.matrixWorld);
        u.distance.value = this.position.dot(camDir) + camD;
    } else {
        (u.vCameraNormal.value as THREE.Vector3).copy(camDir);
        u.vCameraD.value = camD;
    }
    m.uniformsNeedUpdate = true;
}
