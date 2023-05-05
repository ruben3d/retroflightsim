import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from "../../materials/materials";
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";

export enum FieldModelType {
    SQUARE,
    TRIANGLE,
    HEXAGON
};

export class FieldModelLibBuilder implements ModelLibBuilder {
    type: string;

    constructor(type: string, private modelType: FieldModelType, private color: PaletteCategory, private size: number = 1) {
        this.type = type;
    }

    build(materials: SceneMaterialManager): Model {
        const mesh = this.buildMesh(materials, this.modelType, this.color, this.size);
        const outline = this.buildOutline(materials, this.color, mesh);
        const point = this.buildPoint(materials, this.color);
        return {
            lod: [
                {
                    flats: [mesh, outline],
                    volumes: []
                },
                {
                    flats: [mesh, outline],
                    volumes: []
                },
                {
                    flats: [point],
                    volumes: []
                }
            ],
            animations: [],
            maxSize: this.size,
            center: new THREE.Vector3()
        };
    }

    private buildPoint(materials: SceneMaterialManager, color: PaletteCategory) {
        const points = [new THREE.Vector3(0, 0, 0)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = materials.build({
            type: SceneMaterialPrimitiveType.POINT,
            category: color,
            depthWrite: false,
        });
        const mesh = new THREE.Points(geometry, material);
        mesh.onBeforeRender = updateUniforms;
        return mesh;
    }

    private buildOutline(materials: SceneMaterialManager, color: PaletteCategory, originalMesh: THREE.Mesh<THREE.BufferGeometry | THREE.CircleGeometry | THREE.PlaneGeometry, THREE.Material>) {
        const geometry = this.extractOutlineFromMesh(originalMesh);
        const material = materials.build({
            type: SceneMaterialPrimitiveType.LINE,
            category: color,
            depthWrite: false,
        });
        const lines = new THREE.Line(geometry, material);
        lines.onBeforeRender = updateUniforms;
        return lines;
    }

    private extractOutlineFromMesh(originalMesh: THREE.Mesh<THREE.BufferGeometry | THREE.CircleGeometry | THREE.PlaneGeometry, THREE.Material>) {
        const bufferAttribute = originalMesh.geometry.getAttribute('position');
        const points = new Array<THREE.Vector3>(bufferAttribute.count + 1);
        for (let i = 0; i <= bufferAttribute.count; i++) {
            const idx = (i % bufferAttribute.count) * bufferAttribute.itemSize;
            points[i] = new THREE.Vector3(bufferAttribute.array[idx + 0], bufferAttribute.array[idx + 1], bufferAttribute.array[idx + 2]);
        }
        const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points);
        return bufferGeometry;
    }

    private buildMesh(materials: SceneMaterialManager, modelType: FieldModelType, color: PaletteCategory, size: number) {
        const geometry = this.buildGeometry(modelType, size);
        const material = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: color,
            depthWrite: false,
            shaded: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.onBeforeRender = updateUniforms;
        return mesh;
    }

    private buildGeometry(modelType: FieldModelType, size: number) {
        let geometry;
        switch (modelType) {
            case FieldModelType.HEXAGON:
                geometry = this.buildHexagonGeometry();
                break;
            case FieldModelType.TRIANGLE:
                geometry = this.buildTriangleGeometry();
                break;
            case FieldModelType.SQUARE:
                geometry = this.buildSquareGeometry();
                break;
        }
        geometry.scale(size, 1, size);
        return geometry;
    }

    private buildSquareGeometry() {
        // Can't use PlaneBufferGeometry as I need a specific vertex order for the outline
        const points = new Float32Array([
            -0.5, 0.0, -0.5,
            -0.5, 0.0, 0.5,
            0.5, 0.0, 0.5,
            0.5, 0.0, -0.5,
        ]);
        const index = new Uint32Array([
            0, 1, 2,
            2, 3, 0,
        ]);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
        geometry.setIndex(new THREE.BufferAttribute(index, 1));
        return geometry;
    }

    private buildTriangleGeometry() {
        // I could have used a CircleBufferGeometry but I want a triangle with a right angle
        const points = new Float32Array([
            -0.5, 0.0, -0.5,
            -0.5, 0.0, 0.5,
            0.5, 0.0, -0.5,
        ]);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
        return geometry;
    }

    private buildHexagonGeometry() {
        const geometry = new THREE.CircleBufferGeometry(0.5, 6);
        geometry.center();
        geometry.rotateX(-Math.PI / 2);
        geometry.scale(0.8, 1.0, 1.0);
        return geometry;
    }
}
