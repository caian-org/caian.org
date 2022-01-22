/* standard */
import { promises as fs } from 'fs'
import { basename, dirname, join, resolve } from 'path'

/* 3rd-party */
import _ from 'lodash'
import mustache from 'mustache'
import { DateTime } from 'luxon'
import { fromEnv } from '@aws-sdk/credential-providers'
import { S3, ListObjectsV2Request, _Object as S3Object } from '@aws-sdk/client-s3'

/* modules */
import { indent, fmtFileSize, countChar, fmt, len, log } from './util'

/* ............................................................................ */

interface IObject {
  name: string
  key: string
  size: string
  lastModified: string
  url: string
}

interface IFile extends IObject {}

interface IDirectory extends IObject {}

interface IStructure {
  [n: string]: {
    directoryName: string
    files: IFile[]
    directories: IDirectory[]
  }
}

type BuilderFunc = (s: string, d: IDirectory[], f: IFile[]) => Promise<void>

/* ............................................................................ */

mustache.escape = (t) => t

const indexItem = `
tr
  td(style='text-align: right')
    img.middle(src='/assets/imgs/autoindex/@filename.svg', height='16px', width='16px')
  td
  td
    a.fw-{{ idx }}(href='{{ url }}')
      | {{ name }}
  td {{ size }}
  td {{ lastModified }}
`

/* ............................................................................ */

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
        name: basename(obj.Key!),
        key: obj.Key!,
        size: obj.Size === undefined ? '-' : fmtFileSize(obj.Size),
        lastModified: DateTime.fromJSDate(d, { zone: 'UTC' })
          .setZone('America/Sao_Paulo')
          .toFormat('MMMM dd, yyyy hh:mm a'),
        url: '#'
      }
    })

const objectsToFiles = (bucket: string, objs: IObject[]): IFile[] =>
  objs
    .filter((obj) => !obj.key.endsWith('/'))
    .map((f) => {
      const n = _.cloneDeep(f)
      n.url = fmt('https://%s.s3.amazonaws.com/%s', bucket, f.key)

      return n
    })

const objectsToDirectories = (objs: IObject[]): IDirectory[] =>
  [...new Set(objs.map((o) => dirname(o.key)).filter((n) => n !== '.'))]
    .filter((d) => !d.endsWith('/'))
    .sort((a, b) => len(b) - len(a))
    .map((d) => ({
      name: basename(d),
      key: d,
      size: '-',
      lastModified: '-',
      url: join('/files', d)
    }))

const newBuilder = async (baseDir: string): Promise<BuilderFunc> => {
  const template = await fs.readFile(join(__dirname, 'files-template.pug'), 'utf-8')
  const wwwD = resolve(baseDir, '..')

  return async (dest: string, dirs: IDirectory[], files: IFile[]) => {
    await fs.mkdir(dest, { recursive: true })

    let dirLevel = dest.replace(baseDir, '')
    if (!dirLevel.startsWith('/')) {
      dirLevel = '/'.concat(dirLevel)
    }

    const renderedFile = mustache.render(
      template,
      {
        dirLevel,
        renderedList: [...dirs, ...files]
          .map((j, i) =>
            mustache.render(
              indent(indexItem.replace('@filename', j.size === '-' ? 'dir' : 'file'), 8),
              Object.assign({ idx: (i % 4) + 1 }, j)
            )
          )
          .join('')
      }
    )

    const f = join(dest, 'index.pug')
    log('Writing "%s"', f.replace(wwwD, ''))

    await fs.writeFile(f, renderedFile)
  }
}

const buildStructure = (bucket: string, dirs: IDirectory[], files: IObject[]): IStructure => {
  const rootDirectories = dirs.filter((d) => !d.key.includes('/'))
  const rootFiles = files.filter((f) => !f.key.includes('/'))

  const s: IStructure = Object.fromEntries(
    dirs.map((dir) => [
      dir.key,
      {
        directoryName: _.last(dir.key.split('/'))!,
        directories: [],
        files: objectsToFiles(
          bucket,
          files.filter((file) => file.key.startsWith(dir.key))
        )
      }
    ])
  )

  const nestedDirectories = _.xor(dirs, rootDirectories)

  while (true) {
    const nd = nestedDirectories.pop()
    if (nd === undefined) {
      break
    }

    for (const level of Object.keys(s)) {
      if (level === nd.key || !nd.key.startsWith(level + '/') || countChar(nd.key, '/') > 1) {
        continue
      }

      s[level].directories.push(nd)
    }
  }

  s[''] = {
    directoryName: '',
    directories: rootDirectories,
    files: rootFiles
  }

  return s
}

/* ............................................................................ */

export default async (baseDir: string, bucket: string): Promise<void> => {
  /* ... */
  const objects = processObjects(await listAllObjects(bucket))
  const uniqueDirectories = objectsToDirectories(objects)
  const uniqueFiles = objectsToFiles(bucket, objects)
  log('Got %s objects from bucket "%s"', uniqueFiles.length.toString(), bucket)

  /* ... */
  const structure: IStructure = buildStructure(bucket, uniqueDirectories, uniqueFiles)
  log('File structure generated')

  console.log(JSON.stringify(structure, null, 2))
  const build = await newBuilder(baseDir)

  /* nested directories */
  for (const d of Object.keys(structure)) {
    const { directories, files } = structure[d]
    await build(join(baseDir, d), directories, files)
  }
}
