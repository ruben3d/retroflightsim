import * as THREE from 'three';
import { SceneMaterialManager } from "../../materials/materials";
import { PaletteCategory } from '../../palettes/palette';
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";

const RADIUS = 700;
const HEIGHT = 300;
const FACES = 4;

export class HillModelLibBuilder implements ModelLibBuilder {
    type: string = 'hill';

    build(materials: SceneMaterialManager): Model {
        const geometry = new THREE.ConeBufferGeometry(RADIUS, HEIGHT, FACES, undefined, true).toNonIndexed();
        geometry.computeVertexNormals();
        geometry.translate(0, HEIGHT / 2, 0);
        const mesh = new THREE.Mesh(geometry, materials.build({
            category: PaletteCategory.SCENERY_MOUNTAIN_GRASS,
            depthWrite: true,
            shaded: true
        }));
        mesh.onBeforeRender = updateUniforms;
        return {
            lod: [{
                flats: [],
                volumes: [mesh]
            }],
            maxSize: 2 * RADIUS
        };
    }
}
