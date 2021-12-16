/* standard */
import { basename, dirname, join, resolve } from 'path'
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
import minifySVG from 'gulp-svgmin'
import postCSS from 'gulp-postcss'
import purgeCSS from 'gulp-purgecss'
import { task, series, src as from, dest as to } from 'gulp'

// @ts-expect-error
import flatmap from 'gulp-flatmap'

// @ts-expect-error
import { pipeline as pipe } from 'readable-stream'

/* modules */
import autoindex from './autoindex'
import {
  rm,
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

interface IHash {
  [k: string]: any
}

/* ............................................................................ */

process.env.JEKYLL_ENV = 'production'

const yamlStart = ['---', '---', '', ''].join('\n')

const rootDir = resolve(__dirname, '..')

const siteConfig = readSiteConfig(rootDir)

const p = getRelevantDirectories(rootDir)

const geoThoughts = readPostDir(join(p.src, 'geo', 'thoughts'))

const intermediateDir = (...f: string[]): string => joinSafe(p.intermediate, ...f)

const sourceDirFiles = (...f: string[]): string => globAll(joinSafe(p.src, ...f))

const publicDirFiles = (...f: string[]): string => globAll(joinSafe(p.pub, ...f))

const logP = (): void => {
  log('src: "%s"', p.src)
  log('dist: "%s"', p.dist)
  log('intermediate: "%s"', p.intermediate)
  log('files: "%s"', p.files)
  log('public: "%s"', p.pub)
}

/* ............................................................................ */

const leftOvers = [
  fmt('%s.{sass,pug,ts}', publicDirFiles()),
  joinSafe(p.pub, 'assets', 'css', 'boring'),
  joinSafe(p.pub, 'assets', 'css', 'mixins')
]

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

      const htmlContent = pipe(stream, buildPug(p.src, { thoughts: geoThoughts }))

      switch (basename(dirname(file.path))) {
        case '_includes':
        case '_layouts':
          return htmlContent

        default:
          return pipe(htmlContent, header(yamlStart))
      }
    }),
    to(p.intermediate)
  )

const transformCSS = (): Transform =>
  pipe(
    from(globAll(p.pub, 'css')),
    flatmap((stream: Stream, file: Vinyl) => {
      const postPlugins = [autoprefixer()]
      const purgeOptions = { content: [fmt('%s.html', publicDirFiles())] }

      log('Transforming "%s"', file.path.replace(p.pub, ''))
      return pipe(stream, purgeCSS(purgeOptions), postCSS(postPlugins))
    }),
    to(joinSafe(p.pub))
  )

const transformSVG = (): Transform =>
  pipe(
    from(globAll(p.src, 'svg')),
    flatmap((stream: Stream, file: Vinyl) => {
      log('Minifying "%s"', file.path.replace(p.src, ''))
      return pipe(stream, minifySVG())
    }),
    to(p.src)
  )

const cleanLeftOvers = (): NodeJS.ReadWriteStream =>
  pipe(
    from(leftOvers),
    tap((file) => {
      del.sync(file.path, { force: true })
      log('Deleted "%s"', file.path.replace(p.pub, ''))
    })
  )

/* .................................................

       _/                          _/
    _/_/_/_/    _/_/_/    _/_/_/  _/  _/      _/_/_/
     _/      _/    _/  _/_/      _/_/      _/_/
    _/      _/    _/      _/_/  _/  _/        _/_/
     _/_/    _/_/_/  _/_/_/    _/    _/  _/_/_/

   ................................................. */

const jekyllBuild = 'bundle exec jekyll build --trace'

const prebuild = [
  'clean:file:dist',
  'clean:file:autoindex',
  'build:autoindex',
  'build:pug',
  'build:js',
  'copy:all'
]

task('debug', logP)

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

task('clean:file:left-overs', cleanLeftOvers)

task('clean:file:dist', rm(p.dist))

task('clean:file:autoindex', rm(p.files))

task('clean:file:all', series('clean:file:dist', 'clean:file:autoindex', 'clean:file:left-overs'))

/* clean tasks */

task('build:js', buildJS)

task('build:pug', buildPugFiles)

task('build:autoindex', async () => await autoindex(p.files, 'caian-org'))

task('build:jekyll', runCmd({ cmd: jekyllBuild, cwd: rootDir, showOutput: true }))

task('prebuild', series(...prebuild))

task('postbuild', series('clean:file:left-overs', 'transform:css'))

task('build', series('prebuild', 'build:jekyll', 'postbuild'))
