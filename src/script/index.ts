import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { SceneMaterialManager } from './scene/materials/materials';
import { NoonPalette } from './scene/palettes/noon';
import { PaletteCategory } from './scene/palettes/palette';
import { NightPalette } from './scene/palettes/night';
import { Scene, SceneLayers, UP } from './scene/scene';
import { SpecklesEntity } from './scene/entities/speckles';
import { updateUniforms } from './scene/utils';
import { HUDEntity } from './scene/entities/overlay/hud';
import { Renderer } from './render/renderer';
import { H_RES, COCKPIT_HEIGHT, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, V_RES } from './defs';
import { PlayerEntity } from './scene/entities/player';
import { ModelManager } from './scene/models/models';
import { StaticSceneryEntity } from './scene/entities/staticScenery';
import { PavementModelLibBuilder } from './scene/models/lib/pavementModelBuilder';


let renderer: Renderer | undefined;

// Scene

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, H_RES / V_RES, COCKPIT_HEIGHT, 20000);
const decorationScene: THREE.Scene = new THREE.Scene();
const groundScene: THREE.Scene = new THREE.Scene();
const bgGroundCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, H_RES / V_RES, 100, 500000);
const bgGroundScene: THREE.Scene = new THREE.Scene();
const bgSkyCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, H_RES / V_RES, 5, 50000);
const bgSkyScene: THREE.Scene = new THREE.Scene();
let materials: SceneMaterialManager | undefined;
let models: ModelManager | undefined;
let sky: THREE.Mesh | undefined;
const clock = new THREE.Clock();

const scene: Scene = new Scene();

const palettes = [NoonPalette, NightPalette];
let currentPalette = 0;


function setup() {
    renderer = new Renderer({ textColors: [NightPalette.colors[PaletteCategory.HUD_TEXT]] });
    renderer.setPalette(getPalette());
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
    materials = new SceneMaterialManager(NoonPalette);
    models = new ModelManager(materials, [new PavementModelLibBuilder()]);
    const localMaterials = materials;

    const groundGeometry = new THREE.PlaneGeometry(1000000, 1000000, 1, 1);
    groundGeometry.center();
    groundGeometry.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeometry, new THREE.MeshBasicMaterial());
    applyMaterial(ground, materials.build({
        category: PaletteCategory.TERRAIN_DEFAULT,
        shaded: false,
        depthWrite: false
    }));
    ground.position.set(0, 0, 0);
    bgGroundScene.add(ground);

    const skyGeometry = new THREE.PlaneGeometry(100000, 100000, 1, 1);
    skyGeometry.center();
    skyGeometry.rotateX(Math.PI / 2);
    sky = new THREE.Mesh(skyGeometry, new THREE.MeshBasicMaterial());
    applyMaterial(sky, materials.build({
        category: PaletteCategory.SKY,
        shaded: false,
        depthWrite: false
    }));
    sky.position.set(0, 7, 0);
    bgSkyScene.add(sky);

    const terrain: Map<string, THREE.Object3D<THREE.Event>> = new Map();
    const loadingManager = new THREE.LoadingManager(() => {

        const grass = terrain.get('grass')!;
        const hill = new THREE.ConeBufferGeometry(350, 150, 4).toNonIndexed();
        hill.computeVertexNormals();
        hill.translate(0, 75 - COCKPIT_HEIGHT, 0);
        for (let i = 0; i < 40; i++) {
            const mesh = new THREE.Mesh(hill, new THREE.MeshBasicMaterial());
            applyMaterial(mesh, localMaterials.build({
                category: PaletteCategory.DECORATION_MOUNTAIN_GRASS,
                shaded: true,
                depthWrite: true
            }));
            randomPosOver(grass, mesh.position, 20000);
            mesh.scale.x = 0.8 + Math.random() / 5.0;
            mesh.scale.y = 0.5 + Math.random() / 2.0;
            mesh.scale.z = 0.8 + Math.random() / 5.0;
            mesh.rotateY(Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 4);
            decorationScene.add(mesh);
        }

        const darkLand = terrain.get('darkland')!;
        const mountain = new THREE.ConeBufferGeometry(700, 300, 4).toNonIndexed();
        mountain.computeVertexNormals();
        mountain.translate(0, 150 - COCKPIT_HEIGHT, 0);
        for (let i = 0; i < 30; i++) {
            const mesh = new THREE.Mesh(mountain, new THREE.MeshBasicMaterial());
            applyMaterial(mesh, localMaterials.build({
                category: PaletteCategory.DECORATION_MOUNTAIN_BARE,
                shaded: true,
                depthWrite: true
            }));
            randomPosOver(darkLand, mesh.position, 20000);
            mesh.scale.x = 0.8 + Math.random() / 5.0;
            mesh.scale.y = 0.5 + Math.random() / 2.0;
            mesh.scale.z = 0.8 + Math.random() / 5.0;
            mesh.rotateY(Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 4);
            decorationScene.add(mesh);
        }
    });
    const loader = new OBJLoader(loadingManager);

    [
        { file: 'ocean', category: PaletteCategory.TERRAIN_WATER },
        { file: 'shallowocean', category: PaletteCategory.TERRAIN_SHALLOW_WATER },
        { file: 'land', category: PaletteCategory.TERRAIN_SAND },
        { file: 'darkland', category: PaletteCategory.TERRAIN_BARE },
        { file: 'grass', category: PaletteCategory.TERRAIN_GRASS },
    ].forEach(def => {
        loader.load(`assets/${def.file}.obj`, obj => {
            applyMaterial(obj, localMaterials.build({
                category: def.category,
                shaded: false,
                depthWrite: false
            }));
            obj.scale.x = obj.scale.z = TERRAIN_SCALE;
            terrain.set(def.file, obj);
            groundScene.add(obj);

            for (let x = -1; x <= 1; x++) {
                for (let z = -1; z <= 1; z++) {
                    if (x === 0 && z === 0) continue;
                    const tile = obj.clone(true);
                    tile.position.x = x * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
                    tile.position.z = z * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
                    tile.scale.x = tile.scale.x * (x === 0 ? 1 : -1);
                    tile.scale.z = tile.scale.z * (z === 0 ? 1 : -1);
                    groundScene.add(tile);
                }
            }
        });
    });

    const speckles = new SpecklesEntity(camera, materials);
    scene.add(speckles);

    addAirBase(scene, models);

    const player = new PlayerEntity(camera, new THREE.Vector3(0, 150, 0), 0);
    scene.add(player);

    const hud = new HUDEntity(player);
    scene.add(hud);
}

function addAirBase(scene: Scene, models: ModelManager) {
    const hangarGround1 = new StaticSceneryEntity(models.getModel('lib:pavement'));
    hangarGround1.position.set(1360, 0, -860);
    hangarGround1.scale.set(200, 0, 200);
    scene.add(hangarGround1);

    const hangarGround2 = new StaticSceneryEntity(models.getModel('lib:pavement'));
    hangarGround2.position.set(1640, 0, -860);
    hangarGround2.scale.set(200, 0, 200);
    scene.add(hangarGround2);

    const runway = new StaticSceneryEntity(models.getModel('assets/runway01.gltf'));
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
    hangar4.position.set(1670, 0, -920);
    scene.add(hangar4);

    const tower = new StaticSceneryEntity(models.getModel('assets/control01.gltf'));
    tower.position.set(1580, 0, -500);
    tower.quaternion.setFromAxisAngle(UP, -Math.PI / 2);
    scene.add(tower);
}

function randomPosOver(surface: THREE.Object3D<THREE.Event>, position: THREE.Vector3, spread: number): THREE.Vector3 {
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

function applyMaterial(obj: THREE.Group | THREE.Mesh | THREE.Points, material: THREE.Material) {
    if ('isGroup' in obj) {
        obj.traverse(child => {
            if ('isMesh' in child) {
                const mesh = (child as THREE.Mesh);
                mesh.material = material;
                mesh.onBeforeRender = updateUniforms;
            }
        });
    } else {
        obj.material = material;
        obj.onBeforeRender = updateUniforms;
    }
}

function updateScene(delta: number) {

    scene.update(delta);

    bgGroundCamera.position.y = camera.position.y;
    bgGroundCamera.quaternion.copy(camera.quaternion);
    bgSkyCamera.quaternion.copy(camera.quaternion);
}

function getPalette() {
    return palettes[currentPalette];
}

function loop() {
    window.requestAnimationFrame(loop);
    const delta = clock.getDelta();

    updateScene(delta);
    renderer?.render(
        scene,
        {
            camera: camera,
            lists: [SceneLayers.EntityFlats, SceneLayers.EntityVolumes]
        },
        // TODO This horrible hack will be reduced until it disappears eventually...
        (r: THREE.Renderer) => {
            r.render(bgSkyScene, bgSkyCamera);
            r.render(bgGroundScene, bgGroundCamera);
            r.render(groundScene, camera);
            r.render(decorationScene, camera);
        }
    );
}

window.addEventListener("load", () => {
    setup();
});
