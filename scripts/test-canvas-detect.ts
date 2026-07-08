import {
  buildWebPreview,
  isCodingTopic,
  resolveAgentCategory,
  shouldShowCanvas,
} from "../src/service/agent.service.ts";

const msg =
  "buatkan saya web untuk agensy property buat modern untuk styling dan layout nya";

console.log("isCodingTopic:", isCodingTopic(msg));
console.log("resolveCategory:", resolveAgentCategory(msg));

const reply = `Here's the site:

\`\`\`html
<!DOCTYPE html>
<html><head><style>body{color:red}</style></head><body><h1>Test</h1><script>console.log(1)</script></body></html>
\`\`\`

Done.`;

console.log("shouldShowCanvas:", shouldShowCanvas(msg, "roleplay", reply));
console.log("buildWebPreview:", buildWebPreview(reply) !== null);
