import * as THREE from 'three';
import { MAX_ALTITUDE, MAX_SPEED, PITCH_RATE, PLANE_DISTANCE_TO_GROUND, ROLL_RATE, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, THROTTLE_RATE, YAW_RATE } from '../../defs';
import { DEFAULT_LOD_BIAS, LODHelper } from '../../render/helpers';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { Entity, ENTITY_TAGS } from "../entity";
import { Model } from '../models/models';
import { Palette } from "../palettes/palette";
import { FORWARD, RIGHT, Scene, SceneLayers, UP } from "../scene";
import { GroundTargetEntity } from './groundTarget';


enum Stick {
    IDLE,
    POSITIVE,
    NEGATIVE
};

export class PlayerEntity implements Entity {

    private scene: Scene | undefined;
    private lodHelper: LODHelper;
    private lodHelperShadow: LODHelper;
    private shadowPosition = new THREE.Vector3();
    private shadowQuaternion = new THREE.Quaternion();
    private shadowScale = new THREE.Vector3();

    private pitchState: Stick = Stick.IDLE;
    private rollState: Stick = Stick.IDLE;
    private yawState: Stick = Stick.IDLE;

    private obj = new THREE.Object3D();

    private throttleState: Stick = Stick.IDLE;
    private throttle: number = 0; // [0, 1]

    private speed: number = 0;

    private target: GroundTargetEntity | undefined;
    private targetIndex: number | undefined

    private _v = new THREE.Vector3();
    private _w = new THREE.Vector3();

    readonly tags: string[] = [];

    enabled: boolean = true;
    exteriorView: boolean = false;

    // Bearing increases CCW, radians
    constructor(model: Model, shadow: Model, position: THREE.Vector3, bearing: number) {
        this.lodHelper = new LODHelper(model, DEFAULT_LOD_BIAS);
        this.lodHelperShadow = new LODHelper(shadow, DEFAULT_LOD_BIAS);
        this.obj.position.copy(position);
        this.obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), bearing);
    }

    init(scene: Scene): void {
        this.scene = scene;
        this.setupInput();
    }

    update(delta: number): void {
        // Roll control
        if (this.rollState === Stick.POSITIVE) {
            this.obj.rotateZ(ROLL_RATE * delta);
        } else if (this.rollState === Stick.NEGATIVE) {
            this.obj.rotateZ(-ROLL_RATE * delta);
        }

        // Pitch control
        if (this.pitchState === Stick.POSITIVE) {
            this.obj.rotateX(PITCH_RATE * delta);
        } else if (this.pitchState === Stick.NEGATIVE) {
            this.obj.rotateX(-PITCH_RATE * delta);
        }

        // Yaw control
        if (this.yawState === Stick.POSITIVE) {
            this.obj.rotateY(YAW_RATE * delta);
        } else if (this.yawState === Stick.NEGATIVE) {
            this.obj.rotateY(-YAW_RATE * delta);
        }

        // Automatic yaw when rolling
        const forward = this.obj.getWorldDirection(this._v);
        if (-0.99 < forward.y && forward.y < 0.99) {
            const prjForward = forward.setY(0);
            const up = this._w.copy(UP).applyQuaternion(this.obj.quaternion);
            const prjUp = up.projectOnPlane(prjForward).setY(0);
            const sign = (prjForward.x * prjUp.z - prjForward.z * prjUp.x) > 0 ? 1 : -1;
            this.obj.rotateOnWorldAxis(UP, sign * prjUp.length() * prjUp.length() * prjForward.length() * 2.0 * YAW_RATE * delta);
        }

        // Throttle
        if (this.throttleState !== Stick.IDLE) {
            this.throttle = Math.min(1.0, Math.max(0, this.throttle + delta * 0.01 * (this.throttleState === Stick.POSITIVE ? THROTTLE_RATE : - THROTTLE_RATE)));
        }

        // Movement
        this.obj.translateZ(-MAX_SPEED * this.throttle * delta);

        // Avoid ground crashes
        if (this.obj.position.y < PLANE_DISTANCE_TO_GROUND) {
            this.obj.position.y = PLANE_DISTANCE_TO_GROUND;
            const d = this.obj.getWorldDirection(this._v);
            d.setY(0).add(this.obj.position);
            this.obj.lookAt(d);
        }

        // Avoid flying too high
        if (this.obj.position.y > MAX_ALTITUDE) {
            this.obj.position.y = MAX_ALTITUDE;
        }

        // Avoid flying out of bounds, wraps around
        const terrainHalfSize = 2.5 * TERRAIN_SCALE * TERRAIN_MODEL_SIZE;
        if (this.obj.position.x > terrainHalfSize) this.obj.position.x = -terrainHalfSize;
        if (this.obj.position.x < -terrainHalfSize) this.obj.position.x = terrainHalfSize;
        if (this.obj.position.z > terrainHalfSize) this.obj.position.z = -terrainHalfSize;
        if (this.obj.position.z < -terrainHalfSize) this.obj.position.z = terrainHalfSize;

        this.speed = this.throttle * MAX_SPEED;
    }

    render(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {

        this.shadowPosition.copy(this.position).setY(0);
        this.shadowQuaternion.setFromUnitVectors(FORWARD, this.obj.getWorldDirection(this._v).setY(0).normalize().multiplyScalar(-1));
        const shadowLength = Math.max(0.2, this._v.copy(FORWARD).applyQuaternion(this.quaternion).setY(0).length());
        const shadowWidth = Math.max(0.2, this._v.copy(RIGHT).applyQuaternion(this.quaternion).setY(0).length());
        this.shadowScale.set(shadowWidth, 1, shadowLength);
        this.lodHelperShadow.addToRenderList(
            this.shadowPosition, this.shadowQuaternion, this.shadowScale,
            targetWidth, camera, palette,
            SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);

        if (this.exteriorView) {
            this.lodHelper.addToRenderList(
                this.position, this.quaternion, this.obj.scale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);
        }
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

    get throttleUnit(): number {
        return this.throttle;
    }

    get rawSpeed(): number {
        return this.speed;
    }

    get weaponsTarget(): GroundTargetEntity | undefined {
        return this.target;
    }

    private setupInput() {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            switch (event.key) {
                case 'w': {
                    this.pitchState = Stick.NEGATIVE;
                    break;
                }
                case 's': {
                    this.pitchState = Stick.POSITIVE;
                    break;
                }
                case 'a': {
                    this.rollState = Stick.POSITIVE;
                    break;
                }
                case 'd': {
                    this.rollState = Stick.NEGATIVE;
                    break;
                }
                case 'q': {
                    this.yawState = Stick.POSITIVE;
                    break;
                }
                case 'e': {
                    this.yawState = Stick.NEGATIVE;
                    break;
                }
                case 'z': {
                    this.throttleState = Stick.POSITIVE;
                    break;
                }
                case 'x': {
                    this.throttleState = Stick.NEGATIVE;
                    break;
                }
            }
        });

        document.addEventListener('keyup', (event: KeyboardEvent) => {
            switch (event.key) {
                case 'w': {
                    if (this.pitchState === Stick.NEGATIVE) {
                        this.pitchState = Stick.IDLE;
                    }
                    break;
                }
                case 's': {
                    if (this.pitchState === Stick.POSITIVE) {
                        this.pitchState = Stick.IDLE;
                    }
                    break;
                }
                case 'a': {
                    if (this.rollState === Stick.POSITIVE) {
                        this.rollState = Stick.IDLE;
                    }
                    break;
                }
                case 'd': {
                    if (this.rollState === Stick.NEGATIVE) {
                        this.rollState = Stick.IDLE;
                    }
                    break;
                }
                case 'q': {
                    if (this.yawState === Stick.POSITIVE) {
                        this.yawState = Stick.IDLE;
                    }
                    break;
                }
                case 'e': {
                    if (this.yawState === Stick.NEGATIVE) {
                        this.yawState = Stick.IDLE;
                    }
                    break;
                }
                case 'z': {
                    if (this.throttleState === Stick.POSITIVE) {
                        this.throttleState = Stick.IDLE;
                    }
                    break;
                }
                case 'x': {
                    if (this.throttleState === Stick.NEGATIVE) {
                        this.throttleState = Stick.IDLE;
                    }
                    break;
                }
            }
        });

        document.addEventListener('keypress', (event: KeyboardEvent) => {
            switch (event.key) {
                case 't': {
                    this.pickTarget();
                    break;
                }
            }
        });

        document.addEventListener('blur', () => {
            this.pitchState = Stick.IDLE;
            this.rollState = Stick.IDLE;
            this.yawState = Stick.IDLE;
            this.throttleState = Stick.IDLE;
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
