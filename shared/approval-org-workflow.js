/* Organization change prototype: approved changes become dated arrangements, not live rewrites. */
(function(root){
'use strict';
const O=typeof module==='object'&&module.exports?require('./approval-org-data.js'):root.ApprovalOrgData;
const uid=prefix=>prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),types={branch:'分公司',center:'中心',storeDepartment:'门市部',department:'部门',store:'门店'};
const unique=a=>[...new Set(a)],copy=O.clone;
const structure=d=>d?Object.fromEntries(['id','company','name','parent','type','active','scope','start'].map(k=>[k,d[k]??(k==='active'?true:'')])):null;
const state=(r,date=O.today())=>r.status==='已通过'?(r.effectiveFrom>date?'待生效':'已生效'):r.status;
function descendants(org,id,date=O.today()){const ds=O.departmentsAt(org,date),out=[],seen=new Set([id]);let queue=[id];while(queue.length){const parent=queue.shift();ds.filter(d=>d.parent===parent&&!seen.has(d.id)).forEach(d=>{seen.add(d.id);out.push(d.id);queue.push(d.id);});}return out;}
function impact(org,id,date=O.today()){
 const ids=[id,...descendants(org,id,date)],departments=O.departmentsAt(org,date);
 return {children:departments.filter(d=>ids.includes(d.id)&&d.id!==id&&d.active),jobs:O.appointmentsAt(org,date).filter(a=>ids.includes(a.department)&&O.effective(a,date)),owners:departments.filter(d=>ids.includes(d.id)).flatMap(d=>(d.owners||[]).filter(o=>O.effective(o,date))),requests:org.requests.filter(r=>['待审批','已退回'].includes(r.status)&&(ids.includes(r.department||r.value?.department)||r.type==='department'&&ids.includes(r.value?.parent)))};
}
function boundaries(org,from){const dates=new Set([from]);[...org.departments,...org.appointments].forEach(v=>[v,...v.revisions||[],...v.owners||[]].forEach(a=>{if(a.start>=from)dates.add(a.start);if(a.effectiveFrom>=from)dates.add(a.effectiveFrom);}));return [...dates].sort();}
function validateDepartment(org,value,date,excludeRequest){
 const errors=[];if(!O.dateOK(date)||date<O.today())errors.push('生效日期不得早于今天');
 if(!value.name?.trim())errors.push('请填写组织名称');if(!O.companies.some(c=>c.id===value.company))errors.push('请选择所属公司');if(!types[value.type])errors.push('请选择组织类型');
 const old=org.departments.find(d=>d.id===value.id);if(old&&old.company!==value.company)errors.push('组织不能跨主体迁移');
 if((old?.type==='store'||value.type==='store')&&old?.type!==value.type)errors.push('门店类型及经营档案请在门店管理维护');
 if(old&&(old.revisions||[]).some(r=>r.effectiveFrom>date))errors.push('已有之后的组织安排，请先核对待生效记录');
 for(const at of boundaries(org,date)){
  const ds=O.departmentsAt(org,at),parent=ds.find(d=>d.id===value.parent);
  if(value.parent&&(!parent?.active||parent.company!==value.company))errors.push('上级组织须在生效日及后续安排中属于本公司且启用');
  if(value.parent===value.id||descendants(org,value.id,at).includes(value.parent))errors.push('不能选择本组织或下级组织作为上级');
  if(parent?.type==='store')errors.push('门店不能下挂组织');
  if(ds.some(d=>d.id!==value.id&&d.company===value.company&&d.parent===value.parent&&d.name===value.name.trim()&&d.active))errors.push('同一上级下已有同名组织');
  if(!value.active){const use=impact(org,value.id,at);if(use.children.length)errors.push('仍有启用的下级组织，请先迁移或停用');if(use.jobs.length)errors.push('仍有有效或计划任职，请先调整成员任职');if(use.owners.length)errors.push('仍有负责人任期，请先结束负责人安排');if(use.requests.some(r=>r.id!==excludeRequest))errors.push('仍有未完成的组织或任职申请，请先处理');}
 }
 return unique(errors);
}
function saveDepartment(org,value,date,reason,requestId){
 const errors=validateDepartment(org,value,date,requestId);if(!reason?.trim())errors.push('请填写变更原因');if(errors.length)return errors;
 const d=org.departments.find(d=>d.id===value.id),before=d?structure(O.departmentAt(d,date)):null;
 const after={...structure(value),name:value.name.trim(),start:d?.start||date};
 if(d){d.initial=d.initial||structure(d);d.revisions=[...d.revisions||[],{...after,effectiveFrom:date}];Object.assign(d,O.departmentAt(d));}
 else org.departments.push({...after,owners:[],initial:{...after,active:false},revisions:[{...after,effectiveFrom:date}]});
 org.changes.unshift({id:uid('change'),kind:'department',department:value.id,company:value.company,before,after:copy(after),effectiveFrom:date,reason:reason.trim(),requestId,at:O.today()});return [];
}
function saveOwners(org,id,values,date,reason,requestId){
 const d=O.departmentsAt(org,date).find(d=>d.id===id),errors=[];
 if(!O.dateOK(date)||date<O.today())errors.push('生效日期不得早于今天');if(!d?.active)errors.push('组织在生效日未启用');if(!reason?.trim())errors.push('请填写变更原因');
 if(values.length)errors.push(...O.validateOwners({...org,departments:O.departmentsAt(org,date)},id,values.map(v=>({...v,start:date}))));
 const raw=org.departments.find(d=>d.id===id);if((raw?.owners||[]).some(o=>o.start>date))errors.push('已有之后的负责人安排，请先核对待生效记录');
 if(errors.length)return unique(errors);
 const before=copy(raw.owners||[]),end=new Date(Date.parse(date)-86400000).toISOString().slice(0,10),after=values.map(v=>({...v,start:date}));
 raw.owners=[...before.filter(o=>o.start<date).map(o=>({...o,end:!o.end||o.end>=date?end:o.end})),...after];
 org.changes.unshift({id:uid('change'),kind:'owners',department:id,company:d.company,before,after:copy(after),effectiveFrom:date,reason:reason.trim(),requestId,at:O.today()});return [];
}
function fingerprint(org,r){if(r.type==='appointment')return JSON.stringify(org.appointments.find(a=>a.id===r.value.id)||null);const d=org.departments.find(d=>d.id===r.department);if(r.type==='owners')return JSON.stringify(d?.owners||[]);return JSON.stringify(d?{initial:d.initial||structure(d),revisions:d.revisions||[]}:null);}
function apply(org,r,date){if(r.type==='owners')return saveOwners(org,r.department,r.values,date,r.reason,r.id);if(r.type==='appointment')return O.saveAppointment(org,r.value,date,r.reason);return saveDepartment(org,r.value,date,r.reason,r.id);}
function submit(org,input,existing){
 const r={...copy(input),id:existing||uid('ORG'),status:'待审批',at:O.today(),applicant:input.applicant||'公司组织管理员'},errors=[];
 if(!['department','owners','appointment'].includes(r.type))errors.push('不支持的组织申请类型');
 const department=org.departments.find(d=>d.id===r.department);r.company=r.company||r.value?.company||department?.company;r.department=r.department||r.value?.department||r.value?.id;
 if(org.requests.some(x=>x.id!==existing&&['待审批','已退回'].includes(x.status)&&x.type===r.type&&(r.type==='appointment'?x.value.id===r.value.id:x.department===r.department)))errors.push('同一事项已有未完成申请，请先处理原申请');
 const old=existing?org.requests.find(x=>x.id===existing):null;if(existing&&(!old||old.status!=='已退回'))errors.push('只有已退回的申请可以修改重提');
 if(r.type==='department'&&!org.departments.some(d=>d.id===r.value.id)&&org.requests.some(x=>x.id!==existing&&x.type==='department'&&['待审批','已退回'].includes(x.status)&&x.company===r.company&&x.value.name===r.value.name&&x.value.parent===r.value.parent))errors.push('同名组织已有未完成的新建申请');
 if(errors.length)return errors;
 const trial=copy(org);trial.requests=trial.requests.filter(x=>x.id!==existing);errors.push(...apply(trial,r,r.effectiveFrom));if(errors.length)return unique(errors);
 r.labels={people:org.people.map(p=>({id:p.id,name:p.name})),departments:org.departments.map(d=>({id:d.id,name:d.name}))};
 r.baseline=fingerprint(org,r);r.before=r.type==='appointment'?copy(O.appointmentsAt(org).find(a=>a.id===r.value.id)||null):r.type==='owners'?copy(O.departmentsAt(org).find(d=>d.id===r.department)?.owners||[]):structure(O.departmentsAt(org).find(d=>d.id===r.department));
 r.history=[...old?.history||[],{action:existing?'修改重提':'提交申请',at:O.today(),opinion:r.reason,proposal:copy({type:r.type,value:r.value,values:r.values,effectiveFrom:r.effectiveFrom,reason:r.reason,before:r.before,labels:r.labels})}];
 const index=org.requests.findIndex(x=>x.id===existing);if(index<0)org.requests.unshift(r);else org.requests[index]=r;return [];
}
function decide(org,id,action,opinion,actor='审批人',date=O.today()){
 const r=org.requests.find(r=>r.id===id);if(!r)return ['申请不存在'];
 if(!['通过','退回','拒绝','撤回'].includes(action))return ['请选择处理结果'];
 if(action==='撤回'?!['待审批','已退回'].includes(r.status):r.status!=='待审批')return ['当前状态不能重复处理'];
 if(!opinion?.trim())return ['请填写处理意见'];
 const next=copy(org),record=next.requests.find(x=>x.id===id);
 if(action==='通过'){
  if(!r.baseline)return ['旧申请缺少变更前资料，请退回后重新提交'];
  if(r.baseline!==fingerprint(org,r))return ['申请后原资料已有调整，请退回重新核对，不能覆盖新安排'];
  const effectiveFrom=r.effectiveFrom>date?r.effectiveFrom:date,errors=apply(next,record,effectiveFrom);if(errors.length)return errors;
  if(record.type==='appointment'&&next.changes[0])next.changes[0].requestId=id;
  record.effectiveFrom=effectiveFrom;record.approvedAt=date;record.status='已通过';
 }else record.status={'退回':'已退回','拒绝':'已拒绝','撤回':'已撤回'}[action];
 record.history=[...record.history||[],{action,at:date,actor,opinion:opinion.trim(),effectiveFrom:record.effectiveFrom}];
 Object.assign(org,next);return [];
}
function companyTree(org,company,date=O.today()){
 const ds=O.departmentsAt(org,date),c=O.companies.find(c=>c.id===company);
 function children(parent,seen=[]){return ds.filter(d=>d.company===company&&d.parent===parent&&!seen.includes(d.id)).map(d=>({id:d.id,name:d.name,type:d.type||O.orgType(d),label:types[d.type||O.orgType(d)],company,path:c.short+' > '+O.departmentPath({...org,departments:ds},d.id).replaceAll(' / ',' > '),owner:O.owners(org,d,date).map(id=>org.people.find(p=>p.id===id)?.name||id).join('、')||'待配置',status:d.start>date?'待生效':d.active?'启用':'停用',subject:c.short,center:ds.find(x=>x.id===d.parent)?.name||c.short,scope:d.scope||'',open:true,children:children(d.id,[...seen,d.id])}));}
 return {name:c.short,type:'company',label:'主体公司',company,path:'凯撒旅游集团 > 旅游板块 > '+c.short,owner:'组织管理员',status:'启用',subject:c.short,center:'旅游板块',scope:'本公司组织范围',open:true,children:children('')};
}
const api={types,structure,state,descendants,impact,validateDepartment,saveDepartment,saveOwners,fingerprint,submit,decide,companyTree};
if(typeof module==='object'&&module.exports)module.exports=api;else root.ApprovalOrgWorkflow=api;
})(typeof window==='object'?window:globalThis);
