import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '', // Use default

    [PaletteCategory.BACKGROUND]: '#D3D3D3',

    [PaletteCategory.FOG_SKY]: '#D3D3D3',
    [PaletteCategory.FOG_TERRAIN]: '#D3D3D3',
    [PaletteCategory.FOG_SPECKLE]: '#FFFFFF',
    [PaletteCategory.FOG_LIGHT]: '#FFFFFF',

    [PaletteCategory.SKY]: '#10A2FB',

    [PaletteCategory.TERRAIN_DEFAULT]: '#B37934',
    [PaletteCategory.TERRAIN_SAND]: '#B37934',
    [PaletteCategory.TERRAIN_BARE]: '#AD6025',
    [PaletteCategory.TERRAIN_GRASS]: '#078C02',
    [PaletteCategory.TERRAIN_WATER]: '#134795',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#0f54CC',
    [PaletteCategory.DECORATION_MOUNTAIN_GRASS]: '#078C02',
    [PaletteCategory.DECORATION_MOUNTAIN_BARE]: '#AD6025',

    [PaletteCategory.LIGHT_RED]: '#FF0000',
    [PaletteCategory.LIGHT_GREEN]: '#00FF00',
    [PaletteCategory.LIGHT_YELLOW]: '#FFFFBA',

    [PaletteCategory.GLASS]: '#10A2FB',

    [PaletteCategory.SCENERY_SPECKLE]: '#707070',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#4D4D4D',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#555555',

    [PaletteCategory.SCENERY_BASE_PLASTER]: '#d8d8d8',
    [PaletteCategory.SCENERY_BASE_CONCRETE]: '#9A9A9A',
    [PaletteCategory.SCENERY_BASE_METAL]: '#C0C0C0',
    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#9A9A9A',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#C0C0C0',

};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00005,
    [PaletteCategory.FOG_LIGHT]: 0.0,
    [PaletteCategory.FOG_SPECKLE]: 0.0005
};

export const NoonPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.DAY
};
