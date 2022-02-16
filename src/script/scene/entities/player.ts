import * as THREE from 'three';
import { COCKPIT_HEIGHT, MAX_ALTITUDE, MAX_SPEED, PITCH_RATE, ROLL_RATE, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, THROTTLE_RATE, YAW_RATE } from '../../defs';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { Entity, ENTITY_TAGS } from "../entity";
import { Palette } from "../palettes/palette";
import { Scene, UP } from "../scene";
import { GroundTargetEntity } from './groundTarget';


enum Stick {
    IDLE,
    POSITIVE,
    NEGATIVE
};

export class PlayerEntity implements Entity {

    private scene: Scene | undefined;

    private pitchState: Stick = Stick.IDLE;
    private rollState: Stick = Stick.IDLE;
    private yawState: Stick = Stick.IDLE;

    private obj = new THREE.Object3D();

    private throttleState: Stick = Stick.IDLE;
    private throttle: number = 0; // [0, 1]

    private speed: number = 0;

    private target: GroundTargetEntity | undefined;
    private targetIndex: number | undefined

    readonly tags: string[] = [];

    // Bearing increases CCW, radians
    constructor(private camera: THREE.Camera, position: THREE.Vector3, bearing: number) {
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
        const forward = this.obj.getWorldDirection(new THREE.Vector3());
        if (-0.99 < forward.y && forward.y < 0.99) {
            const prjForward = forward.clone().setY(0);
            const up = (new THREE.Vector3(0, 1, 0)).applyQuaternion(this.obj.quaternion);
            const prjUp = up.clone().projectOnPlane(prjForward).setY(0);
            const sign = (prjForward.x * prjUp.z - prjForward.z * prjUp.x) > 0 ? 1 : -1;
            this.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), sign * prjUp.length() * prjUp.length() * prjForward.length() * 2.0 * YAW_RATE * delta);
        }

        // Throttle
        if (this.throttleState !== Stick.IDLE) {
            this.throttle = Math.min(1.0, Math.max(0, this.throttle + delta * 0.01 * (this.throttleState === Stick.POSITIVE ? THROTTLE_RATE : - THROTTLE_RATE)));
        }

        // Movement
        this.obj.translateZ(-MAX_SPEED * this.throttle * delta);

        // Avoid ground crashes
        if (this.obj.position.y < 0) {
            this.obj.position.y = 0;
            const d = this.obj.getWorldDirection(new THREE.Vector3());
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

        this.camera.position.copy(this.obj.position).addScaledVector(UP, COCKPIT_HEIGHT);
        this.camera.quaternion.copy(this.obj.quaternion);

        this.speed = this.throttle * MAX_SPEED;
    }

    render(targetWidth: number, targetHeight: number, camera: THREE.Camera, layers: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        //
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
        index = (index + 1) % (this.scene?.countByTag(ENTITY_TAGS.TARGET) || 0);
        this.target = this.scene?.entityAtByTag(ENTITY_TAGS.TARGET, index) as GroundTargetEntity | undefined;
        this.targetIndex = this.target !== undefined ? index : undefined;
    }
}
