import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '#FFFFFF',
    [PaletteCategory.HUD_TEXT_EFFECT]: '#000000',
    [PaletteCategory.HUD_TEXT_SECONDARY]: '#AAAAAA',
    [PaletteCategory.HUD_TEXT_WARN]: '#FF0000',

    [PaletteCategory.COCKPIT_AI_SKY]: '#2c558e',
    [PaletteCategory.COCKPIT_AI_GROUND]: '#ffa200',
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: '#142901',

    [PaletteCategory.BACKGROUND]: '#D3D3D3',

    [PaletteCategory.FOG_SKY]: '#D3D3D3',
    [PaletteCategory.FOG_TERRAIN]: '#D3D3D3',
    [PaletteCategory.FOG_SPECKLE]: '#FFFFFF',
    [PaletteCategory.FOG_LIGHT]: '#D3D3D3',

    [PaletteCategory.SKY]: '#10A2FB',

    [PaletteCategory.TERRAIN_DEFAULT]: '#B37934',
    [PaletteCategory.TERRAIN_SAND]: '#B37934',
    [PaletteCategory.TERRAIN_BARE]: '#AD6025',
    [PaletteCategory.TERRAIN_GRASS]: '#078C02',
    [PaletteCategory.TERRAIN_WATER]: '#134795',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#0f54CC',
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: '#078502',
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: '#a75c24',

    [PaletteCategory.LIGHT_RED]: '#FF0000',
    [PaletteCategory.LIGHT_GREEN]: '#00FF00',
    [PaletteCategory.LIGHT_YELLOW]: '#FFFFBA',

    [PaletteCategory.GLASS]: '#10A2FB',

    [PaletteCategory.VEHICLE_PLANE_GREY]: '#828385',
    [PaletteCategory.VEHICLE_PLANE_NAVY]: '#6f7981',
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: '#58595A',
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: '#4B484E',
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: '#202020',

    [PaletteCategory.SCENERY_SPECKLE]: '#707070',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#4D4D4D',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#555555',

    [PaletteCategory.SCENERY_FIELD_GREEN]: '#006d00',
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: '#148214',
    [PaletteCategory.SCENERY_FIELD_YELLOW]: '#dbb228',
    [PaletteCategory.SCENERY_FIELD_OCHRE]: '#b66908',
    [PaletteCategory.SCENERY_FIELD_RED]: '#aa1414',

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: '#d8d8d8',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: '#e16565',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: '#37aaaa',
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: '#9A9A9A',
    [PaletteCategory.SCENERY_BUILDING_METAL]: '#C0C0C0',
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: '#d8d8d8',
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: '#d60000',

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#9A9A9A',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#C0C0C0',

    [PaletteCategory.FX_FIRE]: '#ff8800',
    [PaletteCategory.FX_FIRE__B]: '#ffff00',

    [PaletteCategory.FX_SMOKE]: '#2c2c2c',
    [PaletteCategory.FX_SMOKE__B]: '#383838',
    [PaletteCategory.FX_SMOKE__C]: '#6c6c6c',
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00005,
    [PaletteCategory.FOG_LIGHT]: 0.00003,
    [PaletteCategory.FOG_SPECKLE]: 0.0005
};

export const VGANoonPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.DAY
};
