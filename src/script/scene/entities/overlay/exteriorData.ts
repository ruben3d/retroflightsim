import * as THREE from 'three';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { CHAR_HEIGHT, CHAR_MARGIN, CHAR_WIDTH, TextAlignment } from "../../../render/screen/text";
import { FORWARD, Scene, SceneLayers } from "../../scene";
import { Entity } from "../../entity";
import { Palette, PaletteCategory } from "../../palettes/palette";
import { H_RES_HALF, V_RES } from "../../../defs";
import { PlayerEntity } from "../player";
import { vectorBearing } from '../../../utils/math';
import { toFeet, toKnots } from './overlayUtils';
import { GroundTargetEntity } from '../groundTarget';


const BEARING_X = H_RES_HALF - 75;
const AIRSPEED_X = H_RES_HALF - (CHAR_WIDTH + CHAR_MARGIN) * 5;
const ALTITUDE_X = H_RES_HALF + 45;

const Y = V_RES - CHAR_HEIGHT * 2;

const TARGETINFO_X = H_RES_HALF;
const TARGETINFO_Y = Y - CHAR_HEIGHT * 2;


export class ExteriorDataEntity implements Entity {

    constructor(private actor: PlayerEntity) { }

    private bearing: number = 0; // degrees, 0 is North, increases CW
    private altitude: number = 0; // feet
    private speed: number = 0; // knots
    private weaponsTarget: GroundTargetEntity | undefined;

    private tmpVector = new THREE.Vector3();

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

        this.speed = toKnots(this.actor.rawSpeed);

        this.weaponsTarget = this.actor.weaponsTarget;
    }

    render(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        if (!lists.has(SceneLayers.Overlay)) return;

        painter.setColor(palette.colors.HUD_TEXT);

        this.renderAltitude(painter, palette);
        this.renderBearing(painter, palette);
        this.renderAirSpeed(painter, palette);
        this.renderTargetInfo(painter, palette);
    }

    private renderAltitude(painter: CanvasPainter, palette: Palette) {
        painter.text(ALTITUDE_X, Y, `Altitude ${this.altitude.toFixed(0)}`, palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.LEFT);
    }

    private renderBearing(painter: CanvasPainter, palette: Palette) {
        painter.text(BEARING_X, Y, `Heading ${this.bearing.toFixed(0)}`, palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.LEFT);
    }

    private renderAirSpeed(painter: CanvasPainter, palette: Palette) {
        painter.text(AIRSPEED_X, Y, `Airspeed ${Math.floor(this.speed).toFixed(0)}`, palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.LEFT);
    }

    private renderTargetInfo(painter: CanvasPainter, palette: Palette) {
        if (this.weaponsTarget) {
            painter.text(TARGETINFO_X, TARGETINFO_Y, `${this.weaponsTarget.targetType} at ${this.weaponsTarget.targetLocation}`, palette.colors[PaletteCategory.HUD_TEXT], TextAlignment.CENTER);
        }
    }
}