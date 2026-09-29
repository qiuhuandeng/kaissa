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
  page.setDefaultTimeout(10000);
  let count = 0;
  const url = suffix => pathToFileURL(path.resolve(__dirname, '../merchant/tour/fulfillment-payment-apply.html')).href + (suffix || '');
  const check = async (name, fn) => { assert.ok(await fn(), name); count += 1; console.log('PASS ' + name); };
  const click = async selector => { await page.locator(selector).first().click(); await page.waitForTimeout(220); };
  const text = selector => page.locator(selector).innerText();

  try {
    await page.goto(url());
    await check('付款申请为独立页面且不再跳转团期结算', async () => page.url().includes('fulfillment-payment-apply.html') && (await text('.page-title')) === '付款申请');
    await check('待付款列表展示七条成本项', async () => page.locator('[data-spa-cost]').count().then(value => value === 7));
    await check('未结算未对账成本仍显示可申请100000', async () => { const row=page.locator('[data-spa-cost="COST-PAY-001"]');const value=await row.innerText();return value.includes('未结算 · 未对账')&&value.includes('100,000.00')&&value.includes('可申请'); });
    await check('未结算未对账成本的申请入口可用', async () => page.locator('[data-spa-open="COST-PAY-001"]').isEnabled());
    await check('最终101000扣已付和占用后显示可申请11000', async () => { const value=await text('[data-spa-cost="COST-PAY-002"]');return value.includes('101,000.00')&&value.includes('80,000.00')&&value.includes('10,000.00')&&value.includes('11,000.00'); });
    await check('已付120000高于最终90000显示供应商应退30000', async () => { const row=page.locator('[data-spa-cost="COST-PAY-003"]');return (await row.innerText()).includes('应退 ¥30,000.00')&&await row.locator('[data-spa-refund]').isEnabled() && await row.locator('[data-spa-open]').count()===0; });
    await check('缺财务审核账户的成本不能申请', async () => page.locator('[data-spa-open="COST-PAY-005"]').isDisabled());
    await check('付款状态和固定操作列宽度完整', async () => {
      const widths=await page.locator('[data-spa-cost="COST-PAY-001"]').evaluate(row=>({status:row.children[7].getBoundingClientRect().width,action:row.children[8].getBoundingClientRect().width,tag:row.children[7].querySelector('.tag').getBoundingClientRect().width}));
      return widths.status>=100&&Math.abs(widths.action-92)<1&&widths.tag<widths.status;
    });
    await page.screenshot({ path:'/private/tmp/supplier-payment-standalone-list.png', fullPage:true });

    await click('[data-spa-open="COST-PAY-001"]');
    await check('申请抽屉默认按预付款节点带入30000', async () => (await page.locator('[data-spa-amount]').inputValue()) === '30000' && (await page.locator('#spaKind').inputValue()) === '预付款');
    await click('[data-spa-action="submit"]');
    await check('提交时缺付款依据被拦截', async () => (await text('.spa-error')).includes('付款依据'));
    await page.locator('#spaBasis').fill('采购协议约定预付30%，成本项已保存');
    await page.locator('#spaAttachment').setInputFiles({name:'采购协议付款节点.pdf',mimeType:'application/pdf',buffer:Buffer.from('prototype')});
    await click('[data-spa-action="submit"]');
    await check('提交后形成待财务复核并占用30000', async () => { const row=await text('[data-spa-cost="COST-PAY-001"]');return row.includes('70,000.00')&&row.includes('部分可申请'); });

    await page.locator('[data-spa-select="COST-PAY-001"]').check();
    await page.locator('[data-spa-select="COST-PAY-004"]').check();
    await click('[data-spa-action="batch"]');
    await check('跨公司供应商币种批量申请被拦截', async () => (await text('.rec-toast')).includes('同一采购公司'));
    await page.locator('[data-spa-select="COST-PAY-004"]').uncheck();
    await page.locator('[data-spa-select="COST-PAY-006"]').check();
    await click('[data-spa-action="batch"]');
    await check('同公司供应商币种账户可进入两条批量申请', async () => page.locator('.spa-apply-line').count().then(value => value === 2) && text('[data-spa-total]').then(value => value.includes('36,000.00')));
    await page.locator('[data-spa-line="COST-PAY-001"] [data-spa-amount]').fill('28000');
    await click('[data-spa-action="close"]');
    await check('未保存退出要求确认放弃', async () => page.locator('.spa-confirm').isVisible());
    await click('[data-spa-action="discard"]');

    await click('[data-spa-tab="records"]');
    await check('申请记录显示刚提交的付款申请', async () => (await text('.spa-record-table')).includes('PAY-REQ-20260929-004'));
    await click('[data-spa-request="PAY-REQ-20260929-004"]');
    await check('付款申请详情保留成本、金额、依据和办理岗位', async () => { const value=await text('.spa-body');return value.includes('云南地接综合费')&&value.includes('30,000.00')&&value.includes('采购协议约定预付30%')&&value.includes('付款复核岗'); });
    await click('[data-spa-action="close"]');

    await page.goto(url('?statementNo=DZ20260926003&revision=1'));
    await check('供应商对账付款入口直达独立申请抽屉', async () => page.locator('.spa-overlay').isVisible() && (await text('.spa-body')).includes('可申请 ¥11,000.00'));

    await page.goto(pathToFileURL(path.resolve(__dirname, '../merchant/tour/fulfillment-cost.html')).href+'?view=payment');
    await page.waitForTimeout(500);
    await check('旧团期结算付款地址迁移到独立付款申请页', async () => page.url().includes('fulfillment-payment-apply.html'));

    await page.setViewportSize({ width:390, height:844 });
    await page.goto(url('?costId=COST-PAY-001'));
    await check('窄屏申请抽屉和页面外壳不横向溢出且提交按钮可达', async () => {
      const [shellFits, bodyFits, submitVisible] = await Promise.all([
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        page.locator('.spa-body').evaluate(node => node.scrollWidth <= node.clientWidth + 1),
        page.locator('[data-spa-action="submit"]').isVisible()
      ]);
      return shellFits && bodyFits && submitVisible;
    });
    await page.waitForTimeout(450);
    await page.screenshot({ path:'/private/tmp/supplier-payment-standalone-narrow.png', fullPage:true });
    await click('[data-spa-action="close"]');
    await check('窄屏列表仅表格内部横向滚动且操作列可见', async () => {
      const [shellFits, tableScrolls, actionVisible] = await Promise.all([
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        page.locator('.spa-table-wrap').evaluate(node => node.scrollWidth > node.clientWidth),
        page.locator('[data-spa-open="COST-PAY-001"]').isVisible()
      ]);
      return shellFits && tableScrolls && actionVisible;
    });

    assert.deepEqual(errors, []);
    console.log('完成 ' + count + ' 组独立付款申请浏览器检查；脚本异常0');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
