
export enum PaletteCategory {
    BACKGROUND = 'BACKGROUND',
    FOG_SKY = 'FOG_SKY',
    FOG_TERRAIN = 'FOG_TERRAIN',
    FOG_SPECKLE = 'FOG_SPEKLE',
    SKY = 'SKY',
    TERRAIN_DEFAULT = 'TERRAIN_DEFAULT',
    TERRAIN_SAND = 'TERRAIN_SAND',
    TERRAIN_BARE = 'TERRAIN_BARE',
    TERRAIN_GRASS = 'TERRAIN_GRASS',
    TERRAIN_WATER = 'TERRAIN_WATER',
    TERRAIN_SHALLOW_WATER = 'TERRAIN_SHALLOW_WATER',
    DECORATION_SPECKLE = 'DECORATION_SPEKLE',
    DECORATION_MOUNTAIN_GRASS = 'DECORATION_MOUNTAIN_GRASS',
    DECORATION_MOUNTAIN_BARE = 'DECORATION_MOUNTAIN_BARE',
    DECORATION_BUILDING = 'DECORATION_BUILDING'
}

export type PaletteColors = Record<PaletteCategory, string>;

export type PaletteValues = {
    [PaletteCategory.FOG_SKY]: number;
    [PaletteCategory.FOG_TERRAIN]: number;
    [PaletteCategory.FOG_SPECKLE]: number;
};

export interface Palette {
    colors: PaletteColors;
    values: PaletteValues;
}

export type PaletteFogCategories = PaletteCategory.FOG_SKY | PaletteCategory.FOG_TERRAIN | PaletteCategory.FOG_SPECKLE;

const FogColorCategoryMap: Map<PaletteCategory, PaletteFogCategories> = new Map([
    [PaletteCategory.SKY, PaletteCategory.FOG_SKY],
    [PaletteCategory.TERRAIN_DEFAULT, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_SAND, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_BARE, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_GRASS, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_WATER, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_SHALLOW_WATER, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.DECORATION_SPECKLE, PaletteCategory.FOG_SPECKLE],
    [PaletteCategory.DECORATION_MOUNTAIN_GRASS, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.DECORATION_MOUNTAIN_BARE, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.DECORATION_BUILDING, PaletteCategory.FOG_TERRAIN],
]);

const FogValueCategoryMap: Map<PaletteCategory, PaletteFogCategories> = new Map([
    [PaletteCategory.SKY, PaletteCategory.FOG_SKY],
    [PaletteCategory.TERRAIN_DEFAULT, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_SAND, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_BARE, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_GRASS, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_WATER, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.TERRAIN_SHALLOW_WATER, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.DECORATION_SPECKLE, PaletteCategory.FOG_SPECKLE],
    [PaletteCategory.DECORATION_MOUNTAIN_GRASS, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.DECORATION_MOUNTAIN_BARE, PaletteCategory.FOG_TERRAIN],
    [PaletteCategory.DECORATION_BUILDING, PaletteCategory.FOG_TERRAIN],
]);

export function FogColorCategory(cat: PaletteCategory): PaletteFogCategories {
    return FogColorCategoryMap.get(cat) || PaletteCategory.FOG_TERRAIN;
}

export function FogValueCategory(cat: PaletteCategory): PaletteFogCategories {
    return FogValueCategoryMap.get(cat) || PaletteCategory.FOG_TERRAIN;
}
