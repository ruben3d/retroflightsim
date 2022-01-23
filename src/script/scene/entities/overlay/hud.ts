import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { TextAlignment } from "../../../render/screen/text";
import { Scene } from "../../scene";
import { Entity } from "../../entity";


export class HUDEntity implements Entity {

    constructor(private actor: THREE.Camera) { }

    init(scene: Scene): void {
        //
    }
    update(delta: number): void {
        //
    }

    render(painter: CanvasPainter): void {
        painter.text(319, 100, this.toFeet(this.actor.position.y).toFixed(0), TextAlignment.RIGHT);
    }

    private toFeet(meters: number): number {
        return meters * 3.28084;
    }
}