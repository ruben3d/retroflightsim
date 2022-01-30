import * as THREE from 'three';
import { Palette, PaletteCategory } from '../palettes/palette';
import { Scene, SceneLayers } from "../scene";
import { Entity } from "../entity";
import { updateUniforms } from '../utils';
import { SceneMaterialManager } from '../materials/materials';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { assertIsDefined } from '../../../utils/asserts';

const POINT_COORDS = 3; // ! DO NOT CHANGE
const TILE_SUBDIVISIONS = 2; // Number of cells, each cell contains one speck of dust
const TILE_SIZE = 1024.0; // World units
const JITTER = 0.75; // [0,1] - 0 disabled, 1 cell edge. Applies a random offset to the speck of dust within its cell

const FIELD_SIZE = 7; // Tiles, odd numbers only

export class SpecklesEntity implements Entity {

    private tiles: THREE.Points[] = Array(FIELD_SIZE * FIELD_SIZE);

    constructor(private camera: THREE.Camera, materials: SceneMaterialManager) {
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = this.buildTile(materials);
        }
    }

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        const min = Math.ceil(-FIELD_SIZE / 2);
        const max = Math.ceil(FIELD_SIZE / 2);
        const span = FIELD_SIZE * TILE_SIZE;
        let idx = 0;
        for (let row = min; row < max; row++) {
            for (let col = min; col < max; col++) {
                const tile = this.tiles[idx++];
                tile.position.x = Math.floor((this.camera.position.x + col * TILE_SIZE) / span + 0.5) * span - col * TILE_SIZE;
                tile.position.z = Math.floor((this.camera.position.z + row * TILE_SIZE) / span + 0.5) * span - row * TILE_SIZE;
            }
        }
    }

    render(layers: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        const layer = layers.get(SceneLayers.EntityFlats);
        assertIsDefined(layer);
        this.tiles.forEach(tile => layer.add(tile));
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
            category: PaletteCategory.SCENERY_SPECKLE,
            shaded: false,
            depthWrite: false
        });
        points.onBeforeRender = updateUniforms;
        return points;
    }
}
