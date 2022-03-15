import * as THREE from 'three';
import { Palette } from '../palettes/palette';
import { ModelManager } from "../models/models";
import { Scene, SceneLayers } from "../scene";
import { Entity } from "../entity";
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { SimpleEntity } from './simpleEntity';

const TILE_SUBDIVISIONS = 2; // Number of cells
const TILE_SIZE = 2000.0; // World units
const JITTER = 0.9; // [0,1] - 0 disabled, 1 cell edge. Applies a random offset to the item within its cell

const FIELD_SIZE = 7; // Tiles, odd numbers only

const FIELD_PADDING = 5000.0; // World units

// ! DO NOT CHANGE THESE
const MIN = Math.ceil(-FIELD_SIZE / 2);
const MAX = Math.ceil(FIELD_SIZE / 2);
const SPAN = FIELD_SIZE * TILE_SIZE;
const CELL_SIZE = TILE_SIZE / TILE_SUBDIVISIONS;

interface FieldTileElement {
    offset: THREE.Vector3; // [0,1]
    entity: SimpleEntity;
}

type FieldTile = FieldTileElement[];

export class SceneryField implements Entity {

    private tiles: FieldTile[] = Array(FIELD_SIZE * FIELD_SIZE);
    private paddedArea: THREE.Box2;
    private tmpVector2: THREE.Vector2 = new THREE.Vector2();

    readonly tags: string[] = [];

    constructor(models: ModelManager, private area: THREE.Box2) {
        this.paddedArea = area.clone().expandByScalar(FIELD_PADDING);

        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = this.buildTile(models);
        }
    }

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        //
    }

    render(targetWidth: number, targetHeight: number, camera: THREE.Camera, layers: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        if (!layers.has(SceneLayers.EntityFlats) && !layers.has(SceneLayers.EntityVolumes)) return;
        this.tmpVector2.set(camera.position.x, camera.position.z);
        if (!this.paddedArea.containsPoint(this.tmpVector2)) return;

        let idx = 0;
        for (let row = MIN; row < MAX; row++) {
            const z = Math.floor((camera.position.z + row * TILE_SIZE) / SPAN + 0.5) * SPAN - row * TILE_SIZE;
            for (let col = MIN; col < MAX; col++) {
                const x = Math.floor((camera.position.x + col * TILE_SIZE) / SPAN + 0.5) * SPAN - col * TILE_SIZE;
                const tile = this.tiles[idx++];
                for (let i = 0; i < tile.length; i++) {
                    const item = tile[i];
                    item.entity.position.set(x + item.offset.x, 0, z + item.offset.z);
                    this.tmpVector2.set(item.entity.position.x, item.entity.position.z);
                    if (!this.area.containsPoint(this.tmpVector2)) continue;
                    item.entity.render(targetWidth, targetHeight, camera, layers, painter, palette);
                }
            }
        }
    }

    private buildTile(models: ModelManager): FieldTile {
        const tile: FieldTile = new Array(TILE_SUBDIVISIONS * TILE_SUBDIVISIONS);
        for (let row = 0; row < TILE_SUBDIVISIONS; row++) {
            for (let col = 0; col < TILE_SUBDIVISIONS; col++) {
                const idx = row * TILE_SUBDIVISIONS + col;
                tile[idx] = this.buildTileElement(row, col, models);
            }
        }
        return tile;
    }

    private buildTileElement(row: number, col: number, models: ModelManager): FieldTileElement {
        const offset = this.builtElementOffset(row, col);
        const model = models.getModel('assets/farm01.gltf');
        const entity = new SimpleEntity(model, SceneLayers.EntityFlats, SceneLayers.EntityVolumes);
        const element: FieldTileElement = {
            offset: offset,
            entity: entity
        };
        return element;
    }

    private builtElementOffset(row: number, col: number): THREE.Vector3 {
        const offset = new THREE.Vector3();
        const theta = Math.random() * 2 * Math.PI;
        const r = Math.random();
        const sqR = Math.sqrt(r);
        offset.x = (col + 0.5) * CELL_SIZE - TILE_SIZE / 2 + JITTER * CELL_SIZE / 2 * sqR * Math.cos(theta);
        offset.y = 0;
        offset.z = (row + 0.5) * CELL_SIZE - TILE_SIZE / 2 + JITTER * CELL_SIZE / 2 * sqR * Math.sin(theta);
        return offset;
    }
}
