# Rizki Ramadhan — Portfolio

Personal portfolio of **Rizki Ramadhan**, a fullstack developer based in Bogor, Indonesia. Built for performance, clarity, and a product-like experience — not a static brochure.

**Live:** [https://www.rizkiramadhan.biz.id](https://www.rizkiramadhan.biz.id)  
**Contact:** [hello@rizkiramadhan.biz.id](mailto:hello@rizkiramadhan.biz.id)

---

## Overview

This site presents work, career, writing, and an embedded AI Studio. Content is served via SSR on Cloudflare Workers and hydrated where interaction matters (grids, chat, guest notes, settings).

Default locale is Indonesian (`id`), with English (`en`) and Japanese (`ja`) supported.

---

## Features

| Area | What it does |
|------|----------------|
| **Home** | Hero, about, selected works carousel, testimonials, career timeline, live GitHub / WakaTime coding stats |
| **Works** | Project archive with detail pages (`/works`, `/works/[slug]`) |
| **Blog** | Essays & tutorials (`/blog`, `/blog/[slug]`) |
| **Achievements** | Certifications & milestones (`/achievements`) |
| **Guest notes** | Public guestbook (`/guest-notes`) |
| **AI Studio** | Multi-domain agents — programming, SEO, marketing, health, science, finance, legal, trivia, academia, translation, technology (`/agent`) |
| **Services** | Offerings overview (`/layanan`) |
| **PWA** | Installable app with Workbox caching |
| **i18n** | ID / EN / JA via cookie + message catalog |
| **Settings** | Theme, language, and UX preferences |

---

## Tech stack

- **Framework:** [Astro 7](https://astro.build) (SSR)
- **Runtime:** [Cloudflare Workers](https://workers.cloudflare.com) via `@astrojs/cloudflare`
- **Styling:** Tailwind CSS 4
- **PWA:** `@vite-pwa/astro` + Workbox
- **Motion:** `@astroanimate/core`, `tw-animate-css`
- **Images:** Sharp (compile-time image service)
- **Package manager:** pnpm
- **Node:** `>=22.12.0`

---

## Project structure

```
├── public/              # Static assets (favicon, CV, PWA icons, sounds)
├── src/
│   ├── assets/          # Images processed by Astro
│   ├── components/      # UI & page sections
│   ├── data/            # Portfolio constants & i18n messages
│   ├── lib/             # Shared helpers (i18n, metadata, PWA, agent UI)
│   ├── pages/           # Routes (Astro + sitemap/robots endpoints)
│   ├── service/         # Data & domain services (works, blogs, agent, stats)
│   ├── styles/          # Global CSS
│   ├── types/           # TypeScript declarations
│   └── utils/           # Fetch helpers & shared pagination
├── worker/              # Cloudflare Worker entry
├── astro.config.ts
└── wrangler.jsonc
```

---

## Getting started

### Prerequisites

- Node.js **22.12+**
- [pnpm](https://pnpm.io)

### Install

```bash
pnpm install
```

### Environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_SEARCH_CONSOLE_ID` | No | Google site verification |
| `GOOGLE_TAG_MANAGER_ID` | No | GTM container ID |
| `BING_VERIFICATION` | No | Bing Webmaster verification |

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Local Astro dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview the Astro build locally |
| `pnpm preview:cf` | Build + run with Wrangler (Cloudflare-like) |
| `pnpm deploy` | Build and deploy to Cloudflare Workers |

---

## Deployment

Deployed as a Cloudflare Worker (`portofolio-v2`) with static assets from `dist/client`.

```bash
pnpm deploy
```

Config lives in `wrangler.jsonc` (`BASE_URL`, verification vars, KV `SESSION` binding).

---

## Key routes

| Path | Page |
|------|------|
| `/` | Home |
| `/works` | Works index |
| `/works/[slug]` | Work detail |
| `/blog` | Blog index |
| `/blog/[slug]` | Blog post |
| `/achievements` | Achievements |
| `/guest-notes` | Guestbook |
| `/agent` | AI Studio hub |
| `/agent/[domain]` | Domain agents (programming, seo, …) |
| `/layanan` | Services |
| `/help-center` | Help |
| `/privacy` · `/terms` | Legal |

---

## Links

- Website: [rizkiramadhan.biz.id](https://www.rizkiramadhan.biz.id)
- GitHub: [github.com/rzkir](https://github.com/rzkir)
- LinkedIn: [rizki-ramadhan](https://www.linkedin.com/in/rizki-ramadhan12)
- CV: [/cv-rizkiramadhan.pdf](https://www.rizkiramadhan.biz.id/cv-rizkiramadhan.pdf)

---

## License

Private portfolio project. All rights reserved unless otherwise noted.
