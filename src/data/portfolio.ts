import project1 from "@/assets/project-1.jpg";

import portrait from "@/assets/rizki-ramadhan.webp";

export { project1, portrait };

export type SocialLink = {
  label: string;
  href: string;
};

export type ProfileSocialPlatform =
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "facebook";

export type ProfileSocialLink = {
  id: ProfileSocialPlatform;
  label: string;
  href: string;
  handle: string;
};

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
    href: "https://www.instagram.com/rzkir.20",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@rzkir.20",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/rzkir.20",
  },
  { label: "Read.cv", href: "/cv-rizkiramadhan.pdf" },
];

export const profileSocialLinks: ProfileSocialLink[] = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/rzkir.20",
    handle: "@rzkir.20",
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@rzkir.20",
    handle: "@rzkir.20",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/rizki-ramadhan-83a17027b",
    handle: "rizki-ramadhan",
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/rzkir.20",
    handle: "rzkir.20",
  },
];
