# Autoindex generator

Generates the `/files` pages from the S3 bucket and writes Hugo content files.

## Requirements

- Go 1.21+
- AWS credentials in the environment (same variables supported by the AWS SDK)

## Usage

Run from this directory:

```
go run . -bucket caian-org
```

Optional flags:

- `-region` (default: `us-east-1`)
- `-out` (default: `content/files`)
- `-clean` (default: `true`, removes existing output before writing)

This writes `content/files/**/_index.md` so Hugo can render `/files` and its subpaths.
