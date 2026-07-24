/** Collect real visitor device signals from the browser (Postman device_info). */
export function collectClientDeviceInfo(): NotedDeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {};
  }

  const languages =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? [...navigator.languages]
      : undefined;

  const info: NotedDeviceInfo = {
    user_agent: navigator.userAgent || undefined,
    platform: navigator.platform || undefined,
    language: navigator.language || undefined,
    languages,
    screen_width: window.screen?.width || undefined,
    screen_height: window.screen?.height || undefined,
    viewport_width: window.innerWidth || undefined,
    viewport_height: window.innerHeight || undefined,
    device_pixel_ratio: window.devicePixelRatio || undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
  };

  return Object.fromEntries(
    Object.entries(info).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  ) as NotedDeviceInfo;
}
