import { AudioResourceManager } from "./audioResources";

export class AudioClip {
    private audioSource: AudioBufferSourceNode | undefined;
    private gainNode: GainNode | undefined;
    private _rate = 1.0;
    private _gain = 1.0;
    private started = false;

    constructor(url: string, private context: AudioContext, resources: AudioResourceManager, private loop: boolean) {
        resources.load(url, resource => {
            this.audioSource = new AudioBufferSourceNode(context, { buffer: resource.getBuffer(), loop, playbackRate: this._rate });
            this.gainNode = new GainNode(context, { gain: this._gain });
            this.audioSource.connect(this.gainNode).connect(context.destination);
        });
    }

    set rate(value: number) {
        this._rate = value;
        if (this.audioSource) {
            this.audioSource.playbackRate.value = value;
        }
    }

    set gain(value: number) {
        this._gain = value;
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }

    play() {
        if (!this.started) {
            this.started = true;
            this.audioSource?.start();
        } else {
            this.gainNode?.connect(this.context.destination);
        }
    }

    stop() {
        this.gainNode?.disconnect(this.context.destination);
    }
}

export class AudioSystem {
    private context = new AudioContext();
    private resources = new AudioResourceManager(this.context);
    private globals: Map<string, AudioClip> = new Map();

    getGlobal(url: string, loop: boolean): AudioClip {
        let clip = this.globals.get(url);

        if (!clip) {
            clip = new AudioClip(url, this.context, this.resources, loop);
            this.globals.set(url, clip);
        }

        return clip;
    }

    getInstance(url: string, loop: boolean): AudioClip {
        return new AudioClip(url, this.context, this.resources, loop);
    }
}
