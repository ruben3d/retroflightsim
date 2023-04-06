import { assertIsDefined } from "../../utils/asserts";

export enum TextAlignment {
    CENTER,
    LEFT,
    RIGHT
}

export enum TextEffect {
    NONE,
    SHADOW,
    BACKGROUND
}

enum FontCategory {
    HUD
}

export class Font {
    static readonly HUD_SMALL = new Font('HUD_SMALL', FontCategory.HUD, 'assets/font-hud-small.png', 3, 5, 1);
    static readonly HUD_MEDIUM = new Font('HUD_MEDIUM', FontCategory.HUD, 'assets/font-hud-medium.png', 5, 8, 1);
    static readonly HUD_LARGE = new Font('HUD_LARGE', FontCategory.HUD, 'assets/font-hud-large.png', 7, 11, 1);

    readonly id: string;
    readonly category: FontCategory;
    readonly atlas: string;
    readonly charWidth: number;
    readonly charHeight: number;
    readonly charSpacing: number;

    private constructor(id: string, category: FontCategory, atlas: string, charWidth: number, charHeight: number, charSpacing: number) {
        this.id = id;
        this.category = category;
        this.atlas = atlas;
        this.charWidth = charWidth;
        this.charHeight = charHeight;
        this.charSpacing = charSpacing;
    }
}

interface FontHandle {
    font: Font;
    source: HTMLImageElement;
    colors: Map<string, HTMLCanvasElement>;
}

const ASCII_0 = 48;
const ASCII_BIG_A = 65;
const ASCII_SMALL_A = 97;
const ASCII_LETTERS = 26;
const ASCII_NUMBERS = 10;
const FONT_CHAR_PADDING = 1;

const HUDFontNumberMap = new Map<number, { col: number, row: number }>([
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

const HUDFontLetterMap = new Map<number, { col: number, row: number }>([
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

export class TextRenderer {
    private handles: Map<string, FontHandle>;

    constructor(private ctx: CanvasRenderingContext2D, colors: string[] = []) {
        const allColors = [...colors];
        this.handles = new Map([
            [Font.HUD_SMALL.id, this.buildFontHandle(Font.HUD_SMALL, allColors)],
            [Font.HUD_MEDIUM.id, this.buildFontHandle(Font.HUD_MEDIUM, allColors)],
            [Font.HUD_LARGE.id, this.buildFontHandle(Font.HUD_LARGE, allColors)]
        ]);
    }

    private buildFontHandle(font: Font, colors: string[]): FontHandle {
        const handle: FontHandle = {
            font: font,
            source: new Image(),
            colors: new Map()
        };
        handle.source.src = font.atlas;
        if (handle.source.complete) {
            this.onImageLoaded(handle, colors);
        } else {
            handle.source.addEventListener('load', this.onImageLoaded.bind(this, handle, colors));
            handle.source.addEventListener('error', () => { throw Error(`Unable to load "${handle.font.atlas}"`) });
        }
        return handle;
    }

    text(font: Font, x: number, y: number, text: string, color: string | undefined, alignment: TextAlignment, effect: TextEffect = TextEffect.NONE, effectColor: string = '') {
        const h = this.handles.get(font.id);
        assertIsDefined(h);
        const charWidth = h.font.charWidth;
        const charHeight = h.font.charHeight;
        const charSpacing = h.font.charSpacing;
        const srcCanvas = h.colors.get(color?.toLowerCase() || '') || h.source;
        let x0 = x;
        if (alignment === TextAlignment.RIGHT) {
            x0 = x - text.length * charWidth - (text.length - 1) * charSpacing;
        } else if (alignment === TextAlignment.CENTER) {
            x0 = x - Math.floor((text.length * charWidth + (text.length - 1) * charSpacing) / 2);
        }

        if (effect === TextEffect.BACKGROUND) {
            this.ctx.fillStyle = effectColor;
            this.ctx.fillRect(x0 - 1, y - 1, text.length * (charWidth + charSpacing) + 1, charHeight + 2);
        }

        for (let i = 0; i < text.length; i++) {
            const c = text.charCodeAt(i);
            const { srcX, srcY } = this.codeToCoords(c, charWidth, charHeight);
            const dstX = x0 + i * (charWidth + charSpacing);

            if (effect === TextEffect.SHADOW) {
                const shadowCanvas = h.colors.get(effectColor) || h.source;
                this.ctx.drawImage(shadowCanvas,
                    srcX, srcY, charWidth, charHeight,
                    dstX + 1, y + 1, charWidth, charHeight);
            }

            this.ctx.drawImage(srcCanvas,
                srcX, srcY, charWidth, charHeight,
                dstX, y, charWidth, charHeight);
        }
    }

    private onImageLoaded(handle: FontHandle, colors: string[]) {
        colors.forEach(c => {
            handle.colors.set(c.toLowerCase(), this.createColor(handle.source, c));
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

    private codeToCoords(code: number, charWidth: number, charHeight: number): { srcX: number, srcY: number } {
        let c = code;
        if (c >= ASCII_SMALL_A && c <= ASCII_SMALL_A + ASCII_LETTERS) {
            c -= ASCII_SMALL_A - ASCII_BIG_A; // Convert to upper case
        }
        let col = 7;
        let row = 4;

        if (c >= ASCII_0 && c <= ASCII_0 + ASCII_NUMBERS) {
            c -= ASCII_0;
            ({ col, row } = HUDFontNumberMap.get(c) || { col: 7, row: 4 });
        } else if (c >= ASCII_BIG_A && c <= ASCII_BIG_A + ASCII_LETTERS) {
            c -= ASCII_BIG_A;
            ({ col, row } = HUDFontLetterMap.get(c) || { col: 7, row: 4 });
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

        return { srcX: col * (charWidth + FONT_CHAR_PADDING), srcY: row * (charHeight + FONT_CHAR_PADDING) };
    }
}