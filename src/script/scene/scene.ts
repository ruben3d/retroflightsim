import * as THREE from 'three';
import { CanvasPainter } from '../render/screen/canvasPainter';
import { Entity } from './entity';
import { Palette } from '../config/palettes/palette';


export enum SceneLayers {
    Overlay = 'Overlay',
    BackgroundSky = 'BackgroundSky',
    BackgroundGround = 'BackgroundGround',
    Terrain = 'Terrain',
    EntityFlats = 'EntityFlats',
    EntityVolumes = 'EntityVolumes'
}

export class Scene {

    private entities: Entity[] = [];

    update(delta: number) {
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (entity.enabled) {
                entity.update(delta);
            }
        }
    }

    buildRenderLists(targetWidth: number, targetHeight: number, camera: THREE.Camera, renderLists: Map<string, THREE.Scene>, palette: Palette) {
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (entity.enabled) {
                entity.render3D(targetWidth, targetHeight, camera, renderLists, palette);
            }
        }
    }

    paintCanvas(targetWidth: number, targetHeight: number, camera: THREE.Camera, renderLists: Set<string>, painter: CanvasPainter, palette: Palette) {
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (entity.enabled) {
                entity.render2D(targetWidth, targetHeight, camera, renderLists, painter, palette);
            }
        }
    }

    add(entity: Entity) {
        this.entities.push(entity);
        entity.init(this);
    }

    *listByTag(tag: string) {
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (entity.tags.includes(tag)) {
                yield entity;
            }
        }
    }

    countByTag(tag: string): number {
        let count = 0;
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (entity.tags.includes(tag)) {
                count += 1;
            }
        }
        return count;
    }

    entityAtByTag(tag: string, index: number): Entity | undefined {
        let cursor = -1;
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (entity.tags.includes(tag)) {
                cursor += 1;
                if (cursor === index) {
                    return entity;
                }
            }
        }
    }
}
