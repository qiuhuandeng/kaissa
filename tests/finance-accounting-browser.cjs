const {run,assert}=require('./finance-report-browser-support.cjs');
run('accounting',async({page,url,shot,download,passed})=>{
  await page.goto(url('merchant/finance/finance-reports.html?report=accounting'));
  const f=page.locator('[data-accounting-confirmations]'), h=page.locator('#finance-accounting-report');
  await f.locator('[name=dataset]').selectOption('demo'); await f.locator('button[type=submit]').click();
  assert.match(await f.locator('[aria-label="财务确认主表"]').innerText(),/收入确认/);
  await f.locator('[name=scenario]').selectOption('estimate'); await f.locator('button[type=submit]').click();
  let csv=await download(f.locator('[data-export]')); assert.match(csv,/6,200.00/); assert.match(csv,/CB10-R/); passed('完整会计发生、暂估冲回、全依据导出');
  await page.locator('[data-report-section=checks]').click();
  await h.locator('[name=dataset]').selectOption('demo'); await h.locator('button[type=submit]').click();
  await h.locator('[data-fr-view=internal]').click(); assert.match(await h.locator('[data-fr-main]').innerText(),/对方未提供或在途/);
  csv=await download(h.locator('[data-fr-export]')); assert.match(csv,/INT07/); passed('内部双方币种期间和在途');
  await h.locator('[data-fr-view=nc]').click(); assert.match(await h.locator('[data-fr-main]').innerText(),/来源借贷不平衡/);
  await shot('desktop'); await page.setViewportSize({width:390,height:844}); await shot('mobile'); assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); passed('NC差异与桌面窄屏');
  await page.setViewportSize({width:1440,height:1000}); await page.goto(url('merchant/data/settlement-reports.html?section=resources'));
  const r=page.locator('[data-resource-cost]'); await r.locator('[name=dataset]').selectOption('demo'); await r.locator('[name=tour]').fill('CRUISE-A'); await r.locator('button[type=submit]').click();
  csv=await download(r.locator('[data-fr-export]')); assert.match(csv,/80000/); assert.match(csv,/200000/); assert.doesNotMatch(await r.locator('[data-fr-main]').innerText(),/CRUISE-B/); passed('业务毛利资源分配不重复');
}).catch(e=>{console.error(e);process.exitCode=1});
