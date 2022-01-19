import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Vector3 } from 'three';
import { SceneMaterialManager, SceneMaterialUniforms } from './scene/materials/materials';
import { NoonPalette } from './scene/palettes/noon';
import { PaletteCategory } from './scene/palettes/palette';
import { NightPalette } from './scene/palettes/night';


// Scene

const TERRAIN_SCALE = 100.0;
const TERRAIN_MODEL_SIZE = 100.0;
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, 1, 5, 20000);
const scene: THREE.Scene = new THREE.Scene();
const bgGroundCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, 1, 100, 500000);
const bgGroundScene: THREE.Scene = new THREE.Scene();
const bgSkyCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, 1, 5, 50000);
const bgSkyScene: THREE.Scene = new THREE.Scene();
let materials: SceneMaterialManager | undefined;
let sky: THREE.Mesh | undefined;
const clock = new THREE.Clock();

const palettes = [NoonPalette, NightPalette];
let currentPalette = 0;

// Controls

enum Stick {
    IDLE,
    POSITIVE,
    NEGATIVE
};
let pitchState: Stick = Stick.IDLE;
let rollState: Stick = Stick.IDLE;
const PITCH_RATE = Math.PI / 6; // Radians/s
const ROLL_RATE = Math.PI / 4; // Radians/s
const YAW_RATE = Math.PI / 16; // Radians/s
const SPEED = 80.0; // World units/s
const MIN_HEIGHT = 10; // World units
const MAX_HEIGHT = 750; // World units

// Rendering

const H_RES = 320;
const V_RES = 200;
let container: HTMLElement | null;
let renderer: THREE.WebGL1Renderer | undefined;
const composeScene: THREE.Scene = new THREE.Scene();
const composeCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(-H_RES / 2, H_RES / 2, V_RES / 2, -V_RES / 2, -10, 10);
let renderTarget: THREE.WebGLRenderTarget | undefined;

function setup() {
    setupThree();
    setupScene();
    setupControls();
    loop();
}

function setupThree() {
    container = document.getElementById('container');
    if (!container) {
        throw new Error('<div id="container"> not found');
    }

    renderer = new THREE.WebGL1Renderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.autoClear = false;
    setViewportSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', refreshSize);

    renderTarget = new THREE.WebGLRenderTarget(H_RES, V_RES, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });

    setupCompose(renderTarget);
}

function setupCompose(renderTarget: THREE.WebGLRenderTarget) {
    composeScene.add(new THREE.Mesh(
        new THREE.PlaneGeometry(H_RES, V_RES),
        new THREE.MeshBasicMaterial({ map: renderTarget.texture, depthWrite: false })
    ));

    composeCamera.position.setZ(1);
}

function setViewportSize(viewportWidth: number, viewportHeight: number) {
    const aspect = viewportWidth / viewportHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    bgGroundCamera.aspect = aspect;
    bgGroundCamera.updateProjectionMatrix();
    bgSkyCamera.aspect = aspect;
    bgSkyCamera.updateProjectionMatrix();

    renderer?.setSize(viewportWidth, viewportHeight);
}

function refreshSize() {
    setViewportSize(container?.clientWidth || 1, container?.clientHeight || 1);
}

function setupControls() {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
        switch (event.key) {
            case 'w': {
                pitchState = Stick.NEGATIVE;
                break;
            }
            case 's': {
                pitchState = Stick.POSITIVE;
                break;
            }
            case 'a': {
                rollState = Stick.POSITIVE;
                break;
            }
            case 'd': {
                rollState = Stick.NEGATIVE;
                break;
            }
        }
    });

    document.addEventListener('keyup', (event: KeyboardEvent) => {
        switch (event.key) {
            case 'w': {
                if (pitchState === Stick.NEGATIVE) {
                    pitchState = Stick.IDLE;
                }
                break;
            }
            case 's': {
                if (pitchState === Stick.POSITIVE) {
                    pitchState = Stick.IDLE;
                }
                break;
            }
            case 'a': {
                if (rollState === Stick.POSITIVE) {
                    rollState = Stick.IDLE;
                }
                break;
            }
            case 'd': {
                if (rollState === Stick.NEGATIVE) {
                    rollState = Stick.IDLE;
                }
                break;
            }
        }
    });

    document.addEventListener('blur', () => {
        pitchState = Stick.IDLE;
        rollState = Stick.IDLE;
    });

    document.addEventListener('keypress', (event: KeyboardEvent) => {
        switch (event.key) {
            case 'n': {
                currentPalette = (currentPalette + 1) % palettes.length;
                materials?.setPalette(getPalette());
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
    groundGeometry.rotateX(Math.PI / 2);
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
    skyGeometry.rotateX(-Math.PI / 2);
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
        const block = new THREE.BoxGeometry(10, 10, 10);
        for (let i = 0; i < 800; i++) {
            const mesh = new THREE.Mesh(block, new THREE.MeshBasicMaterial());
            applyMaterial(mesh, localMaterials.build({
                category: PaletteCategory.DECORATION_BUILDING,
                shaded: true,
                depthWrite: true
            }));
            randomPosOver(land, mesh.position, 6000);
            scene.add(mesh);
        }

        const grass = terrain.get('grass')!;
        const hill = new THREE.ConeGeometry(700, 300, 4, 1);
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
            scene.add(mesh);
        }

        const darkLand = terrain.get('darkland')!;
        const mountain = new THREE.ConeGeometry(1400, 600, 4, 1);
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
            scene.add(mesh);
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
                depthWrite: true
            }));
            obj.scale.x = obj.scale.z = TERRAIN_SCALE;
            terrain.set(def.file, obj);
            scene.add(obj);

            for (let x = -1; x <= 1; x++) {
                for (let z = -1; z <= 1; z++) {
                    if (x === 0 && z === 0) continue;
                    const tile = obj.clone(true);
                    tile.position.x = x * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
                    tile.position.z = z * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
                    tile.scale.x = tile.scale.x * (x === 0 ? 1 : -1);
                    tile.scale.z = tile.scale.z * (z === 0 ? 1 : -1);
                    scene.add(tile);
                }
            }
        });
    });

    camera.position.setY(100);
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

function applyMaterial(obj: THREE.Group | THREE.Mesh, material: THREE.Material) {
    if ('isMesh' in obj) {
        obj.material = material;
        obj.onBeforeRender = updateUniforms;
    } else {
        obj.traverse(child => {
            if ('isMesh' in child) {
                const mesh = (child as THREE.Mesh);
                mesh.material = material;
                mesh.onBeforeRender = updateUniforms;
            }
        });
    }
}

function updateUniforms(this: THREE.Mesh, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group) {
    const m = (material as THREE.ShaderMaterial);
    const u = m.uniforms as SceneMaterialUniforms;
    const n = u.vCameraNormal.value as THREE.Vector3;
    camera.getWorldDirection(n).setY(0.0).normalize();
    const p = camera.getWorldPosition(new THREE.Vector3());
    u.vCameraD.value = p.multiplyScalar(-1).dot(n);
    m.uniformsNeedUpdate = true;

    if (m.userData?.shaded) {
        const matrix = u.normalModelMatrix.value as THREE.Matrix3;
        matrix.getNormalMatrix(this.matrixWorld);
    }
}

function updateScene(delta: number) {
    // Roll control
    if (rollState === Stick.POSITIVE) {
        camera.rotateZ(ROLL_RATE * delta);
    } else if (rollState === Stick.NEGATIVE) {
        camera.rotateZ(-ROLL_RATE * delta);
    }

    // Pitch control
    if (pitchState === Stick.POSITIVE) {
        camera.rotateX(PITCH_RATE * delta);
    } else if (pitchState === Stick.NEGATIVE) {
        camera.rotateX(-PITCH_RATE * delta);
    }

    // Automatic yaw when rolling
    const forward = camera.getWorldDirection(new THREE.Vector3());
    if (-0.99 < forward.y && forward.y < 0.99) {
        const prjForward = forward.clone().setY(0);
        const up = (new THREE.Vector3(0, 1, 0)).applyQuaternion(camera.quaternion);
        const prjUp = up.clone().projectOnPlane(prjForward).setY(0);
        const sign = (prjForward.x * prjUp.z - prjForward.z * prjUp.x) > 0 ? -1 : 1;
        camera.rotateOnWorldAxis(new Vector3(0, 1, 0), sign * prjUp.length() * prjForward.length() * YAW_RATE * delta);
    }

    // Movement
    camera.translateZ(-SPEED * delta);

    // Avoid ground crashes
    if (camera.position.y < MIN_HEIGHT) {
        camera.position.y = MIN_HEIGHT;
        const d = camera.getWorldDirection(new THREE.Vector3());
        d.setY(0).add(camera.position);
        camera.lookAt(d);
    }

    // Avoid flying too high
    if (camera.position.y > MAX_HEIGHT) {
        camera.position.y = MAX_HEIGHT;
    }

    // Avoid flying out of bounds, wraps around
    const modelHalfSize = TERRAIN_MODEL_SIZE * 0.5 * TERRAIN_SCALE;
    if (camera.position.x > modelHalfSize) camera.position.x = -modelHalfSize;
    if (camera.position.x < -modelHalfSize) camera.position.x = modelHalfSize;
    if (camera.position.z > modelHalfSize) camera.position.z = -modelHalfSize;
    if (camera.position.z < -modelHalfSize) camera.position.z = modelHalfSize;

    bgGroundCamera.position.y = camera.position.y;
    bgGroundCamera.quaternion.copy(camera.quaternion);
    bgSkyCamera.quaternion.copy(camera.quaternion);
}

function renderScene(r: THREE.WebGL1Renderer) {
    r.setRenderTarget(renderTarget!);

    r.setClearColor(getPalette().colors[PaletteCategory.BACKGROUND]);
    r.clear();
    r.render(bgSkyScene, bgSkyCamera);
    r.render(bgGroundScene, bgGroundCamera);
    r.render(scene, camera);

    r.setRenderTarget(null);

    r.clear();
    r.render(composeScene, composeCamera);
}

function getPalette() {
    return palettes[currentPalette];
}

function loop() {
    window.requestAnimationFrame(loop);
    const delta = clock.getDelta();

    updateScene(delta);
    renderScene(renderer!);
}

window.addEventListener("load", () => {
    setup();
});
