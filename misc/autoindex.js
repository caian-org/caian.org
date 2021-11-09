/* standard */
const { promises: fs } = require('fs')
const { dirname, join } = require('path')

/* 3rd-party */
const _ = require('lodash')
const mustache = require('mustache')

const { DateTime } = require('luxon')
const { fromEnv } = require('@aws-sdk/credential-providers')
const { S3 } = require('@aws-sdk/client-s3')

/* modules */
const { fmtFileSize, fmt, len, log } = require('./util')

/* ................................................. */

mustache.escape = (t) => t

const pugFileListItem = `
tr
  td(style='text-align: right')
    img.middle(src='/assets/imgs/autoindex/file.svg', height='16px', width='16px')
  td
  td
    a.fw-{{ idx }}(href='{{ publicUrl }}')
      | {{ name }}
  td {{ size }}
  td {{ lastModified }}
`

/* ................................................. */

const listAllObjects = async (bucket) => {
  const client = new S3({ credentials: fromEnv(), region: 'us-east-1' })

  const f = []
  const r = {
    Bucket: bucket,
    ContinuationToken: undefined
  }

  while (true) {
    const d = await client.listObjectsV2(r)
    r.ContinuationToken = d.NextContinuationToken

    if (d.Contents !== undefined) {
      f.push(...d.Contents)
    }

    if (d.IsTruncated === false) {
      break
    }
  }

  return f
}

const processObjects = (objs) =>
  objs
    .filter((obj) => obj.Key !== undefined)
    .map((obj) => {
      const d = obj.LastModified ?? new Date()

      return {
        key: obj.Key,
        size: obj.Size === undefined ? '-' : fmtFileSize(obj.Size),
        lastModified: DateTime.fromJSDate(d, { zone: 'UTC' })
          .setZone('America/Sao_Paulo')
          .toFormat('MMMM dd, yyyy hh:mm a')
      }
    })

const uniqueDirsOf = (objs) =>
  [...new Set(objs.map((o) => dirname(o.key)).filter((n) => n !== '.'))].sort(
    (a, b) => len(b) - len(a)
  )

const objectsToFiles = (bucket, objs) =>
  objs.map((f) => ({
    name: f.key,
    size: f.size,
    lastModified: f.lastModified,
    publicUrl: fmt('https://%s.s3.amazonaws.com/%s', bucket, f.key)
  }))

const create = async ({ rootdir, dest, template, files }) => {
  await fs.mkdir(dest, { recursive: true })

  let dirLevel = dest.replace(rootdir, '')
  if (!dirLevel.startsWith('/')) {
    dirLevel = '/'.concat(dirLevel)
  }

  const indented = pugFileListItem
    .split('\n')
    .map((a) => ' '.repeat(8).concat(a))
    .join('\n')

  const renderedFileList = files
    .map((file, i) => mustache.render(indented, Object.assign({ idx: (i % 4) + 1 }, file))).join('')

  const c = mustache.render(template, { dirLevel, renderedFileList })
  const f = join(dest, 'index.pug')

  log('Writing "%s"', f.replace(dest, ''))
  await fs.writeFile(f, c)
}

/* ................................................. */

module.exports.build = async (rootdir, bucket) => {
  /* ... */
  const objs = processObjects(await listAllObjects(bucket))
  const dirs = uniqueDirsOf(objs)
  let files = objs.filter((obj) => !obj.key.endsWith('/'))
  log('Got %s objects from bucket "%s"', files.length, bucket)

  /* ... */
  const structure = {}
  for (const d of dirs) {
    const f = files.filter((file) => file.key.startsWith(d))
    files = _.xor(files, f)

    structure[d] = {
      directoryName: _.last(d.split('/')),
      items: objectsToFiles(bucket, f)
    }
  }

  log('File structure generated')

  /* ... */
  const template = await fs.readFile(join(__dirname, 'files-template.pug'), 'utf-8')
  await create({ rootdir, template, dest: rootdir, files: objectsToFiles(bucket, files) })

  for (const d of dirs) {
    await create({ rootdir, template, dest: join(rootdir, d), files: structure[d].items })
  }
}
