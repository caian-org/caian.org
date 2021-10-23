---
layout: post
title: 'Learning Crystal 01: the basics'
---

**DISCLAIMER:** _HIC SUNT DRACONES! These are my "study notes". They're not
100% guaranteed to be correct, though I'm writing them to be as factual as
possible._

## Intro

A [couple of weeks ago I decided to invest some time on Crystal][initial-post],
a programming language that strives to be fast as C and "slick" (read "simple",
"elegant", "beautiful") as Ruby. Here's some of my initial notes and observations.

[initial-post]: https://caian.org/tech/2019/02/13/a-better-language-for-tooling.html

## Installation & CLI

To download the compiler and related programs (such as `shards`, the dependency
manager), just go to the [installation page](https://crystal-lang.org/reference/installation)
on the website. There's packages for all major GNU/Linux distributions.

The Crystal compiler CLI is quite simple:

```
Command:
    init                     generate a new project
    build                    build an executable
    docs                     generate documentation
    env                      print Crystal environment information
    eval                     eval code from args or standard input
    play                     starts Crystal playground server
    run (default)            build and run program
    spec                     build and run specs (in spec directory)
    tool                     run a tool
    help, --help, -h         show this help
    version, --version, -v   show version
```

The CLI can create a boilerplate of a Crystal project with the `init` command.

```sh
$ crystal init
```

It even initialize the project directory as a git directory with a simple
README page and a LICENSE notice (by default, the MIT license; I'm not sure if
there's a way to choose what license should be used).

Following the opinionated nature of Golang, Crystal offers some built-in ways
of doing documentation and testing. You can see some "uniformity" in many
Crystal projects out there, which is something that I personally value.

## Shards

The Crystal equivalent of Ruby's Gems are Shards. A shard could be a tiny
library or a whole framework. Shards could be initialized with the `init`
command.

```sh
$ shards init
```

To control the dependencies, Shards makes use of a manifest file called
`shard.yml`. The dependencies (and their versions) are locked on the lock file
called `shard.lock`. The `install` command does not allows you to specify what
shard to install. It simply read the manifest file and installs it into a local
`lib` directory. You can't do `shards install my-shard`; you have to manually
edit the manifest and include it yourself.

Counter-intuitive, but okay.

## Code

The code is very similar to Ruby. A "Hello World" program can be written in one
line:

```ruby
puts "Hello World"
```

To import, the `require` keyword is used.

```ruby
# main.cr

require "colorize"
require "./module"
```

At the first line we're requiring a module from the standard library called
`colorize`. The colorize module can change the foreground and background color
of the text inside the terminal, as well the style (bold, dim etc).

At the second line we're requiring a local file. When requiring local files,
the path must be relative to the main file. The example below illustrates the case
when a file (`main.cr`) requires another file within the same directory
(`module.cr`).

```
├── Dockerfile
├── LICENSE
├── Makefile
├── README.md
├── shard.lock
├── shard.yml
└── src
    ├── module.cr
    └── main.cr
```

Supposing a structure of nested directories:

```
└── src
    ├── main.cr
    └── module
        └── file.cr
```

The `file.cr` would have to be required as:

```ruby
# main.cr

require "./module/file.cr"
```

## Compiler

Crystal is based on the [LLVM](https://llvm.org/). When passing the `--verbose`
flag to the compiler, you can see the C compiler in action. The build time varies
a lot. The "Hello World" example compiles in half of a second, on average.
Bigger projects consumes up to thirty seconds.

The "Hello World" binary size is about 1.1 MB. The binary doesn't grow as much
as Golang binaries when adding libraries and other resources. However, Crystal
binaries are system-dependent: missing headers or libraries can break the
program.
