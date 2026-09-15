const { run, assert, openReport } = require('./finance-report-browser-support.cjs');
const pages = {
 'performance-reports':['经营总览','经营规模','损益摘要','资金概况','计划概况','风险概况'],
 'monthly-profit-reports':['月度损益','公司损益','部门损益','费用构成','预算差异','集团调整'],
 'product-reports':['产品分析','经营业绩','产品结构','渠道构成','跨年收客','经营贡献','产品风险'],
 'channel-reports':['渠道分析','渠道概况','门店业绩','呼叫中心','产品构成','经营贡献','毛利校验'],
 'settlement-reports':['业务毛利','毛利明细','部门毛利','结算异常','结算调整','成本分配','资源风险'],
 'supplier-reports':['供应商分析','采购汇总','采购明细','返点核对','返点分配','预付占用'],
 'order-report-details':['订单明细','成交净值','成交变动'],
 'return-report-details':['回团明细','实际完成','已售未完','完成核对','完成后调整'],
 'cashflow-reports':['收付明细','收款','退款','转款','付款'],
 'balance-reports':['往来账龄','应收余额','应付余额','账龄分析','内部清算'],
 'prepayment-reports':['预款余额','预收款','预存款','预付款','保证金'],
 'fund-reports':['资金分析','账户余额','账户收支','收支汇总','资金计划'],
 'invoice-reports':['票款核对','已收未开','已开未收','已付未收票','已收票未付'],
 'accounting-reports':['核算核对','确认明细','结算对照','内部对账','凭证核对'],
 'budget-targets':['任务预算','经营任务','批准预算'],
 'report-management':['数据管理','数据核对','分类规则','组织对应','版本记录','查看范围','订阅设置']
};
run('report-tab-architecture', async ({ page, url, shot, download, passed }) => {
 page.on('pageerror', e => console.error(e.stack));
 for (const [file,[title,...tabs]] of Object.entries(pages)) {
  await page.goto(url('merchant/data/'+file+'.html'));
  await page.locator('[data-report-tab][aria-selected="true"]').waitFor();
  assert.equal(await page.locator('h1:visible').count(),0,file+' page title hidden');
  assert.equal(await page.title(),title+' - 凯撒旅游');
  assert.deepEqual(await page.locator('[data-report-tab]').allTextContents(),tabs);
  assert.ok([title,...tabs].every(t=>Array.from(t).length<=5));
  assert.equal(await page.locator('.report-links').count(),0);
  for (const label of tabs) {
   await page.getByRole('tab', {name:label,exact:true}).click();
   assert.equal(await page.locator('[role="tablist"]:visible').count(),1,file+'/'+label);
   assert.equal(await page.locator('[data-report-tab][aria-selected="true"]').innerText(),label);
   assert.ok(await page.locator('table:visible').count(),file+'/'+label+' result');
   assert.ok(await page.locator('table:visible').first().locator('tbody tr').count(),file+'/'+label+' default data');
   assert.doesNotMatch(await page.locator('body').innerText(),/演示|非正式|算例|来源待接入/,file+'/'+label+' redundant copy removed');
   assert.equal(await page.locator('[role="alert"]:visible').count(),0,file+'/'+label);
   const form=page.locator('form.data-report-filter-surface:visible').last();await form.waitFor();const dataset=form.locator('[name=dataset]');
   assert.ok(await form.locator('.data-filter-label').evaluateAll(labels=>labels.every(el=>{const style=getComputedStyle(el);return style.position==='absolute'&&el.getBoundingClientRect().width<=1.1;})),file+'/'+label+' filter labels hidden');
   const more=form.locator('details').filter({hasText:'更多筛选'}).first();
   if(await more.count()){if(!await more.evaluate(el=>el.open))await more.locator(':scope > summary').click();assert.ok(await more.evaluate(el=>el.open),file+'/'+label+' more filters');}
   if(await dataset.count() && await dataset.locator('option[value=demo]').count())await dataset.selectOption('demo');
   await form.locator('button[type=submit]').click();
   assert.equal(await page.locator('[role="alert"]:visible').count(),0,file+'/'+label+' query');
   const exp=page.locator('[data-export]:visible,[data-fr-export]:visible,[data-cf-export]:visible,[data-ba-export]:visible').first();
   assert.ok(await exp.count(),file+'/'+label+' export retained');
   assert.ok(await exp.evaluate(button=>{const reset=button.parentElement.querySelector('[data-reset],[data-fr-reset],[data-cf-reset],[data-ba-reset],[data-rf-reset],[data-margin-reset]');return !!reset&&Array.from(button.parentElement.children).indexOf(button)>Array.from(button.parentElement.children).indexOf(reset);}),file+'/'+label+' export after reset');
   assert.equal(await page.locator('.report-note:visible,.cf-definition:visible').count(),0,file+'/'+label+' basis note hidden');
   assert.ok(await page.locator('.data-report-result-surface:visible').count(),file+'/'+label+' result card');
   if(await exp.isEnabled())assert.ok((await download(exp)).length>100,file+'/'+label+' full export');
   if(!['budget-targets','report-management'].includes(file))assert.equal(await page.locator('table:visible tbody a,table:visible tbody button').count(),0,file+' read only');
  }
  await page.reload();
  await page.locator('[data-report-tab][aria-selected="true"]').waitFor();
  assert.equal(await page.locator('[data-report-tab][aria-selected="true"]').innerText(),tabs.at(-1));
  if (['product-reports','return-report-details','report-management'].includes(file)) await shot(file);
  await page.setViewportSize({width:390,height:844});
  if(!await page.locator('.nav-collapsed').count())await page.getByRole('button',{name:'收起或展开侧栏'}).click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file+' mobile width');
  assert.equal(await page.locator('[role=tablist]:visible').count(),1);
  await page.locator('[data-report-tab][aria-selected=true]').focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('[data-report-tab][aria-selected=true]').innerText(),tabs[0]);
  await page.keyboard.press('End');assert.equal(await page.locator('[data-report-tab][aria-selected=true]').innerText(),tabs.at(-1));
  if(file==='product-reports')await shot('single-tabs-mobile');
  await page.setViewportSize({width:1440,height:1000});
  passed(file+'：全部 Tab、查询导出、只读、刷新、窄屏与键盘');
  console.log('PASS '+file);
 }
}).catch(e => { console.error(e); process.exitCode=1; });
