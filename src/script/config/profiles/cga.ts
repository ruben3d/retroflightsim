import { TextEffect } from "../../render/screen/text";
import { CGAMidnightPalette } from "../palettes/cga-midnight";
import { CGANoonPalette } from "../palettes/cga-noon";
import { DisplayShading, DisplayResolution, FogQuality, TechProfile } from "./profile";

export const CGAProfile: TechProfile = {
    fpsCap: true,
    textEffect: TextEffect.BACKGROUND,
    shading: DisplayShading.DUOTONE,
    resolution: DisplayResolution.LO_RES,
    fogQuality: FogQuality.NONE,
    noonPalette: CGANoonPalette,
    midnightPalette: CGAMidnightPalette
}
