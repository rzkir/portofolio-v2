type NotificationSoundId = "computer" | "iphone" | "off";

interface AgentSettings {
  desktopNotifications: boolean;
  autoSaveDrafts: boolean;
  betaFeatures: boolean;
  agentResponses: boolean;
  weeklyDigest: boolean;
  conciseResponses: boolean;
  rememberContext: boolean;
  notificationSound: NotificationSoundId;
}

type AgentSettingsKey = keyof AgentSettings;

interface NotificationSoundOption {
  id: NotificationSoundId;
  label: string;
  src: string;
}
