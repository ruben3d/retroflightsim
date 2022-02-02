import * as THREE from 'three';
import { CanvasPainter } from '../render/screen/canvasPainter';
import { Entity } from './entity';
import { Palette } from './palettes/palette';

export const UP = new THREE.Vector3(0, 1, 0);
export const FORWARD = new THREE.Vector3(0, 0, -1);
export const RIGHT = new THREE.Vector3(1, 0, 0);

export enum SceneLayers {
    EntityFlats = 'EntityFlats',
    EntityVolumes = 'EntityVolumes'
}

export class Scene {

    private layers: Map<string, THREE.Scene> = new Map();
    private entities: Entity[] = [];

    update(delta: number) {
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].update(delta);
        }
    }

    buildRenderListsAndPaintCanvas(painter: CanvasPainter, palette: Palette) {
        this.getLayer(SceneLayers.EntityFlats).clear();
        this.getLayer(SceneLayers.EntityVolumes).clear();

        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].render(this.layers, painter, palette);
        }
    }

    add(entity: Entity) {
        this.entities.push(entity);
        entity.init(this);
    }

    getLayer(id: string): THREE.Scene {
        let scene = this.layers.get(id);
        if (!scene) {
            scene = new THREE.Scene();
            this.layers.set(id, scene);
        }
        return scene;
    }
}
