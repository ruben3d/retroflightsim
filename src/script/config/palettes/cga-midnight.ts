import { CGA_BLACK, CGA_CYAN, CGA_MAGENTA, CGA_WHITE } from "./cga-defs";
import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: CGA_WHITE,
    [PaletteCategory.HUD_TEXT_EFFECT]: CGA_BLACK,
    [PaletteCategory.HUD_TEXT_SECONDARY]: CGA_WHITE,
    [PaletteCategory.HUD_TEXT_WARN]: CGA_MAGENTA,

    [PaletteCategory.COCKPIT_AI_SKY]: CGA_CYAN,
    [PaletteCategory.COCKPIT_AI_GROUND]: CGA_MAGENTA,
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: CGA_BLACK,

    [PaletteCategory.BACKGROUND]: CGA_BLACK,

    [PaletteCategory.FOG_SKY]: CGA_WHITE,
    [PaletteCategory.FOG_TERRAIN]: CGA_WHITE,
    [PaletteCategory.FOG_SPECKLE]: CGA_WHITE,
    [PaletteCategory.FOG_LIGHT]: CGA_WHITE,

    [PaletteCategory.SKY]: CGA_BLACK,

    [PaletteCategory.TERRAIN_DEFAULT]: CGA_MAGENTA,
    [PaletteCategory.TERRAIN_SAND]: CGA_BLACK,
    [PaletteCategory.TERRAIN_BARE]: CGA_BLACK,
    [PaletteCategory.TERRAIN_GRASS]: CGA_BLACK,
    [PaletteCategory.TERRAIN_WATER]: [CGA_CYAN, CGA_BLACK],
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: [CGA_CYAN, CGA_BLACK],
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: [CGA_MAGENTA, CGA_BLACK],
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: [CGA_MAGENTA, CGA_BLACK],

    [PaletteCategory.LIGHT_RED]: CGA_MAGENTA,
    [PaletteCategory.LIGHT_GREEN]: CGA_WHITE,
    [PaletteCategory.LIGHT_YELLOW]: CGA_WHITE,

    [PaletteCategory.GLASS]: CGA_CYAN,

    [PaletteCategory.VEHICLE_PLANE_GREY]: [CGA_WHITE, CGA_BLACK],
    [PaletteCategory.VEHICLE_PLANE_NAVY]: CGA_WHITE,
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: CGA_BLACK,
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: CGA_BLACK,
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: CGA_BLACK,

    [PaletteCategory.SCENERY_SPECKLE]: CGA_WHITE,

    [PaletteCategory.SCENERY_ROAD_MAIN]: CGA_WHITE,
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: CGA_BLACK,

    [PaletteCategory.SCENERY_FIELD_GREEN]: CGA_MAGENTA,
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: [CGA_WHITE, CGA_MAGENTA],
    [PaletteCategory.SCENERY_FIELD_YELLOW]: CGA_WHITE,
    [PaletteCategory.SCENERY_FIELD_OCHRE]: [CGA_WHITE, CGA_MAGENTA],
    [PaletteCategory.SCENERY_FIELD_RED]: [CGA_CYAN, CGA_MAGENTA],

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: [CGA_WHITE, CGA_BLACK],
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: [CGA_WHITE, CGA_MAGENTA],
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: [CGA_WHITE, CGA_CYAN],
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: [CGA_WHITE, CGA_BLACK],
    [PaletteCategory.SCENERY_BUILDING_METAL]: [CGA_MAGENTA, CGA_BLACK],
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: CGA_WHITE,
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: [CGA_WHITE, CGA_MAGENTA],

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: CGA_WHITE,
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: CGA_WHITE,

    [PaletteCategory.FX_FIRE]: CGA_MAGENTA,
    [PaletteCategory.FX_FIRE__B]: CGA_WHITE,

    [PaletteCategory.FX_SMOKE]: CGA_WHITE,
    [PaletteCategory.FX_SMOKE__B]: CGA_WHITE,
    [PaletteCategory.FX_SMOKE__C]: CGA_WHITE,
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.0,
    [PaletteCategory.FOG_TERRAIN]: 0.0,
    [PaletteCategory.FOG_LIGHT]: 0.0,
    [PaletteCategory.FOG_SPECKLE]: 0.0
};

export const CGAMidnightPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.NIGHT
};
