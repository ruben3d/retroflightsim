import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { TextAlignment } from "../../../render/screen/text";
import { Scene } from "../../scene";
import { Entity } from "../../entity";
import { Palette, PaletteCategory } from "../../palettes/palette";
import { H_RES, V_RES } from "../../../defs";


export class HUDEntity implements Entity {

    constructor(private actor: THREE.Camera) { }

    init(scene: Scene): void {
        //
    }
    update(delta: number): void {
        //
    }

    render(painter: CanvasPainter, palette: Palette): void {
        painter.text(H_RES - 1, V_RES / 2, this.toFeet(this.actor.position.y).toFixed(0), palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.RIGHT);
    }

    private toFeet(meters: number): number {
        return meters * 3.28084;
    }
}