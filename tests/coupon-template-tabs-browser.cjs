const {chromium}=require('playwright');
const M=require('../shared/member-marketing-model.js');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const base=process.env.CAESAR_PREVIEW_URL||'http://127.0.0.1:8768';
const output=process.env.CAESAR_COUPON_EVIDENCE||fs.mkdtempSync(path.join(os.tmpdir(),'caesar-coupon-tabs-'));
fs.mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CAESAR_CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined)});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage(),errors=[],checks=[];
    p.on('pageerror',e=>errors.push(e.message));
    const ready=async()=>{await p.waitForSelector('#centerApp[data-ready=true]');await p.waitForFunction(()=>window.caesarUI);};
    const go=async(file,query='')=>{await p.goto(base+'/merchant/marketing/'+file+'.html'+query);await ready();};
    const action=a=>p.locator('#centerApp [data-cx-action="'+a+'"]').first().click();
    const tab=t=>p.locator('[data-coupon-tab="'+t+'"]').click();
    const field=n=>p.locator('#centerApp [name="'+n+'"]');
    const state=()=>p.evaluate(()=>CaesarCenterUI.state);
    const confirm=()=>p.locator('#cxLayer [data-cx-action=confirm-run]').click();
    const readOnly=async()=>assert.equal(await p.locator('#centerApp input,#centerApp select,#centerApp textarea,#centerApp [contenteditable=true]').count(),0);
    const saved=async()=>{await p.waitForURL(url=>url.pathname.endsWith('coupon-tiers.html')&&!url.searchParams.has('mode'));await ready();};
    const shot=name=>p.screenshot({path:path.join(output,name+'.png')});

    await go('coupon-templates');
    assert.equal(await p.locator('a[href*="coupon-rules.html"]').count(),0);
    assert.equal(await p.locator('[data-cx-action=template-edit]').count(),20);
    assert.equal(await p.getByRole('button',{name:'配置',exact:true}).count(),0);
    const before=await state();
    const editedRules=M.normalizeCouponRules({stacking:'different',maxPerOrder:2,pointsStack:false,cashable:true,transferable:true,inheritable:true,userScope:'holder',refundPolicy:'restore',expiryPolicy:'extend',extensionDays:14,remindDays:3});
    await action('template-edit');await p.waitForURL('**/*mode=edit*');await ready();
    assert.equal(await p.locator('#centerApp h1').innerText(),'编辑券模板');
    assert.equal(await p.locator('[data-coupon-tab]').count(),3);
    await field('name').fill('暖冬欧洲 · 产品直降券');
    await p.locator('[data-tier-index="0"] [data-tier-field=amount]').fill('250');
    assert.equal(await p.locator('[data-tier-field=product],[data-tier-field=channel],[data-tier-field=supplier]').count(),0);
    await tab('rules');
    for(const rule of M.couponRuleFields){await tab(rule.group==='适用日期'?'scope':'rules');const name='coupon'+rule.key[0].toUpperCase()+rule.key.slice(1),el=field(name);assert.equal(await el.isEnabled(),true);if(['number','date'].includes(rule.type))await el.fill(String(editedRules[rule.key]));else await el.selectOption(rule.type==='boolean'?(editedRules[rule.key]?'允许':'不允许'):editedRules[rule.key]);}
    await tab('rules');
    const party=key=>p.locator('[data-allocation-party][value="'+key+'"]'),ratio=key=>p.locator('[data-coupon-allocation="'+key+'"] [data-allocation-percent]');
    assert.equal(await p.locator('#cxCouponAllocations table,#cxCouponAllocations select,#cxCouponAllocations button').count(),0);
    for(const checkbox of await p.locator('[data-allocation-party]:checked').all())await checkbox.uncheck();
    await party('headquarters').check();assert.equal(await ratio('headquarters').isVisible(),true);await ratio('headquarters').fill('70');
    await party('store').check();await ratio('store').fill('20');
    assert.match(await p.locator('[data-allocation-total]').innerText(),/90.00%/);await action('template-save');assert.equal(await p.locator('#cxLayer').count(),0);
    await ratio('store').fill('40');await action('template-save');assert.equal(await p.locator('#cxLayer').count(),0);
    await ratio('store').fill('30');await party('product').check();assert.equal(await ratio('product').isVisible(),true);await ratio('product').fill('10');
    await party('product').uncheck();assert.equal(await ratio('product').isVisible(),false);assert.equal(await ratio('product').isDisabled(),true);assert.match(await p.locator('[data-allocation-total]').innerText(),/100.00%/);
    await party('product').check();assert.equal(await ratio('product').inputValue(),'10');await party('product').uncheck();
    await p.locator('#cxCouponAllocations').screenshot({path:path.join(output,'allocation-checkboxes.png')});
    await field('couponRefundPoints').selectOption('允许');await action('template-save');assert.equal(await p.locator('#cxLayer').count(),0);await field('couponRefundPoints').selectOption('不允许');
    await p.locator('[data-rich=instructions]').fill('适用指定欧洲团期，每人每档限领一张，不与积分直接抵扣同时使用。');
    await shot('edit-rules');await p.locator('#centerApp h1').scrollIntoViewIfNeeded();await shot('edit-rules-top');await tab('basic');assert.equal(await field('name').inputValue(),'暖冬欧洲 · 产品直降券');
    await tab('rules');assert.equal(await field('couponPointsStack').inputValue(),'不允许');assert.equal(await field('couponRemindDays').inputValue(),'3');
    assert.match(await p.locator('[data-rich=instructions]').innerText(),/指定欧洲团期/);
    p.once('dialog',d=>d.dismiss());await p.locator('[data-cx-back]').click();assert(p.url().includes('mode=edit'));
    await action('template-save');assert.deepEqual((await state()).templates,before.templates);
    await p.locator('#cxLayer [data-cx-action=close]').last().click();assert.equal(await field('couponRemindDays').inputValue(),'3');
    await action('template-save');await confirm();await saved();await readOnly();
    let current=await state();assert.equal(current.templates[0].name,'暖冬欧洲 · 产品直降券');assert.equal(current.templates[0].tiers[0].amount,250);
    assert.deepEqual(current.templates[0].useRules,editedRules);assert.deepEqual(current.templates[1],before.templates[1]);assert.deepEqual(current.wallet,before.wallet);
    assert.equal(current.logs.length,before.logs.length+1);await shot('detail-rules');
    await p.reload();await ready();assert.match(await p.locator('#coupon-panel-rules').innerText(),/不允许/);await readOnly();
    await tab('basic');await shot('detail-basic');await action('template-edit');await p.waitForURL('**/*mode=edit*');await ready();await shot('edit-basic');await tab('rules');
    for(const rule of M.couponRuleFields){await tab(rule.group==='适用日期'?'scope':'rules');const value=rule.type==='boolean'?(editedRules[rule.key]?'允许':'不允许'):String(editedRules[rule.key]);assert.equal(await field('coupon'+rule.key[0].toUpperCase()+rule.key.slice(1)).inputValue(),value);}
    assert.deepEqual(await p.locator('[data-allocation-party]:checked').evaluateAll(els=>els.map(e=>e.value)),['headquarters','store']);assert.deepEqual(await p.locator('[data-allocation-percent]:enabled').evaluateAll(els=>els.map(e=>Number(e.value))),[70,30]);
    checks.push('承担方复选框勾选后显示比例，取消隐藏并排除计算，重新勾选保留当前输入；合计90%/110%拦截、100%可保存；70/30刷新回填，已发放券保持原快照');
    checks.push('列表查看／编辑命名；移除独立菜单；三Tab切换保留填写；统一保存并刷新回填；其他模板与已有券不变；查看只读');

    // Invalid data in the inactive tab is still validated and the correct tab is selected.
    await tab('rules');await field('couponRemindDays').fill('-1');await tab('basic');await action('template-save');
    assert.equal(await p.locator('[data-coupon-tab=rules]').getAttribute('aria-selected'),'true');assert.equal(await p.locator('#cxLayer').count(),0);
    await field('couponRemindDays').fill('2');await tab('basic');await field('name').fill('');await tab('rules');await action('template-save');
    assert.equal(await p.locator('[data-coupon-tab=basic]').getAttribute('aria-selected'),'true');assert.equal(await p.locator('#cxLayer').count(),0);
    p.once('dialog',d=>d.accept());await p.locator('[data-cx-back]').click();await p.waitForURL(url=>!url.searchParams.has('mode'));await ready();
    checks.push('隐藏Tab必填和数值校验自动定位；取消编辑不保存');

    await go('coupon-templates');await p.locator('[data-cx-tab="直减券"]').click();await action('new-template');await p.waitForURL('**/*mode=new*');await ready();
    const count=(await state()).templates.length;await field('name').fill('新春欧洲 · 会员加码券');await tab('rules');await field('couponPointsStack').selectOption('不允许');await field('couponRemindDays').fill('5');
    await tab('basic');await p.locator('[name=couponPricingMethod][value=percent]').check();assert.equal(await field('name').inputValue(),'新春欧洲 · 会员加码券');await tab('rules');assert.equal(await field('couponRemindDays').inputValue(),'5');assert.equal(await field('couponPointsStack').inputValue(),'不允许');
    p.once('dialog',d=>d.accept());await p.locator('[data-cx-back]').click();await p.waitForURL('**/coupon-templates.html');await ready();assert.equal((await state()).templates.length,count);
    await action('new-template');await p.waitForURL('**/*mode=new*');await ready();await field('name').fill('新春欧洲 · 会员积分券');await tab('rules');await field('couponPointsStack').selectOption('不允许');await field('couponRemindDays').fill('5');await field('couponRefundPoints').selectOption('允许');
    await action('template-save');await confirm();await saved();current=await state();const created=current.templates[0];assert.equal(current.templates.length,count+1);assert.deepEqual(created.useRules,M.normalizeCouponRules({pointsStack:false,remindDays:5,refundPoints:true}));
    // Copy inherits rules, while edits to the copy remain isolated.
    await p.locator('[data-cx-back]').click();await p.waitForURL('**/coupon-templates.html');await ready();
    await p.locator('[data-row-id="'+created.id+'"] .table-more-toggle').click();await p.locator('.action-dropdown-menu:visible [data-cx-action=template-copy]').click();await confirm();
    current=await state();const copy=current.templates[0];assert.deepEqual(copy.useRules,created.useRules);assert.notEqual(copy.id,created.id);
    await p.locator('[data-cx-action=template-edit][data-id="'+copy.id+'"]').click();await p.waitForURL('**/*mode=edit*');await ready();await tab('rules');await field('couponPointsStack').selectOption('允许');
    // Simulate a storage failure; no partial template/rule changes should be persisted.
    await action('template-save');await p.evaluate(()=>{window.originalStorageWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===CaesarCenters.KEY)throw Error('存储空间不足');return originalStorageWrite.call(this,k,v);};});await confirm();
    assert.match(await p.locator('#cxLayer .cx-error').innerText(),/存储空间不足/);assert.equal(await field('couponPointsStack').inputValue(),'允许');assert.equal((await state()).templates[0].useRules.pointsStack,false);
    await p.evaluate(()=>Storage.prototype.setItem=window.originalStorageWrite);await confirm();await saved();current=await state();assert.equal(current.templates[0].useRules.pointsStack,true);assert.equal(current.templates.find(t=>t.id===created.id).useRules.pointsStack,false);
    checks.push('新建切换券型保留规则；取消不落库；新建与复制继承规则；修改副本隔离；保存失败保留三Tab内容并可重试');

    await go('coupon-rules');assert(p.url().endsWith('/coupon-templates.html'));
    await go('coupon-rules','?template='+created.id);assert.equal(new URL(p.url()).searchParams.get('mode'),'edit');assert.equal(await p.locator('[data-coupon-tab=rules]').getAttribute('aria-selected'),'true');
    await go('coupon-tiers','?template='+created.id+'&mode=config');assert.equal(await p.locator('#centerApp h1').innerText(),'编辑券模板');
    for(const key of ['basic','scope','rules']){await p.setViewportSize({width:1024,height:900});await tab(key);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('edit-'+key+'-1024');}
    checks.push('原用券规则地址回到模板或对应编辑Tab；旧config链接显示编辑；1024px三Tab无页面溢出');
    await go('activity-edit');await action('wizard-next');await action('plan-add-coupon');await p.locator('[data-plan-coupon-search]').fill('QM20260002');await p.locator('[data-plan-coupon-id="'+'QM20260002'+'"]').check();await p.locator('#cxLayer [data-cx-action=plan-coupons-confirm]').click();await action('wizard-next');
    assert.equal(await p.locator('#centerApp .cx-steps').count(),1);assert.equal(await p.locator('#centerApp .cx-steps > div').count(),3);assert.equal(await p.locator('#centerApp a[href*="approval-template-edit"]').count(),0);assert.equal(await p.locator('[data-cx-action=submit-activity]').count(),1);await shot('activity-submit-clean');
    checks.push('活动提交改为三步导航并保留提交操作，删除图示审批节点条与模板链接');
    const files=['merchant/member','merchant/marketing'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.html')&&fs.readFileSync(dir+'/'+f,'utf8').includes('data-center-page')).map(f=>dir+'/'+f));
    for(const file of files){await p.goto(base+'/'+file);await ready();assert.equal(await p.locator('#centerApp .cx-error').count(),0,file);}
    assert.equal(files.length,27);assert.deepEqual(errors,[]);checks.push('27张会员／营销业务页面加载通过，无运行异常');
    fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify({checks,pageErrors:errors},null,2)+'\n');console.log('PASS',checks,'Evidence:',output);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
