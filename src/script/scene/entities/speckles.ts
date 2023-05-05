import * as THREE from 'three';
import { Palette, PaletteCategory } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { Entity } from "../entity";
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../materials/materials';
import { Scene, SceneLayers } from "../scene";
import { updateUniforms } from '../utils';


const TILE_SUBDIVISIONS = 2; // Number of cells, each cell contains one speck of dust
const TILE_SIZE = 1024.0; // World units
const JITTER = 0.75; // [0,1] - 0 disabled, 1 cell edge. Applies a random offset to the speck of dust within its cell

const FIELD_SIZE = 7; // Tiles, odd numbers only

// ! DO NOT CHANGE THESE
const POINT_COORDS = 3;
const MIN = Math.ceil(-FIELD_SIZE / 2);
const MAX = Math.ceil(FIELD_SIZE / 2);
const SPAN = FIELD_SIZE * TILE_SIZE;

export class SpecklesEntity implements Entity {

    private tiles: THREE.Points[] = Array(FIELD_SIZE * FIELD_SIZE);

    readonly tags: string[] = [];

    enabled: boolean = true;

    constructor(materials: SceneMaterialManager) {
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = this.buildTile(materials);
        }
    }

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        //
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, layers: Map<string, THREE.Scene>, palette: Palette): void {
        const layer = layers.get(SceneLayers.EntityFlats);
        if (!layer) return;

        let idx = 0;
        for (let row = MIN; row < MAX; row++) {
            for (let col = MIN; col < MAX; col++) {
                const tile = this.tiles[idx++];
                tile.position.x = Math.floor((camera.position.x + col * TILE_SIZE) / SPAN + 0.5) * SPAN - col * TILE_SIZE;
                tile.position.z = Math.floor((camera.position.z + row * TILE_SIZE) / SPAN + 0.5) * SPAN - row * TILE_SIZE;
            }
        }

        this.tiles.forEach(tile => layer.add(tile));
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }

    private buildTile(materials: SceneMaterialManager): THREE.Points {
        const CELL_SIZE = TILE_SIZE / TILE_SUBDIVISIONS
        const pointsVertices = new Float32Array(POINT_COORDS * TILE_SUBDIVISIONS * TILE_SUBDIVISIONS);
        for (let row = 0; row < TILE_SUBDIVISIONS; row++) {
            for (let col = 0; col < TILE_SUBDIVISIONS; col++) {
                const idx = POINT_COORDS * (row * TILE_SUBDIVISIONS + col);
                const theta = Math.random() * 2 * Math.PI;
                const r = Math.random();
                const sqR = Math.sqrt(r);
                pointsVertices[idx + 0] = (col + 0.5) * CELL_SIZE - TILE_SIZE / 2 + JITTER * CELL_SIZE / 2 * sqR * Math.cos(theta);
                pointsVertices[idx + 1] = 0;
                pointsVertices[idx + 2] = (row + 0.5) * CELL_SIZE - TILE_SIZE / 2 + JITTER * CELL_SIZE / 2 * sqR * Math.sin(theta);
            }
        }
        const pointsBuffer = new THREE.BufferGeometry();
        pointsBuffer.setAttribute('position', new THREE.BufferAttribute(pointsVertices, 3));
        const points = new THREE.Points(pointsBuffer);
        points.material = materials.build({
            type: SceneMaterialPrimitiveType.POINT,
            category: PaletteCategory.SCENERY_SPECKLE,
            depthWrite: false
        });
        points.onBeforeRender = updateUniforms;
        return points;
    }
}
