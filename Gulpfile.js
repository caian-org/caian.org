/* standard */
const { join } = require('path')

/* 3rd-party */
const del = require('del')
const { task, series, src: from, dest: to } = require('gulp')

/* modules */
const { run, resolveDirs, readPostDir, renderPugFiles } = require('./misc/build')

/* ................................................. */

const p = resolveDirs(__dirname)
const sourceDir = (f) => join(p.src, f, '**', '*')
const intermediateDir = (f) => join(p.intermediate, f)

const preJekyllBuildSteps = ['clean:dist', 'build:pug', 'copy:assets', 'copy:blog']
const copyAll = (n) => from(sourceDir(n)).pipe(to(intermediateDir(n)))

const e = {
  thoughts: readPostDir(join(p.src, 'geocities', 'thoughts'))
}

/* ................................................. */

task('clean:dist', () => del(p.dist, { force: true }))
task('copy:assets', () => copyAll('assets'))
task('copy:blog', () => copyAll('blog'))

task('build:pug', () =>
  from(join(p.src, '**', '*.pug'))
    .pipe(renderPugFiles(p.src, e))
    .pipe(to(p.intermediate))
)

task('build:jekyll', run('bundle exec jekyll build --trace', false))

task('prepare', series(...preJekyllBuildSteps))
task('default', series(...preJekyllBuildSteps, 'build:jekyll'))
