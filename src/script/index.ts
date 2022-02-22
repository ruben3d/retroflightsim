import * as THREE from 'three';
import { SceneMaterialManager } from './scene/materials/materials';
import { NoonPalette } from './scene/palettes/noon';
import { PaletteCategory } from './scene/palettes/palette';
import { NightPalette } from './scene/palettes/night';
import { Scene, SceneLayers, UP } from './scene/scene';
import { SpecklesEntity } from './scene/entities/speckles';
import { HUDEntity } from './scene/entities/overlay/hud';
import { CANVAS_RENDER_TARGET, Renderer, RenderLayer, RenderTargetType } from './render/renderer';
import { H_RES, COCKPIT_HEIGHT, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, V_RES } from './defs';
import { PlayerEntity } from './scene/entities/player';
import { ModelManager } from './scene/models/models';
import { StaticSceneryEntity } from './scene/entities/staticScenery';
import { PavementModelLibBuilder } from './scene/models/lib/pavementModelBuilder';
import { HillModelLibBuilder } from './scene/models/lib/hillModelBuilder';
import { assertIsDefined } from './utils/asserts';
import { MountainModelLibBuilder } from './scene/models/lib/mountainModelBuilder';
import { GroundTargetEntity } from './scene/entities/groundTarget';
import { SimpleEntity } from './scene/entities/simpleEntity';
import { SceneCamera } from './scene/camera';
import { BackgroundModelLibBuilder } from './scene/models/lib/backgroundModelBuilder';
import { CockpitEntity, COCKPIT_MFD_SIZE, COCKPIT_MFD_X, COCKPIT_MFD_Y } from './scene/entities/overlay/cockpit';


let renderer: Renderer | undefined;

// Scene

const playerCamera = new SceneCamera(new THREE.PerspectiveCamera(50, H_RES / V_RES, COCKPIT_HEIGHT, 40000));
const targetCamera = new SceneCamera(new THREE.PerspectiveCamera(50, 1, COCKPIT_HEIGHT, 40000));

const player: PlayerEntity = new PlayerEntity(playerCamera.main, new THREE.Vector3(1500, 0, -1160), Math.PI);

let materials: SceneMaterialManager | undefined;
let models: ModelManager | undefined;
const clock = new THREE.Clock();

const scene: Scene = new Scene();

const palettes = [NoonPalette, NightPalette];
let currentPalette = 0;

const WEAPONSTARGET_RENDER_TARGET = 'WEAPONSTARGET_RENDER_TARGET';

function setup() {
    renderer = new Renderer({ textColors: [NightPalette.colors[PaletteCategory.HUD_TEXT]] });
    renderer.setPalette(getPalette());
    renderer.createRenderTarget(WEAPONSTARGET_RENDER_TARGET, RenderTargetType.WEBGL, COCKPIT_MFD_X, COCKPIT_MFD_Y, COCKPIT_MFD_SIZE, COCKPIT_MFD_SIZE);
    setupScene();
    setupControls();
    loop();
}

function setupControls() {
    document.addEventListener('keypress', (event: KeyboardEvent) => {
        switch (event.key) {
            case 'n': {
                currentPalette = (currentPalette + 1) % palettes.length;
                materials?.setPalette(getPalette());
                renderer?.setPalette(getPalette());
                break;
            }
        }
    });
}

function setupScene() {
    materials = new SceneMaterialManager(getPalette());
    models = new ModelManager(materials, [
        new BackgroundModelLibBuilder(BackgroundModelLibBuilder.Type.GROUND),
        new BackgroundModelLibBuilder(BackgroundModelLibBuilder.Type.SKY),
        new PavementModelLibBuilder(),
        new HillModelLibBuilder(),
        new MountainModelLibBuilder()
    ]);

    const ground = new SimpleEntity(models.getModel('lib:GROUND'), SceneLayers.BackgroundGround, SceneLayers.BackgroundGround);
    scene.add(ground);

    const sky = new SimpleEntity(models.getModel('lib:SKY'), SceneLayers.BackgroundSky, SceneLayers.BackgroundSky);
    sky.position.set(0, 7, 0);
    scene.add(sky);

    for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
            const model = models.getModel('assets/map.gltf');
            const map = new StaticSceneryEntity(model);
            map.position.x = x * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
            map.position.z = z * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
            map.scale.x = TERRAIN_SCALE * (Math.abs(x) % 2 === 0 ? 1 : -1);
            map.scale.z = TERRAIN_SCALE * (Math.abs(z) % 2 === 0 ? 1 : -1);
            scene.add(map);
        }
    }

    models.getModel('assets/map.gltf', (url, model) => {
        const grass = model.lod[0].flats.find(mesh => mesh.name === PaletteCategory.TERRAIN_GRASS);
        assertIsDefined(grass);
        for (let i = 0; i < 30; i++) {
            const hill = new StaticSceneryEntity(models!.getModel('lib:hill'), 4);
            randomPosOver(grass, hill.position, 20000);
            hill.scale.set(
                0.8 + Math.random() / 5.0,
                0.5 + Math.random() / 2.0,
                0.8 + Math.random() / 5.0);
            hill.quaternion.setFromAxisAngle(UP, Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 4);
            scene.add(hill);
        }

        const bare = model.lod[0].flats.find(mesh => mesh.name === PaletteCategory.TERRAIN_BARE);
        assertIsDefined(bare);
        for (let i = 0; i < 20; i++) {
            const mountain = new StaticSceneryEntity(models!.getModel('lib:mountain'), 4);
            randomPosOver(bare, mountain.position, 20000);
            mountain.scale.x = 0.8 + Math.random() / 5.0;
            mountain.scale.y = 0.5 + Math.random() / 2.0;
            mountain.scale.z = 0.8 + Math.random() / 5.0;
            mountain.quaternion.setFromAxisAngle(UP, Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 4);
            scene.add(mountain);
        }
    });

    const speckles = new SpecklesEntity(materials);
    scene.add(speckles);

    addAirBase(scene, models);

    addRefinery(scene, models);

    const warehouse = new GroundTargetEntity(models.getModel('assets/hangar01.gltf'), undefined, 'Warehouse', 'Radlydd');
    warehouse.position.set(-16000, 0, 11000);
    warehouse.quaternion.setFromAxisAngle(UP, Math.PI / 2);
    scene.add(warehouse);

    scene.add(player);

    const hud = new HUDEntity(player);
    scene.add(hud);

    const cockpit = new CockpitEntity(player, playerCamera.main, targetCamera.main);
    scene.add(cockpit);
}

function addRefinery(scene: Scene, models: ModelManager) {
    const x = -1200;
    const z = 1500;
    const refinery = new GroundTargetEntity(models.getModel('assets/refinery_towers01.gltf'), 2, 'Oil Refinery', 'Radlydd');
    refinery.position.set(x, 0, z);
    scene.add(refinery);

    const depot01a = new StaticSceneryEntity(models.getModel('assets/refinery_depot01.gltf'));
    depot01a.position.set(x, 0, z - 100);
    scene.add(depot01a);

    const depot01b = new StaticSceneryEntity(models.getModel('assets/refinery_depot01.gltf'));
    depot01b.position.set(x, 0, z + 100);
    depot01b.quaternion.setFromAxisAngle(UP, Math.PI);
    scene.add(depot01b);

    const depot01c = new StaticSceneryEntity(models.getModel('assets/refinery_depot01.gltf'));
    depot01c.position.set(x + 100, 0, z - 100);
    scene.add(depot01c);

    const depot02a = new StaticSceneryEntity(models.getModel('assets/refinery_depot02.gltf'));
    depot02a.position.set(x - 150, 0, z - 50);
    scene.add(depot02a);

    const depot02b = new StaticSceneryEntity(models.getModel('assets/refinery_depot02.gltf'));
    depot02b.position.set(x + 150, 0, z + 50);
    scene.add(depot02b);
}

function addAirBase(scene: Scene, models: ModelManager) {
    const hangarGround1 = new StaticSceneryEntity(models.getModel('lib:pavement'), 4);
    hangarGround1.position.set(1360, 0, -860);
    hangarGround1.scale.set(200, 1, 200);
    scene.add(hangarGround1);

    const hangarGround2 = new StaticSceneryEntity(models.getModel('lib:pavement'), 4);
    hangarGround2.position.set(1640, 0, -860);
    hangarGround2.scale.set(200, 1, 200);
    scene.add(hangarGround2);

    const runway = new GroundTargetEntity(models.getModel('assets/runway01.gltf'), 0, 'Airbase', 'Stosneehar');
    runway.position.set(1500, 0, -800);
    scene.add(runway);

    const hangar1 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
    hangar1.position.set(1330, 0, -800);
    hangar1.quaternion.setFromAxisAngle(UP, Math.PI / 2);
    scene.add(hangar1);

    const hangar2 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
    hangar2.position.set(1330, 0, -860);
    hangar2.quaternion.setFromAxisAngle(UP, Math.PI / 2);
    scene.add(hangar2);

    const hangar3 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
    hangar3.position.set(1330, 0, -920);
    hangar3.quaternion.setFromAxisAngle(UP, Math.PI / 2);
    scene.add(hangar3);

    const hangar4 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
    hangar4.position.set(1670, 0, -810);
    hangar4.quaternion.setFromAxisAngle(UP, Math.PI);
    scene.add(hangar4);

    const tower = new StaticSceneryEntity(models.getModel('assets/control01.gltf'));
    tower.position.set(1580, 0, -500);
    tower.quaternion.setFromAxisAngle(UP, -Math.PI / 2);
    scene.add(tower);
}

function randomPosOver(surface: THREE.Object3D<THREE.Event>, position: THREE.Vector3, spread: number): THREE.Vector3 {
    assertIsDefined(surface);
    let intersections: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = [];
    const caster = new THREE.Raycaster();
    const p = UP.clone();
    const d = UP.clone().negate();
    const scaledSpread = spread / TERRAIN_SCALE;
    do {
        intersections.length = 0;
        p.x = Math.random() * scaledSpread - scaledSpread / 2;
        p.z = Math.random() * scaledSpread - scaledSpread / 2;
        caster.set(p, d);
        intersections = caster.intersectObject(surface, true);
    } while (intersections.length === 0);
    position.copy(p).setY(0).multiplyScalar(TERRAIN_SCALE);
    return position;
}

function updateScene(delta: number) {

    scene.update(delta);
    materials?.update(delta);
    playerCamera.update();
    targetCamera.update();
}

function getPalette() {
    return palettes[currentPalette];
}

const defaultRenderLayers: RenderLayer[] = [
    {
        camera: playerCamera.bgSky,
        lists: [SceneLayers.BackgroundSky]
    },
    {
        camera: playerCamera.bgGround,
        lists: [SceneLayers.BackgroundGround]
    },
    {
        camera: playerCamera.main,
        lists: [SceneLayers.EntityFlats, SceneLayers.EntityVolumes]
    },
    {
        target: CANVAS_RENDER_TARGET,
        camera: playerCamera.main,
        lists: [SceneLayers.Overlay]
    }
];

const targetRenderLayers: RenderLayer[] = [
    {
        camera: playerCamera.bgSky,
        lists: [SceneLayers.BackgroundSky]
    },
    {
        camera: playerCamera.bgGround,
        lists: [SceneLayers.BackgroundGround]
    },
    {
        camera: playerCamera.main,
        lists: [SceneLayers.EntityFlats, SceneLayers.EntityVolumes]
    },
    {
        target: WEAPONSTARGET_RENDER_TARGET,
        camera: targetCamera.bgSky,
        lists: [SceneLayers.BackgroundSky]
    },
    {
        target: WEAPONSTARGET_RENDER_TARGET,
        camera: targetCamera.bgGround,
        lists: [SceneLayers.BackgroundGround]
    },
    {
        target: WEAPONSTARGET_RENDER_TARGET,
        camera: targetCamera.main,
        lists: [SceneLayers.EntityFlats, SceneLayers.EntityVolumes]
    },
    {
        target: CANVAS_RENDER_TARGET,
        camera: playerCamera.main,
        lists: [SceneLayers.Overlay]
    }
];

function loop() {
    window.requestAnimationFrame(loop);
    const delta = clock.getDelta();

    updateScene(delta);
    renderer?.render(scene, player.weaponsTarget ? targetRenderLayers : defaultRenderLayers);
}

window.addEventListener("load", () => {
    setup();
});
