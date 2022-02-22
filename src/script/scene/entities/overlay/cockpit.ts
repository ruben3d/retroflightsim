import * as THREE from 'three';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { TextAlignment } from "../../../render/screen/text";
import { Scene, SceneLayers } from "../../scene";
import { Entity } from "../../entity";
import { Palette } from "../../palettes/palette";
import { H_RES, V_RES } from "../../../defs";
import { PlayerEntity } from "../player";
import { GroundTargetEntity } from '../groundTarget';
import { vectorBearing } from '../../../utils/math';
import { formatBearing } from './overlayUtils';
import { visibleWidthAtDistance } from '../../../render/helpers';


export const COCKPIT_MFD_SIZE = Math.floor(V_RES / 3.333); // Pixels
export const COCKPIT_MFD_X = H_RES - COCKPIT_MFD_SIZE - 1;
export const COCKPIT_MFD_Y = V_RES - COCKPIT_MFD_SIZE - 1;

const MFD_TARGET_SIZE_FACTOR = 1.5;
const MFD_TARGET_MAX_SIZE = 500;
const MFD_TARGET_CAMERA_MIN_ALTITUDE = 15;
const MFD_TARGET_CAMERA_ADAPTIVE_THRESHOLD = 5000;
const MFD_TARGET_CAMERA_CONSTANT_NEAR = 10;
const MFD_TARGET_CAMERA_CONSTANT_FAR = 10000;

export class CockpitEntity implements Entity {

    constructor(private actor: PlayerEntity, private camera: THREE.PerspectiveCamera, private targetCamera: THREE.PerspectiveCamera) { }

    private weaponsTarget: GroundTargetEntity | undefined;
    private weaponsTargetRange: number = 0; // Km
    private weaponsTargetBearing: number = 0; // degrees, 0 is North, increases CW
    private weaponsTargetZoomFactor: number = 1; // Times standard FOV

    private tmpVector = new THREE.Vector3();

    readonly tags: string[] = [];

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        this.weaponsTarget = this.actor.weaponsTarget;

        if (this.weaponsTarget !== undefined) {
            this.tmpVector
                .copy(this.weaponsTarget.position)
                .sub(this.actor.position);
            this.weaponsTargetRange = this.tmpVector.length() / 1000.0;

            this.tmpVector
                .setY(0)
                .normalize();
            this.weaponsTargetBearing = vectorBearing(this.tmpVector);

            const d = this.camera.position.distanceTo(this.weaponsTarget.position);
            this.weaponsTargetZoomFactor = this.getWeaponsTargetZoomFactor(this.weaponsTarget, d);

            this.targetCamera.position.copy(this.camera.position).setY(Math.max(MFD_TARGET_CAMERA_MIN_ALTITUDE, this.camera.position.y));
            this.tmpVector.addVectors(this.weaponsTarget.position, this.weaponsTarget.localCenter);
            this.targetCamera.lookAt(this.tmpVector);
            this.targetCamera.fov = this.camera.fov * 1 / this.weaponsTargetZoomFactor;
            if (d > MFD_TARGET_CAMERA_ADAPTIVE_THRESHOLD) {
                this.targetCamera.near = this.camera.position.distanceTo(this.weaponsTarget.position) / 2;
                this.targetCamera.far = this.camera.position.distanceTo(this.weaponsTarget.position) * 2;
            } else {
                this.targetCamera.near = MFD_TARGET_CAMERA_CONSTANT_NEAR;
                this.targetCamera.far = MFD_TARGET_CAMERA_CONSTANT_FAR;
            }
            this.targetCamera.updateProjectionMatrix();
        }
    }

    render(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        if (!lists.has(SceneLayers.Overlay)) return;

        painter.setColor(palette.colors.HUD_TEXT);

        this.renderMFD(painter, palette);
    }

    private renderMFD(painter: CanvasPainter, palette: Palette) {
        if (this.weaponsTarget === undefined) return;

        painter.rectangle(COCKPIT_MFD_X - 1, COCKPIT_MFD_Y - 1, COCKPIT_MFD_SIZE + 2, COCKPIT_MFD_SIZE + 2);
        painter.clear(COCKPIT_MFD_X, COCKPIT_MFD_Y, COCKPIT_MFD_SIZE, COCKPIT_MFD_SIZE);

        painter.text(COCKPIT_MFD_X + 1, COCKPIT_MFD_Y + 1, this.weaponsTarget.targetType, palette.colors.HUD_TEXT);
        painter.text(COCKPIT_MFD_X + 1, COCKPIT_MFD_Y + 7, `at ${this.weaponsTarget.targetLocation}`, palette.colors.HUD_TEXT);
        painter.text(COCKPIT_MFD_X + 1, COCKPIT_MFD_Y + COCKPIT_MFD_SIZE - 12, `BRG ${formatBearing(this.weaponsTargetBearing)}`, palette.colors.HUD_TEXT);
        painter.text(COCKPIT_MFD_X + COCKPIT_MFD_SIZE - 1, COCKPIT_MFD_Y + COCKPIT_MFD_SIZE - 12, `${this.weaponsTargetZoomFactor.toFixed(0)}x`, palette.colors.HUD_TEXT, TextAlignment.RIGHT);
        painter.text(COCKPIT_MFD_X + 1, COCKPIT_MFD_Y + COCKPIT_MFD_SIZE - 6, `Range ${this.weaponsTargetRange.toFixed(1)} KM`, palette.colors.HUD_TEXT);
    }

    private getWeaponsTargetZoomFactor(weaponsTarget: GroundTargetEntity, distance: number): number {
        const farWidth = visibleWidthAtDistance(this.camera, distance);
        const relativeSize = MFD_TARGET_SIZE_FACTOR * Math.min(MFD_TARGET_MAX_SIZE, weaponsTarget.maxSize) / farWidth;
        return Math.pow(2, relativeSize >= 1 ? 0 : Math.max(0, Math.floor(-Math.log2(relativeSize))));
    }
}