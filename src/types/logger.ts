export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogEntry = {
  timestamp: Date
  level: LogLevel
  message: string
}
