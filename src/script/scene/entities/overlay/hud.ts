import * as THREE from 'three';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { CHAR_HEIGHT, CHAR_MARGIN, CHAR_WIDTH, TextAlignment } from "../../../render/screen/text";
import { FORWARD, Scene } from "../../scene";
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

const BEARING_X = H_RES / 2;
const BEARING_Y = 10;
const BEARING_WIDTH = 26;

// Do not change these...
const BEARING_HALF_WIDTH = BEARING_WIDTH / 2;
const BEARING_SPACING = 5;
const BEARING_STEP = 5;

export class HUDEntity implements Entity {

    constructor(private actor: PlayerEntity) { }

    private bearing: number = 0; // degrees, 0 is North, increases CW
    private altitude: number = 0; // feet

    private tmpVector = new THREE.Vector3();

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        this.altitude = this.toFeet(this.actor.position.y);

        this.tmpVector.copy(FORWARD)
            .applyQuaternion(this.actor.quaternion)
            .setY(0)
            .normalize();
        this.bearing = Math.round(Math.atan2(this.tmpVector.x, -this.tmpVector.z) / (2 * Math.PI) * 360);
        if (this.bearing < 0) {
            this.bearing = 360 + this.bearing;
        }
    }

    render(layers: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        painter.setColor(palette.colors.HUD_TEXT);

        this.renderAltitude(painter, palette);
        this.renderBearing(painter, palette);
    }

    private renderAltitude(painter: CanvasPainter, palette: Palette) {
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

    private getAltitudeDisplay(n: number, lowp: boolean): string {
        if (n < ALTITUDE_LOWP_THRESHOLD) {
            const num = lowp ? 900 + n / 10 : n;
            return num.toFixed(0);
        } else {
            const num = !lowp && n > ALTITUDE_LOWP_THRESHOLD ? (n - 900) * 10 : n;
            return `${(num / 1000).toFixed(0)}K`;
        }
    }

    private renderBearing(painter: CanvasPainter, palette: Palette) {
        const offset = this.bearing % BEARING_SPACING;
        const batch = painter.batch();
        for (let i = -BEARING_HALF_WIDTH; i <= BEARING_HALF_WIDTH; i++) {
            const height = (this.bearing + i * BEARING_STEP - offset) % 10 === 0 ? 2 : 0;
            batch.vLine(BEARING_X + i * BEARING_SPACING - offset, BEARING_Y - height, BEARING_Y);
        }
        batch.vLine(BEARING_X, BEARING_Y + 2, BEARING_Y + 4);
        batch.commit();

        const clip = painter.clip()
            .rectangle(BEARING_X - BEARING_HALF_WIDTH * BEARING_SPACING - CHAR_WIDTH - 1,
                BEARING_Y - 8,
                BEARING_WIDTH * BEARING_SPACING + 2 * CHAR_WIDTH,
                CHAR_HEIGHT + 1)
            .clip();
        for (let i = -BEARING_HALF_WIDTH - 2; i <= BEARING_HALF_WIDTH + 2; i++) {
            const value = this.bearing + i * BEARING_STEP - offset;
            if (value % 45 === 0) {
                painter.text(
                    BEARING_X + i * BEARING_SPACING - offset,
                    BEARING_Y - 8,
                    this.getBearingDisplay(value), palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.CENTER);
            }
        }
        clip.clear();
    }

    private getBearingDisplay(n: number): string {
        return `00${(((n % 360) + 360) % 360).toFixed(0)}`.slice(-3);
    }

    private toFeet(meters: number): number {
        return meters * 3.28084;
    }
}