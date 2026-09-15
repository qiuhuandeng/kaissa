const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),out='/private/tmp/caesar-product-analysis';await fs.mkdir(out,{recursive:true});
 const server=http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(await fs.readFile(p));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
 try{for(const protocol of ['file','http']){
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));
 const url=protocol==='file'?pathToFileURL(path.join(root,'merchant/data/product-reports.html')).href:'http://127.0.0.1:'+server.address().port+'/merchant/data/product-reports.html';
 await page.goto(url);const host=page.locator('[data-report-page="products"]'),field=n=>host.locator('[name="'+n+'"]'),tab=key=>page.locator('[data-report-tab="'+key+'"]').click(),submit=()=>host.locator('[type=submit]').click();
 const csv=async(h,selector)=>{const pending=page.waitForEvent('download');await h.locator(selector).click();const d=await pending,p=path.join(out,protocol+'-'+d.suggestedFilename());await d.saveAs(p);return fs.readFile(p,'utf8');};
 assert.deepEqual(await page.locator('[data-report-tab]').allTextContents(),['产品订单','产品回团','产品结构','渠道构成','跨年收客','经营贡献','产品风险']);
 for(const [key,value,date] of [['organizations','5.40','订单确认日期开始'],['completed','5.60','实际完成日期开始']]){
 await tab(key);assert.equal(await host.locator('table').count(),1);assert.match(await host.locator('[data-total]').innerText(),new RegExp(value));
 assert.equal(await field('start').getAttribute('aria-label'),date);assert.equal(await host.locator('[name=view]').count(),0);
 let data=await csv(host,'[data-export]');assert.doesNotMatch(data,/本次查询来源明细|未完成月份与状态/);
 await field('productGranularity').selectOption('records');await submit();assert.equal(await host.locator('table').count(),1);assert.match(await host.locator('thead').innerText(),/记录号/);assert.match(await host.locator('[data-total]').innerText(),new RegExp(value));
 await host.locator('[data-reset]').click();assert.equal(await field('start').getAttribute('aria-label'),date);
 checks.push(protocol+': '+key+'独立日期/金额、汇总组成一致、导出和重置');
 }
 await tab('organizations');await field('company').selectOption('A');await submit();const total=await host.locator('[data-total]').innerText();await field('company').selectOption('B');
 await tab('completed');assert.equal(await field('company').inputValue(),'');await tab('organizations');assert.equal(await field('company').inputValue(),'B');assert.equal(await host.locator('[data-total]').innerText(),total);
 await page.reload();assert.equal(await field('company').inputValue(),'B');assert.equal(await host.locator('[data-total]').innerText(),total);checks.push(protocol+': 草稿与已查询条件、Tab及刷新隔离');
 for(const key of ['structure','channels']){await tab(key);assert.equal(await field('start').getAttribute('aria-label'),'实际完成日期开始');assert.equal(await host.locator('table').count(),1);}
 await tab('crossYear');assert.equal(await field('crossBasis').locator('option').count(),1);assert.match(await host.locator('[data-total]').innerText(),/7.40/);assert.match(await host.locator('[data-total]').innerText(),/5.60.*1.80/);
 await field('productGranularity').selectOption('records');await submit();assert.equal(await host.locator('table').count(),1);assert.match(await host.locator('[data-total]').innerText(),/7.40/);
 await field('targetYear').selectOption('2027');await submit();assert.match(await host.locator('[data-total]').innerText(),/0.90/);checks.push(protocol+': 结构渠道固定完成；跨年矩阵组成及次年未完不混当期');
 await tab('completed');await field('end').fill('2026-05-08');await submit();assert.equal(await host.locator('[data-error]').isVisible(),true);assert.match(await host.locator('[data-total]').innerText(),/5.60/);await host.locator('[data-reset]').click();
 await tab('product');const c=page.locator('[data-contribution="product"]');assert.equal(await c.locator('table').count(),1);assert.match(await c.locator('[data-fr-main]').innerText(),/4,900.00/);
 await c.locator('.cf-more > summary').click();await c.locator('[name=company]').selectOption('A公司（演示）');await c.locator('[name=channel]').fill('直营');await c.locator('[type=submit]').click();assert.match(await c.locator('[data-fr-main]').innerText(),/1,900.00/);
 await c.locator('[data-fr-content]').selectOption('contribution');assert.equal(await c.locator('table').count(),1);assert.equal(await c.locator('tbody tr').count(),1);assert.match(await c.locator('tbody').innerText(),/SA1/);
 let data=await csv(c,'[data-fr-export]');assert.doesNotMatch(data,/FEE1|FEE2|ADMIN|会计确认及调整依据|费用确认及分配依据/);
 assert.equal(await c.locator('tbody a,tbody button').count(),0);await tab('crossYear');await tab('product');assert.equal(await c.locator('[data-fr-content]').inputValue(),'contribution');checks.push(protocol+': 贡献汇总组成同范围、费用不重复、单表导出和层级恢复');
 for(const key of ['organizations','completed','crossYear','product']){await tab(key);await page.setViewportSize({width:768,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const h=key==='product'?c:host;assert.equal(await h.locator('tbody td').evaluateAll(cs=>cs.every(c=>getComputedStyle(c).textAlign==='left')),true);await page.screenshot({path:path.join(out,protocol+'-'+key+'-768.png'),fullPage:true});}
 await page.setViewportSize({width:1440,height:1000});assert.equal(await c.locator('[data-fr-export-all]').isVisible(),false);await page.screenshot({path:path.join(out,protocol+'-contribution.png'),fullPage:true});await page.close();
 }assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors}));}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
