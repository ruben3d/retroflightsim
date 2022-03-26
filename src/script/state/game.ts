import * as THREE from 'three';
import { COCKPIT_FOV, PLANE_DISTANCE_TO_GROUND, H_RES, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, V_RES } from '../defs';
import { CANVAS_RENDER_TARGET, Renderer, RenderLayer, RenderTargetType } from "../render/renderer";
import { SceneCamera } from '../scene/cameras/camera';
import { CockpitFrontCameraUpdater } from './cameraUpdaters/cockpitFrontCameraUpdater';
import { GroundTargetEntity } from '../scene/entities/groundTarget';
import { CockpitEntity, COCKPIT_MFD_SIZE, COCKPIT_MFD_X, COCKPIT_MFD_Y } from '../scene/entities/overlay/cockpit';
import { HUDEntity } from '../scene/entities/overlay/hud';
import { PlayerEntity } from '../scene/entities/player';
import { SceneryField, SceneryFieldSettings } from '../scene/entities/sceneryField';
import { SimpleEntity } from '../scene/entities/simpleEntity';
import { SpecklesEntity } from '../scene/entities/speckles';
import { StaticSceneryEntity } from '../scene/entities/staticScenery';
import { SceneMaterialManager } from "../scene/materials/materials";
import { ModelManager } from "../scene/models/models";
import { NightPalette } from '../scene/palettes/night';
import { NoonPalette } from '../scene/palettes/noon';
import { Palette, PaletteCategory } from '../scene/palettes/palette';
import { Scene, SceneLayers, UP } from '../scene/scene';
import { assertIsDefined } from '../utils/asserts';
import { Entity } from '../scene/entity';
import { CameraUpdater } from './cameraUpdaters/cameraUpdater';
import { ExteriorBehindCameraUpdater } from './cameraUpdaters/exteriorBehindCameraUpdater';


const WEAPONSTARGET_RENDER_TARGET = 'WEAPONSTARGET_RENDER_TARGET';

enum PlayerViewState {
    COCKPIT_FRONT,
    EXTERIOR_BEHIND,
}

export class Game {

    private scene: Scene = new Scene();

    private playerCamera: SceneCamera;
    private targetCamera: SceneCamera;
    private cameraUpdaters: Map<PlayerViewState, CameraUpdater> = new Map();
    private cameraUpdater: CameraUpdater;
    private player: PlayerEntity;

    private palettes = [NoonPalette, NightPalette];
    private currentPalette = 0;

    private defaultRenderLayers: RenderLayer[];
    private targetRenderLayers: RenderLayer[];

    private view: PlayerViewState = PlayerViewState.COCKPIT_FRONT;

    private cockpitEntities: Entity[] = [];
    private exteriorEntities: Entity[] = [];

    constructor(private models: ModelManager, private materials: SceneMaterialManager, private renderer: Renderer) {
        this.playerCamera = new SceneCamera(new THREE.PerspectiveCamera(COCKPIT_FOV, H_RES / V_RES, PLANE_DISTANCE_TO_GROUND, 40000));
        this.targetCamera = new SceneCamera(new THREE.PerspectiveCamera(COCKPIT_FOV, 1, PLANE_DISTANCE_TO_GROUND, 40000));
        this.player = new PlayerEntity(this.models.getModel('assets/f22.gltf'), this.models.getModel('assets/f22_shadow.gltf'), new THREE.Vector3(1500, PLANE_DISTANCE_TO_GROUND, -1160), Math.PI);
        this.cameraUpdaters.set(PlayerViewState.COCKPIT_FRONT, new CockpitFrontCameraUpdater(this.player, this.playerCamera.main));
        this.cameraUpdaters.set(PlayerViewState.EXTERIOR_BEHIND, new ExteriorBehindCameraUpdater(this.player, this.playerCamera.main));
        this.cameraUpdater = this.getCameraUpdater(this.view);

        const playerLayers: RenderLayer[] = [
            {
                camera: this.playerCamera.bgSky,
                lists: [SceneLayers.BackgroundSky]
            },
            {
                camera: this.playerCamera.bgGround,
                lists: [SceneLayers.BackgroundGround]
            },
            {
                camera: this.playerCamera.main,
                lists: [SceneLayers.EntityFlats, SceneLayers.EntityVolumes]
            }
        ];
        const targetLayers: RenderLayer[] = [
            {
                target: WEAPONSTARGET_RENDER_TARGET,
                camera: this.targetCamera.bgSky,
                lists: [SceneLayers.BackgroundSky]
            },
            {
                target: WEAPONSTARGET_RENDER_TARGET,
                camera: this.targetCamera.bgGround,
                lists: [SceneLayers.BackgroundGround]
            },
            {
                target: WEAPONSTARGET_RENDER_TARGET,
                camera: this.targetCamera.main,
                lists: [SceneLayers.EntityFlats, SceneLayers.EntityVolumes]
            }
        ];
        const canvasLayers: RenderLayer[] = [
            {
                target: CANVAS_RENDER_TARGET,
                camera: this.playerCamera.main,
                lists: [SceneLayers.Overlay]
            }
        ];
        this.defaultRenderLayers = [...playerLayers, ...canvasLayers];
        this.targetRenderLayers = [...playerLayers, ...targetLayers, ...canvasLayers];
    }

    setup() {
        this.renderer.createRenderTarget(WEAPONSTARGET_RENDER_TARGET, RenderTargetType.WEBGL, COCKPIT_MFD_X, COCKPIT_MFD_Y, COCKPIT_MFD_SIZE, COCKPIT_MFD_SIZE);
        this.renderer.setPalette(this.getPalette());
        this.materials.setPalette(this.getPalette());
        this.setupControls();
        this.setupScene();
    }

    update(delta: number) {
        this.scene.update(delta);
        this.cameraUpdater.update(delta);
        this.playerCamera.update();
        this.targetCamera.update();
    }

    render() {
        this.renderer.render(this.scene, this.player.weaponsTarget && this.view === PlayerViewState.COCKPIT_FRONT ? this.targetRenderLayers : this.defaultRenderLayers);
    }

    private setupControls() {
        document.addEventListener('keypress', (event: KeyboardEvent) => {
            switch (event.key) {
                case 'n': {
                    this.currentPalette = (this.currentPalette + 1) % this.palettes.length;
                    this.materials.setPalette(this.getPalette());
                    this.renderer.setPalette(this.getPalette());
                    break;
                }
                case '1': {
                    if (this.view !== PlayerViewState.COCKPIT_FRONT) {
                        this.setCockpitFrontView();
                    }
                    break;
                }
                case '2': {
                    if (this.view !== PlayerViewState.EXTERIOR_BEHIND) {
                        this.setExteriorBehindView();
                    }
                    break;
                }
            }
        });
    }

    private setCockpitFrontView() {
        this.view = PlayerViewState.COCKPIT_FRONT;
        this.player.exteriorView = false;
        this.cameraUpdater = this.getCameraUpdater(this.view);
        for (let i = 0; i < this.cockpitEntities.length; i++) {
            this.cockpitEntities[i].enabled = true;
        }
        for (let i = 0; i < this.exteriorEntities.length; i++) {
            this.cockpitEntities[i].enabled = false;
        }
    }

    private setExteriorBehindView() {
        this.view = PlayerViewState.EXTERIOR_BEHIND;
        this.player.exteriorView = true;
        this.cameraUpdater = this.getCameraUpdater(this.view);
        for (let i = 0; i < this.cockpitEntities.length; i++) {
            this.cockpitEntities[i].enabled = false;
        }
        for (let i = 0; i < this.exteriorEntities.length; i++) {
            this.cockpitEntities[i].enabled = true;
        }
    }

    private getCameraUpdater(view: PlayerViewState): CameraUpdater {
        const updater = this.cameraUpdaters.get(view);
        assertIsDefined(updater);
        return updater;
    }

    private setupScene() {
        const ground = new SimpleEntity(this.models.getModel('lib:GROUND'), SceneLayers.BackgroundGround, SceneLayers.BackgroundGround);
        this.scene.add(ground);

        const sky = new SimpleEntity(this.models.getModel('lib:SKY'), SceneLayers.BackgroundSky, SceneLayers.BackgroundSky);
        sky.position.set(0, 7, 0);
        this.scene.add(sky);

        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                const model = this.models.getModel('assets/map.gltf');
                const map = new StaticSceneryEntity(model);
                map.position.x = x * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
                map.position.z = z * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
                map.scale.x = TERRAIN_SCALE * (Math.abs(x) % 2 === 0 ? 1 : -1);
                map.scale.z = TERRAIN_SCALE * (Math.abs(z) % 2 === 0 ? 1 : -1);
                this.scene.add(map);
            }
        }

        this.models.getModel('assets/map.gltf', (url, model) => {
            const grass = model.lod[0].flats.find(mesh => mesh.name === PaletteCategory.TERRAIN_GRASS);
            assertIsDefined(grass);
            for (let i = 0; i < 30; i++) {
                const hill = new StaticSceneryEntity(this.models.getModel('lib:hill'));
                this.randomPosOver(grass, hill.position, 20000);
                hill.scale.set(
                    0.8 + Math.random() / 5.0,
                    0.5 + Math.random() / 2.0,
                    0.8 + Math.random() / 5.0);
                hill.quaternion.setFromAxisAngle(UP, Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 4);
                this.scene.add(hill);
            }

            const bare = model.lod[0].flats.find(mesh => mesh.name === PaletteCategory.TERRAIN_BARE);
            assertIsDefined(bare);
            for (let i = 0; i < 20; i++) {
                const mountain = new StaticSceneryEntity(this.models.getModel('lib:mountain'));
                this.randomPosOver(bare, mountain.position, 20000);
                mountain.scale.x = 0.8 + Math.random() / 5.0;
                mountain.scale.y = 0.5 + Math.random() / 2.0;
                mountain.scale.z = 0.8 + Math.random() / 5.0;
                mountain.quaternion.setFromAxisAngle(UP, Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 4);
                this.scene.add(mountain);
            }
        });

        const speckles = new SpecklesEntity(this.materials);
        this.scene.add(speckles);

        const fieldOptions: SceneryFieldSettings = {
            tilesInField: 7,
            cellsInTile: 2,
            tileLength: 2500.0,
            cellVariations: [
                {
                    probability: 0.4,
                    model: 'assets/farm01.gltf',
                    jitter: 0.9,
                    randomRotation: true
                },
                {
                    probability: 0.25,
                    model: 'lib:cropGreen',
                    jitter: 1.2,
                    randomRotation: false
                },
                {
                    probability: 0.25,
                    model: 'lib:cropYellow',
                    jitter: 1.2,
                    randomRotation: false
                },
                {
                    probability: 0.05,
                    model: 'lib:cropOchre',
                    jitter: 0.8,
                    randomRotation: true
                },
                {
                    probability: 0.05,
                    model: 'lib:cropRed',
                    jitter: 0.8,
                    randomRotation: true
                }
            ]
        };
        const field1 = new SceneryField(this.models, new THREE.Box2().setFromCenterAndSize(new THREE.Vector2(0, 10000), new THREE.Vector2(80000, 10000)), fieldOptions);
        this.scene.add(field1);
        const field2 = new SceneryField(this.models, new THREE.Box2().setFromCenterAndSize(new THREE.Vector2(-10000, -10000), new THREE.Vector2(10000, 15000)), fieldOptions);
        this.scene.add(field2);

        this.addAirBase(this.scene, this.models);

        this.addRefinery(this.scene, this.models);

        const warehouse = new GroundTargetEntity(this.models.getModel('assets/hangar01.gltf'), undefined, 'Warehouse', 'Radlydd');
        warehouse.position.set(-16000, 0, 11000);
        warehouse.quaternion.setFromAxisAngle(UP, Math.PI / 2);
        this.scene.add(warehouse);

        this.scene.add(this.player);

        const hud = new HUDEntity(this.player);
        this.cockpitEntities.push(hud);
        this.scene.add(hud);

        const cockpit = new CockpitEntity(this.player, this.playerCamera.main, this.targetCamera.main);
        this.cockpitEntities.push(cockpit);
        this.scene.add(cockpit);
    }

    private addRefinery(scene: Scene, models: ModelManager) {
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

    private addAirBase(scene: Scene, models: ModelManager) {
        const hangarGround1 = new StaticSceneryEntity(models.getModel('lib:pavement'), 5);
        hangarGround1.position.set(1360, 0, -860);
        hangarGround1.scale.set(200, 1, 200);
        scene.add(hangarGround1);

        const hangarGround2 = new StaticSceneryEntity(models.getModel('lib:pavement'), 5);
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

    private randomPosOver(surface: THREE.Object3D<THREE.Event>, position: THREE.Vector3, spread: number): THREE.Vector3 {
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

    private getPalette(): Palette {
        return this.palettes[this.currentPalette];
    }
}
