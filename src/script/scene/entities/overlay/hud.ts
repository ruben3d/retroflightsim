import * as THREE from 'three';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { CHAR_HEIGHT, CHAR_MARGIN, CHAR_WIDTH, TextAlignment } from "../../../render/screen/text";
import { FORWARD, Scene, SceneLayers } from "../../scene";
import { Entity } from "../../entity";
import { Palette, PaletteCategory, PaletteColor } from "../../../config/palettes/palette";
import { PlayerEntity } from "../player";
import { GroundTargetEntity } from '../groundTarget';
import { vectorBearing } from '../../../utils/math';
import { formatBearing, toFeet, toKnots } from './overlayUtils';


const ALTITUDE_HEIGHT = 32;
// Do not change these...
const ALTITUDE_STEP = 5;
const ALTITUDE_LOWP_THRESHOLD = 1000;
const ALTITUDE_HALF_HEIGHT = ALTITUDE_HEIGHT / 2;

const BEARING_WIDTH = 26;
// Do not change these...
const BEARING_HALF_WIDTH = BEARING_WIDTH / 2;
const BEARING_SPACING = 5;
const BEARING_STEP = 5;

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

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        // Nothing
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        if (!lists.has(SceneLayers.Overlay)) return;

        const hudColor = PaletteColor(palette, PaletteCategory.HUD_TEXT);
        painter.setColor(hudColor);

        const halfWidth = targetWidth / 2;
        const halfHeight = targetHeight / 2;

        const altitudeX = targetWidth - 20;
        const altitudeY = halfHeight;
        this.renderAltitude(altitudeX, altitudeY, targetWidth, painter, hudColor);

        const bearingX = halfWidth;
        const bearingY = 10;
        this.renderBearing(bearingX, bearingY, painter, hudColor);

        const airSpeedX = 19;
        const airSpeedY = halfHeight;
        this.renderAirSpeed(airSpeedX, airSpeedY, painter, hudColor);

        this.renderThrottle(painter, hudColor);
        this.renderTarget(targetWidth, targetHeight, halfWidth, halfHeight, painter, hudColor, camera);
        this.renderBoresight(halfWidth, halfHeight, painter);
    }

    private renderAltitude(x: number, y: number, width: number, painter: CanvasPainter, hudColor: string) {
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
                batch.hLine(x, x + width, y - i * 2 + offset);
            }
        }
        batch.hLine(x - 5, x - 2, y);
        batch.commit();

        const clip = painter.clip();
        clip.rectangle(x, y - ALTITUDE_HEIGHT, width - x, ALTITUDE_HEIGHT * 2 + 3).clip();
        for (let i = ALTITUDE_HALF_HEIGHT + 1; i >= -ALTITUDE_HALF_HEIGHT - 1; i--) {
            const current = scaledAltitude + (i * 2 - offset) * ALTITUDE_STEP * scale;
            if ((current >= 0 || lowp) && current % (100 * scale) === 0) {
                painter.text(
                    x + 6 + (CHAR_WIDTH + CHAR_MARGIN) * 3,
                    y - i * 2 + offset - HALF_CHAR,
                    this.getAltitudeDisplay(current, lowp), hudColor, TextAlignment.RIGHT);
            }
        }
        clip.clear();

        painter.text(x - 8, y - Math.floor(CHAR_HEIGHT / 2), roundedAltitude.toFixed(0), hudColor, TextAlignment.RIGHT);
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

    private renderBearing(x: number, y: number, painter: CanvasPainter, hudColor: string) {
        const offset = this.bearing % BEARING_SPACING;
        const batch = painter.batch();
        for (let i = -BEARING_HALF_WIDTH; i <= BEARING_HALF_WIDTH; i++) {
            const height = (this.bearing + i * BEARING_STEP - offset) % 10 === 0 ? 2 : 0;
            batch.vLine(x + i * BEARING_SPACING - offset, y - height, y);
        }
        batch.vLine(x, y + 2, y + 4);
        batch.commit();

        const clip = painter.clip()
            .rectangle(x - BEARING_HALF_WIDTH * BEARING_SPACING - CHAR_WIDTH - 1,
                y - 8,
                BEARING_WIDTH * BEARING_SPACING + 2 * CHAR_WIDTH,
                CHAR_HEIGHT + 2)
            .clip();
        for (let i = -BEARING_HALF_WIDTH - 2; i <= BEARING_HALF_WIDTH + 2; i++) {
            const value = this.bearing + i * BEARING_STEP - offset;
            if (value % 45 === 0) {
                painter.text(
                    x + i * BEARING_SPACING - offset,
                    y - 8,
                    formatBearing(value), hudColor, TextAlignment.CENTER);
            }
        }
        clip.clear();
    }

    private renderAirSpeed(x: number, y: number, painter: CanvasPainter, hudColor: string) {
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
                batch.hLine(x - width, x, y - i * 2 + offset);
            }
        }
        batch.hLine(x + 2, x + 5, y);
        batch.commit();

        const clip = painter.clip();
        clip.rectangle(0, y - AIRSPEED_HEIGHT, x, AIRSPEED_HEIGHT * 2 + 3).clip();
        for (let i = AIRSPEED_HALF_HEIGHT + 1; i >= -AIRSPEED_HALF_HEIGHT - 1; i--) {
            const current = airspeed + (i * 2 - offset) * AIRSPEED_STEP * AIRSPEED_SCALE;
            if (current >= 0 && current % 500 === 0) {
                painter.text(
                    x - 6,
                    y - i * 2 + offset - HALF_CHAR,
                    (current / AIRSPEED_SCALE).toFixed(0), hudColor, TextAlignment.RIGHT);
            }
        }
        clip.clear();

        painter.text(x + 9,
            y - Math.floor(CHAR_HEIGHT / 2),
            Math.floor(this.speed).toString(),
            hudColor,
            TextAlignment.LEFT);
    }

    private renderThrottle(painter: CanvasPainter, hudColor: string) {
        painter.text(2, 2, `THR: ${(100 * this.throttle).toFixed(0)}`, hudColor);
    }

    private renderTarget(width: number, height: number, halfWidth: number, halfHeight: number, painter: CanvasPainter, hudColor: string, camera: THREE.Camera) {
        if (this.weaponsTarget === undefined) return;

        camera.getWorldDirection(this.tmpVector);
        this.tmpPlane.setFromNormalAndCoplanarPoint(this.tmpVector, camera.position);
        if (this.tmpPlane.distanceToPoint(this.weaponsTarget.position) > 0) {
            this.tmpVector.copy(this.weaponsTarget.position);
            this.tmpVector.project(camera);
            const x = Math.round((this.tmpVector.x * halfWidth) + halfWidth);
            const y = Math.round(-(this.tmpVector.y * halfHeight) + halfHeight);
            if (0 <= x && x < width &&
                0 <= y && y < height) {
                painter.rectangle(x - TARGET_HALF_WIDTH, y - TARGET_HALF_WIDTH, TARGET_WIDTH, TARGET_WIDTH);
            }
        }
    }

    private renderBoresight(halfWidth: number, halfHeight: number, painter: CanvasPainter) {
        painter.batch()
            .hLine(halfWidth - 5 - 5, halfWidth - 5, halfHeight)
            .hLine(halfWidth + 5, halfWidth + 5 + 5, halfHeight)
            .vLine(halfWidth, halfHeight - 3 - 3, halfHeight - 3)
            .vLine(halfWidth, halfHeight + 3, halfHeight + 3 + 3)
            .commit();
    }
}