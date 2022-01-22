import { Palette, PaletteCategory, PaletteColors, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.BACKGROUND]: '#D3D3D3',
    [PaletteCategory.FOG_SKY]: '#D3D3D3',
    [PaletteCategory.FOG_TERRAIN]: '#D3D3D3',
    [PaletteCategory.FOG_SPECKLE]: '#FFFFFF',
    [PaletteCategory.SKY]: '#10A2FB',
    [PaletteCategory.TERRAIN_DEFAULT]: '#B37934',
    [PaletteCategory.TERRAIN_SAND]: '#B37934',
    [PaletteCategory.TERRAIN_BARE]: '#AD6025',
    [PaletteCategory.TERRAIN_GRASS]: '#078C02',
    [PaletteCategory.TERRAIN_WATER]: '#134795',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#0f54CC',
    [PaletteCategory.DECORATION_SPECKLE]: '#707070',
    [PaletteCategory.DECORATION_MOUNTAIN_GRASS]: '#078C02',
    [PaletteCategory.DECORATION_MOUNTAIN_BARE]: '#AD6025',
    [PaletteCategory.DECORATION_BUILDING]: '#DDDDDD'
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00008,
    [PaletteCategory.FOG_SPECKLE]: 0.0005
};

export const NoonPalette: Palette = {
    colors: colors,
    values: values
};
