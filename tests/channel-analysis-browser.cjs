const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),out='/private/tmp/caesar-channel-analysis';await fs.mkdir(out,{recursive:true});
 const server=http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(await fs.readFile(p));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
 try{for(const protocol of ['file','http']){
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));
 const url=protocol==='file'?pathToFileURL(path.join(root,'merchant/data/channel-reports.html')).href:'http://127.0.0.1:'+server.address().port+'/merchant/data/channel-reports.html';
 await page.goto(url);const host=page.locator('[data-channel-report]'),field=n=>host.locator('[name="'+n+'"]').first(),tab=key=>page.locator('[data-report-tab="'+key+'"]').click(),submit=()=>host.locator('form').first().locator('[type=submit]').click();
 const csv=async(h,sel)=>{const pending=page.waitForEvent('download');await h.locator(sel).first().click();const d=await pending,p=path.join(out,protocol+'-'+d.suggestedFilename());await d.saveAs(p);return fs.readFile(p,'utf8');};
 assert.deepEqual(await page.locator('[data-report-tab]').allTextContents(),['渠道订单','渠道回团','门店业绩','呼叫中心','产品构成','经营贡献','毛利校验']);
 for(const [key,value] of [['channels','5.40'],['completed','5.60'],['stores',null],['calls',null],['structure',null]]){
 await tab(key);assert.equal(await host.locator('[data-result] table').count(),1);assert.equal(await host.locator('[name=basis]').count(),0);
 const amount=await host.locator('[data-total]').innerText();if(value)assert.match(amount,new RegExp(value));assert.match(await field('start').getAttribute('aria-label'),key==='channels'?/订单确认/:/实际完成/);
 await field('granularity').selectOption('records');await submit();assert.equal(await host.locator('[data-result] table').count(),1);assert.equal(await host.locator('[data-total]').innerText(),amount);assert.match(await host.locator('[data-result] thead').innerText(),/业务明细号/);
 const data=await csv(host,'[data-export]');assert.doesNotMatch(data,/"来源明细"/);assert.match(data,/组成记录/);
 await host.locator('[data-reset]').click();assert.match(await field('start').getAttribute('aria-label'),key==='channels'?/订单确认/:/实际完成/);checks.push(protocol+': '+key+'单表、固定日期、组成守恒、当前导出和重置');
 }
 await tab('channels');await field('level').selectOption('person');await submit();assert.match(await host.locator('thead').innerText(),/员工编号/);
 await field('level').selectOption('store');await submit();assert.match(await host.locator('thead').innerText(),/门店/);
 await host.locator('[data-reset]').click();await field('company').selectOption('A');await submit();const total=await host.locator('[data-total]').innerText();await field('company').selectOption('B');
 await tab('completed');assert.equal(await field('company').inputValue(),'');await tab('channels');assert.equal(await field('company').inputValue(),'B');assert.equal(await host.locator('[data-total]').innerText(),total);await page.reload();assert.equal(await field('company').inputValue(),'B');assert.equal(await host.locator('[data-total]').innerText(),total);
 await field('end').fill('2026-05-08');await submit();assert.equal(await host.locator('[data-error]').isVisible(),true);assert.equal(await host.locator('[data-total]').innerText(),total);await host.locator('[data-reset]').click();checks.push(protocol+': 组织层级、草稿/生效结果、刷新与错误隔离');
 await tab('channel');const c=page.locator('[data-contribution="channel"]');await c.locator('[name=company]').selectOption('A公司（演示）');await c.locator('[type=submit]').click();assert.equal(await c.locator('table').count(),1);assert.match(await c.locator('tbody').innerText(),/1,900.00/);assert.equal(await c.locator('[name=grouping]').isVisible(),false);
 await c.locator('.cf-more>summary').click();await c.locator('[name=channel]').fill('直营');await c.locator('[type=submit]').click();await c.locator('[data-fr-content]').selectOption('contribution');assert.equal(await c.locator('tbody tr').count(),1);
 const data=await csv(c,'[data-fr-export]');assert.match(data,/SA1/);assert.doesNotMatch(data,/ADMIN|FEE1|费用确认及分配依据/);assert.equal(await c.locator('[data-fr-export-all]').isVisible(),false);
 await tab('margin');assert.equal(await page.locator('[data-channel-margin]').isVisible(),true);await tab('stores');await host.locator('[data-reset]').click();await tab('margin');assert.equal(await page.locator('[data-channel-margin]').isVisible(),true);checks.push(protocol+': 渠道贡献同范围汇总组成、公共依据退出及毛利入口回归');
 for(const key of ['channels','completed','stores','calls','structure','channel']){await tab(key);await page.setViewportSize({width:768,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const h=key==='channel'?c:host.locator('[data-result]');assert.equal(await h.locator('tbody td').evaluateAll(cs=>cs.every(c=>getComputedStyle(c).textAlign==='left')),true);assert.equal(await h.locator('tbody a,tbody button').count(),0);await page.screenshot({path:path.join(out,protocol+'-'+key+'-768.png'),fullPage:true});}
 await page.setViewportSize({width:1440,height:1000});await tab('channels');await page.screenshot({path:path.join(out,protocol+'-orders.png'),fullPage:true});await page.close();
 }assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors}));}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
