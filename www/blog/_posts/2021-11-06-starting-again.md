---
layout: post
title: Starting again
tags: development updates
---

This project is alive once again. Last time I've poured energy into this, the
site was still running on a self-managed nginx server at Vultr. Turns out I'm
lazy and after a couple of months I gave up and deleted everything -- one
OpenBSD and two CentOS servers.

Don't get me wrong: hosting your own shit is all fun and games, but -- for me
at least -- it gets boring way too quickly. Oh well...


## On finding a new landlord

Static websites are cool again, so there's actually a couple of options to
choose from: [surge][surge], [vercel][vercel], [render][render], [github
pages][gpages], [aws s3][s3], [netlify][netlify], [digital ocean][docean] and
(the winner) [cloudflare pages][cpages]. You can most certainly find other
options, but that's how far I got on a 15 min search.

[surge]: https://surge.sh
[vercel]: https://vercel.com
[render]: https://render.com
[gpages]: https://pages.github.com
[s3]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
[netlify]: https://www.netlify.com
[docean]: https://www.digitalocean.com
[cpages]: https://pages.cloudflare.com

Most of them are problematic in some way:

- __Surge__ is the most interesting of all: you install a node package on your
    system, build your website locally and upload the dist with a single
    command. That's it. No pipeline, no nothing. You can even add your own
    custom domain, but if you want secure (HTTPS) connections, you have to pay.
    30 dollars, monthly, to be more specific. That's a __NO__ for me.

- __AWS S3__ has a similar approach, but the setup is more time consuming, the
    update (of pages) requires manual steps -- although you can automate that
    on a CI/CD service -- and, as always (that's the AWS way of doing things),
    there are some hidden costs, such as cloudfront -- if you pretend to serve
    content over HTTPS. Not appealing, actually.

- __GitHub Pages__ is an old buddy that has only one friend: Jekyll. And even
    this good ol' friend is dealt with limitations: not all plugins are allowed
    and you can't use anything besides Jekyll. Does your site need some help
    from another program? Perhaps you're planning to use Gulp, Webpack or
    whatever to build? Then no deal.

- __Netlify__ and __Digital Ocean__ are similar in their features, limitations and
    price model: you can use your own domain with a free SSL certificate and
    bring code from GitHub with automatic builds. But they limit your monthly
    build time (in minutes). Netlify gives you 300 minutes per month free.
    Digital Ocean gives you even less: 100 minutes per month and only 1 GB of
    outbound data transfer.

- __Vercel__ is less about static websites and more about FaaS (function-as-a-service)
    and custom stuff like NextJS. In a way, hosting a site on vercel is similar
    to doing on S3: you can absolutely do it, but most people aren't, so the
    territory seems unfit.

- __Render__ and __Cloudflare Pages__ seemed the most fit for the job: in both
    cases, you just connect the service to your GitHub account and the
    repository where the site is, provide a build command -- `npm run build` or
    whatever -- and that's it. You can use your own domain and it will
    automatically be served over HTTPS. I've choosed the later only because I'm
    already using Cloudflare's DNS services. That's pretty much the only reason
    for not choosing Render. In the future, if Cloudflare introduces
    restrictions or even a price on their static site service, I'll 100% be
    migrating to Render.


## Pug, SASS, Gulp and other front-end toys

I'm no expert on this field -- you probably figured this out by seeing how
simple this whole website is. I've never liked how bloated the front-end stack
is and I plan to never ever work professionaly with this clusterfuck of
frameworks and tooling. Despite my sincerely belief that the modern web is
fucked beyond repair, it is fun to mess around and see how many different
hammers I can use to hit the same nail.

Of course I __could__ use plain HTML and CSS for the job, but why not
complicate everything and introduce many different levels of abstractions on
top of it? Again: I __do not__ plan to make sites professionaly, so bodging and
gluing stuff on top of other stuff is not only okay but fun in a perverse
sense.

I've rewrote the CSS to SASS, the HTML to Pug and built a transpilation process
on top of Jekyll using Gulp. There's a lot of Liquid templating that could be
removed using Pug's features like `include`, `extends` and inline javascript --
that will be done another day. For the time being, I'll say this project is
stable enough to be tagged `1.0.0`.


## Silly additions and the future

It took me more than 100 commits over a timespan of two weeks to get to this
point. Besides the new tooling and fancy abstractions, I've also added some
actually useful features here:

1. Blog posts now have tags and an estimated read time;
1. The dark theme is less broken;
1. Syntax highlighting on code block is improved;
1. The [files](/files) section is now being generated at build time.

Look how colorful it is (<a href="#silly-additions-and-the-future" onclick="changeTheme()">click here</a> to change the theme):

```ruby
def longest_repetition(string)
  max = string
          .chars
          .chunk(&:itself)
          .map(&:last)
          .max_by(&:size)

  max ? [max[0], max.size] : ['', 0]
end
```

There's much yet to be done and I'm sure that I'll broke many things in the
process. If everything went accordingly, much will flourish the next year. What
will flourish is another story... but it will. Have faith in me.
