import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

try {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5500);
  const splashVisible = await page.locator('#zayeatSplash').isVisible().catch(() => false);
  if (splashVisible) throw new Error('Splash screen did not close.');
  if (!await page.locator('#home').evaluate(el => el.classList.contains('active'))) {
    throw new Error('Home page is not active after splash.');
  }
  for (const id of ['products', 'request', 'register', 'contact', 'panelLogin']) {
    await page.locator('#zayeatDock button[data-page="' + id + '"]').click();
    await page.waitForTimeout(150);
    if (!await page.locator('#' + id).evaluate(el => el.classList.contains('active'))) {
      throw new Error('Navigation failed for page: ' + id);
    }
  }
  if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));
  console.log('PASS: splash closes, home loads, and all primary navigation buttons work.');
} finally {
  await browser.close();
}
