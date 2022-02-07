import * as THREE from 'three';
import { matchesPaletteTime, Model } from '../scene/models/models';
import { Palette } from '../scene/palettes/palette';
import { assertIsDefined } from '../utils/asserts';


export const DEFAULT_LOD_BIAS = 3;

export class LODHelper {

    private objFlats: THREE.Object3D = new THREE.Object3D();
    private objVolumes: THREE.Object3D = new THREE.Object3D();

    constructor(private model: Model, private bias: number) { }

    addToRenderList(
        position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3,
        camera: THREE.Camera, palette: Palette,
        flatsId: string, volumesId: string, lists: Map<string, THREE.Scene>) {

        const lodLevel = this.getLodLevel(position, scale, camera, this.model.maxSize);
        if (lodLevel >= this.model.lod.length) return;

        if (lists.has(flatsId) && this.model.lod[lodLevel].flats.length > 0) {
            this.subRender(position, quaternion, scale, this.objFlats, this.model.lod[lodLevel].flats, flatsId, lists, palette);
        }
        if (lists.has(volumesId) && this.model.lod[lodLevel].volumes.length > 0) {
            this.subRender(position, quaternion, scale, this.objVolumes, this.model.lod[lodLevel].volumes, volumesId, lists, palette);
        }
    }

    private getLodLevel(position: THREE.Vector3, scale: THREE.Vector3, camera: THREE.Camera, maxSize: number): number {
        if ('isPerspectiveCamera' in camera === false) {
            return 0;
        }
        const c = camera as THREE.PerspectiveCamera;
        const d = camera.position.distanceTo(position);
        const fov = THREE.MathUtils.degToRad(c.fov);
        const visibleWidthAtD = c.aspect * 2 * Math.tan(fov / 2) * d;
        const maxScale = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
        const relativeSize = maxScale * maxSize / visibleWidthAtD;
        return relativeSize >= 1 ? 0 : Math.max(0, Math.floor(-Math.log2(relativeSize)) - this.bias);
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
