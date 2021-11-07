/* standard */
const { join, extname } = require('path')

/* 3rd-party */
const del = require('del')
const merge = require('merge-stream')
const { pipeline: pipe } = require('readable-stream')

const tap = require('gulp-tap')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const { task, series, src: from, dest: to } = require('gulp')

/* modules */
const autoindex = require('./misc/autoindex')
const { run, resolveDirs, readPostDir, renderPugFiles } = require('./misc/build')
const { log, joinSafe, globAll } = require('./misc/util')

/* ................................................. */

const p = resolveDirs(__dirname)

const sourceDir = (...f) => globAll(joinSafe(p.src, ...f))
const intermediateDir = (...f) => joinSafe(p.intermediate, ...f)

const includeDir = join(p.src, '_inc')
const publicFiles = globAll(join(p.dist, 'public'))

const copy = (f, d) => pipe(from(join(p.src, f)), to(intermediateDir(d)))
const copyAll = (...d) => pipe(from(sourceDir(...d)), to(intermediateDir(...d)))

const e = {
  thoughts: readPostDir(join(p.src, 'geocities', 'thoughts'))
}

const preJekyllBuildSteps = [
  'clean:dist',
  'clean:files',
  'build:autoindex',
  'build:pug',
  'build:js',
  'copy:all'
]

/* ................................................. */

task('clean:dist', () => del(p.dist, { force: true }))
task('clean:files', () => del(p.files, { force: true }))

task('clean:left-overs', () =>
  pipe(
    from(publicFiles),
    tap((file, t) => {
      switch (extname(file.path).substring(1).toLowerCase()) {
        case 'sass':
          del(file.path)
          log('Deleted "%s"', file.path.replace(p.dist, ''))
          break
      }
    })
  )
)

task('copy:all', () =>
  merge(
    copy('favicon.ico'),
    copyAll('blog'),
    copyAll('assets', 'css'),
    copyAll('assets', 'fonts'),
    copyAll('assets', 'imgs')
  )
)

task('build:js', () =>
  pipe(
    from(sourceDir('assets', 'js')),
    babel({ presets: ['@babel/preset-env'] }),
    uglify(),
    to(intermediateDir('assets', 'js'))
  )
)

task('build:pug', () => pipe(
    from([globAll(p.src, 'pug'), '!'.concat(globAll(includeDir))]),
    renderPugFiles(includeDir, e),
    to(p.intermediate))
)

task('build:autoindex', async () => autoindex.build(p.files, 'caian-org'))

task('build:jekyll', run('bundle exec jekyll build --trace', false))

task('prepare', series(...preJekyllBuildSteps))
task('default', series(...preJekyllBuildSteps, 'build:jekyll', 'clean:left-overs'))
