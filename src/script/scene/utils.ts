import * as THREE from 'three';
import { SceneMaterialUniforms } from './materials/materials';

export function updateUniforms(this: THREE.Mesh, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group) {
    const m = (material as THREE.ShaderMaterial);
    const u = m.uniforms as SceneMaterialUniforms;
    const n = u.vCameraNormal.value as THREE.Vector3;
    camera.getWorldDirection(n).setY(0.0).normalize();
    const p = camera.getWorldPosition(new THREE.Vector3());
    u.vCameraD.value = p.multiplyScalar(-1).dot(n);
    m.uniformsNeedUpdate = true;

    if (m.userData?.shaded) {
        const matrix = u.normalModelMatrix.value as THREE.Matrix3;
        matrix.getNormalMatrix(this.matrixWorld);
    }
}
