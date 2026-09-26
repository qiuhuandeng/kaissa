const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.CAESAR_PLAYWRIGHT_PATH||'/tmp/wechat-style-tools/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CAESAR_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--allow-file-access-from-files']});
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));let n=0;
 const go=async role=>{await p.goto(pathToFileURL(path.resolve(__dirname,'..',role==='supplier'?'supplier/settlements.html':'merchant/tour/fulfillment-cost.html')).href+(role==='supplier'?'':'?tab=reconciliation'));await p.waitForTimeout(350);};
 const click=async s=>{await p.locator(s).click();await p.waitForTimeout(260);};
 const check=async(name,fn)=>{assert.equal(await fn(),true,name);n++;console.log('PASS '+name);};
 const text=s=>p.locator(s).innerText();const open=id=>click('[data-rec-open="'+id+'"]');
 const close=()=>click('.rec-footer [data-rec-action="close"]');
 const file=()=>p.locator('#recBillFiles').setInputFiles({name:'供应商账单.pdf',mimeType:'application/pdf',buffer:Buffer.from('prototype-bill')});
 const shot=async name=>{await p.waitForTimeout(250);await p.screenshot({path:'/private/tmp/supplier-bill-'+name+'.png'});};
 try {
  await go('supplier');await click('[data-rec-action="create-bill"]');
  await check('无需我方先发起即可打开采购订单选择',async()=>await p.locator('[data-rec-bill-select="C04"]').isEnabled());
  await check('已确认费用不可重复提交',async()=>await p.locator('[data-rec-bill-select="C03"]').count()===0&&await p.locator('[data-rec-bill-select="C01"]').isDisabled());
  await p.locator('[data-rec-bill-select="C04"]').check();await p.locator('[data-rec-bill-select="C05"]').check();
  await check('无原单显示建立对账及接收计调',async()=>{const t=await text('#recBillMatch');return t.includes('建立对账单')&&t.includes('北京凯撒 · 计调')&&t.includes('42,900.00');});
  await click('[data-rec-action="submit-bill"]');await check('缺账单号不能提交',async()=>(await text('.rec-error')).includes('账单号'));
  await p.locator('#recBillNo').fill('GL-NEW-001');await p.locator('#recBillTotal').fill('42901');await file();await click('[data-rec-action="submit-bill"]');await check('账单总额不等于明细合计被拦截',async()=>(await text('.rec-error')).includes('合计不一致'));
  await p.locator('#recBillTotal').fill('42900');await shot('supplier-create');await click('[data-rec-action="submit-bill"]');
  await check('供应商提交后待采购公司核对并保留附件',async()=>{const t=await text('.rec-body');return t.includes('待采购公司核对')&&t.includes('北京凯撒 · 计调')&&t.includes('供应商账单.pdf');});await close();
  await click('[data-rec-action="create-bill"]');await check('本次提交过的费用再次选取被禁用',async()=>await p.locator('[data-rec-bill-select="C04"]').isDisabled());
  await p.locator('#recBillCurrency').selectOption('JPY');await check('切换币种更新账单金额标识',async()=>(await text('#recBillTotalLabel')).includes('JPY'));await close();await click('[data-rec-action="accept-confirm"]');
  await go('supplier');await click('[data-rec-action="create-bill"]');await p.locator('[data-rec-bill-select="C02"]').check();await check('已有对账只选部分费用提示补全',async()=>(await text('#recBillMatch')).includes('完整选择'));await p.locator('[data-rec-bill-select="C11"]').check();await check('选齐费用自动匹配原单',async()=>(await text('#recBillMatch')).includes('DZ20260926002'));
  await p.locator('#recBillNo').fill('GL-MATCH-001');await p.locator('#recBillTotal').fill('51000');await file();await click('[data-rec-action="submit-bill"]');await check('已有对账提交不新增单据',async()=>await p.locator('.rec-list [data-rec-id]').count()===6&&(await text('.rec-summary')).includes('DZ20260926002'));await close();
  await open('DZ20260925002');await check('退回单进入原单补充且显示要求',async()=>(await text('.rec-return-note')).includes('加住500')&&await p.locator('#recBillCompany').isDisabled());await p.locator('#recBillTotal').fill('12800');await p.locator('[data-rec-bill-amount="C14"]').fill('12800');await p.locator('[data-rec-bill-reason="C14"]').fill('补充加住确认单，修正为300元');await file();await click('[data-rec-action="submit-bill"]');await check('补充重提保留原13000与新12800账单',async()=>{const t=await text('.rec-body');return t.includes('13,000.00')&&t.includes('12,800.00')&&t.includes('待采购公司核对');});await close();
  await go('merchant');await p.locator('#recStatus').selectOption('reviewing');await click('[data-rec-action="search"]');await check('我方可筛选待核对来单',async()=>await p.locator('.rec-list [data-rec-id]').count()===1);await open('DZ20260925001');await shot('merchant-review');
  await click('[data-rec-action="finish-bill-review"]');await check('未核全部明细不能完成',async()=>(await text('.rec-error')).includes('尚有费用'));
  await p.locator('[data-rec-bill-review="C12"] [data-rec-review-amount]').fill('61000');await p.locator('[data-rec-bill-review="C12"] [data-rec-review-reason]').fill('认可加住1000，其余待供应商确认');await click('[data-rec-action="save-bill-review"]');await check('部分保存仍待我方核对，输入可复开',async()=>await p.locator('[data-rec-bill-review="C12"] [data-rec-review-amount]').inputValue()==='61000'&&(await text('.rec-summary')).includes('待我方核对'));
  await p.locator('[data-rec-bill-review="C13"] [data-rec-review-amount]').fill('20000');await check('调整金额提示下一岗位供应商',async()=>(await text('#recBillReviewOutcome')).includes('交供应商'));await click('[data-rec-action="finish-bill-review"]');await check('调整至81000进入新版待供应商确认，原82000保留',async()=>{const t=await text('.rec-body');return t.includes('81,000.00')&&t.includes('82,000.00')&&t.includes('待供应商确认')&&t.includes('第 2 版');});await shot('merchant-adjusted');
  await go('merchant');await open('DZ20260925001');await p.locator('[data-rec-bill-review="C12"] [data-rec-review-amount]').fill('62000');await p.locator('[data-rec-bill-review="C12"] [data-rec-review-reason]').fill('实际加住2晚已核对');await p.locator('[data-rec-bill-review="C13"] [data-rec-review-amount]').fill('20000');await check('金额全认可显示交财务而非重复回供应商',async()=>(await text('#recBillReviewOutcome')).includes('交财务应付岗'));await click('[data-rec-action="finish-bill-review"]');await check('认可原账单完成双方确认，待财务承接',async()=>{const t=await text('.rec-summary');return t.includes('双方已确认')&&t.includes('财务应付岗');});
  await go('merchant');await open('DZ20260925001');await click('[data-rec-action="return-bill"]');await check('退回补充必须说明内容',async()=>(await text('.rec-error')).includes('补充'));await p.locator('#recReturnReason').fill('补加住确认单');await click('[data-rec-action="return-bill"]');await check('退回后交供应商且我方只读',async()=>(await text('.rec-summary')).includes('待供应商补充')&&await p.locator('[data-rec-action="finish-bill-review"]').count()===0);
  await go('supplier');await p.setViewportSize({width:390,height:844});await click('[data-rec-action="create-bill"]');await shot('supplier-narrow');await check('供应商窄屏账单抽屉不溢出',()=>p.locator('.rec-body').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await go('merchant');await open('DZ20260925001');await shot('merchant-narrow');await check('计调窄屏核对抽屉不溢出，底栏可见',async()=>await p.locator('.rec-body').evaluate(el=>el.scrollWidth<=el.clientWidth+1)&&await p.locator('[data-rec-action="finish-bill-review"]').isVisible());
  assert.deepEqual(errors,[]);console.log('完成 '+n+' 组主动账单浏览器检查，脚本异常0');
 }catch(e){await shot('failure');throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
