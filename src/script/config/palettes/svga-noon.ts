import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '#55FF55',
    [PaletteCategory.HUD_TEXT_EFFECT]: '#000000',
    [PaletteCategory.HUD_TEXT_SECONDARY]: '#55FF55',
    [PaletteCategory.HUD_TEXT_WARN]: '#FF0000',

    [PaletteCategory.COCKPIT_AI_SKY]: '#5dccf8',
    [PaletteCategory.COCKPIT_AI_GROUND]: '#b87f6e',
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: '#213a1f',

    [PaletteCategory.BACKGROUND]: '#b5d4eb',

    [PaletteCategory.FOG_SKY]: '#b5d4eb',
    [PaletteCategory.FOG_TERRAIN]: '#b5d4eb',
    [PaletteCategory.FOG_SPECKLE]: '#FFFFFF',
    [PaletteCategory.FOG_LIGHT]: '#b5d4eb',

    [PaletteCategory.SKY]: '#688ca5', // #92b8d3

    [PaletteCategory.TERRAIN_DEFAULT]: '#acac78',
    [PaletteCategory.TERRAIN_SAND]: '#acac78',
    [PaletteCategory.TERRAIN_BARE]: '#ab8a5d',
    [PaletteCategory.TERRAIN_GRASS]: '#3f6044',
    [PaletteCategory.TERRAIN_WATER]: '#195560',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#185d6d',
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: '#3f6044',
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: '#ab8a5d',

    [PaletteCategory.LIGHT_RED]: '#FF0000',
    [PaletteCategory.LIGHT_GREEN]: '#00FF00',
    [PaletteCategory.LIGHT_YELLOW]: '#FFFFBA',

    [PaletteCategory.GLASS]: '#688ca5',

    [PaletteCategory.VEHICLE_PLANE_GREY]: '#828385',
    [PaletteCategory.VEHICLE_PLANE_NAVY]: '#6f7981',
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: '#58595A',
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: '#4B484E',
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: '#202020',

    [PaletteCategory.SCENERY_SPECKLE]: '#707070',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#4D4D4D',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#555555',

    [PaletteCategory.SCENERY_FIELD_GREEN]: '#324134',
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: '#497a51',
    [PaletteCategory.SCENERY_FIELD_YELLOW]: '#dbb948',
    [PaletteCategory.SCENERY_FIELD_OCHRE]: '#ac7d48',
    [PaletteCategory.SCENERY_FIELD_RED]: '#ab6d5d',

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: '#d8d8d8',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: '#e16565',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: '#37aaaa',
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: '#9A9A9A',
    [PaletteCategory.SCENERY_BUILDING_METAL]: '#C0C0C0',
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: '#d8d8d8',
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: '#d43131',

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#C0C0C0',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#C0C0C0',

    [PaletteCategory.FX_FIRE]: '#ff8800',
    [PaletteCategory.FX_FIRE__B]: '#ffff00',

    [PaletteCategory.FX_SMOKE]: '#2c2c2c',
    [PaletteCategory.FX_SMOKE__B]: '#383838',
    [PaletteCategory.FX_SMOKE__C]: '#6c6c6c',
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.000035,
    [PaletteCategory.FOG_LIGHT]: 0.00002,
    [PaletteCategory.FOG_SPECKLE]: 0.0005
};

export const SVGANoonPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.DAY
};
