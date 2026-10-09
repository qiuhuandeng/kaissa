const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('/Users/qiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/evidence/mice-prototype/project-creation-20261009');
const base=process.env.MICE_BASE_URL||'http://127.0.0.1:8876/';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const go=async(file,q={})=>{await page.goto(new URL(file,base).href+'?'+new URLSearchParams(q));await page.waitForSelector('#mice-app .mice-table, #mice-app .mice-hero, #mice-app .mice-page-head');};
 const list=()=>go('merchant/tour/product-custom-list.html');
 const detail=id=>go('merchant/tour/product-custom-detail.html',{id});
 const act=(action,id)=>page.locator('[data-mice-action="'+action+'"]'+(id?'[data-id="'+id+'"]':'')).first().click();
 const input=(name,value)=>page.locator('#mice-form [name="'+name+'"]').fill(value);
 const select=(name,value)=>page.locator('#mice-form [name="'+name+'"]').selectOption(value);
 const submit=async value=>{await page.locator('#mice-form button[value="'+value+'"]').click();};
 const saved=async()=>{await page.waitForSelector('#mice-form',{state:'detached',timeout:4000});};
 const record=(name,details={})=>checks.push({name,result:'通过',...details});
 const snapshot=()=>page.evaluate(()=>JSON.parse(JSON.stringify(MiceUI.store.data)));
 const project=async name=>page.evaluate(name=>MiceUI.store.data.projects.find(p=>p.name===name),name);
 const activities=async id=>page.evaluate(id=>MiceUI.store.data.activities.filter(a=>a.projectId===id),id);
 const shot=async name=>{await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});};
 const newBasic=async(name,first)=>{await list();await act('project-new');await input('name',name);await select('customer','华辰医药有限公司');await page.locator('[name=createFirstActivity]').setChecked(first);};
 const completeProject=async()=>{await select('company','北京凯撒');await select('department','会奖业务部');await select('kind','会奖');await input('start','2026-01-01');await input('end','2026-12-31');await select('sales','陈刚');await select('owner','张三');await input('scope','年度会议与奖励旅游');await input('basis','客户年度需求函');};
 try{
  await list();await page.evaluate(()=>{localStorage.removeItem('caesar-mice-prototype-v1');});await list();
  assert.equal(await page.locator('[name=mode]').count(),0);assert.doesNotMatch(await page.locator('#mice-app').innerText(),/组织方式|单次活动|多场活动/);
  await go('merchant/tour/product-custom-list.html',{filter_mode:'single'});assert(!new URL(page.url()).searchParams.has('filter_mode'));record('旧组织方式筛选已移除，旧链接不再隐藏项目');

  await newBasic('仅建档年度项目',false);await page.locator('[name=createFirstActivity]').check();await input('people','-5');await page.locator('[name=createFirstActivity]').uncheck();
  assert.equal(await page.locator('#mice-first-activity-fields').isVisible(),false);assert.equal(await page.locator('[name=people]').isDisabled(),true);
  await completeProject();await shot('create-project-only');await submit('submit');await saved();let p0=await project('仅建档年度项目');assert.equal((await activities(p0.id)).length,0);assert.equal(p0.status,'待确认');
  await act('project-edit',p0.id);assert.equal(await page.locator('[name=createFirstActivity]').count(),0);await submit('activate');await saved();record('不建立首场也能建档、核对及启用，隐藏人数不阻断');
  await detail(p0.id);assert.match(await page.locator('#mice-app').innerText(),/尚未建立活动/);assert.equal(await page.locator('#mice-activity-filter').count(),0);assert.equal(await page.locator('[data-mice-action=activity-assign]').count(),0);await shot('zero-activities');record('零场显示新增和批量录入入口');
  await act('activity-new');await input('name','后补首场');await submit('draft');await saved();assert.equal((await activities(p0.id)).length,1);assert.equal(await page.locator('#mice-activity-filter').count(),0);record('仅建档项目可后续新增首场');
  const unassigned=(await activities(p0.id))[0];await act('activity-assign',unassigned.id);await select('planner','李梅');await input('reason','首场计调分工');await submit('save');await saved();assert.equal((await activities(p0.id))[0].planner,'李梅');assert.equal((await activities(p0.id))[0].status,'草稿');record('一场可直接分配计调，无需勾选');

  await newBasic('年度项目同时建首场',true);await completeProject();
  assert.equal(await page.locator('[name=activityName]').inputValue(),'年度项目同时建首场');assert.equal(await page.locator('[name=activityStart]').inputValue(),'2026-01-01');
  await input('activityName','十月会议');await input('activityStart','2026-10-20');await input('activityEnd','2026-10-21');await input('name','年度项目同时建首场修订');await input('start','2026-02-01');await input('end','2026-11-30');
  assert.equal(await page.locator('[name=activityName]').inputValue(),'十月会议');assert.equal(await page.locator('[name=activityStart]').inputValue(),'2026-10-20');assert.equal(await page.locator('[name=activityEnd]').inputValue(),'2026-10-21');
  await input('city','上海');await input('people','30');await select('service','会议');await select('planner','李梅');
  await shot('create-with-first');await input('activityEnd','2026-10-19');await submit('draft');assert.match(await page.locator('[data-error=activityEnd]').innerText(),/不能早于/);await input('activityEnd','2026-12-01');await submit('draft');assert.match(await page.locator('[data-error=activityEnd]').innerText(),/不能晚于/);await input('activityEnd','2026-10-21');
  await input('people','1.5');await submit('draft');assert.match(await page.locator('[data-error=people]').innerText(),/正整数/);await input('people','30');
  await submit('submit');await saved();let p1=await project('年度项目同时建首场修订'),first=(await activities(p1.id))[0];
  assert.equal((await activities(p1.id)).length,1);assert.equal(first.name,'十月会议');assert.equal(first.start,'2026-10-20');assert.equal(first.status,'草稿');assert.equal(p1.mode,undefined);assert.equal(p1.createFirstActivity,undefined);assert.equal(p1.activityName,undefined);assert.equal((await snapshot()).orders.filter(o=>o.projectId===p1.id).length,0);
  record('年度期间可同时建首场草稿，默认值跟随直至手动修改；日期与人数错误有就地提示');
  const preserved=JSON.stringify(first);await act('project-edit',p1.id);assert.equal(await page.locator('[name=activityName]').count(),0);await input('name','已核对年度项目');await input('scope','更新项目总体服务描述');await input('start','2026-01-01');await input('end','2026-12-31');await submit('activate');await saved();assert.equal(JSON.stringify((await activities(p1.id))[0]),preserved);record('项目核对和启用不改写既有活动任何字段');
  await go('merchant/tour/product-custom-detail.html',{id:p1.id,city:'不存在',month:'2030-01',page:9});assert.equal(await page.locator('#mice-activity-filter').count(),0);assert.equal(await page.locator('[data-activity-select]').count(),0);assert.match(await page.locator('[data-mice-action=activity-open]').innerText(),/进入执行/);assert.match(await page.locator('#mice-app').innerText(),/十月会议/);await shot('one-activity');record('一场收起多场工具，旧筛选和页码不遮蔽唯一活动');
  await act('activity-handover',first.id);await select('planner','赵磊');await input('reason','首场负责人调整');await submit('save');await saved();const handed=(await activities(p1.id))[0];assert.equal(handed.planner,'赵磊');assert.equal(handed.status,first.status);assert.equal(handed.assignmentHistory.at(-1).from,'李梅');assert.equal(handed.start,first.start);record('一场可直接移交，保留原负责人、活动日期及状态');
  await act('activity-new');await input('name','十一月会议');await input('start','2026-11-01');await input('end','2026-11-01');await submit('draft');await saved();assert.equal((await activities(p1.id)).length,2);assert.equal(await page.locator('#mice-activity-filter').count(),1);assert.equal(await page.locator('[data-activity-select]').count(),2);assert.equal(await page.locator('[data-mice-action=activity-assign]').count(),1);await shot('multiple-activities');record('新增第二场自动展开筛选、选择和分工，无类型转换');
  await page.locator('[name=city]').fill('不存在');await page.locator('#mice-activity-filter button[type=submit], #mice-activity-filter button:not([type])').first().click();assert.equal(await page.locator('#mice-activity-filter').count(),1);await act('activity-reset');record('多场筛选到零条仍保留筛选与重置');
  await act('activity-open',first.id);await page.waitForURL(/schedules-detail/);assert.match(await page.locator('#mice-app').innerText(),/十月会议/);record('进入执行保留项目与活动关系');

  await detail(p0.id);await act('activity-copy');await submit('draft');await saved();assert.equal((await activities(p0.id)).length,2);assert.equal(await page.locator('#mice-activity-filter').count(),1);record('复制草稿活动可增加第二场');
  await newBasic('批量补场项目',false);await submit('draft');await saved();let pb=await project('批量补场项目');await detail(pb.id);await act('activity-batch');
  const csvHeader='活动名称,客户参考号,服务类型,开始日期,结束日期,城市地点,人数,计调,服务范围\n';
  await input('csv',csvHeader+'批量一,B1,会议,2026-10-10,2026-10-10,上海,20,,会议');await submit('check');assert.match(await page.locator('#mice-batch-preview').innerText(),/有效1行/);await submit('save-valid');await saved();assert.equal((await activities(pb.id)).length,1);assert.equal(await page.locator('#mice-activity-filter').count(),0);record('零场项目可批量导入首场');
  await act('activity-batch');await input('csv',csvHeader+'批量二,B2,会议,2026-10-11,2026-10-11,上海,20,,会议');await submit('check');assert.match(await page.locator('#mice-batch-preview').innerText(),/有效1行/);await submit('save-valid');await saved();assert.equal((await activities(pb.id)).length,2);assert.equal(await page.locator('#mice-activity-filter').count(),1);record('通过导入第二场自动展开多场管理');

  await detail('PRJ-20261008-001');const before=await page.evaluate(()=>{const p=MiceUI.store.find('projects','PRJ-20261008-001');p.status='待确认';const a=MiceUI.store.data.activities.find(a=>a.projectId===p.id);MiceUI.store.data.activities.push({...MiceUI.M.clone(a),id:'LEGACY-SECOND',name:'历史单次项目第二场',status:'草稿'});MiceUI.store.save();MiceProjectDetail.render();return JSON.parse(JSON.stringify({activities:MiceUI.store.data.activities,orders:MiceUI.store.data.orders,commitments:MiceUI.store.data.commitments}));});
  assert.doesNotMatch(await page.locator('#mice-app').innerText(),/组织方式/);await act('project-info');await input('scope','总体需求补充，保留已有执行与价款');await submit('activate');await saved();const after=await snapshot();assert.deepEqual(after.activities,before.activities);assert.deepEqual(after.orders,before.orders);assert.deepEqual(after.commitments,before.commitments);assert.equal(after.projects.find(p=>p.id==='PRJ-20261008-001').status,'进行中');record('旧single项目已有两场仍可核对，活动、订单、约定完整保留');
  await list();await act('project-copy','PRJ-20261008-001');assert.equal(await page.locator('[name=createFirstActivity]').count(),0);await submit('draft');await saved();const copied=await project('北京科技三亚奖励旅游-副本');const copies=await activities(copied.id);assert.equal(copies.length,2);assert(copies.every(a=>a.status==='草稿'&&!a.start&&!a.end&&!a.commitmentId&&a.roster.length===0));assert.equal((await snapshot()).orders.filter(o=>o.projectId===copied.id).length,0);record('复制项目按原有两场复制草稿，不额外生成首场或客户订单');

  for(const width of [1440,1280]){await page.setViewportSize({width,height:1000});await detail(p1.id);const layout=await page.evaluate(()=>{const main=document.querySelector('#mice-app'),table=main.querySelector('table'),th=table.querySelector('th:last-child');return{pageOverflow:document.documentElement.scrollWidth>innerWidth,actionWidth:Math.round(th.getBoundingClientRect().width),position:getComputedStyle(th).position,tableScroll:table.closest('.mice-table-wrap')?.scrollWidth};});assert.equal(layout.pageOverflow,false);assert(layout.actionWidth<=190);assert.equal(layout.position,'sticky');await shot('layout-'+width);record('详情布局 '+width+'px',layout);}
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors,output:out},null,2));
 }catch(error){await shot('failure');fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,checks,errors},null,2));console.error(error);process.exitCode=1;}finally{await browser.close();}
})();
