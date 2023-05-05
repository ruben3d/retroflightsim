import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '#55FF55',
    [PaletteCategory.HUD_TEXT_EFFECT]: '#000000',
    [PaletteCategory.HUD_TEXT_SECONDARY]: '#55FF55',
    [PaletteCategory.HUD_TEXT_WARN]: '#FF0000',

    [PaletteCategory.COCKPIT_AI_SKY]: '#5dccf8',
    [PaletteCategory.COCKPIT_AI_GROUND]: '#b87f6e',
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: '#213a1f',

    [PaletteCategory.BACKGROUND]: '#062831', // Dawn: #912714, #182127

    [PaletteCategory.FOG_SKY]: '#062831',
    [PaletteCategory.FOG_TERRAIN]: '#000000',
    [PaletteCategory.FOG_SPECKLE]: '#000000',
    [PaletteCategory.FOG_LIGHT]: '#ffffff',

    [PaletteCategory.SKY]: '#0f1418',

    [PaletteCategory.TERRAIN_DEFAULT]: '#181814',
    [PaletteCategory.TERRAIN_SAND]: '#181814',
    [PaletteCategory.TERRAIN_BARE]: '#1b1813',
    [PaletteCategory.TERRAIN_GRASS]: '#101611',
    [PaletteCategory.TERRAIN_WATER]: '#0f1418',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#11171b',
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: '#0f1310',
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: '#1a1613',

    [PaletteCategory.LIGHT_RED]: '#FF0000',
    [PaletteCategory.LIGHT_GREEN]: '#00FF00',
    [PaletteCategory.LIGHT_YELLOW]: '#FFFFBA',

    [PaletteCategory.GLASS]: '#062831',

    [PaletteCategory.VEHICLE_PLANE_GREY]: '#161616',
    [PaletteCategory.VEHICLE_PLANE_NAVY]: '#18181a',
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: '#0e0e0e',
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: '#0e0e0e',
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: '#050505',

    [PaletteCategory.SCENERY_SPECKLE]: '#505050',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#131313',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#181818',

    [PaletteCategory.SCENERY_FIELD_GREEN]: '#213824',
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: '#121f14',
    [PaletteCategory.SCENERY_FIELD_YELLOW]: '#221d0a',
    [PaletteCategory.SCENERY_FIELD_OCHRE]: '#241a10',
    [PaletteCategory.SCENERY_FIELD_RED]: '#201411',

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: '#2e2e2e',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: '#291212',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: '#0e2b2b',
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: '#2e2e2e',
    [PaletteCategory.SCENERY_BUILDING_METAL]: '#1a1a1a',
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: '#363636',
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: '#380c0c',

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#C0C0C0',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#3a3a3a',

    [PaletteCategory.FX_FIRE]: '#ff8800',
    [PaletteCategory.FX_FIRE__B]: '#ffff00',

    [PaletteCategory.FX_SMOKE]: '#6c6c6c',
    [PaletteCategory.FX_SMOKE__B]: '#383838',
    [PaletteCategory.FX_SMOKE__C]: '#2c2c2c',
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00015,
    [PaletteCategory.FOG_LIGHT]: 0.0,
    [PaletteCategory.FOG_SPECKLE]: 0.003
};

export const SVGAMidnightPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.NIGHT
};
