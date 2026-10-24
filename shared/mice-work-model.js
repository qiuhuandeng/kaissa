/* 项目分工与报价原型规则；金额参考不等于成交、应收或付款权限。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./mice-prototype-model.js'):root.MiceModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.MiceWorkModel=api;})(typeof window!=='undefined'?window:globalThis,function(M){
'use strict';
const manager=(actor,p)=>!!actor&&!!p&&(actor.superAdmin||actor.company===p.company&&['负责人','销售'].includes(actor.role));
const staff=(data,name)=>data.catalog.staff.find(s=>s.name===name);
const delegation=(p,name)=>(p.delegations||[]).find(d=>d.employee===name&&d.status==='有效');
function scopeProblem(p,a,d){
 if(!d)return '本项目尚未委派建团范围，请由项目负责人登记项目分工';
 if(a.start&&a.start<d.start||a.end&&a.end>d.end)return '服务日期超出本人的项目分工期间';
 if(a.city&&d.cities?.length&&!d.cities.some(c=>a.city===c||a.city.startsWith(c+'／')||a.city.startsWith(c+'/')))return '项目团城市不在负责范围：'+d.cities.join('、');
 if(a.service&&d.services?.length&&!d.services.includes(a.service))return '服务类型不在本人的项目分工范围';
 if(a.planner&&a.planner!==d.employee)return '只能建立或维护本人负责的项目团';
 return '';
}
function canCreate(data,p,actor){if(!p||['已结项','已终止'].includes(p.status))return false;return manager(actor,p)||!!(actor&&p&&actor.company===p.company&&['计调','销操兼岗'].includes(actor.role)&&delegation(p,actor.name)?.canCreate&&staff(data,actor.name)?.canPlan);}
function activityIssue(data,p,a,actor,isNew=true){
 if(!p||!actor||!actor.superAdmin&&actor.company!==p.company)return '无权办理其他公司的项目团';
 if(['已结项','已终止'].includes(p.status))return '项目已结束，不能新增或修改项目团';
 if(manager(actor,p))return '';
 if(!['计调','销操兼岗'].includes(actor.role))return '当前岗位没有项目团办理权限';
 if(isNew&&!canCreate(data,p,actor))return '未取得本项目建团分工';
 if(!isNew&&a.planner!==actor.name)return '只能维护本人负责的项目团';
 const d=delegation(p,actor.name);return d?scopeProblem(p,a,d):isNew?'未取得本项目建团分工':'';
}
function plannerFor(c,data){if(c.responsiblePlanner)return c.responsiblePlanner;const names=[...new Set((c.activities||[]).map(id=>data.activities.find(a=>a.id===id)?.planner).filter(Boolean))];return names.length===1?names[0]:'';}
function quoteAccess(data,p,c,actor,confirm=false){
 if(!actor||!p||!actor.superAdmin&&actor.company!==p.company)return '无权办理其他公司的报价';
 if(['已结项','已终止'].includes(p.status))return '项目已结束，不能办理新报价';
 const phaseIssue=M.quoteActivityIssue(c,p,data);if(phaseIssue)return phaseIssue;
 if(manager(actor,p))return '';
 const acts=(c.activities||[]).map(id=>data.activities.find(a=>a.id===id));
 if(!acts.length||acts.some(a=>!a||a.projectId!==p.id||a.planner!==actor.name))return '仅可办理本人负责的本项目团报价';
 const d=delegation(p,actor.name);
 if(actor.role==='销操兼岗'&&!d&&!(p.delegations||[]).some(row=>row.employee===actor.name))return '';
 if(actor.role!=='计调'&&actor.role!=='销操兼岗'||!staff(data,actor.name)?.canQuote||!d||d.quoteMode==='none'||confirm&&d.quoteMode!=='confirm')return confirm?'本次分工仅可准备报价，客户确认请交销售或项目负责人办理':'本项目没有报价权限，请核对原员工任职授权和项目分工';
 return acts.map(a=>scopeProblem(p,a,d)).find(Boolean)||'';
}
function usage(data,p,currency,person='',frameworkId='',exclude=''){
 const match=c=>c&&c.projectId===p.id&&c.id!==exclude&&c.currency===currency&&(!person||plannerFor(c,data)===person)&&(!frameworkId||c.frameworkId===frameworkId);
 const orders=data.orders.filter(o=>{const c=data.commitments.find(c=>c.id===o.commitmentId);return match(c||o)&&!['已取消','已作废'].includes(o.status);});
 const pending=data.commitments.filter(c=>match(c)&&c.status==='待审批'&&!orders.some(o=>o.commitmentId===c.id));
 const quotes=data.commitments.filter(c=>match(c)&&['草稿','已报价'].includes(c.status)&&!orders.some(o=>o.commitmentId===c.id));
 return {confirmed:M.sum(orders),pending:M.sum(pending),quoted:M.sum(quotes),unknown:[...orders,...pending].some(r=>M.num(r.amount)==null)};
}
function quoteLimits(data,p,c,{approved=false}={}){
 const errors=[],warnings=[],person=plannerFor(c,data),d=(p.delegations||[]).find(d=>d.id===c.workAssignmentId)||delegation(p,person),fw=(p.frameworks||[]).find(f=>f.id===c.frameworkId),amount=M.num(c.amount);
 if(d&&d.control!=='reference'){
  if(d.status!=='有效')errors.push('原报价分工已结束，请由项目负责人重新核对办理范围');
  if(!d.policyBasis)errors.push('金额限制缺少已批准的规则依据');
  if(d.currency!==c.currency)errors.push('报价币种与已批准的人员金额限制不同，须先核对规则');
 }
 if(d&&d.currency===c.currency){
  const u=usage(data,p,c.currency,d.employee,'',c.id),overTotal=d.businessAmount!=null&&amount!=null&&M.round(u.confirmed+u.pending+amount)>d.businessAmount,overSingle=d.singleLimit!=null&&amount!=null&&amount>d.singleLimit;
  if(overTotal||overSingle||u.unknown||amount==null){
   const msg=u.unknown||amount==null?'报价或已有业务金额待确认，人员金额范围尚不能完整核对':overSingle?'本次报价超过单笔金额限制':'本次报价超过人员负责业务金额';
   if(d.control==='hard')errors.push(msg+'，须先调整有效分工依据');
   else if(d.control==='approval'&&!approved&&c.approvalMode!=='提交业务审批（演示规则）')errors.push(msg+'，按已登记规则须提交业务审批');
   else warnings.push(msg+(d.control==='reference'?'（计划参考）':''));
  }
 }
 if(fw){
  const u=usage(data,p,c.currency,'',fw.id,c.id);
  if(fw.nature==='上限'&&fw.amount!=null){if(c.currency!==fw.currency)errors.push('框架上限与本次报价币种不同，请核对有效合同依据');else if(amount==null||u.unknown)errors.push('框架上限尚不能完整核对，请先确认金额或补充合同依据');else if(M.round(u.confirmed+u.pending+amount)>fw.amount)errors.push('已确认及审批中金额加本次报价超过框架上限，请先补充有效合同');}
  else if(fw.amount!=null&&c.currency===fw.currency&&amount!=null&&u.confirmed+u.pending+amount>fw.amount)warnings.push('本次报价后超过框架'+fw.nature+'金额，非自动成交上限');
 }
 return {errors,warnings};
}
function validateDelegation(data,p,d,oldId=''){
 const e={},s=staff(data,d.employee);
 if(!s||!s.canPlan||!s.companies.includes(p.company))e.employee='请选择本公司已有计调权限的员工';
 if(!d.scope?.trim())e.scope='请写明负责事项';
 if(!d.start||!d.end||d.start>d.end||p.start&&d.start<p.start||p.end&&d.end>p.end)e.end='请填写项目服务期间内的有效范围';
 if(!d.services?.length)e.services='至少选择一种服务类型';
 if(!['reference','approval','hard'].includes(d.control))e.control='请选择负责业务金额用途';if(!['CNY','EUR','USD'].includes(d.currency))e.currency='请选择金额币种';if(!['none','draft','confirm'].includes(d.quoteMode))e.quoteMode='请选择报价办理范围';
 if(d.quoteMode!=='none'&&!s?.canQuote)e.quoteMode='该员工尚无报价岗位权限，请先在员工任职办理授权';
 if((p.delegations||[]).some(r=>r.id!==oldId&&r.employee===d.employee&&r.status==='有效'))e.employee='该员工已有有效项目分工，请维护原记录';
 for(const k of ['businessAmount','costBudget','singleLimit'])if(d[k]!=null&&(!Number.isFinite(d[k])||d[k]<0))e[k]='金额须为有效非负数';
 if(d.control!=='reference'&&(!d.policyBasis?.trim()||d.businessAmount==null&&d.singleLimit==null))e.policyBasis='须登记金额限制及已批准的规则依据，规则未定请使用计划参考';
 return e;
}
const signature=c=>JSON.stringify(['name','reference','pricing','currency','amount','quantity','unit','unitPrice','quantityKind','rule','frameworkId'].map(k=>c[k]??'').concat([(c.activities||[]).slice().sort()]));
return {manager,staff,delegation,scopeProblem,canCreate,activityIssue,plannerFor,quoteAccess,usage,quoteLimits,validateDelegation,signature};
});
