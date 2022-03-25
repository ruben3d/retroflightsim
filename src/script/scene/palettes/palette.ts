
export enum PaletteCategory {
    HUD_TEXT = 'HUD_TEXT',

    BACKGROUND = 'BACKGROUND',

    FOG_SKY = 'FOG_SKY',
    FOG_TERRAIN = 'FOG_TERRAIN',
    FOG_SPECKLE = 'FOG_SPEKLE',
    FOG_LIGHT = 'FOG_LIGHT',

    SKY = 'SKY',

    TERRAIN_DEFAULT = 'TERRAIN_DEFAULT',
    TERRAIN_SAND = 'TERRAIN_SAND',
    TERRAIN_BARE = 'TERRAIN_BARE',
    TERRAIN_GRASS = 'TERRAIN_GRASS',
    TERRAIN_WATER = 'TERRAIN_WATER',
    TERRAIN_SHALLOW_WATER = 'TERRAIN_SHALLOW_WATER',
    SCENERY_MOUNTAIN_GRASS = 'SCENERY_MOUNTAIN_GRASS',
    SCENERY_MOUNTAIN_BARE = 'SCENERY_MOUNTAIN_BARE',

    LIGHT_RED = 'LIGHT_RED',
    LIGHT_GREEN = 'LIGHT_GREEN',
    LIGHT_YELLOW = 'LIGHT_YELLOW',

    SCENERY_SPECKLE = 'SCENERY_SPEKLE',

    GLASS = 'GLASS',

    VEHICLE_PLANE_GREY = 'VEHICLE_PLANE_GREY',
    VEHICLE_PLANE_NAVY = 'VEHICLE_PLANE_NAVY',
    VEHICLE_PLANE_INTAKE = 'VEHICLE_PLANE_INTAKE',
    VEHICLE_PLANE_ENGINE = 'VEHICLE_PLANE_ENGINE',

    SCENERY_ROAD_MAIN = 'SCENERY_ROAD_MAIN',
    SCENERY_ROAD_SECONDARY = 'SCENERY_ROAD_SECONDARY',

    SCENERY_FIELD_GREEN = 'SCENERY_FIELD_GREEN',
    SCENERY_FIELD_GREEN_LIGHT = 'SCENERY_FIELD_GREEN_LIGHT',
    SCENERY_FIELD_YELLOW = 'SCENERY_FIELD_YELLOW',
    SCENERY_FIELD_OCHRE = 'SCENERY_FIELD_OCHRE',
    SCENERY_FIELD_RED = 'SCENERY_FIELD_RED',

    SCENERY_BUILDING_PLASTER_WHITE = 'SCENERY_BUILDING_PLASTER_WHITE',
    SCENERY_BUILDING_PLASTER_RED = 'SCENERY_BUILDING_PLASTER_RED',
    SCENERY_BUILDING_PLASTER_TEAL = 'SCENERY_BUILDING_PLASTER_TEAL',
    SCENERY_BUILDING_CONCRETE = 'SCENERY_BUILDING_CONCRETE',
    SCENERY_BUILDING_METAL = 'SCENERY_BUILDING_METAL',

    SCENERY_BASE_RUNWAY_LINES = 'SCENERY_BASE_RUNWAY_LINES',
    SCENERY_BASE_RUNWAY_THRESHOLD = 'SCENERY_BASE_RUNWAY_THRESHOLD',

    FX_FIRE = 'FX_FIRE',
    FX_FIRE__B = 'FX_FIRE__B',
}

export const PALETTE_FX_PREFIX: string = 'FX';

export enum PaletteTime {
    DAY = 'day',
    NIGHT = 'night'
};

export type PaletteColors = Record<PaletteCategory, string>;

export type PaletteValues = {
    [PaletteCategory.FOG_SKY]: number;
    [PaletteCategory.FOG_TERRAIN]: number;
    [PaletteCategory.FOG_SPECKLE]: number;
    [PaletteCategory.FOG_LIGHT]: number;
};


export interface Palette {
    colors: PaletteColors;
    values: PaletteValues;
    time: PaletteTime;
}

export type PaletteFogCategories = PaletteCategory.FOG_SKY | PaletteCategory.FOG_TERRAIN | PaletteCategory.FOG_SPECKLE | PaletteCategory.FOG_LIGHT;

const FogColorCategoryMap: Map<PaletteCategory, PaletteFogCategories> = new Map([
    [PaletteCategory.SKY, PaletteCategory.FOG_SKY],
    [PaletteCategory.SCENERY_SPECKLE, PaletteCategory.FOG_SPECKLE],
    [PaletteCategory.LIGHT_RED, PaletteCategory.FOG_LIGHT],
    [PaletteCategory.LIGHT_GREEN, PaletteCategory.FOG_LIGHT],
    [PaletteCategory.LIGHT_YELLOW, PaletteCategory.FOG_LIGHT],
    [PaletteCategory.FX_FIRE, PaletteCategory.FOG_LIGHT],
]);

const FogValueCategoryMap: Map<PaletteCategory, PaletteFogCategories> = new Map([
    [PaletteCategory.SKY, PaletteCategory.FOG_SKY],
    [PaletteCategory.SCENERY_SPECKLE, PaletteCategory.FOG_SPECKLE],
    [PaletteCategory.LIGHT_RED, PaletteCategory.FOG_LIGHT],
    [PaletteCategory.LIGHT_GREEN, PaletteCategory.FOG_LIGHT],
    [PaletteCategory.LIGHT_YELLOW, PaletteCategory.FOG_LIGHT],
    [PaletteCategory.FX_FIRE, PaletteCategory.FOG_LIGHT],
]);

export function FogColorCategory(cat: PaletteCategory): PaletteFogCategories {
    return FogColorCategoryMap.get(cat) || PaletteCategory.FOG_TERRAIN;
}

export function FogValueCategory(cat: PaletteCategory): PaletteFogCategories {
    return FogValueCategoryMap.get(cat) || PaletteCategory.FOG_TERRAIN;
}

const defaultPaletteColors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '', // Use default

    [PaletteCategory.BACKGROUND]: '#FFFFFF',

    [PaletteCategory.FOG_SKY]: '#FFFFFF',
    [PaletteCategory.FOG_TERRAIN]: '#FFFFFF',
    [PaletteCategory.FOG_SPECKLE]: '#FFFFFF',
    [PaletteCategory.FOG_LIGHT]: '#FFFFFF',

    [PaletteCategory.SKY]: '#00ffff',

    [PaletteCategory.TERRAIN_DEFAULT]: '#ff8800',
    [PaletteCategory.TERRAIN_SAND]: '#ff8800',
    [PaletteCategory.TERRAIN_BARE]: '#aa5b00',
    [PaletteCategory.TERRAIN_GRASS]: '#00ff00',
    [PaletteCategory.TERRAIN_WATER]: '#0000ff',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#4040ff',
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: '#00ff00',
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: '#aa5b00',

    [PaletteCategory.LIGHT_RED]: '#FF0000',
    [PaletteCategory.LIGHT_GREEN]: '#00FF00',
    [PaletteCategory.LIGHT_YELLOW]: '#FFFFBA',

    [PaletteCategory.GLASS]: '#00ffff',

    [PaletteCategory.VEHICLE_PLANE_GREY]: '#828385',
    [PaletteCategory.VEHICLE_PLANE_NAVY]: '#6f7981',
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: '#58595A',
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: '#4B484E',

    [PaletteCategory.SCENERY_SPECKLE]: '#888888',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#4D4D4D',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#555555',

    [PaletteCategory.SCENERY_FIELD_GREEN]: '#00FF00',
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: '#40FF40',
    [PaletteCategory.SCENERY_FIELD_YELLOW]: '#ffff00',
    [PaletteCategory.SCENERY_FIELD_OCHRE]: '#ffa000',
    [PaletteCategory.SCENERY_FIELD_RED]: '#ff0000',

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: '#FFFFFF',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: '#e16565',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: '#37aaaa',
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: '#9A9A9A',
    [PaletteCategory.SCENERY_BUILDING_METAL]: '#C0C0C0',

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#9A9A9A',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#C0C0C0',

    [PaletteCategory.FX_FIRE]: '#ff8800',
    [PaletteCategory.FX_FIRE__B]: '#ffff00',
};

const defaultPaletteValues: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00008,
    [PaletteCategory.FOG_LIGHT]: 0.00008,
    [PaletteCategory.FOG_SPECKLE]: 0.0005
};

export const DefaultPalette: Palette = {
    colors: defaultPaletteColors,
    values: defaultPaletteValues,
    time: PaletteTime.DAY
};
