import { assertExpr } from "../utils/asserts";

export interface KernelTask {
    // delta - Time elapsed for the previous frame, measured in seconds.
    update(delta: number): void;
}

// 60fps, measured in ms
const DEFAULT_FRAME_DURATION: number = 1000.0 / 60.0;

export class Kernel {
    private runTasksFn = () => { this.runTasks() };

    private tasks: KernelTask[] = [];

    private prevTime: number = performance.now();

    private targetFPSLength: number = 0.0;
    private targetFPSprogress: number = 0.0;

    constructor(private targetFPS?: number) {
        this.setTargetFPS(targetFPS);
    }

    addTask(task: KernelTask) {
        this.tasks.push(task);
    }

    setTargetFPS(targetFPS?: number) {
        if (targetFPS) {
            this.targetFPSLength = 1.0 / targetFPS * 1000.0;
        } else {
            this.targetFPSLength = 0.0;
        }
        this.targetFPS = targetFPS;
        this.targetFPSprogress = 0.0;
    }

    start() {
        assertExpr(this.tasks.length > 0, 'No KernelTasks registered!');
        window.requestAnimationFrame(this.runTasksFn);
        this.prevTime = performance.now() - DEFAULT_FRAME_DURATION;
    }

    private runTasks() {
        let deltaMs = this.updateDeltas();
        window.requestAnimationFrame(this.runTasksFn);

        if (this.targetFPS) {
            this.targetFPSprogress += deltaMs;
            if (this.targetFPSprogress >= this.targetFPSLength) {
                // This might cause frame skips when deltaMs > targetFPSLength
                do {
                    this.targetFPSprogress -= this.targetFPSLength;
                } while (this.targetFPSprogress >= this.targetFPSLength);

                deltaMs = this.targetFPSLength;
            } else {
                // Not yet, let's wait a bit...
                return;
            }
        }

        const delta = deltaMs / 1000.0;

        for (let i = 0; i < this.tasks.length; i++) {
            this.tasks[i].update(delta);
        }
    }

    private updateDeltas(): number {
        const now = performance.now();
        const deltaMs = now - this.prevTime;
        this.prevTime = now;
        return deltaMs;
    }
}
