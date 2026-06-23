/**
 * Neutralises OS-level "reduce motion" so portfolio animations always run.
 * Must run before any @astroanimate/core inline scripts in <head>.
 */
export const FORCE_MOTION_INLINE_SCRIPT = `(function () {
  if (typeof window === "undefined") return;

  var native = window.matchMedia.bind(window);

  window.matchMedia = function (query) {
    if (/prefers-reduced-motion\\s*:\\s*reduce/.test(query)) {
      return {
        matches: false,
        media: query,
        addEventListener: function () {},
        removeEventListener: function () {},
        addListener: function () {},
        removeListener: function () {},
        onchange: null,
        dispatchEvent: function () {
          return false;
        },
      };
    }

    return native(query);
  };
})();`;
