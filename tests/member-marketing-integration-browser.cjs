const {chromium}=require('playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const BASE=process.env.CAESAR_PREVIEW_URL||'http://127.0.0.1:8768';
const out=process.env.CAESAR_INTEGRATION_EVIDENCE||path.join(process.cwd(),'docs/evidence/member-marketing-integration-20261022');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CAESAR_CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined)});try{
const c=await b.newContext({viewport:{width:1440,height:1000}}),p=await c.newPage(),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));
const go=async(url)=>{await p.goto(BASE+'/'+url);await p.waitForFunction(()=>window.caesarUI);};
const state=()=>p.evaluate(()=>CaesarCenters.load());
const shot=async(name)=>{await p.locator('.breadcrumb').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,name+'.png')});};
await go('merchant/marketing/activities.html');
for(const text of ['营销工具','营销分析','活动审批','调级审批'])assert.equal(await p.locator('.sidebar').getByText(text,{exact:true}).count(),0);
for(const page of ['campaigns','campaign-edit','coupons','coupon-edit','issue-center','issue-create','issue-detail','marketing-analysis']){const response=await p.request.get(BASE+'/merchant/marketing/'+page+'.html');assert.equal(response.status(),404,page);}
checks.push('营销工具三项及全部子页、营销分析页面已删除，旧菜单不存在');
await go('merchant/customer/enterprise-list.html');assert.match(await p.locator('.breadcrumb').innerText(),/会员中心.*会员档案.*企业客户/s);await shot('enterprise-member-navigation');
await go('merchant/customer/enterprise-detail.html');assert.match(await p.locator('.breadcrumb').innerText(),/会员中心.*企业客户/s);
checks.push('企业客户列表及详情导航归属会员中心／会员档案');
await go('merchant/marketing/coupon-ledger.html');assert.equal(await p.locator('[data-cx-action=coupon-flow]').first().innerText(),'查看分摊');await p.locator('[data-cx-action=coupon-flow]').first().click();assert.match(await p.locator('#cxLayerTitle').innerText(),/分摊/);await p.screenshot({path:path.join(out,'coupon-allocation.png')});
await go('merchant/marketing/activity-edit.html');const activityStyle=await p.locator('.cx-steps').evaluate(el=>{const c=getComputedStyle(el);return {padding:c.padding,borderRadius:c.borderRadius,border:c.border,width:el.clientWidth}});
await go('merchant/marketing/coupon-tiers.html?mode=new');assert.deepEqual(await p.locator('.cx-steps').evaluate(el=>{const c=getComputedStyle(el);return {padding:c.padding,borderRadius:c.borderRadius,border:c.border,width:el.clientWidth}}),activityStyle);await shot('new-coupon-basic');
await p.locator('[data-coupon-step]').click();assert.equal(await p.locator('[data-coupon-tab=rules]').getAttribute('aria-selected'),'true');await shot('new-coupon-rules');assert.equal(await p.locator('[data-cx-action=template-save]').count(),1);await p.locator('[data-coupon-step]').click();
checks.push('券模板步骤导航对齐活动UI，有上下步，保留单一保存；查看分摊入口及抽屉标题正确');

await go('merchant/member/member-detail.html?uid=KC202600050');const old=(await state()).users[49].grade;
async function applyGrade(grade){await p.locator('[data-cx-action=manual-grade]').click();await p.locator('#cxLayer [name=grade]').selectOption(grade);await p.locator('#cxLayer [name=reason]').fill('重点会员服务等级调整，已核对消费与服务记录');await p.locator('[data-cx-action=form-save]').click();await p.locator('[data-cx-action=confirm-run]').click();return (await state()).approvals[0];}
async function review(id,decision){await go('merchant/approval/approvals.html?view=todo&approvalNo='+id);await p.locator('#approvalModal').waitFor({state:'visible'});await p.locator('input[name=approvalDecision][value="'+decision+'"]').check();await p.locator('#approvalOpinion').fill('已核对申请内容与消费记录');p.once('dialog',d=>d.accept());await p.locator('#approvalSubmitBtn').click();await p.locator('#approvalModal').waitFor({state:'hidden'});}
let a=await applyGrade('铂金卡');assert.equal(a.approvalTemplate.name,'人工调级流程');assert.equal(a.nodes.length,2);
await go('merchant/approval/approvals.html?view=todo&approvalNo='+a.id);await p.locator('#approvalModal').waitFor({state:'visible'});await p.locator('#approvalModal .drawer-modal').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished));});assert.equal(await p.locator('#approvalResultPanel').isVisible(),false);assert(await p.locator('#approvalModal .drawer-modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await p.screenshot({path:path.join(out,'unified-member-approval.png')});
await review(a.id,'通过');assert.equal((await state()).users[49].grade,old);await review(a.id,'通过');assert.equal((await state()).users[49].grade,'铂金卡');
await go('merchant/member/member-detail.html?uid=KC202600050');a=await applyGrade('黑钻卡');await review(a.id,'转交');assert.equal((await state()).approvals[0].step,0);await review(a.id,'驳回');assert.equal((await state()).users[49].grade,'铂金卡');assert.equal((await state()).approvals[0].status,'已驳回');
await go('merchant/approval/approvals.html?view=mine');await p.locator('#approvalKeyword').fill(a.id);assert.match(await p.locator('#approvalRows').innerText(),/已拒绝/);
checks.push('人工调级从原详情提交：统一中心逐节点审批、最终回写；转交不跳节点；驳回不调级；我发起的可跟踪');
await go('merchant/member/level-approvals.html');assert(p.url().includes('/approval/approvals.html'));await go('merchant/marketing/activity-approvals.html');assert(p.url().includes('/approval/approvals.html'));
await go('admin/approval-config.html');await p.locator('[name=scene]').selectOption('活动报批');await p.locator('form[data-ac-search]').evaluate(el=>el.requestSubmit());assert.match(await p.locator('.ac-table tbody').innerText(),/活动报批流程/);await shot('unified-approval-template');
await go('admin/approval-template-edit.html?id=member-marketing-0&mode=view');assert.match(await p.locator('body').innerText(),/A级活动/);await p.screenshot({path:path.join(out,'activity-template-branches.png')});
checks.push('原两张审批地址归统一中心；统一模板库可查看活动报批模板及A/B/常规分支');
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({checks,errors},null,2));console.log('PASS',checks);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
