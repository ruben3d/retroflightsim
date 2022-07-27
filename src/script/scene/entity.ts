import { CanvasPainter } from '../render/screen/canvasPainter';
import { Palette } from '../config/palettes/palette';
import { Scene } from './scene';

export enum ENTITY_TAGS {
    TARGET = 'TARGET',
    GROUND = 'GROUND'
}

export interface Entity {
    readonly tags: string[];
    enabled: boolean;
    init(scene: Scene): void;
    update(delta: number): void;
    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void;
    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void;
}
