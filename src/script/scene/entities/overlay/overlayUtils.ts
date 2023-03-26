
export function formatHeading(n: number): string {
    return `00${(((n % 360) + 360) % 360).toFixed(0)}`.slice(-3);
}

export function toFeet(meters: number): number {
    return meters * 3.28084;
}

export function toKnots(metersPerSecond: number): number {
    return metersPerSecond * 1.94384;
}
