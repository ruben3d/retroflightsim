import * as THREE from 'three';
import { Palette, PaletteCategory, PaletteColor } from '../config/palettes/palette';
import { SceneMaterialManager } from '../scene/materials/materials';
import { Scene, SceneLayers } from '../scene/scene';
import { assertExpr, assertIsDefined } from '../utils/asserts';
import { CanvasPainter } from './screen/canvasPainter';
import { TextEffect } from './screen/text';

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
    painter: CanvasPainter;
}

interface WebGLRenderTarget extends BaseRenderTarget {
    type: RenderTargetType.WEBGL;
    target: THREE.WebGLRenderTarget;
}

export interface RenderLayer {
    target: string;
    camera: THREE.Camera;
    lists: string[];
    palette?: Palette;
}

export class Renderer {
    private container: HTMLElement;
    private renderer: THREE.WebGL1Renderer;
    private composeScene: THREE.Scene = new THREE.Scene();
    private composeCamera: THREE.OrthographicCamera;
    private renderTargets: Map<string, RenderTarget> = new Map();
    private palette: Palette;
    private textEffect: TextEffect = TextEffect.NONE;
    private renderLists: Map<string, THREE.Scene>;
    private current3DRenderLists: Map<string, THREE.Scene> = new Map();
    private current2DRenderLists: Set<string> = new Set();

    constructor(private materials: SceneMaterialManager, private composeWidth: number, private composeHeight: number, palette: Palette) {
        const container = document.getElementById('container');
        assertIsDefined(container, '<div id="container"> not found');
        this.container = container;
        this.composeCamera = new THREE.OrthographicCamera(-composeWidth / 2, composeWidth / 2, composeHeight / 2, -composeHeight / 2, -10, 10);
        this.palette = palette;
        this.renderer = new THREE.WebGL1Renderer({ antialias: false });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        assertExpr(this.renderer.extensions.has('ANGLE_instanced_arrays'), 'Renderer: WebGL1 extension "ANGLE_instanced_arrays" is required');
        this.renderer.autoClear = false;
        this.renderer.sortObjects = false;
        this.updateViewportSize();
        this.container.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.updateViewportSize.bind(this));

        this.renderLists = new Map(Object.keys(SceneLayers).map(id => ([id, new THREE.Scene()])));

        this.composeCamera.position.setZ(1);
    }

    setPalette(palette: Palette) {
        this.palette = palette;
        this.materials.setPalette(palette);
    }

    setTextEffect(effect: TextEffect) {
        this.textEffect = effect;
    }

    setComposeSize(width: number, height: number) {
        this.composeWidth = width;
        this.composeHeight = height;
        this.updateViewportSize();
    }

    render(scene: Scene, renderLayers: RenderLayer[]) {

        let prevPalette = this.palette;
        this.materials.setPalette(this.palette);
        this.composeScene.clear();

        for (const renderTarget of this.renderTargets.values()) {
            renderTarget.ready = false;
        }

        for (const layer of renderLayers) {
            const palette = layer.palette || this.palette;
            if (palette !== prevPalette) {
                prevPalette = palette;
                this.materials.setPalette(palette);
            }

            const renderTarget = this.prepareRenderTarget(layer.target, palette);

            if (renderTarget.type === RenderTargetType.WEBGL) {
                this.render3D(renderTarget, scene, layer, palette);
            } else {
                this.render2D(renderTarget, scene, layer, palette);
            }
        }

        // Compose all
        this.renderer.setRenderTarget(null);

        this.renderer.setClearColor('#000000');
        this.renderer.clear();
        this.renderer.render(this.composeScene, this.composeCamera);
    }

    prepareRenderTarget(target: string, palette: Palette): RenderTarget {
        const renderTarget = this.renderTargets.get(target);
        assertIsDefined(renderTarget);
        if (renderTarget.ready === false) {
            renderTarget.ready = true;
            if (renderTarget.type === RenderTargetType.CANVAS) {
                renderTarget.painter.clear();
                renderTarget.target.needsUpdate = true;
            } else {
                renderTarget.compositorObj.position.set(
                    renderTarget.x + renderTarget.width / 2 - this.composeWidth / 2,
                    -renderTarget.y - renderTarget.height / 2 + this.composeHeight / 2,
                    0
                );
                this.renderer.setRenderTarget(renderTarget.target);
                this.renderer.setClearColor(PaletteColor(palette, PaletteCategory.BACKGROUND));
                this.renderer.clear();
            }
            this.composeScene.add(renderTarget.compositorObj);
        }
        return renderTarget;
    }

    render3D(renderTarget: WebGLRenderTarget, scene: Scene, layer: RenderLayer, palette: Palette) {
        this.current3DRenderLists.clear();
        for (const listId of layer.lists) {
            const list = this.renderLists.get(listId);
            assertIsDefined(list);
            list.clear();
            this.current3DRenderLists.set(listId, list);
        }
        scene.buildRenderLists(renderTarget.width, renderTarget.height, layer.camera, this.current3DRenderLists, palette);
        for (const listId of layer.lists) {
            const list = this.current3DRenderLists.get(listId);
            assertIsDefined(list);
            this.renderer.render(list, layer.camera);
        }
    }

    render2D(renderTarget: CanvasRenderTarget, scene: Scene, layer: RenderLayer, palette: Palette) {
        this.current2DRenderLists.clear();
        for (const listId of layer.lists) {
            assertExpr(this.renderLists.has(listId));
            this.current2DRenderLists.add(listId);
        }
        renderTarget.painter.setTextEffect(this.textEffect, PaletteColor(palette, PaletteCategory.HUD_TEXT_EFFECT));
        scene.paintCanvas(renderTarget.width, renderTarget.height, layer.camera, this.current2DRenderLists, renderTarget.painter, palette);
    }

    createRenderTarget(id: string, type: RenderTargetType.WEBGL, x: number, y: number, width: number, height: number): void;
    createRenderTarget(id: string, type: RenderTargetType.CANVAS, x: number, y: number, width: number, height: number, options?: RendererOptions): void;
    createRenderTarget(id: string, type: RenderTargetType, x: number, y: number, width: number, height: number, options?: RendererOptions): void {
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
            compositorObj.position.set(x + width / 2 - this.composeWidth / 2, -y - height / 2 + this.composeHeight / 2, 0);
            const renderTarget: RenderTarget = { type, target, compositorObj, ready, x, y, width, height };
            this.renderTargets.set(id, renderTarget);
        } else {
            const { canvas, painter } = this.setupContext2D(width, height, options);
            assertIsDefined(canvas);
            const target = new THREE.CanvasTexture(canvas, undefined, undefined, undefined, THREE.NearestFilter, THREE.NearestFilter);
            const compositorObj = new THREE.Mesh(
                new THREE.PlaneGeometry(width, height),
                new THREE.MeshBasicMaterial({ map: target, depthWrite: false, transparent: true })
            );
            compositorObj.position.set(x, y, 0);
            const renderTarget: RenderTarget = { type, target, painter, compositorObj, ready, x, y, width, height };
            this.renderTargets.set(id, renderTarget);
        }
    }

    private setupContext2D(width: number, height: number, options: RendererOptions | undefined): { canvas: HTMLCanvasElement, painter: CanvasPainter } {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
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
        const aspect = this.composeWidth / this.composeHeight;
        if (viewportAspect > aspect) {
            const width = viewportAspect / aspect * this.composeWidth;
            this.composeCamera.left = -width / 2;
            this.composeCamera.right = width / 2;
            this.composeCamera.top = this.composeHeight / 2;
            this.composeCamera.bottom = -this.composeHeight / 2;
        } else {
            const height = aspect / viewportAspect * this.composeHeight;
            this.composeCamera.top = height / 2;
            this.composeCamera.bottom = -height / 2;
            this.composeCamera.left = -this.composeWidth / 2;
            this.composeCamera.right = this.composeWidth / 2;
        }
        this.composeCamera.updateProjectionMatrix();
        this.renderer.setSize(viewportWidth, viewportHeight);
    }
}
