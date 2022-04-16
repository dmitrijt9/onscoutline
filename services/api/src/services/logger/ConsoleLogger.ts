import { AppConfig } from '../../dependency/config/index'
import { getErrorMessage } from '../../utils/errors/index'
import { ApplicationContext, ILogger, LoggerMessage, LogLevel } from './ILogger'

export const LOG_LEVEL_VERBOSITY: Record<LogLevel, number> = {
    [LogLevel.Debug]: 4,
    [LogLevel.Info]: 3,
    [LogLevel.Warn]: 2,
    [LogLevel.Error]: 1,
    [LogLevel.Fatal]: 0,
}

export class ConsoleLogger implements ILogger {
    private config: AppConfig

    constructor(config: AppConfig) {
        this.config = config
    }

    debug(message: LoggerMessage) {
        if (!this.isLogLevelEnabled(LogLevel.Debug)) {
            return
        }
        console.debug(this.prepareLogMessage(message, LogLevel.Debug))
    }

    info(message: LoggerMessage) {
        if (!this.isLogLevelEnabled(LogLevel.Info)) {
            return
        }
        console.info(this.prepareLogMessage(message, LogLevel.Info))
    }

    warn(message: LoggerMessage, context?: ApplicationContext) {
        if (!this.isLogLevelEnabled(LogLevel.Warn)) {
            return
        }
        const logMessage = this.prepareLogMessage(message, LogLevel.Warn)
        console.warn(logMessage)
    }

    error(message: LoggerMessage, context?: ApplicationContext) {
        if (!this.isLogLevelEnabled(LogLevel.Error)) {
            return
        }

        const logMessage = this.prepareLogMessage(message, LogLevel.Error)
        console.error(logMessage)
    }

    fatal(message: LoggerMessage, context?: ApplicationContext) {
        if (!this.isLogLevelEnabled(LogLevel.Fatal)) {
            return
        }

        const logMessage = this.prepareLogMessage(message, LogLevel.Fatal)
        console.error(logMessage)
    }

    private isLogLevelEnabled(logLevelToCheck: LogLevel) {
        return (
            LOG_LEVEL_VERBOSITY[logLevelToCheck] <=
            LOG_LEVEL_VERBOSITY[this.config.logger.level as LogLevel]
        )
    }

    private prepareLogMessage(
        message: string | Record<string, unknown> | Error,
        logLevel: LogLevel,
    ) {
        const stringifiedMessage: string =
            typeof message === 'string' ? message : getErrorMessage(message)
        const logLevelUppercased = logLevel.toUpperCase()
        return `[${logLevelUppercased}] ${stringifiedMessage}`
    }
}
