(function(){
'use strict';
const O=window.ApprovalOrgData,W=window.ApprovalOrgWorkflow,U=window.OrgAdminUI,{e,field,input,select,section}=U;
const person=(org,id)=>org.people.find(p=>p.id===id)?.name||'未设置',dept=(org,id)=>org.departments.find(d=>d.id===id)?.name||'公司直属',company=id=>O.companies.find(c=>c.id===id)?.short||id;
const dateField=value=>field('生效日期 <span class="req">*</span>',input('effectiveFrom',value||O.today(),'type="date"'));
const reasonField=value=>field('原因 <span class="req">*</span>',`<textarea class="form-control" name="reason" rows="3">${e(value||'')}</textarea>`,true);
function commit(org,errors,el,close,done){if(!U.errors(el,errors))return;if(!U.errors(el,O.save(org)))return;close();done?.();document.dispatchEvent(new CustomEvent('organization-updated'));U.toast('已保存');}
function editor(options={}){
 const org=O.read(),existing=options.request,companyId=existing?.company||options.company||'fj',id=existing?.department||options.department,base=org.departments.find(d=>d.id===id),kind=existing?.type||options.kind||'department',direct=options.direct===true;
 const draft=existing?.value||base||{id:'org-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),company:companyId,name:'',parent:options.parent||'',type:'department',active:true,scope:''};
 const desired=existing?.values||base?.owners?.filter(o=>O.effective(o,O.today()))||[];
 const title=kind==='owners'?'调整组织负责人':kind==='appointment'?'修改任职申请':base?'调整组织':'新增组织';
 const d=U.drawer(title,section('本次变更',`<div class="form-grid">${field('所属公司',input('companyText',company(companyId),'readonly'))}${dateField(existing?.effectiveFrom>O.today()?existing.effectiveFrom:O.today())}<div class="form-group-full" data-org-edit-fields></div>${reasonField(existing?.reason)}</div>`)+(base?section('影响核对',`<div data-org-impact></div><p class="form-hint">生效前保持原关系，已有审批及业务记录保留。</p>`):''),direct?'保存':'提交申请',({el,form,close})=>{
  const v=Object.fromEntries(new FormData(form)),fresh=O.read(),date=v.effectiveFrom;let request={id:existing?.id,type:kind,company:companyId,department:id,reason:v.reason,effectiveFrom:date};
  if(kind==='owners')request.values=[...form.querySelectorAll('[name=organizationOwner]:checked')].map(x=>({person:x.value,start:date,end:v.ownerEnd||''}));
  else if(kind==='appointment')request.value={...existing.value,department:v.department,primary:v.primary==='true',manager:v.manager,end:v.end};
  else {request.value={...draft,company:companyId,name:v.name.trim(),parent:v.parent,type:v.orgType||draft.type,active:v.active==='true',scope:v.scope};request.department=request.value.id;}
  let errors;
  if(direct && W.fingerprint(fresh,{type:kind,department:id})!==W.fingerprint(org,{type:kind,department:id})){U.errors(el,['打开表单后资料已有变更，请关闭后重新核对']);return;}
  if(direct){if(kind==='owners')errors=W.saveOwners(fresh,id,request.values,date,v.reason);else errors=W.saveDepartment(fresh,request.value,date,v.reason);}
  else errors=W.submit(fresh,request,existing?.id);
  commit(fresh,errors,el,close,options.done);
 });
 const host=d.el.querySelector('[data-org-edit-fields]');
 if(kind==='owners'){
  host.innerHTML=field('负责人',`<div class="aom-checks">${org.people.filter(p=>O.currentPerson(org,p.id,companyId)).map(p=>`<label class="ac-check"><input type="checkbox" name="organizationOwner" value="${e(p.id)}" ${desired.some(v=>v.person===p.id)?'checked':''}>${e(p.name)} · ${e(p.code)}</label>`).join('')}</div>`)+field('任期结束日期（可不填）',input('ownerEnd',desired[0]?.end||'','type="date"'))+'<p class="form-hint">取消全部勾选表示结束现任负责人；生效后需要部门负责人审批的申请将按模板异常规则处理。</p>';
 }else if(kind==='appointment'){
  const a=existing.value;host.innerHTML=`<div class="form-grid">${field('员工',input('employeeText',person(org,a.person),'readonly'))}${field('任职部门',select('department',org.departments.filter(d=>d.company===companyId&&d.active).map(d=>[d.id,d.name]),a.department))}${field('任职类型',select('primary',[['true','主任职'],['false','兼任']],String(a.primary)))}${field('直属上级',select('manager',[['','未设置'],...O.appointmentsAt(org,d.form.elements.effectiveFrom.value).filter(x=>x.company===companyId&&x.person!==a.person&&O.effective(x,d.form.elements.effectiveFrom.value)).map(x=>[x.id,person(org,x.person)+' · '+dept(org,x.department)])],a.manager))}${field('任职结束日期',input('end',a.end,'type="date"'))}</div>`;
 }else {
  const parents=org.departments.filter(x=>x.company===companyId&&x.active&&x.id!==draft.id&&!W.descendants(org,draft.id).includes(x.id)&&x.type!=='store');
  host.innerHTML=`<div class="form-grid">${field('组织名称 <span class="req">*</span>',input('name',draft.name))}${field('组织类型',select('orgType',Object.entries(W.types).filter(([k])=>k!=='store'||draft.type==='store'),draft.type,draft.type==='store'?'disabled':''))}${field('上级组织',select('parent',[['',company(companyId)],...parents.map(x=>[x.id,O.departmentPath(org,x.id)])],draft.parent))}${field('状态',select('active',[['true','启用'],['false','停用']],String(options.disable===false?true:options.disable?false:draft.active!==false)))}${field('业务范围',input('scope',draft.scope||''),true)}</div>`;
 }
 function impact(){const el=d.el.querySelector('[data-org-impact]');if(!el)return;const use=W.impact(O.read(),id,d.form.elements.effectiveFrom.value);el.textContent=`启用下级 ${use.children.length} 个，有效任职 ${use.jobs.length} 条，负责人任期 ${use.owners.length} 条，未完成申请 ${use.requests.length} 条。`;}
 d.form.elements.effectiveFrom.addEventListener('change',impact);impact();return d;
}
function proposal(org,r){
 if(r.labels)org={...org,people:r.labels.people,departments:r.labels.departments};
 if(r.type==='owners')return [['组织',dept(org,r.department)],['调整前负责人',(r.before||[]).map(v=>person(org,v.person)).join('、')||'未设置'],['拟任负责人',(r.values||[]).map(v=>person(org,v.person)+(v.end?'（至 '+v.end+'）':'')).join('、')||'结束全部现任负责人']];
 if(r.type==='appointment'){const a=r.value,b=r.before;return [['员工',person(org,a.person)],['原任职',b?dept(org,b.department)+' · '+(b.primary?'主任职':'兼任'):'新增任职'],['新任职',dept(org,a.department)+' · '+(a.primary?'主任职':'兼任')],['原直属上级',person(org,org.appointments.find(j=>j.id===b?.manager)?.person)],['新直属上级',person(org,org.appointments.find(j=>j.id===a.manager)?.person)],['任期结束',a.end||'长期']];}
 const a=r.value,b=r.before;return [['组织',a.name],['组织类型',W.types[a.type]],['调整前',b?b.name+' / '+dept(org,b.parent)+' / '+(b.active?'启用':'停用'):'新增组织'],['调整后',a.name+' / '+dept(org,a.parent)+' / '+(a.active?'启用':'停用')],['业务范围',a.scope||'—']];
}
const grid=rows=>`<div class="description-grid">${rows.map(([k,v])=>`<div class="description-item"><span class="description-label">${e(k)}</span><span class="description-value">${e(v)}</span></div>`).join('')}</div>`;
function requestDetail(id,action='detail',done){
 const org=O.read(),r=org.requests.find(r=>r.id===id);if(!r)return;
 if(action==='supplement')return editor({request:r,done});
 const deciding=action==='approve',withdrawing=action==='withdraw',editing=deciding||withdrawing;
 const content=section('申请内容',grid([['申请单号',r.id],['所属公司',company(r.company)],['状态',W.state(r)],['申请日期',r.at],['计划生效日',r.effectiveFrom||r.values?.[0]?.start||r.value?.start||'待补充'],...proposal(org,r),['申请原因',r.reason||'旧申请未填写']]))+section('处理记录',(r.history||[]).map(h=>`<article class="aom-record"><strong>${e(h.at)} · ${e(h.action)}</strong><p>${e(h.opinion)}</p>${h.proposal?grid([['当次生效日期',h.proposal.effectiveFrom],...proposal(org,{...r,...h.proposal})]):''}</article>`).join('')||'<p class="form-hint">暂无处理记录</p>');
 return U.drawer(deciding?'审批组织变更':withdrawing?'撤回组织申请':'组织变更详情',content+(editing?section('本次处理',`${deciding?field('处理结果',select('decision',[['通过','通过'],['退回','退回修改'],['拒绝','拒绝']], '通过')):''}${field('意见 <span class="req">*</span>','<textarea class="form-control" name="opinion" rows="3"></textarea>')}<p class="form-hint">${deciding?'通过后按生效日期采用新关系；日期已过时从审批当日生效。':'撤回后本次申请不生效。'}</p>`):''),editing?'确认处理':'',({el,form,close})=>{const fresh=O.read();commit(fresh,W.decide(fresh,id,withdrawing?'撤回':form.elements.decision.value,form.elements.opinion.value,withdrawing?'申请人':'组织审核人'),el,close,done);});
}
function records(host,companyId,department){
 const org=O.read(),list=org.requests.filter(r=>(!companyId||r.company===companyId)&&(!department||r.department===department||r.value?.department===department));
 host.innerHTML=`<div class="org-admin-data-card" data-approval-org-requests><div class="table-wrap aom-table aow-records"><table><colgroup><col><col class="aom-person-col"><col class="aom-date-col"><col class="aom-status-col"><col class="aom-account-actions"></colgroup><thead><tr><th>申请内容</th><th>申请人</th><th>生效日期</th><th>状态</th><th>操作</th></tr></thead><tbody>${list.map(r=>`<tr><td><strong>${e(r.type==='appointment'?person(org,r.value.person)+'任职调整':r.type==='owners'?dept(org,r.department)+'负责人调整':r.value.name+'组织调整')}</strong><span class="text-muted">${e(r.id)}</span></td><td>${e(r.applicant||'公司组织管理员')}</td><td>${e(r.effectiveFrom||r.values?.[0]?.start||r.value?.start||'待补充')}</td><td><span class="tag ${W.state(r)==='已生效'?'tag-green':'tag-gray'}">${e(W.state(r))}</span></td><td><div class="table-action"><button data-org-request-view="${e(r.id)}">详情</button><a href="../approval/approvals.html?view=mine&approvalNo=${encodeURIComponent(r.id)}">查看审批</a></div></td></tr>`).join('')||'<tr><td colspan="5" class="ac-empty">暂无组织调整申请</td></tr>'}</tbody></table></div></div>`;
 host.querySelectorAll('[data-org-request-view]').forEach(b=>b.onclick=()=>requestDetail(b.dataset.orgRequestView));
}
function approvalRecords(){const org=O.read();return org.requests.map(r=>{const labels=r.labels?{...org,...r.labels}:org;return ({orgRequest:true,no:r.id,matter:r.type==='appointment'?'员工组织调整':'组织人事',source:'系统设置',scopes:r.status==='待审批'?['todo','mine','overview']:['mine','overview'],status:r.status==='待审批'?'审批中':r.status,applicant:r.applicant||'公司组织管理员',applicantRole:'组织管理',businessTitle:r.type==='appointment'?person(labels,r.value.person)+'任职调整':r.type==='owners'?dept(labels,r.department)+'负责人调整':r.value.name+'组织调整',businessNo:r.id,context:company(r.company),impact:r.type==='appointment'?'调整任职与汇报关系':r.type==='owners'?'调整负责人':'调整组织结构',node:r.status==='待审批'?'组织变更核准':W.state(r),due:'生效日期：'+(r.effectiveFrom||r.values?.[0]?.start||r.value?.start||'待补充'),appliedAt:r.at,risk:'',riskLevel:'normal'});});}
window.OrgWorkflowUI={editor,requestDetail,records,approvalRecords,grid,proposal};
})();
