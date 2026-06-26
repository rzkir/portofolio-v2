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

interface NotedMessageProps {
  _id: string;
  name: string;
  description: string;
  provider: MessageProvider;
  createdAt: string;
  updatedAt: string;
  ip_address?: NotedIpAddress;
}

interface CreateNotedPayload {
  name: string;
  description: string;
  provider: MessageProvider;
}

interface UpdateNotedPayload {
  _id: string;
  name?: string;
  description?: string;
  provider?: MessageProvider;
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
