const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),output='/private/tmp/caesar-finance-analysis-sample';
async function main(){
 await fs.mkdir(output,{recursive:true});const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))throw Error('outside');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[],checks=[];
 try{browser=await chromium.launch({channel:'chrome',headless:true});
 for(const protocol of ['file','http']){
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
  const url=(file,query='')=>(protocol==='file'?pathToFileURL(path.join(root,'merchant/data',file+'.html')).href:'http://127.0.0.1:'+server.address().port+'/merchant/data/'+file+'.html')+query;
  const visibleTables=()=>page.locator('main table').evaluateAll(ts=>ts.filter(t=>t.checkVisibility()&&!t.closest('details:not([open])')).length);
  let host=page.locator('#finance-cashflow'),field=n=>host.locator('form [name="'+n+'"]'),submit=()=>host.locator('button[type=submit]').click();
  const select=async key=>{await page.locator('[data-report-tab="'+key+'"]').click();await host.locator('[data-fr-main]').waitFor();};
  const exportCsv=async()=>{const pending=page.waitForEvent('download');await host.locator('[data-fr-export]').click();const d=await pending;const file=path.join(output,protocol+'-'+d.suggestedFilename());await d.saveAs(file);return fs.readFile(file,'utf8');};
  await page.goto(url('cashflow-reports'));await host.locator('[data-fr-main]').waitFor();
  assert.equal(await page.locator('[data-report-tab]').count(),7);
  for(const key of ['receipt','refund','transfer','payment','allocations','writeoffs','trace']){await select(key);assert.equal(await visibleTables(),1);assert.ok(await host.locator('[data-fr-main] tbody tr').count());assert.equal(await host.locator('[data-fr-content]').isVisible(),false);const data=await exportCsv();assert.doesNotMatch(data,/核对缺口与重复记录|原款与转款依据|分配与核销依据/);checks.push(protocol+': '+key+' 单主表及当前主题导出');}
  await select('receipt');await field('keyword').fill('SK26090201');await submit();assert.match(await host.locator('[data-fr-main]').innerText(),/100,000.00/);
  await field('keyword').fill('未查询条件');let csv=await exportCsv();assert.match(csv,/SK26090201/);assert.doesNotMatch(csv,/未查询条件/);
  await select('payment');await select('receipt');assert.equal(await field('keyword').inputValue(),'未查询条件');assert.match(await host.locator('[data-fr-main]').innerText(),/SK26090201/);
  await page.reload();await host.locator('[data-fr-main]').waitFor();assert.equal(await field('keyword').inputValue(),'未查询条件');checks.push(protocol+': 草稿条件与生效结果分离、Tab及刷新恢复');
  await host.locator('[data-fr-reset]').click();await field('start').fill('2026-10-31');await field('end').fill('2026-09-01');await submit();assert.equal(await host.locator('.cf-error').isVisible(),true);assert.equal(await host.locator('[data-fr-main] tbody tr').count(),0);assert.equal(await host.locator('[data-fr-export]').isDisabled(),true);
  await select('payment');await select('receipt');assert.equal(await host.locator('[data-fr-export]').isDisabled(),true);await page.reload();await host.locator('[data-fr-main]').waitFor();assert.equal(await host.locator('[data-fr-main] tbody tr').count(),0);await host.locator('[data-fr-reset]').click();checks.push(protocol+': 无效日期清空结果及刷新不复活旧结果');
  await field('keyword').fill('SK260921');await submit();assert.equal(await host.locator('[data-fr-main] tbody tr').count(),10);await host.locator('[data-fr-next]').click();assert.match(await host.locator('[data-fr-count]').innerText(),/第 2/);csv=await exportCsv();assert.match(csv,/SK260921025/);assert.match(csv,/'=外部文本/);
  await page.evaluate(()=>window.print=()=>{window.__printed=document.querySelector('[data-cf-print-area]').innerHTML;});await host.locator('[data-cf-print]').click();assert.equal(await host.locator('.cf-print-company').count(),2);assert.equal(await host.locator('.cf-print-company tbody tr').count(),25);assert.equal(await host.locator('.cf-print-company table').first().locator('th').count(),12);checks.push(protocol+': 分页全量导出、文本转义及两公司收款打印');
  await host.locator('[data-fr-reset]').click();await page.screenshot({path:path.join(output,protocol+'-cashflow.png')});
  await page.goto(url('balance-reports','?tab=orders'));host=page.locator('#finance-order-cash');await host.locator('[data-fr-main]').waitFor();assert.equal(await visibleTables(),1);assert.equal(await page.locator('[data-report-tab]').count(),5);
  await field('order').fill('KS-ORDER-001');await submit();assert.match(await host.locator('[data-fr-main]').innerText(),/100,000.00/);assert.match(await host.locator('[data-fr-main]').innerText(),/分配与核销待核对/);
  await host.locator('.cf-columns summary').click();await host.locator('[data-fr-column="arBalance"]').check();await host.locator('[data-fr-column="receiptUnwritten"]').check();csv=await exportCsv();assert.match(csv,/账面应收余额/);assert.match(csv,/"50000"/);assert.match(csv,/"10000"/);
  await page.locator('[data-report-tab="ar"]').click();assert.ok(await page.locator('[data-ba-main] tbody tr').count());await select('orders');assert.equal(await field('order').inputValue(),'KS-ORDER-001');checks.push(protocol+': 订单收付综合及原余额主题保留');
  await host.locator('[data-fr-reset]').click();await field('order').fill('KS-ORDER-002');await submit();assert.match(await host.locator('[data-fr-main]').innerText(),/30,000.00/);await field('asOf').fill('2026-10-05');await submit();assert.match(await host.locator('[data-fr-main]').innerText(),/80,000.00/);
  await field('order').fill('NOT-EXIST');await submit();assert.equal(await host.locator('[data-fr-main] tbody tr').count(),0);await host.locator('[data-fr-reset]').click();
  await page.screenshot({path:path.join(output,protocol+'-orders.png')});
  for(const width of [1280,768]){await page.setViewportSize({width,height:900});assert.equal(await visibleTables(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.ok(await host.locator('[data-fr-main]').evaluate(e=>e.scrollWidth>e.clientWidth));assert.ok(await host.locator('[data-fr-main] th, [data-fr-main] td').evaluateAll(es=>es.every(e=>getComputedStyle(e).textAlign==='left')));await host.locator('[data-fr-main]').evaluate(e=>e.scrollLeft=e.scrollWidth);assert.ok(await host.locator('[data-fr-main]').evaluate(e=>e.getBoundingClientRect().right<=e.closest('.data-report-result-surface').getBoundingClientRect().right));assert.ok(await host.locator('[data-fr-main] tbody td').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1)));await page.screenshot({path:path.join(output,protocol+'-orders-'+width+'.png')});}checks.push(protocol+': 历史截止、空查询、宽窄屏横滚与全左对齐');
  await page.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors,output}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
