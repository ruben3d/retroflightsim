import * as THREE from 'three';
import { DEFAULT_LOD_BIAS, LODHelper } from '../../render/helpers';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { Entity } from "../entity";
import { Model } from '../models/models';
import { Palette } from "../../config/palettes/palette";
import { Scene } from "../scene";


export class SimpleEntity implements Entity {

    private lodHelper: LODHelper;

    readonly tags: string[] = [];

    enabled: boolean = true;

    constructor(model: Model, private flatLayerId: string, private volumeLayerId: string, lodBias: number = DEFAULT_LOD_BIAS) {
        this.lodHelper = new LODHelper(model, lodBias);
    }

    private obj: THREE.Object3D = new THREE.Object3D();

    set position(p: THREE.Vector3) {
        this.obj.position.copy(p);
    }

    get position() {
        return this.obj.position;
    }

    set quaternion(q: THREE.Quaternion) {
        this.obj.quaternion.copy(q);
    }

    get quaternion() {
        return this.obj.quaternion;
    }

    set scale(s: THREE.Vector3) {
        this.obj.scale.copy(s);
    }

    get scale() {
        return this.obj.scale;
    }

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        //
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        this.lodHelper.addToRenderList(
            this.position, this.quaternion, this.scale,
            targetWidth, camera, palette,
            this.flatLayerId, this.volumeLayerId, lists);
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }
}
