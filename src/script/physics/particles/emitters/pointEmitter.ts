import * as THREE from 'three';
import { Particle, ParticleEmitter } from '../particleSystem';
import { lerp } from '../../../utils/math';

export class PointEmitter implements ParticleEmitter {

    constructor(private minSpeed: number, private maxSpeed: number) { }

    emit(source: THREE.Object3D<THREE.Event>, particle: Particle): Particle {
        particle.position.copy(source.position);
        particle.velocity
            .set(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
            )
            .normalize()
            .multiplyScalar(lerp(Math.random(), this.minSpeed, this.maxSpeed));
        return particle;
    }

}