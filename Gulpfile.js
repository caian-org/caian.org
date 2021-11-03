const { format: fmt } = require('util')
const { exec } = require('child_process')

const pug = require('gulp-pug')
const header = require('gulp-header')
const { task, src, dest, series } = require('gulp')

/* ------------------------------------------------- */

const d = (f) => fmt('./src/%s/**/*', f)

const run = (cmd, showOutput = true) =>
  (callback) =>
    exec(cmd, (err, stdout, stderr) => {
      if (showOutput || err) {
        console.log('\nstdout: \n' + stdout)
        console.log('\nstderr: \n' + stderr)
      }

      callback(err)
    })

const deps = (...d) =>
  series('copy:assets', 'copy:geocities', 'copy:blog', 'build:pug', ...d)

/* ------------------------------------------------- */

task('build:pug', () =>
  src('./src/**/*.pug')
    .pipe(pug({}))
    .pipe(header(['---', '---', '', ''].join('\n')))
    .pipe(dest('./intermediate')))

task('copy:assets', () =>
  src(d('assets'))
    .pipe(dest('./intermediate/assets')))

task('copy:geocities', () =>
  src(d('geocities'))
    .pipe(dest('./intermediate/geocities')))

task('copy:blog', () =>
  src(d('blog'))
    .pipe(dest('./intermediate/geocities')))

task('build:jekyll', run('bundle exec jekyll build', false))

task('serve:jekyll', run('bundle exec jekyll serve'))

/* ------------------------------------------------- */

task('build', deps('build:jekyll'))

task('default', deps('serve:jekyll'))
