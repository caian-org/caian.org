/* standard */
import { promises as fs } from 'fs'
import { dirname, join } from 'path'

/* 3rd-party */
import _ from 'lodash'
import mustache from 'mustache'
import { DateTime } from 'luxon'
import { fromEnv } from '@aws-sdk/credential-providers'
import { S3, ListObjectsV2Request, _Object as S3Object } from '@aws-sdk/client-s3'

/* modules */
import { fmtFileSize, fmt, len, log } from './util'

/* ................................................. */

interface IObject {
  key: string
  size: string
  lastModified: string
}

interface IFile {
  name: string
  size: string
  lastModified: string
  publicUrl: string
}

interface IStructure {
  [n: string]: {
    directoryName: string | null
    items: IFile[]
  }
}

interface IAutoIndexCreationParams {
  autoindexBaseDir: string
  dest: string
  template: string
  files: IFile[]
}

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

const listAllObjects = async (bucket: string): Promise<S3Object[]> => {
  const client = new S3({ credentials: fromEnv(), region: 'us-east-1' })

  const f: S3Object[] = []
  const r: ListObjectsV2Request = {
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

const processObjects = (objs: S3Object[]): IObject[] =>
  objs
    .filter((obj) => obj.Key !== undefined)
    .map((obj) => {
      const d = obj.LastModified ?? new Date()

      return {
        key: obj.Key!,
        size: obj.Size === undefined ? '-' : fmtFileSize(obj.Size),
        lastModified: DateTime.fromJSDate(d, { zone: 'UTC' })
          .setZone('America/Sao_Paulo')
          .toFormat('MMMM dd, yyyy hh:mm a')
      }
    })

const uniqueDirsOf = (objs: IObject[]): string[] =>
  [...new Set(objs.map((o) => dirname(o.key)).filter((n) => n !== '.'))].sort((a, b) => len(b) - len(a))

const objectsToFiles = (bucket: string, objs: IObject[]): IFile[] =>
  objs.map((f) => ({
    name: f.key,
    size: f.size,
    lastModified: f.lastModified,
    publicUrl: fmt('https://%s.s3.amazonaws.com/%s', bucket, f.key)
  }))

const create = async (p: IAutoIndexCreationParams): Promise<void> => {
  await fs.mkdir(p.dest, { recursive: true })

  let dirLevel = p.dest.replace(p.autoindexBaseDir, '')
  if (!dirLevel.startsWith('/')) {
    dirLevel = '/'.concat(dirLevel)
  }

  const indented = pugFileListItem
    .split('\n')
    .map((a) => ' '.repeat(8).concat(a))
    .join('\n')

  const renderedFileList = p.files
    .map((file, i) => mustache.render(indented, Object.assign({ idx: (i % 4) + 1 }, file)))
    .join('')

  const c = mustache.render(p.template, { dirLevel, renderedFileList })
  const f = join(p.dest, 'index.pug')

  log('Writing "%s"', f.replace(p.dest, ''))
  await fs.writeFile(f, c)
}

/* ................................................. */

export const build = async (autoindexBaseDir: string, bucket: string): Promise<void> => {
  /* ... */
  const objs = processObjects(await listAllObjects(bucket))
  const dirs = uniqueDirsOf(objs)
  let files = objs.filter((obj) => !obj.key.endsWith('/'))
  log('Got %s objects from bucket "%s"', files.length.toString(), bucket)

  /* ... */
  const structure: IStructure = {}
  for (const d of dirs) {
    const f = files.filter((file) => file.key.startsWith(d))
    files = _.xor(files, f)

    structure[d] = {
      directoryName: _.last(d.split('/'))!,
      items: objectsToFiles(bucket, f)
    }
  }

  log('File structure generated')

  /* ... */
  const template = await fs.readFile(join(__dirname, 'files-template.pug'), 'utf-8')
  await create({ autoindexBaseDir, template, dest: autoindexBaseDir, files: objectsToFiles(bucket, files) })

  for (const d of dirs) {
    await create({ autoindexBaseDir, template, dest: join(autoindexBaseDir, d), files: structure[d].items })
  }
}
