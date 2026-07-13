/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference path="./types/components.d.ts" />
/// <reference path="./types/pwa.d.ts" />

declare namespace App {
  interface Locals {
    locale: import("@/lib/i18n").Locale;
  }
}
