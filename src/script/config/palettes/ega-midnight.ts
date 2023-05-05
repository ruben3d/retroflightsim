import { EGA_BLACK, EGA_BLACK_BRIGHT, EGA_BLUE, EGA_CYAN, EGA_CYAN_BRIGHT, EGA_GREEN, EGA_GREEN_BRIGHT, EGA_MAGENTA, EGA_RED, EGA_RED_BRIGHT, EGA_WHITE, EGA_WHITE_BRIGHT, EGA_YELLOW, EGA_YELLOW_BRIGHT } from "./ega-defs";
import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: EGA_WHITE_BRIGHT,
    [PaletteCategory.HUD_TEXT_EFFECT]: EGA_BLACK,
    [PaletteCategory.HUD_TEXT_SECONDARY]: EGA_WHITE,
    [PaletteCategory.HUD_TEXT_WARN]: EGA_RED_BRIGHT,

    [PaletteCategory.COCKPIT_AI_SKY]: EGA_CYAN_BRIGHT,
    [PaletteCategory.COCKPIT_AI_GROUND]: EGA_YELLOW,
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: EGA_BLACK,

    [PaletteCategory.BACKGROUND]: EGA_BLUE,

    [PaletteCategory.FOG_SKY]: EGA_WHITE_BRIGHT,
    [PaletteCategory.FOG_TERRAIN]: EGA_WHITE_BRIGHT,
    [PaletteCategory.FOG_SPECKLE]: EGA_WHITE_BRIGHT,
    [PaletteCategory.FOG_LIGHT]: EGA_WHITE_BRIGHT,

    [PaletteCategory.SKY]: EGA_BLUE,

    [PaletteCategory.TERRAIN_DEFAULT]: EGA_BLACK,
    [PaletteCategory.TERRAIN_SAND]: EGA_BLACK,
    [PaletteCategory.TERRAIN_BARE]: EGA_BLACK_BRIGHT,
    [PaletteCategory.TERRAIN_GRASS]: EGA_BLACK_BRIGHT,
    [PaletteCategory.TERRAIN_WATER]: EGA_BLUE,
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: EGA_BLUE,
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: [EGA_GREEN, EGA_BLACK],
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: [EGA_MAGENTA, EGA_BLACK],

    [PaletteCategory.LIGHT_RED]: EGA_RED_BRIGHT,
    [PaletteCategory.LIGHT_GREEN]: EGA_GREEN_BRIGHT,
    [PaletteCategory.LIGHT_YELLOW]: EGA_YELLOW_BRIGHT,

    [PaletteCategory.GLASS]: EGA_MAGENTA,

    [PaletteCategory.VEHICLE_PLANE_GREY]: [EGA_BLACK_BRIGHT, EGA_BLACK],
    [PaletteCategory.VEHICLE_PLANE_NAVY]: [EGA_BLACK, EGA_BLACK_BRIGHT],
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: EGA_BLACK,
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: EGA_BLACK,
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: EGA_BLACK,

    [PaletteCategory.SCENERY_SPECKLE]: EGA_WHITE,

    [PaletteCategory.SCENERY_ROAD_MAIN]: EGA_WHITE,
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: EGA_BLACK,

    [PaletteCategory.SCENERY_FIELD_GREEN]: EGA_GREEN,
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: EGA_WHITE,
    [PaletteCategory.SCENERY_FIELD_YELLOW]: EGA_YELLOW,
    [PaletteCategory.SCENERY_FIELD_OCHRE]: EGA_MAGENTA,
    [PaletteCategory.SCENERY_FIELD_RED]: EGA_RED,

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: [EGA_BLACK_BRIGHT, EGA_BLACK],
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: [EGA_RED, EGA_BLACK_BRIGHT],
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: [EGA_CYAN, EGA_BLUE],
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: [EGA_BLACK_BRIGHT, EGA_BLACK],
    [PaletteCategory.SCENERY_BUILDING_METAL]: EGA_BLACK,
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: [EGA_BLACK_BRIGHT, EGA_BLACK],
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: [EGA_RED, EGA_BLACK],

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: EGA_WHITE_BRIGHT,
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: EGA_WHITE_BRIGHT,

    [PaletteCategory.FX_FIRE]: EGA_RED_BRIGHT,
    [PaletteCategory.FX_FIRE__B]: EGA_YELLOW_BRIGHT,

    [PaletteCategory.FX_SMOKE]: EGA_BLACK_BRIGHT,
    [PaletteCategory.FX_SMOKE__B]: EGA_BLACK_BRIGHT,
    [PaletteCategory.FX_SMOKE__C]: EGA_BLACK_BRIGHT,
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.0,
    [PaletteCategory.FOG_TERRAIN]: 0.0,
    [PaletteCategory.FOG_LIGHT]: 0.0,
    [PaletteCategory.FOG_SPECKLE]: 0.0
};

export const EGAMidnightPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.NIGHT
};
