(function(){
'use strict';
const O=window.ApprovalOrgData,W=window.ApprovalOrgWorkflow,V=window.OrgWorkflowUI,U=window.OrgAdminUI,e=U.e,tree=document.querySelector('[data-org-tree]');
if(!tree)return;let selected='company-fj';
const actions=document.querySelector('[data-org-actions]');
function nodeHTML(n){const key=n.id||'company-'+n.company,ds={approvalOrgId:n.id||'',nodeCompany:n.company,nodeName:n.name,nodeType:n.type,nodeLabel:n.label,nodePath:n.path,nodeOwner:n.owner,nodeStatus:n.status,nodeSubject:n.subject,nodeCenter:n.center,nodeScope:n.scope};
 const el=document.createElement('div');el.className='org-admin-tree-node is-open';el.dataset.orgKey=key;Object.assign(el.dataset,ds);el.innerHTML=`<div class="org-admin-tree-row ${key===selected?'active':''}" data-node-row><button class="org-admin-tree-toggle ${n.children?.length?'':'placeholder'}" aria-label="展开或收起" ${n.children?.length?'':'disabled'}></button><button class="org-admin-tree-name" type="button">${e(n.name)}</button><button type="button" class="org-node-more" data-org-more aria-label="更多操作" aria-haspopup="menu">⋯</button></div><div class="org-admin-tree-children"></div>`;const children=el.querySelector('.org-admin-tree-children');(n.children||[]).forEach(c=>children.append(nodeHTML(c)));return el;}
function render(){closeMenu();const org=O.read();const group=document.createElement('div');group.className='org-admin-tree-node is-open';group.innerHTML='<div class="aow-tree-label">凯撒旅游集团</div><div class="org-admin-tree-children"><div class="aow-tree-label">旅游板块</div><div data-company-tree></div></div>';group.querySelector('[data-company-tree]').append(...O.companies.map(c=>nodeHTML(W.companyTree(org,c.id))));tree.replaceChildren(group);if(!tree.querySelector('.org-admin-tree-row.active')){selected='company-fj';tree.querySelector('[data-org-key="company-fj"] .org-admin-tree-row').classList.add('active');}apply();}
function apply(){
 const node=tree.querySelector('.org-admin-tree-row.active').closest('.org-admin-tree-node'),n=node.dataset,org=O.read(),d=org.departments.find(d=>d.id===n.approvalOrgId),c=O.companies.find(c=>c.id===n.nodeCompany);
 document.querySelector('[data-member-heading]').textContent=n.nodeName+' · 员工列表';
 actions.replaceChildren();
 const head=document.querySelector('[data-org-primary-action]');head.textContent='+';head.disabled=!!d&&(!d.active||d.type==='store');head.onclick=()=>V.editor({direct:true,company:c.id,parent:d?.id||''});
 window.AdminOrgMembers?.render();
}
let menu=null;
function closeMenu(){menu?.remove();menu=null;}
function saved(org){const errors=O.save(org);if(errors.length){U.toast(errors.join('；'));return false;}document.dispatchEvent(new CustomEvent('organization-updated'));return true;}
function nodeMenu(button,node){
 closeMenu();const org=O.read(),id=node.dataset.approvalOrgId,c=node.dataset.nodeCompany,d=org.departments.find(x=>x.id===id),siblings=org.departments.filter(x=>x.company===c&&x.parent===d?.parent),index=siblings.findIndex(x=>x.id===id);
 menu=document.createElement('div');menu.className='ac-menu org-node-menu';menu.setAttribute('role','menu');
 const items=[['add','添加子部门',!!d&&(!d.active||d.type==='store')],['rename','修改名称',!d],['owners','设置负责人',!d||!d.active],['delete','删除',!d],['up','上移',!d||index===0],['down','下移',!d||index===siblings.length-1]];
 menu.innerHTML=items.map(([key,label,disabled])=>`<button role="menuitem" data-org-action="${key}" ${key==='add'?'data-drawer-title="新建部门"':''} ${disabled?'disabled':''}>${label}</button>`).join('')+`<div class="org-node-id">部门ID：${e(id||c)}</div>`;
 document.body.append(menu);const r=button.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(r.left,innerWidth-176))+'px';menu.style.top=Math.max(8,Math.min(r.bottom+4,innerHeight-menu.offsetHeight-8))+'px';
 menu.addEventListener('click',ev=>{const b=ev.target.closest('[data-org-action]');if(!b||b.disabled)return;const action=b.dataset.orgAction;closeMenu();
  if(action==='add')return V.editor({direct:true,company:c,parent:id||''});
  if(action==='owners')return V.editor({direct:true,company:c,department:id,kind:'owners'});
  if(action==='rename')return U.drawer('修改名称',U.field('部门名称 <span class="req">*</span>',U.input('name',d.name)),'保存',({el,form,close})=>{const fresh=O.read(),current=fresh.departments.find(x=>x.id===id);if(!current||current.name!==d.name)return U.errors(el,['部门信息已变化，请重新打开']);if(!U.errors(el,W.saveDepartment(fresh,{...current,name:form.elements.name.value},O.today(),'修改部门名称')))return;if(!U.errors(el,O.save(fresh)))return;close();render();});
  if(action==='delete')return U.drawer('删除部门',`<p>确认删除“${e(d.name)}”？</p>`,'确认删除',({el,close})=>{const fresh=O.read();const inJob=fresh.appointments.some(a=>[a,a.initial,...a.revisions||[]].some(v=>v?.department===id)),inRequest=fresh.requests.some(r=>r.department===id||r.value?.department===id||r.value?.parent===id),current=fresh.departments.find(x=>x.id===id);let config;try{config=JSON.parse(sessionStorage.getItem('caesar-approval-configuration-v1')||'null');}catch(_){return U.errors(el,['审批配置无法读取，暂不能删除']);}const inTemplate=config?.templates?.some(t=>[t.draft,t.published,...(t.versions||[]).map(v=>v.template)].some(t=>t?.departments?.includes(id)));
   if(!current)return U.errors(el,['部门已不存在，请刷新']);
   if(fresh.departments.some(x=>[x,x.initial,...x.revisions||[]].some(v=>v?.parent===id))||inJob||inRequest||inTemplate||(current.owners||[]).length)return U.errors(el,['部门存在下级、任职、负责人或业务引用，不能删除']);
   fresh.deletedDepartments=[...(fresh.deletedDepartments||[]),{...current,deletedAt:O.today()}];fresh.departments=fresh.departments.filter(x=>x.id!==id);if(!U.errors(el,O.save(fresh)))return;selected=current.parent||'company-'+c;close();render();});
  if(action==='up'||action==='down'){const fresh=O.read(),peers=fresh.departments.filter(x=>x.company===c&&x.parent===d.parent),at=peers.findIndex(x=>x.id===id),other=peers[at+(action==='up'?-1:1)];if(!other)return;const a=fresh.departments.findIndex(x=>x.id===id),b=fresh.departments.findIndex(x=>x.id===other.id);[fresh.departments[a],fresh.departments[b]]=[fresh.departments[b],fresh.departments[a]];saved(fresh);}
 });
}
document.addEventListener('click',ev=>{if(menu&&!menu.contains(ev.target)&&!ev.target.closest('[data-org-more]'))closeMenu();});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeMenu();});
window.addEventListener('resize',closeMenu);tree.addEventListener('scroll',closeMenu);
tree.addEventListener('click',ev=>{const node=ev.target.closest('.org-admin-tree-node');if(!node)return;if(ev.target.closest('.org-admin-tree-toggle')){node.classList.toggle('is-open');return;}if(ev.target.closest('.org-admin-tree-name')||ev.target.closest('[data-org-more]')){selected=node.dataset.orgKey;tree.querySelectorAll('.org-admin-tree-row').forEach(r=>r.classList.remove('active'));node.querySelector('.org-admin-tree-row').classList.add('active');apply();if(ev.target.closest('[data-org-more]'))nodeMenu(ev.target.closest('[data-org-more]'),node);else closeMenu();}});
document.addEventListener('organization-updated',render);render();
})();
