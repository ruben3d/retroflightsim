import * as THREE from 'three';
import { AudioSystem } from './audio/audioSystem';
import { ConfigService } from './config/configService';
import { PaletteCategory } from './config/palettes/palette';
import { VGANoonPalette } from './config/palettes/vga-noon';
import { CGAProfile } from './config/profiles/cga';
import { EGAProfile } from './config/profiles/ega';
import { DisplayShading, FogQuality } from './config/profiles/profile';
import { SVGAProfile } from './config/profiles/svga';
import { VGAProfile } from './config/profiles/vga';
import { Kernel } from './core/kernel';
import { FPS_CAP, GROUND_SMOKE_PARTICLE_COUNT, H_RES, V_RES } from './defs';
import { JoystickControlDevice } from './input/devices/joystickControlDevice';
import { KeyboardControlDevice } from './input/devices/keyboardControlDevice';
import { setupOSD } from './osd/osdPanel';
import { ArcadeFlightModel } from './physics/model/arcadeFlightModel';
import { DebugFlightModel } from './physics/model/debugFlightModel';
import { RealisticFlightModel } from './physics/model/realisticFlightModel';
import { Renderer } from './render/renderer';
import { SceneMaterialManager } from './scene/materials/materials';
import { BackgroundModelLibBuilder } from './scene/models/lib/backgroundModelBuilder';
import { FieldModelLibBuilder, FieldModelType } from './scene/models/lib/fieldModelBuilder';
import { FireModelLibBuilder } from './scene/models/lib/fireModelBuilder';
import { MountainModelLibBuilder } from './scene/models/lib/mountainModelBuilder';
import { ParticleMeshModelLibBuilder } from './scene/models/lib/particleMeshModelBuilder';
import { ModelManager } from './scene/models/models';
import { Game, GameRenderTask, GameUpdateTask } from './state/game';
import { FlightModels, TechProfiles } from './state/gameDefs';


function setup(): [Kernel, ConfigService, KeyboardControlDevice, JoystickControlDevice] {
    const config = new ConfigService(
        { [TechProfiles.CGA]: CGAProfile, [TechProfiles.EGA]: EGAProfile, [TechProfiles.VGA]: VGAProfile, [TechProfiles.SVGA]: SVGAProfile },
        { [FlightModels.DEBUG]: new DebugFlightModel(), [FlightModels.ARCADE]: new ArcadeFlightModel(), [FlightModels.REALISTIC]: new RealisticFlightModel(), }
    );
    config.techProfiles.setActive(TechProfiles.VGA);
    const materials = new SceneMaterialManager(VGANoonPalette, FogQuality.LOW, DisplayShading.STATIC);
    const renderer = new Renderer(materials, H_RES, V_RES, VGANoonPalette);
    const models = new ModelManager(materials, [
        new BackgroundModelLibBuilder(BackgroundModelLibBuilder.Type.GROUND),
        new BackgroundModelLibBuilder(BackgroundModelLibBuilder.Type.SKY),
        new FieldModelLibBuilder('pavement', FieldModelType.SQUARE, PaletteCategory.SCENERY_ROAD_SECONDARY),
        new FieldModelLibBuilder('cropGreen', FieldModelType.SQUARE, PaletteCategory.SCENERY_FIELD_GREEN_LIGHT, 200),
        new FieldModelLibBuilder('cropYellow', FieldModelType.SQUARE, PaletteCategory.SCENERY_FIELD_YELLOW, 200),
        new FieldModelLibBuilder('cropOchre', FieldModelType.HEXAGON, PaletteCategory.SCENERY_FIELD_OCHRE, 400),
        new FieldModelLibBuilder('cropRed', FieldModelType.TRIANGLE, PaletteCategory.SCENERY_FIELD_RED, 400),
        new MountainModelLibBuilder('hill', 700, 300, PaletteCategory.SCENERY_MOUNTAIN_GRASS),
        new MountainModelLibBuilder('mountain', 1400, 600, PaletteCategory.SCENERY_MOUNTAIN_BARE),
        new FireModelLibBuilder('smallFire', 7),
        new ParticleMeshModelLibBuilder('groundSmoke', GROUND_SMOKE_PARTICLE_COUNT, new THREE.CircleGeometry(1, 5), 100),
    ]);
    const audio = new AudioSystem();
    const game = new Game(config, models, materials, renderer, audio);
    game.setup();

    const keyboardInput = new KeyboardControlDevice(game.getPlayer());
    const joystickInput = new JoystickControlDevice(game.getPlayer());

    const kernel = new Kernel(FPS_CAP);
    kernel.addTask(materials);
    kernel.addTask(keyboardInput);
    kernel.addTask(joystickInput);
    kernel.addTask(new GameUpdateTask(game));
    kernel.addTask(new GameRenderTask(game));

    config.techProfiles.addChangeListener(profile => kernel.setTargetFPS(profile.fpsCap ? FPS_CAP : undefined));

    return [kernel, config, keyboardInput, joystickInput];
}

window.addEventListener("load", () => {
    const [kernel, config, keyboardInput, joystickInput] = setup();
    kernel.start();
    setupOSD(config, keyboardInput, joystickInput);
});
