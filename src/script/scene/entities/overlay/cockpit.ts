import * as THREE from 'three';
import { Palette, PaletteCategory, PaletteColor } from "../../../config/palettes/palette";
import { H_RES, LO_H_RES } from "../../../defs";
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { Font, TextAlignment } from "../../../render/screen/text";
import { calculatePitchRoll, FORWARD, UP, vectorHeading } from '../../../utils/math';
import { Entity } from "../../entity";
import { Scene, SceneLayers } from "../../scene";
import { updateTargetCamera } from '../../utils';
import { GroundTargetEntity } from '../groundTarget';
import { AircraftDeviceState, PlayerEntity } from "../player";
import { formatHeading } from './overlayUtils';


// Pixels
export function CockpitMFDSize(height: number): number {
    return Math.floor(height / 3.333);
}

// Pixels
export function CockpitMFD1X(width: number, height: number, size: number): number {
    return 1;
}

// Pixels
export function CockpitMFD1Y(width: number, height: number, size: number): number {
    return height - size - 1;
}

// Pixels
export function CockpitMFD2X(width: number, height: number, size: number): number {
    return width - size - 1;
}

// Pixels
export function CockpitMFD2Y(width: number, height: number, size: number): number {
    return height - size - 1;
}

export class CockpitEntity implements Entity {

    constructor(private actor: PlayerEntity,
        private camera: THREE.PerspectiveCamera,
        private targetCamera: THREE.PerspectiveCamera,
        private mapCamera: THREE.OrthographicCamera) { }

    private aiPitch: number = 0;
    private aiRoll: number = 0;

    private landingGear: AircraftDeviceState = AircraftDeviceState.EXTENDED;
    private flaps: AircraftDeviceState = AircraftDeviceState.EXTENDED;
    private mapPlaneMarkerHeading: number = 0;
    private weaponsTarget: GroundTargetEntity | undefined;
    private weaponsTargetRange: number = 0; // Km
    private weaponsTargetBearing: number = 0; // degrees, 0 is North, increases CW
    private weaponsTargetZoomFactor: number = 1; // Times standard FOV

    private _v = new THREE.Vector3();
    private _w = new THREE.Vector3();

    readonly tags: string[] = [];

    enabled: boolean = true;

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {

        const prjForward = this.actor
            .getWorldDirection(this._v)
            .setY(0)
            .normalize();
        this.mapPlaneMarkerHeading = vectorHeading(prjForward);

        [this.aiPitch, this.aiRoll] = calculatePitchRoll(this.actor);

        this.mapCamera.position.copy(this.actor.position).setY(500);

        this.weaponsTarget = this.actor.weaponsTarget;

        if (this.weaponsTarget !== undefined) {
            this._v
                .copy(this.weaponsTarget.position)
                .sub(this.actor.position);
            this.weaponsTargetRange = this._v.length() / 1000.0;

            this._v
                .setY(0)
                .normalize();
            this.weaponsTargetBearing = vectorHeading(this._v);

            this.weaponsTargetZoomFactor = updateTargetCamera(this.actor, this.camera, this.targetCamera);
        }

        this.flaps = this.actor.flaps;
        this.landingGear = this.actor.landingGear;
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        // Nothing
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        if (!lists.has(SceneLayers.Overlay)) return;

        //! This should always be an integer!
        const scale = Math.max(1, Math.round(targetWidth / H_RES));

        const font = scale > 1 ? Font.HUD_LARGE : Font.HUD_SMALL;
        const hudColor = PaletteColor(palette, PaletteCategory.HUD_TEXT);

        this.renderAttitudeIndicator(targetWidth, targetHeight, painter, palette);

        const MFDSize = CockpitMFDSize(targetHeight);
        this.renderMFD1(
            CockpitMFD1X(targetWidth, targetHeight, MFDSize),
            CockpitMFD1Y(targetWidth, targetHeight, MFDSize),
            MFDSize, painter, hudColor);
        this.renderMFD2(
            CockpitMFD2X(targetWidth, targetHeight, MFDSize),
            CockpitMFD2Y(targetWidth, targetHeight, MFDSize),
            MFDSize, painter, hudColor, palette, font);

        const gearX = MFDSize + font.charSpacing + 2;
        const gearY = targetHeight - font.charHeight - font.charSpacing;
        this.renderDeviceStatus(gearX, gearY, painter, hudColor, font);
    }

    private renderAttitudeIndicator(targetWidth: number, targetHeight: number, painter: CanvasPainter, palette: Palette) {

        const halfWidth = targetWidth / 2;

        const AI_SIZE = 29 * Math.floor(targetWidth / LO_H_RES);
        const AI_SIZE_HALF = Math.floor(AI_SIZE / 2);
        const AI_X = halfWidth - AI_SIZE_HALF;
        const AI_Y = targetHeight - AI_SIZE + 1;
        const AI_X_MAX = AI_X + AI_SIZE - 1;
        const AI_Y_MAX = AI_Y + AI_SIZE - 1;
        const AI_CENTER_X = AI_X + AI_SIZE_HALF;
        const AI_CENTER_Y = AI_Y + AI_SIZE_HALF;

        const offset = this.aiPitch / (Math.PI / 2);
        const center = this._w.set(AI_CENTER_X, 0, AI_CENTER_Y);

        const normal = this._v.copy(FORWARD)
            .negate()
            .applyAxisAngle(UP, this.aiRoll);
        center.addScaledVector(normal, -offset * AI_SIZE);

        normal.multiplyScalar(AI_SIZE_HALF);

        const C0_X = Math.floor(center.x + normal.z);
        const C0_Y = Math.round(center.z + -normal.x);
        const C1_X = Math.floor(center.x + -normal.z);
        const C1_Y = Math.round(center.z + normal.x);

        painter.setBackground('#404042');
        painter.rectangle(AI_X - 2, AI_Y - 2, AI_SIZE + 3, AI_SIZE + 3, true);

        const clip = painter.clip().circle(AI_CENTER_X, AI_CENTER_Y, AI_SIZE_HALF).clip();

        const colorGround = PaletteColor(palette, PaletteCategory.COCKPIT_AI_GROUND);
        const colorSky = PaletteColor(palette, PaletteCategory.COCKPIT_AI_SKY);

        painter.setColor(colorGround);

        painter.setBackground(colorSky);
        painter.rectangle(AI_X, AI_Y, AI_SIZE - 1, AI_SIZE - 1, true);

        painter.setBackground(colorGround);
        if (C0_X < C1_X) {
            if (C0_X > AI_X && C0_Y < AI_Y_MAX) {
                painter.rectangle(AI_X, C0_Y, C0_X - AI_X, AI_Y_MAX - C0_Y, true);
            }
            if (C1_X < AI_X_MAX && C1_Y < AI_Y_MAX) {
                painter.rectangle(C1_X + 1, C1_Y, AI_X_MAX - C1_X - 1, AI_Y_MAX - C1_Y, true);
            }
            const C_Y = Math.max(C0_Y, C1_Y);
            if (C1_Y < AI_Y_MAX) {
                painter.rectangle(C0_X, C_Y, C1_X - C0_X + 1, AI_Y_MAX - C_Y, true);
            }
        } else {
            if (C1_X > AI_X && C1_Y > AI_Y) {
                painter.rectangle(AI_X, AI_Y, C1_X - AI_X, C1_Y - AI_Y, true);
            }
            if (C0_X < AI_X_MAX && C0_Y > AI_Y) {
                painter.rectangle(C0_X + 1, AI_Y, AI_X_MAX - C0_X - 1, C0_Y - AI_Y, true);
            }
            const C_Y = Math.min(C0_Y, C1_Y);
            if (C_Y > AI_Y) {
                painter.rectangle(C1_X, AI_Y, C0_X - C1_X + 1, C_Y - AI_Y, true);
            }
        }

        painter.rightTriangle(
            Math.floor(C0_X),
            Math.round(C0_Y),
            Math.floor(C1_X),
            Math.round(C1_Y));

        clip.clear();

        painter.setColor('#ffffff');
        painter.batch()
            .hLine(-1 + AI_CENTER_X - 8, -1 + AI_CENTER_X - 4, AI_CENTER_Y - 2)
            .hLine(AI_CENTER_X + 4, AI_CENTER_X + 8, AI_CENTER_Y - 2)
            .line(-1 + AI_CENTER_X - 4, AI_CENTER_Y - 2, -1 + AI_CENTER_X, AI_CENTER_Y + 2)
            .line(AI_CENTER_X, AI_CENTER_Y + 2, AI_CENTER_X + 4, AI_CENTER_Y - 2)
            .commit();
    }

    private renderMFD1(x: number, y: number, size: number, painter: CanvasPainter, hudColor: string) {
        painter.setColor(hudColor);
        painter.rectangle(x - 1, y - 1, size + 2, size + 2);
        painter.clear(x, y, size, size);

        this.renderPlaneMarker(x, y, size, painter);
    }

    private renderPlaneMarker(x: number, y: number, size: number, painter: CanvasPainter) {
        let aligned = true;
        let flipX = 1;
        let flipY = 1;
        if (this.mapPlaneMarkerHeading >= (360 - 22) && this.mapPlaneMarkerHeading <= (0 + 23)) {
            aligned = true;
            flipX = 1;
            flipY = 1;
        } else if (this.mapPlaneMarkerHeading >= (45 - 22) && this.mapPlaneMarkerHeading <= (45 + 23)) {
            aligned = false;
            flipX = 1;
            flipY = 1;
        } else if (this.mapPlaneMarkerHeading >= (90 - 22) && this.mapPlaneMarkerHeading <= (90 + 23)) {
            aligned = true;
            flipX = -1;
            flipY = 1;
        } else if (this.mapPlaneMarkerHeading >= (135 - 22) && this.mapPlaneMarkerHeading <= (135 + 23)) {
            aligned = false;
            flipX = 1;
            flipY = -1;
        } else if (this.mapPlaneMarkerHeading >= (180 - 22) && this.mapPlaneMarkerHeading <= (180 + 23)) {
            aligned = true;
            flipX = 1;
            flipY = -1;
        } else if (this.mapPlaneMarkerHeading >= (225 - 22) && this.mapPlaneMarkerHeading <= (225 + 23)) {
            aligned = false;
            flipX = -1;
            flipY = -1;
        } else if (this.mapPlaneMarkerHeading >= (270 - 22) && this.mapPlaneMarkerHeading <= (270 + 23)) {
            aligned = true;
            flipX = -1;
            flipY = -1;
        } else if (this.mapPlaneMarkerHeading >= (315 - 22) && this.mapPlaneMarkerHeading <= (315 + 23)) {
            aligned = false;
            flipX = -1;
            flipY = 1;
        }

        if (aligned) {
            this.renderAlignedPlaneMarker(x, y, size, painter, flipX, flipY);
        } else {
            this.renderAngledPlaneMarker(x, y, size, painter, flipX, flipY);
        }
    }

    private renderAlignedPlaneMarker(x: number, y: number, size: number, painter: CanvasPainter, flipX: number, flipY: number) {
        const bottomLeft = flipX > 0 ?
            { x: -1, y: 1 * flipY } :
            { x: -1 * flipY, y: -1 };
        const bottomRight = flipX > 0 ?
            { x: 1, y: 1 * flipY } :
            { x: -1 * flipY, y: 1 };
        const top = flipX > 0 ?
            { x: 0, y: -1 * flipY } :
            { x: 1 * flipY, y: 0 };
        const COCKPIT_MFD_SIZE_HALF = Math.floor(size / 2);
        const baseX = x + COCKPIT_MFD_SIZE_HALF;
        const baseY = y + COCKPIT_MFD_SIZE_HALF;

        painter.batch()
            .line(baseX + bottomLeft.x, baseY + bottomLeft.y, baseX, baseY)
            .line(baseX + bottomRight.x, baseY + bottomRight.y, baseX, baseY)
            .line(baseX + top.x, baseY + top.y, baseX, baseY)
            .commit();
    }

    private renderAngledPlaneMarker(x: number, y: number, size: number, painter: CanvasPainter, flipX: number, flipY: number) {
        const left = { x: -1 * flipX, y: 0 * flipY };
        const bottom = { x: 0 * flipX, y: 1 * flipY };
        const topRight = { x: 1 * flipX, y: -1 * flipY };
        const COCKPIT_MFD_SIZE_HALF = Math.floor(size / 2);
        const baseX = x + COCKPIT_MFD_SIZE_HALF;
        const baseY = y + COCKPIT_MFD_SIZE_HALF;

        painter.batch()
            .line(baseX + left.x, baseY + left.y, baseX, baseY)
            .line(baseX + bottom.x, baseY + bottom.y, baseX, baseY)
            .line(baseX + topRight.x, baseY + topRight.y, baseX, baseY)
            .commit();
    }

    private renderMFD2(x: number, y: number, size: number, painter: CanvasPainter, hudColor: string, palette: Palette, font: Font) {
        painter.setColor(hudColor);
        painter.rectangle(x - 1, y - 1, size + 2, size + 2);

        if (this.weaponsTarget === undefined) {
            painter.setBackground(PaletteColor(palette, PaletteCategory.COCKPIT_MFD_BACKGROUND));
            painter.rectangle(x, y, size, size, true);
            painter.text(font, x + font.charSpacing, y + size - font.charHeight - font.charSpacing, 'No target', hudColor);
        } else {
            painter.clear(x, y, size, size);
            painter.text(font, x + font.charSpacing, y + font.charSpacing,
                this.weaponsTarget.targetType, hudColor);
            painter.text(font, x + font.charSpacing, y + font.charSpacing * 2 + font.charHeight,
                `at ${this.weaponsTarget.targetLocation}`, hudColor);
            painter.text(font, x + font.charSpacing, y + size - 2 * (font.charHeight + font.charSpacing),
                `BRG ${formatHeading(this.weaponsTargetBearing)}`, hudColor);
            painter.text(font, x + size - font.charSpacing, y + size - 2 * (font.charHeight + font.charSpacing),
                `${this.weaponsTargetZoomFactor.toFixed(0)}x`, hudColor, TextAlignment.RIGHT);
            painter.text(font, x + font.charSpacing, y + size - font.charHeight - font.charSpacing,
                `Range ${this.weaponsTargetRange.toFixed(1)} KM`, hudColor);
        }
    }

    private renderDeviceStatus(x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        if (this.landingGear === AircraftDeviceState.EXTENDED || this.landingGear === AircraftDeviceState.EXTENDING) {
            painter.text(font, x, y, 'GEAR', hudColor);
        }
        if (this.flaps === AircraftDeviceState.EXTENDED || this.flaps === AircraftDeviceState.EXTENDING) {
            painter.text(font, x, y - font.charHeight - font.charSpacing, 'FLAPS', hudColor);
        }
    }
}