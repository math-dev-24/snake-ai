import { ref } from 'vue'
import type { LogEntry, LogLevel } from '@/types/logger'

export class LoggerService {
  private readonly logs = ref<LogEntry[]>([])

  constructor() {
    this.logs.value = []
  }

  log(message: string, level: LogLevel = 'info') {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
    }
    this.logs.value.push(entry)
  }

  getLogs(): LogEntry[] {
    return this.logs.value.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getLogsRef() {
    return this.logs
  }
}
