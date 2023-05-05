import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '#FFFFFF',
    [PaletteCategory.HUD_TEXT_EFFECT]: '#000000',
    [PaletteCategory.HUD_TEXT_SECONDARY]: '#FFFFFF',
    [PaletteCategory.HUD_TEXT_WARN]: '#FF0000',

    [PaletteCategory.COCKPIT_AI_SKY]: '#2c558e',
    [PaletteCategory.COCKPIT_AI_GROUND]: '#ffa200',
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: '#142901',

    [PaletteCategory.BACKGROUND]: '#1f1f1f',

    [PaletteCategory.FOG_SKY]: '#101010',
    [PaletteCategory.FOG_TERRAIN]: '#101010',
    [PaletteCategory.FOG_SPECKLE]: '#101010',
    [PaletteCategory.FOG_LIGHT]: '#101010',

    [PaletteCategory.SKY]: '#1d1d1d',

    [PaletteCategory.TERRAIN_DEFAULT]: '#303030',
    [PaletteCategory.TERRAIN_SAND]: '#303030',
    [PaletteCategory.TERRAIN_BARE]: '#303030',
    [PaletteCategory.TERRAIN_GRASS]: '#303030',
    [PaletteCategory.TERRAIN_WATER]: '#1d1d1d',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#1d1d1d',
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: '#303030',
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: '#303030',

    [PaletteCategory.LIGHT_RED]: '#d4d4d4',
    [PaletteCategory.LIGHT_GREEN]: '#d4d4d4',
    [PaletteCategory.LIGHT_YELLOW]: '#d4d4d4',

    [PaletteCategory.GLASS]: '#1d1d1d',

    [PaletteCategory.VEHICLE_PLANE_GREY]: '#bdbdbd',
    [PaletteCategory.VEHICLE_PLANE_NAVY]: '#aaaaaa',
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: '#c9c9c9',
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: '#d3d3d3',
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: '#202020',


    [PaletteCategory.SCENERY_SPECKLE]: '#464646',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#3a3a3a',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#3f3f3f',

    [PaletteCategory.SCENERY_FIELD_GREEN]: '#616161',
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: '#616161',
    [PaletteCategory.SCENERY_FIELD_YELLOW]: '#616161',
    [PaletteCategory.SCENERY_FIELD_OCHRE]: '#616161',
    [PaletteCategory.SCENERY_FIELD_RED]: '#616161',

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: '#747474',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: '#747474',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: '#747474',
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: '#525252',
    [PaletteCategory.SCENERY_BUILDING_METAL]: '#5c5c5c',
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: '#5c5c5c',
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: '#5c5c5c',

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#636363',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#636363',

    [PaletteCategory.FX_FIRE]: '#eeeeee',
    [PaletteCategory.FX_FIRE__B]: '#cfcfcf',

    [PaletteCategory.FX_SMOKE]: '#a0a0a0',
    [PaletteCategory.FX_SMOKE__B]: '#747474',
    [PaletteCategory.FX_SMOKE__C]: '#393939',
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00005,
    [PaletteCategory.FOG_LIGHT]: 0.00007,
    [PaletteCategory.FOG_SPECKLE]: 0.0005
};

export const SVGANightVisionPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.NIGHT
};
