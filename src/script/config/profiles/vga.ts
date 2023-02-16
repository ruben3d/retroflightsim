import { TextEffect } from "../../render/screen/text";
import { VGAMidnightPalette } from "../palettes/vga-midnight";
import { VGANightVisionPalette } from "../palettes/vga-nightvision";
import { VGANoonPalette } from "../palettes/vga-noon";
import { DisplayShading, DisplayResolution, FogQuality, TechProfile } from "./profile";

export const VGAProfile: TechProfile = {
    fpsCap: true,
    textEffect: TextEffect.NONE,
    shading: DisplayShading.STATIC,
    resolution: DisplayResolution.LO_RES,
    fogQuality: FogQuality.LOW,
    noonPalette: VGANoonPalette,
    midnightPalette: VGAMidnightPalette,
    nightVisionPalette: VGANightVisionPalette
}
