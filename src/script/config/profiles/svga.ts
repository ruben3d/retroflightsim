import { SVGAMidnightPalette } from "../palettes/svga-midnight";
import { SVGANoonPalette } from "../palettes/svga-noon";
import { DisplayShading, DisplayResolution, FogQuality, TechProfile } from "./profile";

export const SVGAProfile: TechProfile = {
    fpsCap: false,
    textShadow: false,
    shading: DisplayShading.DYNAMIC,
    resolution: DisplayResolution.HI_RES,
    fogQuality: FogQuality.HIGH,
    noonPalette: SVGANoonPalette,
    midnightPalette: SVGAMidnightPalette
}
