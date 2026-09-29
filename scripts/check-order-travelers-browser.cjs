// Isolated headless prototype checks. Does not attach to the user's browser.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require(process.env.CAESAR_PLAYWRIGHT || '/private/tmp/commerce-mobile-qa/node_modules/playwright')); }
(async () => {
  const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--allow-file-access-from-files']});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const output = '/private/tmp/caesar-order-travelers-qa'; fs.mkdirSync(output,{recursive:true});
  const errors = [], results = [];
  page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(8000);
  const go = async (query='') => {await page.goto(pathToFileURL(path.resolve(__dirname,'../merchant/sales/orders-detail.html')).href+query);await page.locator('[data-tab="travelers"]').click();await page.waitForTimeout(400);};
  const check = async (name, fn) => {assert(await fn(),name);results.push(name);console.log('PASS',name);};
  const click = async selector => {await page.locator(selector).click();await page.waitForTimeout(400);};
  const close = () => click('#travelerDrawer .modal-close');
  const open = (index=0) => click('#travelerTableRows [data-ot-edit="'+index+'"]');
  const visa = () => click('#travelerDetailForm > details > summary:text-is("签证与材料")');
  const shoot = name => page.screenshot({path:path.join(output,name+'.png')});
  try {
    await go();
    if(process.argv.includes('--layout')) { await page.setViewportSize({width:1920,height:1000}); console.log(await page.locator('.ot-table').evaluate(t=>({table:t.getBoundingClientRect().width,cols:[...t.querySelectorAll('col')].map(e=>({class:e.className,w:getComputedStyle(e).width})),heads:[...t.querySelectorAll('th')].map(e=>({class:e.className,w:getComputedStyle(e).width,min:getComputedStyle(e).minWidth,max:getComputedStyle(e).maxWidth})),cells:[...t.querySelector('tbody tr').cells].map(e=>({class:e.className,w:getComputedStyle(e).width,min:getComputedStyle(e).minWidth}))}))); await shoot('layout');return; }
    await check('游客页仅一张表，无签证统计及服务变更重复区', async()=>await page.locator('#tab-travelers table').count()===1 && await page.locator('#orderVisaSection').count()===0 && await page.locator('#tab-travelers #orderSpecialServiceSection').count()===0);
    await check('游客每人一个维护入口',async()=>await page.locator('#travelerTableRows tr').count()===2 && await page.locator('#travelerTableRows [data-ot-edit]').count()===2);
    await shoot('01-list');
    await open();
    await check('单人编辑仅张建国，证件字段独立',async()=>(await page.locator('#travelerDrawerSummary').innerText()).includes('张建国') && !(await page.locator('#travelerDrawerSummary').innerText()).includes('李梅') && await page.locator('#travelerDetailForm [name="docNo"]').count()===1);
    await check('签证与需求默认收起',async()=>await page.locator('#travelerDetailForm > details[open]').count()===0);
    await shoot('02-editor');
    await page.locator('#ot-phone').fill('13312345678');await close();
    await check('取消未保存资料出现确认',()=>page.locator('#otDiscard').isVisible());
    await click('#otKeep');await check('继续编辑保留草稿',async()=>await page.locator('#ot-phone').inputValue()==='13312345678');
    await close();await click('#otDrop');await open();
    await check('放弃修改不污染保存值',async()=>await page.locator('#ot-phone').inputValue()==='138****8001');
    await page.locator('#ot-phone').fill('bad phone');await click('#saveTravelerDetail');
    await check('非法电话留在编辑并提示',async()=>await page.locator('#travelerFormError').isVisible() && await page.locator('#travelerDrawer').isVisible());
    await page.locator('#ot-phone').fill('13312345678');await page.locator('#ot-docNo').fill('E12345678');await page.locator('#ot-englishName').fill('ZHANG/JIANGUO');await page.locator('#ot-expiresAt').fill('2032-01-01');await page.locator('#ot-birthday').fill('1980-01-01');await click('#saveTravelerDetail');
    await check('保存返回主表且证件脱敏',async()=>(await page.locator('#travelerTableRows tr').nth(0).innerText()).includes('13312345678') && (await page.locator('#travelerTableRows tr').nth(0).innerText()).includes('E1****78'));
    await open(1);await check('另一游客资料未被覆盖',async()=>await page.locator('#ot-phone').inputValue()==='139****2200' && await page.locator('#ot-docNo').inputValue()==='');await close();
    await open();await check('重开保留保存内容',async()=>await page.locator('#ot-docNo').inputValue()==='E12345678');await click('#travelerDetailForm > details > summary:text-is("出行需求")');await page.locator('#ot-room').fill('双床房');await page.locator('#ot-roommate').fill('李梅');await page.locator('#ot-preference').fill('无烟房，靠窗');await click('#saveTravelerDetail');await check('已填写证件和需求直接展示在游客行',async()=>{const t=await page.locator('[data-ot-person="0"]').innerText();return ['ZHANG/JIANGUO','2032-01-01','双床房','同住：李梅','无烟房，靠窗'].every(v=>t.includes(v));});await click('[data-ot-expand="0"]');await check('行内展开可核对完整资料，无需进入编辑',async()=>await page.locator('#ot-detail-0').isVisible() && (await page.locator('#ot-detail-0').innerText()).includes('E12345678'));await shoot('02-filled-expanded');await click('[data-ot-expand="0"]');await open();await visa();
    await check('自办不显示代办材料',async()=>await page.locator('[data-ot-file="selfVisa"]').count()===1 && await page.locator('[data-ot-file="assets"]').count()===0);
    await page.locator('#ot-mode').selectOption('随团代办');await click('#saveTravelerDetail');
    await check('变更方式原因必填',async()=>(await page.locator('#travelerFormError').innerText()).includes('变更原因'));
    await page.locator('#ot-reason').fill('客户委托随团办理');await page.locator('[name="feeChanged"]').check();await page.locator('#ot-feeDelta').fill('0');await click('#saveTravelerDetail');
    await check('费用变更非零校验',async()=>(await page.locator('#travelerFormError').innerText()).includes('非零'));
    await page.locator('#ot-feeDelta').fill('800');const amount = await page.locator('#orderHeroTotal').innerText();await click('#saveTravelerDetail');await open();await visa();
    await check('代办材料按方式出现且历史收起',async()=>await page.locator('[data-ot-file="assets"]').count()===1 && await page.locator('#travelerDetailForm .ot-history li').count()===1);
    await check('签证费用申请未自动改变订单金额',async()=>await page.locator('#orderHeroTotal').innerText()===amount && (await page.locator('.ot-history').textContent()).includes('待审批'));
    await page.locator('[data-ot-file="passportCopy"]').setInputFiles({name:'护照扫描.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n')});
    await check('选择文件只标待审核',async()=>(await page.locator('#otMaterialContent').innerText()).includes('护照扫描.pdf · 待审核'));
    await page.locator('[data-ot-file="assets"]').setInputFiles({name:'bad.exe',mimeType:'application/octet-stream',buffer:Buffer.from('test')});
    await check('不支持的附件类型被拦截',async()=>(await page.locator('#travelerFormError').innerText()).includes('PDF或图片'));
    await page.locator('#ot-mode').selectOption('游客自办');await page.locator('#ot-reason').fill('客户改为自行办理');await click('#saveTravelerDetail');
    await check('退出代办必须处理原任务',async()=>(await page.locator('#travelerFormError').innerText()).includes('原代办任务'));
    await page.locator('#ot-task').selectOption('申请撤回送签并保留原送签记录');await click('#saveTravelerDetail');
    await check('转自办保留原任务待处理结果',async()=>(await page.locator('#travelerTableRows').innerText()).includes('原代办任务待签证专员处理'));
    await open();await visa();await page.locator('#ot-mode').selectOption('随团代办');
    await check('方式来回切换不丢原附件',async()=>(await page.locator('#otMaterialContent').innerText()).includes('护照扫描.pdf'));await close();await click('#otDrop');
    await click('[data-tab="aftersales"]');
    await check('售后变更保留服务申请入口与记录',async()=>await page.locator('#orderSpecialServiceSection').isVisible() && await page.locator('#addOrderSpecialService').isVisible());await click('#addOrderSpecialService');
    await check('服务申请原表单仍可打开',()=>page.locator('#orderSpecialServiceForm [name="item"]').isVisible());await click('#orderSpecialServiceDrawer .modal-close');
    await go('?type=cruise');await open();await visa();await click('#travelerDetailForm > details > summary:text-is("出行需求")');
    await check('邮轮保留登船材料且舱号只读',async()=>await page.locator('[data-ot-file="boardingForm"]').count()===1 && (await page.locator('#travelerDetailForm').innerText()).includes('阳台舱') && await page.locator('input[name="resource"]').count()===0);await close();
    await go('?type=train');await check('国内专列不展示签证',async()=>!(await page.locator('#travelerTableHead').innerText()).includes('签证'));await open();
    await check('专列保留车站及铺位偏好',async()=>await page.locator('#ot-boarding').count()===1 && await page.locator('#ot-trafficPreference').count()===1 && await page.locator('#ot-mode').count()===0);await close();
    await go('?type=free');await open();await check('自由行保留房型与入住偏好',async()=>await page.locator('#ot-room').inputValue()==='双床房' && await page.locator('#ot-preference').inputValue()==='高楼层');await close();
    await go('?type=single');await open();await visa();await check('签证单项只允许委托代办且无房型表单',async()=>await page.locator('#ot-mode option').count()===2 && await page.locator('#ot-room').count()===0 && await page.locator('#ot-address').count()===1);await close();
    await go('?type=study');await open();await visa();await check('研学保留监护人和安全资料',async()=>await page.locator('#ot-guardian').count()===1 && await page.locator('[data-ot-file="guardianConsent"]').count()===1 && await page.locator('[data-ot-file="healthForm"]').count()===1);await close();
    await go('?type=customProject');await open();await check('项目分组维护不伪造80人姓名',async()=>(await page.locator('#travelerDrawerSummary').innerText()).includes('管理层 / 20人') && await page.locator('#ot-transport').count()===1 && await page.locator('#ot-docNo').count()===0);await close();
    await go('?orderNo=KSIC260901');await check('跨主体无名单时显示空态且无旧欧洲资料',async()=>(await page.locator('#travelerTableRows').innerText()).includes('本单暂无游客名单') && !(await page.locator('#travelerTableRows').innerText()).includes('张建国'));
    await go();await click('[data-tab="contract"]');await click('[data-open-drawer="travelerDrawer"]:visible');
    await check('合同补资料入口可选择当前游客',async()=>await page.locator('#travelerDetailForm [data-ot-edit]').count()===2);await click('#travelerDetailForm [data-ot-edit="1"]');
    await check('合同入口正确打开所选游客',async()=>(await page.locator('#travelerDrawerSummary').innerText()).includes('李梅'));await close();
    await click('[data-tab="travelers"]');
    for (const width of [1920,1440,1024,390]) {
      await page.setViewportSize({width,height:900});
      await check(width+'名单表铺满页签可用宽度',()=>page.locator('.ot-table-wrap').evaluate(e=>{const p=e.parentElement,s=getComputedStyle(p);return Math.abs(e.clientWidth-(p.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)))<=3;}));
      if(width===1920) await shoot('04-wide-list');
      await check(width+'主表容器滚动且操作列固定96px',()=>page.locator('.ot-table-wrap').evaluate(e=>{const a=e.querySelector('td.ot-action');return e.scrollWidth>=e.clientWidth && Math.abs(a.getBoundingClientRect().width-96)<2 && getComputedStyle(a).position==='sticky' && a.getBoundingClientRect().right<=innerWidth+1;}));
      await open();await visa();
      await check(width+'抽屉正文无横向溢出',()=>page.locator('#travelerDrawer .modal-body').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
      await shoot('03-editor-'+width);await close();
    }
    await check('页面运行异常为0',async()=>errors.length===0);
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,errors},null,2));console.log('完成 '+results.length+' 项检查；'+output);
  } catch (e) {await shoot('failure');console.error(errors);throw e;} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
