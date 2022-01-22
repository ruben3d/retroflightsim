import * as THREE from 'three';


export interface Entity {
    init(scene: Scene): void;
    update(delta: number): void;
}

export class Scene {

    private scenes: Map<string, THREE.Scene> = new Map();
    private entities: Entity[] = [];

    update(delta: number) {
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].update(delta);
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
