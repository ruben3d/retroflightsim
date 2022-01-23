import { CanvasPainter } from '../render/screen/canvasPainter';
import { Scene } from './scene';


export interface Entity {
    init(scene: Scene): void;
    update(delta: number): void;
    render(painter: CanvasPainter): void;
}
