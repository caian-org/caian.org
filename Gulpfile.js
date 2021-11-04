/* standard */
const { exec } = require('child_process')

const { format } = require('util')
const { basename, dirname, join } = require('path')

/* 3rd-party */
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
const sourceDir = (f) => format('%s/%s/**/*', p.src, f)
const intermediateDir = (f) => format('%s/%s', p.intermediate, f)

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
const deps = (...d) => series('build:pug', 'copy:assets', 'copy:geocities', 'copy:blog', ...d)

/* ................................................. */

task('copy:assets', () => copyAll('assets'))
task('copy:geocities', () => copyAll('geocities'))
task('copy:blog', () => copyAll('blog'))

task('build:pug', () =>
  from(format('%s/**/*.pug', p.src))
    .pipe(
      flatmap((stream, file) => {
        const htmlContent = stream.pipe(pug({}))

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

task('build:jekyll', run('bundle exec jekyll build --trace', false))
task('serve:jekyll', run('bundle exec jekyll serve'))

task('build', deps('build:jekyll'))
task('default', deps('serve:jekyll'))
