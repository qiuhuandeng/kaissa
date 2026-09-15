const {run,assert}=require('./finance-report-browser-support.cjs');
run('monthly-profit',async({page,url,download,shot,passed})=>{
  await page.goto(url('merchant/data/monthly-profit-reports.html'));
  const h=page.locator('[data-monthly-profit]');await h.locator('[name=dataset]').selectOption('demo');await h.locator('button[type=submit]').click();
  assert.match(await h.locator('[data-fr-main]').innerText(),/3,400.00/);assert.match(await h.locator('[data-fr-main]').innerText(),/5,400.00/);
  let csv=await download(h.locator('[data-fr-export]'));assert.match(csv,/3400/);assert.match(csv,/未分配费用/);assert.match(csv,/MG01/);
  await h.locator('[data-fr-view=departments]').click();assert.match(await h.locator('[data-fr-main]').innerText(),/-600.00/);
  await h.locator('[data-fr-view=budgets]').click();assert.match(await h.locator('[data-fr-main]').innerText(),/-100.00/);passed('公司部门费用守恒、零负预算和全依据导出');
  await h.locator('[data-fr-view=group]').click();assert.match(await h.locator('[data-fr-main]').innerText(),/未确认/);
  await h.locator('.cf-more summary').click();await h.locator('[name=groupScope]').selectOption('demoApproved');await h.locator('button[type=submit]').click();
  csv=await download(h.locator('[data-fr-export]'));assert.match(csv,/-24000/);assert.match(csv,/30000/);passed('未抵销与批准演示调整分开');
  await h.locator('[data-fr-view=companies]').click();await h.locator('[name=version]').selectOption('corrected');await h.locator('button[type=submit]').click();assert.match(await h.locator('[data-fr-main]').innerText(),/18,500.00/);
  await h.locator('[name=version]').selectOption('published');await h.locator('button[type=submit]').click();assert.match(await h.locator('[data-fr-main]').innerText(),/18,000.00/);await shot('desktop');
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'收起或展开侧栏'}).click();await shot('mobile');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));passed('原发布版保留、桌面窄屏正常');
  await page.setViewportSize({width:1440,height:1000});
  for(const file of ['product-reports.html','channel-reports.html']){
    await page.goto(url('merchant/data/'+file+'?section=contribution'));const r=page.locator('[data-contribution]');await r.locator('[name=dataset]').selectOption('demo');await r.locator('[name=company]').selectOption('A公司（演示）');await r.locator('button[type=submit]').click();
    csv=await download(r.locator('[data-fr-export]'));assert.match(csv,/SA1/);assert.match(csv,/ORDER-3/);assert.match(csv,/合同付款方/);
    if(file==='channel-reports.html'){await r.locator('[name=customer]').fill('科技');await r.locator('button[type=submit]').click();assert.match(await r.locator('[data-fr-main]').innerText(),/1,600.00/);assert.equal(await r.locator('[data-fr-main] tbody tr').count(),1);}
    passed(file+' 同来源贡献及筛选导出');
  }
  await page.goto(url('merchant/data/budget-targets.html?section=budget'));const b=page.locator('[data-profit-budget]');await b.locator('[name=dataset]').selectOption('demo');await b.locator('button[type=submit]').click();csv=await download(b.locator('[data-fr-export]'));assert.match(csv,/-100/);passed('经营任务页引用损益与费用预算');
}).catch(e=>{console.error(e);process.exitCode=1});
