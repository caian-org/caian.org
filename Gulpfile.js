/* standard */
const { exec } = require('child_process')
const { basename, dirname, join } = require('path')

/* 3rd-party */
const del = require('del')
const log = require('fancy-log')

const pug = require('gulp-pug')
const header = require('gulp-header')
const flatmap = require('gulp-flatmap')
const { task, series, src: from, dest: to } = require('gulp')

/* ................................................. */

const resolveDirs = () => {
  const src = join(__dirname, 'www')
  const dist = join(__dirname, 'dist')

  return {
    src,
    dist,
    intermediate: join(dist, 'intermediate'),
    site: join(dist, 'site')
  }
}

const p = resolveDirs()
const sourceDir = (f) => join(p.src, f, '**', '*')
const intermediateDir = (f) => join(p.intermediate, f)

/* ................................................. */

const yamlStart = ['---', '---', '', ''].join('\n')

const run =
  (cmd, showOutput = true) =>
    (callback) =>
      exec(cmd, (err, stdout, stderr) => {
        if (showOutput || err) {
          console.log('\nstdout: \n' + stdout)
          console.log('\nstderr: \n' + stderr)
        }

        callback(err)
      })

const copyAll = (n) => from(sourceDir(n)).pipe(to(intermediateDir(n)))

const deps = (...d) =>
  series(
    'clean:dist',
    'build:pug',
    'copy:assets',
    'copy:blog',
    ...d
  )

/* ................................................. */

task('clean:dist', () => del(p.dist, { force: true }))

task('copy:assets', () => copyAll('assets'))
task('copy:blog', () => copyAll('blog'))

task('build:jekyll', run('bundle exec jekyll build --trace', false))
task('serve:jekyll', run('bundle exec jekyll serve'))

task('build:pug', () =>
  from(join(p.src, '**', '*.pug'))
    .pipe(
      flatmap((stream, file) => {
        log('  Building '.concat(basename(file.path)).concat('...'))

        const htmlContent = stream.pipe(pug())
        switch (basename(dirname(file.path))) {
          case '_includes':
          case '_layouts':
            return htmlContent

          default:
            return htmlContent.pipe(header(yamlStart))
        }
      })
    )
    .pipe(to(p.intermediate))
)

task('default', deps('build:jekyll'))
