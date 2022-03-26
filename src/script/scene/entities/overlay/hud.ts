import * as THREE from 'three';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { CHAR_HEIGHT, CHAR_MARGIN, CHAR_WIDTH, TextAlignment } from "../../../render/screen/text";
import { FORWARD, Scene, SceneLayers } from "../../scene";
import { Entity } from "../../entity";
import { Palette, PaletteCategory } from "../../palettes/palette";
import { H_RES, H_RES_HALF, V_RES, V_RES_HALF } from "../../../defs";
import { PlayerEntity } from "../player";
import { GroundTargetEntity } from '../groundTarget';
import { vectorBearing } from '../../../utils/math';
import { formatBearing, toFeet, toKnots } from './overlayUtils';


const ALTITUDE_X = H_RES - 20;
const ALTITUDE_Y = V_RES_HALF;
const ALTITUDE_HEIGHT = 32;
// Do not change these...
const ALTITUDE_STEP = 5;
const ALTITUDE_LOWP_THRESHOLD = 1000;
const ALTITUDE_HALF_HEIGHT = ALTITUDE_HEIGHT / 2;

const BEARING_X = H_RES_HALF;
const BEARING_Y = 10;
const BEARING_WIDTH = 26;
// Do not change these...
const BEARING_HALF_WIDTH = BEARING_WIDTH / 2;
const BEARING_SPACING = 5;
const BEARING_STEP = 5;

const AIRSPEED_X = 19;
const AIRSPEED_Y = V_RES_HALF;
const AIRSPEED_HEIGHT = 32;
// Do not change these...
const AIRSPEED_SCALE = 10;
const AIRSPEED_STEP = 2.5;
const AIRSPEED_HALF_HEIGHT = AIRSPEED_HEIGHT / 2;

const TARGET_HALF_WIDTH = 8; // Pixels
const TARGET_WIDTH = TARGET_HALF_WIDTH * 2 + 1;

const HALF_CHAR = Math.floor(CHAR_HEIGHT / 2);


export class HUDEntity implements Entity {

    constructor(private actor: PlayerEntity) { }

    private bearing: number = 0; // degrees, 0 is North, increases CW
    private altitude: number = 0; // feet
    private throttle: number = 0; // Normalised percentage [0, 1]
    private speed: number = 0; // knots
    private weaponsTarget: GroundTargetEntity | undefined;

    private tmpVector = new THREE.Vector3();
    private tmpPlane = new THREE.Plane();

    readonly tags: string[] = [];

    enabled: boolean = true;

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        this.altitude = toFeet(this.actor.position.y);

        this.tmpVector.copy(FORWARD)
            .applyQuaternion(this.actor.quaternion)
            .setY(0)
            .normalize();
        this.bearing = vectorBearing(this.tmpVector);

        this.throttle = this.actor.throttleUnit;

        this.speed = toKnots(this.actor.rawSpeed);

        this.weaponsTarget = this.actor.weaponsTarget;
    }

    render(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        if (!lists.has(SceneLayers.Overlay)) return;

        painter.setColor(palette.colors.HUD_TEXT);

        this.renderAltitude(painter, palette);
        this.renderBearing(painter, palette);
        this.renderAirSpeed(painter, palette);
        this.renderThrottle(painter, palette);
        this.renderTarget(painter, palette, camera);
        this.renderBoresight(painter, palette);
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
                    ALTITUDE_Y - i * 2 + offset - HALF_CHAR,
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
                    formatBearing(value), palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.CENTER);
            }
        }
        clip.clear();
    }

    private renderAirSpeed(painter: CanvasPainter, palette: Palette) {
        const airspeed = AIRSPEED_SCALE * AIRSPEED_STEP * Math.floor(this.speed / AIRSPEED_STEP);
        const tmp = 25 * Math.floor(this.speed * 10 / 25);
        const offset = tmp % 50 === 0 ? 0 : 1;

        const batch = painter.batch();
        for (let i = AIRSPEED_HALF_HEIGHT; i >= -AIRSPEED_HALF_HEIGHT; i--) {
            const current = airspeed + (i * 2 - offset) * AIRSPEED_STEP * AIRSPEED_SCALE;
            if (current >= 0) {
                let width = 0;
                if (current % 500 === 0) {
                    width = 2;
                } else if (current % 250 === 0) {
                    width = 1;
                }
                batch.hLine(AIRSPEED_X - width, AIRSPEED_X, AIRSPEED_Y - i * 2 + offset);
            }
        }
        batch.hLine(AIRSPEED_X + 2, AIRSPEED_X + 5, AIRSPEED_Y);
        batch.commit();

        const clip = painter.clip();
        clip.rectangle(0, AIRSPEED_Y - AIRSPEED_HEIGHT, AIRSPEED_X, AIRSPEED_HEIGHT * 2 + 3).clip();
        for (let i = AIRSPEED_HALF_HEIGHT + 1; i >= -AIRSPEED_HALF_HEIGHT - 1; i--) {
            const current = airspeed + (i * 2 - offset) * AIRSPEED_STEP * AIRSPEED_SCALE;
            if (current >= 0 && current % 500 === 0) {
                painter.text(
                    AIRSPEED_X - 6,
                    AIRSPEED_Y - i * 2 + offset - HALF_CHAR,
                    (current / AIRSPEED_SCALE).toFixed(0), palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.RIGHT);
            }
        }
        clip.clear();

        painter.text(AIRSPEED_X + 9,
            AIRSPEED_Y - Math.floor(CHAR_HEIGHT / 2),
            Math.floor(this.speed).toString(),
            palette.colors[PaletteCategory.HUD_TEXT],
            TextAlignment.LEFT);
    }

    private renderThrottle(painter: CanvasPainter, palette: Palette) {
        painter.text(2, 2, `THR: ${(100 * this.throttle).toFixed(0)}`, palette.colors.HUD_TEXT);
    }

    private renderTarget(painter: CanvasPainter, palette: Palette, camera: THREE.Camera) {
        if (this.weaponsTarget === undefined) return;

        camera.getWorldDirection(this.tmpVector);
        this.tmpPlane.setFromNormalAndCoplanarPoint(this.tmpVector, camera.position);
        if (this.tmpPlane.distanceToPoint(this.weaponsTarget.position) > 0) {
            this.tmpVector.copy(this.weaponsTarget.position);
            this.tmpVector.project(camera);
            const x = Math.round((this.tmpVector.x * H_RES_HALF) + H_RES_HALF);
            const y = Math.round(-(this.tmpVector.y * V_RES_HALF) + V_RES_HALF);
            if (0 <= x && x < H_RES &&
                0 <= y && y < V_RES) {
                painter.rectangle(x - TARGET_HALF_WIDTH, y - TARGET_HALF_WIDTH, TARGET_WIDTH, TARGET_WIDTH);
            }
        }
    }

    private renderBoresight(painter: CanvasPainter, palette: Palette) {
        painter.batch()
            .hLine(H_RES_HALF - 5 - 5, H_RES_HALF - 5, V_RES_HALF)
            .hLine(H_RES_HALF + 5, H_RES_HALF + 5 + 5, V_RES_HALF)
            .vLine(H_RES_HALF, V_RES_HALF - 3 - 3, V_RES_HALF - 3)
            .vLine(H_RES_HALF, V_RES_HALF + 3, V_RES_HALF + 3 + 3)
            .commit();
    }
}