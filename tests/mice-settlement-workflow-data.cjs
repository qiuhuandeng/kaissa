const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const M=require('../shared/mice-prototype-model'),T=require('../shared/mice-tax-model'),checks=[];
const source=fs.readFileSync(path.join(__dirname,'../shared/mice-prototype-data.js'),'utf8');
function load(text){const window={MiceModel:M,MiceTaxModel:T};vm.runInNewContext(text,{window,TextEncoder});return window;}
const prior=load(source.split('/* 可直接办理的结算案例。')[0]),current=load(source),pid='PRJ-20261024-001';
const check=(name,fn)=>{fn();checks.push(name);};
check('旧会话按授权调整示例阶段，订单报价金额及用户填写保留',()=>{
 const saved=M.clone(prior.MicePrototypeSeed);saved.orders[0].amount+=123;saved.settlements[0].basis='用户已填写';
 const before=M.clone(saved),result=current.MicePrototypeDemo.upgrade(saved);
 for(const key of ['orders','commitments','costs','requests','claims','invoices'])for(const row of before[key])assert.deepEqual(result[key].find(r=>r.id===row.id),row);
 assert.equal(result.settlements[0].basis,'用户已填写');
 assert.equal(result.activities.filter(a=>a.projectId===pid&&!a.demoStageCase).length,3);
 assert.equal(result.orders[0].amount,before.orders[0].amount);
});
check('再次打开不会重建已办理案例，用户的结算状态与附件不回退',()=>{const saved=M.clone(current.MicePrototypeSeed),r=saved.settlements.find(r=>r.projectId===pid);r.status='审批中';r.attachments=[{name:'用户材料.txt'}];const before=M.clone(saved);assert.deepEqual(current.MicePrototypeDemo.upgrade(saved),before);});
check('同编号项目已存在但没有升级标记时保留用户项目，不混入新单据',()=>{const saved=M.clone(prior.MicePrototypeSeed);saved.projects.push({id:pid,name:'用户项目'});const result=current.MicePrototypeDemo.upgrade(saved);assert.equal(result.projects.find(p=>p.id===pid).name,'用户项目');assert.equal(result.costs.filter(c=>c.projectId===pid).length,0);});
check('默认本团费用与三套税额口径可核，公共费用只随选择计入',()=>{const d=current.MicePrototypeSeed;const evidence=includeProjectCosts=>T.settlementEvidence(d,{projectId:pid,activities:['PRJ20261024001'],includeProjectCosts}).financial.amounts[0];assert.equal(evidence(false).grossIncome,106000);assert.equal(evidence(false).grossCost,76320);assert.equal(evidence(false).netProfit,28000);assert.equal(evidence(true).grossCost,86920);assert.equal(evidence(true).netProfit,18000);});
check('退回案例保存原提交金额，未知核定税额保留待确认',()=>{const r=current.MicePrototypeSeed.settlements.find(r=>r.id==='JS20261024003');assert.equal(r.status,'已退回');assert.equal(r.submittedRecord.financial.amounts[0].estimatedNetProfit,33000);assert.equal(r.submittedRecord.financial.amounts[0].netProfit,null);assert.equal(r.submittedRecord.financial.amounts[0].outputTax,null);});
check('26个预置团均已完成且无有效结算占用，项目开放办理',()=>{
 const d=current.MicePrototypeSeed,settlementCases=d.activities.filter(a=>!a.demoStageCase);assert.equal(settlementCases.length,26);
 for(const a of settlementCases){assert.equal(a.status,'已完成');assert(M.activityAllows(a,d.projects.find(p=>p.id===a.projectId),'settlement'));assert(a.completion.basis);}
 assert(d.settlements.every(r=>['草稿','已退回'].includes(r.status)));
});
const previousStage=load(source.split('/* 用户要求所有预置项目团可办理结算')[0]);
check('旧已确认示例转新版草稿，原结算金额留在历史版本',()=>{
 const before=previousStage.MicePrototypeSeed,result=current.MicePrototypeDemo.upgrade(M.clone(before));
 for(const old of before.settlements.filter(r=>r.status==='已确认')){
  const r=result.settlements.find(r=>r.id===old.id);assert.equal(r.status,'草稿');assert.equal(r.version,old.version+1);
  assert.deepEqual(r.amountHistory.at(-1).record,M.clone(old.confirmedRecord));assert.equal(r.confirmedRecord,null);
 }
});
check('旧会话仅撤回重开示例的待审批事项，不改其他审批',()=>{
 const saved=M.clone(previousStage.MicePrototypeSeed),r=saved.settlements[0];r.status='审批中';
 saved.approvals.push({id:'SP-TEST-PENDING',sourceId:r.id,status:'待审批'},{id:'SP-OTHER',sourceId:'OTHER',status:'待审批'});
 const result=current.MicePrototypeDemo.upgrade(saved);
 assert.equal(result.approvals.find(r=>r.id==='SP-TEST-PENDING').status,'已撤回');
 assert.equal(result.approvals.find(r=>r.id==='SP-OTHER').status,'待审批');
});
check('用户新增项目和项目团不被改为完成',()=>{
 const saved=M.clone(previousStage.MicePrototypeSeed);
 saved.projects.push({id:'USER-PROJECT',name:'用户项目',status:'草稿'});
 saved.activities.push({id:'USER-ACTIVITY',projectId:'USER-PROJECT',status:'草稿'});
 const result=current.MicePrototypeDemo.upgrade(saved);
 assert.deepEqual(result.projects.at(-1),saved.projects.at(-1));assert.deepEqual(result.activities.find(a=>a.id==='USER-ACTIVITY'),saved.activities.at(-1));
});
const out=path.join(__dirname,'../docs/evidence/mice-prototype/settlement-workflow-20261024');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'data-rules.json'),JSON.stringify({passed:checks.length,checks},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
