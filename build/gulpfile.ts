/* standard */
import fs from 'fs'
import { exec } from 'child_process'
import { extname, basename, dirname, join, resolve } from 'path'
import { Stream, Transform } from 'stream'

/* 3rd-party */
import del from 'del'
import yaml from 'yaml'
import slugify from 'slugify'
import merge from 'merge-stream'
import Vinyl from 'vinyl'
import { DateTime } from 'luxon'

import tap from 'gulp-tap'
import babel from 'gulp-babel'
import uglify from 'gulp-uglify'
import pug from 'gulp-pug'
import header from 'gulp-header'
import { task, series, src as from, dest as to } from 'gulp'

// @ts-expect-error
import flatmap from 'gulp-flatmap'

// @ts-expect-error
import { pipeline as pipe } from 'readable-stream'

/* modules */
import { build as autoindex } from './autoindex'
import { joinSafe, globAll, strFallback, getNumberSuffix, now, fmt, log } from './util'

/* ................................................. */

interface IRelevantDirs {
  src: string
  dist: string
  intermediate: string
  files: string
}

interface IBlogPostFiles {
  _d: DateTime
  title: string
  date: string
  url: string
}

interface IPugRenderExtra {
  [k: string]: any
}

/* ................................................. */

const rootDir = resolve(__dirname, '..', '..')

const siteConfig = (() => {
  const d = fs.readFileSync(join(rootDir, '_config.yml'), 'utf-8')
  const c = yaml.parse(d)

  if (process.env.JEKYLL_ENV !== 'production') {
    c.url = 'http://localhost:4000'
  }

  return c
})()

const p = ((): IRelevantDirs => {
  const src = join(rootDir, 'www')
  const dist = join(rootDir, 'dist')

  return {
    src,
    dist,
    intermediate: join(dist, 'intermediate'),
    files: join(src, 'files')
  }
})()

const sourceDir = (...f: string[]): string => globAll(joinSafe(p.src, ...f))
const intermediateDir = (...f: string[]): string => joinSafe(p.intermediate, ...f)
const publicFiles = globAll(join(p.dist, 'public'))

const yamlStart = ['---', '---', '', ''].join('\n')

process.env.JEKYLL_ENV = 'production'

/* ................................................. */

const buildPug = (basedir: string, extras: IPugRenderExtra): Transform =>
  pug({
    basedir,
    locals: {
      _data: Object.assign({}, extras),
      _site: siteConfig,
      _func: { now, fmt, strFallback, slugify }
    }
  })

const readPostDir = (location: string): IBlogPostFiles[] =>
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

const run =
  (cmd: string, showOutput = true) =>
    (callback: (e: any) => void) =>
      exec(cmd, { cwd: rootDir }, (err, stdout, stderr) => {
        if (showOutput || err != null) {
          log('STDOUT')
          log('  %s', stdout)
          log('STDERR')
          log('  %s', stderr)
        }

        callback(err)
      })

const renderPugFiles = (basedir: string, extras: IPugRenderExtra): Transform =>
  flatmap((stream: Stream, file: Vinyl) => {
    log('Writing "%s"', file.path.replace(basedir, '').replace('.pug', '.html'))

    const htmlContent = stream.pipe(buildPug(basedir, extras))
    switch (basename(dirname(file.path))) {
      case '_includes':
      case '_layouts':
        return htmlContent

      default:
        return htmlContent.pipe(header(yamlStart))
    }
  })

/* ................................................. */

const preJekyllBuildSteps = [
  'clean:dist',
  'clean:files',
  'build:autoindex',
  'build:pug',
  'build:js',
  'copy:all'
]

const copyAll = (...d: string[]): Transform =>
  pipe(from(sourceDir(...d)), to(intermediateDir(...d)))

task('debug', async () => {
  log('src: "%s"', p.src)
  log('dist: "%s"', p.dist)
  log('intermediate: "%s"', p.intermediate)
  log('files: "%s"', p.files)
  log('publicFiles: "%s"', publicFiles)
})

task('clean:dist', async () => await del(p.dist, { force: true }))
task('clean:files', async () => await del(p.files, { force: true }))

task('clean:left-overs', () =>
  pipe(
    from(publicFiles),
    tap((file) => {
      switch (extname(file.path).substring(1).toLowerCase()) {
        case 'sass':
          del.sync(file.path, { force: true })
          log('Deleted "%s"', file.path.replace(p.dist, ''))
          break
      }
    })
  )
)

task('clean:all', series('clean:dist', 'clean:files', 'clean:left-overs'))

task('copy:all', () =>
  merge(
    copyAll('blog'),
    copyAll('assets', 'css'),
    copyAll('assets', 'fonts'),
    copyAll('assets', 'imgs')
  )
)

task('build:jekyll', run('bundle exec jekyll build --trace', false))

task('build:autoindex', async () => await autoindex(p.files, 'caian-org'))

task('build:js', () =>
  pipe(
    from(sourceDir('assets', 'js')),
    babel({ presets: ['@babel/preset-env'] }),
    uglify(),
    to(intermediateDir('assets', 'js'))
  )
)

task('build:pug', () =>
  pipe(
    from(globAll(p.src, 'pug')),
    renderPugFiles(p.src, {
      thoughts: readPostDir(join(p.src, 'geo', 'thoughts'))
    }),
    to(p.intermediate)
  )
)

task('prepare', series(...preJekyllBuildSteps))
task('build', series(...preJekyllBuildSteps, 'build:jekyll', 'clean:left-overs'))
