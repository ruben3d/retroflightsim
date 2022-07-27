import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { FogColorCategory, FogValueCategory, Palette, PaletteCategory, PaletteColor, PaletteColorShade, PALETTE_FX_PREFIX } from "../../config/palettes/palette";
import { FlatVertProgram, HighpFlatVertProgram } from './shaders/flatVP';
import { DepthFragProgram } from './shaders/depthFP';
import { PointVertProgram } from './shaders/pointVP';
import { ShadedVertProgram } from './shaders/shadedVP';
import { ConstantFragProgram } from './shaders/constantFP';
import { KernelTask } from '../../core/kernel';
import { LineVertProgram } from './shaders/lineVP';
import { DisplayShading, FogQuality } from '../../config/profiles/profile';


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
    halfWidth: { value: number; };
    halfHeight: { value: number; };
    vCameraPos: { value: THREE.Vector3; };
    vCameraNormal: { value: THREE.Vector3; };
    vCameraD: { value: number; };
    color: { value: THREE.Color; };
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
    line: boolean;
    point: boolean;
    fog: FogQuality;
}

export interface SceneFlatMaterialData {
    shaded: false;
    highp: boolean;
}

export interface SceneShadedMaterialData {
    shaded: true;
    shading: DisplayShading;
}

export class SceneMaterialManager implements KernelTask {

    private readonly flatProto: THREE.ShaderMaterial;
    private readonly highpFlatProto: THREE.ShaderMaterial;
    private readonly lineProto: THREE.ShaderMaterial;
    private readonly shadedProto: THREE.ShaderMaterial;
    private readonly pointProto: THREE.ShaderMaterial;
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
        const color = bit ? PaletteColor(this.palette, PaletteCategory.FX_FIRE) : PaletteColor(this.palette, PaletteCategory.FX_FIRE__B);
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
            shading: this.shading,
            category: properties.category,
            depthWrite: properties.depthWrite,
            line: properties.line || false,
            point: this.isPoint(properties),
            highp: properties.highp || false,
            fog: this.fog
        };
    }

    private buildUniforms(properties: SceneMaterialProperties): SceneMaterialUniforms {
        return {
            ...{
                halfWidth: { value: 0 },
                halfHeight: { value: 0 },
                color: { value: new THREE.Color(PaletteColor(this.palette, properties.category)) },
                colorSecondary: { value: new THREE.Color(PaletteColorShade(this.palette, properties.category)) },
                fogType: { value: this.fog },
                fogDensity: { value: this.palette.values[FogValueCategory(properties.category)] },
                fogColor: { value: new THREE.Color(PaletteColor(this.palette, FogColorCategory(properties.category))) }
            },
            ...properties.shaded ? {
                shadingType: { value: this.shading },
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
            u.color.value.setStyle(PaletteColor(palette, c));
            u.colorSecondary.value.setStyle(PaletteColorShade(palette, c));
            u.fogDensity.value = palette.values[FogValueCategory(c)];
            u.fogColor.value.setStyle(PaletteColor(palette, FogColorCategory(c)));
        });
    }

    // This shouldn't be handled by the material system
    setFog(fog: FogQuality) {
        this.fog = fog;

        this.materials.forEach(m => {
            const d = m.userData as SceneMaterialData;
            d.fog = this.fog;
            const u = m.uniforms as SceneMaterialUniforms;
            u.fogType.value = this.fog;
        });
    }

    // This shouldn't be handled by the material system
    setShadingType(shadingType: DisplayShading) {
        this.shading = shadingType;

        this.materials.forEach(m => {
            const d = m.userData as SceneMaterialData;
            if (d.shaded) {
                d.shading = shadingType;
                const u = m.uniforms as SceneMaterialUniforms;
                u.shadingType.value = shadingType;
            }
        });
    }
}
