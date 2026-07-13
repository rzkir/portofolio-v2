export const PWA_MANIFEST = {
  id: "/",
  name: "Rizki Ramadhan - Fullstack Developer",
  short_name: "R. Ramadhan",
  description:
    "Portfolio Rizki Ramadhan — fullstack developer dari Bogor, Indonesia.",
  theme_color: "#3d3830",
  background_color: "#f4f2ec",
  display: "standalone" as const,
  orientation: "portrait-primary" as const,
  scope: "/",
  start_url: "/",
  lang: "id",
  categories: ["portfolio", "business", "productivity"],
  icons: [
    {
      src: "/pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};
