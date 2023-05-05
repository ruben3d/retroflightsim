import * as THREE from 'three';
import { Particle, ParticleEmitter } from '../particleSystem';
import { FORWARD, RIGHT, UP, lerp } from '../../../utils/math';

export class ConeEmitter implements ParticleEmitter {

    private radiusSq: number;
    private diameter: number;
    private forward: THREE.Vector3 = new THREE.Vector3();
    private right: THREE.Vector3 = new THREE.Vector3();
    private up: THREE.Vector3 = new THREE.Vector3();

    constructor(private minSpeed: number, private maxSpeed: number, private radius: number, private depth: number) {
        this.diameter = radius * 2;
        this.radiusSq = radius * radius;
    }

    emit(source: THREE.Object3D<THREE.Event>, particle: Particle): Particle {
        particle.position.copy(source.position);

        this.forward.copy(FORWARD).applyQuaternion(source.quaternion);
        this.up.copy(UP).applyQuaternion(source.quaternion);
        this.right.copy(RIGHT).applyQuaternion(source.quaternion);

        let x = 0;
        let y = 0;
        do {
            x = Math.random() * this.diameter - this.radius;
            y = Math.random() * this.diameter - this.radius;
        } while (x * x + y * y > this.radiusSq);

        particle.velocity
            .setScalar(0)
            .addScaledVector(this.forward, this.depth)
            .addScaledVector(this.right, x)
            .addScaledVector(this.up, y)
            .normalize()
            .multiplyScalar(lerp(Math.random(), this.minSpeed, this.maxSpeed));

        return particle;
    }
}