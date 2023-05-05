import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from "../../materials/materials";
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";


const FACES = 4;
const EDGE_PADDING = 1;

export class MountainModelLibBuilder implements ModelLibBuilder {
    type: string;

    constructor(type: string, private radius: number, private height: number, private color: PaletteCategory) {
        this.type = type;
    }

    build(materials: SceneMaterialManager): Model {
        const geometry = new THREE.ConeBufferGeometry(this.radius, this.height, FACES, undefined, true).toNonIndexed();
        geometry.computeVertexNormals();
        geometry.translate(0, this.height / 2, 0);
        geometry.rotateY(Math.PI / 4);
        const mesh = new THREE.Mesh(geometry, materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: this.color,
            depthWrite: true,
            shaded: true
        }));
        mesh.onBeforeRender = updateUniforms;

        // const points = [
        //     new THREE.Vector3(-this.radius + EDGE_PADDING, 0, 0),
        //     new THREE.Vector3(0, this.height + EDGE_PADDING, 0),
        //     new THREE.Vector3(0, 0, this.radius + EDGE_PADDING),
        //     new THREE.Vector3(this.radius + EDGE_PADDING, 0, 0),
        //     new THREE.Vector3(0, this.height + EDGE_PADDING, 0),
        //     new THREE.Vector3(0, 0, -this.radius + EDGE_PADDING)
        // ];
        // const linesGeometry = new THREE.BufferGeometry().setFromPoints(points);
        // const lines = new THREE.Line(linesGeometry, materials.build({
        //     type: SceneMaterialPrimitiveType.LINE,
        //     category: this.color,
        //     depthWrite: true,
        // }));
        // lines.onBeforeRender = updateUniforms;

        return {
            lod: [
                {
                    flats: [],
                    volumes: [mesh/*, lines*/]
                },
                {
                    flats: [],
                    volumes: [mesh]
                }
            ],
            animations: [],
            maxSize: 2 * this.radius,
            center: new THREE.Vector3(0, this.height / 2, 0)
        };
    }
}
