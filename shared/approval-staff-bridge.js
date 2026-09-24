/* Render the merchant's employment list from the same records maintained by admin. */
(function(){
'use strict';
const O=window.ApprovalOrgData,org=O.read(),body=document.querySelector('.merchant-staff-table tbody');if(!body)return;
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const priority=['sun','zhou','chenhong'];
const rows=O.appointmentsAt(org).filter(a=>a.company==='fj'&&O.effective(a,O.today())).sort((a,b)=>(priority.includes(a.person)?priority.indexOf(a.person):99)-(priority.includes(b.person)?priority.indexOf(b.person):99));
body.innerHTML=rows.map(a=>{const p=org.people.find(p=>p.id===a.person),d=org.departments.find(d=>d.id===a.department);if(!p||!d)return '';const role=p.businessRoles?.join('、')||'未分配',path=O.departmentPath(org,d.id),store=d.name.includes('门店')?d.name:'未绑定门店';return `<tr data-person-id="${p.id}" data-job-id="${a.id}" data-employee="${e(p.name)}" data-org="福建凯撒 / ${e(path)}" data-store="${e(store)}" data-position="${e(a.position||role)}" data-role="${e(role)}" data-scope="${e(d.name)}" data-modules="按业务角色授权" data-business-impact="按当前有效任职和业务授权办理"><td><strong>${e(p.name)}</strong><span class="text-muted">${e(p.code)}${p.phone?' · '+e(p.phone):''}</span></td><td><strong>${e(d.name)}</strong><span class="text-muted">${a.primary?'主任职':'兼任'} · ${e(path)}</span></td><td>${e(role)}</td><td>${e(d.name)}</td><td><span class="tag ${p.active?'tag-green':'tag-gray'}">${p.active?'启用':'停用'}</span></td><td><div class="table-action">${p.active?'<button class="table-action-primary" type="button" data-open-staff-adjust>任职调整</button><button type="button" data-open-role-auth>授权</button>':''}<button type="button" data-open-staff-view>详情</button></div></td></tr>`;}).join('');
const pagination=document.querySelector('.merchant-staff-table + .pagination');if(pagination)pagination.textContent='共 '+rows.length+' 项本公司有效任职';
})();
