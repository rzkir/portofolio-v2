# Rizki Ramadhan — Portfolio

Portfolio personal fullstack developer yang dibangun dengan **Astro 6**, **Tailwind CSS 4**, dan **Cloudflare Workers**. Menampilkan karya, karier, sertifikasi, statistik coding, blog, buku tamu, dan AI Studio.

**Live:** [rizkiramadhan.biz.id](https://rizkiramadhan.biz.id)

---

## Fitur

- **Homepage** — hero, CV dialog, marquee skills, karya pilihan, testimoni, timeline karier, sertifikasi, coding stats
- **Works** — arsip proyek dengan detail per slug
- **Blog** — daftar artikel & halaman detail
- **Achievements** — arsip sertifikasi & kredensial
- **Layanan** — halaman layanan & FAQ
- **Guest Notes** — buku tamu interaktif
- **AI Studio** (`/agent`) — chat AI multi-kategori (programming, SEO, legal, dll.)
- **i18n** — Bahasa Indonesia & English (cookie + query `?lang=`)
- **Dark mode** — mengikuti preferensi sistem
- **SEO** — sitemap, robots.txt, JSON-LD, Open Graph, Google/Bing verification
- **Analytics** — Google Tag Manager

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | [Astro 6](https://astro.build) (SSR) |
| Styling | Tailwind CSS 4 |
| Deployment | Cloudflare Workers + Assets |
| Runtime | Node.js ≥ 22.12 |
| Package manager | pnpm |
| Animasi | @astroanimate/core, GSAP-style utilities |
| Image | Sharp (compile-time optimization) |

---

## Struktur Proyek

```
portofolio/
├── public/              # Asset statis (favicon, PDF CV, dll.)
├── src/
│   ├── assets/          # Gambar (portrait, project cover)
│   ├── components/      # Komponen UI & section
│   ├── data/            # Data statis (portfolio, i18n)
│   ├── layouts/         # Layout, Header, Footer
│   ├── lib/             # Utilitas (metadata, i18n, theme, SEO)
│   ├── pages/           # Route Astro
│   ├── service/         # Layer data & API client
│   ├── styles/          # Global CSS
│   ├── types/           # TypeScript definitions
│   └── utils/           # Fetch helpers
├── worker/              # Cloudflare Worker entry (API proxy + SSR)
├── astro.config.ts
├── wrangler.jsonc       # Konfigurasi Cloudflare
└── package.json
```

---

## Prasyarat

- **Node.js** ≥ 22.12
- **pnpm** (disarankan)
- Akun **Cloudflare** (untuk deploy)
- Backend API di `api.rizkiramadhan.biz.id` (untuk data dinamis)

---

## Instalasi & Development

```bash
# Clone repository
git clone https://github.com/rzkir/portofolio-v2.git
cd portofolio-v2

# Install dependencies
pnpm install

# Salin environment variables
cp .env.example .env.local
```

Edit `.env.local` sesuai kebutuhan, lalu jalankan dev server:

```bash
pnpm dev
```

Buka [http://localhost:4321](http://localhost:4321).

### Preview production lokal

```bash
pnpm preview
# atau preview dengan Wrangler (Cloudflare runtime)
pnpm preview:cf
```

---

## Environment Variables

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `API_URL` | ✅ | Base URL backend API |
| `API_SECRET` | ❌ | Bearer token untuk API (production) |
| `GOOGLE_SEARCH_CONSOLE_ID` | ❌ | Meta verification Google Search Console |
| `GOOGLE_TAG_MANAGER_ID` | ❌ | ID Google Tag Manager |
| `BING_VERIFICATION` | ❌ | Meta verification Bing Webmaster |

Contoh `.env.local`:

```env
API_URL=https://api.rizkiramadhan.biz.id
API_SECRET=
GOOGLE_SEARCH_CONSOLE_ID=
GOOGLE_TAG_MANAGER_ID=
BING_VERIFICATION=
```

---

## Build & Deploy

### Build

```bash
pnpm build
```

Output ada di folder `dist/`:
- `dist/client/` — static assets
- `dist/server/` — SSR bundle

### Deploy ke Cloudflare

```bash
pnpm deploy
```

Set secret API (jika diperlukan):

```bash
wrangler secret put API_SECRET
```

Pastikan KV namespace `SESSION` sudah ter-bind di `wrangler.jsonc` untuk session Astro.

---

## Halaman & Route

| Route | Deskripsi |
|-------|-----------|
| `/` | Homepage |
| `/works` | Daftar karya |
| `/works/[slug]` | Detail proyek |
| `/blog` | Daftar blog |
| `/blog/[slug]` | Detail artikel |
| `/achievements` | Sertifikasi & kredensial |
| `/layanan` | Layanan & FAQ |
| `/guest-notes` | Buku tamu |
| `/agent` | AI Studio (noindex) |
| `/agent/*` | Kategori AI (programming, seo, legal, dll.) |
| `/sitemap.xml` | Sitemap dinamis |
| `/robots.txt` | Robots rules |

---

## Integrasi API

Data dinamis di-fetch dari backend `API_URL`:

| Endpoint API | Digunakan untuk |
|--------------|-----------------|
| `/api/v1/sitemap` | Sitemap routes |
| `/api/v1/messages` | Guest notes |
| `/api/v1/prompt` | AI Studio chat |

Worker mem-proxy request client-side:

- `POST /api/guest-notes` → backend messages
- `POST /api/agent/prompt` → backend prompt

Layer `src/service/` menangani fetching dengan cache TTL per jenis data (static, content, stats, dynamic).

---

## SEO

- Meta tags, canonical, Open Graph, Twitter Card
- JSON-LD `Person` + `WebSite` di homepage
- JSON-LD `BreadcrumbList` di halaman dalam
- Sitemap dinamis dengan fallback ke route statis
- Route `/agent/*` memakai `noindex, nofollow`
- Crawler/bot otomatis skip splash screen

---

## i18n

Bahasa default: **Indonesia (`id`)**.

Ganti bahasa via:
- Query: `?lang=en` atau `?lang=id`
- Cookie: `lang` (persist 1 tahun)

Terjemahan ada di `src/data/i8n.json`.

---

## Scripts

| Command | Fungsi |
|---------|--------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview build lokal |
| `pnpm preview:cf` | Preview dengan Wrangler |
| `pnpm deploy` | Build + deploy ke Cloudflare |

---

## Kontak

**Rizki Ramadhan** — Fullstack Developer

- Website: [rizkiramadhan.biz.id](https://rizkiramadhan.biz.id)
- Email: hello@rizkiramadhan.biz.id
- GitHub: [@rzkir](https://github.com/rzkir)
- LinkedIn: [rizki-ramadhan](https://www.linkedin.com/in/rizki-ramadhan-83a17027b)
- Lokasi: Bogor, Indonesia

---

## Lisensi

Proyek ini bersifat personal. Hubungi pemilik repository sebelum menggunakan ulang kode atau desain secara komersial.
