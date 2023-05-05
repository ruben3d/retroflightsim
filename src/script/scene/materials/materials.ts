import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { FogColorCategory, FogValueCategory, PALETTE_FX_PREFIX, Palette, PaletteCategory, PaletteColor, PaletteColorShade } from "../../config/palettes/palette";
import { DisplayShading, FogQuality } from '../../config/profiles/profile';
import { KernelTask } from '../../core/kernel';
import { assertExpr } from '../../utils/asserts';
import { ConstantFragProgram } from './shaders/constantFP';
import { DepthFragProgram } from './shaders/depthFP';
import { FlatVertProgram, HighpFlatVertProgram } from './shaders/flatVP';
import { LineVertProgram } from './shaders/lineVP';
import { ParticleMeshFragProgram } from './shaders/particlesMeshFP';
import { ParticleMeshVertProgram } from './shaders/particlesMeshVP';
import { PointVertProgram } from './shaders/pointVP';
import { ShadedVertProgram } from './shaders/shadedVP';


export enum SceneMaterialPrimitiveType {
    MESH,
    LINE,
    POINT,
    PARTICLE_MESH,
}

export type SceneMaterialProperties = SceneMaterialCommonProperties & (
    SceneMaterialMeshProperties |
    SceneMaterialLineProperties |
    SceneMaterialPointProperties |
    SceneMaterialParticleMeshProperties
);

export interface SceneMaterialCommonProperties {
    category: PaletteCategory;
    depthWrite: boolean;
}

export type SceneMaterialMeshProperties = {
    type: SceneMaterialPrimitiveType.MESH;
} & (
        {
            shaded: true;
        }
        |
        {
            shaded: false;
            highp?: boolean;
        }
    );

export interface SceneMaterialPointProperties {
    type: SceneMaterialPrimitiveType.POINT;
}

export interface SceneMaterialLineProperties {
    type: SceneMaterialPrimitiveType.LINE;
}

export interface SceneMaterialParticleMeshProperties {
    type: SceneMaterialPrimitiveType.PARTICLE_MESH;
}

export type SceneMaterialUniforms = SceneFlatMaterialUniforms | SceneShadedMaterialUniforms;

export interface SceneFlatMaterialUniforms {
    halfWidth: { value: number; };
    halfHeight: { value: number; };
    vCameraPos: { value: THREE.Vector3; };
    vCameraNormal: { value: THREE.Vector3; };
    vCameraD: { value: number; };
    shadingType: { value: number; };
    color: { value: THREE.Color; };
    colorSecondary: { value: THREE.Color; };
    fogDensity: { value: number; };
    fogColor: { value: THREE.Color; };
    fogType: { value: number; };
    [uniform: string]: THREE.IUniform<any>;
}

export interface SceneShadedMaterialUniforms {
    halfWidth: { value: number; };
    halfHeight: { value: number; };
    distance: { value: number; };
    shadingType: { value: number; };
    color: { value: THREE.Color; };
    colorSecondary: { value: THREE.Color; };
    fogDensity: { value: number; };
    fogColor: { value: THREE.Color; };
    normalModelMatrix: { value: THREE.Matrix3; };
    [uniform: string]: THREE.IUniform<any>;
}

export type SceneMaterialData = SceneCommonMaterialData & (SceneFlatMaterialData | SceneShadedMaterialData);

export interface SceneCommonMaterialData {
    category: PaletteCategory;
    depthWrite: boolean;
    particles: boolean;
    line: boolean;
    point: boolean;
    fog: FogQuality;
    shading: DisplayShading;
    ramp?: THREE.Color[]; // Particle materials only
}

export interface SceneFlatMaterialData {
    shaded: false;
    highp: boolean;
}

export interface SceneShadedMaterialData {
    shaded: true;
}

export class SceneMaterialManager implements KernelTask {

    private readonly flatProto: THREE.ShaderMaterial;
    private readonly highpFlatProto: THREE.ShaderMaterial;
    private readonly lineProto: THREE.ShaderMaterial;
    private readonly shadedProto: THREE.ShaderMaterial;
    private readonly pointProto: THREE.ShaderMaterial;
    private readonly particleMeshProto: THREE.ShaderMaterial;
    private readonly colorCache: ColorCache = new ColorCache();
    private palette: Palette;
    private fog: FogQuality;
    private shading: DisplayShading;
    private materials: THREE.ShaderMaterial[] = [];
    private fxFire: THREE.ShaderMaterial[] = [];
    private elapsed = 0; // seconds

    constructor(palette: Palette, fog: FogQuality, shading: DisplayShading) {
        this.palette = palette;
        this.fog = fog;
        this.shading = shading;

        this.flatProto = new THREE.ShaderMaterial({
            vertexShader: FlatVertProgram,
            fragmentShader: DepthFragProgram,
            side: THREE.FrontSide,
            depthWrite: false,
            userData: {},
            uniforms: {}
        });
        this.highpFlatProto = new THREE.ShaderMaterial({
            vertexShader: HighpFlatVertProgram,
            fragmentShader: DepthFragProgram,
            side: THREE.FrontSide,
            depthWrite: false,
            userData: {},
            uniforms: {}
        });
        this.lineProto = new THREE.ShaderMaterial({
            vertexShader: LineVertProgram,
            fragmentShader: DepthFragProgram,
            side: THREE.FrontSide,
            depthWrite: true,
            userData: {},
            uniforms: {}
        });
        this.shadedProto = new THREE.ShaderMaterial({
            vertexShader: ShadedVertProgram,
            fragmentShader: ConstantFragProgram,
            side: THREE.FrontSide,
            depthWrite: true,
            userData: {},
            uniforms: {}
        });
        this.pointProto = new THREE.ShaderMaterial({
            vertexShader: PointVertProgram,
            fragmentShader: DepthFragProgram,
            depthWrite: true,
            userData: {},
            uniforms: {}
        });
        this.particleMeshProto = new THREE.RawShaderMaterial({
            vertexShader: ParticleMeshVertProgram,
            fragmentShader: ParticleMeshFragProgram,
            side: THREE.FrontSide,
            depthWrite: true,
            userData: {},
            uniforms: {}
        });
    }

    build(properties: SceneMaterialProperties): THREE.Material {
        const p = this.sanitiseProperties(properties);
        const data = this.buildData(p, this.palette);
        const material = this.cloneMaterial(p);
        material.depthWrite = p.depthWrite;
        material.userData = data;
        material.uniforms = this.buildUniforms(p);
        this.materials.push(material);
        if (data.category === PaletteCategory.FX_FIRE) {
            this.fxFire.push(material);
        }
        return material;
    }

    update(delta: number) {
        this.elapsed += delta;
        this.updateFxFire(this.elapsed);
    }

    private updateFxFire(elapsed: number) {
        const bit = Math.floor(elapsed * 100) % 2 === 0;
        const color = bit ? PaletteColor(this.palette, PaletteCategory.FX_FIRE) : PaletteColor(this.palette, PaletteCategory.FX_FIRE__B);
        for (let i = 0; i < this.fxFire.length; i++) {
            const u = this.fxFire[i].uniforms as SceneMaterialUniforms;
            u.color.value.copy(this.colorCache.getColor(color));
        }
    }

    private sanitiseProperties(properties: SceneMaterialProperties): SceneMaterialProperties {
        if (this.isFx(properties)) {
            return {
                ...properties,
                shaded: false,
                highp: undefined
            }
        }
        return { ...properties };
    }

    private buildData(properties: SceneMaterialProperties, palette: Palette): SceneMaterialData {
        return {
            shaded: properties.type === SceneMaterialPrimitiveType.MESH && properties.shaded,
            shading: this.shading,
            category: properties.category,
            depthWrite: properties.depthWrite,
            particles: properties.type === SceneMaterialPrimitiveType.PARTICLE_MESH,
            line: properties.type === SceneMaterialPrimitiveType.LINE,
            point: this.isPoint(properties),
            highp: properties.type === SceneMaterialPrimitiveType.MESH && !properties.shaded && properties.highp || false,
            fog: this.fog,
            ramp: (properties.type === SceneMaterialPrimitiveType.PARTICLE_MESH && properties.category === PaletteCategory.FX_SMOKE) ? [
                this.colorCache.getColor(PaletteColor(palette, PaletteCategory.FX_SMOKE)).clone(),
                this.colorCache.getColor(PaletteColor(palette, PaletteCategory.FX_SMOKE__B)).clone(),
                this.colorCache.getColor(PaletteColor(palette, PaletteCategory.FX_SMOKE__C)).clone(),
            ] : undefined,
        };
    }

    private buildUniforms(properties: SceneMaterialProperties): SceneMaterialUniforms {
        return {
            ...{
                halfWidth: { value: 0 },
                halfHeight: { value: 0 },
                shadingType: { value: this.shading },
                color: { value: new THREE.Color(PaletteColor(this.palette, properties.category)) },
                colorSecondary: { value: new THREE.Color(PaletteColorShade(this.palette, properties.category)) },
                fogType: { value: this.fog },
                fogDensity: { value: this.palette.values[FogValueCategory(properties.category)] },
                fogColor: { value: new THREE.Color(PaletteColor(this.palette, FogColorCategory(properties.category))) }
            },
            ...(properties.type === SceneMaterialPrimitiveType.MESH && properties.shaded) ? {
                distance: { value: 0 },
                normalModelMatrix: { value: new THREE.Matrix3() }
            } : {
                vCameraPos: { value: new THREE.Vector3() },
                vCameraNormal: { value: new THREE.Vector3() },
                vCameraD: { value: 0 }
            }
        };
    }

    private isPoint(properties: SceneMaterialProperties): boolean {
        return properties.type === SceneMaterialPrimitiveType.POINT ||
            properties.category === PaletteCategory.SCENERY_SPECKLE ||
            properties.category === PaletteCategory.LIGHT_RED ||
            properties.category === PaletteCategory.LIGHT_GREEN ||
            properties.category === PaletteCategory.LIGHT_YELLOW;
    }

    private isFx(properties: SceneMaterialProperties): boolean {
        return properties.category.startsWith(PALETTE_FX_PREFIX);
    }

    private cloneMaterial(properties: SceneMaterialProperties): ShaderMaterial {
        if (this.isPoint(properties)) {
            return this.pointProto.clone();
        } else if (properties.type === SceneMaterialPrimitiveType.LINE) {
            return this.lineProto.clone();
        } else if (properties.type === SceneMaterialPrimitiveType.MESH) {
            if (properties.shaded) {
                return this.shadedProto.clone();
            } else if (properties.highp) {
                return this.highpFlatProto.clone();
            } else {
                return this.flatProto.clone();
            }
        } else if (properties.type === SceneMaterialPrimitiveType.PARTICLE_MESH) {
            return this.particleMeshProto.clone();
        }
        assertExpr(false, 'This should never happen');
    }

    setPalette(palette: Palette) {
        this.palette = palette;

        for (let i = 0; i < this.materials.length; i++) {
            const m = this.materials[i];
            const d = m.userData as SceneMaterialData;
            const u = m.uniforms as SceneMaterialUniforms;
            const c = d.category;
            u.color.value.copy(this.colorCache.getColor(PaletteColor(palette, c)));
            u.colorSecondary.value.copy(this.colorCache.getColor(PaletteColorShade(palette, c)));
            u.fogDensity.value = palette.values[FogValueCategory(c)];
            u.fogColor.value.copy(this.colorCache.getColor(PaletteColor(palette, FogColorCategory(c))));
            if (d.particles && d.category === PaletteCategory.FX_SMOKE && d.ramp) {
                d.ramp[0].copy(this.colorCache.getColor(PaletteColor(palette, PaletteCategory.FX_SMOKE)));
                d.ramp[1].copy(this.colorCache.getColor(PaletteColor(palette, PaletteCategory.FX_SMOKE__B)));
                d.ramp[2].copy(this.colorCache.getColor(PaletteColor(palette, PaletteCategory.FX_SMOKE__C)));
            }
        }
        this.updateFxFire(this.elapsed);
    }

    // This shouldn't be handled by the material system
    setFog(fog: FogQuality) {
        this.fog = fog;

        for (let i = 0; i < this.materials.length; i++) {
            const m = this.materials[i];
            const d = m.userData as SceneMaterialData;
            d.fog = this.fog;
            const u = m.uniforms as SceneMaterialUniforms;
            u.fogType.value = this.fog;
        }
    }

    // This shouldn't be handled by the material system
    setShadingType(shadingType: DisplayShading) {
        this.shading = shadingType;

        for (let i = 0; i < this.materials.length; i++) {
            const m = this.materials[i];
            const d = m.userData as SceneMaterialData;
            d.shading = shadingType;
            const u = m.uniforms as SceneMaterialUniforms;
            u.shadingType.value = shadingType;
        }
    }
}

class ColorCache {
    private map: Map<string, THREE.Color> = new Map();

    constructor() { }

    getColor(css: string): THREE.Color {
        let c = this.map.get(css);
        if (!c) {
            c = new THREE.Color(css);
            this.map.set(css, c);
        }
        return c;
    }
}