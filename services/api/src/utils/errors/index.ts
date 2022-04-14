interface ErrorWithMessage {
    message: string
}

interface ErrorWithReason {
    reason: {
        error: Error
    }
}

export const getErrorMessage = (error: unknown): string => {
    if (isErrorWithMessage(error)) return error.message

    if (isErrorWithReason(error)) {
        return error.reason.error.message
    }

    if (typeof error === 'object') {
        return JSON.stringify(error)
    }

    return `${error}`
}

export const isErrorWithReason = (error: unknown): error is ErrorWithReason => {
    const retypedErr = error as null | undefined | { reason?: { error: Error } } | Error

    if (
        retypedErr instanceof Error ||
        (retypedErr &&
            typeof retypedErr === 'object' &&
            'reason' in retypedErr &&
            typeof retypedErr.reason === 'object' &&
            retypedErr.reason.error instanceof Error)
    ) {
        return true
    }

    return false
}

export const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
    const retypedErr = error as
        | null
        | undefined
        | { message?: string }
        | Error
        | string
        | number
        | boolean

    if (
        retypedErr instanceof Error ||
        (retypedErr &&
            typeof retypedErr === 'object' &&
            'message' in retypedErr &&
            typeof retypedErr.message === 'string')
    ) {
        return true
    }

    return false
}

export const includesErrorCodes = (
    error: unknown,
    codesToCheck: string[],
): error is ErrorWithCode => {
    if (isErrorWithCode(error)) {
        return codesToCheck.includes(error.code)
    }

    return false
}

export class ErrorWithCode extends Error {
    constructor(public code: string) {
        super('')
    }
}

export const isErrorWithCode = (error: unknown): error is ErrorWithCode => {
    const retypedErr = error as null | undefined | { code?: string } | Error

    if (
        retypedErr instanceof Error ||
        (retypedErr && 'code' in retypedErr && typeof retypedErr.code === 'string')
    ) {
        return true
    }

    return false
}
