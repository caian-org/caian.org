/* standard */
const { promises: fs } = require('fs')
const { dirname, join, resolve } = require('path')

/* 3rd-party */
const _ = require('lodash')
const ejs = require('ejs')

const { DateTime } = require('luxon')
const { fromEnv } = require('@aws-sdk/credential-providers')
const { S3 } = require('@aws-sdk/client-s3')

/* modules */
const { fmtFileSize } = require('./util')

/* ................................................. */

const client = new S3({ credentials: fromEnv(), region: 'us-east-1' })

const len = (a) => a.length

const listAllObjects = async (bucket) => {
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

/* Object To File */
const otf = (objs) =>
  objs.map((f) => ({
    name: f.key,
    size: f.size,
    lastModified: f.lastModified,
    publicUrl: 'https://caian-org.s3.amazonaws.com/' + f.key
  }))

const renderAndWrite = async (template, dir, files) => {
  const c = ejs.render(template, { directoryLevel: '/'.concat(dir), files })
  const f = join(dir, 'index.pug')

  console.log(`* writing "${f}"`)
  await fs.writeFile(f, c)
}

/* ................................................. */

const create = async (basedir) => {
  const l = 20
  console.log('\n'.concat('-'.repeat(l)))
  console.log('* autoindex started')

  /* ... */
  const objs = processObjects(await listAllObjects('caian-org'))
  const dirs = uniqueDirsOf(objs)
  let files = objs.filter((obj) => !obj.key.endsWith('/'))
  console.log(`* got ${files.length} objects`)

  /* ... */
  const structure = {}
  for (const d of dirs) {
    const f = files.filter((file) => file.key.startsWith(d))
    files = _.xor(files, f)

    structure[d] = {
      directoryName: _.last(d.split('/')),
      items: otf(f)
    }
  }

  /* ... */
  console.log('* file structure generated')
  const template = await fs.readFile(resolve(join(__dirname, 'files.pug')), 'utf-8')
  await renderAndWrite(template, basedir, otf(files))

  for (const d of dirs) {
    const fileLevelDirName = join(basedir, d)

    await fs.mkdir(fileLevelDirName, { recursive: true })
    await renderAndWrite(template, fileLevelDirName, structure[d].items)
  }

  console.log('* done')
  console.log('-'.repeat(l).concat('\n'))
}

module.exports = { create }
