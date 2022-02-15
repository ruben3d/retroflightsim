import * as THREE from 'three';
import { H_RES, H_RES_HALF, V_RES, V_RES_HALF } from '../defs';
import { DefaultPalette, Palette, PaletteCategory } from '../scene/palettes/palette';
import { Scene, SceneLayers } from '../scene/scene';
import { assertExpr, assertIsDefined } from '../utils/asserts';
import { CanvasPainter } from './screen/canvasPainter';

export interface RendererOptions {
    textColors?: string[];
}

export enum RenderTargetType {
    WEBGL = 'WEBGL',
    CANVAS = 'CANVAS'
}

type RenderTarget = CanvasRenderTarget | WebGLRenderTarget;

interface BaseRenderTarget {
    ready: boolean;
    compositorObj: THREE.Mesh;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CanvasRenderTarget extends BaseRenderTarget {
    type: RenderTargetType.CANVAS;
    target: THREE.CanvasTexture;
}

interface WebGLRenderTarget extends BaseRenderTarget {
    type: RenderTargetType.WEBGL;
    target: THREE.WebGLRenderTarget;
}

export interface RenderLayer {
    target?: string;
    camera: THREE.Camera;
    lists: string[];
}

export const MAIN_RENDER_TARGET = 'MAIN_RENDER_TARGET';
export const CANVAS_RENDER_TARGET = 'CANVAS_RENDER_TARGET';

export class Renderer {
    private container: HTMLElement;
    private renderer: THREE.WebGL1Renderer;
    private composeScene: THREE.Scene = new THREE.Scene();
    private composeCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(-H_RES / 2, H_RES / 2, V_RES / 2, -V_RES / 2, -10, 10);
    private renderTargets: Map<string, RenderTarget> = new Map();
    private painter: CanvasPainter;
    private palette: Palette = DefaultPalette;
    private renderLists: Map<string, THREE.Scene>;
    private currentRenderLists: Map<string, THREE.Scene> = new Map();

    constructor(options?: RendererOptions) {
        const container = document.getElementById('container');
        if (!container) {
            throw new Error('<div id="container"> not found');
        }
        this.container = container;

        this.renderer = new THREE.WebGL1Renderer({ antialias: false });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.autoClear = false;
        this.renderer.sortObjects = false;
        this.updateViewportSize();
        this.container.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.updateViewportSize.bind(this));

        const { canvas, painter } = this.setupContext2D(options);
        this.painter = painter;

        this.createRenderTarget(MAIN_RENDER_TARGET, RenderTargetType.WEBGL, 0, 0, H_RES, V_RES);
        this.createRenderTarget(CANVAS_RENDER_TARGET, RenderTargetType.CANVAS, 0, 0, H_RES, V_RES, canvas);

        this.renderLists = new Map(Object.keys(SceneLayers).map(id => ([id, new THREE.Scene()])));

        this.composeCamera.position.setZ(1);
    }

    setPalette(palette: Palette) {
        this.palette = palette;
    }

    render(scene: Scene, renderLayers: RenderLayer[]) {

        this.composeScene.clear();

        for (const renderTarget of this.renderTargets.values()) {
            renderTarget.ready = false;
        }

        for (const layer of renderLayers) {

            const renderTarget = this.renderTargets.get(layer.target || MAIN_RENDER_TARGET);
            assertIsDefined(renderTarget);
            if (renderTarget.ready === false) {
                renderTarget.ready = true;
                if (renderTarget.type === RenderTargetType.CANVAS) {
                    this.painter.clear();
                    renderTarget.target.needsUpdate = true;
                } else {
                    this.renderer.setRenderTarget(renderTarget.target);
                    this.renderer.setClearColor(this.palette.colors[PaletteCategory.BACKGROUND]);
                    this.renderer.clear();
                }
                this.composeScene.add(renderTarget.compositorObj);
            }

            this.currentRenderLists.clear();
            for (const listId of layer.lists) {
                const list = this.renderLists.get(listId);
                assertIsDefined(list);
                list.clear();
                this.currentRenderLists.set(listId, list);
            }
            scene.buildRenderListsAndPaintCanvas(layer.camera, this.currentRenderLists, this.painter, this.palette);
            for (const listId of layer.lists) {
                const list = this.currentRenderLists.get(listId);
                assertIsDefined(list);
                this.renderer.render(list, layer.camera);
            }
        }

        // Compose all
        this.renderer.setRenderTarget(null);

        this.renderer.setClearColor('#000000');
        this.renderer.clear();
        this.renderer.render(this.composeScene, this.composeCamera);
    }

    // TODO Allow more than one canvas target, if there is any need for it
    createRenderTarget(id: string, type: RenderTargetType.WEBGL, x: number, y: number, width: number, height: number): void;
    createRenderTarget(id: string, type: RenderTargetType.CANVAS, x: number, y: number, width: number, height: number, canvas: HTMLCanvasElement): void;
    createRenderTarget(id: string, type: RenderTargetType, x: number, y: number, width: number, height: number, canvas?: HTMLCanvasElement): void {
        assertExpr(this.renderTargets.has(id) === false, `Render target "${id}" exists already`);

        const ready = false;
        if (type === RenderTargetType.WEBGL) {
            const target = new THREE.WebGLRenderTarget(width, height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBFormat
            });
            const compositorObj = new THREE.Mesh(
                new THREE.PlaneGeometry(width, height),
                new THREE.MeshBasicMaterial({ map: target.texture, depthWrite: false })
            );
            compositorObj.position.set(x + width / 2 - H_RES_HALF, -y - height / 2 + V_RES_HALF, 0);
            const renderTarget: RenderTarget = { type, target, compositorObj, ready, x, y, width, height };
            this.renderTargets.set(id, renderTarget);
        } else {
            assertIsDefined(canvas);
            const target = new THREE.CanvasTexture(canvas, undefined, undefined, undefined, THREE.NearestFilter, THREE.NearestFilter);
            const compositorObj = new THREE.Mesh(
                new THREE.PlaneGeometry(width, height),
                new THREE.MeshBasicMaterial({ map: target, depthWrite: false, transparent: true })
            );
            compositorObj.position.set(x, y, 0);
            const renderTarget: RenderTarget = { type, target, compositorObj, ready, x, y, width, height };
            this.renderTargets.set(id, renderTarget);
        }
    }

    private setupContext2D(options: RendererOptions | undefined): { canvas: HTMLCanvasElement, painter: CanvasPainter } {
        const canvas = document.createElement('canvas');
        canvas.width = H_RES;
        canvas.height = V_RES;
        const ctx = canvas.getContext("2d") || undefined;
        if (!ctx) {
            throw Error('Unable to create CanvasRenderingContext2D');
        }
        const painter = new CanvasPainter(ctx, options?.textColors);
        return { canvas, painter };
    }

    private updateViewportSize() {
        const viewportWidth = this.container.clientWidth || 1;
        const viewportHeight = this.container.clientHeight || 1;
        const viewportAspect = viewportWidth / viewportHeight;
        const aspect = H_RES / V_RES;
        if (viewportAspect > aspect) {
            const width = viewportAspect / aspect * H_RES;
            this.composeCamera.left = -width / 2;
            this.composeCamera.right = width / 2;
            this.composeCamera.top = V_RES / 2;
            this.composeCamera.bottom = -V_RES / 2;
        } else {
            const height = aspect / viewportAspect * V_RES;
            this.composeCamera.top = height / 2;
            this.composeCamera.bottom = -height / 2;
            this.composeCamera.left = -H_RES / 2;
            this.composeCamera.right = H_RES / 2;
        }
        this.composeCamera.updateProjectionMatrix();
        this.renderer.setSize(viewportWidth, viewportHeight);
    }
}
