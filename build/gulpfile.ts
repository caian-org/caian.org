/* standard */
import { extname, basename, dirname, join, resolve } from 'path'
import { Stream, Transform } from 'stream'

/* 3rd-party */
import del from 'del'
import slugify from 'slugify'
import merge from 'merge-stream'
import Vinyl from 'vinyl'
import autoprefixer from 'autoprefixer'

import tap from 'gulp-tap'
import babel from 'gulp-babel'
import uglify from 'gulp-uglify'
import pug from 'gulp-pug'
import header from 'gulp-header'
import postcss from 'gulp-postcss'
import minifySVG from 'gulp-svgmin'
import { task, series, src as from, dest as to } from 'gulp'

// @ts-expect-error
import flatmap from 'gulp-flatmap'

// @ts-expect-error
import { pipeline as pipe } from 'readable-stream'

/* modules */
import autoindex from './autoindex'
import {
  fmt,
  log,
  now,
  globAll,
  strFallback,
  joinSafe,
  runCmd,
  readPostDir,
  readSiteConfig,
  getRelevantDirectories
} from './util'

/* ............................................................................ */

interface IHash {
  [k: string]: any
}

process.env.JEKYLL_ENV = 'production'

const yamlStart = ['---', '---', '', ''].join('\n')

const rootDir = resolve(__dirname, '..')

const siteConfig = readSiteConfig(rootDir)

const p = getRelevantDirectories(rootDir)

const geoThoughts = readPostDir(join(p.src, 'geo', 'thoughts'))

const intermediateDir = (...f: string[]): string => joinSafe(p.intermediate, ...f)

const sourceDirFiles = (...f: string[]): string => globAll(joinSafe(p.src, ...f))

const publicDirFiles = (...f: string[]): string => globAll(joinSafe(p.pub, ...f))

/* ............................................................................ */

const copyAll = (...d: string[]): Transform =>
  pipe(from(sourceDirFiles(...d)), to(intermediateDir(...d)))

const buildJS = (): Transform =>
  pipe(
    from(sourceDirFiles('assets', 'js')),
    babel({ presets: ['@babel/preset-env'] }),
    uglify(),
    to(intermediateDir('assets', 'js'))
  )

const buildPug = (basedir: string, extras: IHash): Transform =>
  pug({
    basedir,
    locals: {
      _data: Object.assign({}, extras),
      _site: siteConfig,
      _func: { now, fmt, strFallback, slugify }
    }
  })

const buildPugFiles = (): Transform =>
  pipe(
    from(globAll(p.src, 'pug')),
    flatmap((stream: Stream, file: Vinyl) => {
      log('Writing "%s"', file.path.replace(p.src, '').replace('.pug', '.html'))

      const htmlContent = stream.pipe(buildPug(p.src, { thoughts: geoThoughts }))

      switch (basename(dirname(file.path))) {
        case '_includes':
        case '_layouts':
          return htmlContent

        default:
          return htmlContent.pipe(header(yamlStart))
      }
    }),
    to(p.intermediate)
  )

const transformCSS = (): Transform =>
  pipe(
    from(globAll(p.pub, 'css')),
    flatmap((stream: Stream, file: Vinyl) => {
      const plugins = [autoprefixer()]

      log('Transforming "%s"', file.path.replace(p.pub, ''))
      return stream.pipe(postcss(plugins))
    }),
    to(joinSafe(p.pub))
  )

const transformSVG = (): Transform =>
  pipe(
    from(globAll(p.src, 'svg')),
    flatmap((stream: Stream, file: Vinyl) => {
      log('Minifying "%s"', file.path.replace(p.src, ''))
      return stream.pipe(minifySVG())
    }),
    to(p.src)
  )

const cleanLeftOvers = (): Transform =>
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

/* .................................................

       _/                          _/
    _/_/_/_/    _/_/_/    _/_/_/  _/  _/      _/_/_/
     _/      _/    _/  _/_/      _/_/      _/_/
    _/      _/    _/      _/_/  _/  _/        _/_/
     _/_/    _/_/_/  _/_/_/    _/    _/  _/_/_/

   ................................................. */

task('debug', () => {
  log('src: "%s"', p.src)
  log('dist: "%s"', p.dist)
  log('intermediate: "%s"', p.intermediate)
  log('files: "%s"', p.files)
  log('public: "%s"', p.pub)
})

task('copy:all', () =>
  merge(
    copyAll('blog'),
    copyAll('assets', 'css'),
    copyAll('assets', 'fonts'),
    copyAll('assets', 'imgs')
  )
)

/* transformation tasks */

task('transform:css', transformCSS)

task('transform:svg', transformSVG)

/* clean tasks */

task('clean:left-overs', cleanLeftOvers)

task('clean:dist', async () => await del(p.dist, { force: true }))

task('clean:files', async () => await del(p.files, { force: true }))

task('clean:all', series('clean:dist', 'clean:files', 'clean:left-overs'))

/* clean tasks */

task('build:js', buildJS)

task('build:pug', buildPugFiles)

task('build:autoindex', async () => await autoindex(p.files, 'caian-org'))

task('build:jekyll', runCmd({ cmd: 'bundle exec jekyll build --trace', cwd: rootDir, showOutput: true }))

task('prebuild', series('clean:dist', 'clean:files', 'build:autoindex', 'build:pug', 'build:js', 'copy:all'))

task('postbuild', series('clean:left-overs', 'transform:css'))

task('build', series('prebuild', 'build:jekyll', 'postbuild'))
