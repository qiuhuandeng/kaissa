const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),out='/private/tmp/caesar-overview-summary';await fs.mkdir(out,{recursive:true});
 const server=http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(await fs.readFile(p));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
 try{for(const protocol of ['file','http']){
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));
 const url=protocol==='file'?pathToFileURL(path.join(root,'merchant/data/performance-reports.html')).href:'http://127.0.0.1:'+server.address().port+'/merchant/data/performance-reports.html';
 await page.goto(url);const host=page.locator('[data-overview-finance]'),field=n=>host.locator('[name="'+n+'"]'),tab=key=>page.locator('[data-report-tab="'+key+'"]').click(),submit=()=>host.locator('[type=submit]').click();
 const csv=async()=>{const pending=page.waitForEvent('download');await host.locator('[data-fr-export]').click();const d=await pending,p=path.join(out,protocol+'-'+d.suggestedFilename());await d.saveAs(p);return fs.readFile(p,'utf8');};
 for(const [key,match] of [['profit',/3,400.00/],['funds',/97,900.00/],['plan',/15,000.00/],['resources',/不可退未售/]]){
 await tab(key);assert.equal(await host.locator('table').count(),1);assert.equal(await host.locator('[data-fr-content]').isVisible(),false);assert.match(await host.locator('[data-fr-main]').innerText(),match);assert.equal(await host.locator('tbody a,tbody button').count(),0);
 const data=await csv();assert.doesNotMatch(data,/实际账户依据|相关资源分配依据|有效与未纳入资金安排依据/);assert.equal(await host.locator('[data-fr-export-all]').isVisible(),false);
 await page.screenshot({path:path.join(out,protocol+'-'+key+'.png'),fullPage:true});checks.push(protocol+': '+key+'单主表、当前主题导出及只读');
 }
 await tab('plan');assert.equal(await field('asOf').isVisible(),false);assert.equal(await field('month').isVisible(),false);assert.equal(await field('planFrom').isVisible(),true);
 await field('level').selectOption('group');await field('taskVersion').selectOption('sample');await submit();assert.match(await host.locator('[data-fr-main]').innerText(),/77.14%/);
 await field('metric').selectOption('actual');assert.match(await csv(),/77.14%/);await tab('profit');await tab('plan');assert.equal(await field('metric').inputValue(),'actual');assert.match(await host.locator('[data-fr-main]').innerText(),/77.14%/);
 await page.reload();assert.equal(await field('metric').inputValue(),'actual');assert.match(await host.locator('[data-fr-main]').innerText(),/77.14%/);await submit();assert.match(await host.locator('[data-fr-main]').innerText(),/56,000.00/);assert.doesNotMatch(await host.locator('[data-fr-main]').innerText(),/77.14%/);checks.push(protocol+': 经营指标、任务匹配、未提交导出、切换及刷新隔离');
 await field('planThrough').fill('2026-05-08');await submit();assert.equal(await host.locator('.cf-error').isVisible(),true);assert.equal(await host.locator('tbody tr').count(),0);assert.equal(await host.locator('[data-fr-export]').isDisabled(),true);
 await host.locator('[data-fr-reset]').click();assert.equal(await field('metric').inputValue(),'orders');checks.push(protocol+': 超截止错误清空结果及重置');
 await tab('funds');assert.equal(await field('planThrough').isVisible(),false);await field('company').fill('北京凯撒');await submit();assert.equal(await host.locator('tbody tr').count(),1);
 await tab('resources');await field('asOf').fill('2026-09-29');await submit();assert.equal(await host.locator('[data-fr-export]').isDisabled(),true);await host.locator('[data-fr-reset]').click();
 for(const key of ['profit','funds','plan','resources']){await tab(key);await page.setViewportSize({width:768,height:1000});await host.locator('[data-fr-main]').evaluate(e=>e.scrollLeft=e.scrollWidth);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await host.locator('tbody td').evaluateAll(cs=>cs.every(c=>getComputedStyle(c).textAlign==='left'&&c.scrollWidth<=c.clientWidth+1)),true);
 await page.screenshot({path:path.join(out,protocol+'-'+key+'-768.png'),fullPage:true});}
 checks.push(protocol+': 专属筛选、历史资源缺数及四主题窄屏');
 await page.close();
 }assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors}));}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
