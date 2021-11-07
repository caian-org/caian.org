/* standard */
const fs = require('fs')
const { basename, dirname, join } = require('path')
const { exec } = require('child_process')

/* 3rd-party */
const yaml = require('yaml')
const { DateTime } = require('luxon')

const header = require('gulp-header')
const flatmap = require('gulp-flatmap')

/* modules */
const { strFallback, getNumberSuffix, organizeTags, now, fmt, log } = require('./util')

/* ................................................. */

const yamlStart = ['---', '---', '', ''].join('\n')

const pug = (basedir, _data) =>
  require('gulp-pug')({
    basedir,
    locals: {
      _data,
      _site: yaml.parse(fs.readFileSync(join(__dirname, '..', '_config.yml'), 'utf-8')),
      _func: { now, fmt, strFallback, organizeTags }
    }
  })

/* ................................................. */

module.exports.readPostDir = (location) =>
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

module.exports.run =
  (cmd, showOutput = true) =>
    (callback) =>
      exec(cmd, (err, stdout, stderr) => {
        if (showOutput || err) {
          log('STDOUT')
          log('  %s', stdout)
          log('STDERR')
          log('  %s', stderr)
        }

        callback(err)
      })

module.exports.renderPugFiles = (basedir, extras) =>
  flatmap((stream, file) => {
    log('Writing "%s"', file.path.replace(dirname(basedir), '').replace('.pug', '.html'))

    const htmlContent = stream.pipe(pug(basedir, extras))
    switch (basename(dirname(file.path))) {
      case '_inc':
        return htmlContent

      default:
        return htmlContent.pipe(header(yamlStart))
    }
  })
