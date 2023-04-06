import * as THREE from 'three';
import { CanvasPainter } from './canvasPainter';
import { Font, TextAlignment } from './text';

const tmpArray4: number[] = new Array(4);

export function debugDisplayMatrix4(font: Font, painter: CanvasPainter, x: number, y: number, m: THREE.Matrix4, precision: number): void {
    const longest = getLongest(m.elements);
    const baseX = getBaseX(x, longest, font.charWidth, font.charSpacing);
    const stride = (longest + 1 + precision + 1) * (font.charWidth + font.charSpacing);

    const ROWS = 4;
    const COLS = 4;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const n = m.elements[row + col * ROWS];
            const dx = col * stride;
            const dy = row * (font.charHeight + font.charSpacing);
            debugDisplayFloat(font, painter, baseX + dx, y + dy, n, precision);
        }
    }
}

export function debugDisplayVectorCol(font: Font, painter: CanvasPainter, x: number, y: number, v: THREE.Vector3 | THREE.Vector4, precision: number): void {
    const elements = v.toArray(tmpArray4);
    const longest = getLongest(elements);
    const baseX = getBaseX(x, longest, font.charWidth, font.charSpacing);

    const size = 'w' in v ? 4 : 3;
    for (let i = 0; i < size; i++) {
        const n = elements[i];
        const dy = i * (font.charHeight + font.charSpacing);
        debugDisplayFloat(font, painter, baseX, y + dy, n, precision);
    }
}

// Position relative to decimal point
export function debugDisplayFloat(font: Font, painter: CanvasPainter, x: number, y: number, n: number, precision: number): void {
    let int = Math.abs(Math.trunc(n));
    const fract = Math.abs(n) - int;
    const fractStr = fract.toFixed(precision);
    if (!fractStr.includes('0.')) {
        int = int + 1;
    }
    painter.text(font, x, y, (n < 0 ? '-' : '') + int.toString() + '.', undefined, TextAlignment.RIGHT);
    painter.text(font, x, y, fractStr.substring(2) || '0', undefined, TextAlignment.LEFT);
}

function getBaseX(x: number, longest: number, charWidth: number, charSpacing: number): number {
    return x + longest * (charWidth + charSpacing);
}

function getLongest(ns: number[]): number {
    let longest = 0;
    for (let i = 0; i < ns.length; i++) {
        const l = Math.trunc(ns[i]).toString().length;
        longest = Math.max(longest, l);
    }
    return longest
}