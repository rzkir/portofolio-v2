export const GUEST_NOTE_PROVIDERS = [
  { value: "website", label: "Website", selected: true },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "threads", label: "Threads" },
  { value: "other", label: "Lainnya" },
] as const satisfies readonly {
  value: MessageProvider;
  label: string;
  selected?: boolean;
}[];

export const MESSAGE_PROVIDERS = GUEST_NOTE_PROVIDERS.map(
  (item) => item.value,
) as MessageProvider[];

export function getProviderLabel(value: MessageProvider): string {
  return GUEST_NOTE_PROVIDERS.find((item) => item.value === value)?.label ?? value;
}
