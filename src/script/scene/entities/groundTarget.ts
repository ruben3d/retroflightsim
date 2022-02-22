import * as THREE from 'three';
import { DEFAULT_LOD_BIAS, LODHelper, modelMaxSize } from '../../render/helpers';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { Entity, ENTITY_TAGS } from "../entity";
import { Model } from '../models/models';
import { Palette } from "../palettes/palette";
import { Scene, SceneLayers } from "../scene";

export class GroundTargetEntity implements Entity {

    private lodHelper: LODHelper;

    readonly tags: string[] = [ENTITY_TAGS.TARGET, ENTITY_TAGS.GROUND];

    constructor(private model: Model, lodBias: number = DEFAULT_LOD_BIAS,
        private type: string, private location: string) {

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

    get targetType(): string {
        return this.type;
    }

    get targetLocation(): string {
        return this.location;
    }

    get maxSize(): number {
        return modelMaxSize(this.model, this.scale);
    }

    get localCenter(): THREE.Vector3 {
        return this.model.center;
    }

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        //
    }

    render(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        this.lodHelper.addToRenderList(
            this.position, this.quaternion, this.scale,
            targetWidth, camera, palette,
            SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);
    }
}
