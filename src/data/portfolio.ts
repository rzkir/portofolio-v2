import project1 from "@/assets/project-1.jpg";

import portrait from "@/assets/rizki-ramadhan.webp";

export { project1, portrait };

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
