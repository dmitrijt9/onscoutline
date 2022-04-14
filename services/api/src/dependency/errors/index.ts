export interface IBaseErrorDescription {
    message: string
    payload?: any
    fingerprint?: string
}

export abstract class BaseError extends Error {
    name: string
    payload: any
    fingerprint?: string
    constructor({ message, payload, fingerprint }: IBaseErrorDescription) {
        super(message)
        this.getErrorName()
        this.payload = payload ?? {}
        this.fingerprint = fingerprint
        Error.captureStackTrace(this, BaseError)
    }
    getErrorName() {
        this.name = this.constructor.name
    }
}

/**
 * This error should be used when the application cannot continue with the current process.
 */
export class SevereError extends BaseError {}

export class UnexpectedError extends SevereError {}
