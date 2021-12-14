/* standard */
import fs from 'fs'
import { extname, basename, dirname, join, resolve } from 'path'
import { Stream, Transform } from 'stream'

/* 3rd-party */
import del from 'del'
import yaml from 'yaml'
import slugify from 'slugify'
import merge from 'merge-stream'
import Vinyl from 'vinyl'
import autoprefixer from 'autoprefixer'
import { DateTime } from 'luxon'

import tap from 'gulp-tap'
import babel from 'gulp-babel'
import uglify from 'gulp-uglify'
import pug from 'gulp-pug'
import header from 'gulp-header'
import postcss from 'gulp-postcss'
import { task, series, src as from, dest as to } from 'gulp'

// @ts-expect-error
import flatmap from 'gulp-flatmap'

// @ts-expect-error
import { pipeline as pipe } from 'readable-stream'

/* modules */
import autoindex from './autoindex'
import { fmt, log, now, joinSafe, globAll, strFallback, getNumberSuffix, runCmd } from './util'

/* ................................................. */

interface IRelevantDirs {
  src: string
  dist: string
  intermediate: string
  pub: string
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

const rootDir = resolve(__dirname, '..')

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
    pub: join(dist, 'public'),
    files: join(src, 'files')
  }
})()

const intermediateDir = (...f: string[]): string => joinSafe(p.intermediate, ...f)
const sourceDirFiles = (...f: string[]): string => globAll(joinSafe(p.src, ...f))
const publicDirFiles = (...f: string[]): string => globAll(joinSafe(p.pub, ...f))

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

const renderPugFiles = (extras: IPugRenderExtra): Transform =>
  flatmap((stream: Stream, file: Vinyl) => {
    log('Writing "%s"', file.path.replace(p.src, '').replace('.pug', '.html'))

    const htmlContent = stream.pipe(buildPug(p.src, extras))
    switch (basename(dirname(file.path))) {
      case '_includes':
      case '_layouts':
        return htmlContent

      default:
        return htmlContent.pipe(header(yamlStart))
    }
  })

const processCSS = (): Transform =>
  flatmap((stream: Stream, file: Vinyl) => {
    const plugins = [autoprefixer()]

    log('Transforming "%s"', file.path.replace(p.pub, ''))
    return stream.pipe(postcss(plugins))
  })

const copyAll = (...d: string[]): Transform =>
  pipe(from(sourceDirFiles(...d)), to(intermediateDir(...d)))

/* ................................................. */

task('debug', async () => {
  log('src: "%s"', p.src)
  log('dist: "%s"', p.dist)
  log('intermediate: "%s"', p.intermediate)
  log('files: "%s"', p.files)
  log('public: "%s"', p.pub)
})

task('clean:dist', async () => await del(p.dist, { force: true }))
task('clean:files', async () => await del(p.files, { force: true }))

task('clean:left-overs', () =>
  pipe(
    from(publicDirFiles()),
    tap((file) => {
      switch (extname(file.path).substring(1).toLowerCase()) {
        case 'sass':
        case 'pug':
        case 'ts':
          del.sync(file.path, { force: true })
          log('Deleted "%s"', file.path.replace(p.pub, ''))
          break
      }
    })
  )
)

task('copy:all', () =>
  merge(
    copyAll('blog'),
    copyAll('assets', 'css'),
    copyAll('assets', 'fonts'),
    copyAll('assets', 'imgs')
  )
)

task(
  'build:jekyll',
  runCmd({
    cmd: 'bundle exec jekyll build --trace',
    cwd: resolve(__dirname, '..'),
    showOutput: true
  })
)

task('build:js', () =>
  pipe(
    from(sourceDirFiles('assets', 'js')),
    babel({ presets: ['@babel/preset-env'] }),
    uglify(),
    to(intermediateDir('assets', 'js'))
  )
)

task('build:pug', () =>
  pipe(
    from(globAll(p.src, 'pug')),
    renderPugFiles({ thoughts: readPostDir(join(p.src, 'geo', 'thoughts')) }),
    to(p.intermediate)
  )
)

task('postcss', () =>
  pipe(
    from(globAll(p.pub, 'css')),
    processCSS(),
    to(joinSafe(p.pub, 'assets', 'css'))
  )
)

task('clean:all', series('clean:dist', 'clean:files', 'clean:left-overs'))

task('build:autoindex', async () => await autoindex(p.files, 'caian-org'))

task('prebuild', series('clean:dist', 'clean:files', 'build:autoindex', 'build:pug', 'build:js', 'copy:all'))
task('postbuild', series('clean:left-overs', 'postcss'))

task('build', series('prebuild', 'build:jekyll', 'postbuild'))
