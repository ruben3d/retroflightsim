import { TextEffect } from "../../render/screen/text";
import { SVGAMidnightPalette } from "../palettes/svga-midnight";
import { SVGANightVisionPalette } from "../palettes/svga-nightvision";
import { SVGANoonPalette } from "../palettes/svga-noon";
import { DisplayShading, DisplayResolution, FogQuality, TechProfile } from "./profile";

export const SVGAProfile: TechProfile = {
    fpsCap: false,
    textEffect: TextEffect.NONE,
    shading: DisplayShading.DYNAMIC,
    resolution: DisplayResolution.HI_RES,
    fogQuality: FogQuality.HIGH,
    noonPalette: SVGANoonPalette,
    midnightPalette: SVGAMidnightPalette,
    nightVisionPalette: SVGANightVisionPalette
}
