import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('framenavigated', frame => { if (frame === page.mainFrame()) console.log('NAVIGATED:', frame.url()); });
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

try {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'commit', timeout: 30000 });
  await page.locator('#home').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForTimeout(5500);
  console.log('DEBUG:', JSON.stringify(await page.evaluate(() => ({url:location.href,title:document.title,readyState:document.readyState,homeCount:document.querySelectorAll('#home').length,bodyStart:document.body?.innerText?.slice(0,400),bodyHtmlStart:document.body?.innerHTML?.slice(0,600)}))));
  console.log('PAGE ERRORS SO FAR:', JSON.stringify(errors));
  const splashVisible = await page.locator('#zayeatSplash').isVisible().catch(() => false);
  if (splashVisible) throw new Error('Splash screen did not close.');
  if (!await page.locator('#home').evaluate(el => el.classList.contains('active'))) {
    throw new Error('Home page is not active after splash.');
  }
  for (const id of ['products', 'request', 'register', 'contact', 'panelLogin']) {
    await page.locator('#zayeatDock button[data-page="' + id + '"]').click();
    await page.waitForTimeout(1000);
    if (!await page.locator('#' + id).evaluate(el => el.classList.contains('active'))) {
      throw new Error('Navigation failed for page: ' + id + '; active=' + await page.locator('.page.active').evaluate(el => el.id).catch(() => 'none') + '; showPage=' + await page.evaluate(() => typeof window.showPage) + '; errors=' + errors.join(' | '));
    }
  }
  if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));
  console.log('PASS: splash closes, home loads, and all primary navigation buttons work.');
} finally {
  await browser.close();
}
