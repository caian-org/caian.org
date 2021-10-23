---
layout: post
title: 'A better language for tooling'
---

**TL;DR:** _I were searching for a better alternative for a programming
language to develop tooling and do automation, since Python and Golang didn't
quite achieve the requirements I was looking for (i.e., an easy and expressive
compiled language with higher-level functions, dynamic (or at least infered)
types and a comprehensive standard library). Crystal seemed to be a good
language alternative, so I'm committing to learn it, use it to make useful
stuff and document the process._

## Prelude

Being a programmer who works on a DevOps team, custom-made tooling and
automation is a big aspect of my routine. Python is, in this sense, a great
language for that. Given the large amount of available packages on PyPI and the
fact that the language is quite simple and expressive (and has a REPL), you can
rapidly put stuff together and deliver something that will do the job.

The thing is that, when you only make stuff for your own computer or the
computer of your work colleague, is easy to forget that installing a bunch of
packages increases the clutter of the system and can lead to bad behaviours (if
you've ever dealt with conflicting versions of the same package, you know what
I mean).

Making a hacky script that will only run on my machine is hills of difference
to something that's likely to run on hundreds to thousands of machines (e.g. in
EC2 auto scalling groups). Most of the time, installing the latest version of
Python alongside of a dozen third-party libraries on 1000+ machines is not an
option -- that's why so many people still do things with Python 2.7 or even
Perl5.

One way to overcome this sort of problem, I thought, was to make tooling with
compiled languages, and Golang for that was a viable option. It has a nice
package management system, it doesn't require much setup, it's widely
documented (and is somewhat trendy on StackOverflow) and gives you nice and
tightly compiled binaries -- they generally weights 10+ MB, though they have
everything included. No previous installation is required on the host in order
to execute your Go binary.

What I quickly realized was that most folks on DevOps are not developers, but
rather ex-sysadmins, testers and infrastructure architects (on cloud or on
collocation). They're quite versed in shell script but, in many cases, knowing
Python or Ruby is a plus, not a requirement. Though Golang is way simpler than
C++, for instance, it's still far way from Python.

The learning curve of Golang for a non-programmer tend to be quite steep. It
takes time for a sysadmin to be productive on it. Even for Python or Ruby
developers, it takes time to get used to pointers, structs and other C-derived
features. Neither Golang or Python seems, at least in my experience, to solve
the problem of making tooling & automation -- the optimal solution would be a
point of intersection between them.

## A third way

Truth be told, I don't quite remember how or when did I found
[Crystal][crystal] out on the internet. Nobody told me about. I just found it
and ignore it. At least until now.

It took me a while to realize but when it did, it hit me like a hammer: the
optimal point of intersection between a compiled language and higher-level
functions were right there. Like in the slogan: _fast as C, slick as Ruby_.

Crystal immediately seemed to be a good fit for all the problems I've mentioned
above:

- It's syntax is Ruby-like (well, it's actually almost exactly as Ruby),
  so practically anyone in the team can grasp it quite rapidly (more than with
  Golang, at least) -- specially those who already knows something about
  Python.

- It's a compiled language, capable of generating artifacts with everything
  included (third-party libraries, modules, utilities etc), so the only thing
  you need is to throw the binary into the `PATH` and voila.

- It have a lot of sugar, everywhere: lots and lots of "shortcuts" in the
  language, so you can easily and expressively do things with few lines --
  like in any Ruby program.

## What's next

Ruby (which is Crystal syntax/semantics, so to speak) is not my first language.
It's not even on my top 5. Ruby is somewhat similar to Python, but they're as
similar as portuguese is similar to spanish -- only superficially. I'll have to
dedicate the time to learn the specifics of the language and to what extend the
Ruby-like semantics really translates into Crystal's features.

My main plan is to learn Crystal to the point I feel comfortable with it and
can make useful stuff, both for myself and for my work/for my team. I'm not
entirely sure if this are going to succeed well, but to the extend to what I
saw, it's a promising idea.

I'm going to document the journey in other posts, mostly in the format of notes
and summaries of learned things.

[crystal]: https://crystal-lang.org
