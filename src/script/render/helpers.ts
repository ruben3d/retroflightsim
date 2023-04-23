import * as THREE from 'three';
import { Palette } from '../config/palettes/palette';
import { Model, ModelAnimation, modelHasAnim, modelMatchesPaletteTime } from '../scene/models/models';
import { assertIsDefined } from '../utils/asserts';


export function visibleWidthAtDistance(camera: THREE.PerspectiveCamera, position: number | THREE.Vector3): number {
    const d = typeof position === 'number' ? position : camera.position.distanceTo(position);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    return camera.aspect * 2 * Math.tan(fov / 2) * d;
}

export function modelScaledMaxSize(maxSize: number, scale: THREE.Vector3): number {
    const maxScale = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    return maxSize * maxScale;
}

export const DEFAULT_LOD_BIAS = 3;

const ANIM_ROTATE_UP_SPEED = 0.4; // Revolutions per second
const REF_WIDTH = 320; // Pixels

enum PlaybackStatus {
    PLAYING,
    STOPPED
}

export class LODHelper {

    private elapsed: number = 0;

    private objFlats: THREE.Object3D = new THREE.Object3D();
    private objVolumes: THREE.Object3D = new THREE.Object3D();
    private objVolumesAnim: THREE.Object3D = new THREE.Object3D();

    private animActions: THREE.AnimationAction[] = [];
    private animMixers: THREE.AnimationMixer[] = [];
    private playback: PlaybackStatus = PlaybackStatus.STOPPED;
    private originalPlaybackDuration: number = 0; // seconds
    private playbackDuration: number = 0; // seconds

    constructor(public model: Model, private bias: number = DEFAULT_LOD_BIAS) {
        if (model.animations.length !== 0) {
            this.createActions();
        }
    }

    private createActions() {
        //! Just volumes at LOD 0
        const map = new Map(this.model.lod[0].volumes.map(model => ([model.name, model])));
        this.model.animations.forEach(clip => {
            this.originalPlaybackDuration = Math.max(this.originalPlaybackDuration, clip.duration);
            const root = map.get(clip.name.replace('Action', ''));
            assertIsDefined(root, clip.name);
            const mixer = new THREE.AnimationMixer(root);
            this.animMixers.push(mixer);
            const action = mixer.clipAction(clip);
            action.loop = THREE.LoopOnce;
            action.clampWhenFinished = true;
            this.animActions.push(action);
        });
    }

    update(delta: number): void {
        this.elapsed += delta;
        if (this.playback === PlaybackStatus.PLAYING) {
            this.playback = PlaybackStatus.STOPPED;
            for (let i = 0; i < this.animMixers.length; i++) {
                this.animMixers[i].update(delta);
                if (this.animActions[i].isRunning()) {
                    this.playback = PlaybackStatus.PLAYING;
                }
            }
        }
    }

    play() {
        this.playback = PlaybackStatus.PLAYING;
        const timeScale = this.originalPlaybackDuration / this.playbackDuration
        for (let i = 0; i < this.animActions.length; i++) {
            this.animActions[i].timeScale = timeScale;
            this.animActions[i].play();
            this.animActions[i].paused = false;
        }
    }

    playBackwards() {
        this.playback = PlaybackStatus.PLAYING;
        const timeScale = this.originalPlaybackDuration / this.playbackDuration
        for (let i = 0; i < this.animActions.length; i++) {
            this.animActions[i].timeScale = -timeScale;
            this.animActions[i].play();
            this.animActions[i].paused = false;
        }
    }

    // [0,1]
    setPlaybackPosition(p: number) {
        this.playback = PlaybackStatus.STOPPED;
        const timeScale = this.originalPlaybackDuration / this.playbackDuration;
        for (let i = 0; i < this.animMixers.length; i++) {
            this.animActions[i].timeScale = timeScale;
            this.animActions[i].paused = false;
            this.animActions[i].play();
            this.animMixers[i].setTime(this.animActions[i].getClip().duration * p / timeScale);
            this.animActions[i].paused = true;
        }
    }

    setPlaybackDuration(seconds: number) {
        this.playbackDuration = seconds;
        const timeScale = this.originalPlaybackDuration / this.playbackDuration
        for (let i = 0; i < this.animMixers.length; i++) {
            this.animActions[i].timeScale = timeScale;
        }
    }

    addToRenderList(
        position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3,
        targetWidth: number, camera: THREE.Camera, palette: Palette,
        flatsId: string, volumesId: string, lists: Map<string, THREE.Scene>,
        forceLodLevel?: number) {

        const hasFlats = lists.has(flatsId);
        const hasVolumes = lists.has(volumesId);
        if (!hasFlats && !hasVolumes) return;

        const lodLevel = forceLodLevel !== undefined ? forceLodLevel : this.getLodLevel(position, scale, targetWidth, camera, this.model.maxSize);
        if (lodLevel >= this.model.lod.length) return;

        if (hasFlats && this.model.lod[lodLevel].flats.length > 0) {
            this.subRender(position, quaternion, scale, this.objFlats, this.objVolumesAnim, this.model.lod[lodLevel].flats, flatsId, lists, palette);
        }
        if (hasVolumes && this.model.lod[lodLevel].volumes.length > 0) {
            this.subRender(position, quaternion, scale, this.objVolumes, this.objVolumesAnim, this.model.lod[lodLevel].volumes, volumesId, lists, palette);
        }
    }

    getLodLevel(position: THREE.Vector3, scale: THREE.Vector3, targetWidth: number, camera: THREE.Camera, modelMaxSize: number): number {
        if ('isPerspectiveCamera' in camera === false || modelMaxSize === 0) {
            return 0;
        }
        const visibleWidthAtD = visibleWidthAtDistance(camera as THREE.PerspectiveCamera, position);
        if (visibleWidthAtD === 0) {
            return 0; // Camera and model at the same spot, can't get closer than that
        }
        const relativeSize = modelScaledMaxSize(modelMaxSize, scale) / visibleWidthAtD;
        const referenceSize = relativeSize * REF_WIDTH;
        const realSize = relativeSize * targetWidth;
        const ratio = realSize / referenceSize;
        const scaledRelativeSize = relativeSize * ratio;
        return scaledRelativeSize >= 1 ? 0 : Math.max(0, Math.floor(-Math.log2(scaledRelativeSize)) - this.bias);
    }

    private subRender(
        position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3,
        dst: THREE.Object3D, dstAnim: THREE.Object3D, collection: THREE.Object3D[], listId: string, lists: Map<string, THREE.Scene>,
        palette: Palette) {

        let hasAnim = false;
        const list = lists.get(listId);
        assertIsDefined(list);
        dst.clear();
        dstAnim.clear();
        for (let i = 0; i < collection.length; i++) {
            const m = collection[i];
            if (modelMatchesPaletteTime(m, palette.time)) {
                if (modelHasAnim(m, ModelAnimation.ROTATE_UP)) {
                    hasAnim = true;
                    dstAnim.add(m);
                } else {
                    dst.add(m);
                }
            }
        }
        dst.position.copy(position);
        dst.quaternion.copy(quaternion);
        dst.scale.copy(scale);
        list.add(dst);

        if (hasAnim) {
            dstAnim.position.copy(position);
            dstAnim.quaternion.copy(quaternion);
            dstAnim.rotateY(2 * Math.PI * this.elapsed * ANIM_ROTATE_UP_SPEED);
            dstAnim.scale.copy(scale);
            list.add(dstAnim);
        }
    }
}
