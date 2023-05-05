import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { UP } from '../../utils/math';
import { Entity } from "../entity";
import { ModelManager } from "../models/models";
import { Scene, SceneLayers } from "../scene";
import { SimpleEntity } from './simpleEntity';


interface FieldTileElement {
    offset: THREE.Vector3; // [0,1]
    entity: SimpleEntity;
}

type FieldTile = FieldTileElement[];

export interface SceneryFieldSettings {
    tilesInField: number; // Length of the field in tiles
    cellsInTile: number; // Length of the tile in cells
    tileLength: number; // World units
    cellVariations: SceneryFieldCellVariation[];
}

export interface SceneryFieldCellVariation {
    probability: number; // All cell options added together should be less or equal to 1.0
    model: string;
    jitter: number; // [0,1] - 0 disabled, 1 cell edge. Applies a random offset to the item within its cell
    randomRotation: boolean;
}

export class SceneryField implements Entity {

    private tiles: FieldTile[];
    private paddedArea: THREE.Box2;
    private tmpVector2: THREE.Vector2 = new THREE.Vector2();

    private tileMinIndex: number;
    private tileMaxIndex: number;
    private fieldLength: number;
    private cellLength: number;

    readonly tags: string[] = [];

    enabled: boolean = true;

    constructor(models: ModelManager, private area: THREE.Box2, private options: SceneryFieldSettings) {
        this.tiles = Array(options.tilesInField * options.tilesInField);
        this.tileMinIndex = Math.ceil(-options.tilesInField / 2);
        this.tileMaxIndex = Math.ceil(options.tilesInField / 2);
        this.fieldLength = options.tilesInField * options.tileLength;
        this.cellLength = options.tileLength / options.cellsInTile;

        this.paddedArea = area.clone().expandByScalar(options.tileLength * 2);

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

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, layers: Map<string, THREE.Scene>, palette: Palette): void {
        if (!layers.has(SceneLayers.EntityFlats) && !layers.has(SceneLayers.EntityVolumes)) return;
        this.tmpVector2.set(camera.position.x, camera.position.z);
        if (!this.paddedArea.containsPoint(this.tmpVector2)) return;

        let idx = 0;
        for (let row = this.tileMinIndex; row < this.tileMaxIndex; row++) {
            const z = Math.floor((camera.position.z + row * this.options.tileLength) / this.fieldLength + 0.5) * this.fieldLength - row * this.options.tileLength;
            for (let col = this.tileMinIndex; col < this.tileMaxIndex; col++) {
                const x = Math.floor((camera.position.x + col * this.options.tileLength) / this.fieldLength + 0.5) * this.fieldLength - col * this.options.tileLength;
                const tile = this.tiles[idx++];
                for (let i = 0; i < tile.length; i++) {
                    const item = tile[i];
                    item.entity.position.set(x + item.offset.x, 0, z + item.offset.z);
                    this.tmpVector2.set(item.entity.position.x, item.entity.position.z);
                    if (!this.area.containsPoint(this.tmpVector2)) continue;
                    item.entity.render3D(targetWidth, targetHeight, camera, layers, palette);
                }
            }
        }
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }

    private buildTile(models: ModelManager): FieldTile {
        const tile: FieldTile = new Array(this.options.cellsInTile * this.options.cellsInTile);
        for (let row = 0; row < this.options.cellsInTile; row++) {
            for (let col = 0; col < this.options.cellsInTile; col++) {
                const idx = row * this.options.cellsInTile + col;
                tile[idx] = this.buildCell(row, col, models);
            }
        }
        return tile;
    }

    private buildCell(row: number, col: number, models: ModelManager): FieldTileElement {
        const variation = this.pickRandomCellVariation();
        const offset = this.genElementOffset(row, col, variation.jitter);
        const model = models.getModel(variation.model);
        const entity = new SimpleEntity(model, SceneLayers.EntityFlats, SceneLayers.EntityVolumes);
        if (variation.randomRotation) {
            entity.quaternion.setFromAxisAngle(UP, Math.floor(Math.random() * 4) * 0.5 * Math.PI);
        }
        const element: FieldTileElement = {
            offset: offset,
            entity: entity
        };
        return element;
    }

    private pickRandomCellVariation(): SceneryFieldCellVariation {
        let n = Math.random();
        let index = -1;
        while (n >= 0 && index < this.options.cellVariations.length) {
            index++;
            n -= this.options.cellVariations[index].probability;
        }
        return this.options.cellVariations[index];
    }

    private genElementOffset(row: number, col: number, jitter: number): THREE.Vector3 {
        const theta = Math.random() * 2 * Math.PI;
        const rho = Math.random();
        const sqRho = Math.sqrt(rho);
        const offset = new THREE.Vector3();
        offset.x = (col + 0.5) * this.cellLength - this.options.tileLength / 2 + jitter * this.cellLength / 2 * sqRho * Math.cos(theta);
        offset.y = 0;
        offset.z = (row + 0.5) * this.cellLength - this.options.tileLength / 2 + jitter * this.cellLength / 2 * sqRho * Math.sin(theta);
        return offset;
    }
}
