/* 费用预算按项目、人员和子团核对；不等同于收入、付款余额或税后成本。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./mice-prototype-model.js'):root.MiceModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.MiceBudgetModel=api;})(typeof window==='object'?window:globalThis,function(M){
  'use strict';
  const enabled=p=>p?.budgetControl==='enforced';
  const valid=n=>n!==''&&n!=null&&Number.isFinite(Number(n))&&Number(n)>=0;
  const amount=n=>Number(n)||0;
  const active=c=>!['已取消','已作废'].includes(c.status);
  const confirmed=c=>active(c)&&(c.status==='已确认'||c.budgetNature==='actual');
  const rate=c=>c.currency==='CNY'||!c.currency?1:Number(c.agreedRate||c.budgetRate)>0?Number(c.agreedRate||c.budgetRate):null;
  const closed=(data,p,aid)=> (data.settlements||[]).some(r=>r.projectId===p.id&&r.status==='已确认'&&r.budgetComplete&&(aid?r.activities?.includes(aid):r.includeProjectCosts));
  function costs(data,p){
    const groups={},pending=new Set(),unknown=new Set();let common=0,commonUnknown=false,commonPending=false;
    for(const c of (data.costs||[]).filter(c=>c.projectId===p.id&&active(c))){
      const type=M.costType(c),ids=c.activityId?[c.activityId]:type==='shared'?[...new Set([...(c.activityIds||[]),...(c.allocations||[]).map(a=>a.activityId)])]:[];
      if(!confirmed(c)){ids.forEach(id=>pending.add(id));if(!ids.length)commonPending=true;continue;}
      const fx=rate(c),signedValid=c.adjustmentId&&c.amount!=null&&Number.isFinite(Number(c.amount));if(fx==null||(!valid(c.amount)&&!signedValid)){ids.forEach(id=>unknown.add(id));if(!ids.length)commonUnknown=true;continue;}
      const add=(id,v)=>groups[id]=M.round((groups[id]||0)+Number(v)*fx);
      if(type==='direct')add(c.activityId,c.amount);
      else if(type==='common')common+=Number(c.amount)*fx;
      else {
        const distribution=M.costDistribution(c);
        for(const a of c.allocations||[]){if(!valid(a.amount)&&!(c.adjustmentId&&Number.isFinite(Number(a.amount))))unknown.add(a.activityId);else add(a.activityId,a.amount);}
        common+=(amount(distribution.common)+amount(distribution.remaining))*fx;
        if(distribution.remaining>0)ids.forEach(id=>pending.add(id));
      }
    }
    return {groups,pending,unknown,common:M.round(common),commonUnknown,commonPending};
  }
  function snapshot(data,p){
    const c=costs(data,p),people=(p.delegations||[]).filter(d=>d.status!=='已结束');
    const groups=(data.activities||[]).filter(a=>a.projectId===p.id).map(a=>{
      const cost=c.groups[a.id]||0,unknown=c.unknown.has(a.id),pending=c.pending.has(a.id),settled=closed(data,p,a.id)&&!pending&&!unknown;
      const released=settled||a.status==='已取消'&&!cost&&!pending&&!unknown;
      const occupied=a.status==='草稿'?cost:released?cost:Math.max(amount(a.originalBudget),cost);
      return {a,budget:valid(a.originalBudget)?Number(a.originalBudget):null,cost,occupied:M.round(occupied),remaining:valid(a.originalBudget)&&!unknown?M.round(a.originalBudget-cost):null,released,settled,pending,unknown,overrun:valid(a.originalBudget)?Math.max(0,M.round(cost-a.originalBudget)):cost};
    });
    const rows=people.map(d=>{const assigned=groups.filter(r=>r.a.planner===d.employee),occupied=M.round(assigned.reduce((s,r)=>s+r.occupied,0)),unknown=(d.currency||'CNY')!=='CNY'||assigned.some(r=>r.unknown);return {d,groups:assigned,occupied,unknown,remaining:!unknown&&valid(d.costBudget)?M.round(d.costBudget-occupied):null};});
    const unassigned=groups.filter(r=>!people.some(d=>d.employee===r.a.planner));
    const publicClosed=closed(data,p,'')&&!c.commonPending&&!c.commonUnknown;
    const publicReserved=publicClosed?c.common:Math.max(amount(p.publicBudget),c.common);
    const assigned=rows.reduce((s,r)=>s+Math.max(amount(r.d.costBudget),r.occupied),0);
    const reserved=M.round(assigned+unassigned.reduce((s,r)=>s+r.occupied,0)+publicReserved);
    const uncertain=c.commonUnknown||groups.some(r=>r.unknown),occupied=uncertain?null:M.round(groups.reduce((s,r)=>s+r.occupied,0)+c.common);
    return {groups,people:rows,unassigned,common:c.common,commonUnknown:c.commonUnknown,commonPending:c.commonPending,publicClosed,reserved,occupied,available:valid(p.originalBudget)&&!rows.some(r=>r.unknown)&&!c.commonUnknown&&!groups.some(r=>r.unknown)?M.round(p.originalBudget-reserved):null,actual:uncertain?null:M.round(Object.values(c.groups).reduce((s,v)=>s+v,0)+c.common)};
  }
  function groupIssues(data,p,next){
    if(!enabled(p))return [];
    const replacements=next.map((a,i)=>({...a,id:a.id||'BUDGET-PREVIEW-'+i,projectId:p.id})),ids=new Set(replacements.map(a=>a.id));
    const shadow={...data,activities:[...(data.activities||[]).filter(a=>!ids.has(a.id)),...replacements]},s=snapshot(shadow,p),errors=[];
    const executing=replacements.filter(a=>a.status!=='草稿');
    if(!executing.length)return errors;
    if(!valid(p.originalBudget))errors.push('请先设置项目费用总预算');
    for(const a of executing){
      const r=s.groups.find(r=>r.a.id===a.id);
      if(!valid(a.originalBudget))errors.push(a.name+'尚未明确费用预算，请先调整预算');
      if(r.unknown)errors.push(a.name+'费用或折算依据待核对');
      if(r.overrun>0)errors.push(a.name+'已确认费用超过本团预算 '+M.money(r.overrun)+'，请先调整预算');
    }
    for(const r of s.people.filter(r=>executing.some(a=>a.planner===r.d.employee))){
      if(r.unknown||!valid(r.d.costBudget))errors.push(r.d.employee+'费用额度或折算依据待核对');
      else if(r.remaining<0)errors.push(r.d.employee+'费用额度不足 '+M.money(-r.remaining)+'，请先调整分工额度或本团预算');
    }
    if(s.available==null&&valid(p.originalBudget))errors.push('项目现有费用或额度折算依据待核对');
    if(s.available<0)errors.push('项目可分配预算不足 '+M.money(-s.available)+'，请先调整项目预算');
    return [...new Set(errors)];
  }
  function allocationIssues(data,p){
    if(!enabled(p))return [];
    const s=snapshot(data,p),e=[];
    if(!valid(p.originalBudget)||!valid(p.publicBudget??0))e.push('项目总预算和公共费用预算须为非负金额');
    for(const r of s.people){if((r.d.currency||'CNY')!=='CNY')e.push(r.d.employee+'的费用额度须先核对为CNY');else if(r.unknown)e.push(r.d.employee+'现有费用折算依据待核对');else if(!valid(r.d.costBudget)||r.remaining<0)e.push(r.d.employee+'额度不能低于现有占用 '+M.money(r.occupied));}
    if(s.commonUnknown)e.push('公共费用折算依据待核对');
    if(amount(p.publicBudget)<s.common)e.push('公共费用预算不能低于已确认费用 '+M.money(s.common));
    if(s.available<0)e.push('人员额度、公共预算与直接承担的子团占用合计超过项目总预算 '+M.money(-s.available));
    return e;
  }
  function costIssues(data,p,c){
    if(!enabled(p)||!confirmed(c))return [];
    const shadow={...data,costs:[...(data.costs||[]).filter(r=>r.id!==c.id),c]},s=snapshot(shadow,p),errors=[];
    if(rate(c)==null)errors.push('外币采购须填写预算汇率或有效约定汇率');
    const ids=c.activityId?[c.activityId]:M.costType(c)==='shared'?(c.allocations||[]).map(a=>a.activityId):[];
    for(const r of s.groups.filter(r=>ids.includes(r.a.id))){if(r.budget==null)errors.push(r.a.name+'尚未设置费用预算');else if(r.overrun>0)errors.push(r.a.name+'超出费用预算 '+M.money(r.overrun));}
    if(s.common>amount(p.publicBudget))errors.push('公共及未分配费用超出公共预算 '+M.money(s.common-amount(p.publicBudget)));
    for(const r of s.people.filter(r=>r.groups.some(g=>ids.includes(g.a.id))))if(r.remaining!=null&&r.remaining<0)errors.push(r.d.employee+'费用额度已超出 '+M.money(-r.remaining));
    if(s.available==null)errors.push('项目现有费用或额度折算依据待核对');
    if(s.available<0)errors.push('项目费用总预算已超出 '+M.money(-s.available));
    return [...new Set(errors)];
  }
  function releaseIssues(data,p,ids,includeProjectCosts){
    if(!enabled(p))return [];
    const s=snapshot(data,p),e=[];
    for(const r of s.groups.filter(r=>ids.includes(r.a.id)))if(r.pending||r.unknown)e.push(r.a.name+'仍有未确认费用、未分配采购或折算缺项，不能确认费用完整');
    if(includeProjectCosts&&(s.commonPending||s.commonUnknown))e.push('项目公共费用尚未完整核对');
    return e;
  }
  return {enabled,valid,rate,costs,snapshot,groupIssues,allocationIssues,costIssues,releaseIssues};
});
