const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('/Users/qiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const out=__dirname,root=path.resolve(out,'../../..'),b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--allow-file-access-from-files']}),p=await b.newPage({viewport:{width:1440,height:650},deviceScaleFactor:2}),checks=[],errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(6000);
const labels=()=>p.evaluate(()=>{const s=document.querySelector('.nav-primary-scroll'),rect=s.getBoundingClientRect();return {rail:s.offsetWidth,content:s.clientWidth,overflow:s.scrollWidth>s.clientWidth,labels:[...s.querySelectorAll('.nav-label')].map(e=>({text:e.textContent,width:e.clientWidth,needed:e.scrollWidth,clipped:e.scrollWidth>e.clientWidth,right:e.getBoundingClientRect().right,fits:e.getBoundingClientRect().right<=rect.left+s.clientWidth}))};});
const go=async file=>{await p.goto(pathToFileURL(path.join(root,file)).href);await p.waitForSelector('.nav-primary-scroll');};
const pass=(name,result)=>{checks.push({name,result});console.log('PASS '+name);};
try{
 for(const file of ['merchant/product/product-market.html','merchant/tour/air-orders.html','merchant/finance/air-funds.html']){
  await go(file);
  for(const [name,css]of [['overlay',''],['reserved-thin','.nav-primary-scroll{scrollbar-gutter:stable;}'],['reserved-regular','.nav-primary-scroll{scrollbar-gutter:stable;scrollbar-width:auto;}']]){
   const st=css?await p.addStyleTag({content:css}):null;
   for(const width of [1440,1024,768]){await p.setViewportSize({width,height:650});const result=await labels();assert.equal(result.rail,92);assert.equal(result.overflow,false);assert.ok(result.labels.every(x=>!x.clipped&&x.fits),JSON.stringify(result));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));pass(file+' '+name+' '+width,result);}
   if(file.includes('product-market')&&name==='reserved-thin'){await p.setViewportSize({width:1440,height:650});await p.locator('.sidebar').screenshot({path:path.join(out,'after.png'),animations:'disabled'});}
   if(st)await st.evaluate(e=>e.remove());
  }
 }
 await go('merchant/product/product-market.html');await p.setViewportSize({width:1440,height:650});const st=await p.addStyleTag({content:'.nav-primary-scroll{scrollbar-gutter:stable;}'});
 const items=p.locator('.nav-primary-item');for(let i=0;i<await items.count();i++){await items.nth(i).scrollIntoViewIfNeeded();assert.ok(await items.nth(i).evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.top>=p.top-1&&r.bottom<=p.bottom+1;}));}pass('15个一级入口均可滚动到完整位置');
 await p.locator('.nav-toggle').click();await p.waitForFunction(()=>Math.round(document.querySelector('.sidebar').getBoundingClientRect().width)===64);assert.equal(await p.locator('.nav-primary-item .nav-label:visible').count(),0);await items.last().scrollIntoViewIfNeeded();assert.ok(await items.last().isVisible());await items.filter({hasText:'产品'}).click();await p.waitForFunction(()=>Math.round(document.querySelector('.sidebar').getBoundingClientRect().width)===242&&Math.round(document.querySelector('.nav-primary-rail').getBoundingClientRect().width)===92);assert.equal(await p.locator('.nav-secondary-title').innerText(),'产品中心');assert.ok((await labels()).labels.every(x=>!x.clipped&&x.fits));pass('折叠64px图标仍可滚动，点击产品恢复双栏及完整标签');await st.evaluate(e=>e.remove());
 await p.evaluate(()=>caesarMerchantAppearance.save({theme:'blue',navLayout:'t'}));await p.waitForFunction(()=>document.documentElement.dataset.merchantNavLayout==='t');assert.ok((await labels()).labels.every(x=>!x.clipped));await p.screenshot({path:path.join(out,'top-layout.png'),animations:'disabled'});pass('顶部导航短名完整，横向滚动保持');
 assert.deepEqual(errors,[]);pass('浏览器脚本错误为0');
}finally{fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify({checks,errors},null,2));await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
