import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { CHAR_HEIGHT, CHAR_MARGIN, CHAR_WIDTH, TextAlignment } from "../../../render/screen/text";
import { Scene } from "../../scene";
import { Entity } from "../../entity";
import { Palette, PaletteCategory } from "../../palettes/palette";
import { H_RES, V_RES } from "../../../defs";
import { PlayerEntity } from "../player";


const ALTITUDE_X = H_RES - 20;
const ALTITUDE_Y = V_RES / 2;
const ALTITUDE_HEIGHT = 32;

// Do not change these...
const ALTITUDE_STEP = 5;
const ALTITUDE_LOWP_THRESHOLD = 1000;
const ALTITUDE_HALF_HEIGHT = ALTITUDE_HEIGHT / 2;
const ALTITUDE_HALF_CHAR = Math.floor(CHAR_HEIGHT / 2);

export class HUDEntity implements Entity {

    constructor(private actor: PlayerEntity) { }

    private altitude: number = 0; // feet

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        this.altitude = this.toFeet(this.actor.position.y);
    }

    render(layers: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        painter.setColor(palette.colors.HUD_TEXT);

        this.renderAltitude(painter, palette);
    }

    renderAltitude(painter: CanvasPainter, palette: Palette) {
        const roundedAltitude = ALTITUDE_STEP * Math.floor(this.altitude / ALTITUDE_STEP);
        const lowp = roundedAltitude >= ALTITUDE_LOWP_THRESHOLD;
        const scale = lowp ? 10 : 1;
        const scaledAltitude = Math.floor(roundedAltitude / (ALTITUDE_STEP * scale)) * ALTITUDE_STEP * scale;
        const offset = scaledAltitude % Math.floor(10 * scale) === 0 ? 0 : 1;

        const batch = painter.batch();
        for (let i = ALTITUDE_HALF_HEIGHT; i >= -ALTITUDE_HALF_HEIGHT; i--) {
            const current = scaledAltitude + (i * 2 - offset) * ALTITUDE_STEP * scale;
            if (current >= 0 || lowp) {
                let width = 0;
                if (current % (100 * scale) === 0) {
                    width = 2;
                } else if (current % (50 * scale) === 0) {
                    width = 1;
                }
                batch.hLine(ALTITUDE_X, ALTITUDE_X + width, ALTITUDE_Y - i * 2 + offset);
            }
        }
        batch.hLine(ALTITUDE_X - 5, ALTITUDE_X - 2, ALTITUDE_Y);
        batch.commit();

        const clip = painter.clip();
        clip.rectangle(ALTITUDE_X, ALTITUDE_Y - ALTITUDE_HEIGHT, H_RES - ALTITUDE_X, ALTITUDE_HEIGHT * 2 + 3).clip();
        for (let i = ALTITUDE_HALF_HEIGHT + 1; i >= -ALTITUDE_HALF_HEIGHT - 1; i--) {
            const current = scaledAltitude + (i * 2 - offset) * ALTITUDE_STEP * scale;
            if ((current >= 0 || lowp) && current % (100 * scale) === 0) {
                painter.text(
                    ALTITUDE_X + 6 + (CHAR_WIDTH + CHAR_MARGIN) * 3,
                    ALTITUDE_Y - i * 2 + offset - ALTITUDE_HALF_CHAR,
                    this.getAltitudeDisplay(current, lowp), palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.RIGHT);
            }
        }
        clip.clear();

        painter.text(ALTITUDE_X - 8, ALTITUDE_Y - Math.floor(CHAR_HEIGHT / 2), roundedAltitude.toFixed(0), palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.RIGHT);
    }

    getAltitudeDisplay(n: number, lowp: boolean): string {
        if (n < ALTITUDE_LOWP_THRESHOLD) {
            const num = lowp ? 900 + n / 10 : n;
            return num.toFixed(0);
        } else {
            const num = !lowp && n > ALTITUDE_LOWP_THRESHOLD ? (n - 900) * 10 : n;
            return `${(num / 1000).toFixed(0)}K`;
        }
    }

    private toFeet(meters: number): number {
        return meters * 3.28084;
    }
}