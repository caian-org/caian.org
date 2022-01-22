/* standard */
import fs from 'fs'
import { basename, join } from 'path'
import { format as fmt, promisify } from 'util'
import { exec } from 'child_process'

/* 3rd-party */
import _ from 'lodash'
import del from 'del'
import yaml from 'yaml'
import flog from 'fancy-log'
import chalk from 'chalk'
import { DateTime } from 'luxon'

interface IBlogPostFiles {
  _d: DateTime
  title: string
  date: string
  url: string
}

interface ICommandRun {
  cmd: string
  showOutput?: boolean
  cwd?: string
}

interface IRelevantDirs {
  src: string
  dist: string
  intermediate: string
  pub: string
  files: string
}

const execAsync = promisify(exec)

/* ............................................................................ */

export type TaskCallback = (e: any) => void

export const len = (a: any[] | string): number => a.length

export const now = (): string => DateTime.fromJSDate(new Date(), { zone: 'UTC' }).toISO()

export const prepend = (text: string, val: string): string =>
  text
    .split('\n')
    .map((t) => val.concat(t))
    .join('\n')

export const indent = (text: string, level: number): string => prepend(text, ' '.repeat(level))

export const log = (m: string, ...p: string[]): void => {
  flog(fmt(indent(m, 2), ...p))
}

export const strFallback = (s: string | undefined): string =>
  typeof s === 'string' && len(s.trim()) > 0 ? s : '???'

export const globAll = (d: string, ext: string | null = null): string =>
  join(d, '**', '*'.concat(ext === null ? '' : '.'.concat(ext)))

export const rm = (f: string | string[]) => (cb: TaskCallback) => {
  del(f, { force: true })
    .then(() => cb(undefined))
    .catch((e) => cb(e))
}

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
    async (cb: TaskCallback): Promise<void> => {
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

export const readPostDir = (location: string): IBlogPostFiles[] =>
  fs
    .readdirSync(location)
    .filter((f) => basename(f) !== 'index.pug')
    .map((f) => {
      const name = basename(f).replace('.pug', '')

      const date = DateTime.fromISO(name.substring(0, 10))
      const dfmt = fmt("MMMM d'%s,' yyyy", getNumberSuffix(date.day))

      return {
        _d: date,
        title: name.substring(10).replaceAll('-', ' '),
        date: date.toFormat(dfmt),
        url: name.concat('.html')
      }
    })
    .sort((a, b) => b._d.toMillis() - a._d.toMillis())

export const readSiteConfig = (rootDir: string): any => {
  const d = fs.readFileSync(join(rootDir, '_config.yml'), 'utf-8')
  const c = yaml.parse(d)

  if (process.env.JEKYLL_ENV !== 'production') {
    c.url = 'http://localhost:4000'
  }

  return c
}

export const getRelevantDirectories = (rootDir: string): IRelevantDirs => {
  const src = join(rootDir, 'www')
  const dist = join(rootDir, 'dist')
  const intermediate = join(dist, 'intermediate')

  return {
    src,
    dist,
    intermediate,
    pub: join(dist, 'public'),
    files: join(src, 'files')
  }
}

export const countChar = (t: string, c: string): number => _.countBy(t)[c]

export { fmt, promisify }
