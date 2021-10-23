---
layout: post
title: 'Tiny-CI 01: The GitHub webhook'
---

## From the start

Each GitHub push event, either from a branch or a tag, must trigger the start
of a new pipeline. GitHub can be configured at repository level to notify push
events to a specified "Payload URL", which means that the system (Tiny-CI) can
gather enough information about the project, commit and user to queue an
execution.

In general lines, I need the repository URL and the branch or tag name to clone
the project to the local filesystem and the commit hash to checkout to the
specific change that triggered the system. The project owner and commiter
information is useful but not essential. I'll consider it, though.

This microservice is rather simple: it receives the webhook, parses and
validates the payload and forwards the relevant content to the system API. At
production, the only required package will be `jsonschema`, so the service size
(in kilobytes) will be small as well.

## Validating data

The schema that validates the GitHub webhook payload is extensive but ensures
that all data is inplace.

```typescript
const githubPushWebhookSchema = {
  type: 'object',
  required: ['ref', 'compare', 'repository', 'sender', 'head_commit'],
  properties: {
    ref: { type: 'string' },
    compare: { type: 'string' },

    /* git repository information */
    repository: {
      type: 'object',
      required: ['id', 'url', 'name', 'description', 'owner'],
      properties: {
        id: { type: 'number' },
        url: { type: 'string' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },

        /* repository's owner information */
        owner: {
          type: 'object',
          required: ['id', 'name', 'email', 'avatar_url'],
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            avatar_url: { type: 'string' }
          }
        }
      }
    },

    /* the commit sender information */
    sender: {
      type: 'object',
      required: ['id', 'login', 'avatar_url', 'html_url'],
      properties: {
        id: { type: 'number' },
        login: { type: 'string' },
        avatar_url: { type: 'string' },
        html_url: { type: 'string' }
      }
    },

    /* information about the commit that triggered the webhook */
    head_commit: {
      type: 'object',
      required: ['id', 'url', 'message', 'timestamp', 'added', 'removed', 'modified', 'author'],
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        message: { type: 'string' },
        timestamp: { type: 'string' },

        /* added files on the commit */
        added: { type: 'array', items: { type: 'string' } },

        /* removed files on the commit */
        removed: { type: 'array', items: { type: 'string' } },

        /* modified files on the commit */
        modified: { type: 'array', items: { type: 'string' } },

        /* commit's author information */
        author: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  }
}
```

The rest of the code is just a wrapper around `jsonschema` that transforms the
parsed response into a more bare-bones object:

```typescript
import { Validator, Schema, ValidationError } from 'jsonschema'

const validator = new Validator()

abstract class GenericSchema {
  private valid: boolean
  private errors: string[]

  public constructor(data: any) {
    const result = validator.validate(data, this.getValidationSchema())

    this.valid = result.valid
    this.errors = result.errors.map((err: ValidationError): string => {
      return err.message
    })
  }

  protected abstract getValidationSchema(): Schema
  public isValid(): boolean {
    return this.valid
  }
  public getErrors(): string[] {
    return this.errors
  }
}

export class GithubWebhookSchemaValidator extends GenericSchema {
  protected getValidationSchema(): Schema {
    return githubPushWebhookSchema
  }
}
```

This microservice can eventually handle requests from other providers like
GitLab and BitBucket, so it is a better strategy to create more abstract
objects.

## The handler

Lambda functions from AWS must expose a handler function that receives the
`event` and `context` paramaters. I'll use a proxied api gateway to receive the
POST request from GitHub.

In this case, the handler parses the body content (that is passed by the api
gateway to the lambda function through the event parameter) and immediately
calls the validator to check the data structure.

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'

import { GithubWebhookSchemaValidator } from './schema'

// @ts-ignore
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body!)
  const gwValidation = new GithubWebhookSchemaValidator(body)
  const hasError = !gwValidation.isValid()

  if (hasError) {
    console.log('Errors:')
    gwValidation.getErrors().forEach((errorMessage: string): void => {
      console.log(`- ${errorMessage}`)
    })
  }

  return {
    statusCode: hasError ? 500 : 200,
    body: ''
  }
}
```

## Executing locally

For simplicity sake, I've used `express` to spawn a local web server that kind
of simulates what would happen on AWS.

```typescript
import express from 'express'
import { Application, Request, Response } from 'express'

import * as bodyParser from 'body-parser'

import { handler } from '.'

function getPort(): number {
  const p = parseInt(process.env.PORT as string)
  if (isNaN(p)) return 8080

  return p
}

const app: Application = express()
const port = getPort()

app.use(bodyParser.json())

app.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = JSON.stringify(req.body)

  // @ts-ignore
  const content = await handler({ body }, {})
  res.json(content)
})

app.listen(port, '0.0.0.0', (): void => {
  console.log(`listening at port ${port}`)
})
```

The webserver just forwards the web request body content to the lambda handler
more or less the same way the api gateway does. The `event` parameter is
missing several information and the `context` is empty, but for now this is
enough and "low cost".

Now, for laziness sake I've saved the body content of some events from GitHub
to test my code without having to spam it with fake commits. One example is
here.

Using [httpie](https://httpie.org/) I can do:

```bash
$ cat payload.json | http POST localhost:8080/
```
