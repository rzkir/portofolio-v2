import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

await page.locator('[data-chat-fab]').click();
await page.waitForTimeout(500);

await page.locator('#chat-modal-input').fill('hallo');
await page.locator('#chat-modal-input-send').click();
await page.waitForTimeout(400);

const info = await page.evaluate(() => {
  const msg = document.querySelector('.chat-modal__message--user');
  const bubble = document.querySelector('.chat-modal__message--user .chat-modal__bubble');
  if (!msg || !bubble) {
    return {
      found: false,
      html: document.querySelector('[data-chat-messages]')?.innerHTML?.slice(0, 2000),
    };
  }
  const ms = getComputedStyle(msg);
  const bs = getComputedStyle(bubble);
  return {
    found: true,
    msgHTML: msg.outerHTML,
    msg: {
      width: ms.width, height: ms.height, display: ms.display,
      alignSelf: ms.alignSelf, maxWidth: ms.maxWidth,
      flexDirection: ms.flexDirection, alignItems: ms.alignItems,
      rect: msg.getBoundingClientRect().toJSON(),
    },
    bubble: {
      width: bs.width, height: bs.height, display: bs.display,
      padding: bs.padding, minWidth: bs.minWidth, minHeight: bs.minHeight,
      maxWidth: bs.maxWidth, whiteSpace: bs.whiteSpace,
      background: bs.backgroundColor, textAlign: bs.textAlign,
      rect: bubble.getBoundingClientRect().toJSON(),
      text: bubble.textContent,
    },
    messagesDisplay: getComputedStyle(document.querySelector('[data-chat-messages]')).display,
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
