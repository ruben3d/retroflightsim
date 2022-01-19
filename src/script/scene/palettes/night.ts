import { Palette, PaletteCategory, PaletteColors, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.BACKGROUND]: '#753C79',
    [PaletteCategory.FOG_SKY]: '#753C79',
    [PaletteCategory.FOG_TERRAIN]: '#181004',
    [PaletteCategory.SKY]: '#202849',
    [PaletteCategory.TERRAIN_DEFAULT]: '#4D4534',
    [PaletteCategory.TERRAIN_SAND]: '#4D4534',
    [PaletteCategory.TERRAIN_BARE]: '#363124',
    [PaletteCategory.TERRAIN_GRASS]: '#005100',
    [PaletteCategory.TERRAIN_WATER]: '#203455',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#253D64',
    [PaletteCategory.DECORATION_MOUNTAIN_GRASS]: '#004100',
    [PaletteCategory.DECORATION_MOUNTAIN_BARE]: '#363124',
    [PaletteCategory.DECORATION_BUILDING]: '#424242'
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00015
};

export const NightPalette: Palette = {
    colors: colors,
    values: values
};
