import { registerSW } from "virtual:pwa-register";

export function registerPwa(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (registration) {
        registration.update().catch(() => {});
      }
    },
  });
}
