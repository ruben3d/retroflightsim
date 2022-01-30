import * as THREE from 'three';
import { assertIsDefined } from '../../../utils/asserts';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { Entity } from "../entity";
import { matchesPaletteTime, Model } from '../models/models';
import { Palette } from "../palettes/palette";
import { Scene, SceneLayers } from "../scene";

export class StaticSceneryEntity implements Entity {
    constructor(private model: Model) { }

    private obj: THREE.Object3D = new THREE.Object3D();
    private objFlats: THREE.Object3D = new THREE.Object3D();
    private objVolumes: THREE.Object3D = new THREE.Object3D();

    set position(p: THREE.Vector3) {
        this.obj.position.copy(p);
    }

    get position() {
        return this.obj.position;
    }

    set quaternion(q: THREE.Quaternion) {
        this.obj.quaternion.copy(q);
    }

    get quaternion() {
        return this.obj.quaternion;
    }

    set scale(s: THREE.Vector3) {
        this.obj.scale.copy(s);
    }

    get scale() {
        return this.obj.scale;
    }

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        //
    }

    render(layers: Map<string, THREE.Scene>, painter: CanvasPainter, palette: Palette): void {
        if (this.model.flats.length > 0) {
            this.subRender(this.objFlats, this.model.flats, SceneLayers.EntityFlats, layers, palette);
        }
        if (this.model.volumes.length > 0) {
            this.subRender(this.objVolumes, this.model.volumes, SceneLayers.EntityVolumes, layers, palette);
        }
    }

    private subRender(dst: THREE.Object3D, collection: THREE.Object3D[], layerId: SceneLayers, layers: Map<string, THREE.Scene>, palette: Palette) {
        const layer = layers.get(layerId);
        assertIsDefined(layer);
        dst.clear();
        collection.forEach(m => {
            if (matchesPaletteTime(m, palette.time)) {
                dst.add(m);
            }
        });
        dst.position.copy(this.position);
        dst.quaternion.copy(this.quaternion);
        dst.scale.copy(this.scale);
        layer.add(dst);
    }
}
