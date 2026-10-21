const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const actions=require('../shared/mice-activity-actions.js');
const M=require('../shared/mice-prototype-model.js');
const project={id:'P1',status:'进行中'},activity=status=>({id:'A1',name:'项目团一',projectId:'P1',status});
const order={id:'O1',projectId:'P1',activities:['A1'],status:'已确认'};
const checks=[];function check(name,fn){fn();checks.push(name);}
check('进行中只提供执行准备动作，不新增报价或提前结算',()=>assert.deepEqual(actions.items(activity('进行中'),project).map(x=>x.key),['complete','roster-export','cost-new','cost-budget','claim','invoice','order-change','change','files']));
check('草稿仅确认建团、编辑和报价，即使已有订单也不展示履约及款票',()=>assert.deepEqual(actions.items(activity('草稿'),project,{orders:[order]}).map(x=>[x.key,x.label]),[['form','确认建团'],['edit','编辑'],['quote-new','新增报价']]));
check('各主状态决定常驻办理入口，取消不再推进履约',()=>{
 for(const [status,key] of Object.entries({草稿:'form',进行中:'complete',已完成:'settlement'}))
  assert.equal(actions.items(activity(status),project).find(x=>x.place==='primary').key,key);
});
check('资料缺口不改变行操作',()=>assert.deepEqual(actions.items(activity('进行中'),project),actions.items({...activity('进行中'),people:100,roster:[],resources:[]},project)));
check('完成后不新增报价或调整预计，取消后仅导出及必要结算',()=>{
 for(const key of ['cost-budget','quote-new'])assert.equal(actions.allows(activity('已完成'),project,key),false);
 assert.deepEqual(actions.items(activity('已取消'),project).map(x=>x.key),['roster-export']);assert.deepEqual(actions.items(activity('已取消'),project,{orders:[order]}).map(x=>x.key),['roster-export','settlement']);assert(!actions.items(activity('已取消'),project,{orders:[order]}).some(x=>x.place==='primary'));
});
check('结项或终止项目只导出及查看已有结算',()=>{
 for(const status of ['已结项','已终止']){
  const rows=actions.items(activity('已完成'),{...project,status},{settlements:[{id:'S1',projectId:'P1',activities:['A1'],status:'草稿'}]});
  assert.deepEqual(rows.map(x=>x.label),['导出名单','查看结算']);
 }
});
check('订单未确认、取消或作废不能发起款票改价',()=>{
 for(const status of ['待确认','已取消','已作废'])for(const key of ['claim','invoice','order-change'])
  assert.equal(actions.allows(activity('进行中'),project,key,{orders:[{...order,status}]}),false);
 for(const key of ['claim','invoice','order-change'])assert.equal(actions.allows(activity('进行中'),project,key,{orders:[order]}),true);
});
check('整包订单允许款票但不从本团拆分改价',()=>{
 const data={orders:[{...order,activities:['A1','A2']}]};
 assert.equal(actions.allows(activity('进行中'),project,'claim',data),true);
 assert.equal(actions.allows(activity('进行中'),project,'order-change',data),false);
});
check('失效及跨项目对象不能办理',()=>{
 assert.deepEqual(actions.items(activity('进行中'),{...project,id:'P2'}),[]);assert.deepEqual(actions.items(null,project),[]);
});
const draft={id:'S1',projectId:'P1',activities:['A1'],status:'草稿'};
check('准确匹配本团结算，生效单优先且排除仅项目费用单',()=>{
 const confirmed={...draft,id:'S2',status:'已确认'};
 assert.equal(actions.settlementFor(activity('已完成'),{settlements:[draft,confirmed]}).id,'S2');
 assert.equal(actions.items(activity('已完成'),project,{settlements:[confirmed]}).find(x=>x.key==='settlement').label,'查看结算');
 assert.equal(actions.settlementFor(activity('已完成'),{settlements:[{...draft,activities:[],includeProjectCosts:true}]}),undefined);
});
const calls=[],data={projects:[project,{id:'P2',status:'进行中'}],activities:[activity('进行中'),{id:'A2',name:'项目团二',projectId:'P2',status:'进行中'}],orders:[order,{...order,id:'O2',projectId:'P2',activities:['A2']}],settlements:[draft]};
const U={M:{...M,csv:x=>JSON.stringify(x)},q:new URLSearchParams('mice=1'),actions:{},ready(){},toast:message=>calls.push(['toast',message]),download:(name)=>calls.push(['export',name]),store:{data,find:(kind,id)=>data[kind]?.find(r=>r.id===id)}};
const context={MiceUI:U,MiceActivityActions:actions,location:{pathname:'/merchant/tour/schedules.html'},URLSearchParams,console};context.window=context;
context.MiceBilling={openFor:(a,kind)=>calls.push([kind,a.id,a.projectId])};
context.MiceChanges={open:(type,id)=>calls.push([type,id])};
context.MiceCosts={openForActivity:(p,a,kind)=>calls.push([kind,a,p])};
context.MiceProjectDetail={activityForm:(id,copy,pick,select,mode)=>calls.push([mode==='form'?'form':'edit',id])};
context.MiceAgreements={edit:(id,ctx)=>calls.push(['quote',ctx.activityId,ctx.projectId])};
context.MiceSettlement={business:(p,a,id)=>calls.push(['settle',p,a,id]),businessView:id=>calls.push(['settle-view',id])};
vm.runInNewContext(fs.readFileSync(require.resolve('../shared/mice-activities.js'),'utf8'),context);
U.actions['activity-files']=()=>calls.push(['files',context.MiceActivity.activity.id]);
check('连续不同行办理费用及预计准确切换归属',()=>{
 context.MiceActivity.quick('A1','cost-new');context.MiceActivity.quick('A2','cost-budget');
 assert.deepEqual(calls.slice(-2),[['cost-new','A1','P1'],['cost-budget','A2','P2']]);
});
check('款票与订单改价直接带入本团',()=>{
 for(const kind of ['claim','invoice','order-change'])context.MiceActivity.quick('A1',kind);
 assert.deepEqual(calls.slice(-3),[['claim','A1','P1'],['invoice','A1','P1'],['change','A1','P1']]);
});
check('草稿报价直接开原表单，执行阶段仍可办理附件导出和团变更',()=>{
 data.activities[1].status='草稿';context.MiceActivity.quick('A2','quote-new');assert.deepEqual(calls.at(-1),['quote','A2','P2']);data.activities[1].status='进行中';
 for(const kind of ['files','roster-export'])context.MiceActivity.quick('A2',kind);context.MiceActivity.quick('A1','change');
 assert.deepEqual(calls.slice(-3),[['files','A2'],['export','项目团二-名单.csv'],['activity','A1']]);
});
check('结算直接续办原草稿，不重复创建；已确认仅查看',()=>{
 data.activities[0].status='已完成';context.MiceActivity.quick('A1','settlement');assert.deepEqual(calls.at(-1),['settle','P1','A1','S1']);
 draft.status='已确认';context.MiceActivity.quick('A1','settlement');assert.deepEqual(calls.at(-1),['settle-view','S1']);
});
check('菜单展开后主状态改变仍重新检查',()=>{
 data.activities[0].status='已取消';context.MiceActivity.quick('A1','cost-new');assert.equal(calls.at(-1)[0],'toast');
});
check('阶段动作直接调用建团或完成表单，终态不可再办理',()=>{
 data.activities[0].status='草稿';
 U.actions['activity-maintain']=()=>calls.push(['edit',context.MiceActivity.activity.id]);
 U.actions['activity-complete']=()=>calls.push(['complete',context.MiceActivity.activity.id]);
 for(const [status,key] of [['草稿','form'],['进行中','complete']]){data.activities[0].status=status;context.MiceActivity.quick('A1',key);assert.deepEqual(calls.at(-1),[key,'A1']);}
 for(const status of ['已完成','已取消'])for(const key of ['form','edit','start','complete','change'])assert.equal(actions.allows(activity(status),project,key),false);
});
check('草稿不发起结算或团变更，旧状态不生成新操作',()=>{
 for(const key of ['settlement','change'])assert.equal(actions.allows(activity('草稿'),project,key,{settlements:[{...draft,status:'草稿'}]}),false);
 for(const status of ['待确认','准备中','执行中'])assert.deepEqual(actions.items(activity(status),project),[]);assert.equal(U.actions['activity-start'],undefined);
});
check('进行中不提前结算；完成且已有有效结算不直接新增费用',()=>{
 assert(!actions.allows(activity('进行中'),project,'settlement'));
 for(const status of ['审批中','已确认']){const data={settlements:[{...draft,status}]};assert(!actions.allows(activity('已完成'),project,'cost-new',data));assert.equal(actions.items(activity('已完成'),project,data).find(x=>x.key==='settlement').label,'查看结算');}
 assert(actions.allows(activity('已完成'),project,'cost-new',{settlements:[{...draft,status:'已退回'}]}));
});
console.log(JSON.stringify({passed:checks.length,checks},null,2));
