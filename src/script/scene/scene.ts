import * as THREE from 'three';
import { CanvasPainter } from '../render/screen/canvasPainter';
import { Entity } from './entity';
import { Palette } from './palettes/palette';

export const UP = new THREE.Vector3(0, 1, 0);
export const FORWARD = new THREE.Vector3(0, 0, -1);
export const RIGHT = new THREE.Vector3(1, 0, 0);

export enum SceneLayers {
    Overlay = 'Overlay',
    EntityFlats = 'EntityFlats',
    EntityVolumes = 'EntityVolumes'
}

export class Scene {

    private entities: Entity[] = [];

    update(delta: number) {
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].update(delta);
        }
    }

    buildRenderListsAndPaintCanvas(camera: THREE.Camera, renderLists: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette) {
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].render(camera, renderLists, painter, palette);
        }
    }

    add(entity: Entity) {
        this.entities.push(entity);
        entity.init(this);
    }
}
