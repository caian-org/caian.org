/* standard */
const { join } = require('path')
const { format: fmt } = require('util')

/* 3rd-party */
const flog = require('fancy-log')
const { DateTime } = require('luxon')

/* ................................................. */

const len = (a) => a.length

module.exports.len = len

module.exports.fmt = fmt

module.exports.log = (m, ...p) => flog(fmt('  '.concat(m), ...p))

module.exports.now = () => DateTime.fromJSDate(new Date(), { zone: 'UTC' }).toISO()

module.exports.strFallback = (s) => (typeof s === 'string' && len(s.trim()) > 0 ? s : '???')

module.exports.globAll = (d, ext = null) =>
  join(d, '**', '*'.concat(ext === null ? '' : '.'.concat(ext)))

module.exports.fmtFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const dm = Number(decimals < 0 ? 0 : decimals)
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return fmt('%s %s', parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toString(), sizes[i])
}

module.exports.getNumberSuffix = (num) => {
  const th = 'th'
  const rd = 'rd'
  const nd = 'nd'
  const st = 'st'

  if (num === 11 || num === 12 || num === 13) {
    return th
  }

  switch (num.toString().slice(-1)) {
    case '1': return st
    case '2': return nd
    case '3': return rd
    default: return th
  }
}

module.exports.joinSafe = (...s) =>
  join(
    ...s.map((v) => {
      switch (typeof v) {
        case 'string':
        case 'number':
        case 'bigint':
        case 'boolean':
          return v.toString()

        default:
          return ''
      }
    })
  )
