import * as THREE from 'three';
import { DEFAULT_LOD_BIAS, LODHelper, modelScaledMaxSize } from '../../render/helpers';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { Entity, ENTITY_TAGS } from "../entity";
import { Model } from '../models/models';
import { Palette } from "../../config/palettes/palette";
import { Scene, SceneLayers } from "../scene";

export class GroundTargetEntity implements Entity {

    private lodHelper: LODHelper;

    readonly tags: string[] = [ENTITY_TAGS.TARGET, ENTITY_TAGS.GROUND];

    enabled: boolean = true;

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
        return modelScaledMaxSize(this.model.maxSize, this.scale);
    }

    get localCenter(): THREE.Vector3 {
        return this.model.center;
    }

    get center(): THREE.Vector3 {
        return this.model.center;
    }

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        this.lodHelper.update(delta);
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        this.lodHelper.addToRenderList(
            this.position, this.quaternion, this.scale,
            targetWidth, camera, palette,
            SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }
}
