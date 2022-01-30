
export function assertExpr(value: boolean, message?: string): asserts value {
    if (value !== true) {
        throw new Error(message);
    }
}

export function assertIsDefined<T>(value: T, message?: string): asserts value is NonNullable<T> {
    if (value === undefined || value === null) {
        throw new Error(message);
    }
}
