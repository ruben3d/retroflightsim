import { TextEffect } from "../../render/screen/text";
import { EGAMidnightPalette } from "../palettes/ega-midnight";
import { EGANoonPalette } from "../palettes/ega-noon";
import { DisplayShading, DisplayResolution, FogQuality, TechProfile } from "./profile";

export const EGAProfile: TechProfile = {
    fpsCap: true,
    textEffect: TextEffect.SHADOW,
    shading: DisplayShading.DUOTONE,
    resolution: DisplayResolution.LO_RES,
    fogQuality: FogQuality.NONE,
    noonPalette: EGANoonPalette,
    midnightPalette: EGAMidnightPalette
}
