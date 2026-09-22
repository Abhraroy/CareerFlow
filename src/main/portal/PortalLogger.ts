import Logger from '@utils/logger'

export class PortalLogger {
  public static log(portalId: string, action: string, details?: string): void {
    const extra = details ? ` - ${details}` : ''
    Logger.info('PortalLogger.ts', 'log', `[${portalId}] ${action}${extra}`)
  }

  public static error(portalId: string, action: string, err: unknown): void {
    Logger.error('PortalLogger.ts', 'error', `[${portalId}] ${action}`, err)
  }
}
