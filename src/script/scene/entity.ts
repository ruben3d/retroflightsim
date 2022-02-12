import { CanvasPainter } from '../render/screen/canvasPainter';
import { Palette } from './palettes/palette';
import { Scene } from './scene';

export enum ENTITY_TAGS {
    TARGET = 'TARGET',
    GROUND = 'GROUND'
}

export interface Entity {
    readonly tags: string[];
    init(scene: Scene): void;
    update(delta: number): void;
    render(camera: THREE.Camera, lists: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void;
}
