# Oscar Kalid — Portfolio

Personal portfolio website for [Oscar Kalid](https://oscarkalid.com), showcasing apps, projects, and a curated tools page.

## Overview

A static portfolio site built with HTML, CSS, and JavaScript. It highlights Oscar's work building apps for MSPs (including [Riceva](https://riceva.com/) , his software studio [Yajesta](https://yajesta.com).

## Project Structure

```
├── index.html          # Main portfolio page
├── tools.html          # "Tools I Use" — productivity apps, dev tools, discount codes
├── style.css           # Tailwind-based styles
├── CNAME               # Custom domain (oscarkalid.com) for GitHub Pages
├── assets/             # JS bundles (Remix build output)
├── images/             # Avatars, app logos, icons
└── README.md
```

## Pages

- **Home** (`index.html`) — Intro, app links (Riceva, Luna), LinkedIn, Yajesta, Aloa, and contact CTAs
- **Tools** (`tools.html`) — Curated list of tools and services with discount codes where applicable

## Tech Stack

- Plain HTML
- Tailwind CSS (via `style.css`)
- Inter font (Google Fonts)
- Remix/React assets for enhanced interactivity (scroll restoration, etc.)

## Deployment

Configured for GitHub Pages with custom domain `oscarkalid.com` via the `CNAME` file.

## Local Development

Open `index.html` in a browser or serve the directory with any static file server:

```bash
npx serve .
# or
python -m http.server 8000
```

Credits to https://chrisraroque.com/ for website. Oscarkalid.com is a fork of the original.