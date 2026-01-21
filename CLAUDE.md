# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is caian.org, a personal website built with Hugo. The site has multiple distinct visual themes/sections:
- **Main** (`/`, `/blog/`, `/projs/`, `/contact/`) - Modern minimal design
- **Geo** (`/geo/`) - 90s GeoCities-style nostalgic design with animated GIFs

## Common Commands

```bash
# Run local development server
hugo server

# Build for production
hugo

# Create new blog post
hugo new blog/posts/YYYY-MM-DD-title.md

# Create new geo thought
hugo new geo/thoughts/YYYY-MM-DD-title.md
```

## Architecture

### Layout Structure

The site uses section-specific base templates rather than a single shared base:
- `layouts/_default/baseof.html` - Minimal default base
- `layouts/blog/baseof.html` - Blog-specific with theme switching and syntax highlighting
- `layouts/geo/baseof.html` - 90s-style layout with sidebar and footer partials
- `layouts/thoughts/baseof.html` - For geo/thoughts section

### Content Organization

- `content/blog/posts/` - Blog posts with frontmatter: `title`, `date`, `tags`, `slug`
- `content/geo/` - 90s-style pages using `type: "geo"` in frontmatter
- `content/geo/thoughts/` - Short-form posts for the geo section

### Shortcodes (for geo section)

- `{{< geo-img "filename.gif" "width" "height" >}}` - Images from `/imgs/geo/`
- `{{< geo-site "url" "title" >}}` - External site links
- `{{< geo-yt "video-id" >}}` - YouTube embeds
- `{{< geo-pic "filename" >}}` - Photo display
- `{{< geo-category "name" >}}` - Category headers

### Theming

Blog supports light/dark themes via CSS:
- `/css/themes/main/bright.css` and `dark.css` - Main styles
- `/css/themes/main/syntax/bright.css` and `dark.css` - Code highlighting

The geo section uses `/css/themes/90s.css` exclusively.

### URL Patterns

Configured in `hugo.toml`:
- Blog posts: `/blog/:year/:month/:day/:slug/`
- Blog listing: `/blog/`

### Static Assets

- `/static/imgs/geo/` - GIFs and images for the geo section
- `/static/imgs/boring/` - Icons for modern sections
- `/static/fonts/` - Custom fonts (Meslo LGS, Pixel mplus)
- `/static/css/themes/` - All CSS themes
