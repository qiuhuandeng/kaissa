const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.CAESAR_PLAYWRIGHT_PATH || '/tmp/wechat-style-tools/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CAESAR_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  try {
    await page.goto(pathToFileURL(path.resolve(__dirname, '../merchant/finance/finance-supplier-bills.html')).href);
    await page.locator('.nav-primary-item[data-title="履约中心"]').click();
    await page.locator('.nav-scroll a[href$="tour/supplier-reconciliation.html"]').click();
    await page.locator('[data-rec-action="create"]').click();
    await page.locator('[data-rec-select="C04"]').check();
    assert.ok((await page.locator('#recSelectionTotal').innerText()).includes('6,000.00'));
    console.log('PASS 独立菜单进入后对账脚本可用，选中费用保留预付冲抵6000');

    await page.locator('[data-rec-action="submit"]').click();
    assert.equal(await page.locator('.rec-list [data-rec-id]').count(), 6);
    console.log('PASS 独立菜单进入后可由我方提交对账');

    await page.locator('[data-rec-open="DZ20260926003"]').click();
    await page.locator('.rec-related a').filter({ hasText: '付款申请' }).click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('[data-supplier-payment-application]').isVisible(), true);
    assert.equal(await page.locator('[data-settlement-work-tab="reconciliation"]').count(), 0);
    assert.equal(page.url().includes('fulfillment-payment-apply.html'), true);
    console.log('PASS 对账详情付款入口进入独立付款申请页，不返回团期结算对账页签');

    assert.deepEqual(errors, []);
    console.log('完成3组独立菜单及承接检查，脚本异常0');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
