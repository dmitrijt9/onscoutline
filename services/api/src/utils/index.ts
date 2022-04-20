export const sleep = async (time: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, time)
    })
}

export const isNil = <T>(value: T | null | undefined): value is null | undefined =>
    value === null || value === undefined
