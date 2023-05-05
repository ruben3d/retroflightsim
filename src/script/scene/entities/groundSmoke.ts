import * as THREE from 'three';
import { Palette } from "../../config/palettes/palette";
import { GROUND_SMOKE_PARTICLE_COUNT } from '../../defs';
import { ConeEmitter } from '../../physics/particles/emitters/coneEmitter';
import { ParticleSystem } from '../../physics/particles/particleSystem';
import { ParticleSystemHelper } from '../../render/helpers';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { RIGHT } from '../../utils/math';
import { Entity } from "../entity";
import { Model } from '../models/models';
import { Scene, SceneLayers } from "../scene";


export class GroundSmokeEntity implements Entity {

    private obj: THREE.Object3D = new THREE.Object3D();
    private system: ParticleSystem;
    private helper: ParticleSystemHelper;

    readonly tags: string[] = [];

    enabled: boolean = true;

    constructor(model: Model) {
        this.obj.quaternion.setFromAxisAngle(RIGHT, -Math.PI / 2);

        this.system = new ParticleSystem(
            {
                systemMaxParticles: GROUND_SMOKE_PARTICLE_COUNT,
                systemReSpawn: true,
                emitterSpawnRatePerSecond: 7,
                particleLifeMin: 8,
                particleLifeMax: 12,
                particleSizeStartMin: 1.5,
                particleSizeStartMax: 3,
                particleSizeEndMin: 3,
                particleSizeEndMax: 6,
                particleRotationStartMin: -Math.PI,
                particleRotationStartMax: Math.PI,
                particleRotationEndMin: -Math.PI * 3,
                particleRotationEndMax: Math.PI * 3,
            },
            new ConeEmitter(2, 4, 1, 2));

        this.helper = new ParticleSystemHelper(model);
    }

    set position(p: THREE.Vector3) {
        this.obj.position.copy(p);
    }

    get position() {
        return this.obj.position;
    }

    reset() {
        this.system.reset();
    }

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        this.system.position.copy(this.obj.position);
        this.system.quaternion.copy(this.obj.quaternion);
        this.system.update(delta);

        this.helper.updateAttributes(this.system);
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        this.helper.addToRenderList(this.obj.position, this.obj.scale, targetWidth, camera, palette, SceneLayers.EntityVolumes, lists);
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }
}