/* 单团原型：共用演示资料及当前浏览器会话的填写结果。不会生成实收、实付或核算记录。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MiceModel=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const clone=v=>JSON.parse(JSON.stringify(v));
  const num=v=>v===''||v==null?null:Number(v);
  const money=(v,c='CNY')=>v==null||!Number.isFinite(Number(v))?'待确认':(c==='CNY'?'¥':c+' ')+Number(v).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const round=v=>Math.round((Number(v)+Number.EPSILON)*100)/100;
  const sum=(rows,key='amount')=>round(rows.reduce((a,x)=>a+(Number(x[key])||0),0));
  function validateProject(p,mode='draft',ctx={}){
    const e={};if(!p.name?.trim())e.name='请填写项目名称';if(!p.customer?.trim())e.customer='请选择客户单位';
    if(mode!=='draft'){
      for(const [k,l] of [['company','我方公司'],['department','负责部门'],['kind','业务分类'],['mode','组织方式'],['start','服务开始日期'],['end','服务结束日期'],['sales','销售'],['owner','项目负责人'],['scope','整体服务范围'],['basis','客户需求资料']])if(!p[k])e[k]='请填写'+l;
    }
    if(p.start&&p.end&&p.start>p.end)e.end='结束日期不能早于开始日期';
    if(p.mode==='single'&&ctx.activityCount>1)e.mode='已有多个项目团，请保留多个项目团组织方式';
    if(ctx.old&&ctx.confirmed&&(ctx.old.customer!==p.customer||ctx.old.company!==p.company))e.customer='已有客户订单，请通过项目变更处理签约方';
    if(ctx.catalog){const c=ctx.catalog.companies.find(x=>x.name===p.company);if(p.company&&!c)e.company='无权选择该公司';if(p.department&&c&&!c.departments.includes(p.department))e.department='请选择该公司的负责部门';for(const k of ['sales','owner'])if(p[k]&&!ctx.catalog.staff.some(x=>x.name===p[k]&&(!p.company||x.companies.includes(p.company))))e[k]='请选择该公司有权限的员工';}
    return e;
  }
  function validateActivity(a,p,mode='draft',ctx={}){
    const e={};if(!a.name?.trim())e.name='请填写项目团名称';
    if(a.start&&a.end&&a.start>a.end)e.end='结束日期不能早于开始日期';
    if(a.people!==null&&a.people!==''&&a.people!==undefined&&(!Number.isInteger(Number(a.people))||Number(a.people)<=0))e.people='人数须为正整数，未确定请选择人数待定';
    if(mode!=='draft'){
      for(const [k,l] of [['service','服务类型'],['start','开始日期'],['end','结束日期'],['city','项目团地点'],['planner','计调'],['scope','服务范围'],['commitmentId','关联报价单']])if(!a[k])e[k]='请填写'+l;
      if(p.start&&a.start<p.start||p.end&&a.end>p.end)e.start='项目团日期超出项目服务期间，请先核对或办理期间变更';
      const c=ctx.commitments?.find(x=>x.id===a.commitmentId&&x.projectId===p.id&&x.status==='已确认'&&x.activities.includes(a.id));if(!c)e.commitmentId='请选择覆盖本团的已确认报价单';const f=p.frameworks?.find(f=>f.id===c?.frameworkId);if(f&&(!['已签署','已签归档','已归档'].includes(f.status)||a.start<f.start||a.end>f.end))e.commitmentId='关联框架合同未签署或未覆盖本团日期，请先取得补充依据';
    }
    if(a.planner&&ctx.catalog&&!ctx.catalog.staff.some(x=>x.name===a.planner&&x.canPlan&&x.companies.includes(p.company)))e.planner='请选择该公司有执行权限的计调';
    return e;
  }
  function allocation(total,rows,common=0){const assigned=sum(rows),remaining=round(total-assigned-Number(common||0));return {assigned,remaining,valid:remaining>=0&&rows.every(r=>Number(r.amount)>=0)};}
  // 原采购金额用于项目合计；项目团只承接已明确的分配，项目承担和未分配分别核对。
  const costType=c=>c.activityId?'direct':c.scopeType||'common';
  function costDistribution(c){
    const amount=num(c.amount),allocated=sum(c.allocations||[]);
    const common=costType(c)==='direct'?0:c.adjustmentId&&!(c.allocations||[]).length?(costType(c)==='common'?amount:0):num(c.commonAmount)??(costType(c)==='common'?(amount==null?null:round(amount-allocated)):0);
    return {allocated,common,remaining:amount==null?null:round(amount-allocated-(common||0))};
  }
  function costScope(costs,projectId,activityIds=null,includeProjectCosts=false){
    const selected=activityIds==null?null:new Set(activityIds),lines=[],balances=[],pending=[];
    for(const c of costs.filter(c=>c.projectId===projectId)){
      const type=costType(c),split=costDistribution(c),allocations=c.allocations||[],coverage=[...new Set([...(c.activityIds||[]),...allocations.map(r=>r.activityId)])];
      const line=(kind,amount,activities=[],incomplete=false)=>({id:c.id,costId:c.id,name:c.name,supplier:c.supplier,currency:c.currency||'CNY',status:c.status,basis:c.basis,sourceVersion:c.version||1,originalAmount:num(c.amount),kind,amount,activities,allocationAmounts:clone(allocations.filter(r=>activities.includes(r.activityId))),allocationBasis:c.allocationBasis||'',incomplete});
      if(type!=='direct')balances.push({costId:c.id,name:c.name,currency:c.currency||'CNY',common:split.common,remaining:split.remaining,status:c.status});
      if(!selected){lines.push(line(type,num(c.amount),c.activityId?[c.activityId]:coverage));continue;}
      if(type==='direct'){if(selected.has(c.activityId))lines.push(line('direct',num(c.amount),[c.activityId]));continue;}
      const owned=allocations.filter(r=>selected.has(r.activityId)),covered=coverage.filter(id=>selected.has(id));
      const known=owned.filter(r=>num(r.amount)!=null),missing=known.length!==owned.length||type==='shared'&&(covered.some(id=>!known.some(r=>r.activityId===id))||!coverage.length&&selected.size>0);
      if(owned.length||missing){lines.push(line(type==='common'?'management':'shared',known.length?sum(known):null,type==='common'?owned.map(r=>r.activityId):covered,missing));}
      if(missing)pending.push({costId:c.id,text:c.name+'本次项目团分配待确认'});
      if(includeProjectCosts){
        if(split.common!==0)lines.push(line('project',split.common));
        if(split.remaining==null||split.remaining!==0)pending.push({costId:c.id,text:c.name+'尚有未分配金额'});
      }
    }
    return {lines,balances,pending};
  }
  function settlementEvidence(data,r){
    const scope=costScope(data.costs,r.projectId,r.activities,!!r.includeProjectCosts);
    return {scopeVersion:2,activities:[...r.activities],includeProjectCosts:!!r.includeProjectCosts,costs:clone(scope.lines),serviceResults:r.activities.map(id=>{const a=data.activities.find(a=>a.id===id);return {id,status:a?.status,acceptance:clone(a?.acceptance||{}),completion:clone(a?.completion||{})};})};
  }
  function memberRows(p,activities){
    const acts=activities.filter(a=>a.projectId===p.id),rows=acts.map(a=>[p.name,a.name,a.planner,'计调',a.start,a.end,(a.assignmentHistory||[]).map(h=>h.from+'→'+h.to).join('；'),a.scope]);
    for(const m of p.members||[]){const ids=[...new Set(m.activities||[])];for(const id of ids.length?ids:[''])rows.push([p.name,id?(acts.find(a=>a.id===id)?.name||'项目团资料待核对（'+id+'）'):'项目总体',m.name||m.employee,m.role,m.start,m.end,'',m.note]);}
    return rows;
  }
  function settledCost(cost,settlements){return settlements.some(r=>r.projectId===cost.projectId&&r.status==='已确认'&&(r.confirmedRecord?.costs||[]).some(c=>(c.costId||c.id)===cost.id));}
  function lockedAllocation(cost,rows,common,settlements){
    for(const r of settlements.filter(r=>r.projectId===cost.projectId&&r.status==='已确认'))for(const line of r.confirmedRecord?.costs||[]){
      if((line.costId||line.id)!==cost.id)continue;
      if(r.confirmedRecord.scopeVersion!==2)return '原结算未区分承担范围，请保留原分配并办理后补调整';
      if(line.kind==='project'&&num(common)!==line.amount)return '项目承担费用已经确认结算，请通过后补调整处理';
      if(!['shared','management'].includes(line.kind))continue;
      for(const id of r.activities){const before=(line.allocationAmounts||[]).find(v=>v.activityId===id),after=rows.find(v=>v.activityId===id);if(num(before?.amount)!==num(after?.amount))return '已结算项目团的承担金额不能覆盖，请通过后补调整处理';}
    }
    return '';
  }
  function payable(cost,requests){const unpaid=sum(requests.filter(r=>r.costId===cost.id&&!['已撤回','已退回','已作废'].includes(r.status)).map(r=>({amount:Math.max(0,r.amount-(r.paid||0))})));const paid=Number(cost.paid||0);return {paid,unpaid,available:Math.max(0,round(Math.min(Math.max(0,Number(cost.amount||0)+Number(cost.paymentReduction||0)),cost.conditionLimit==null?Infinity:Number(cost.conditionLimit))-paid-unpaid-Number(cost.offset||0)))};}
  function parseCSV(text){text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],s='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){s+='"';i++;}else quoted=!quoted;}else if((ch===','||ch==='\t')&&!quoted){row.push(s);s='';}else if(ch==='\n'&&!quoted){row.push(s.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];s='';}else s+=ch;}row.push(s.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);if(quoted)throw Error('引号未闭合，请检查导入文件');return rows;}
  function csv(rows){return '\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');}
  function createStore(seed,storage,upgrade){const key='caesar-mice-prototype-v1';let d=clone(seed),upgraded=false;try{const saved=JSON.parse(storage?.getItem(key)||'null');if(saved?.version===seed.version){const restored=upgrade?upgrade(saved):saved;d={...d,...restored};upgraded=restored!==saved;}}catch{}d.catalog.staff=d.catalog.staff.map(s=>({...seed.catalog.staff.find(t=>t.name===s.name),...s}));d.activities.forEach(a=>{for(const [key,prefix] of [['agenda','RC'],['roster','MD'],['resources','ZY']]){(a[key]||[]).forEach((r,i)=>{r.id=r.id||a.id+'-'+prefix+'-'+(i+1);if(key==='agenda'){r.kind=r.kind||(a.service==='旅游'?'旅游':'会议');r.title=r.title||r.name||'';}});}});function persist(){try{storage?.setItem(key,JSON.stringify(d));}catch{d.storageWarning='会话保存失败，请导出当前资料后再离开';}}if(upgraded)persist();return {get data(){return d;},save:persist,reset(){d=clone(seed);persist();},id(prefix){d.sequence=(d.sequence||1000)+1;return prefix+'20261008'+d.sequence;},find(type,id){return d[type]?.find(x=>x.id===id);},log(projectId,action,detail){d.logs.push({id:this.id('LOG'),projectId,action,detail,time:new Date().toLocaleString('zh-CN')});persist();}};}
  return {clone,num,money,round,sum,validateProject,validateActivity,allocation,costType,costDistribution,costScope,settlementEvidence,memberRows,settledCost,lockedAllocation,payable,parseCSV,csv,createStore};
});
