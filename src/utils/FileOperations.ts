import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { EMBEDDED_PROMPTS } from '../prompts/embeddedPrompts'
import Logger from './logger'

import { RESUMES_STORAGE_DIR } from './config'
export * from './config'

/**
 * Resolves the writable storage directory for the application.
 * In packaged Electron apps, uses app.getPath('userData')/storage to guarantee
 * write permissions across any user's OS without requiring administrative privileges.
 * In development mode or non-Electron contexts, uses <cwd>/storage for easy local inspection.
 */
export function getStorageDir(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const electron = require('electron')
    const app = electron?.app || electron?.remote?.app
    if (app && typeof app.getPath === 'function' && app.isPackaged) {
      return path.join(app.getPath('userData'), 'storage')
    }
  } catch {
    // Outside Electron or in tests
  }
  return path.resolve(process.cwd(), 'storage')
}

/**
 * General storage directory location.
 */
export const STORAGE_DIR = getStorageDir()

/**
 * Prompts directory location.
 * Resolves to the 'src/prompts' folder.
 */
export const PROMPTS_DIR = path.resolve(process.cwd(), 'src', 'prompts')

/**
 * Resolves the absolute path for a prompt file inside the src/prompts directory.
 * Checks multiple candidates for robust resolution across dev and bundle environments.
 */
export function getPromptPath(filename: string): string {
  const basename = path.basename(filename)

  // Dynamic detection of Electron resources
  let resourcesPath = ''
  let appPath = ''
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const electron = require('electron')
    const app = electron?.app || electron?.remote?.app
    if (app && typeof app.getAppPath === 'function') {
      appPath = app.getAppPath()
    }
  } catch {
    // Ignore
  }

  if (typeof process !== 'undefined' && (process as any).resourcesPath) {
    resourcesPath = (process as any).resourcesPath
  }

  const candidates = [
    // Production packaged resources
    ...(resourcesPath
      ? [
          path.resolve(resourcesPath, 'prompts', basename),
          path.resolve(resourcesPath, basename)
        ]
      : []),
    ...(appPath
      ? [
          path.resolve(appPath, 'resources', 'prompts', basename),
          path.resolve(appPath, 'out', 'prompts', basename)
        ]
      : []),
    // User-customized prompts in userData/storage
    path.resolve(getStorageDir(), 'prompts', basename),
    // Development and local project candidates
    path.resolve(process.cwd(), 'resources', 'prompts', basename),
    path.resolve(PROMPTS_DIR, basename),
    path.resolve(process.cwd(), 'src', 'prompts', basename),
    path.resolve(__dirname, '../../resources/prompts', basename),
    path.resolve(__dirname, '../../src/prompts', basename),
    path.resolve(__dirname, '../prompts', basename)
  ]

  for (const candidate of candidates) {
    if (candidate && fsSync.existsSync(candidate)) {
      return candidate
    }
  }

  return path.resolve(PROMPTS_DIR, basename)
}

/**
 * Gets the absolute path for a file inside the storage folder.
 * Ensures the path stays safely within the storage directory,
 * or redirects prompts/* paths to getPromptPath.
 *
 * @param filename - Name or relative path of the file inside storage.
 * @returns Absolute path to the target file.
 */
export function getStoragePath(filename?: string): string {
  const baseDir = getStorageDir()
  if (!filename) {
    return baseDir
  }
  if (filename.startsWith('prompts/') || filename.startsWith('prompts\\')) {
    return getPromptPath(filename)
  }
  const resolvedPath = path.resolve(baseDir, filename)
  const rel = path.relative(baseDir, resolvedPath)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Access outside storage directory is denied: ${filename}`)
  }
  return resolvedPath
}

/**
 * Ensures that the storage directory (and any specified sub-directory) exists.
 */
export async function ensureStorageDirExists(dirPath?: string): Promise<void> {
  const targetDir = dirPath || getStorageDir()
  await fs.mkdir(targetDir, { recursive: true })
}

/**
 * Writes data to a file in the storage directory.
 *
 * @param filename - Name of the file inside the storage folder (e.g., 'data.json', 'resume.txt').
 * @param content - Text content, Buffer, or JavaScript object/array (auto-serialized to formatted JSON).
 * @param encoding - File encoding (default: 'utf-8').
 * @returns Promise resolving to the absolute file path of the written file.
 */
export async function writeToFile(
  filename: string,
  content: unknown,
  encoding: BufferEncoding = 'utf-8'
): Promise<string> {
  if (!filename) {
    throw new Error('Filename is required for write operation.')
  }

  const filePath = getStoragePath(filename)
  const dirPath = path.dirname(filePath)

  await ensureStorageDirExists(dirPath)

  let dataToWrite: string | Buffer
  if (typeof content === 'string' || content instanceof Buffer) {
    dataToWrite = content
  } else {
    dataToWrite = JSON.stringify(content, null, 2)
  }

  await fs.writeFile(filePath, dataToWrite, { encoding })
  return filePath
}

/**
 * Alias for writeToFile. Writes data to a file inside the storage directory.
 */
export const writeFile = writeToFile

/**
 * Reads content from a file in the storage directory.
 *
 * @param filename - Name of the file inside the storage folder.
 * @param encoding - File encoding (default: 'utf-8').
 * @returns Promise resolving to the text content of the file.
 */
export async function readFromFile(
  filename: string,
  encoding: BufferEncoding = 'utf-8'
): Promise<string> {
  if (!filename) {
    throw new Error('Filename is required for read operation.')
  }

  const filePath = getStoragePath(filename)

  try {
    return await fs.readFile(filePath, { encoding })
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      throw new Error(`File not found in storage: ${filename}`)
    }
    throw error
  }
}

/**
 * Alias for readFromFile. Reads content from a file inside the storage directory.
 */
export const readFile = readFromFile

/**
 * Reads content from a prompt file in the src/prompts directory.
 *
 * @param filename - Name or relative path of the prompt file (e.g. 'system_prompt.txt').
 * @param encoding - File encoding (default: 'utf-8').
 * @returns Promise resolving to the text content of the prompt file.
 */
export async function readPromptFile(
  filename: string,
  encoding: BufferEncoding = 'utf-8'
): Promise<string> {
  if (!filename) {
    throw new Error('Filename is required for readPromptFile operation.')
  }

  const basename = path.basename(filename)

  try {
    const filePath = getPromptPath(filename)
    if (fsSync.existsSync(filePath)) {
      return await fs.readFile(filePath, { encoding })
    }
  } catch (error) {
    Logger.warn('FileOperations.ts', 'readPromptFile', `Failed reading prompt file from disk: ${filename}`, error)
  }

  // Safe fallback to embedded prompts so the app never fails on missing disk files
  if (basename in EMBEDDED_PROMPTS) {
    return EMBEDDED_PROMPTS[basename]
  }

  throw new Error(`Prompt file not found: ${filename}`)
}

/**
 * Reads and parses JSON content from a file in the storage directory.
 *
 * @param filename - Name of the JSON file inside the storage folder.
 * @returns Promise resolving to the parsed JSON data object.
 */
export async function readJsonFromFile<T = unknown>(filename: string): Promise<T> {
  const content = await readFromFile(filename, 'utf-8')
  return JSON.parse(content) as T
}

/**
 * Checks if a file exists inside the storage directory.
 *
 * @param filename - Name of the file inside the storage folder.
 * @returns Promise resolving to true if file exists, false otherwise.
 */
export async function fileExists(filename: string): Promise<boolean> {
  if (!filename) return false
  const filePath = getStoragePath(filename)
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Deletes a file from the storage directory.
 *
 * @param filename - Name of the file inside the storage folder.
 * @returns Promise resolving to true if deleted successfully, false if the file did not exist.
 */
export async function deleteFile(filename: string): Promise<boolean> {
  if (!filename) return false
  const filePath = getStoragePath(filename)
  try {
    await fs.unlink(filePath)
    return true
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

/**
 * Lists all file names currently in the storage directory.
 *
 * @returns Promise resolving to an array of file names inside the storage folder.
 */
export async function listStorageFiles(): Promise<string[]> {
  const dir = getStorageDir()
  await ensureStorageDirExists(dir)
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
}

/**
 * Lists all structured resume JSON files currently in the storage/resumes directory.
 *
 * @returns Promise resolving to an array of resume file names (e.g. ['id.json']).
 */
export async function listResumeFiles(): Promise<string[]> {
  const dir = getStorageDir()
  const resumesDir = path.resolve(dir, RESUMES_STORAGE_DIR)
  await ensureStorageDirExists(resumesDir)
  const entries = await fs.readdir(resumesDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
}

