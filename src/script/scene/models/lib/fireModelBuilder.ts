import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from "../../materials/materials";
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";


export class FireModelLibBuilder implements ModelLibBuilder {
    type: string;

    constructor(type: string, private radius: number) {
        this.type = type;
    }

    build(materials: SceneMaterialManager): Model {
        const geometry = new THREE.CircleBufferGeometry(this.radius, 5);
        geometry.center();
        geometry.rotateX(-Math.PI / 2);
        geometry.rotateY(Math.PI / 4);
        const mesh = new THREE.Mesh(geometry, materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.FX_FIRE,
            depthWrite: false,
            shaded: false
        }));
        mesh.onBeforeRender = updateUniforms;

        return {
            lod: [
                {
                    flats: [mesh],
                    volumes: []
                },
                {
                    flats: [mesh],
                    volumes: []
                }
            ],
            animations: [],
            maxSize: 2 * this.radius,
            center: new THREE.Vector3()
        };
    }
}