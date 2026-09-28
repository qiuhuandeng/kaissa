const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const browser = process.env.SALES_SCROLL_BROWSER_URL || 'http://127.0.0.1:19439';
const site = process.env.SALES_SITE_URL || 'http://127.0.0.1:4182';
const output = path.resolve(__dirname, '../sales/screenshots/scroll');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, target, sequence = 0, checks = 0;
const pending = new Map(), errors = [], results = [];
async function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 10000);
    pending.set(id, {resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); }});
    ws.send(JSON.stringify({id, method, params}));
  });
}
async function run(expression) {
  const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
const pageText = () => run('document.querySelector("#swRoot").innerText');
async function open(url) {
  await send('Page.navigate', {url});
  await pause(100);
  for (let i = 0; i < 100; i++) {
    if (await run('document.readyState === "complete" && !!document.querySelector("#swRoot .sw-main")')) return;
    await pause(30);
  }
  throw Error('Page unavailable: ' + url);
}
async function nav(hash) { await run('location.hash=' + JSON.stringify(hash)); await pause(80); }
async function click(selector) {
  assert.ok(await run('!!document.querySelector(' + JSON.stringify(selector) + ')'), selector);
  await run('document.querySelector(' + JSON.stringify(selector) + ').click()'); await pause(80);
}
async function shot(name) {
  await send('Page.bringToFront');
  await run('document.querySelector("#swToast").style.display="none"');
  await pause(100);
  const result = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
  fs.mkdirSync(output, {recursive: true});
  fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(result.data, 'base64'));
}
const metrics = () => run(`({y:scrollY,max:document.scrollingElement.scrollHeight-innerHeight,htmlOverflow:getComputedStyle(document.documentElement).overflowY,bodyOverflow:getComputedStyle(document.body).overflowY,bodyHeight:getComputedStyle(document.body).height,viewport:innerHeight,scrollHeight:document.scrollingElement.scrollHeight})`);
async function wheel(deltaY = 100000) {
  const point = await run('({x:innerWidth/2,y:innerHeight/2})');
  await send('Input.dispatchMouseEvent', {type:'mouseWheel',...point,deltaX:0,deltaY}); await pause(180);
}
async function swipe() {
  const {x,y,distance} = await run('({x:innerWidth/2,y:innerHeight*.72,distance:innerHeight*.48})');
  await send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=10;i++) {
    await send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x,y:y-distance*i/10}]});
    await pause(16);
  }
  await send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]}); await pause(240);
}
async function checkReachable(label, selector, {touch=false,screenshot=''} = {}) {
  await run('window.scrollTo(0,0)'); await pause(60);
  const start=await metrics();
  if(start.max>2) {
    if(touch) await swipe(); else await wheel(400);
    const afterInput=await metrics();
    assert.ok(afterInput.y>0.5, label + ': actual user scroll must move the page '+JSON.stringify({start,afterInput})); checks++;
    let end;
    for(let attempt=0;attempt<6;attempt++) {
      await wheel();end=await metrics();
      if(Math.abs(end.y-end.max)<3)break;
    }
    assert.ok(Math.abs(end.y-end.max)<3, label + ': reach page end '+JSON.stringify(end)); checks++;
  }
  const result = await run(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element)return {missing:true};const r=element.getBoundingClientRect(),bar=document.querySelector('.sw-nav,.sw-dock'),header=document.querySelector('.sw-header');return {top:r.top,bottom:r.bottom,height:r.height,limit:bar?bar.getBoundingClientRect().top:innerHeight,headerBottom:header?header.getBoundingClientRect().bottom:0,overflow:document.documentElement.scrollWidth>innerWidth};})()`);
  assert.ok(!result.missing,label+': final content exists');
  assert.ok(result.height>0&&result.bottom<=result.limit+1,label+': last content above fixed actions '+JSON.stringify(result));
  assert.ok(result.bottom>result.headerBottom,label+': final content visible below header');
  assert.ok(!result.overflow,label+': no horizontal overflow');checks+=4;
  assert.ok(await run(`(()=>{const h=document.querySelector('.sw-header'),r=h.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&h.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));})()`),label+': title and return bar remain visible');checks++;
  if(screenshot)await shot(screenshot);
  results.push({page:label,input:touch?'touch + wheel':'wheel',range:Math.round(start.max),end:Math.round((await metrics()).y)});
}
async function pointerClick(selector) {
  const point=await run(`(()=>{const el=document.querySelector(${JSON.stringify(selector)}),r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,hit:el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};})()`);
  assert.ok(point.hit,'Unobstructed pointer target: '+selector);checks++;
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});await pause(100);
}
(async()=>{
  target=await(await fetch(browser+'/json/new?about:blank',{method:'PUT'})).json();
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>ws.onopen=resolve);
  ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);if(message.id){const item=pending.get(message.id);if(item){pending.delete(message.id);message.error?item.reject(message.error):item.resolve(message.result);}}};
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:980,height:874,deviceScaleFactor:1,mobile:false});
  await open(site+'/sales/index.html');
  // Dedicated browser fixture only: no user profile or merchant state is read/written.
  const fixture=await run(`(()=>{const M=SalesWorkbench,s=M.seed(),o=s.orders[0];M.prepareContract(s,'sun',o.id,true);M.demoResult(s,'sun',o.id,'contract','通过');M.sendContract(s,'sun',o.id);M.demoResult(s,'sun',o.id,'notice','通过');const contact=M.grant(s,'sun',o.id,'T1'),person=M.grant(s,'sun',o.id,'T2'),share=M.createShare(s,'sun',{productId:'sanya',slotId:'nov18',kind:'quote',adults:2,children:0});for(let i=0;i<18;i++){const copy=M.copy(o);copy.id='KS20240928'+String(i+100);s.orders.push(copy);}localStorage.setItem(M.KEY,JSON.stringify(s));sessionStorage.setItem('sw-staff','sun');sessionStorage.setItem('sw-guest-'+contact.token,'T1');sessionStorage.setItem('sw-guest-'+person.token,'T2');return {oid:o.id,contact:contact.token,person:person.token,share:share.id};})()`);
  await open(site+'/sales/index.html?scroll-check=1#product?id=sanya');
  await wheel(650);const moved=await metrics();
  assert.ok(moved.y>0,'Product detail must respond to real wheel input');checks++;
  for(const size of [{width:980,height:874,mobile:false},{width:390,height:844,mobile:true},{width:320,height:568,mobile:true},{width:430,height:740,mobile:true}]) {
    await send('Emulation.setDeviceMetricsOverride',{...size,deviceScaleFactor:1});
    await send('Emulation.setTouchEmulationEnabled',{enabled:size.mobile,maxTouchPoints:1});
    await open(site+'/sales/index.html#product?id=sanya');
    await checkReachable('product '+size.width,'.sw-stack>div:last-child',{touch:size.mobile,screenshot:'product-bottom-'+size.width});
    await nav('orders');await checkReachable('orders '+size.width,'.sw-order-list .sw-line:last-child');
    await nav('home');await checkReachable('home '+size.width,'.sw-main>.sw-footer');
    for(const view of ['order','claim','contract','materials','account']) {
      await nav(view+(view==='account'?'':'?id='+fixture.oid));
      await checkReachable(view+' '+size.width,'.sw-main>:last-child');
    }
    await nav('share?id=sanya&slot=nov18');await checkReachable('share form '+size.width,'form [type=submit]');
    await nav('product?id=sanya');await click('[name=slot][value=nov18]');await click('[data-action=book-start]');await click('form [type=submit]');
    await checkReachable('booking guests '+size.width,'form>.sw-link',{touch:size.mobile});
    await pointerClick('[data-action=save-booking]');assert.match(await pageText(),/继续预订/);checks++;
    await open(site+'/sales/guest.html?share='+fixture.share);await checkReachable('guest recommendation '+size.width,'.sw-main>.sw-card:nth-last-child(2)',{touch:size.mobile});
    await open(site+'/sales/guest.html?access='+fixture.person+'#guest-sign');await checkReachable('guest contract '+size.width,'form [type=submit]',{touch:size.mobile,screenshot:size.width===390?'guest-contract-bottom':''});
    await open(site+'/sales/guest.html?access='+fixture.person+'#guest-docs');await checkReachable('guest documents '+size.width,'form>.sw-demo',{touch:size.mobile,screenshot:size.width===390?'guest-documents-bottom':''});
    await pointerClick('[data-action=save-docs]');assert.match(await pageText(),/暂存/);checks++;
    await open(site+'/sales/guest.html?access='+fixture.contact+'#guest-pay');await checkReachable('guest payment '+size.width,'.sw-main>.sw-card:last-child');
    await open(site+'/sales/guest.html?access='+fixture.contact+'#guest-travel');await checkReachable('guest travel '+size.width,'.sw-stack>div:last-child');
  }
  // A long contract preview must scroll inside the dialog, and closing it restores page scrolling.
  await open(site+'/sales/index.html#contract?id='+fixture.oid);await click('[data-action=contract-preview]');
  const box=await run('(()=>{const r=document.querySelector("dialog").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,max:document.querySelector("dialog").scrollHeight-document.querySelector("dialog").clientHeight}})()');
  assert.ok(box.max>0,'Long preview has an internal scroll range');
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:box.x,y:box.y,deltaX:0,deltaY:100000});await pause(180);
  assert.ok(await run('document.querySelector("dialog").scrollTop>0'),'Dialog responds to wheel');checks+=2;
  await pointerClick('dialog [data-action=dialog-cancel]');await checkReachable('after dialog close','.sw-main>:last-child',{touch:true});
  // Contract result at the bottom is operable by pointer, then return navigation starts at top.
  await open(site+'/sales/guest.html?access='+fixture.person+'#guest-sign');await checkReachable('guest sign action','form [type=submit]');await click('[name=checked]');await pointerClick('form [type=submit]');assert.match(await pageText(),/您已签署/);checks++;
  await nav('guest-home');assert.equal((await metrics()).y,0,'New page starts at top');checks++;
  assert.equal(errors.length,0,JSON.stringify(errors));
  fs.mkdirSync(output,{recursive:true});const report={passed:true,checks,runtimeErrors:errors.length,results};fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,checks,pages:results.length,runtimeErrors:errors.length,screenshots:output},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{ws?.close();if(target)await fetch(browser+'/json/close/'+target.id).catch(()=>{});});
