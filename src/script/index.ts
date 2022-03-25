import * as THREE from 'three';
import { Renderer } from './render/renderer';
import { SceneMaterialManager } from './scene/materials/materials';
import { BackgroundModelLibBuilder } from './scene/models/lib/backgroundModelBuilder';
import { FieldModelLibBuilder, FieldModelType } from './scene/models/lib/fieldModelBuilder';
import { MountainModelLibBuilder } from './scene/models/lib/mountainModelBuilder';
import { ModelManager } from './scene/models/models';
import { NightPalette } from './scene/palettes/night';
import { DefaultPalette, PaletteCategory } from './scene/palettes/palette';
import { Game } from './state/game';


let renderer: Renderer | undefined;
let materials: SceneMaterialManager | undefined;
let models: ModelManager | undefined;
let game: Game | undefined;

const clock = new THREE.Clock();

function setup() {
    renderer = new Renderer({ textColors: [NightPalette.colors[PaletteCategory.HUD_TEXT]] });
    materials = new SceneMaterialManager(DefaultPalette);
    models = new ModelManager(materials, [
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

    game = new Game(models, materials, renderer);
    game.setup();

    loop();
}

function loop() {
    window.requestAnimationFrame(loop);
    const delta = clock.getDelta();

    materials?.update(delta);
    game?.update(delta);
    game?.render();
}

window.addEventListener("load", () => {
    setup();
});
