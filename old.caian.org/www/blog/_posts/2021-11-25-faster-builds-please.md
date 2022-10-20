---
layout: post
title: Faster builds, please
tags: development updates
---

It's been only a couple of days since I've [started again][started-again] and
more things have changed over here. I've quickly discovered, after half a dozen
deploys, about some of the inconveniences of Cloudflare Pages that people
didn't seem to care enough to talk about. Here's what I've noticed:

1. __The worker startup is painfully slow__. Every time a new change hits
   GitHub, a new build is triggered on Pages and so a new worker must be
   started to actually build and release the website into the internet. And for
   some unknown reason, the startup process alone was taking half of the
   average needed time -- 5 to 6 minutes to run the entire pipeline and half of
   it was just to spin-up the VM (or container, I don't know). And this
   behaviour happened consistently.

1. __The installation of dependencies are mandatory__. If pages detects a
   manifest file -- `Pipfile`, `package.json`, `Gemfile` etc -- it __will__
   install of it's dependencies. You simply cannot skip this. This might not
   sound that bad, but...

1. __Cloudflare Pages don't cache your build__. No, I'm not talking about
   Cloudflare's CDN. I'm talking about all the node modules and other stuff
   generated at build time. Again, this might not sound that bad, but jekyll
   for instance relies on Ruby gems that binds to C code, which of course are
   system / arch-dependent and must be compiled every time. Having the option
   to specify a list of directories that must be cached between executions
   would greatly improve the build speed.

## So??

Yes, a 5 minutes pipeline is not a lot, but it felt wasteful, so I did some
changes...

1. __The build is now being made on Github Actions__ and the modules / packages
   / libs are now cacheable. The first run took 5 minutes just to install and
   compile all the dependencies; the subsequent ones, only 4 seconds. An entire
   build pipeline takes no more than a minute now.

1. The builded files -- HTML pages and stylesheets -- have their own place now:
   a [separate git repository][sep-git-repo].

1. __This site is not on Cloudflare Pages anymore__.

The pipeline is a little more complex, but more faster (on average, 2 minutes
from `git push` to a new site version be live on the internet). A `git commit`
triggers the GitHub Action that builds the site and commits to the other
repository, which in turn triggers [Render][render] -- I've talked about this
guy last post. Render can do it's job in a little more than a minute -- here's
what a build outlook looks like:

```verilog
Nov 25 12:19:40 AM  ==> Cloning from https://github.com/caian-org/caian.org-dist...
Nov 25 12:19:41 AM  ==> Checking out commit 081d48b in branch master
Nov 25 12:19:54 AM  ==> Downloading cache...
Nov 25 12:19:57 AM  ==> Downloaded 5.0MB in 1s. Extraction took 1s.
Nov 25 12:20:06 AM  ==> Using Python version: 3.7.10
Nov 25 12:20:10 AM  ==> Empty build command; skipping build
Nov 25 12:20:25 AM  ==> Uploading build...
Nov 25 12:20:52 AM  ==> Your site is live 🎉
```

## Where will you be next month?

I don't plan to leave Render this soon, but I'll not make any promises. If I
could strip down one more build minute by going somewhere else, I would. For
now I'm overall happy with this new format / build process.


[started-again]: /blog/2021/11/06/starting-again.html
[sep-git-repo]: https://github.com/caian-org/caian.org-dist
[render]: https://render.com
