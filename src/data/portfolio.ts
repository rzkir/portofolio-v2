import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";
import project4 from "@/assets/project-4.jpg";
import project5 from "@/assets/project-5.jpg";
import project6 from "@/assets/project-6.jpg";
import portrait from "@/assets/rizki-ramadhan.webp";
import type { ImageMetadata } from "astro";

export { project1, portrait };

export type Project = {
  no: string;
  title: string;
  tag: string;
  year: string;
  desc: string;
  image: ImageMetadata;
  previewUrl: string;
  span: string;
  offset: string;
};

export const projects: Project[] = [
  {
    no: "01",
    title: "Sistem Atmosferik",
    tag: "React · GLSL · Node.js",
    year: "2025",
    desc: "Dashboard observasi cuaca real-time dengan visualisasi shader dan layout cinematic.",
    image: project1,
    previewUrl: "https://github.com/rizkiramadhan",
    span: "md:col-span-7",
    offset: "",
  },
  {
    no: "02",
    title: "Niskala Reader",
    tag: "Next.js · Tailwind · Supabase",
    year: "2024",
    desc: "Typography-first archival engine untuk arsip sastra Nusantara.",
    image: project2,
    previewUrl: "https://github.com/rizkiramadhan",
    span: "md:col-span-5",
    offset: "md:mt-40",
  },
  {
    no: "03",
    title: "Lentera Commerce",
    tag: "Remix · Stripe · Prisma",
    year: "2024",
    desc: "Platform e-commerce UMKM dengan checkout sub-detik dan editorial product pages.",
    image: project3,
    previewUrl: "https://github.com/rizkiramadhan",
    span: "md:col-span-8 md:col-start-3",
    offset: "md:-mt-12",
  },
  {
    no: "04",
    title: "Gudangku POS",
    tag: "React · Express · PostgreSQL",
    year: "2024",
    desc: "Sistem manajemen inventori dan point-of-sale untuk UMKM dengan laporan otomatis dan multi-cabang.",
    image: project4,
    previewUrl: "https://github.com/rizkiramadhan",
    span: "md:col-span-5",
    offset: "md:mt-32",
  },
  {
    no: "05",
    title: "Kanvas Analytics",
    tag: "Next.js · D3.js · Supabase",
    year: "2024",
    desc: "Platform visualisasi data untuk tim marketing dengan dashboard real-time dan ekspor laporan.",
    image: project5,
    previewUrl: "https://github.com/rizkiramadhan",
    span: "md:col-span-7",
    offset: "",
  },
  {
    no: "06",
    title: "KirimAja",
    tag: "PWA · Firebase · Flutter Web",
    year: "2023",
    desc: "Progressive web app logistik pengiriman dengan tracking real-time dan notifikasi otomatis.",
    image: project6,
    previewUrl: "https://github.com/rizkiramadhan",
    span: "md:col-span-6 md:col-start-4",
    offset: "md:-mt-16",
  },
];

export const certifications = [
  { code: "DCG-AI", title: "Belajar Dasar AI", issuer: "Dicoding", year: "2025" },
  { code: "DCG-WEB", title: "Belajar Dasar Pemrograman Web", issuer: "Dicoding", year: "2025" },
  { code: "DBM-35", title: "Skills Fair 35 Frontend Developer", issuer: "Dibimbing", year: "2025" },
  { code: "MSK-BE", title: "Backend in Website Development", issuer: "MySkill", year: "2024" },
  { code: "MSK-XL", title: "Microsoft Excel Basic Formula", issuer: "MySkill", year: "2024" },
  { code: "MSK-PY", title: "Python Introduction for Data Analysis", issuer: "MySkill", year: "2024" },
  { code: "JVA-WEB", title: "Basic Web Development", issuer: "JavaArch", year: "2024" },
  { code: "DBM-34", title: "Skills Fair 34 Frontend Developer", issuer: "Dibimbing", year: "2024" },
  { code: "DBM-WD9", title: "Web Developer Series 9.0 — Frontend", issuer: "Dibimbing", year: "2024" },
  { code: "MSK-DS", title: "Design System in UI Design", issuer: "MySkill", year: "2024" },
  { code: "MSK-FE", title: "Frontend in Website Development", issuer: "MySkill", year: "2024" },
  { code: "DCG-AR", title: "Adaptability and Resilience", issuer: "Dicoding", year: "2023" },
  { code: "EPT-BGR", title: "English Proficiency Test of Bogor Regency", issuer: "SMK Kab. Bogor", year: "2023" },
];

export const stack = [
  "TypeScript",
  "React",
  "Next.js",
  "TanStack",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Supabase",
  "Prisma",
  "Figma",
  "Framer Motion",
];

export const experiences = [
  {
    role: "Fullstack Developer — Freelance",
    org: "Independent",
    range: "2023 — Sekarang",
    desc: "Membangun website dan aplikasi untuk klien UMKM, agensi, dan startup lokal. Menangani end-to-end: riset kebutuhan, desain UI, pengembangan frontend & backend, deployment, dan maintenance. Stack utama: Next.js, TanStack, Node.js, PostgreSQL, Supabase.",
  },
  {
    role: "Frontend Developer",
    org: "Project-based / Remote Collaboration",
    range: "2023 — 2024",
    desc: "Berkolaborasi dengan tim desain dan backend untuk membangun landing page, dashboard admin, dan e-commerce. Fokus pada komponen reusable, integrasi API, optimasi Core Web Vitals, dan responsivitas di semua perangkat.",
  },
  {
    role: "Web Development Intern",
    org: "SMK Kabupaten Bogor",
    range: "2022 — 2023",
    desc: "Mendalami fundamental web development: HTML semantik, CSS layout, JavaScript interaktivitas, serta Git workflow dan kolaborasi tim. Membangun proyek mini sebagai portofolio awal dan mempersiapkan transisi ke dunia profesional.",
  },
];

export const cvExperiences = [
  {
    role: "Freelance Fullstack Developer",
    org: "Independent",
    range: "2023 — Sekarang",
    desc: "Membangun web & mobile app untuk klien UMKM, agensi, dan startup. Stack utama: Next.js, TanStack, Node.js, Supabase.",
  },
  {
    role: "Frontend Developer",
    org: "Project-based Collaboration",
    range: "2023 — 2024",
    desc: "Mengembangkan UI komponen reusable, integrasi REST/GraphQL, dan optimasi Core Web Vitals untuk landing & dashboard.",
  },
  {
    role: "Web Development Intern",
    org: "SMK Kab. Bogor",
    range: "2022 — 2023",
    desc: "Membangun fundamental web (HTML/CSS/JS), git workflow, dan kolaborasi tim.",
  },
];

export const cvSkills = [
  "TypeScript",
  "React",
  "Next.js",
  "TanStack",
  "Tailwind CSS",
  "Framer Motion",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Supabase",
  "Prisma",
  "REST / GraphQL",
  "Git",
  "Figma",
];

export const services = [
  { n: "S/01", t: "Product Engineering", d: "Dari ide ke production: arsitektur, build, deploy, monitor." },
  { n: "S/02", t: "Web Design & UI", d: "Antarmuka editorial yang terasa hidup, bukan template generik." },
  { n: "S/03", t: "Performance Audit", d: "Lighthouse 90+, Core Web Vitals, real-user metrics." },
  { n: "S/04", t: "Headless CMS", d: "Sanity, Strapi, Payload — workflow konten yang nyaman." },
];

export const process = [
  { n: "01", t: "Discovery", d: "Sesi singkat 45 menit, peta masalah dan ekspektasi." },
  { n: "02", t: "Sketch & Spec", d: "Wireframe, moodboard, dan technical spec yang jelas." },
  { n: "03", t: "Build", d: "Sprint 1-3 minggu dengan preview link harian." },
  { n: "04", t: "Ship & Handover", d: "Deploy production, dokumentasi, sesi training." },
];

export const testimonials = [
  { quote: "Hasilnya bukan cuma cepat — terasa dipikirkan. Setiap detail kelihatan sengaja.", author: "Aulia P.", role: "Founder, Studio Mahkota" },
  { quote: "Komunikasi rapi, deadline jalan, dan kodenya bisa kami lanjutkan tanpa drama.", author: "M. Rifqi", role: "CTO, Lumina" },
  { quote: "Susah cari developer yang ngerti desain. Rizki salah satunya.", author: "Tania W.", role: "Design Lead" },
];

export const faq = [
  { q: "Berapa lama satu proyek?", a: "Landing page 1-2 minggu, web app 3-8 minggu. Dipecah ke sprint kecil dengan deliverable yang bisa kamu lihat." },
  { q: "Apakah saya dapat source code?", a: "Selalu. Repo lengkap dengan dokumentasi handover dan sesi training singkat." },
  { q: "Stack apa yang biasa dipakai?", a: "React/Next.js/Astro/TanStack, Tailwind, TypeScript, Postgres/Supabase. Saya juga ikut stack tim kalau diperlukan." },
  { q: "Tersedia untuk kontrak jangka panjang?", a: "Ya — slot terbatas untuk retainer bulanan. Hubungi via email untuk detail." },
];

export const codingStats = [
  { label: "Repositori", value: "12", sub: "publik" },
  { label: "Kontribusi", value: "450+", sub: "12 bulan" },
  { label: "Problem", value: "10", sub: "LeetCode" },
  { label: "Sertifikasi", value: String(certifications.length), sub: "valid" },
];

export const codingLanguages = [
  { name: "TypeScript", pct: 62 },
  { name: "JavaScript", pct: 18 },
  { name: "Python", pct: 12 },
  { name: "CSS", pct: 8 },
];

export const codingStreaks = [
  { label: "Hari aktif", value: "142", desc: "GitHub commit streak" },
  { label: "Seri panas", value: "28", desc: "hari berturut-turut" },
];

export const leetcodeSolved = [
  { label: "Easy", value: "7", color: "text-emerald-600" },
  { label: "Medium", value: "1", color: "text-amber-500" },
  { label: "Hard", value: "2", color: "text-red-500" },
];

export const codingTrophies = ["Supercontributor", "Problem Solver", "365 Hari", "Streak 28"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rng = seededRandom(42);
export const heatmapValues = Array.from({ length: 52 * 7 }, () => rng());

export function heatmapOpacity(value: number) {
  if (value < 0.4) return 0.1;
  if (value < 0.65) return 0.3;
  if (value < 0.85) return 0.55;
  return 0.85;
}

export type SocialLink = {
  label: string;
  href: string;
};

export const contact = {
  email: "hello@rizkiramadhan.biz.id",
  website: "https://rizkiramadhan.biz.id",
  websiteLabel: "rizkiramadhan.biz.id",
  location: "Bogor, ID",
  timezone: "UTC+7",
  status: "Open for work",
  cvUrl: "https://www.rizkiramadhan.biz.id/cv.pdf",
} as const;

export const socialLinks: SocialLink[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/rizki-ramadhan-83a17027b",
  },
  { label: "GitHub", href: "https://github.com/rzkir" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/rzkir.20",
  },
  { label: "Read.cv", href: "https://www.rizkiramadhan.biz.id/cv.pdf" },
];
