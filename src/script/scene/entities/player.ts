import * as THREE from 'three';
import { AudioClip } from '../../audio/audioSystem';
import { Palette } from "../../config/palettes/palette";
import { TERRAIN_MODEL_SIZE, TERRAIN_SCALE } from '../../defs';
import { FlightModel } from '../../physics/model/flightModel';
import { LODHelper, getLodLevel } from '../../render/helpers';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { HUDFocusMode } from '../../state/gameDefs';
import { easeOutQuad, easeOutQuint, FORWARD, RIGHT, UP } from '../../utils/math';
import { Entity, ENTITY_TAGS } from "../entity";
import { ModelManager } from '../models/models';
import { Scene, SceneLayers } from "../scene";
import { GroundTargetEntity } from './groundTarget';


export interface PlayerModelParts {
    body: string;
    shadow: string;
    landingGear: string;
    flaperonLeft: string;
    flaperonRight: string;
    elevatorLeft: string;
    elevatorRight: string;
    rudderLeft: string;
    rudderRight: string;
}

const ENGINE_LOWEST_VOLUME = 0.05; // [0,1]

const LANDING_GEAR_ANIM_DURATION = 3; // Seconds

const FLAPS_ANIM_DURATION = 2; // Seconds
const FLAPS_EXTENDED_ANGLE = Math.PI / 5; // Radians

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
const RUDDER_RIGHT_AXIS = new THREE.Vector3(-0.383502, 0.802989, 0.456217);

interface ControlSurfaceDescriptor {
    model: LODHelper;
    positiom: THREE.Vector3;
    axis: THREE.Vector3;
    value: () => number;
    range: number;
}

export enum AircraftDeviceState {
    RETRACTING,
    RETRACTED,
    EXTENDING,
    EXTENDED
}

export class PlayerEntity implements Entity {

    private scene: Scene | undefined;
    private modelBody: LODHelper;
    private modelShadow: LODHelper;
    private modelLandingGear: LODHelper | undefined;
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

    private landingGearState: AircraftDeviceState = AircraftDeviceState.EXTENDED;
    private landingGearProgress = LANDING_GEAR_ANIM_DURATION;

    private flapsState: AircraftDeviceState = AircraftDeviceState.EXTENDED;
    private flapsProgress = FLAPS_ANIM_DURATION;
    private flapsProgressUnit = 1.0;

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
    constructor(models: ModelManager, modelParts: PlayerModelParts, flightModel: FlightModel, inEngineAudio: AudioClip, outEngineAudio: AudioClip, position: THREE.Vector3, heading: number) {
        this.modelBody = new LODHelper(models.getModel(modelParts.body));
        this.modelShadow = new LODHelper(models.getModel(modelParts.shadow), 5);
        this.modelFlaperonLeft = new LODHelper(models.getModel(modelParts.flaperonLeft));
        this.modelFlaperonRight = new LODHelper(models.getModel(modelParts.flaperonRight));
        this.modelElevatorLeft = new LODHelper(models.getModel(modelParts.elevatorLeft));
        this.modelElevatorRight = new LODHelper(models.getModel(modelParts.elevatorRight));
        this.modelRudderLeft = new LODHelper(models.getModel(modelParts.rudderLeft));
        this.modelRudderRight = new LODHelper(models.getModel(modelParts.rudderRight));

        models.getModel(modelParts.landingGear, (_, model) => {
            this.modelLandingGear = new LODHelper(model);
            this.modelLandingGear.setPlaybackDuration(LANDING_GEAR_ANIM_DURATION);
            this.modelLandingGear.setPlaybackPosition(1);
        });

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
                value: () => { return this.flapsProgressUnit * -FLAPS_EXTENDED_ANGLE - (1.0 - this.flapsProgressUnit * 0.5) * this.roll },
                range: Math.PI / 6
            },
            {
                model: this.modelFlaperonRight,
                positiom: FLAPERON_RIGHT_POSITION,
                axis: FLAPERON_RIGHT_AXIS,
                value: () => { return this.flapsProgressUnit * FLAPS_EXTENDED_ANGLE - (1.0 - this.flapsProgressUnit * 0.5) * this.roll },
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
        this.flightModel.setLandingGearDeployed(this.landingGearState === AircraftDeviceState.EXTENDED);
        this.flightModel.setFlapsExtended(this.flapsState === AircraftDeviceState.EXTENDED);
        this.flightModel.update(delta);
        this.obj.position.copy(this.flightModel.position);
        this.obj.quaternion.copy(this.flightModel.quaternion);
        this.velocity.copy(this.flightModel.velocityVector);

        // Avoid flying out of bounds, wraps around
        const terrainHalfSize = 2.5 * TERRAIN_SCALE * TERRAIN_MODEL_SIZE;
        let isOutBounds = false;
        if (this.obj.position.x > terrainHalfSize) {
            this.obj.position.x = -terrainHalfSize;
            isOutBounds = true;
        }
        if (this.obj.position.x < -terrainHalfSize) {
            this.obj.position.x = terrainHalfSize;
            isOutBounds = true;
        }
        if (this.obj.position.z > terrainHalfSize) {
            this.obj.position.z = -terrainHalfSize;
            isOutBounds = true;
        }
        if (this.obj.position.z < -terrainHalfSize) {
            this.obj.position.z = terrainHalfSize;
            isOutBounds = true;
        }
        if (isOutBounds) {
            this.flightModel.position.copy(this.obj.position);
        }

        this.updateAudio();

        if (!this.isCrashed) {
            this.updateLandingGear(delta);
            this.updateFlaps(delta);
        }
    }

    reset(position: THREE.Vector3, heading: number) {
        this.flightModel.reset();
        this.flightModel.position.copy(position)
        this.flightModel.quaternion.setFromAxisAngle(UP, heading);

        this.pitch = 0;
        this.roll = 0;
        this.yaw = 0;
        this.throttle = 0;

        this.landingGearState = AircraftDeviceState.EXTENDED;
        this.modelLandingGear?.setPlaybackPosition(1);
        this.landingGearProgress = LANDING_GEAR_ANIM_DURATION;

        this.flapsState = AircraftDeviceState.EXTENDED;
        this.flapsProgress = FLAPS_ANIM_DURATION;
        this.flapsProgressUnit = 1.0;

        this.engineStarted = false;

        this.target = undefined;
        this.targetIndex = undefined;
    }

    private updateFlaps(delta: number) {
        if (this.flapsState === AircraftDeviceState.EXTENDING) {
            this.flapsProgress += delta;
            if (this.flapsProgress >= FLAPS_ANIM_DURATION) {
                this.flapsProgress = FLAPS_ANIM_DURATION;
                this.flapsProgressUnit = 1.0;
                this.flapsState = AircraftDeviceState.EXTENDED;
            }
        } else if (this.flapsState === AircraftDeviceState.RETRACTING) {
            this.flapsProgress -= delta;
            if (this.flapsProgress <= 0) {
                this.flapsProgress = 0;
                this.flapsProgressUnit = 0;
                this.flapsState = AircraftDeviceState.RETRACTED;
            }
        }
        if (this.flapsState === AircraftDeviceState.EXTENDING || this.flapsState === AircraftDeviceState.RETRACTING) {
            this.flapsProgressUnit = this.flapsProgress / FLAPS_ANIM_DURATION;
        }
    }

    private updateLandingGear(delta: number) {
        if (this.landingGearState === AircraftDeviceState.EXTENDING || this.landingGearState === AircraftDeviceState.RETRACTING) {
            this.modelLandingGear?.update(delta);
        }
        if (this.landingGearState === AircraftDeviceState.EXTENDING) {
            this.landingGearProgress += delta;
            if (this.landingGearProgress >= LANDING_GEAR_ANIM_DURATION) {
                this.landingGearProgress = LANDING_GEAR_ANIM_DURATION;
                this.landingGearState = AircraftDeviceState.EXTENDED;
            }
        } else if (this.landingGearState === AircraftDeviceState.RETRACTING) {
            this.landingGearProgress -= delta;
            if (this.landingGearProgress <= 0) {
                this.landingGearProgress = 0;
                this.landingGearState = AircraftDeviceState.RETRACTED;
            }
        }
    }

    private updateAudio() {
        const engineAudio = this._exteriorView ? this.outEngineAudio : this.inEngineAudio;

        if (this.isCrashed) {
            if (this.enginePlaying === true) {
                engineAudio.stop();
                this.enginePlaying = false;
            }
            return;
        }

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
    }

    setFlightModel(flightModel: FlightModel) {
        flightModel.reset();
        flightModel.setCrashed(this.flightModel.isCrashed());
        flightModel.setLanded(this.flightModel.isLanded());
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

    get isCrashed(): boolean {
        return this.flightModel.isCrashed();
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {

        if (!this.isCrashed) {
            this.shadowPosition.copy(this.position).setY(0);
            this.shadowQuaternion.setFromUnitVectors(FORWARD, this.obj.getWorldDirection(this._v).setY(0).normalize());
            const shadowLength = Math.max(0.2, this._v.copy(FORWARD).applyQuaternion(this.quaternion).setY(0).length());
            const shadowWidth = Math.max(0.2, this._v.copy(RIGHT).applyQuaternion(this.quaternion).setY(0).length());
            this.shadowScale.set(shadowWidth, 1, shadowLength);
            this.modelShadow.addToRenderList(
                this.shadowPosition, this.shadowQuaternion, this.shadowScale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);
        }

        if (this._exteriorView) {
            const lod = getLodLevel(this.position, this.obj.scale, targetWidth, camera, this.modelBody.model.maxSize);

            this.modelBody.addToRenderList(
                this.position, this.quaternion, this.obj.scale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, lod);

            if (lod === 0) {
                if (this.landingGearState !== AircraftDeviceState.RETRACTED) {
                    this.modelLandingGear?.addToRenderList(
                        this.position, this.quaternion, this.obj.scale,
                        targetWidth, camera, palette,
                        SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
                }

                for (let i = 0; i < this.controlSurfaceDescriptors.length; i++) {
                    const d = this.controlSurfaceDescriptors[i];

                    this._q.setFromAxisAngle(this._v.copy(d.axis).applyQuaternion(this.quaternion), this.isCrashed ? 0 : d.value() * d.range).multiply(this.quaternion);
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

    get landingGear(): AircraftDeviceState {
        return this.landingGearState;
    }

    get flaps(): AircraftDeviceState {
        return this.flapsState;
    }

    private setupInput() {
        document.addEventListener('keypress', (event: KeyboardEvent) => {
            if (!this.isCrashed) {
                switch (event.key) {
                    case 't': {
                        this.pickTarget();
                        break;
                    }
                    case 'i': {
                        this._nightVision = !this._nightVision;
                        break;
                    }
                    case 'h': {
                        this.hudFocus += 1;
                        this.hudFocus %= HUDFocusMode._LENGTH;
                        break;
                    }
                    case 'f': {
                        this.toggleFlaps();
                        break;
                    }
                    case 'g': {
                        this.toggleLandingGear();
                        break;
                    }
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

    private toggleFlaps() {
        if (this.flapsState === AircraftDeviceState.EXTENDED || this.flapsState === AircraftDeviceState.EXTENDING) {
            this.flapsState = AircraftDeviceState.RETRACTING;
        } else {
            this.flapsState = AircraftDeviceState.EXTENDING;
        }
    }

    private toggleLandingGear() {
        if (this.landingGearState === AircraftDeviceState.EXTENDED || this.landingGearState === AircraftDeviceState.EXTENDING) {
            if (!this.isLanded) {
                if (this.landingGearState === AircraftDeviceState.EXTENDED) {
                    this.modelLandingGear?.setPlaybackPosition(1.0);
                }
                this.landingGearState = AircraftDeviceState.RETRACTING;
                this.modelLandingGear?.playBackwards();
            }
        } else {
            if (this.landingGearState === AircraftDeviceState.RETRACTED) {
                this.modelLandingGear?.setPlaybackPosition(0.0);
            }
            this.landingGearState = AircraftDeviceState.EXTENDING;
            this.modelLandingGear?.play();
        }
    }
}
