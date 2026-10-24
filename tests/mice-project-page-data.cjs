const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const M=require('../shared/mice-prototype-model'),T=require('../shared/mice-tax-model'),checks=[];
const source=fs.readFileSync(path.join(__dirname,'../shared/mice-prototype-data.js'),'utf8');
function load(text){const window={MiceModel:M,MiceTaxModel:T};vm.runInNewContext(text,{window,TextEncoder});return window;}
const previous=load(source.split('/* 项目团管理试用：')[0]),current=load(source);
function check(name,fn){fn();checks.push(name);}
check('13个预置项目各有草稿和进行中，未成交进行中也可继续报价建单',()=>{
 const d=current.MicePrototypeSeed,rows=d.activities.filter(a=>a.demoStageCase);
 assert.equal(rows.length,31);assert.equal(d.projects.length,13);for(const p of d.projects)for(const status of ['草稿','进行中'])assert(d.activities.some(a=>a.projectId===p.id&&a.status===status));
 for(const a of rows){const p=d.projects.find(p=>p.id===a.projectId),os=d.orders.filter(o=>o.activities.includes(a.id));assert.deepEqual(M.validateActivity(a,p,'draft',d),{});if(a.status==='草稿'){assert.equal(os.length,0);assert(M.activityAllows(a,p,'quote'));}else{assert(os.length<=1);assert.deepEqual(M.validateActivity(a,p,'execute',d),{});assert(M.activityAllows(a,p,'assignment'));}assert(!a.completion);assert(!a.acceptance);}
});
check('首次升级只补独立示例，不改原团、订单、采购、结算及用户记录',()=>{
 const saved=M.clone(previous.MicePrototypeSeed);saved.activities[0].name='用户维护名称';saved.orders[0].amount+=123;saved.settlements[0].basis='用户已填写';
 const before=M.clone(saved),after=current.MicePrototypeDemo.upgrade(saved);
 for(const key of ['projects','activities','orders','commitments','costs','settlements','approvals'])for(const r of before[key])assert.deepEqual(after[key].find(n=>n.id===r.id),r);
 assert.equal(after.activities.length,before.activities.length+31);
});
check('刷新不重置已建单、已完成或用户修改的新增示例',()=>{
 const saved=M.clone(current.MicePrototypeSeed),a=saved.activities.find(a=>a.id==='DEMO-PREP-HC-001');a.status='已完成';a.name='用户完成场';a.completion={basis:'用户完成材料'};
 saved.orders.push({id:'USER-ORDER',projectId:a.projectId,activities:[a.id],amount:31000,status:'已确认'});
 assert.deepEqual(current.MicePrototypeDemo.upgrade(saved),saved);
});
check('已结束项目不补新的执行任务',()=>{
 const saved=M.clone(previous.MicePrototypeSeed);saved.projects.find(p=>p.id==='PRJ-20261008-003').status='已结项';
 const next=current.MicePrototypeDemo.upgrade(saved);assert(!next.activities.some(a=>a.demoStageCase&&a.projectId==='PRJ-20261008-003'));assert.equal(next.projects.find(p=>p.id==='PRJ-20261008-003').status,'已结项');
});
check('同编号记录冲突不补订单、不覆盖用户对象',()=>{
 const saved=M.clone(previous.MicePrototypeSeed);saved.activities.push({id:'DEMO-EXEC-HC-001',projectId:'USER-PROJECT',name:'用户资料',status:'草稿'});
 const next=current.MicePrototypeDemo.upgrade(saved);assert.equal(next.activities.find(a=>a.id==='DEMO-EXEC-HC-001').name,'用户资料');assert(!next.orders.some(o=>o.id==='DEMO-ORDER-DEMO-EXEC-HC-001'));assert(!next.activities.some(a=>a.projectId==='USER-PROJECT'&&a.id!=='DEMO-EXEC-HC-001'));
});
check('原26个结算案例及税额未回退，新进行中不假装已结算',()=>{
 const d=current.MicePrototypeSeed,old=previous.MicePrototypeSeed;
 assert.equal(old.activities.length,26);assert(old.activities.every(a=>d.activities.find(b=>b.id===a.id).status===a.status));
 for(const p of old.projects.filter(p=>!['PRJ-20261008-003'].includes(p.id)))assert.deepEqual(T.values(d,p.id),T.values(old,p.id));
 for(const a of d.activities.filter(a=>a.demoStageCase))assert(!d.settlements.some(s=>s.activities.includes(a.id)));
});
const out=path.join(__dirname,'../docs/evidence/mice-prototype/order-execution-20261024');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'data-rules.json'),JSON.stringify({passed:checks.length,checks},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
