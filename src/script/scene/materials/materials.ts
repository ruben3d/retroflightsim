import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { FogColorCategory, FogValueCategory, Palette, PaletteCategory, PALETTE_FX_PREFIX } from "../palettes/palette";
import { FlatVertProgram, HighpFlatVertProgram } from './shaders/flatVP';
import { DepthFragProgram } from './shaders/depthFP';
import { PointVertProgram } from './shaders/pointVP';
import { ShadedVertProgram } from './shaders/shadedVP';
import { ConstantFragProgram } from './shaders/constantFP';
import { KernelTask } from '../../core/kernel';
import { LineVertProgram } from './shaders/lineVP';


export interface SceneMaterialProperties {
    category: PaletteCategory;
    shaded: boolean;
    depthWrite: boolean;
    line?: boolean;
    point?: boolean;
    highp?: boolean; // Flat only (not shaded)
}

export type SceneMaterialUniforms = SceneFlatMaterialUniforms | SceneShadedMaterialUniforms;

export interface SceneFlatMaterialUniforms {
    vCameraNormal: { value: THREE.Vector3; };
    vCameraD: { value: number; };
    color: { value: THREE.Color; };
    fogDensity: { value: number; };
    fogColor: { value: THREE.Color; };
    [uniform: string]: THREE.IUniform<any>;
}

export interface SceneShadedMaterialUniforms {
    distance: { value: number; };
    color: { value: THREE.Color; };
    fogDensity: { value: number; };
    fogColor: { value: THREE.Color; };
    normalModelMatrix: { value: THREE.Matrix3; };
    [uniform: string]: THREE.IUniform<any>;
}

export type SceneMaterialData = SceneCommonMaterialData & (SceneFlatMaterialData | SceneShadedMaterialData);

export interface SceneCommonMaterialData {
    category: PaletteCategory;
    depthWrite: boolean;
    line: boolean;
    point: boolean;
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
    private palette: Palette;
    private materials: THREE.ShaderMaterial[] = [];
    private fxFire: THREE.ShaderMaterial[] = [];
    private elapsed = 0; // seconds

    constructor(palette: Palette) {
        this.palette = palette;

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
    }

    build(properties: SceneMaterialProperties): THREE.Material {
        const p = this.sanitiseProperties(properties);
        const data = this.buildData(p);
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
        const color = bit ? this.palette.colors.FX_FIRE : this.palette.colors.FX_FIRE__B;
        for (let i = 0; i < this.fxFire.length; i++) {
            const u = this.fxFire[i].uniforms as SceneMaterialUniforms;
            u.color.value.setStyle(color);
        }
    }

    private sanitiseProperties(properties: SceneMaterialProperties): SceneMaterialProperties {
        const p = { ...properties };
        if (this.isPoint(p) || this.isFx(p)) {
            p.shaded = false;
            p.highp = false;
        }
        if (p.shaded) {
            p.line = false;
            p.highp = false;
        }
        return p;
    }

    private buildData(properties: SceneMaterialProperties): SceneMaterialData {
        return {
            shaded: properties.shaded,
            category: properties.category,
            depthWrite: properties.depthWrite,
            line: properties.line || false,
            point: this.isPoint(properties),
            highp: properties.highp || false
        };
    }

    private buildUniforms(properties: SceneMaterialProperties): SceneMaterialUniforms {
        return {
            ...{
                color: { value: new THREE.Color(this.palette.colors[properties.category]) },
                fogDensity: { value: this.palette.values[FogValueCategory(properties.category)] },
                fogColor: { value: new THREE.Color(this.palette.colors[FogColorCategory(properties.category)]) }
            },
            ...properties.shaded ? {
                distance: { value: 0 },
                normalModelMatrix: { value: new THREE.Matrix3() }
            } : {
                vCameraNormal: { value: new THREE.Vector3() },
                vCameraD: { value: 0 }
            }
        };
    }

    private isPoint(properties: SceneMaterialProperties): boolean {
        return properties.point ||
            (properties.point === undefined &&
                (properties.category === PaletteCategory.SCENERY_SPECKLE ||
                    properties.category === PaletteCategory.LIGHT_RED ||
                    properties.category === PaletteCategory.LIGHT_GREEN ||
                    properties.category === PaletteCategory.LIGHT_YELLOW));
    }

    private isFx(properties: SceneMaterialProperties): boolean {
        return properties.category.startsWith(PALETTE_FX_PREFIX);
    }

    private cloneMaterial(properties: SceneMaterialProperties): ShaderMaterial {
        if (this.isPoint(properties)) {
            return this.pointProto.clone();
        } else if (properties.shaded) {
            return this.shadedProto.clone();
        } else if (properties.line) {
            return this.lineProto.clone();
        } else if (properties.highp) {
            return this.highpFlatProto.clone();
        } else {
            return this.flatProto.clone();
        }
    }

    setPalette(palette: Palette) {
        this.palette = palette;

        this.materials.forEach(m => {
            const d = m.userData as SceneMaterialData;
            const u = m.uniforms as SceneMaterialUniforms;
            const c = d.category;
            u.color.value.setStyle(palette.colors[c]);
            u.fogDensity.value = palette.values[FogValueCategory(c)];
            u.fogColor.value.setStyle(palette.colors[FogColorCategory(c)]);
        });
    }
}
