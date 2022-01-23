import * as THREE from 'three';
import { CanvasPainter } from '../render/screen/canvasPainter';
import { Entity } from './entity';


export class Scene {

    private scenes: Map<string, THREE.Scene> = new Map();
    private entities: Entity[] = [];

    update(delta: number) {
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].update(delta);
        }
    }

    render(painter: CanvasPainter) {
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].render(painter);
        }
    }

    add(entity: Entity) {
        this.entities.push(entity);
        entity.init(this);
    }

    getScene(id: string): THREE.Scene {
        let scene = this.scenes.get(id);
        if (!scene) {
            scene = new THREE.Scene();
            this.scenes.set(id, scene);
        }
        return scene;
    }
}
