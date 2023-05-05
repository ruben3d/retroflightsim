import * as THREE from 'three';
import { Palette, PaletteCategory, PaletteColor } from "../../../config/palettes/palette";
import { H_RES } from '../../../defs';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { Font, TextAlignment } from "../../../render/screen/text";
import { Entity } from "../../entity";
import { Scene, SceneLayers } from "../../scene";


export class MessagesEntity implements Entity {

    public message: string = '';

    constructor() { }

    readonly tags: string[] = [];

    enabled: boolean = true;

    init(scene: Scene): void {
        // Nothing
    }

    update(delta: number): void {
        // Nothing
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

        const x = targetWidth / 2;
        const y = font.charHeight * 2;

        painter.text(font, x, y, this.message, hudColor, TextAlignment.CENTER);
    }
}