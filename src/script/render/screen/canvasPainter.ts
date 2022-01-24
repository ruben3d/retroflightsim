import { TextAlignment, TextRenderer } from "./text";

export class CanvasPainter {

    private textRenderer: TextRenderer;

    constructor(private ctx: CanvasRenderingContext2D, textColors: string[] = []) {
        this.textRenderer = new TextRenderer(ctx, textColors);
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

    rectangle(x: number, y: number, width: number, height: number, fill: boolean = false) {
        if (fill) {
            this.ctx.fillRect(x + 0.5, y + 0.5, width, height);
        } else {
            this.ctx.strokeRect(x + 0.5, y + 0.5, width, height);
        }
    }

    text(x: number, y: number, text: string, color?: string, alignment: TextAlignment = TextAlignment.LEFT) {
        this.textRenderer.text(x, y, text, color, alignment);
    }
}
