---
layout: 90s
heading: shower thoughts
---

<br />
{% for p in site.categories.thoughts %}- `{{ p.date | date: "%Y-%m-%d " }}` [{{ p.heading }}]({{ p.url }})
{% endfor %}
