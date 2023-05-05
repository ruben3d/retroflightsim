import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from "../../materials/materials";
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";


export const PARTICLE_MESH_ATTR_OFFSET = 'offset';
export const PARTICLE_MESH_ATTR_SCALE = 'scale';
export const PARTICLE_MESH_ATTR_ROTATION = 'rotation';
export const PARTICLE_MESH_ATTR_COLOR = 'color';

export class ParticleMeshModelLibBuilder implements ModelLibBuilder {
    type: string;

    constructor(type: string, private particleCount: number, private particleGeometry: THREE.BufferGeometry, private radius: number) {
        this.type = type;
    }

    build(materials: SceneMaterialManager): Model {
        const offsets = new Array<number>(this.particleCount * 3).fill(0);
        const scales = new Array<number>(this.particleCount * 1).fill(0);
        const rotations = new Array<number>(this.particleCount * 1).fill(0);
        const colors = new Array<number>(this.particleCount * 4).fill(0.2);

        const geometry = new THREE.InstancedBufferGeometry();
        const srcGeometry = this.particleGeometry.clone();
        geometry.index = srcGeometry.index;
        geometry.attributes = srcGeometry.attributes;

        geometry.setAttribute(PARTICLE_MESH_ATTR_OFFSET, new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
        geometry.setAttribute(PARTICLE_MESH_ATTR_SCALE, new THREE.InstancedBufferAttribute(new Float32Array(scales), 1));
        geometry.setAttribute(PARTICLE_MESH_ATTR_ROTATION, new THREE.InstancedBufferAttribute(new Float32Array(rotations), 1));
        geometry.setAttribute(PARTICLE_MESH_ATTR_COLOR, new THREE.InstancedBufferAttribute(new Float32Array(colors), 4));

        const material = materials.build({
            type: SceneMaterialPrimitiveType.PARTICLE_MESH,
            category: PaletteCategory.FX_SMOKE,
            depthWrite: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.onBeforeRender = updateUniforms;
        mesh.frustumCulled = false;

        return {
            lod: [
                {
                    flats: [],
                    volumes: [mesh]
                },
                {
                    flats: [],
                    volumes: [mesh]
                }
            ],
            animations: [],
            maxSize: 2 * this.radius,
            center: new THREE.Vector3()
        };
    }
}