/* standard */
const { join, extname } = require('path')

/* 3rd-party */
const del = require('del')
const tap = require('gulp-tap')
const { task, series, src: from, dest: to } = require('gulp')

/* modules */
const autoindex = require('./misc/autoindex')
const { run, resolveDirs, readPostDir, renderPugFiles: rdr } = require('./misc/build')
const { log } = require('./misc/util')

/* ................................................. */

const p = resolveDirs(__dirname)
const sourceDir = (f) => join(p.src, f, '**', '*')
const intermediateDir = (f) => join(p.intermediate, f)

const pugFiles = join(p.src, '**', '*.pug')
const publicFiles = join(p.dist, 'public', '**', '*')

const copyAll = (n) => from(sourceDir(n)).pipe(to(intermediateDir(n)))

const deleteAndNotify = (fp) => {
  del(fp)
  log('Deleted "%s"', fp.replace(p.dist, ''))
}

const e = {
  thoughts: readPostDir(join(p.src, 'geocities', 'thoughts'))
}

const preJekyllBuildSteps = [
  'clean:dist',
  'clean:files',
  'build:autoindex',
  'build:pug',
  'copy:assets',
  'copy:blog'
]

/* ................................................. */

task('clean:dist', () => del(p.dist, { force: true }))
task('clean:files', () => del(p.files, { force: true }))

task('clean:left-overs', () =>
  from(publicFiles).pipe(tap((file, t) => {
    switch (extname(file.path).substring(1).toLowerCase()) {
      case 'sass':
        deleteAndNotify(file.path)
        break
    }
  }))
)

task('copy:assets', () => copyAll('assets'))
task('copy:blog', () => copyAll('blog'))

task('build:autoindex', async () => autoindex.build(p.files, 'caian-org'))
task('build:pug', () => from(pugFiles).pipe(rdr(p.src, e)).pipe(to(p.intermediate)))
task('build:jekyll', run('bundle exec jekyll build --trace', false))

task('prepare', series(...preJekyllBuildSteps))
task('default', series(...preJekyllBuildSteps, 'build:jekyll', 'clean:left-overs'))
