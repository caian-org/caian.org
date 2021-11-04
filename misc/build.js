/* standard */
const fs = require('fs')
const { format } = require('util')
const { basename, dirname, join } = require('path')
const { exec } = require('child_process')

/* 3rd-party */
const log = require('fancy-log')
const { DateTime } = require('luxon')

const header = require('gulp-header')
const flatmap = require('gulp-flatmap')

/* modules */
const { getNumberSuffix, now } = require('./util')

/* ................................................. */

const yamlStart = ['---', '---', '', ''].join('\n')

const pug = (basedir, extras) => require('gulp-pug')({
  basedir,
  locals: {
    _data: Object.assign({}, extras),
    _func: { now }
  }
})

/* ................................................. */

module.exports.readPostDir = (location) =>
  fs.readdirSync(location)
    .filter((f) => basename(f) !== 'index.pug')
    .map((f) => {
      const name = basename(f).replace('.pug', '')

      const date = DateTime.fromISO(name.substring(0, 10))
      const dfmt = format("MMMM d'%s,' yyyy", getNumberSuffix(date.day))

      return {
        _d: date,
        title: name.substring(10).replaceAll('-', ' '),
        date: date.toFormat(dfmt),
        url: name.concat('.html')
      }
    })
    .sort((a, b) => b._d.toMillis() - a._d.toMillis())

module.exports.resolveDirs = (root) => {
  const src = join(root, 'www')
  const dist = join(root, 'dist')

  return {
    src,
    dist,
    intermediate: join(dist, 'intermediate'),
    files: join(src, 'files')
  }
}

module.exports.run = (cmd, showOutput = true) =>
  (callback) =>
    exec(cmd, (err, stdout, stderr) => {
      if (showOutput || err) {
        console.log('\nstdout: \n' + stdout)
        console.log('\nstderr: \n' + stderr)
      }

      callback(err)
    })

module.exports.renderPugFiles = (basedir, extras) => flatmap((stream, file) => {
  log('  Building '.concat(basename(file.path)).concat('...'))

  const htmlContent = stream.pipe(pug(basedir, extras))
  switch (basename(dirname(file.path))) {
    case '_includes':
    case '_layouts':
      return htmlContent

    default:
      return htmlContent.pipe(header(yamlStart))
  }
})
