/* standard */
const { format } = require('util')

/* 3rd-party */
const { DateTime } = require('luxon')

/* ................................................. */

module.exports.fmtFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const dm = Number(decimals < 0 ? 0 : decimals)
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return format('%s %s', parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toString(), sizes[i])
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

module.exports.now = () => DateTime.fromJSDate(new Date(), { zone: 'UTC' }).toISO()
