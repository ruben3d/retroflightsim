import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { SceneMaterialManager } from './scene/materials/materials';
import { NoonPalette } from './scene/palettes/noon';
import { PaletteCategory } from './scene/palettes/palette';
import { NightPalette } from './scene/palettes/night';
import { Scene } from './scene/scene';
import { SpecklesEntity } from './scene/entities/speckles';
import { updateUniforms } from './scene/utils';
import { HUDEntity } from './scene/entities/overlay/hud';
import { Renderer } from './render/renderer';
import { H_RES, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, V_RES } from './defs';
import { PlayerEntity } from './scene/entities/player';


let renderer: Renderer | undefined;

// Scene

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, H_RES / V_RES, 5, 20000);
const decorationScene: THREE.Scene = new THREE.Scene();
const groundScene: THREE.Scene = new THREE.Scene();
const bgGroundCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, H_RES / V_RES, 100, 500000);
const bgGroundScene: THREE.Scene = new THREE.Scene();
const bgSkyCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, H_RES / V_RES, 5, 50000);
const bgSkyScene: THREE.Scene = new THREE.Scene();
let materials: SceneMaterialManager | undefined;
let sky: THREE.Mesh | undefined;
const clock = new THREE.Clock();

const SCENE_SPECKLES = 'SPECKLES';
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
        const land = terrain.get('land')!;
        const block = new THREE.BoxGeometry(10, 5, 10);
        block.translate(0, 2.5, 0);
        for (let i = 0; i < 100; i++) {
            const mesh = new THREE.Mesh(block, new THREE.MeshBasicMaterial());
            applyMaterial(mesh, localMaterials.build({
                category: PaletteCategory.DECORATION_BUILDING,
                shaded: true,
                depthWrite: true
            }));
            randomPosOver(land, mesh.position, 6000);
            decorationScene.add(mesh);
        }

        const grass = terrain.get('grass')!;
        const hill = new THREE.ConeGeometry(350, 150, 4, 1).toNonIndexed();
        hill.computeVertexNormals();
        hill.translate(0, 75, 0);
        for (let i = 0; i < 20; i++) {
            const mesh = new THREE.Mesh(hill, new THREE.MeshBasicMaterial());
            applyMaterial(mesh, localMaterials.build({
                category: PaletteCategory.DECORATION_MOUNTAIN_GRASS,
                shaded: true,
                depthWrite: true
            }));
            randomPosOver(grass, mesh.position, 10000);
            mesh.scale.x = 0.8 + Math.random() / 5.0;
            mesh.scale.y = 0.5 + Math.random() / 2.0;
            mesh.scale.z = 0.8 + Math.random() / 5.0;
            mesh.rotateY(Math.random() * Math.PI);
            decorationScene.add(mesh);
        }

        const darkLand = terrain.get('darkland')!;
        const mountain = new THREE.ConeGeometry(700, 300, 4, 1).toNonIndexed();
        mountain.computeVertexNormals();
        mountain.translate(0, 150, 0);
        for (let i = 0; i < 15; i++) {
            const mesh = new THREE.Mesh(mountain, new THREE.MeshBasicMaterial());
            applyMaterial(mesh, localMaterials.build({
                category: PaletteCategory.DECORATION_MOUNTAIN_BARE,
                shaded: true,
                depthWrite: true
            }));
            randomPosOver(darkLand, mesh.position, 10000);
            mesh.scale.x = 0.8 + Math.random() / 5.0;
            mesh.scale.y = 0.5 + Math.random() / 2.0;
            mesh.scale.z = 0.8 + Math.random() / 5.0;
            mesh.rotateY(Math.random() * Math.PI);
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

    const speckles = new SpecklesEntity(SCENE_SPECKLES, camera, materials);
    scene.add(speckles);

    const player = new PlayerEntity(camera, new THREE.Vector3(0, 150, 0), 0);
    scene.add(player);

    const hud = new HUDEntity(player);
    scene.add(hud);
}

function randomPosOver(surface: THREE.Object3D<THREE.Event>, position: THREE.Vector3, spread: number): THREE.Vector3 {
    let intersections: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = [];
    const caster = new THREE.Raycaster();
    const p = new THREE.Vector3(0, 1, 0);
    const d = new THREE.Vector3(0, -1, 0);
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
    renderer?.render(scene, (r: THREE.Renderer) => {
        r.render(bgSkyScene, bgSkyCamera);
        r.render(bgGroundScene, bgGroundCamera);
        r.render(groundScene, camera);
        r.render(scene.getScene(SCENE_SPECKLES), camera);
        r.render(decorationScene, camera);
    });
}

window.addEventListener("load", () => {
    setup();
});
