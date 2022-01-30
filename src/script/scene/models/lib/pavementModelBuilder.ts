import * as THREE from 'three';
import { SceneMaterialManager } from "../../materials/materials";
import { PaletteCategory } from '../../palettes/palette';
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";

export class PavementModelLibBuilder implements ModelLibBuilder {
    type: string = 'pavement';

    build(materials: SceneMaterialManager): Model {
        const geometry = new THREE.PlaneBufferGeometry(1, 1);
        geometry.center();
        geometry.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(geometry, materials.build({
            category: PaletteCategory.SCENERY_ROAD_SECONDARY,
            depthWrite: false,
            shaded: false
        }));
        mesh.onBeforeRender = updateUniforms;
        return {
            flats: [mesh],
            volumes: []
        }
    }
}
