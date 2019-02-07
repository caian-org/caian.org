---
layout: default
title: Blog
---

[Home](/)

# Blog

{% for post in site.categories.tech %}
- `{{ post.date | date: "%Y-%m-%d" }}` - [{{ post.title }}]({{ post.url }}) {% endfor %}

[Subscribe with rss](/feed.xml)
