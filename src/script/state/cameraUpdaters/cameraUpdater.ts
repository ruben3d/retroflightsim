import * as THREE from 'three';
import { PlayerEntity } from '../../scene/entities/player';


export abstract class CameraUpdater {
    constructor(protected actor: PlayerEntity, protected camera: THREE.PerspectiveCamera) { }

    abstract update(delta: number): void;
}
