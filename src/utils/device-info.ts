type HighEntropyHints = {
  model?: string;
  platform?: string;
  platformVersion?: string;
  mobile?: boolean;
};

type NavigatorUAData = {
  platform?: string;
  mobile?: boolean;
  getHighEntropyValues: (hints: string[]) => Promise<HighEntropyHints>;
};

function getNavigatorUAData(): NavigatorUAData | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (
    navigator as Navigator & { userAgentData?: NavigatorUAData }
  ).userAgentData;
}

/** Read real device model via User-Agent Client Hints (Chrome/Edge Android). */
async function readClientHintsModel(): Promise<{
  model?: string;
  ua_ch_platform?: string;
}> {
  const uaData = getNavigatorUAData();
  if (!uaData?.getHighEntropyValues) return {};

  try {
    const values = await uaData.getHighEntropyValues([
      "model",
      "platform",
      "platformVersion",
      "mobile",
    ]);

    const model = values.model?.trim();
    // Chrome UA-Reduction uses "K" as a frozen placeholder — not a real model.
    if (!model || /^k$/i.test(model) || model.length < 2) {
      return {
        ua_ch_platform: values.platform?.trim() || undefined,
      };
    }

    return {
      model,
      ua_ch_platform: values.platform?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Collect visitor device signals for BE device_name resolution.
 * Async: Android Chrome exposes the real model via Client Hints
 * (e.g. "Infinix GT 10 Pro") — classic UA only has placeholder "K".
 */
export async function collectClientDeviceInfo(): Promise<NotedDeviceInfo> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {};
  }

  const languages =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? [...navigator.languages]
      : undefined;

  const hints = await readClientHintsModel();

  const info: NotedDeviceInfo = {
    user_agent: navigator.userAgent || undefined,
    platform: navigator.platform || undefined,
    model: hints.model,
    language: navigator.language || undefined,
    languages,
    screen_width: window.screen?.width || undefined,
    screen_height: window.screen?.height || undefined,
    viewport_width: window.innerWidth || undefined,
    viewport_height: window.innerHeight || undefined,
    device_pixel_ratio: window.devicePixelRatio || undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
  };

  // Prefer Client Hints platform when classic navigator.platform is "Linux armv81".
  if (hints.ua_ch_platform && /android/i.test(hints.ua_ch_platform)) {
    info.platform = hints.ua_ch_platform;
  }

  return Object.fromEntries(
    Object.entries(info).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  ) as NotedDeviceInfo;
}
