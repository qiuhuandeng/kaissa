const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),out='/private/tmp/caesar-overview-subject';await fs.mkdir(out,{recursive:true});
 const server=http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(await fs.readFile(p));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
 try{for(const protocol of ['file','http']){
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));
 const url=protocol==='file'?pathToFileURL(path.join(root,'merchant/data/performance-reports.html')).href:'http://127.0.0.1:'+server.address().port+'/merchant/data/performance-reports.html';
 await page.goto(url);const host=page.locator('[data-report-page="overview"]'),field=n=>host.locator('[name="'+n+'"]'),tab=key=>page.locator('[data-report-tab="'+key+'"]').click();
 assert.deepEqual(await page.locator('[data-report-tab]').allTextContents(),['订单业绩','回团业绩','损益摘要','资金概况','计划概况','风险概况']);
 for(const [key,value,date] of [['orders','5.40','订单确认日期开始'],['actual','5.60','实际完成日期开始']]){
 await tab(key);assert.equal(await host.locator('table').count(),1);assert.equal(await host.locator('select[name=view]').count(),0);
 assert.match(await host.locator('[data-total]').innerText(),new RegExp(value.replace('.','\\.')));
 assert.equal(await field('start').getAttribute('aria-label'),date);
 const download=page.waitForEvent('download');await host.locator('[data-export]').click();const d=await download;const dest=path.join(out,protocol+'-'+key+'.csv');await d.saveAs(dest);const csv=await fs.readFile(dest,'utf8');
 assert.doesNotMatch(csv,/期间趋势（演示样例）|全部已售未完成安排|本期来源明细|任务与完成率/);assert.match(csv,key==='actual'?/本期回团成交额/:/本期订单净成交额/);
 await host.locator('[data-reset]').click();assert.equal(await field('start').getAttribute('aria-label'),date);checks.push(protocol+': '+key+'单表、日期、金额、导出及重置');
 }
 await tab('orders');await field('company').selectOption('A');await host.locator('[type=submit]').click();const applied=await host.locator('[data-total]').innerText();await field('company').selectOption('B');
 await tab('actual');assert.equal(await field('company').inputValue(),'');await tab('orders');assert.equal(await field('company').inputValue(),'B');assert.equal(await host.locator('[data-total]').innerText(),applied);
 await page.reload();assert.equal(await field('company').inputValue(),'B');assert.equal(await host.locator('[data-total]').innerText(),applied);checks.push(protocol+': 两主题条件、草稿、结果及刷新隔离');
 await host.locator('[data-reset]').click();
 await field('budget').selectOption('sample');await host.locator('[type=submit]').click();assert.match(await host.locator('table').innerText(),/77.14%/);
 await field('responsibility').selectOption('product');await field('grouping').selectOption('division');await host.locator('[type=submit]').click();assert.match(await host.locator('table').innerText(),/B事业部/);
 await host.locator('[data-reset]').click();await field('start').fill('2026-05-07');await host.locator('[type=submit]').click();assert.match(await host.locator('[data-total]').innerText(),/1.00/);
 const before=await host.locator('[data-total]').innerText();await field('end').fill('2026-05-08');await host.locator('[type=submit]').click();assert.match(await host.locator('[data-error]').innerText(),/截止日/);assert.equal(await host.locator('[data-total]').innerText(),before);
 await host.locator('[data-reset]').click();assert.equal(await host.locator('tbody a, tbody button').count(),0);checks.push(protocol+': 样例任务、责任分组、日期筛选、非法日期保留已查询结果及只读');
 for(const width of [1440,768]){await page.setViewportSize({width,height:1000});await page.screenshot({path:path.join(out,protocol+'-'+width+'.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await host.locator('tbody td').evaluateAll(cs=>cs.every(c=>getComputedStyle(c).textAlign==='left')),true);}
 for(const key of ['profit','funds','plan','resources']){await tab(key);assert.equal(await page.locator('[data-report-tab="'+key+'"]').getAttribute('aria-selected'),'true');}
 await page.close();
 }assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors}));}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
