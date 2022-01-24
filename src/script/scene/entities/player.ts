import * as THREE from 'three';
import { MAX_HEIGHT, MIN_HEIGHT, PITCH_RATE, ROLL_RATE, SPEED, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, YAW_RATE } from '../../defs';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { Entity } from "../entity";
import { Palette } from "../palettes/palette";
import { Scene } from "../scene";


enum Stick {
    IDLE,
    POSITIVE,
    NEGATIVE
};

export class PlayerEntity implements Entity {

    private pitchState: Stick = Stick.IDLE;
    private rollState: Stick = Stick.IDLE;
    private yawState: Stick = Stick.IDLE;

    private obj = new THREE.Object3D();

    // Bearing increases CCW, radians
    constructor(private camera: THREE.Camera, position: THREE.Vector3, bearing: number) {
        this.obj.position.copy(position);
        this.obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), bearing);
        this.setupInput();
    }

    init(scene: Scene): void {
        //
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

        // Movement
        this.obj.translateZ(-SPEED * delta);

        // Avoid ground crashes
        if (this.obj.position.y < MIN_HEIGHT) {
            this.obj.position.y = MIN_HEIGHT;
            const d = this.obj.getWorldDirection(new THREE.Vector3());
            d.setY(0).add(this.obj.position);
            this.obj.lookAt(d);
        }

        // Avoid flying too high
        if (this.obj.position.y > MAX_HEIGHT) {
            this.obj.position.y = MAX_HEIGHT;
        }

        // Avoid flying out of bounds, wraps around
        const modelHalfSize = TERRAIN_MODEL_SIZE * 0.5 * TERRAIN_SCALE;
        if (this.obj.position.x > modelHalfSize) this.obj.position.x = -modelHalfSize;
        if (this.obj.position.x < -modelHalfSize) this.obj.position.x = modelHalfSize;
        if (this.obj.position.z > modelHalfSize) this.obj.position.z = -modelHalfSize;
        if (this.obj.position.z < -modelHalfSize) this.obj.position.z = modelHalfSize;

        this.camera.position.copy(this.obj.position);
        this.camera.quaternion.copy(this.obj.quaternion);
    }

    render(painter: CanvasPainter, palette: Palette): void {
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
            }
        });

        document.addEventListener('blur', () => {
            this.pitchState = Stick.IDLE;
            this.rollState = Stick.IDLE;
            this.yawState = Stick.IDLE;
        });
    }
}
