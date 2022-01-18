import { Palette, PaletteCategory, PaletteColors, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.BACKGROUND]: '#D3D3D3',
    [PaletteCategory.FOG_SKY]: '#D3D3D3',
    [PaletteCategory.FOG_TERRAIN]: '#D3D3D3',
    [PaletteCategory.SKY]: '#10A2FB',
    [PaletteCategory.TERRAIN_DEFAULT]: '#B37934',
    [PaletteCategory.TERRAIN_SAND]: '#B37934',
    [PaletteCategory.TERRAIN_BARE]: '#AD6025',
    [PaletteCategory.TERRAIN_GRASS]: '#078C02',
    [PaletteCategory.TERRAIN_WATER]: '#134795',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#0056E7',
    [PaletteCategory.DECORATION_MOUNTAIN_GRASS]: '#078C02',
    [PaletteCategory.DECORATION_MOUNTAIN_BARE]: '#AD6025',
    [PaletteCategory.DECORATION_BUILDING]: '#DDDDDD'
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.004,
    [PaletteCategory.FOG_TERRAIN]: 0.0001
};

export const NoonPalette: Palette = {
    colors: colors,
    values: values
};
