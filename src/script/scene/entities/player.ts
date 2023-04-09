import * as THREE from 'three';
import { AudioClip } from '../../audio/audioSystem';
import { Palette } from "../../config/palettes/palette";
import { FlightModel } from '../../physics/model/flightModel';
import { DEFAULT_LOD_BIAS, LODHelper } from '../../render/helpers';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { HUDFocusMode } from '../../state/gameDefs';
import { easeOutQuad, easeOutQuint } from '../../utils/math';
import { Entity, ENTITY_TAGS } from "../entity";
import { Model } from '../models/models';
import { FORWARD, RIGHT, Scene, SceneLayers, UP } from "../scene";
import { GroundTargetEntity } from './groundTarget';


export interface PlayerModelParts {
    body: Model;
    shadow: Model;
    flaperonLeft: Model;
    flaperonRight: Model;
    elevatorLeft: Model;
    elevatorRight: Model;
    rudderLeft: Model;
    rudderRight: Model;
}

const ENGINE_LOWEST_VOLUME = 0.05;

const ELEVATOR_LEFT_POSITION = new THREE.Vector3(0, 0, -6);
const ELEVATOR_LEFT_AXIS = RIGHT;
const ELEVATOR_RIGHT_POSITION = new THREE.Vector3(0, 0, -6);
const ELEVATOR_RIGHT_AXIS = RIGHT;
const FLAPERON_LEFT_POSITION = new THREE.Vector3(4.5, -0.21, -3);
const FLAPERON_LEFT_AXIS = new THREE.Vector3(1.681781, -0.152682, 0.57654);
const FLAPERON_RIGHT_POSITION = new THREE.Vector3(-4.5, -0.21, -3);
const FLAPERON_RIGHT_AXIS = new THREE.Vector3(-1.681781, -0.152682, 0.57654);
const RUDDER_LEFT_POSITION = new THREE.Vector3(2.34, 1.8, -4.05);
const RUDDER_LEFT_AXIS = new THREE.Vector3(0.383502, 0.802989, 0.456217);
const RUDDER_RIGHT_POSITION = new THREE.Vector3(-2.34, 1.8, -4.05);
const RUDDER_RIGHT_AXIS = new THREE.Vector3(-0.383502, 0.802989, 0.456217);//(0.383502, -0.456217, 0.802989)

interface ControlSurfaceDescriptor {
    model: LODHelper;
    positiom: THREE.Vector3;
    axis: THREE.Vector3;
    value: () => number;
    range: number;
}

export class PlayerEntity implements Entity {

    private scene: Scene | undefined;
    private modelBody: LODHelper;
    private modelShadow: LODHelper;
    private modelFlaperonLeft: LODHelper;
    private modelFlaperonRight: LODHelper;
    private modelElevatorLeft: LODHelper;
    private modelElevatorRight: LODHelper;
    private modelRudderLeft: LODHelper;
    private modelRudderRight: LODHelper;
    private shadowPosition = new THREE.Vector3();
    private shadowQuaternion = new THREE.Quaternion();
    private shadowScale = new THREE.Vector3();

    private controlSurfaceDescriptors: ControlSurfaceDescriptor[];

    private flightModel: FlightModel;

    private inEngineAudio: AudioClip;
    private outEngineAudio: AudioClip;
    private enginePlaying: boolean = false;
    private engineStarted: boolean = false;

    private obj = new THREE.Object3D();

    private pitch: number = 0; // [-1, 1]
    private roll: number = 0; // [-1, 1]
    private yaw: number = 0; // [-1, 1]
    private throttle: number = 0; // [0, 1]

    private velocity: THREE.Vector3 = new THREE.Vector3(); // m/s

    private target: GroundTargetEntity | undefined;
    private targetIndex: number | undefined

    private _nightVision: boolean = false;
    private hudFocus: HUDFocusMode = HUDFocusMode.DISABLED;

    private _v = new THREE.Vector3();
    private _q = new THREE.Quaternion();

    readonly tags: string[] = [];

    enabled: boolean = true;
    private _exteriorView: boolean = false;

    // Heading increases CCW, radians
    constructor(modelParts: PlayerModelParts, flightModel: FlightModel, inEngineAudio: AudioClip, outEngineAudio: AudioClip, position: THREE.Vector3, heading: number) {
        this.modelBody = new LODHelper(modelParts.body, DEFAULT_LOD_BIAS);
        this.modelShadow = new LODHelper(modelParts.shadow, 5);
        this.modelFlaperonLeft = new LODHelper(modelParts.flaperonLeft, DEFAULT_LOD_BIAS);
        this.modelFlaperonRight = new LODHelper(modelParts.flaperonRight, DEFAULT_LOD_BIAS);
        this.modelElevatorLeft = new LODHelper(modelParts.elevatorLeft, DEFAULT_LOD_BIAS);
        this.modelElevatorRight = new LODHelper(modelParts.elevatorRight, DEFAULT_LOD_BIAS);
        this.modelRudderLeft = new LODHelper(modelParts.rudderLeft, DEFAULT_LOD_BIAS);
        this.modelRudderRight = new LODHelper(modelParts.rudderRight, DEFAULT_LOD_BIAS);
        this.flightModel = flightModel;
        this.flightModel.position.copy(position);
        this.flightModel.quaternion.setFromAxisAngle(UP, heading);
        this.inEngineAudio = inEngineAudio;
        this.outEngineAudio = outEngineAudio;

        this.controlSurfaceDescriptors = [
            {
                model: this.modelFlaperonLeft,
                positiom: FLAPERON_LEFT_POSITION,
                axis: FLAPERON_LEFT_AXIS,
                value: () => { return -this.roll },
                range: Math.PI / 6
            },
            {
                model: this.modelFlaperonRight,
                positiom: FLAPERON_RIGHT_POSITION,
                axis: FLAPERON_RIGHT_AXIS,
                value: () => { return -this.roll },
                range: Math.PI / 6
            },
            {
                model: this.modelElevatorLeft,
                positiom: ELEVATOR_LEFT_POSITION,
                axis: ELEVATOR_LEFT_AXIS,
                value: () => { return this.pitch },
                range: Math.PI / 6
            },
            {
                model: this.modelElevatorRight,
                positiom: ELEVATOR_RIGHT_POSITION,
                axis: ELEVATOR_RIGHT_AXIS,
                value: () => { return this.pitch },
                range: Math.PI / 6
            },
            {
                model: this.modelRudderLeft,
                positiom: RUDDER_LEFT_POSITION,
                axis: RUDDER_LEFT_AXIS,
                value: () => { return this.yaw },
                range: Math.PI / 6
            },
            {
                model: this.modelRudderRight,
                positiom: RUDDER_RIGHT_POSITION,
                axis: RUDDER_RIGHT_AXIS,
                value: () => { return this.yaw },
                range: Math.PI / 6
            }
        ];
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

        this.updateAudio();
    }

    private updateAudio() {
        const engineAudio = this._exteriorView ? this.outEngineAudio : this.inEngineAudio;
        let throttle = this.flightModel.gerEffectiveThrottle();

        if (throttle > 0 && this.enginePlaying === false) {
            engineAudio.play();
            this.enginePlaying = true;
        }

        if (this.enginePlaying) {
            if (throttle > ENGINE_LOWEST_VOLUME) {
                this.engineStarted = true;
            }
            if (this.engineStarted) {
                throttle = Math.max(ENGINE_LOWEST_VOLUME, throttle);
            }
            const x = throttle;
            const factorRate = easeOutQuad(x);
            const factorGain = easeOutQuint(x);
            engineAudio.rate = 0.25 + 1.75 * factorRate;
            engineAudio.gain = 1.0 * factorGain;
        }

        // if (this.enginePlaying === true) {
        //     engineAudio.stop();
        //     this.enginePlaying = false;
        // }
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
        this.modelShadow.addToRenderList(
            this.shadowPosition, this.shadowQuaternion, this.shadowScale,
            targetWidth, camera, palette,
            SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);

        if (this._exteriorView) {
            const lod = this.modelBody.getLodLevel(this.position, this.obj.scale, targetWidth, camera, this.modelBody.model.maxSize);

            this.modelBody.addToRenderList(
                this.position, this.quaternion, this.obj.scale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, lod);

            if (lod === 0) {
                for (let i = 0; i < this.controlSurfaceDescriptors.length; i++) {
                    const d = this.controlSurfaceDescriptors[i];

                    this._q.setFromAxisAngle(this._v.copy(d.axis).applyQuaternion(this.quaternion), d.value() * d.range).multiply(this.quaternion);
                    this._v.copy(d.positiom).applyQuaternion(this.quaternion).add(this.position);
                    d.model.addToRenderList(
                        this._v, this._q, this.obj.scale,
                        targetWidth, camera, palette,
                        SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
                }
            }
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

    get hudFocusMode(): HUDFocusMode {
        return this.hudFocus;
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
                case 'f': {
                    this.hudFocus += 1;
                    this.hudFocus %= HUDFocusMode._LENGTH;
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
