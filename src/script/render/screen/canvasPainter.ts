import { TextAlignment, TextRenderer } from "./text";

class BatchCanvasPainter {
    constructor(private ctx: CanvasRenderingContext2D) { }

    hLine(x0: number, x1: number, y: number): BatchCanvasPainter {
        this.ctx.moveTo(x0, y + 0.5);
        this.ctx.lineTo(x1 + 1, y + 0.5);
        return this;
    }

    vLine(x: number, y0: number, y1: number): BatchCanvasPainter {
        this.ctx.moveTo(x + 0.5, y0);
        this.ctx.lineTo(x + 0.5, y1 + 1);
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

    // Actions

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
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

    rectangle(x: number, y: number, width: number, height: number, fill: boolean = false) {
        if (fill) {
            this.ctx.fillRect(x + 0.5, y + 0.5, width - 1, height - 1);
        } else {
            this.ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
        }
    }

    text(x: number, y: number, text: string, color?: string, alignment: TextAlignment = TextAlignment.LEFT) {
        this.textRenderer.text(x, y, text, color, alignment);
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
