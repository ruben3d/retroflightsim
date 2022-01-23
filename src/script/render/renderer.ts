import * as THREE from 'three';
import { H_RES, V_RES } from '../defs';
import { Scene } from '../scene/scene';
import { CanvasPainter } from './screen/canvasPainter';

export class Renderer {
    private container: HTMLElement;
    private renderer: THREE.WebGL1Renderer;
    private composeScene: THREE.Scene = new THREE.Scene();
    private composeCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(-H_RES / 2, H_RES / 2, V_RES / 2, -V_RES / 2, -10, 10);
    private sceneRenderTarget: THREE.WebGLRenderTarget;
    private canvasTexture: THREE.CanvasTexture;
    private painter: CanvasPainter;
    private backgroundColor: string = '#000000';

    constructor() {
        const container = document.getElementById('container');
        if (!container) {
            throw new Error('<div id="container"> not found');
        }
        this.container = container;

        this.renderer = new THREE.WebGL1Renderer({ antialias: false });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.autoClear = false;
        this.updateViewportSize();
        this.container.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.updateViewportSize.bind(this));

        const { canvas, painter } = this.setupContext2D();
        this.painter = painter;

        this.sceneRenderTarget = new THREE.WebGLRenderTarget(H_RES, V_RES, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat
        });
        this.canvasTexture = new THREE.CanvasTexture(canvas, undefined, undefined, undefined, THREE.NearestFilter, THREE.NearestFilter);
        this.setupCompose(this.sceneRenderTarget, this.canvasTexture);
    }

    setBackground(color: string) {
        this.backgroundColor = color;
    }

    render(scene: Scene, tmpHack: (r: THREE.Renderer) => void) {
        // 2D overlay
        this.painter.clear();
        scene.render(this.painter);
        this.canvasTexture.needsUpdate = true;

        // Main 3D scene
        this.renderer.setRenderTarget(this.sceneRenderTarget);

        this.renderer.setClearColor(this.backgroundColor);
        this.renderer.clear();
        tmpHack(this.renderer);

        // Compose all
        this.renderer.setRenderTarget(null);

        this.renderer.setClearColor('#000000');
        this.renderer.clear();
        this.renderer.render(this.composeScene, this.composeCamera);

    }

    private setupContext2D(): { canvas: HTMLCanvasElement, painter: CanvasPainter } {
        const canvas = document.createElement('canvas');
        canvas.width = H_RES;
        canvas.height = V_RES;
        const ctx = canvas.getContext("2d") || undefined;
        if (!ctx) {
            throw Error('Unable to create CanvasRenderingContext2D');
        }
        const painter = new CanvasPainter(ctx);
        return { canvas, painter };
    }

    private setupCompose(renderTarget: THREE.WebGLRenderTarget, canvasTexture: THREE.CanvasTexture) {
        this.composeScene.add(new THREE.Mesh(
            new THREE.PlaneGeometry(H_RES, V_RES),
            new THREE.MeshBasicMaterial({ map: renderTarget.texture, depthWrite: false })
        ));
        this.composeScene.add(new THREE.Mesh(
            new THREE.PlaneGeometry(H_RES, V_RES),
            new THREE.MeshBasicMaterial({ map: canvasTexture, depthWrite: false, transparent: true })
        ));

        this.composeCamera.position.setZ(1);
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
