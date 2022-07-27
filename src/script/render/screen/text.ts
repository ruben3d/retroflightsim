export const CHAR_WIDTH = 3;
export const CHAR_HEIGHT = 5;
export const CHAR_MARGIN = 1;

const ASCII_0 = 48;
const ASCII_BIG_A = 65;
const ASCII_SMALL_A = 97;
const ASCII_LETTERS = 26;
const ASCII_NUMBERS = 10;

const NumberMap = new Map<number, { col: number, row: number }>([
    [0, { col: 2, row: 3 }],
    [1, { col: 3, row: 3 }],
    [2, { col: 4, row: 3 }],
    [3, { col: 5, row: 3 }],
    [4, { col: 6, row: 3 }],
    [5, { col: 7, row: 3 }],
    [6, { col: 0, row: 4 }],
    [7, { col: 1, row: 4 }],
    [8, { col: 2, row: 4 }],
    [9, { col: 3, row: 4 }]
]);

const LetterMap = new Map<number, { col: number, row: number }>([
    [0, { col: 0, row: 0 }],
    [1, { col: 1, row: 0 }],
    [2, { col: 2, row: 0 }],
    [3, { col: 3, row: 0 }],
    [4, { col: 4, row: 0 }],
    [5, { col: 5, row: 0 }],
    [6, { col: 6, row: 0 }],
    [7, { col: 7, row: 0 }],
    [8, { col: 0, row: 1 }],
    [9, { col: 1, row: 1 }],
    [10, { col: 2, row: 1 }],
    [11, { col: 3, row: 1 }],
    [12, { col: 4, row: 1 }],
    [13, { col: 5, row: 1 }],
    [14, { col: 6, row: 1 }],
    [15, { col: 7, row: 1 }],
    [16, { col: 0, row: 2 }],
    [17, { col: 1, row: 2 }],
    [18, { col: 2, row: 2 }],
    [19, { col: 3, row: 2 }],
    [20, { col: 4, row: 2 }],
    [21, { col: 5, row: 2 }],
    [22, { col: 6, row: 2 }],
    [23, { col: 7, row: 2 }],
    [24, { col: 0, row: 3 }],
    [25, { col: 1, row: 3 }]
]);

export enum TextAlignment {
    CENTER,
    LEFT,
    RIGHT
}

const COLOR_SHADOW = '#000000';

export class TextRenderer {
    private smallFont: HTMLImageElement;
    private smallFontColors: Map<string, HTMLCanvasElement> = new Map();

    constructor(private ctx: CanvasRenderingContext2D, colors: string[] = []) {
        const allColors = [COLOR_SHADOW, ...colors]
        this.smallFont = new Image();
        this.smallFont.src = 'assets/smallFont.png';
        if (this.smallFont.complete) {
            this.onImageLoaded(allColors);
        } else {
            this.smallFont.addEventListener('load', this.onImageLoaded.bind(this, allColors));
            this.smallFont.addEventListener('error', () => { throw Error(`Unable to load "${this.smallFont.src}"`) });
        }
    }

    text(x: number, y: number, text: string, color: string | undefined, alignment: TextAlignment, shadow: boolean = false) {
        const srcCanvas = this.smallFontColors.get(color?.toLowerCase() || '') || this.smallFont;
        const shadowCanvas = this.smallFontColors.get(COLOR_SHADOW) || this.smallFont;
        let x0 = x;
        if (alignment === TextAlignment.RIGHT) {
            x0 = x - text.length * CHAR_WIDTH - (text.length - 1) * CHAR_MARGIN;
        } else if (alignment === TextAlignment.CENTER) {
            x0 = x - Math.floor((text.length * CHAR_WIDTH + (text.length - 1) * CHAR_MARGIN) / 2);
        }
        for (let i = 0; i < text.length; i++) {
            const c = text.charCodeAt(i);
            const { srcX, srcY } = this.codeToCoords(c);
            const dstX = x0 + i * (CHAR_WIDTH + CHAR_MARGIN);

            if (shadow) {
                this.ctx.drawImage(shadowCanvas,
                    srcX, srcY, CHAR_WIDTH, CHAR_HEIGHT,
                    dstX + 1, y + 1, CHAR_WIDTH, CHAR_HEIGHT);
            }

            this.ctx.drawImage(srcCanvas,
                srcX, srcY, CHAR_WIDTH, CHAR_HEIGHT,
                dstX, y, CHAR_WIDTH, CHAR_HEIGHT);
        }
    }

    private onImageLoaded(colors: string[]) {
        colors.forEach(c => {
            this.smallFontColors.set(c.toLowerCase(), this.createColor(this.smallFont, c));
        });
    }

    private createColor(src: HTMLImageElement, color: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = src.width;
        canvas.height = src.height;
        const dstCtx = canvas.getContext("2d");
        if (!dstCtx) {
            throw Error('Unable to create CanvasRenderingContext2D');
        }
        dstCtx.drawImage(src, 0, 0);
        dstCtx.fillStyle = color;
        dstCtx.globalCompositeOperation = "multiply";
        dstCtx.fillRect(0, 0, canvas.width, canvas.height);
        dstCtx.globalCompositeOperation = "destination-in";
        dstCtx.drawImage(src, 0, 0);
        return canvas;
    }

    private codeToCoords(code: number): { srcX: number, srcY: number } {
        let c = code;
        if (c >= ASCII_SMALL_A && c <= ASCII_SMALL_A + ASCII_LETTERS) {
            c -= ASCII_SMALL_A - ASCII_BIG_A; // Convert to upper case
        }
        let col = 7;
        let row = 4;

        if (c >= ASCII_0 && c <= ASCII_0 + ASCII_NUMBERS) {
            c -= ASCII_0;
            ({ col, row } = NumberMap.get(c) || { col: 7, row: 4 });
        } else if (c >= ASCII_BIG_A && c <= ASCII_BIG_A + ASCII_LETTERS) {
            c -= ASCII_BIG_A;
            ({ col, row } = LetterMap.get(c) || { col: 7, row: 4 });
        } else if (c === 46) {
            col = 4;
            row = 4;
        } else if (c === 58) {
            col = 5;
            row = 4;
        } else if (c === 45) {
            col = 6;
            row = 4;
        }

        return { srcX: col * (CHAR_WIDTH + CHAR_MARGIN), srcY: row * (CHAR_HEIGHT + CHAR_MARGIN) };
    }
}