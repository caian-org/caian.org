/* standard */
import { join } from 'path'
import { format as fmt, promisify } from 'util'
import { exec } from 'child_process'

/* 3rd-party */
import flog from 'fancy-log'
import chalk from 'chalk'
import { DateTime } from 'luxon'

/* ................................................. */

interface ICommandRun {
  cmd: string
  showOutput?: boolean
  cwd?: string
}

const execAsync = promisify(exec)

export { fmt, promisify }

export const len = (a: any[] | string): number => a.length

export const now = (): string => DateTime.fromJSDate(new Date(), { zone: 'UTC' }).toISO()

export const log = (m: string, ...p: string[]): void => {
  flog(fmt(indent(m, 2), ...p))
}

export const prepend = (text: string, val: string): string =>
  text
    .split('\n')
    .map((t) => val.concat(t))
    .join('\n')

export const indent = (text: string, level: number): string => prepend(text, ' '.repeat(level))

export const strFallback = (s: string | undefined): string =>
  typeof s === 'string' && len(s.trim()) > 0 ? s : '???'

export const globAll = (d: string, ext: string | null = null): string =>
  join(d, '**', '*'.concat(ext === null ? '' : '.'.concat(ext)))

export const fmtFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const dm = Number(decimals < 0 ? 0 : decimals)
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return fmt('%s %s', parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toString(), sizes[i])
}

export const getNumberSuffix = (n: number): string => {
  const th = 'th'
  const rd = 'rd'
  const nd = 'nd'
  const st = 'st'

  if (n === 11 || n === 12 || n === 13) {
    return th
  }

  switch (n.toString().slice(-1)) {
    case '1':
      return st
    case '2':
      return nd
    case '3':
      return rd
    default:
      return th
  }
}

export const joinSafe = (...s: string[]): string =>
  join(
    ...s.map((v) => {
      switch (typeof v) {
        case 'string':
        case 'number':
        case 'bigint':
        case 'boolean':
          return v.toString()

        default:
          return ''
      }
    })
  )

export const runCmd =
  (c: ICommandRun) =>
    async (cb: (e: any) => void): Promise<void> => {
      const cwd = typeof c.cwd === 'string' ? c.cwd : __dirname
      const { stdout, stderr } = await execAsync(c.cmd, { cwd })
      const err = len(stderr) > 0 ? new Error(stderr) : undefined

      const p = chalk.dim('|  ')

      if (c.showOutput === true) {
        log(fmt('Output of "%s":', chalk.yellowBright(c.cmd)))
        log(p)
        prepend(stdout, p)
          .split('\n')
          .forEach((t) => log(t))
      }

      cb(err)
    }
