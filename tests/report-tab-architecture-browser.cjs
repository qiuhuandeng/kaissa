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
run('report-tab-architecture', async ({ page, url, shot, passed }) => {
 page.on('pageerror', e => console.error(e.stack));
 for (const [file,[title,...tabs]] of Object.entries(pages)) {
  await page.goto(url('merchant/data/'+file+'.html'));
  await page.locator('[data-report-tab][aria-selected="true"]').waitFor();
  assert.equal(await page.locator('h1:visible').innerText(),title);
  assert.deepEqual(await page.locator('[data-report-tab]').allTextContents(),tabs);
  assert.equal(await page.locator('.report-links').count(),0);
  for (const label of tabs) {
   await page.getByRole('tab', {name:label,exact:true}).click();
   assert.equal(await page.locator('[role="tablist"]:visible').count(),1,file+'/'+label);
   assert.equal(await page.locator('[data-report-tab][aria-selected="true"]').innerText(),label);
   assert.ok(await page.locator('table:visible').count(),file+'/'+label+' result');
   assert.equal(await page.locator('[role="alert"]:visible').count(),0,file+'/'+label);
  }
  await page.reload();
  await page.locator('[data-report-tab][aria-selected="true"]').waitFor();
  assert.equal(await page.locator('[data-report-tab][aria-selected="true"]').innerText(),tabs.at(-1));
  if (['product-reports','return-report-details','report-management'].includes(file)) await shot(file);
  passed(file+'：全部 Tab、唯一层级、结果、刷新恢复');
  console.log('PASS '+file);
 }
}).catch(e => { console.error(e); process.exitCode=1; });
