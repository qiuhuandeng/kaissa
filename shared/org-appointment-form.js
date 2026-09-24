/* Shared appointment fields for organization and employee account drawers. */
(function(){
'use strict';
const O=window.ApprovalOrgData,U=window.OrgAdminUI,{field,input,select,section}=U;
function html(org,current,department='',lead='',{showReason=true}={}){
 return section('任职信息',`<div class="form-grid">${lead}${field('任职部门 <span class="req">*</span>',select('department',[['','请选择任职部门']],current?.department||department))}${field('任职类型',select('primary',[['true','主任职'],['false','兼任']],String(current?.primary??true)))}${field(current?'变更生效日期 <span class="req">*</span>':'任职生效日期 <span class="req">*</span>',input('effectiveFrom',current?.start>O.today()?current.start:O.today(),'type="date"'))}${field('任职结束日期（可不填）',input('end',current?.end||'','type="date"'))}</div>`)+section('汇报关系',field('直属上级',select('manager',[['','未设置']],''))+'<p class="form-hint">从同公司有效任职中选择，个人上级可与部门负责人不同。</p><div class="aom-chain" data-manager-chain></div>')+(showReason?section('变更说明',field('任职新增或调整原因 <span class="req">*</span>','<textarea class="form-control" name="reason" rows="3" placeholder="新增或调整任职时填写；仅修改账号资料可不填"></textarea>')+'<p class="form-hint">按生效日期用于新申请找人，已有审批记录保留。</p>'):'');
}
function bind(host,{org,current,department='',person,company}){
 const q=name=>host.querySelector('[name="'+name+'"]'),value=name=>q(name)?.value||'';
 const label=a=>(org.people.find(p=>p.id===a.person)?.name||'未设置')+' · '+O.departmentPath(org,a.department)+(a.primary?'（主任职）':'（兼任）');
 function options(name,items,picked){q(name).innerHTML=select(name,items,picked).match(/<select[^>]*>([\s\S]*)<\/select>/)[1];if(picked&&!items.some(([id])=>id===picked)){const o=document.createElement('option');o.value=picked;o.textContent='原选择已失效，请重新选择';o.selected=true;q(name).append(o);}}
 function preview(){const seen=new Set(),parts=[],jobs=O.appointmentsAt(org,value('effectiveFrom'));let id=value('manager');while(id&&!seen.has(id)){seen.add(id);const a=jobs.find(a=>a.id===id);if(!a)break;parts.push(label(a));id=a.manager;}host.querySelector('[data-manager-chain]').textContent=parts.length?parts.join(' → '):'未设置直属上级；使用上级审批的申请将暂停处理。';}
 function refresh(initial=false){const date=value('effectiveFrom'),c=company(),departments=O.departmentsAt(org,date).filter(d=>d.company===c&&d.active),jobs=O.appointmentsAt(org,date).filter(a=>a.company===c&&a.person!==person()&&O.effective(a,date)&&O.currentPerson(org,a.person,c,date));options('department',[['','请选择任职部门'],...departments.map(d=>[d.id,O.departmentPath({...org,departments:O.departmentsAt(org,date)},d.id)])],initial?current?.department||department:value('department'));options('manager',[['','未设置'],...jobs.map(a=>[a.id,label(a)])],initial?current?.manager||'':value('manager'));preview();}
 q('effectiveFrom').addEventListener('change',()=>refresh());q('manager').addEventListener('change',preview);refresh(true);
 return {refresh,read:()=>({id:current?.id||'job-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),person:person(),company:company(),department:value('department'),primary:value('primary')==='true',start:current?.start||value('effectiveFrom'),end:value('end'),manager:value('manager')}),changed:()=>!current||['department','manager','end'].some(k=>value(k)!==(current[k]||''))||(value('primary')==='true')!==current.primary||!!value('reason').trim()};
}
window.OrgAppointmentForm={html,bind};
})();
