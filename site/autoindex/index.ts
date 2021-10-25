import { dirname } from 'path'
import { format as fmt } from 'util'

import _ from 'lodash'
import { DateTime } from 'luxon'
import { fromEnv } from '@aws-sdk/credential-providers'
import { S3, ListObjectsV2Request, _Object as S3Object } from '@aws-sdk/client-s3'

interface IObject {
  key: string
  size: string
  lastModified: string
}

interface IFile {
  name: string
  size: string
  lastModified: string
}

interface IStructure {
  [n: string]: {
    directoryName: string | null
    items: IFile[]
  }
}

const client = new S3({ credentials: fromEnv(), region: 'us-east-1' })

const len = (a: any[] | string): number => a.length

const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const dm = Number(decimals < 0 ? 0 : decimals)
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return fmt('%s %s', parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toString(), sizes[i])
}

const listAllObjects = async (bucket: string): Promise<S3Object[]> => {
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
        size: obj.Size === undefined ? '-' : formatBytes(obj.Size),
        lastModified: DateTime.fromJSDate(d, { zone: 'UTC' })
          .setZone('America/Sao_Paulo')
          .toFormat('MMMM dd, yyyy hh:mm a')
      }
    })

const getUniqueDirs = (objs: IObject[]): string[] =>
  [...new Set(objs.map((o) => dirname(o.key)).filter((n) => n !== '.'))].sort((a, b) => len(b) - len(a))

const objToFile = (objs: IObject[]): IFile[] =>
  objs.map((f) => ({ name: f.key, size: f.size, lastModified: f.lastModified }))

const main = async (): Promise<void> => {
  const objs = processObjects(await listAllObjects('caian-org'))
  const dirs = getUniqueDirs(objs)
  let files = objs.filter((obj) => !obj.key.endsWith('/'))

  const structure: IStructure = {}
  for (const dir of dirs) {
    const f = files.filter((file) => file.key.startsWith(dir))
    files = _.xor(files, f)

    structure[dir] = {
      directoryName: _.last(dir.split('/'))!,
      items: objToFile(f)
    }
  }

  structure._ = { directoryName: null, items: objToFile(files) }
  console.log(JSON.stringify(structure, null, 2))
}

main().catch((e) => console.error(e))
