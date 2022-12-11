import { assertIsDefined } from "../utils/asserts";


export enum AudioResourceState {
    LOADING,
    READY,
    ERROR // Just in case I may decide to try again due to network issues...
};

export type AudioResourceListener = (resource: AudioResource) => void;

export class AudioResource {
    private state: AudioResourceState = AudioResourceState.LOADING;
    private buffer: AudioBuffer | undefined;

    constructor(public readonly url: string, context: AudioContext, listener: AudioResourceListener) {
        const request = new XMLHttpRequest();
        request.responseType = 'arraybuffer';
        request.open('GET', url, true);
        request.onload = () => {
            context.decodeAudioData(request.response,
                buffer => {
                    this.buffer = buffer;
                    this.state = AudioResourceState.READY;
                    listener(this);
                },
                e => {
                    this.state = AudioResourceState.ERROR;
                    console.error(`Error decoding audio data from resource "${url}".`, e);
                });
        };
        request.onerror = () => {
            this.state = AudioResourceState.ERROR;
            console.error(`Error loading audio resource "${url}"`);
        };
        request.send();
    }

    getBuffer(): AudioBuffer {
        assertIsDefined(this.buffer, `Trying to use an invalid AudioResource: ${this.url}`);
        return this.buffer;
    }

    get isReady(): boolean { return this.state === AudioResourceState.READY; }
}

interface AudioResourceWrapper {
    resource: AudioResource;
    listeners: AudioResourceListener[];
}

export class AudioResourceManager {
    private resources: Map<string, AudioResourceWrapper> = new Map();

    constructor(private context: AudioContext) { }

    load(url: string, listener: AudioResourceListener): AudioResource {
        let wrapper = this.resources.get(url);

        if (!wrapper) {
            const resource = new AudioResource(url, this.context, resource => this.onResourceLoaded(resource));
            wrapper = { resource, listeners: [listener] };
            this.resources.set(url, wrapper);
        } else if (!wrapper.resource.isReady) {
            wrapper.listeners.push(listener);
        }

        return wrapper.resource;
    }

    private onResourceLoaded(resource: AudioResource) {
        const wrapper = this.resources.get(resource.url);
        assertIsDefined(wrapper);
        wrapper.listeners.forEach(l => l(resource));
        wrapper.listeners.length = 0;
    }
}
