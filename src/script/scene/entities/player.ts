import * as THREE from 'three';
import { DEFAULT_LOD_BIAS, LODHelper } from '../../render/helpers';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { Entity, ENTITY_TAGS } from "../entity";
import { Model } from '../models/models';
import { Palette } from "../../config/palettes/palette";
import { FORWARD, RIGHT, Scene, SceneLayers, UP } from "../scene";
import { GroundTargetEntity } from './groundTarget';
import { AudioClip } from '../../audio/audioSystem';
import { FlightModel } from '../../physics/model/flightModel';


export class PlayerEntity implements Entity {

    private scene: Scene | undefined;
    private lodHelper: LODHelper;
    private lodHelperShadow: LODHelper;
    private shadowPosition = new THREE.Vector3();
    private shadowQuaternion = new THREE.Quaternion();
    private shadowScale = new THREE.Vector3();

    private flightModel: FlightModel;

    private inEngineAudio: AudioClip;
    private outEngineAudio: AudioClip;
    private enginePlaying: boolean = false;

    private obj = new THREE.Object3D();

    private pitch: number = 0; // [-1, 1]
    private roll: number = 0; // [-1, 1]
    private yaw: number = 0; // [-1, 1]
    private throttle: number = 0; // [0, 1]

    private target: GroundTargetEntity | undefined;
    private targetIndex: number | undefined

    private _nightVision: boolean = false;

    private _v = new THREE.Vector3();

    readonly tags: string[] = [];

    enabled: boolean = true;
    private _exteriorView: boolean = false;

    //------------------

    private velocity: THREE.Vector3 = new THREE.Vector3(); // m/s

    // Bearing increases CCW, radians
    constructor(model: Model, shadow: Model, flightModel: FlightModel, inEngineAudio: AudioClip, outEngineAudio: AudioClip, position: THREE.Vector3, bearing: number) {
        this.lodHelper = new LODHelper(model, DEFAULT_LOD_BIAS);
        this.lodHelperShadow = new LODHelper(shadow, 5);
        this.flightModel = flightModel;
        this.flightModel.position.copy(position);
        this.flightModel.quaternion.setFromAxisAngle(UP, bearing);
        this.inEngineAudio = inEngineAudio;
        this.outEngineAudio = outEngineAudio;
    }

    init(scene: Scene): void {
        this.scene = scene;
        this.setupInput();
    }

    update(delta: number): void {
        this.flightModel.setPitch(this.pitch);
        this.flightModel.setRoll(this.roll);
        this.flightModel.setYaw(this.yaw);
        this.flightModel.setThrottle(this.throttle);
        this.flightModel.update(delta);
        this.obj.position.copy(this.flightModel.position);
        this.obj.quaternion.copy(this.flightModel.quaternion);
        this.velocity.copy(this.flightModel.velocityVector);

        //this.updateAudio();
    }

    private updateAudio() {
        const engineAudio = this._exteriorView ? this.outEngineAudio : this.inEngineAudio;
        if (this.throttle > 0) {
            if (this.enginePlaying === false) {
                engineAudio.play();
                this.enginePlaying = true;
            }
            const x = this.throttle;
            const factorRate = 1 - (1 - x) * (1 - x); // easeOutQuad
            const factorGain = 1 - Math.pow(1 - x, 5); // easeOutQuint
            engineAudio.rate = 0.25 + 1.75 * factorRate;
            engineAudio.gain = 1.0 * factorGain;
        } else {
            if (this.enginePlaying === true) {
                engineAudio.stop();
                this.enginePlaying = false;
            }
        }
    }

    setFlightModel(flightModel: FlightModel) {
        this.flightModel = flightModel;
        this.flightModel.position.copy(this.obj.position);
        this.flightModel.quaternion.copy(this.obj.quaternion);
        this.flightModel.velocityVector.copy(this.velocity);
    }

    set exteriorView(isExteriorView: boolean) {
        if (isExteriorView === this._exteriorView) return;

        this._exteriorView = isExteriorView;
        if (this.enginePlaying && !isExteriorView) {
            this.outEngineAudio.stop();
            this.inEngineAudio.play();
        }
        else if (this.enginePlaying && isExteriorView) {
            this.outEngineAudio.play();
            this.inEngineAudio.stop();
        }
    }

    get exteriorView(): boolean {
        return this._exteriorView;
    }

    get nightVision(): boolean {
        return this._nightVision;
    }

    get isLanded(): boolean {
        return this.flightModel.isLanded();
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {

        this.shadowPosition.copy(this.position).setY(0);
        this.shadowQuaternion.setFromUnitVectors(FORWARD, this.obj.getWorldDirection(this._v).setY(0).normalize());
        const shadowLength = Math.max(0.2, this._v.copy(FORWARD).applyQuaternion(this.quaternion).setY(0).length());
        const shadowWidth = Math.max(0.2, this._v.copy(RIGHT).applyQuaternion(this.quaternion).setY(0).length());
        this.shadowScale.set(shadowWidth, 1, shadowLength);
        this.lodHelperShadow.addToRenderList(
            this.shadowPosition, this.shadowQuaternion, this.shadowScale,
            targetWidth, camera, palette,
            SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);

        if (this._exteriorView) {
            this.lodHelper.addToRenderList(
                this.position, this.quaternion, this.obj.scale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);
        }
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }

    setPitch(pitch: number) {
        this.pitch = pitch;
    }

    setRoll(roll: number) {
        this.roll = roll;
    }

    setYaw(yaw: number) {
        this.yaw = yaw;
    }

    setThrottle(throttle: number) {
        this.throttle = throttle;
    }

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

    getWorldDirection(v: THREE.Vector3): THREE.Vector3 {
        return this.obj.getWorldDirection(v);
    }

    getWorldUp(v: THREE.Vector3): THREE.Vector3 {
        return v
            .copy(UP)
            .applyQuaternion(this.obj.quaternion);
    }

    getWorldRight(v: THREE.Vector3): THREE.Vector3 {
        return v
            .copy(RIGHT)
            .applyQuaternion(this.obj.quaternion);
    }

    get throttleUnit(): number {
        return this.throttle;
    }

    get rawSpeed(): number {
        return this.velocity.length();
    }

    get velocityVector(): THREE.Vector3 {
        return this.velocity;
    }

    get weaponsTarget(): GroundTargetEntity | undefined {
        return this.target;
    }

    get stallStatus(): number {
        return this.flightModel.getStallStatus();
    }

    private setupInput() {
        document.addEventListener('keypress', (event: KeyboardEvent) => {
            switch (event.key) {
                case 't': {
                    this.pickTarget();
                    break;
                }
                case 'i': {
                    this._nightVision = !this._nightVision;
                    break;
                }
            }
        });
    }

    private pickTarget() {
        let index = this.targetIndex !== undefined ? this.targetIndex : -1;
        index++;
        if (index >= (this.scene?.countByTag(ENTITY_TAGS.TARGET) || 0)) {
            this.target = undefined;
            this.targetIndex = undefined;
        } else {
            this.target = this.scene?.entityAtByTag(ENTITY_TAGS.TARGET, index) as GroundTargetEntity | undefined;
            this.targetIndex = this.target !== undefined ? index : undefined;
        }
    }
}
