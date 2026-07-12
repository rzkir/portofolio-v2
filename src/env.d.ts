/// <reference types="astro/client" />
/// <reference path="./types/components.d.ts" />

declare namespace App {
  interface Locals {
    locale: import("@/lib/i18n").Locale;
  }
}
