const CHAR_WIDTH = 3;
const CHAR_HEIGHT = 5;
const CHAR_MARGIN = 1;

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
    LEFT,
    RIGHT
}

export class TextRenderer {
    private smallFont: HTMLImageElement;

    constructor(private ctx: CanvasRenderingContext2D) {
        this.smallFont = new Image();
        this.smallFont.src = 'assets/smallFont.png';
    }

    text(x: number, y: number, text: string, alignment: TextAlignment) {
        const x0 = alignment === TextAlignment.LEFT ? x : x - text.length * CHAR_WIDTH - (text.length - 1) * CHAR_MARGIN;
        for (let i = 0; i < text.length; i++) {
            const c = text.charCodeAt(i);
            const { srcX, srcY } = this.codeToCoords(c);
            this.ctx.drawImage(this.smallFont,
                srcX, srcY, CHAR_WIDTH, CHAR_HEIGHT,
                x0 + i * (CHAR_WIDTH + CHAR_MARGIN), y, CHAR_WIDTH, CHAR_HEIGHT);
        }
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