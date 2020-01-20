---
layout: 90s
title: Logs
heading: Logs
---

<br />
{% for post in site.categories.thoughts %}
- `{{ post.date | date: "%Y-%m-%d " }}` [{{ post.title }}]({{ post.url }}) {% endfor %}
