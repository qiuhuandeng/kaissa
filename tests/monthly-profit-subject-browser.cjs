const assert=require('node:assert/strict'),{chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url=file=>process.env.REPORT_BASE_URL?process.env.REPORT_BASE_URL+'/merchant/data/'+file+'.html':pathToFileURL(path.resolve('merchant/data/'+file+'.html')).href;
 try{
  await page.goto(url('monthly-profit-reports'));await page.locator('[data-report-tab]').first().waitFor();
  const cases={companies:[],departments:[],expenses:['fees'],budgets:[],group:['details'],management:['details']};
  for(const [tab,options] of Object.entries(cases)){
   await page.locator('[data-report-tab="'+tab+'"]').click();await page.waitForTimeout(160);
   assert.equal(await page.locator('table:visible').count(),1);
   assert.equal(await page.locator('[data-monthly-profit] [data-fr-content]').isVisible(),options.length>0);
   assert.deepEqual(await page.locator('[data-monthly-profit] [data-fr-content]').evaluate(e=>[...e.options].slice(1).map(o=>o.value)),options);
   for(const option of options){await page.locator('[data-monthly-profit] [data-fr-content]').selectOption(option);await page.waitForTimeout(150);assert.equal(await page.locator('table:visible').count(),1);}
  }
  await page.reload();await page.waitForTimeout(160);assert.equal(await page.locator('[data-monthly-profit] [data-fr-content]').inputValue(),'details');
  await page.locator('[data-report-tab="departments"]').click();await page.waitForTimeout(150);assert.equal(await page.locator('[data-monthly-profit] [data-fr-content]').isVisible(),false);
  await page.screenshot({path:'/private/tmp/monthly-subject.png',fullPage:true});
  await page.goto(url('budget-targets'));await page.locator('[data-report-tab="budgets"]').click();await page.waitForTimeout(200);
  assert.equal(await page.locator('table:visible').count(),1);assert.equal(await page.locator('[data-fr-content]:visible').count(),0);
  const table=await page.locator('table:visible').innerText();assert(table.includes('批准预算'));assert(!table.includes('实际减预算'));
  const dl=page.waitForEvent('download');await page.locator('[data-profit-budget] [data-fr-export]').click();await(await dl).saveAs('/private/tmp/approved-budget.csv');
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tabs:7,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
