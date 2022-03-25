import * as THREE from 'three';
import { matchesPaletteTime, Model } from '../scene/models/models';
import { Palette } from '../scene/palettes/palette';
import { assertIsDefined } from '../utils/asserts';


export function visibleWidthAtDistance(camera: THREE.PerspectiveCamera, position: number | THREE.Vector3): number {
    const d = typeof position === 'number' ? position : camera.position.distanceTo(position);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    return camera.aspect * 2 * Math.tan(fov / 2) * d;
}

export function modelMaxSize(model: Model, scale: THREE.Vector3): number {
    const maxScale = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    return model.maxSize * maxScale;
}

export const DEFAULT_LOD_BIAS = 3;

const REF_WIDTH = 320; // Pixels

export class LODHelper {

    private objFlats: THREE.Object3D = new THREE.Object3D();
    private objVolumes: THREE.Object3D = new THREE.Object3D();

    constructor(private model: Model, private bias: number) { }

    addToRenderList(
        position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3,
        targetWidth: number, camera: THREE.Camera, palette: Palette,
        flatsId: string, volumesId: string, lists: Map<string, THREE.Scene>) {

        const hasFlats = lists.has(flatsId);
        const hasVolumes = lists.has(volumesId);
        if (!hasFlats && !hasVolumes) return;

        const lodLevel = this.getLodLevel(position, scale, targetWidth, camera, this.model);
        if (lodLevel >= this.model.lod.length) return;

        if (hasFlats && this.model.lod[lodLevel].flats.length > 0) {
            this.subRender(position, quaternion, scale, this.objFlats, this.model.lod[lodLevel].flats, flatsId, lists, palette);
        }
        if (hasVolumes && this.model.lod[lodLevel].volumes.length > 0) {
            this.subRender(position, quaternion, scale, this.objVolumes, this.model.lod[lodLevel].volumes, volumesId, lists, palette);
        }
    }

    private getLodLevel(position: THREE.Vector3, scale: THREE.Vector3, targetWidth: number, camera: THREE.Camera, model: Model): number {
        if ('isPerspectiveCamera' in camera === false || model.maxSize === 0) {
            return 0;
        }
        const visibleWidthAtD = visibleWidthAtDistance(camera as THREE.PerspectiveCamera, position);
        if (visibleWidthAtD === 0) {
            return 0; // Camera and model at the same spot, can't get closer than that
        }
        const relativeSize = modelMaxSize(model, scale) / visibleWidthAtD;
        const referenceSize = relativeSize * REF_WIDTH;
        const realSize = relativeSize * targetWidth;
        const ratio = realSize / referenceSize;
        const scaledRelativeSize = relativeSize * ratio;
        return scaledRelativeSize >= 1 ? 0 : Math.max(0, Math.floor(-Math.log2(scaledRelativeSize)) - this.bias);
    }

    private subRender(
        position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3,
        dst: THREE.Object3D, collection: THREE.Object3D[], listId: string, lists: Map<string, THREE.Scene>,
        palette: Palette) {

        const list = lists.get(listId);
        assertIsDefined(list);
        dst.clear();
        collection.forEach(m => {
            if (matchesPaletteTime(m, palette.time)) {
                dst.add(m);
            }
        });
        dst.position.copy(position);
        dst.quaternion.copy(quaternion);
        dst.scale.copy(scale);
        list.add(dst);
    }
}
