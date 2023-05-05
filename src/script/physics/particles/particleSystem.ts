import * as THREE from 'three';
import { lerp } from '../../utils/math';


export interface Particle {
    isActive: boolean;
    life: number;
    lifespan: number;
    spawns: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    sizeStart: number;
    sizeEnd: number;
    rotationStart: number;
    rotationEnd: number;
}

export interface ParticleForce {
    apply(delta: number, particle: Particle): Particle;
}

export interface ParticleEmitter {
    emit(source: THREE.Object3D, particle: Particle): Particle;
}

export interface ParticleSystemConfiguration {
    systemMaxParticles: number;
    systemReSpawn: boolean;
    emitterSpawnRatePerSecond: number;
    particleLifeMin: number;
    particleLifeMax: number;
    particleSizeStartMin: number;
    particleSizeStartMax: number;
    particleSizeEndMin: number;
    particleSizeEndMax: number;
    particleRotationStartMin: number;
    particleRotationStartMax: number;
    particleRotationEndMin: number;
    particleRotationEndMax: number;
}

export class ParticleSystem {

    private obj: THREE.Object3D = new THREE.Object3D();

    public particles: Particle[];
    private forces: ParticleForce[] = [];

    private spawning: boolean = true;
    private aliveCount: number = 0;

    private aabb: THREE.Box3 = new THREE.Box3();

    constructor(private config: ParticleSystemConfiguration, private emitter: ParticleEmitter) {
        this.particles = this.initParticles(config.systemMaxParticles);
    }

    private initParticles(maxParticles: number): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < maxParticles; i++) {
            particles.push({
                isActive: false,
                life: 0,
                lifespan: 0,
                spawns: 0,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                sizeStart: 0,
                sizeEnd: 0,
                rotationStart: 0,
                rotationEnd: 0,
            });
        }
        return particles;
    }

    reset() {
        this.aliveCount = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            particle.isActive = false;
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

    get boundingBox() {
        return this.aabb;
    }

    update(delta: number) {
        if (this.aliveCount < this.config.systemMaxParticles && this.spawning) {
            const particlesToSpawn = this.computeParticleCountForSpawn(delta);
            this.spawnParticles(particlesToSpawn);
        }
        this.updateParticles(delta);
    }

    private computeParticleCountForSpawn(delta: number): number {
        const particlesPerDelta = delta * this.config.emitterSpawnRatePerSecond;
        const base = Math.floor(particlesPerDelta);
        const fract = particlesPerDelta - base;
        const heuristic = Math.random() < fract ? 1 : 0;
        return base + heuristic;
    }

    private spawnParticles(particlesToSpawn: number) {
        let spawned = 0;

        for (let i = 0; i < this.config.systemMaxParticles && spawned < particlesToSpawn && this.aliveCount < this.config.systemMaxParticles; i++) {
            const particle = this.particles[i];
            if (this.canBeSpawned(particle)) {
                this.spawnSingleParticle(particle);
                spawned++;
            }
        }
    }

    private canBeSpawned(particle: Particle): boolean {
        return particle.isActive === false && (this.config.systemReSpawn === true || particle.spawns === 0);
    }

    private spawnSingleParticle(particle: Particle) {
        this.aliveCount++;
        particle.isActive = true;
        particle.spawns++;

        this.emitter.emit(this.obj, particle);

        particle.life = 0;
        particle.lifespan = this.randomRange(this.config.particleLifeMin, this.config.particleLifeMax);
        particle.sizeStart = this.randomRange(this.config.particleSizeStartMin, this.config.particleSizeStartMax);
        particle.sizeEnd = this.randomRange(this.config.particleSizeEndMin, this.config.particleSizeEndMax);
        particle.rotationStart = this.randomRange(this.config.particleRotationStartMin, this.config.particleRotationStartMax);
        particle.rotationEnd = this.randomRange(this.config.particleRotationEndMin, this.config.particleRotationEndMax);
    }

    private updateParticles(delta: number) {
        this.aabb.makeEmpty();
        for (let i = 0; i < this.config.systemMaxParticles; i++) {
            const particle = this.particles[i];
            if (particle.isActive) {
                this.updateParticle(delta, particle);
            }
        }
    }

    private updateParticle(delta: number, particle: Particle) {
        particle.life += delta;
        if (particle.life > particle.lifespan) {
            particle.isActive = false;
            this.aliveCount--;
        } else {
            this.applyForces(delta, particle);
            particle.position.addScaledVector(particle.velocity, delta);
            this.aabb.expandByPoint(particle.position);
        }
    }

    private applyForces(delta: number, particle: Particle) {
        for (let i = 0; i < this.forces.length; i++) {
            this.forces[i].apply(delta, particle);
        }
    }

    private randomRange(min: number, max: number): number {
        return lerp(Math.random(), min, max);
    }
}
