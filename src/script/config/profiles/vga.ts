import { VGAMidnightPalette } from "../palettes/vga-midnight";
import { VGANoonPalette } from "../palettes/vga-noon";
import { DisplayShading, DisplayResolution, FogQuality, TechProfile } from "./profile";

export const VGAProfile: TechProfile = {
    fpsCap: true,
    textShadow: false,
    shading: DisplayShading.STATIC,
    resolution: DisplayResolution.LO_RES,
    fogQuality: FogQuality.LOW,
    noonPalette: VGANoonPalette,
    midnightPalette: VGAMidnightPalette
}
