const { run, assert, openReport } = require('./finance-report-browser-support.cjs');
run('report-tab-state', async ({page,url,download,shot,passed}) => {
  // These checks use ordinary Tab clicks. No query conditions are copied between views.
  const cases = [
    ['product-reports','organizations','structure','[data-report-page]','company','A','B','[data-table=main]'],
    ['channel-reports','channels','stores','[data-channel-report]','company','A','B','[data-result] table'],
    ['settlement-reports','tours','groups','[data-settlement-report]','keyword','不存在甲','不存在乙','[data-result] table'],
    ['supplier-reports','summary','purchases','[data-supplier-report]','keyword','不存在甲','不存在乙','[data-result] table'],
    ['order-report-details','orders','changes','[data-report-page]','company','A','B','[data-table=main]'],
    ['return-report-details','actual','future','[data-report-page]','company','A','B','[data-table=main]'],
    ['monthly-profit-reports','companies','departments','[data-monthly-profit]','company','A公司（演示）','B公司（演示）','[data-fr-main]'],
    ['cashflow-reports','receipt','refund','#finance-cashflow','company','北京凯撒旅游','福建凯撒旅游','[data-cf-main]'],
    ['balance-reports','ar','ap','#finance-balances','company','北京凯撒旅游','福建凯撒旅游','[data-ba-main]'],
    ['fund-reports','accounts','movements','#finance-funds','company','北京凯撒','福建凯撒','[data-fr-main]'],
    ['prepayment-reports','advance','deposit','#finance-prepayments','company','北京凯撒','福建凯撒','[data-fr-main]'],
    ['invoice-reports','received','issued','#finance-invoice-report','company','北京凯撒','福建凯撒','[data-fr-main]']
  ];
  async function fill(field,value){if(await field.evaluate(e=>e.tagName==='SELECT'))await field.selectOption(value);else await field.fill(value);}
  for(const [file,first,second,selector,name,a,b,resultSelector] of cases){
    await page.goto(url('merchant/data/'+file+'.html'));const host=page.locator(selector);
    await page.locator('[data-report-tab='+first+']').click();
    const dataset=host.locator('form [name=dataset]');
    if(await dataset.count() && await dataset.locator('option[value=demo]').count())await dataset.selectOption('demo');
    // Open advanced query conditions only when needed.
    const field=host.locator('form [name='+name+']');if(!await field.isVisible())await field.evaluate(e=>{let p=e.parentElement;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}});
    await fill(field,a);await host.locator('form button[type=submit]').click();
    assert.equal(await host.locator('[role=alert]:visible').count(),0,file+' query');
    const before=await host.locator(resultSelector).first().innerText();
    const exportButton=host.locator('[data-export]:visible,[data-fr-export]:visible,[data-cf-export]:visible,[data-ba-export]:visible').first();
    const csvBefore=await exportButton.isEnabled()?await download(exportButton):null;
    await fill(field,b); // leave unqueried draft in first Tab
    await page.locator('[data-report-tab='+second+']').click();
    const secondField=host.locator('form [name='+name+']');
    assert.equal(await secondField.inputValue(),'',file+' own defaults');
    if(await dataset.count() && await dataset.locator('option[value=demo]').count())await dataset.selectOption('demo');
    if(!await secondField.isVisible())await secondField.evaluate(e=>{let p=e.parentElement;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}});
    await fill(secondField,b);await host.locator('form button[type=submit]').click();
    const secondResult=await host.locator(resultSelector).first().innerText();
    await page.locator('[data-report-tab='+first+']').click();
    assert.equal(await field.inputValue(),b,file+' draft restored');
    assert.equal(await host.locator(resultSelector).first().innerText(),before,file+' applied result restored');
    if(csvBefore!==null)assert.equal(await download(exportButton),csvBefore,file+' export uses applied conditions');
    const invalid=host.locator('form [name=end],form [name=periodEnd],form [name=asOf]').first();
    if(await invalid.count()){
      await invalid.fill(await invalid.getAttribute('name')==='asOf'?'':await invalid.evaluate(e=>e.type==='month')?'1900-01':'1900-01-01');
      await host.locator('form button[type=submit]').click();
      assert.ok(await host.locator('[role=alert]:visible').count(),file+' validation');
      assert.equal(await host.locator(resultSelector).first().innerText(),before,file+' failure preserves result');
      if(csvBefore!==null)assert.equal(await download(exportButton),csvBefore,file+' failure export');
      await page.locator('[data-report-tab='+second+']').click();
      assert.equal(await host.locator(resultSelector).first().innerText(),secondResult,file+' second unaffected');
      await page.locator('[data-report-tab='+first+']').click();
      assert.ok(await host.locator('[role=alert]:visible').count(),file+' own error restored');
    }
    await page.reload();await page.locator('[data-report-tab][aria-selected=true]').waitFor();
    assert.equal(await field.inputValue(),b,file+' refresh draft');
    assert.equal(await host.locator(resultSelector).first().innerText(),before,file+' refresh applied');
    await page.locator('[data-report-tab='+second+']').click();
    await openReport(page,'budget-targets');await page.locator('[data-budget-targets]').waitFor();
    await openReport(page,file);await page.locator('[data-report-tab='+second+'][aria-selected=true]').waitFor();
    assert.equal(await host.locator(resultSelector).first().innerText(),secondResult,file+' reopen preserves results');
    passed(file+'：独立条件、查询草稿、失败及导出、刷新与菜单恢复');
    console.log('PASS state '+file);
  }
}).catch(e=>{console.error(e);process.exitCode=1});
