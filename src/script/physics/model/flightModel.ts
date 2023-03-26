import * as THREE from 'three';

const SIM_FPS = 120;
const SIM_DELTA = 1.0 / SIM_FPS;

export abstract class FlightModel {

    protected obj = new THREE.Object3D();
    protected velocity: THREE.Vector3 = new THREE.Vector3(); // m/s

    protected landed: boolean = true;

    protected pitch: number = 0; // [-1, 1]
    protected roll: number = 0; // [-1, 1]
    protected yaw: number = 0; // [-1, 1]
    protected throttle: number = 0; // [0, 1]

    private deltaRemainder: number = 0;

    abstract step(delta: number): void;

    update(delta: number): void {
        this.deltaRemainder += delta;
        while (this.deltaRemainder >= SIM_DELTA) {
            this.deltaRemainder -= SIM_DELTA;
            this.step(SIM_DELTA);
        }
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

    setLanded(isLanded: boolean) {
        this.landed = isLanded;
    }

    isLanded(): boolean {
        return this.landed;
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

    set velocityVector(v: THREE.Vector3) {
        this.velocity.copy(v);
    }

    get velocityVector() {
        return this.velocity;
    }

    // [-1,1] - Values >= 0 mean stall
    abstract getStallStatus(): number;
}
