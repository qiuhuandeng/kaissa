const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/evidence/cruise-integration-step1-20261023');
(async () => {
  await fs.mkdir(output, {recursive:true});
  const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const checks=[],errors=[];
  try {
    const fixture=await browser.newPage();await fixture.setContent('<h1>Cruise document preview fixture</h1>');const pdf=await fixture.pdf();await fixture.close();
    for(const protocol of ['file','http']) {
      const page=await browser.newPage({viewport:{width:1440,height:1000}});
      page.on('pageerror',e=>errors.push(protocol+': '+e.message));
      const go=async file=>page.goto(protocol==='file'?pathToFileURL(path.join(root,file.split('?')[0])).href+(file.includes('?')?'?'+file.split('?')[1]:''):'http://127.0.0.1:'+server.address().port+'/'+file);
      const pass=s=>checks.push(protocol+': '+s);
      const stable=async()=>{await page.locator('.modal-overlay.show .modal').waitFor({state:'visible'});await page.locator('.modal-overlay.show .modal').evaluate(async n=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(n.getAnimations().map(a=>a.finished));});await page.waitForFunction(()=>{const nodes=[...document.querySelectorAll('.modal-overlay.show .modal')];return nodes.length>0&&nodes.every(n=>Math.abs(n.getBoundingClientRect().right-innerWidth)<0.05||!n.classList.contains('drawer-modal'));});};
      const save=async()=>{await page.locator('.modal-overlay.show .modal-footer .btn-primary').click();};
      await go('merchant/resource/resource-cruise-ports.html');
      assert.equal(await page.locator('[data-edit-resource]').count(),10);
      await page.locator('#portKeyword').fill('BCN');await page.locator('.btn-filter-search').click();assert.equal(await page.locator('[data-edit-resource]').count(),1);pass('港口按别名搜索');
      await page.locator('[data-edit-resource]').click();await page.locator('[data-field=english]').fill('Barcelona edited');await save();
      await page.locator('[data-edit-resource]').click();assert.equal(await page.locator('[data-field=english]').inputValue(),'Barcelona edited');await page.locator('[data-field=english]').fill('Discard this');await page.locator('[data-close-port-drawer]').first().click();await page.locator('[data-edit-resource]').click();assert.equal(await page.locator('[data-field=english]').inputValue(),'Barcelona edited');await page.locator('[data-close-port-drawer]').first().click();pass('港口编辑保存回显、取消不覆盖');
      await page.locator('[data-cruise-reset]').click();await page.locator('[data-open-port-drawer]').click();await page.locator('[data-field=name]').fill('测试码头');await save();assert.equal(await page.locator('[data-edit-resource]').count(),11);pass('港口新增沿用抽屉、空税费不阻断');
      if(protocol==='file')await page.screenshot({path:path.join(output,'ports-1440.png')});
      await go('merchant/resource/resource-cruise-ships.html');await page.locator('[data-edit-resource="ideal"]').click();
      await page.locator('[data-field=description]').fill('本船介绍已补充');await page.locator('[data-cabin-row]').nth(3).locator('[data-cabin=code]').fill('BC2');await page.locator('[data-cabin-detail]').nth(3).click();await page.locator('.cruise-cabin-detail').nth(3).locator('input').first().fill('24㎡');
      await page.locator('[data-upload-image]').setInputFiles(path.join(root,'client/assets/product-cruise.jpg'));
      await page.locator('[data-upload-docs]').setInputFiles({name:'船舶手册.pdf',mimeType:'application/pdf',buffer:pdf});
      const blob=await page.locator('#shipFiles a').getAttribute('href');assert.equal(await page.evaluate(async u=>(await(await fetch(u)).arrayBuffer()).byteLength,blob),pdf.length);
      await save();await page.locator('[data-edit-resource="ideal"]').click();assert.equal(await page.locator('[data-field=description]').inputValue(),'本船介绍已补充');assert.equal(await page.locator('[data-cabin-row]').nth(3).locator('[data-cabin=code]').inputValue(),'BC2');assert.equal(await page.locator('.cruise-cabin-detail').nth(3).locator('input').first().inputValue(),'24㎡');assert.equal(await page.locator('#shipFiles a').textContent(),'船舶手册.pdf');pass('船舶介绍、舱型代码和面积及实际图片/PDF上传保存');
      await page.locator('[data-add-cabin]').click();assert.equal(await page.locator('[data-cabin-row]').count(),6);await page.locator('[data-remove-cabin]').last().click();assert.equal(await page.locator('[data-cabin-row]').count(),5);pass('原船只抽屉中增删舱型');
      await stable();if(protocol==='file')await page.screenshot({path:path.join(output,'ship-drawer-1440.png')});
      await go('merchant/resource/resource-cruise-routes.html?ship=ideal');assert.equal(await page.locator('[data-edit-resource]').count(),2);await page.locator('[data-edit-resource="japan"]').click();
      assert.equal(await page.locator('[data-stop]').count(),6);assert.equal(await page.locator('[data-stop]').nth(1).locator('[data-stop-arrival]').isDisabled(),true);
      await page.locator('[data-stop]').nth(1).locator('[data-stop-port]').selectOption('nagasaki');await page.locator('[data-stop]').nth(1).locator('[data-stop-arrival]').fill('22:30');await page.locator('[data-stop]').nth(1).locator('[data-stop-overnight]').check();
      await page.locator('[data-add-stop]').click();await page.locator('[data-stop]').last().locator('[data-stop-text]').fill('末日说明');await page.locator('[data-stop-up]').last().click();await save();await page.locator('[data-edit-resource="japan"]').click();assert.equal(await page.locator('[data-stop]').count(),7);assert.equal(await page.locator('[data-field=duration]').inputValue(),'6晚7天');assert.equal(await page.locator('[data-stop]').nth(1).locator('[data-stop-arrival]').inputValue(),'22:30');assert.equal(await page.locator('[data-stop]').nth(1).locator('[data-stop-overnight]').isChecked(),true);assert.equal(await page.locator('[data-stop]').nth(5).locator('[data-stop-text]').inputValue(),'末日说明');pass('原模板抽屉逐港、海上日、过夜、增日和顺序保存');
      await go('merchant/product/product-self-edit.html?type=cruise&mode=edit');
      assert.equal(await page.locator('[data-route-step]').count(),3);assert.equal(await page.locator('[data-line-module-anchor]').count(),4);await page.locator('[data-route-step]').nth(1).click();assert.equal(await page.locator('#lineShipName').inputValue(),'glory');assert.equal(await page.locator('#cabinMatrix tbody tr').count(),5);assert.equal(await page.locator('#lineItinerarySection .route-day-card').count(),8);pass('通用产品保留3步骤4区域并带入船舶、舱型、港口');
      await page.locator('#lineShipName').selectOption('oasis');await page.locator('[data-cruise-replace-cancel]').click();assert.equal(await page.locator('#lineShipName').inputValue(),'glory');
      await page.locator('#lineShipName').selectOption('oasis');await page.locator('[data-cruise-replace-confirm]').click();assert.equal(await page.locator('#cabinMatrix [data-cruise-code]').first().inputValue(),'ZI');assert.match(await page.locator('#lineShipReferenceBody').textContent(),/海洋绿洲/);pass('更换船只的确认/取消及舱型带入');
      await page.locator('#lineCruiseTemplate').selectOption('oasis-west');await page.locator('[data-cruise-replace-confirm]').click();assert.equal(await page.locator('#lineDisembarkPort').inputValue(),'barcelona');assert.equal(await page.locator('#sailingDays').inputValue(),'8');pass('模板在原航程区域带入8天并更新登离港');
      await page.locator('[data-cruise-add-day]').click();assert.equal(await page.locator('#sailingDays').inputValue(),'9');await page.locator('[data-cruise-day-remove]').last().click();assert.equal(await page.locator('#sailingDays').inputValue(),'8');
      const day=page.locator('#lineItinerarySection .route-day-card').nth(1);await day.locator('[data-cruise-port]').selectOption('');assert.equal(await day.locator('[data-cruise-arrival]').isDisabled(),true);assert.equal(await day.locator('[data-cruise-arrival]').inputValue(),'');pass('原逐日卡片增删、海上日清除到离港时间');
      await page.locator('#lineCruisePdf').setInputFiles({name:'航程附件.pdf',mimeType:'application/pdf',buffer:pdf});assert.match(await page.locator('#lineCruisePdfFiles').textContent(),/航程附件/);pass('行程PDF与结构化航程并行维护');
      await page.locator('[data-add-row="#cabinMatrix"]').click();assert.equal(await page.locator('#cabinMatrix tbody tr').count(),6);assert.equal(await page.locator('#cabinMatrix [data-cruise-code]').last().inputValue(),'NEW');
      await page.locator('#cabinMatrix [data-cruise-code]').first().fill('ZI-EDIT');await page.locator('[data-plan-switch]').nth(1).click();assert.equal(await page.locator('[data-plan-switch]').nth(1).evaluate(n=>n.classList.contains('active')),true);assert.equal(await page.locator('#lineCruisePdfFiles a').count(),0);await page.locator('#lineShipName').selectOption('ideal');await page.locator('[data-cruise-replace-confirm]').click();await page.locator('[data-plan-switch]').first().click();assert.equal(await page.locator('[data-plan-switch]').first().evaluate(n=>n.classList.contains('active')),true);assert.match(await page.locator('#lineCruisePdfFiles').textContent(),/航程附件/);assert.equal(await page.locator('#lineShipName').inputValue(),'oasis');assert.equal(await page.locator('#cabinMatrix [data-cruise-code]').first().inputValue(),'ZI-EDIT');pass('原新增舱型及线路切换保持各自引用编辑');
      await page.locator('#lineShipReference').evaluate(n=>n.open=true);await page.locator('#lineShipReference').scrollIntoViewIfNeeded();if(protocol==='file')await page.screenshot({path:path.join(output,'product-reference-1440.png')});
      await page.locator('[data-route-save]').first().click();pass('原保存草稿入口可继续使用');
      for(const type of ['outbound','train','free']){await go('merchant/product/product-self-edit.html?type='+type+'&mode=edit');assert.equal(await page.locator('[data-route-step]').count(),3);assert.equal(await page.locator('#lineShipReference').count(),0);await page.locator('[data-route-step]').nth(1).click();await page.locator('[data-route-save]').first().click();pass(type+'原编辑步骤、内容及保存不引入邮轮区域');}
      for(const width of [1440,1024]){
        await page.setViewportSize({width,height:1000});
        for(const file of ['resource-cruise-ports.html','resource-cruise-ships.html','resource-cruise-routes.html']){
          await go('merchant/resource/'+file);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
          const actions=page.locator('.cruise-resource-list tbody tr').first().locator('td').last();assert.equal(await actions.evaluate(el=>getComputedStyle(el).position),'sticky');
          await page.locator('[data-edit-resource]').first().click();await stable();
          assert.equal(await page.locator('.modal-overlay.show .modal').evaluate(el=>el.getBoundingClientRect().right<=innerWidth+1&&el.getBoundingClientRect().left>=-1),true,file+' '+width+' drawer bounds');
          pass(file+' '+width+'列表及原抽屉布局');
          if(protocol==='file'&&width===1024&&file==='resource-cruise-routes.html')await page.screenshot({path:path.join(output,'route-drawer-1024.png')});
        }
      }
      await page.close();
    }
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(output,'browser.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors,output}));
  } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
