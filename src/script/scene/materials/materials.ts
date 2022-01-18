import * as THREE from 'three';
import { FogColorCategory, FogValueCategory, Palette, PaletteCategory } from "../palettes/palette";

const flatVertProgram: string = `
  precision highp float;

  varying vec3 vPosition;
  varying float shade;

  void main() {
    shade = 1.0;
    vec4 tmpPos = modelMatrix * vec4(position, 1.0);
    vPosition = vec3(tmpPos.x, 0.0, tmpPos.z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shadedVertProgram: string = `
  precision highp float;

  uniform mat3 normalModelMatrix;

  varying vec3 vPosition;
  varying float shade;

  void main() {
    vec3 worldNormal = normalize(normalModelMatrix * normal);
    float shadeUp = 0.9 + dot(worldNormal, vec3(0.0, 1.0, 0.0)) * 0.1;
    float shadeRight = 0.8 + dot(worldNormal, vec3(0.0, 0.0, 1.0)) * 0.2;
    shade = shadeUp * shadeRight;

    vec4 tmpPos = modelMatrix * vec4(position, 1.0);
    vPosition = vec3(tmpPos.x, 0.0, tmpPos.z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragProgram: string = `
  precision lowp float;

  uniform vec3 vCameraNormal;
  uniform float vCameraD;
  uniform vec3 color;
  uniform float fogDensity;
  uniform vec3 fogColor;

  varying vec3 vPosition;
  varying float shade;

  void main() {
    float distance = dot(vPosition, vCameraNormal) + vCameraD;
    float fogFactor = exp2(-fogDensity  * distance);
    fogFactor = 1.0 - clamp(fogFactor, 0.0, 1.0);
    fogFactor = floor(fogFactor * 10.0 + 0.5) / 10.0;

    gl_FragColor = mix(vec4(color * shade, 1.0), vec4(fogColor, 1.0), fogFactor);
  }
`;

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
    vCameraNormal: { value: THREE.Vector3; };
    vCameraD: { value: number; };
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
    private palette: Palette;
    private materials: THREE.ShaderMaterial[] = [];

    constructor(palette: Palette) {
        this.palette = palette;

        this.flatProto = new THREE.ShaderMaterial({
            vertexShader: flatVertProgram,
            fragmentShader: fragProgram,
            side: THREE.DoubleSide,
            depthWrite: true,
            userData: {},
            uniforms: {}
        });
        this.shadedProto = new THREE.ShaderMaterial({
            vertexShader: shadedVertProgram,
            fragmentShader: fragProgram,
            side: THREE.DoubleSide,
            depthWrite: true,
            userData: {},
            uniforms: {}
        });
    }

    build(properties: SceneMaterialProperties): THREE.Material {
        const material = properties.shaded ? this.shadedProto.clone() : this.flatProto.clone();
        material.depthWrite = properties.depthWrite;
        material.userData = this.buildData(properties);
        material.uniforms = this.buildUniforms(properties);
        this.materials.push(material);
        return material;
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
                vCameraNormal: { value: new THREE.Vector3() },
                vCameraD: { value: 0 },
                color: { value: new THREE.Color(this.palette.colors[properties.category]) },
                fogDensity: { value: this.palette.values[FogValueCategory(properties.category)] },
                fogColor: { value: new THREE.Color(this.palette.colors[FogColorCategory(properties.category)]) }
            },
            ...properties.shaded ? {
                normalModelMatrix: { value: new THREE.Matrix3() }
            } : {}
        };
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
