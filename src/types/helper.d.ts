type SocialLink = {
  label: string;
  href: string;
};

type ProfileSocialPlatform = "instagram" | "tiktok" | "linkedin" | "facebook";

type ProfileSocialLink = {
  id: ProfileSocialPlatform;
  label: string;
  href: string;
  handle: string;
};
