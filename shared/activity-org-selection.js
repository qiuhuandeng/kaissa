/* Activity sales scope: select stores from the shared topbar organization tree. */
(function(root){'use strict';
const U=root.CaesarCenterUI,M=U.M,H=U.handlers,{esc,btn}=U;
const companies=()=>{
 const result=[];function walk(nodes){for(const n of nodes||[]){if(n.type==='company')result.push(n);else walk(n.children);}}walk(root.caesarOrganizationTree?.()||[]);
 // The existing membership/issuance examples supply only company-store pairs.
 // Reuse those pairs without inventing intermediate reporting lines.
 const ids=['company-yibu','company-shenghe','company-titan'];
 M.companies.forEach((name,i)=>{if(!result.some(c=>c.name===name))result.push({id:ids[i],name,type:'company',demo:true,children:M.stores.map((store,index)=>({id:ids[i]+'-store-'+(index+1),name:store,type:'store'})).filter(s=>U.state.users.some(u=>u.company===name&&u.store===s.name))});});
 return result.sort((a,b)=>{const rank=n=>M.companies.includes(n.name)?M.companies.indexOf(n.name):99;return rank(a)-rank(b);});
};
function storeNodes(node,path=[]){const next=path.concat(node.name);return node.type==='store'?[{id:node.id,name:node.name,path:next.join(' / ')}]:(node.children||[]).flatMap(n=>storeNodes(n,next));}
let picker;
U.activitySalesFields=a=>{const r=M.salesScope(a.salesScope);return `<div class="cx-plan-sales"><div class="cx-plan-org-options">${companies().map(c=>{const n=r.organizationMode==='selected'?r.organizations?.find(x=>x.id===c.id)?.stores.length||0:0;return `<button type="button" data-cx-action="plan-sales-org" data-id="${esc(c.id)}" class="cx-plan-org-button ${n?'selected':''}"><strong>${esc(c.name)}</strong><span>${n?'已选 '+n+' 家':'选择门店'}</span><span aria-hidden="true">›</span></button>`;}).join('')}</div>${!r.organizationMode?`<p class="cx-scroll-note">原销售范围：${esc(M.salesSummary(r))}。选择门店后替换原范围。</p>`:r.organizationMode==='all'?'<p class="cx-scroll-note">未限定组织，适用全部销售门店。</p>':''}</div>`;};
function paintSelection(){
 const layer=document.getElementById('cxLayer');if(!layer?.querySelector('[data-plan-org-tree]'))return;
 layer.querySelectorAll('[data-plan-org-node]').forEach(el=>{const ids=picker.descendants.get(el.dataset.planOrgNode)||[],n=ids.filter(id=>picker.selected.has(id)).length;el.checked=ids.length>0&&n===ids.length;el.indeterminate=n>0&&n<ids.length;});
 const rows=picker.stores.filter(s=>picker.selected.has(s.id));
 layer.querySelector('[data-plan-org-count]').textContent='已选 '+rows.length+' / '+picker.stores.length+' 家门店';
 layer.querySelector('[data-plan-org-selected]').innerHTML=rows.length?rows.map(s=>`<div class="cx-plan-selected-store"><div>${esc(s.name)}<small>${esc(s.path)}</small></div><button type="button" class="cx-link" data-cx-action="plan-org-remove" data-id="${esc(s.id)}" aria-label="移除${esc(s.name)}">移除</button></div>`).join(''):'<p class="cx-empty">尚未选择门店</p>';
}
function paintTree(){
 const q=picker.query.trim().toLowerCase();
 function node(n,path=[]){const trail=path.concat(n.name),children=(n.children||[]).map(x=>node(x,trail)).join(''),ids=picker.descendants.get(n.id)||[];if(!ids.length||n.type==='store'&&!trail.join(' / ').toLowerCase().includes(q)||n.type!=='store'&&!children)return '';
 const row=`<label class="cx-plan-org-node"><input type="checkbox" data-plan-org-node="${esc(n.id)}" aria-label="${esc(n.name)}"><span>${esc(n.name)}</span>${n.type==='store'?'':`<small>${ids.length}家</small>`}</label>`;
 return n.type==='store'?`<div class="cx-plan-org-leaf">${row}</div>`:`<details open class="cx-plan-org-branch"><summary><span class="cx-plan-org-caret" aria-hidden="true">›</span>${row}</summary><div>${children}</div></details>`;
 }
 document.querySelector('[data-plan-org-tree]').innerHTML=node(picker.company)||'<p class="cx-empty">未找到匹配的组织或门店</p>';paintSelection();
}
H['plan-sales-org']=id=>{
 U.readWizard();const company=companies().find(c=>c.id===id);U.require(company,'未找到销售组织');const r=M.salesScope(U.wizard.salesScope),stores=storeNodes(company),saved=r.organizations?.find(c=>c.id===id);
 picker={company,stores,query:'',selected:new Set(r.organizationMode==='all'?stores.map(s=>s.id):saved?saved.stores.map(s=>s.id):stores.filter(s=>r.stores.includes(s.name)).map(s=>s.id)),descendants:new Map()};
 function index(n){picker.descendants.set(n.id,storeNodes(n).map(s=>s.id));(n.children||[]).forEach(index);}index(company);
 U.layer(company.name+' · 选择销售门店',`<div class="cx-plan-org-toolbar"><input type="search" data-plan-org-search placeholder="搜索组织或门店" aria-label="搜索组织或门店">${btn('plan-org-all','全选')}${btn('plan-org-clear','清空')}<span data-plan-org-count></span></div><div class="cx-plan-org-picker"><div class="cx-plan-org-tree" data-plan-org-tree></div><section><h3>已选门店</h3><div data-plan-org-selected></div></section></div>${company.demo?'<p class="cx-scroll-note">原型演示数据，组织及门店归属待业务确认。</p>':''}`,btn('plan-org-save','确定','',true),{center:true,wide:true}).classList.add('cx-plan-selection-modal','cx-plan-store-modal');
 paintTree();
};
H['plan-org-all']=()=>{picker.selected=new Set(picker.stores.map(s=>s.id));paintSelection();};
H['plan-org-clear']=()=>{picker.selected.clear();paintSelection();};
H['plan-org-remove']=id=>{picker.selected.delete(id);paintSelection();};
H['plan-org-save']=()=>{
 const r=M.salesScope(U.wizard.salesScope),selected=picker.stores.filter(s=>picker.selected.has(s.id));
 const organizations=(r.organizationMode==='selected'?r.organizations:[]).filter(c=>c.id!==picker.company.id);
 if(selected.length)organizations.push({id:picker.company.id,name:picker.company.name,stores:M.clone(selected)});
 U.wizard.salesScope=M.salesScope({organizationMode:organizations.length?'selected':'all',organizations});U.dirty=true;U.close();U.render();U.toast('销售范围已更新');
};
document.addEventListener('change',e=>{if(U.page!=='activity-edit')return;const el=e.target;
 if(el.dataset.planOrgNode){for(const id of picker.descendants.get(el.dataset.planOrgNode)||[])el.checked?picker.selected.add(id):picker.selected.delete(id);paintSelection();}
});
document.addEventListener('input',e=>{if(e.target.hasAttribute('data-plan-org-search')){picker.query=e.target.value;paintTree();}});
})(window);
