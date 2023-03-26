import * as THREE from 'three';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { CHAR_HEIGHT, CHAR_MARGIN, CHAR_WIDTH, TextAlignment } from "../../../render/screen/text";
import { FORWARD, Scene, SceneLayers } from "../../scene";
import { Entity } from "../../entity";
import { Palette, PaletteCategory, PaletteColor } from "../../../config/palettes/palette";
import { PlayerEntity } from "../player";
import { vectorHeading } from '../../../utils/math';
import { toFeet, toKnots } from './overlayUtils';
import { GroundTargetEntity } from '../groundTarget';


export class ExteriorDataEntity implements Entity {

    constructor(private actor: PlayerEntity) { }

    private heading: number = 0; // degrees, 0 is North, increases CW
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
        this.heading = vectorHeading(this.tmpVector);

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

        const headingX = halfWidth - 75;
        const airspeedX = halfWidth - (CHAR_WIDTH + CHAR_MARGIN) * 5;
        const altitudeX = halfWidth + 45;
        const navY = targetHeight - CHAR_HEIGHT * 2;

        const targetInfoX = halfWidth;
        const targetInfoY = navY - CHAR_HEIGHT * 2;

        this.renderAltitude(altitudeX, navY, painter, hudColor);
        this.renderHeading(headingX, navY, painter, hudColor);
        this.renderAirSpeed(airspeedX, navY, painter, hudColor);
        this.renderTargetInfo(targetInfoX, targetInfoY, painter, hudColor);
    }

    private renderAltitude(x: number, y: number, painter: CanvasPainter, hudColor: string) {
        painter.text(x, y, `Altitude ${this.altitude.toFixed(0)}`, hudColor, TextAlignment.LEFT);
    }

    private renderHeading(x: number, y: number, painter: CanvasPainter, hudColor: string) {
        painter.text(x, y, `Heading ${this.heading.toFixed(0)}`, hudColor, TextAlignment.LEFT);
    }

    private renderAirSpeed(x: number, y: number, painter: CanvasPainter, hudColor: string) {
        painter.text(x, y, `Airspeed ${Math.floor(this.speed).toFixed(0)}`, hudColor, TextAlignment.LEFT);
    }

    private renderTargetInfo(x: number, y: number, painter: CanvasPainter, hudColor: string) {
        if (this.weaponsTarget) {
            painter.text(x, y, `${this.weaponsTarget.targetType} at ${this.weaponsTarget.targetLocation}`, hudColor, TextAlignment.CENTER);
        }
    }
}