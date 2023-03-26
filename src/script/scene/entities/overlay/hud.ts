import * as THREE from 'three';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { CHAR_HEIGHT, CHAR_MARGIN, CHAR_WIDTH, TextAlignment } from "../../../render/screen/text";
import { FORWARD, Scene, SceneLayers } from "../../scene";
import { Entity } from "../../entity";
import { Palette, PaletteCategory, PaletteColor } from "../../../config/palettes/palette";
import { PlayerEntity } from "../player";
import { GroundTargetEntity } from '../groundTarget';
import { vectorHeading } from '../../../utils/math';
import { formatHeading, toFeet, toKnots } from './overlayUtils';


const ALTITUDE_HEIGHT = 32;
// Do not change these...
const ALTITUDE_STEP = 5;
const ALTITUDE_LOWP_THRESHOLD = 1000;
const ALTITUDE_HALF_HEIGHT = ALTITUDE_HEIGHT / 2;

const HEADING_WIDTH = 26;
// Do not change these...
const HEADING_HALF_WIDTH = HEADING_WIDTH / 2;
const HEADING_SPACING = 5;
const HEADING_STEP = 5;

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

    private heading: number = 0; // degrees, 0 is North, increases CW
    private altitude: number = 0; // feet
    private throttle: number = 0; // Normalised percentage [0, 1]
    private speed: number = 0; // knots
    private velocityDirection: THREE.Vector3 = new THREE.Vector3();
    private weaponsTarget: GroundTargetEntity | undefined;
    private stallStatus: number = -1; // [-1,1]. Values >= 0 indicate stall
    private isLanded: boolean = false;

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
        this.heading = vectorHeading(this.tmpVector);

        this.throttle = this.actor.throttleUnit;

        this.speed = toKnots(this.actor.rawSpeed);

        this.velocityDirection.copy(this.actor.velocityVector).normalize();

        this.weaponsTarget = this.actor.weaponsTarget;

        this.stallStatus = this.actor.stallStatus;
        this.isLanded = this.actor.isLanded;
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        // Nothing
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        if (!lists.has(SceneLayers.Overlay)) return;

        const hudColor = PaletteColor(palette, PaletteCategory.HUD_TEXT);
        const hudWarnColor = PaletteColor(palette, PaletteCategory.HUD_TEXT_WARN);
        painter.setColor(hudColor);

        const halfWidth = targetWidth / 2;
        const halfHeight = targetHeight / 2;

        const altitudeX = targetWidth - 20;
        const altitudeY = halfHeight;
        this.renderAltitude(altitudeX, altitudeY, targetWidth, painter, hudColor);

        const headingX = halfWidth;
        const headingY = 10;
        this.renderHeading(headingX, headingY, painter, hudColor);

        const airSpeedX = 19;
        const airSpeedY = halfHeight;
        this.renderAirSpeed(airSpeedX, airSpeedY, painter, hudColor);

        this.renderThrottle(painter, hudColor);
        this.renderTarget(targetWidth, targetHeight, halfWidth, halfHeight, painter, camera);
        this.renderBoresight(halfWidth, halfHeight, painter);
        this.renderFlightPathMarker(targetWidth, targetHeight, halfWidth, halfHeight, painter, camera);
        this.renderStallStatus(airSpeedX, airSpeedY, painter, hudWarnColor);
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

    private renderHeading(x: number, y: number, painter: CanvasPainter, hudColor: string) {
        const offset = this.heading % HEADING_SPACING;
        const batch = painter.batch();
        for (let i = -HEADING_HALF_WIDTH; i <= HEADING_HALF_WIDTH; i++) {
            const height = (this.heading + i * HEADING_STEP - offset) % 10 === 0 ? 2 : 0;
            batch.vLine(x + i * HEADING_SPACING - offset, y - height, y);
        }
        batch.vLine(x, y + 2, y + 4);
        batch.commit();

        const clip = painter.clip()
            .rectangle(x - HEADING_HALF_WIDTH * HEADING_SPACING - CHAR_WIDTH - 1,
                y - 9,
                HEADING_WIDTH * HEADING_SPACING + 2 * CHAR_WIDTH,
                CHAR_HEIGHT + 3)
            .clip();
        for (let i = -HEADING_HALF_WIDTH - 2; i <= HEADING_HALF_WIDTH + 2; i++) {
            const value = this.heading + i * HEADING_STEP - offset;
            if (value % 45 === 0) {
                painter.text(
                    x + i * HEADING_SPACING - offset,
                    y - 8,
                    formatHeading(value), hudColor, TextAlignment.CENTER);
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

    private renderTarget(width: number, height: number, halfWidth: number, halfHeight: number, painter: CanvasPainter, camera: THREE.Camera) {
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

    private renderFlightPathMarker(width: number, height: number, halfWidth: number, halfHeight: number, painter: CanvasPainter, camera: THREE.Camera) {
        this.tmpVector.copy(camera.position)
            .add(this.velocityDirection)
            .project(camera);
        const x = Math.round((this.tmpVector.x * halfWidth) + halfWidth);
        const y = Math.round(-(this.tmpVector.y * halfHeight) + halfHeight);
        if (0 <= x && x < width &&
            0 <= y && y < height) {
            painter.batch()
                // Circle
                .hLine(x - 1, x + 1, y - 2)
                .hLine(x - 1, x + 1, y + 2)
                .vLine(x - 2, y - 1, y + 1)
                .vLine(x + 2, y - 1, y + 1)
                // Spikes
                .hLine(x - 5, x - 3, y)
                .hLine(x + 3, x + 5, y)
                .vLine(x, y - 4, y - 3)
                .commit();
        }
    }

    private renderStallStatus(x: number, y: number, painter: CanvasPainter, hudWarnColor: string) {
        const HALF_HEIGHT_PIXELS = AIRSPEED_HALF_HEIGHT * 2;
        painter.setColor(hudWarnColor);
        painter.vLine(x + 1, y + HALF_HEIGHT_PIXELS, y + HALF_HEIGHT_PIXELS - Math.floor((this.stallStatus + 1.0) * HALF_HEIGHT_PIXELS));

        if (this.stallStatus >= 0 && !this.isLanded) {
            painter.text(x + 9,
                y - Math.floor(CHAR_HEIGHT * 1.5) - CHAR_MARGIN,
                'STALL',
                hudWarnColor,
                TextAlignment.LEFT);
        }
    }
}