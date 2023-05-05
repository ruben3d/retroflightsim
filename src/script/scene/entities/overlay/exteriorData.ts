import * as THREE from 'three';
import { Palette, PaletteCategory, PaletteColor } from "../../../config/palettes/palette";
import { H_RES } from '../../../defs';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { Font, TextAlignment } from "../../../render/screen/text";
import { FORWARD, vectorHeading } from '../../../utils/math';
import { Entity } from "../../entity";
import { Scene, SceneLayers } from "../../scene";
import { GroundTargetEntity } from '../groundTarget';
import { PlayerEntity } from "../player";
import { toFeet, toKnots } from './overlayUtils';


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

        const scale = Math.max(1, Math.round(targetWidth / H_RES));

        const font = scale > 1 ? Font.HUD_LARGE : Font.HUD_SMALL;
        const hudColor = PaletteColor(palette, PaletteCategory.HUD_TEXT);

        painter.setColor(hudColor);

        const halfWidth = targetWidth / 2;

        const headingX = halfWidth - (font.charWidth + font.charSpacing) * 19;
        const airspeedX = halfWidth - (font.charWidth + font.charSpacing) * 5;
        const altitudeX = halfWidth + (font.charWidth + font.charSpacing) * 12;
        const navY = targetHeight - font.charHeight * 2;

        const targetInfoX = halfWidth;
        const targetInfoY = navY - font.charHeight * 2;

        this.renderAltitude(altitudeX, navY, painter, hudColor, font);
        this.renderHeading(headingX, navY, painter, hudColor, font);
        this.renderAirSpeed(airspeedX, navY, painter, hudColor, font);
        this.renderTargetInfo(targetInfoX, targetInfoY, painter, hudColor, font);
    }

    private renderAltitude(x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        painter.text(font, x, y, `Altitude ${this.altitude.toFixed(0)}`, hudColor, TextAlignment.LEFT);
    }

    private renderHeading(x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        painter.text(font, x, y, `Heading ${this.heading.toFixed(0)}`, hudColor, TextAlignment.LEFT);
    }

    private renderAirSpeed(x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        painter.text(font, x, y, `Airspeed ${Math.floor(this.speed).toFixed(0)}`, hudColor, TextAlignment.LEFT);
    }

    private renderTargetInfo(x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        if (this.weaponsTarget) {
            painter.text(font, x, y, `${this.weaponsTarget.targetType} at ${this.weaponsTarget.targetLocation}`, hudColor, TextAlignment.CENTER);
        }
    }
}