import pino from 'pino'

const checkIsDev = (): boolean => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.IS_DEV === 'false' || process.env.isdev === 'false' || process.env.VITE_IS_DEV === 'false') {
      return false
    }
    if (process.env.IS_DEV === 'true' || process.env.IS_DEV === '1' || process.env.isdev === 'true' || process.env.isdev === '1') {
      return true
    }
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta?.env) {
      // @ts-ignore
      if (import.meta.env.VITE_IS_DEV === 'false') return false
      // @ts-ignore
      if (import.meta.env.VITE_IS_DEV === 'true' || import.meta.env.DEV) return true
    }
  } catch {
    // ignore
  }
  return process.env.NODE_ENV !== 'production'
}

const isDev = checkIsDev()

export const pinoInstance = pino({
  level: isDev ? 'debug' : 'silent',
  browser: {
    asObject: true
  }
})

function getCallerInfo(): { fileName: string; functionName: string } {
  try {
    const err = new Error()
    const stack = err.stack?.split('\n') || []
    for (let i = 1; i < stack.length; i++) {
      const line = stack[i]
      if (line && !line.includes('logger.ts') && !line.includes('logger.js')) {
        const match = line.match(/at (?:async )?(?:([^\s(]+) )?\(?(.*?):(\d+):(\d+)\)?/)
        if (match) {
          let funcName = match[1] || 'anonymous'
          funcName = funcName.replace(/^Object\./, '')
          const filePath = match[2] || ''
          const fileName = filePath.split(/[/\\]/).pop()?.split('?')[0] || 'unknown'
          return { fileName, functionName: funcName }
        }
      }
    }
  } catch {
    // fallback
  }
  return { fileName: 'unknown', functionName: 'anonymous' }
}

function parseLogArgs(
  arg1: string,
  arg2?: unknown,
  arg3?: unknown,
  arg4?: unknown
): { fileName: string; functionName: string; message: string; data?: unknown } {
  // Check if called as (fileName, functionName, message, data)
  if (typeof arg1 === 'string' && typeof arg2 === 'string' && typeof arg3 === 'string') {
    return {
      fileName: arg1,
      functionName: arg2,
      message: arg3,
      data: arg4
    }
  }

  // Check if called as (fileName, functionName, message) when 3 args passed where arg1 looks like a file name
  const isArg1FileName = typeof arg1 === 'string' && (/\.(ts|tsx|js|jsx)$/i.test(arg1) || arg1.includes('/') || arg1.includes('\\'))
  if (isArg1FileName && typeof arg2 === 'string') {
    return {
      fileName: arg1,
      functionName: arg2,
      message: typeof arg3 === 'string' ? arg3 : String(arg3 ?? ''),
      data: arg4 ?? (typeof arg3 !== 'string' ? arg3 : undefined)
    }
  }

  // Otherwise called as (message, data)
  const caller = getCallerInfo()
  return {
    fileName: caller.fileName,
    functionName: caller.functionName,
    message: arg1,
    data: arg2
  }
}

export class Logger {
  private static formatLog(level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG', fileName: string, functionName: string, message: string, data?: unknown) {
    const timestamp = new Date().toISOString()
    const logObj = {
      timestamp,
      level,
      fileName,
      functionName,
      message,
      ...(data !== undefined ? { data } : {})
    }

    if (isDev) {
      const extra = data !== undefined ? (typeof data === 'object' ? ` | Data: ${JSON.stringify(data)}` : ` | Data: ${data}`) : ''
      const cleanFormatted = `[${timestamp}] [${level}] [${fileName} -> ${functionName}]: ${message}${extra}`

      if (level === 'ERROR') {
        pinoInstance.error(logObj, cleanFormatted)
      } else if (level === 'WARN') {
        pinoInstance.warn(logObj, cleanFormatted)
      } else if (level === 'DEBUG') {
        pinoInstance.debug(logObj, cleanFormatted)
      } else {
        pinoInstance.info(logObj, cleanFormatted)
      }
    }
  }

  public static info(arg1: string, arg2?: unknown, arg3?: unknown, arg4?: unknown): void {
    if (!isDev) return
    const { fileName, functionName, message, data } = parseLogArgs(arg1, arg2, arg3, arg4)
    Logger.formatLog('INFO', fileName, functionName, message, data)
  }

  public static error(arg1: string, arg2?: unknown, arg3?: unknown, arg4?: unknown): void {
    if (!isDev) return
    const { fileName, functionName, message, data } = parseLogArgs(arg1, arg2, arg3, arg4)
    Logger.formatLog('ERROR', fileName, functionName, message, data)
  }

  public static warn(arg1: string, arg2?: unknown, arg3?: unknown, arg4?: unknown): void {
    if (!isDev) return
    const { fileName, functionName, message, data } = parseLogArgs(arg1, arg2, arg3, arg4)
    Logger.formatLog('WARN', fileName, functionName, message, data)
  }

  public static debug(arg1: string, arg2?: unknown, arg3?: unknown, arg4?: unknown): void {
    if (!isDev) return
    const { fileName, functionName, message, data } = parseLogArgs(arg1, arg2, arg3, arg4)
    Logger.formatLog('DEBUG', fileName, functionName, message, data)
  }

  public static log(arg1: string, arg2?: unknown, arg3?: unknown, arg4?: unknown): void {
    Logger.info(arg1, arg2, arg3, arg4)
  }
}

export default Logger
