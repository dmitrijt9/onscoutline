export type LoggerMessage = string | Record<string, unknown>

export enum LogLevel {
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
    Fatal = 'fatal',
    Debug = 'debug',
}

export interface ILogger {
    debug(message: LoggerMessage, context?: ApplicationContext): void
    info(message: LoggerMessage, context?: ApplicationContext): void
    warn(message: LoggerMessage | Error, context?: ApplicationContext): void
    error(message: LoggerMessage | Error, context?: ApplicationContext): void
    fatal(message: LoggerMessage | Error, context?: ApplicationContext): void
}

export interface ApplicationContext {
    request?: {
        id: string
        source: Record<string, string>
        data: Record<string, unknown> | string
    } & Record<string, unknown>
}
