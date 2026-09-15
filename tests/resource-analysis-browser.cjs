const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),out='/private/tmp/caesar-resource-analysis';await fs.mkdir(out,{recursive:true});
 const server=http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(await fs.readFile(p));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
 try{for(const protocol of ['file','http']){
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));
 const url=protocol==='file'?pathToFileURL(path.join(root,'merchant/data/settlement-reports.html')).href:'http://127.0.0.1:'+server.address().port+'/merchant/data/settlement-reports.html';

 await page.goto(url);const host=page.locator('[data-resource-cost]'),field=n=>host.locator('[name="'+n+'"]'),tab=key=>page.locator('[data-report-tab="'+key+'"]').click(),submit=()=>host.locator('[type=submit]').click();
 const csv=async()=>{const pending=page.waitForEvent('download');await host.locator('[data-fr-export]').click();const d=await pending,p=path.join(out,protocol+'-'+d.suggestedFilename());await d.saveAs(p);return fs.readFile(p,'utf8');};
 await tab('costs');assert.equal(await host.locator('table').count(),1);assert.match(await host.locator('tbody').innerText(),/200,000.00/);assert.equal(await host.locator('[name=tour]').count(),0);
 await field('batch').fill('CABIN-01');await submit();assert.equal(await host.locator('tbody tr').count(),1);
 await host.locator('[data-fr-content]').selectOption('allocations');assert.equal(await host.locator('table').count(),1);assert.equal(await host.locator('tbody tr').count(),4);
 let data=await csv();assert.match(data,/CA-01/);assert.match(data,/CA-04/);assert.doesNotMatch(data,/AA-01|RA-01/);checks.push(protocol+': 批次主表、完整同批次记录、当前层级导出');
 await field('batch').fill('未查询条件');await tab('resources');assert.equal(await field('batch').inputValue(),'');assert.equal(await host.locator('[data-fr-content]').isVisible(),false);assert.equal(await host.locator('table').count(),1);
 await tab('costs');assert.equal(await field('batch').inputValue(),'未查询条件');assert.equal(await host.locator('tbody tr').count(),4);await page.reload();assert.equal(await field('batch').inputValue(),'未查询条件');assert.equal(await host.locator('tbody tr').count(),4);checks.push(protocol+': 汇总组成、查询草稿及Tab/刷新独立');
 await host.locator('[data-fr-reset]').click();await field('start').fill('2026-10-01');await submit();assert.equal(await host.locator('.cf-error').isVisible(),true);assert.equal(await host.locator('tbody tr').count(),0);assert.equal(await host.locator('[data-fr-export]').isDisabled(),true);await host.locator('[data-fr-reset]').click();
 await tab('resources');data=await csv();assert.doesNotMatch(data,/CA-01|分配确认号/);
 await host.locator('.cf-columns>summary').click();await host.locator('[data-fr-column=unusedFunds]').check();assert.match(await host.locator('tbody').innerText(),/未提供/);checks.push(protocol+': 日期错误清空、资源风险无分配、缺占用不补零');
 for(const key of ['costs','resources']){await tab(key);for(const width of [1440,768]){await page.setViewportSize({width,height:1000});await host.locator('[data-fr-main]').evaluate(el=>el.scrollLeft=el.scrollWidth);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await host.locator('tbody td').evaluateAll(cs=>cs.every(c=>getComputedStyle(c).textAlign==='left'&&c.scrollWidth<=c.clientWidth+1)),true);await page.screenshot({path:path.join(out,protocol+'-'+key+'-'+width+'.png'),fullPage:true});}}
 assert.equal(await host.locator('tbody a,tbody button').count(),0);
 await page.goto(url.replace('settlement-reports','product-reports'));await tab('resources');assert.equal(await page.locator('[data-resource-cost] table').count(),1);assert.match(await page.locator('[data-resource-cost] tbody').innerText(),/CABIN-01/);checks.push(protocol+': 桌面/768只读与横滚、产品风险共享入口');
 await page.close();
 }assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors}));}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
