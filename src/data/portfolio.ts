import project1 from "@/assets/project-1.jpg";

import portrait from "@/assets/rizki-ramadhan.webp";

export { project1, portrait };

export const AI_STUDIO_URL = "https://next-ai.rizkiramadhan.biz.id/" as const;

export const contact = {
  email: "hello@rizkiramadhan.biz.id",
  website: "https://www.rizkiramadhan.biz.id",
  websiteLabel: "rizkiramadhan.biz.id",
  location: "Bogor, ID",
  timezone: "UTC+7",
  status: "Open for work",
  cvUrl: "/cv-rizkiramadhan.pdf",
} as const;

export const socialLinks: SocialLink[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/rizki-ramadhan12",
  },
  { label: "GitHub", href: "https://github.com/rzkir" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/rizkir.ts",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@rzkir.ts",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/rizki.ramadhan.419859",
  },
  { label: "Read.cv", href: "/cv-rizkiramadhan.pdf" },
];

export const profileSocialLinks: ProfileSocialLink[] = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/rizkir.ts",
    handle: "@rizkir.ts",
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@rzkir.ts",
    handle: "@rzkir.ts",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/rizki-ramadhan-83a17027b",
    handle: "Rizki Ramadhan",
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/rizki.ramadhan.419859",
    handle: "Rizki Ramadhan",
  },
];
