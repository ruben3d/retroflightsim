import * as THREE from 'three';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { CHAR_HEIGHT, CHAR_MARGIN, TextAlignment } from "../../../render/screen/text";
import { FORWARD, RIGHT, Scene, SceneLayers, UP } from "../../scene";
import { Entity } from "../../entity";
import { Palette } from "../../palettes/palette";
import { COCKPIT_FOV, H_RES, H_RES_HALF, V_RES } from "../../../defs";
import { PlayerEntity } from "../player";
import { GroundTargetEntity } from '../groundTarget';
import { vectorBearing } from '../../../utils/math';
import { formatBearing } from './overlayUtils';
import { visibleWidthAtDistance } from '../../../render/helpers';


const AI_SIZE = 29;
const AI_SIZE_HALF = Math.floor(AI_SIZE / 2);
const AI_X = H_RES_HALF - AI_SIZE_HALF;
const AI_Y = V_RES - AI_SIZE + 1;
const AI_COLOR_GROUND = '#ffa200';
const AI_COLOR_SKY = '#2c558e';

const AI_X_MAX = AI_X + AI_SIZE - 1;
const AI_Y_MAX = AI_Y + AI_SIZE - 1;
const AI_CENTER_X = AI_X + AI_SIZE_HALF;
const AI_CENTER_Y = AI_Y + AI_SIZE_HALF;

export const COCKPIT_MFD_SIZE = Math.floor(V_RES / 3.333); // Pixels
const COCKPIT_MFD_SIZE_HALF = Math.floor(COCKPIT_MFD_SIZE / 2);
export const COCKPIT_MFD1_X = 1;
export const COCKPIT_MFD1_Y = V_RES - COCKPIT_MFD_SIZE - 1;
export const COCKPIT_MFD2_X = H_RES - COCKPIT_MFD_SIZE - 1;
export const COCKPIT_MFD2_Y = V_RES - COCKPIT_MFD_SIZE - 1;

const MFD_TARGET_SIZE_FACTOR = 1.5;
const MFD_TARGET_MAX_SIZE = 500;
const MFD_TARGET_CAMERA_MIN_ALTITUDE = 15;
const MFD_TARGET_CAMERA_ADAPTIVE_THRESHOLD = 5000;
const MFD_TARGET_CAMERA_CONSTANT_NEAR = 10;
const MFD_TARGET_CAMERA_CONSTANT_FAR = 10000;

export class CockpitEntity implements Entity {

    constructor(private actor: PlayerEntity,
        private camera: THREE.PerspectiveCamera,
        private targetCamera: THREE.PerspectiveCamera,
        private mapCamera: THREE.OrthographicCamera) { }

    private aiPitch: number = 0;
    private aiRoll: number = 0;

    private mapPlaneMarkerHeading: number = 0;
    private weaponsTarget: GroundTargetEntity | undefined;
    private weaponsTargetRange: number = 0; // Km
    private weaponsTargetBearing: number = 0; // degrees, 0 is North, increases CW
    private weaponsTargetZoomFactor: number = 1; // Times standard FOV

    private tmpV = new THREE.Vector3();
    private tmpV2 = new THREE.Vector3();
    private tmpQ = new THREE.Quaternion();

    readonly tags: string[] = [];

    enabled: boolean = true;

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {

        const forward = this.tmpV.copy(FORWARD)
            .applyQuaternion(this.actor.quaternion);
        const prjForward = this.tmpV2.copy(forward)
            .setY(0)
            .normalize();
        this.aiPitch = forward.angleTo(prjForward) * (forward.y >= 0 ? 1 : -1);
        this.mapPlaneMarkerHeading = vectorBearing(prjForward);

        this.tmpQ.setFromUnitVectors(forward, prjForward);

        const right = this.tmpV.copy(RIGHT)
            .applyQuaternion(this.actor.quaternion)
            .applyQuaternion(this.tmpQ);
        this.tmpQ.setFromUnitVectors(prjForward, FORWARD);
        right.applyQuaternion(this.tmpQ);
        this.aiRoll = Math.acos(right.x) * (right.y >= 0 ? -1 : 1);
        this.aiRoll = isNaN(this.aiRoll) ? 0.0 : this.aiRoll;

        this.mapCamera.position.copy(this.actor.position).setY(500);

        this.weaponsTarget = this.actor.weaponsTarget;

        if (this.weaponsTarget !== undefined) {
            this.tmpV
                .copy(this.weaponsTarget.position)
                .sub(this.actor.position);
            this.weaponsTargetRange = this.tmpV.length() / 1000.0;

            this.tmpV
                .setY(0)
                .normalize();
            this.weaponsTargetBearing = vectorBearing(this.tmpV);

            const d = this.actor.position.distanceTo(this.weaponsTarget.position);
            this.weaponsTargetZoomFactor = this.getWeaponsTargetZoomFactor(this.weaponsTarget, d);

            this.targetCamera.position.copy(this.actor.position).setY(Math.max(MFD_TARGET_CAMERA_MIN_ALTITUDE, this.actor.position.y));
            this.tmpV.addVectors(this.weaponsTarget.position, this.weaponsTarget.localCenter);
            this.targetCamera.lookAt(this.tmpV);
            this.targetCamera.fov = COCKPIT_FOV * 1 / this.weaponsTargetZoomFactor;
            if (d > MFD_TARGET_CAMERA_ADAPTIVE_THRESHOLD) {
                this.targetCamera.near = this.actor.position.distanceTo(this.weaponsTarget.position) / 2;
                this.targetCamera.far = this.actor.position.distanceTo(this.weaponsTarget.position) * 2;
            } else {
                this.targetCamera.near = MFD_TARGET_CAMERA_CONSTANT_NEAR;
                this.targetCamera.far = MFD_TARGET_CAMERA_CONSTANT_FAR;
            }
            this.targetCamera.updateProjectionMatrix();
        }
    }

    render(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        if (!lists.has(SceneLayers.Overlay)) return;

        this.renderAttitudeIndicator(painter, palette);
        this.renderMFD1(painter, palette);
        this.renderMFD2(painter, palette);
    }

    private renderAttitudeIndicator(painter: CanvasPainter, palette: Palette) {

        const offset = this.aiPitch / (Math.PI / 2);
        const center = this.tmpV2.set(AI_CENTER_X, 0, AI_CENTER_Y);

        const normal = this.tmpV.copy(FORWARD)
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

        painter.setColor(AI_COLOR_GROUND);

        painter.setBackground(AI_COLOR_SKY);
        painter.rectangle(AI_X, AI_Y, AI_SIZE - 1, AI_SIZE - 1, true);

        painter.setBackground(AI_COLOR_GROUND);
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

    private renderMFD1(painter: CanvasPainter, palette: Palette) {
        painter.setColor(palette.colors.HUD_TEXT);
        painter.rectangle(COCKPIT_MFD1_X - 1, COCKPIT_MFD1_Y - 1, COCKPIT_MFD_SIZE + 2, COCKPIT_MFD_SIZE + 2);
        painter.clear(COCKPIT_MFD1_X, COCKPIT_MFD1_Y, COCKPIT_MFD_SIZE, COCKPIT_MFD_SIZE);

        this.renderPlaneMarker(painter, palette);
    }

    private renderPlaneMarker(painter: CanvasPainter, palette: Palette) {
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
            this.renderAlignedPlaneMarker(painter, palette, flipX, flipY);
        } else {
            this.renderAngledPlaneMarker(painter, palette, flipX, flipY);
        }
    }

    private renderAlignedPlaneMarker(painter: CanvasPainter, palette: Palette, flipX: number, flipY: number) {
        const bottomLeft = flipX > 0 ?
            { x: -1, y: 1 * flipY } :
            { x: -1 * flipY, y: -1 };
        const bottomRight = flipX > 0 ?
            { x: 1, y: 1 * flipY } :
            { x: -1 * flipY, y: 1 };
        const top = flipX > 0 ?
            { x: 0, y: -1 * flipY } :
            { x: 1 * flipY, y: 0 };
        const baseX = COCKPIT_MFD1_X + COCKPIT_MFD_SIZE_HALF;
        const baseY = COCKPIT_MFD1_Y + COCKPIT_MFD_SIZE_HALF;

        painter.batch()
            .line(baseX + bottomLeft.x, baseY + bottomLeft.y, baseX, baseY)
            .line(baseX + bottomRight.x, baseY + bottomRight.y, baseX, baseY)
            .line(baseX + top.x, baseY + top.y, baseX, baseY)
            .commit();
    }

    private renderAngledPlaneMarker(painter: CanvasPainter, palette: Palette, flipX: number, flipY: number) {
        const left = { x: -1 * flipX, y: 0 * flipY };
        const bottom = { x: 0 * flipX, y: 1 * flipY };
        const topRight = { x: 1 * flipX, y: -1 * flipY };
        const baseX = COCKPIT_MFD1_X + COCKPIT_MFD_SIZE_HALF;
        const baseY = COCKPIT_MFD1_Y + COCKPIT_MFD_SIZE_HALF;

        painter.batch()
            .line(baseX + left.x, baseY + left.y, baseX, baseY)
            .line(baseX + bottom.x, baseY + bottom.y, baseX, baseY)
            .line(baseX + topRight.x, baseY + topRight.y, baseX, baseY)
            .commit();
    }

    private renderMFD2(painter: CanvasPainter, palette: Palette) {
        painter.setColor(palette.colors.HUD_TEXT);
        painter.rectangle(COCKPIT_MFD2_X - 1, COCKPIT_MFD2_Y - 1, COCKPIT_MFD_SIZE + 2, COCKPIT_MFD_SIZE + 2);

        if (this.weaponsTarget === undefined) {
            painter.setBackground('#142901');
            painter.rectangle(COCKPIT_MFD2_X, COCKPIT_MFD2_Y, COCKPIT_MFD_SIZE, COCKPIT_MFD_SIZE, true);
            painter.text(COCKPIT_MFD2_X + CHAR_MARGIN, COCKPIT_MFD2_Y + COCKPIT_MFD_SIZE - CHAR_HEIGHT - CHAR_MARGIN, 'No target', palette.colors.HUD_TEXT);
        } else {
            painter.clear(COCKPIT_MFD2_X, COCKPIT_MFD2_Y, COCKPIT_MFD_SIZE, COCKPIT_MFD_SIZE);
            painter.text(COCKPIT_MFD2_X + CHAR_MARGIN, COCKPIT_MFD2_Y + CHAR_MARGIN,
                this.weaponsTarget.targetType, palette.colors.HUD_TEXT);
            painter.text(COCKPIT_MFD2_X + CHAR_MARGIN, COCKPIT_MFD2_Y + CHAR_MARGIN * 2 + CHAR_HEIGHT,
                `at ${this.weaponsTarget.targetLocation}`, palette.colors.HUD_TEXT);
            painter.text(COCKPIT_MFD2_X + CHAR_MARGIN, COCKPIT_MFD2_Y + COCKPIT_MFD_SIZE - 2 * (CHAR_HEIGHT + CHAR_MARGIN),
                `BRG ${formatBearing(this.weaponsTargetBearing)}`, palette.colors.HUD_TEXT);
            painter.text(COCKPIT_MFD2_X + COCKPIT_MFD_SIZE - CHAR_MARGIN, COCKPIT_MFD2_Y + COCKPIT_MFD_SIZE - 2 * (CHAR_HEIGHT + CHAR_MARGIN),
                `${this.weaponsTargetZoomFactor.toFixed(0)}x`, palette.colors.HUD_TEXT, TextAlignment.RIGHT);
            painter.text(COCKPIT_MFD2_X + CHAR_MARGIN, COCKPIT_MFD2_Y + COCKPIT_MFD_SIZE - CHAR_HEIGHT - CHAR_MARGIN,
                `Range ${this.weaponsTargetRange.toFixed(1)} KM`, palette.colors.HUD_TEXT);
        }
    }

    private getWeaponsTargetZoomFactor(weaponsTarget: GroundTargetEntity, distance: number): number {
        const farWidth = visibleWidthAtDistance(this.camera, distance);
        const relativeSize = MFD_TARGET_SIZE_FACTOR * Math.min(MFD_TARGET_MAX_SIZE, weaponsTarget.maxSize) / farWidth;
        return Math.pow(2, relativeSize >= 1 ? 0 : Math.max(0, Math.floor(-Math.log2(relativeSize))));
    }
}