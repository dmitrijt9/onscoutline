export const isNil = <T>(value: T | null | undefined): value is null | undefined =>
    value === null || value === undefined
