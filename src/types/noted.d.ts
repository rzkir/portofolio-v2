type MessageProvider =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "website"
  | "threads"
  | "other";

interface NotedIpAddress {
  ip: string;
  isp?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Client signals for BE device_name resolution.
 * `device_name` is always computed server-side — never trust client value.
 */
interface NotedDeviceInfo {
  platform?: string;
  /** Real device model from Client Hints (e.g. "Infinix GT 10 Pro"). */
  model?: string;
  language?: string;
  languages?: string[];
  screen_width?: number;
  screen_height?: number;
  viewport_width?: number;
  viewport_height?: number;
  device_pixel_ratio?: number;
  timezone?: string;
  user_agent?: string;
  /** Resolved by BE from UA + model/platform/screen. */
  device_name?: string;
}

interface NotedMessageProps {
  _id: string;
  name: string;
  description: string;
  provider: MessageProvider;
  createdAt: string;
  updatedAt: string;
  ip_address?: NotedIpAddress;
  device_info?: NotedDeviceInfo;
}

interface CreateNotedPayload {
  name: string;
  description: string;
  provider: MessageProvider;
  device_info?: NotedDeviceInfo;
}

interface UpdateNotedPayload {
  _id: string;
  name?: string;
  description?: string;
  provider?: MessageProvider;
  device_info?: NotedDeviceInfo;
}

type GuestNote = {
  id: string;
  name: string;
  message: string;
  provider: MessageProvider;
  createdAt: string;
};

interface NotedApiError {
  error: string;
}
