import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '#FFFFFF',
    [PaletteCategory.HUD_TEXT_EFFECT]: '#000000',
    [PaletteCategory.HUD_TEXT_SECONDARY]: '#FFFFFF',
    [PaletteCategory.HUD_TEXT_WARN]: '#FF0000',

    [PaletteCategory.COCKPIT_AI_SKY]: '#2c558e',
    [PaletteCategory.COCKPIT_AI_GROUND]: '#ffa200',
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: '#142901',

    [PaletteCategory.BACKGROUND]: '#b6ebb6',

    [PaletteCategory.FOG_SKY]: '#b6ebb6',
    [PaletteCategory.FOG_TERRAIN]: '#b6ebb6',
    [PaletteCategory.FOG_SPECKLE]: '#b6ebb6',
    [PaletteCategory.FOG_LIGHT]: '#b6ebb6',

    [PaletteCategory.SKY]: '#3f503f',

    [PaletteCategory.TERRAIN_DEFAULT]: '#698869',
    [PaletteCategory.TERRAIN_SAND]: '#698869',
    [PaletteCategory.TERRAIN_BARE]: '#698869',
    [PaletteCategory.TERRAIN_GRASS]: '#698869',
    [PaletteCategory.TERRAIN_WATER]: '#374737',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#374737',
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: '#4d644d',
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: '#4d644d',

    [PaletteCategory.LIGHT_RED]: '#ffffff',
    [PaletteCategory.LIGHT_GREEN]: '#ffffff',
    [PaletteCategory.LIGHT_YELLOW]: '#b6ebb6',

    [PaletteCategory.GLASS]: '#3f503f',

    [PaletteCategory.VEHICLE_PLANE_GREY]: '#87af87',
    [PaletteCategory.VEHICLE_PLANE_NAVY]: '#709270',
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: '#5a755a',
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: '#5a755a',
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: '#171d17',


    [PaletteCategory.SCENERY_SPECKLE]: '#b6ebb6',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#83aa83',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#3f503f',

    [PaletteCategory.SCENERY_FIELD_GREEN]: '#6a8a6a',
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: '#4c634c',
    [PaletteCategory.SCENERY_FIELD_YELLOW]: '#4c634c',
    [PaletteCategory.SCENERY_FIELD_OCHRE]: '#4c634c',
    [PaletteCategory.SCENERY_FIELD_RED]: '#4c634c',

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: '#b6ebb6',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: '#b6ebb6',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: '#b6ebb6',
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: '#80a580',
    [PaletteCategory.SCENERY_BUILDING_METAL]: '#87af87',
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: '#b6ebb6',
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: '#617e61',

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#3f503f',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#3f503f',

    [PaletteCategory.FX_FIRE]: '#FFFFFF',
    [PaletteCategory.FX_FIRE__B]: '#b6ebb6',

    [PaletteCategory.FX_SMOKE]: '#83aa83',
    [PaletteCategory.FX_SMOKE__B]: '#4d654d',
    [PaletteCategory.FX_SMOKE__C]: '#283428',
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00005,
    [PaletteCategory.FOG_LIGHT]: 0.00003,
    [PaletteCategory.FOG_SPECKLE]: 0.0005
};

export const VGANightVisionPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.NIGHT
};
