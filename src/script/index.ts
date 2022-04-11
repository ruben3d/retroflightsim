import { Kernel } from './core/kernel';
import { KeyboardControlDevice } from './input/devices/keyboardControlDevice';
import { setupOSD } from './osd/osdPanel';
import { Renderer } from './render/renderer';
import { SceneMaterialManager } from './scene/materials/materials';
import { BackgroundModelLibBuilder } from './scene/models/lib/backgroundModelBuilder';
import { FieldModelLibBuilder, FieldModelType } from './scene/models/lib/fieldModelBuilder';
import { MountainModelLibBuilder } from './scene/models/lib/mountainModelBuilder';
import { ModelManager } from './scene/models/models';
import { NightPalette } from './scene/palettes/night';
import { DefaultPalette, PaletteCategory } from './scene/palettes/palette';
import { Game, GameRenderTask, GameUpdateTask } from './state/game';


let input: KeyboardControlDevice;

function setup(): Kernel {
    const renderer = new Renderer({ textColors: [NightPalette.colors[PaletteCategory.HUD_TEXT]] });
    const materials = new SceneMaterialManager(DefaultPalette);
    const models = new ModelManager(materials, [
        new BackgroundModelLibBuilder(BackgroundModelLibBuilder.Type.GROUND),
        new BackgroundModelLibBuilder(BackgroundModelLibBuilder.Type.SKY),
        new FieldModelLibBuilder('pavement', FieldModelType.SQUARE, PaletteCategory.SCENERY_ROAD_SECONDARY),
        new FieldModelLibBuilder('cropGreen', FieldModelType.SQUARE, PaletteCategory.SCENERY_FIELD_GREEN_LIGHT, 200),
        new FieldModelLibBuilder('cropYellow', FieldModelType.SQUARE, PaletteCategory.SCENERY_FIELD_YELLOW, 200),
        new FieldModelLibBuilder('cropOchre', FieldModelType.HEXAGON, PaletteCategory.SCENERY_FIELD_OCHRE, 400),
        new FieldModelLibBuilder('cropRed', FieldModelType.TRIANGLE, PaletteCategory.SCENERY_FIELD_RED, 400),
        new MountainModelLibBuilder('hill', 700, 300, PaletteCategory.SCENERY_MOUNTAIN_GRASS),
        new MountainModelLibBuilder('mountain', 1400, 600, PaletteCategory.SCENERY_MOUNTAIN_BARE)
    ]);

    const game = new Game(models, materials, renderer);
    game.setup();
    input = new KeyboardControlDevice(game.getPlayer());

    const kernel = new Kernel(15);
    kernel.addTask(materials);
    kernel.addTask(input);
    kernel.addTask(new GameUpdateTask(game));
    kernel.addTask(new GameRenderTask(game));
    return kernel;
}

window.addEventListener("load", () => {
    const kernel = setup();
    kernel.start();
    setupOSD(input);
});
