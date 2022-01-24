import { CanvasPainter } from '../render/screen/canvasPainter';
import { Palette } from './palettes/palette';
import { Scene } from './scene';


export interface Entity {
    init(scene: Scene): void;
    update(delta: number): void;
    render(painter: CanvasPainter, palette: Palette): void;
}
