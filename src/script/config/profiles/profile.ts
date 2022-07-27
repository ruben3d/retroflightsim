import { Palette } from "../palettes/palette";

export enum DisplayResolution {
    LO_RES, // 320x200
    HI_RES // 640x400
}

export enum DisplayShading {
    DUOTONE,
    STATIC,
    DYNAMIC
}

export enum FogQuality {
    NONE, // Disabled
    LOW, // Plane
    HIGH // Sphere
}

export interface TechProfile {
    fpsCap: boolean;
    textShadow: boolean;
    shading: DisplayShading;
    resolution: DisplayResolution;
    fogQuality: FogQuality;
    noonPalette: Palette;
    midnightPalette: Palette;
}
