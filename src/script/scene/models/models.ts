import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PaletteCategory, PaletteTime } from '../../config/palettes/palette';
import { assertIsDefined } from '../../utils/asserts';
import { isZero } from '../../utils/math';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../materials/materials';
import { updateUniforms } from '../utils';


export interface ModelLodLevel {
    flats: THREE.Object3D[];
    volumes: THREE.Object3D[];
};

export interface Model {
    lod: ModelLodLevel[];
    animations: THREE.AnimationClip[];
    maxSize: number;
    center: THREE.Vector3;
}

export const LIB_PREFFIX = 'lib:';
export type ModelLoadedListener = (url: string, model: Model) => void;

export interface ModelLibBuilder {
    readonly type: string;
    build(materials: SceneMaterialManager): Model;
}

enum RequestStatus {
    LOADING,
    COMPLETED,
    ERROR
}

interface ModelWrapper {
    model: Model;
    status: RequestStatus;
    pending: { model: Model; listener?: ModelLoadedListener }[];
}

export function modelMatchesPaletteTime(obj: THREE.Object3D, time: PaletteTime): boolean {
    const modelTime = obj.userData.time as string | undefined;
    return !modelTime || modelTime === time;
}

export enum ModelAnimation {
    ROTATE_UP = 'rotateUp'
}

export function modelHasAnim(obj: THREE.Object3D, type: ModelAnimation): boolean {
    const modelAnim = obj.userData.anim as ModelAnimation | undefined;
    return modelAnim !== undefined && modelAnim === type;
}

export class ModelManager {

    private libBuilders: Map<string, ModelLibBuilder> = new Map();
    private models: Map<string, ModelWrapper> = new Map();
    private gltfLoader: GLTFLoader = new GLTFLoader();

    constructor(private materials: SceneMaterialManager, libBuilders: ModelLibBuilder[]) {
        libBuilders.forEach(b => this.libBuilders.set(b.type, b));
    }

    getModel(url: string, listener?: ModelLoadedListener): Model {
        let modelWrapper = this.models.get(url);

        if (modelWrapper === undefined) {
            if (url.startsWith(LIB_PREFFIX)) {
                const libType = url.substring(LIB_PREFFIX.length);
                const builder = this.libBuilders.get(libType);
                assertIsDefined(builder, `"${libType}"`);
                modelWrapper = {
                    model: builder.build(this.materials),
                    status: RequestStatus.COMPLETED,
                    pending: []
                }
            } else {
                modelWrapper = {
                    model: this.empty(),
                    status: RequestStatus.LOADING,
                    pending: []
                }
                this.gltfLoader.load(url, this.getLoadFn(url, modelWrapper), undefined, this.getErrorFn(url, modelWrapper));
            }
            this.models.set(url, modelWrapper);
        }

        const newModel = this.empty();

        if (modelWrapper.status === RequestStatus.LOADING) {
            modelWrapper.pending.push({ model: newModel, listener: listener });
        } else if (modelWrapper.status === RequestStatus.COMPLETED) {
            this.copyTo(modelWrapper.model, newModel);
            if (listener) listener(url, newModel);
        }

        return newModel;
    }

    private getLoadFn(url: string, wrapper: ModelWrapper): (gltf: GLTF) => void {
        return (gltf: GLTF) => {
            wrapper.model = this.processModel(gltf, wrapper.model);
            wrapper.status = RequestStatus.COMPLETED;
            wrapper.pending.forEach(p => {
                this.copyTo(wrapper.model, p.model);
                if (p.listener) p.listener(url, p.model);
            });
            wrapper.pending = [];
        }
    }

    private getErrorFn(url: string, wrapper: ModelWrapper): (error: ErrorEvent) => void {
        return (error: ErrorEvent) => {
            wrapper.status = RequestStatus.ERROR;
            wrapper.pending = [];
            console.error(`Error loading "${url}":`, error.message);
        }
    }

    private processModel(gltf: GLTF, model: Model): Model {
        const scenes = [...gltf.scenes].sort(this.sortingFn);
        const AABBox = new THREE.Box3();
        model.lod = scenes.map(scene => {
            const level: ModelLodLevel = {
                flats: [],
                volumes: []
            };
            scene.traverse(child => {
                if ('isGroup' in child) return;
                const obj = child as THREE.Mesh | THREE.LineSegments | THREE.Points;

                obj.geometry.computeBoundingBox();
                obj.onBeforeRender = updateUniforms;

                const localAABB = obj.geometry.boundingBox;
                assertIsDefined(localAABB);
                AABBox.union(localAABB);

                const isFlat = isZero(localAABB.max.y || 0.0) && isZero(localAABB.min.y || 0.0);
                if (isFlat) {
                    level.flats.push(obj);
                } else {
                    obj.geometry.rotateY(0.0001); //! HACK: Fixes issue dithering axis-aligned triangles
                    level.volumes.push(obj);
                }

                if ('isMesh' in obj) {
                    obj.material = this.materials.build({
                        type: SceneMaterialPrimitiveType.MESH,
                        category: (obj.material as THREE.MeshStandardMaterial).name as PaletteCategory,
                        shaded: !isFlat,
                        depthWrite: !isFlat
                    });
                } else if ('isLineSegments' in child) {
                    obj.material = this.materials.build({
                        type: SceneMaterialPrimitiveType.LINE,
                        category: (obj.material as THREE.LineBasicMaterial).name as PaletteCategory,
                        depthWrite: !isFlat
                    });
                } else if ('isPoints' in child) {
                    obj.material = this.materials.build({
                        type: SceneMaterialPrimitiveType.POINT,
                        category: (obj.material as THREE.PointsMaterial).name as PaletteCategory,
                        depthWrite: !isFlat
                    });
                }
            });

            level.flats.sort(this.sortingFn);
            level.volumes.sort(this.sortingFn);
            return level;
        });
        model.animations = gltf.animations;
        model.maxSize = Math.max(...AABBox.getSize(new THREE.Vector3()).toArray());
        AABBox.getCenter(model.center);
        return model;
    }

    private sortingFn(a: THREE.Object3D, b: THREE.Object3D) {
        return parseInt(a.name.charAt(0)) - parseInt(b.name.charAt(0));
    }

    private empty(): Model {
        return { lod: [], animations: [], maxSize: 0, center: new THREE.Vector3() };
    }

    private copyTo(src: Model, dst: Model) {
        dst.lod = src.lod.map(level => ({
            flats: level.flats.map(obj => this.cloneObj(obj)),
            volumes: level.volumes.map(obj => this.cloneObj(obj))
        }));
        dst.animations = src.animations; // No need to copy the clips
        dst.maxSize = src.maxSize;
        dst.center.copy(src.center);
    }

    private cloneObj(obj: THREE.Object3D): THREE.Object3D {
        const o = obj.clone();
        o.onBeforeRender = updateUniforms;
        return o;
    }
}
