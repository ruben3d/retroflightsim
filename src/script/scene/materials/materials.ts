import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { FogColorCategory, FogValueCategory, Palette, PaletteCategory } from "../palettes/palette";
import { FlatVertProgram } from './shaders/flatVP';
import { DepthFragProgram } from './shaders/depthFP';
import { PointVertProgram } from './shaders/pointVP';
import { ShadedVertProgram } from './shaders/shadedVP';
import { ConstantFragProgram } from './shaders/constantFP';


export interface SceneMaterialProperties {
    category: PaletteCategory;
    shaded: boolean;
    depthWrite: boolean;
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

export type SceneMaterialData = SceneFlatMaterialData | SceneShadedMaterialData;

export interface SceneFlatMaterialData {
    shaded: false;
    type: PaletteCategory;
}

export interface SceneShadedMaterialData {
    shaded: true;
    type: PaletteCategory;
}

export class SceneMaterialManager {

    private readonly flatProto: THREE.ShaderMaterial;
    private readonly shadedProto: THREE.ShaderMaterial;
    private readonly pointProto: THREE.ShaderMaterial;
    private palette: Palette;
    private materials: THREE.ShaderMaterial[] = [];

    constructor(palette: Palette) {
        this.palette = palette;

        this.flatProto = new THREE.ShaderMaterial({
            vertexShader: FlatVertProgram,
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
            depthWrite: false,
            userData: {},
            uniforms: {}
        });
    }

    build(properties: SceneMaterialProperties): THREE.Material {
        const p = this.sanitiseProperties(properties);
        const material = this.cloneMaterial(p);
        material.depthWrite = p.depthWrite;
        material.userData = this.buildData(p);
        material.uniforms = this.buildUniforms(p);
        this.materials.push(material);
        return material;
    }

    private sanitiseProperties(properties: SceneMaterialProperties): SceneMaterialProperties {
        const p = { ...properties };
        if (this.is2D(p)) {
            p.depthWrite = false;
            p.shaded = false;
        }
        return p;
    }

    private buildData(properties: SceneMaterialProperties): SceneMaterialData {
        return {
            shaded: properties.shaded,
            type: properties.category
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

    private is2D(properties: SceneMaterialProperties): boolean {
        return properties.category === PaletteCategory.DECORATION_SPECKLE;
    }

    private cloneMaterial(properties: SceneMaterialProperties): ShaderMaterial {
        if (this.is2D(properties)) {
            return this.pointProto.clone();
        } else if (properties.shaded) {
            return this.shadedProto.clone();
        } else {
            return this.flatProto.clone();
        }
    }

    setPalette(palette: Palette) {
        this.palette = palette;

        this.materials.forEach(m => {
            const d = m.userData as SceneMaterialData;
            const u = m.uniforms as SceneMaterialUniforms;
            const c = d.type;
            u.color.value.setStyle(palette.colors[c]);
            u.fogDensity.value = palette.values[FogValueCategory(c)];
            u.fogColor.value.setStyle(palette.colors[FogColorCategory(c)]);
        });
    }
}
