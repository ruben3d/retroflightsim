
export function formatBearing(n: number): string {
    return `00${(((n % 360) + 360) % 360).toFixed(0)}`.slice(-3);
}
