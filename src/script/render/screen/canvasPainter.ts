import { Font, TextAlignment, TextEffect, TextRenderer } from "./text";


function XOR(p: boolean, q: boolean): boolean {
    return (p || q) && !(p && q);
}

class BatchCanvasPainter {
    constructor(private ctx: CanvasRenderingContext2D) { }

    hLine(x0: number, x1: number, y: number): BatchCanvasPainter {
        const inverted = x0 > x1 ? 1 : 0;
        this.ctx.moveTo(x0 + inverted, y + 0.5);
        this.ctx.lineTo(x1 + 1 - inverted, y + 0.5);
        return this;
    }

    vLine(x: number, y0: number, y1: number): BatchCanvasPainter {
        const inverted = y0 > y1 ? 1 : 0;
        this.ctx.moveTo(x + 0.5, y0 + inverted);
        this.ctx.lineTo(x + 0.5, y1 + 1 - inverted);
        return this;
    }

    line(x0: number, y0: number, x1: number, y1: number): BatchCanvasPainter {
        if (x0 === x1) {
            this.vLine(x0, y0, y1);
            return this;
        } else if (y0 === y1) {
            this.hLine(x0, x1, y0);
            return this;
        }

        let lead0 = x0;
        let lead1 = x1;
        let offset0 = y0;
        let offset1 = y1;
        const flip = Math.abs((y1 - y0) / (x1 - x0)) > 1;
        if (flip) {
            lead0 = y0;
            lead1 = y1;
            offset0 = x0;
            offset1 = x1;
        }
        if (lead0 > lead1) {
            [lead0, lead1] = [lead1, lead0];
            [offset0, offset1] = [offset1, offset0];
        }
        const offsetStep = offset0 < offset1 ? 1 : -1;
        const offsetDelta = offsetStep * (offset1 - offset0);
        const leadDelta = lead1 - lead0;
        let error = 2 * offsetDelta - leadDelta;
        let offset = offset0;

        for (let lead = lead0; lead <= lead1; lead++) {
            // TODO If two or more consecutive lead pixels have the same offset then use a single line for all
            if (flip) {
                this.vLine(offset, lead, lead);
            } else {
                this.hLine(lead, lead, offset);
            }
            if (error > 0) {
                offset = offset + offsetStep;
                error = error - 2 * leadDelta;
            }
            error = error + 2 * offsetDelta;
        }
        return this;
    }

    // The points define the hypotenuse
    // Left -> Right: Bottom is filled
    // Right -> Left: Top is filled
    rightTriangle(x0: number, y0: number, x1: number, y1: number): BatchCanvasPainter {
        if (x0 === x1) {
            this.vLine(x0, y0, y1);
            return this;
        } else if (y0 === y1) {
            this.hLine(x0, x1, y0);
            return this;
        }

        let lead0 = x0;
        let lead1 = x1;
        let offset0 = y0;
        let offset1 = y1;
        const flip = Math.abs((y1 - y0) / (x1 - x0)) > 1;
        if (flip) {
            lead0 = y0;
            lead1 = y1;
            offset0 = x0;
            offset1 = x1;
        }
        let invertedLead = false;
        if (lead0 > lead1) {
            invertedLead = true;
            [lead0, lead1] = [lead1, lead0];
            [offset0, offset1] = [offset1, offset0];
        }
        const invertedOffset = offset0 > offset1;
        const offsetStep = invertedOffset ? -1 : 1;
        const offsetDelta = offsetStep * (offset1 - offset0);
        const leadDelta = lead1 - lead0;
        let error = 2 * offsetDelta - leadDelta;
        let offset = offset0;

        for (let lead = lead0; lead <= lead1; lead++) {
            if (flip) {
                this.hLine(XOR(invertedLead, !invertedOffset) ? offset0 : offset1, offset, lead);
            } else {
                this.vLine(lead, XOR(invertedLead, !invertedOffset) ? offset1 : offset0, offset);
            }
            if (error > 0) {
                offset = offset + offsetStep;
                error = error - 2 * leadDelta;
            }
            error = error + 2 * offsetDelta;
        }
        return this;
    }

    commit() {
        this.ctx.stroke();
    }
}

class ClipCanvasPainter {
    constructor(private ctx: CanvasRenderingContext2D) { }

    rectangle(x: number, y: number, width: number, height: number): ClipCanvasPainter {
        this.ctx.rect(x, y, width - 1, height - 1);
        return this;
    }

    circle(x: number, y: number, radius: number): ClipCanvasPainter {
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        return this;
    }

    clip(): ClipCanvasPainter {
        this.ctx.clip();
        return this;
    }

    clear() {
        this.ctx.restore();
    }
}

export class CanvasPainter {

    private textRenderer: TextRenderer;
    private batchPainter: BatchCanvasPainter;
    private clipPainter: ClipCanvasPainter;
    private textEffect: TextEffect = TextEffect.NONE;
    private textEffectColor: string = '#000000';

    constructor(private ctx: CanvasRenderingContext2D, textColors: string[] = []) {
        this.textRenderer = new TextRenderer(ctx, textColors);
        this.batchPainter = new BatchCanvasPainter(ctx);
        this.clipPainter = new ClipCanvasPainter(ctx);
        this.ctx.lineCap = 'butt';
        this.ctx.lineWidth = 1;
    }

    // State

    setColor(color: string) {
        this.ctx.strokeStyle = color;
    }

    setBackground(color: string) {
        this.ctx.fillStyle = color;
    }

    setTextEffect(effect: TextEffect, effectColor: string) {
        this.textEffect = effect;
        this.textEffectColor = effectColor;
    }

    // Actions

    clear(): void;
    clear(x: number, y: number, width: number, height: number): void;
    clear(x?: number, y?: number, width?: number, height?: number): void {
        this.ctx.clearRect(x || 0, y || 0, width || this.ctx.canvas.width, height || this.ctx.canvas.height);
    }

    hLine(x0: number, x1: number, y: number) {
        this.batch()
            .hLine(x0, x1, y)
            .commit();
    }

    vLine(x: number, y0: number, y1: number) {
        this.batch()
            .vLine(x, y0, y1)
            .commit();
    }

    line(x0: number, y0: number, x1: number, y1: number) {
        this.batch()
            .line(x0, y0, x1, y1)
            .commit();
    }

    rightTriangle(x0: number, y0: number, x1: number, y1: number) {
        this.batch()
            .rightTriangle(x0, y0, x1, y1)
            .commit();
    }

    rectangle(x: number, y: number, width: number, height: number, fill: boolean = false) {
        if (fill) {
            this.ctx.fillRect(x, y, width, height);
        } else {
            this.ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
        }
    }

    text(font: Font, x: number, y: number, text: string, color?: string, alignment: TextAlignment = TextAlignment.LEFT) {
        this.textRenderer.text(font,x, y, text, color, alignment, this.textEffect, this.textEffectColor);
    }

    batch(): BatchCanvasPainter {
        this.ctx.beginPath();
        return this.batchPainter;
    }

    clip(): ClipCanvasPainter {
        this.ctx.save();
        this.ctx.beginPath();
        return this.clipPainter;
    }
}
