/* standard */
import { join } from 'path'
import { format as fmt } from 'util'

/* 3rd-party */
import flog from 'fancy-log'
import { DateTime } from 'luxon'

/* ................................................. */

export { fmt }

export const len = (a: any[] | string): number => a.length

export const log = (m: string, ...p: string[]): void => {
  flog(fmt('  '.concat(m), ...p))
}

export const now = (): string => DateTime.fromJSDate(new Date(), { zone: 'UTC' }).toISO()

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
    case '1': return st
    case '2': return nd
    case '3': return rd
    default: return th
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
