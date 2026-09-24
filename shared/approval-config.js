(function () {
  'use strict';
  const M=window.ApprovalConfigModel, KEY='caesar-approval-configuration-v1';
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  let state,storageError='';
  try{const raw=sessionStorage.getItem(KEY);state=raw?JSON.parse(raw):M.createState();if(state.schema!==1||!Array.isArray(state.templates)||!Array.isArray(state.arrangements))throw Error('invalid');}
  catch(_){state=M.createState();storageError='无法读取本次配置，请检查浏览器是否允许保存会话数据。';}
  function refreshOrganization(){state.org=M.orgData.read();state.people=M.clone(state.org.people);}
  refreshOrganization();
  function persist(next=state){try{sessionStorage.setItem(KEY,JSON.stringify(next));state=next;storageError='';return true;}catch(_){toast('浏览器未能保存，请保留当前页面并检查存储设置。');return false;}}
  function toast(message){document.querySelector('.ac-toast')?.remove();const el=document.createElement('div');el.className='ac-toast';el.setAttribute('role','status');el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),4000);}
  const options=(items,current)=>items.map(x=>{const [v,t]=Array.isArray(x)?x:[x,x];return `<option value="${e(v)}" ${String(current)===String(v)?'selected':''}>${e(t)}</option>`;}).join('');
  const button=(text,action,extra='',primary=false)=>`<button type="button" class="btn ${primary?'btn-primary':'btn-secondary'}" data-ac="${action}" ${extra}>${text}</button>`;
  const link=(text,action,extra='')=>`<button type="button" class="ac-link" data-ac="${action}" ${extra}>${text}</button>`;
  const field=(label,control,extra='')=>`<label class="form-group ${extra}"><span class="form-label">${label}</span>${control}</label>`;
  const select=(name,items,value,extra='')=>`<select class="form-control" name="${name}" ${extra}>${options(items,value)}</select>`;
  const input=(name,value,extra='')=>`<input class="form-control" name="${name}" value="${e(value)}" ${extra}>`;
  const drawerSection=(title,body)=>`<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">${title}</h3></div>${body}</section>`;
  const check=(name,label,value,extra='')=>`<label class="ac-check"><input type="checkbox" name="${name}" ${value?'checked':''} ${extra}>${label}</label>`;
  const errorsHTML=errors=>errors.length?`<div class="ac-error" role="alert"><ul>${errors.map(x=>`<li>${e(x)}</li>`).join('')}</ul></div>`:'';
  function showErrors(host,errors){host.innerHTML=errorsHTML(errors);if(errors.length)host.scrollIntoView?.({block:'nearest'});}
  let layers=[];
  function closeLayer(layer,force=false){
    if(layer.dirty&&!force){confirmAction('放弃未保存的修改？','当前抽屉的修改尚未保存。',()=>closeLayer(layer,true));return;}
    layer.el.classList.remove('show');layer.el.classList.add('closing');layers=layers.filter(x=>x!==layer);setTimeout(()=>layer.el.remove(),240);layer.trigger?.focus();
  }
  function makeLayer(title,body,footer,confirm=false,layout='drawer-edit drawer-md'){
    const el=document.createElement('div');el.className='modal-overlay ac-layer '+(confirm?'':'drawer-overlay ')+'show';el.dataset.static='true';
    el.innerHTML=`<section class="modal ${confirm?'modal-sm modal-confirm':'drawer-modal ac-drawer '+layout}" role="dialog" aria-modal="true" aria-label="${e(title)}"><div class="modal-header"><h2 class="modal-title">${e(title)}</h2><button class="modal-close" type="button" aria-label="关闭" data-ac-close>×</button></div><div class="modal-body">${body}<div data-errors></div></div><div class="modal-footer">${confirm?footer:'<div class="drawer-footer-actions">'+footer+'</div>'}</div></section>`;
    el.querySelectorAll('textarea').forEach(x=>x.classList.add('form-control'));
    document.body.appendChild(el);const layer={el,dirty:false,trigger:document.activeElement};layers.push(layer);
    // Keep the unsaved-change check ahead of the shared modal-close handler.
    el.addEventListener('click',ev=>{if(ev.target.closest('[data-ac-close]')||ev.target===el){ev.preventDefault();ev.stopPropagation();closeLayer(layer);}},true);
    el.querySelector('input,select,textarea,button')?.focus();return layer;
  }
  function confirmAction(title,message,callback){const l=makeLayer(title,`<p>${e(message)}</p>`,`<button class="btn btn-secondary" data-ac-close>取消</button><button class="btn btn-primary" data-ac-confirm>确认</button>`,true);l.el.querySelector('[data-ac-confirm]').onclick=()=>{closeLayer(l,true);callback();};}
  document.addEventListener('keydown',ev=>{
    const l=layers.at(-1);if(!l)return;
    if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();closeLayer(l);}
    if(ev.key==='Tab'){const all=[...l.el.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&!x.closest('[hidden]'));if(!all.length)return;const first=all[0],last=all.at(-1);if(ev.shiftKey&&document.activeElement===first){last.focus();ev.preventDefault();}else if(!ev.shiftKey&&document.activeElement===last){first.focus();ev.preventDefault();}}
  },true);
  function menu(anchor,items,callback){
    document.querySelector('.ac-menu')?.remove();const el=document.createElement('div');el.className='ac-menu';el.setAttribute('role','menu');el.innerHTML=items.map(([v,t])=>`<button type="button" class="dropdown-item ${['delete','disable','discard'].includes(v)?'danger':''}" role="menuitem" data-menu-action="${v}">${t}</button>`).join('');document.body.appendChild(el);
    const r=anchor.getBoundingClientRect();el.style.left=Math.max(8,Math.min(r.left,window.innerWidth-160))+'px';el.style.top=(r.bottom+el.offsetHeight>window.innerHeight?Math.max(8,r.top-el.offsetHeight):r.bottom+4)+'px';
    const dismiss=ev=>{if(!el.contains(ev.target)&&ev.target!==anchor)cleanup();};const key=ev=>{if(ev.key==='Escape'){cleanup();anchor.focus();}};const cleanup=()=>{el.remove();document.removeEventListener('click',dismiss,true);document.removeEventListener('keydown',key);window.removeEventListener('scroll',cleanup,true);};
    document.addEventListener('click',dismiss,true);document.addEventListener('keydown',key);window.addEventListener('scroll',cleanup,true);el.onclick=ev=>{const b=ev.target.closest('[data-menu-action]');if(b){cleanup();callback(b.dataset.menuAction);}};el.querySelector('button')?.focus();
  }
  const names=ids=>ids.map(id=>M.personName(state,id)).join('、');
  const display=r=>r.draft||r.published;
  const status=r=>r.disabled?'已停用':r.published?'已发布':'草稿';
  const statusTag=r=>`<span class="tag ${r.disabled?'tag-gray':r.published?'tag-green':'tag-orange'}">${status(r)}</span>`;
  function scopeText(t){return t.companies.map(M.companyName).join('、')||'未选择公司';}
  function summary(t){return t.nodes.map(n=>n.type==='branch'?'条件分支':n.title).join(' → ')||'待配置审批节点';}
  function editorUrl(id,mode='edit',version=''){return 'approval-template-edit.html?'+new URLSearchParams({id,mode,...(version?{version}: {})});}
  function mountConfig(host){
    host.className='ac-config list-surface';let tab=new URLSearchParams(location.search).get('tab')==='people'?'people':'templates';let page=1,filters={q:'',scene:'',company:'',status:''};
    try{const saved=JSON.parse(sessionStorage.getItem(KEY+'-filters')||'null');if(saved&&!new URLSearchParams(location.search).has('tab')){filters=saved.filters;page=saved.page;tab=saved.tab;}}catch(_){}
    function remember(){try{sessionStorage.setItem(KEY+'-filters',JSON.stringify({filters,page,tab}));}catch(_) {}}
    function rows(){return state.templates.filter(r=>{const t=display(r);return (!filters.q||t.name.includes(filters.q))&&(!filters.scene||t.scene===filters.scene)&&(!filters.company||t.companies.includes(filters.company))&&(!filters.status||status(r)===filters.status);});}
    function render(){
      const list=tab==='templates'?rows():state.arrangements.filter(a=>(!filters.company||a.company===filters.company)&&(!filters.q||[a.duty,names(a.members)].some(s=>s.includes(filters.q))));
      const size=10;page=Math.max(1,Math.min(page,Math.ceil(list.length/size)||1));const visible=list.slice((page-1)*size,page*size);
      const cols=tab==='templates'?['auto','180px','320px','96px','164px']:['200px','160px','auto','300px','164px'];
      host.innerHTML=`<div class="list-surface-tabs list-function-tabs ac-tabs" role="tablist" aria-label="审批配置"><button class="tab-item ${tab==='templates'?'active':''}" role="tab" aria-selected="${tab==='templates'}" data-ac="tab" data-tab="templates"><span class="list-tab-label">审批模板</span></button><button class="tab-item ${tab==='people'?'active':''}" role="tab" aria-selected="${tab==='people'}" data-ac="tab" data-tab="people"><span class="list-tab-label">审批人员</span></button></div>
      <form class="filter-card filter-card-compact list-surface-filter" data-ac-search data-list-filter-enhanced="true" aria-label="审批配置筛选"><div class="list-surface-filter-layout"><div class="list-surface-filter-fields"><label class="filter-item filter-item-search"><span class="sr-only">${tab==='templates'?'模板名称':'审批职责或人员'}</span><input type="search" name="q" value="${e(filters.q)}" placeholder="${tab==='templates'?'模板名称':'审批职责或人员'}"></label>
      ${tab==='templates'?`<label class="filter-item filter-item-sm"><span class="sr-only">业务场景</span>${select('scene',[['','全部业务场景'],...M.scenes.map(s=>s.name)],filters.scene)}</label>`:''}
      <label class="filter-item filter-item-sm"><span class="sr-only">适用公司</span>${select('company',[['','全部公司'],...M.companies.map(c=>[c.id,c.short])],filters.company)}</label>
      ${tab==='templates'?`<label class="filter-item filter-item-status"><span class="sr-only">模板状态</span>${select('status',[['','全部状态'],'草稿','已发布','已停用'],filters.status)}</label>`:''}
      <div class="filter-actions"><button class="btn btn-secondary btn-filter-search" type="submit">搜索</button>${button('重置','reset')}</div></div><div class="filter-actions list-surface-filter-actions list-filter-pinned-actions">${tab==='templates'?'<a class="btn btn-primary" href="approval-template-edit.html">新建模板</a>':button('安排人员','person-new','',true)}</div></div></form>
      ${storageError?errorsHTML([storageError]):''}<section class="table-wrap list-surface-table list-table-with-pagination business-optimized-table ac-table-wrap ${tab==='templates'?'ac-template-list':''}" aria-label="${tab==='templates'?'审批模板列表':'审批人员列表'}"><table class="ac-table"><colgroup>${cols.map(width=>`<col style="--ac-col-width:${width}" class="${width==='auto'?'ac-flex-col':'ac-fixed-col'}">`).join('')}</colgroup><thead><tr>${(tab==='templates'?['模板名称','业务场景','适用公司','状态','操作']:['公司','审批职责','审批人员','临时代办','操作']).map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${visible.length?visible.map(tab==='templates'?templateRow:personRow).join(''):`<tr><td class="ac-empty" colspan="${cols.length}">暂无匹配记录</td></tr>`}</tbody></table></section>
      <div class="pagination list-surface-pagination list-pagination-attached ac-pagination"><span>第 ${list.length?(page-1)*size+1:0}—${Math.min(page*size,list.length)} 条 / 共 ${list.length} 条</span><div class="pager">${button('上一页','prev',page===1?'disabled':'')}<span>${page} / ${Math.ceil(list.length/size)||1}</span>${button('下一页','next',page*size>=list.length?'disabled':'')}</div></div>`;
      host.querySelectorAll('.ac-table tr').forEach(row=>[...row.cells].forEach((cell,i)=>{if(cell.colSpan>1)return;cell.classList.add(cols[i]==='auto'?'ac-flex-col':'ac-fixed-col');cell.style.setProperty('--ac-col-width',cols[i]);}));
      host.querySelectorAll('td:last-child .ac-actions').forEach(actions=>{actions.className='table-action';actions.querySelectorAll('.ac-link').forEach(x=>x.classList.remove('ac-link'));actions.firstElementChild?.classList.add('table-action-primary');});
      host.querySelectorAll('td .ac-muted').forEach(x=>{x.classList.remove('ac-muted');x.classList.add('table-cell-sub');});remember();
    }
    function templateRow(r){const t=display(r),published=r.published&&!r.disabled;return `<tr data-template-id="${e(r.id)}"><td><strong title="${e(t.name)}">${e(t.name)}</strong></td><td><span class="ac-text" title="${e(t.scene)}">${e(t.scene)}</span></td><td><span class="ac-text" title="${e(scopeText(t))}">${e(scopeText(t))}</span></td><td>${statusTag(r)}</td><td><div class="ac-actions">${r.published?`<a class="ac-link" href="${editorUrl(r.id,'view')}">查看</a>`:''}<a class="ac-link" href="${editorUrl(r.id)}">${published?'修改':'编辑'}</a>${link('更多','template-more',`data-id="${e(r.id)}"`)}</div></td></tr>`;}
    function personRow(a){const ds=state.delegations.filter(d=>d.company===a.company&&a.members.includes(d.original)&&d.end>=today());return `<tr data-arrangement-id="${e(a.id)}"><td>${e(M.companyName(a.company))}</td><td>${e(a.duty)}</td><td>${e(names(a.members))}</td><td>${ds.length?ds.slice(0,1).map(d=>`<span class="ac-text">${e(names([d.original]))} → ${e(names([d.delegate]))}</span><span class="ac-muted">${e(d.start)} 至 ${e(d.end)}</span>`).join('')+(ds.length>1?`<span class="ac-muted">另 ${ds.length-1} 项代办</span>`:''):'—'}</td><td><div class="ac-actions">${link('修改','person-edit',`data-id="${e(a.id)}"`)}${link('设置代办','delegate',`data-id="${e(a.id)}"`)}</div></td></tr>`;}
    host.addEventListener('submit',ev=>{if(!ev.target.matches('[data-ac-search]'))return;ev.preventDefault();const f=new FormData(ev.target);filters={q:f.get('q').trim(),scene:f.get('scene')||'',company:f.get('company')||'',status:f.get('status')||''};page=1;render();});
    host.addEventListener('click',ev=>{const b=ev.target.closest('[data-ac]');if(!b)return;const a=b.dataset.ac;
      if(a==='tab'){tab=b.dataset.tab;filters={q:'',scene:'',company:'',status:''};page=1;render();}
      if(a==='reset'){filters={q:'',scene:'',company:'',status:''};page=1;render();}
      if(a==='prev'||a==='next'){page+=a==='next'?1:-1;render();}
      if(a==='person-new'||a==='person-edit')arrangementDrawer(state.arrangements.find(x=>x.id===b.dataset.id),render);
      if(a==='delegate')delegationDrawer(state.arrangements.find(x=>x.id===b.dataset.id),render);
      if(a==='template-more'){
        const r=state.templates.find(x=>x.id===b.dataset.id),items=[['copy','复制模板']];
        if(r.versions.length)items.push(['versions','版本记录']);
        if(r.published&&!r.disabled)items.push(['disable','停用模板']);
        if(r.draft&&r.published)items.push(['discard','丢弃修订草稿']);
        if(!r.published)items.push(['delete','删除草稿']);
        menu(b,items,action=>{
          if(action==='copy'){const draft=M.clone(display(r));draft.name+='（副本）';draft.companies=[];draft.departments=[];draft.departmentMode='all';draft.rules={...M.rulesFor(draft),emptyMembers:{},departedMembers:{}};M.walk(draft.nodes,n=>{if(n.source==='member')n.members=[];});const next=M.clone(state),copy=M.saveDraft(next,'',draft);if(persist(next))location.href=editorUrl(copy.id);}
          if(action==='versions')versionsDrawer(r);
          if(['disable','discard','delete'].includes(action))confirmAction({disable:'停用审批模板？',discard:'丢弃修订草稿？',delete:'删除审批草稿？'}[action],{disable:'停用后不再供新申请使用，在途申请保留原审批流程。',discard:'已发布版本不变，尚未发布的修改将被清除。',delete:'此草稿尚未发布，删除后无法恢复。'}[action],()=>{const next=M.clone(state),rec=next.templates.find(x=>x.id===r.id);if(action==='disable')rec.disabled=true;if(action==='discard')rec.draft=null;if(action==='delete')next.templates=next.templates.filter(x=>x.id!==r.id);if(persist(next)){render();toast('操作已保存');}});
        });
      }
    });render();
  }
  function versionsDrawer(r){makeLayer('版本记录',drawerSection('发布记录',r.versions.slice().reverse().map(v=>`<div class="ac-version"><div><strong>V${v.number}</strong><span class="ac-muted">${e(v.at)} · ${e(v.by)}</span><span class="ac-muted">${e(scopeText(v.template))}</span></div><a class="ac-link" href="${editorUrl(r.id,'view',v.number)}">查看版本</a></div>`).join('')),'<button class="btn btn-secondary" data-ac-close>关闭</button>',false,'drawer-preview drawer-md');}
  function arrangementDrawer(original,onSave){
    refreshOrganization();
    const a=M.clone(original||{id:'',company:'fj',duty:'财务审核',members:[]});
    const l=makeLayer(original?'修改审批人员':'安排审批人员',`<form>${drawerSection('公司与职责',`<div class="form-grid ac-form ac-form-two">${field('公司 <span class="req">*</span>',select('company',M.companies.map(c=>[c.id,c.name]),a.company,original?'disabled':''))}${field('审批职责 <span class="req">*</span>',select('duty',M.duties,a.duty,original?'disabled':''))}</div>`)}${drawerSection('审批人员',`<div data-people></div><div class="ac-drawer-related"><a class="ac-link" href="employees.html">查看员工任职</a></div>`)}</form>`,'<button class="btn btn-secondary" data-ac-close>取消</button><button class="btn btn-primary" data-save>保存</button>');
    function renderPeople(){l.el.querySelector('[data-people]').innerHTML=`<div class="ac-person-list ac-person-grid">${state.people.filter(p=>M.eligible(state,p.id,a.company)).map(p=>check('members',e(p.name),a.members.includes(p.id),`value="${p.id}"`)).join('')}</div>`;}
    renderPeople();l.el.addEventListener('change',ev=>{l.dirty=true;if(ev.target.name==='company'){a.company=ev.target.value;a.members=[];renderPeople();}});
    l.el.querySelector('[data-save]').onclick=()=>{a.company=l.el.querySelector('[name=company]').value;a.duty=l.el.querySelector('[name=duty]').value;a.members=[...l.el.querySelectorAll('[name=members]:checked')].map(x=>x.value);const next=M.clone(state),errors=M.saveArrangement(next,a);showErrors(l.el.querySelector('[data-errors]'),errors);if(!errors.length&&persist(next)){closeLayer(l,true);onSave();toast('审批人员已保存');}};
  }
  function delegationDrawer(a,onSave){
    refreshOrganization();
    const existing=state.delegations.filter(d=>d.company===a.company&&a.members.includes(d.original));
    const l=makeLayer('设置代办',`<form>${drawerSection('代办人员',`<div class="form-grid ac-form ac-form-two">${field('原审批人 <span class="req">*</span>',select('original',a.members.map(id=>[id,M.personName(state,id)]),a.members[0]))}${field('代办人 <span class="req">*</span>',select('delegate',[['','请选择'],...state.people.filter(p=>M.eligible(state,p.id,a.company)).map(p=>[p.id,p.name])],''))}</div>`)}${drawerSection('生效范围',`<div class="form-grid ac-form ac-form-two">${field('生效日期 <span class="req">*</span>',input('start',today(),'type="date"'))}${field('结束日期 <span class="req">*</span>',input('end',today(),'type="date"'))}${field('适用事项',select('scene',[['','本公司全部获准事项'],...M.scenes.map(s=>s.name)],''),'ac-wide')}${field('代办原因 <span class="req">*</span>','<textarea name="reason" placeholder="例如：休假期间代办付款审批"></textarea>','ac-wide')}</div><p class="form-hint">仅用于生效期间后续到达的任务，权限范围不扩大。</p>`)}</form>${existing.length?drawerSection('代办记录',existing.map(d=>`<div class="ac-delegation"><div><span>${e(names([d.original]))} → ${e(names([d.delegate]))}</span><span class="ac-muted">${e(d.scenes.join('、')||'全部获准事项')}</span><span class="ac-muted">${e(d.start)} 至 ${e(d.end)} · ${d.end<today()?'已结束':d.start>today()?'未开始':'生效中'}</span></div>${d.end>=today()?link('取消代办','delegate-remove',`data-id="${d.id}"`):''}</div>`).join('')):''}`,'<button class="btn btn-secondary" data-ac-close>取消</button><button class="btn btn-primary" data-save>保存代办</button>',false,'drawer-edit drawer-lg');
    l.el.addEventListener('input',()=>l.dirty=true);l.el.addEventListener('change',()=>l.dirty=true);
    l.el.querySelector('[data-save]').onclick=()=>{const f=new FormData(l.el.querySelector('form'));const next=M.clone(state),errors=M.saveDelegation(next,{id:'',company:a.company,original:f.get('original'),delegate:f.get('delegate'),start:f.get('start'),end:f.get('end'),scenes:f.get('scene')?[f.get('scene')]:[],reason:f.get('reason')});showErrors(l.el.querySelector('[data-errors]'),errors);if(!errors.length&&persist(next)){closeLayer(l,true);onSave();toast('代办安排已保存');}};
    l.el.addEventListener('click',ev=>{const b=ev.target.closest('[data-ac=delegate-remove]');if(b)confirmAction('取消代办？','取消后停止分派新的代办任务。',()=>{const next=M.clone(state);next.delegations=next.delegations.filter(d=>d.id!==b.dataset.id);if(persist(next)){closeLayer(l,true);onSave();toast('代办已取消');}});});
  }
  function mountEditor(host){
    const params=new URLSearchParams(location.search);let id=params.get('id')||M.uid(),record=state.templates.find(x=>x.id===id),readonly=params.get('mode')==='view',step=2,dirty=false;
    if(params.get('id')&&!record){host.innerHTML='<div class="ac-heading"><h1>审批模板不存在</h1><a class="btn btn-secondary" href="approval-config.html">返回</a></div>';return;}
    const historical=params.get('version')?record?.versions.find(v=>String(v.number)===params.get('version')):null;
    if(params.has('version')&&!historical){host.innerHTML='<div class="ac-heading"><h1>未找到此版本</h1><a class="btn btn-secondary" href="approval-config.html">返回</a></div>';return;}
    let t=M.clone(historical?.template||(readonly?record?.published:record?.draft||record?.published)||M.sample('付款申请'));
    t.rules=M.rulesFor(t);
    if(!record){t.name='';t.companies=[];}
    let version=historical?.number||record?.versions.at(-1)?.number;
    t.departmentMode=t.departmentMode||(t.departments.length?'selected':'all');
    if(!readonly&&!t.content)t.content=M.defaultContent(t.scene);
    if(!readonly){const chosen=new Set(t.content.groups.flatMap(g=>g.fields));M.contentCatalog(t.scene).filter(f=>f.required&&!chosen.has(f.id)).forEach(f=>{let group=t.content.groups.find(g=>g.name===f.group);if(!group){group={id:M.uid(),name:f.group,fields:[]};t.content.groups.push(group);}group.fields.push(f.id);});}
    function render(){
      host.classList.toggle('ac-readonly',readonly);
      host.innerHTML=`<header class="ac-heading page-workbar"><div class="ac-title"><button class="ac-link" data-ac="back">‹ 返回</button><h1>${readonly?'审批模板详情':record?'编辑审批模板':'新建审批模板'}</h1>${record?statusTag(record):'<span class="tag tag-gray">未保存</span>'}${version?`<span class="ac-muted">V${version}${!readonly&&record?.draft?' · 修订草稿':''}</span>`:''}</div><div class="ac-actions">${!readonly?button('保存草稿','save')+button('发布','publish','',true):''}</div></header>
      <div class="ac-editor-workspace"><nav class="ac-steps list-surface-tabs list-function-tabs" role="tablist" aria-label="审批模板配置">${[[2,'审批流程'],[1,'审批内容'],[3,'审批规则']].map(([i,s])=>`<button type="button" id="acTab${i}" class="tab-item ${i===step?'active':''}" role="tab" aria-selected="${i===step}" aria-controls="acEditorPanel" data-ac="step" data-step="${i}"><span class="list-tab-label">${s}</span></button>`).join('')}</nav>
      <div class="ac-track" id="acEditorPanel" role="tabpanel" aria-labelledby="acTab${step}"><div id="acEditorErrors">${storageError?errorsHTML([storageError]):''}</div>${step===2?`<section class="ac-flow">${flowForm()}</section>`:`<section class="ac-card ac-editor-form">${[scopeForm,contentForm,flowForm,rulesForm][step]()}</section>`}</div></div>`;
      if(readonly)host.querySelectorAll('[data-field], [data-company], [data-department], [data-rule], [data-replacement]').forEach(x=>x.disabled=true);
    }
    function scopeForm(value=t){return `<section class="ac-editor-section"><div class="ac-form">${field('模板名称 <span class="ac-required">*</span>',input('name',value.name,'data-field="name" maxlength="60" placeholder="例如：付款申请流程"'))}${field('业务场景 <span class="ac-required">*</span>',select('scene',M.scenes.map(s=>s.name),value.scene,'data-field="scene"'))}</div></section><section class="ac-editor-section"><h2>适用范围</h2><div class="ac-form"><div class="ac-field ac-wide"><span>${e(M.scene(value.scene).companyLabel)} <span class="ac-required">*</span></span><div class="ac-options">${M.companies.map(c=>check('company',e(c.name),value.companies.includes(c.id),`data-company="${c.id}"`)).join('')}</div></div><div class="ac-field ac-wide"><span>适用部门</span><div class="ac-options">${[['all','全部部门'],['selected','指定部门']].map(([mode,label])=>`<label class="ac-check"><input type="radio" name="departmentMode" value="${mode}" data-field="departmentMode" ${value.departmentMode===mode?'checked':''}>${label}</label>`).join('')}</div><div class="ac-department-selection" ${value.departmentMode==='selected'?'':'hidden'}><div class="ac-options" data-department-options>${M.departments.filter(d=>value.companies.includes(d.company)).map(d=>check('department',e(M.companyName(d.company)+' / '+d.name),value.departments.includes(d.id),`data-department="${d.id}"`)).join('')||'<span class="ac-muted">请先选择适用公司</span>'}</div>${check('children','包含下级部门',value.includeChildren,'data-field="includeChildren"')}</div></div></div></section>`;}
    function applicantDrawer(){
      let draft=M.clone(t);
      const l=makeLayer(readonly?'查看申请人':'设置申请人','<div data-applicant-form></div>',`<button class="btn btn-secondary" data-ac-close>${readonly?'关闭':'取消'}</button>${readonly?'':'<button class="btn btn-primary" data-applicant-save>确定</button>'}`);
      const form=l.el.querySelector('[data-applicant-form]');
      function draw(){form.innerHTML=scopeForm(draft).replaceAll('ac-editor-section','drawer-section').replace('<h2>适用范围</h2>','<div class="drawer-section-head"><h3 class="drawer-section-title">适用范围</h3></div>');if(readonly)form.querySelectorAll('input,select').forEach(x=>x.disabled=true);}
      form.addEventListener('input',ev=>{if(readonly)return;l.dirty=true;if(ev.target.dataset.field==='name')draft.name=ev.target.value;});
      form.addEventListener('change',ev=>{if(readonly)return;l.dirty=true;const el=ev.target,k=el.dataset.field;
        if(el.dataset.company){draft.companies=el.checked?[...new Set([...draft.companies,el.dataset.company])]:draft.companies.filter(c=>c!==el.dataset.company);draft.departments=draft.departments.filter(id=>M.departments.some(d=>d.id===id&&draft.companies.includes(d.company)));draw();}
        if(el.dataset.department)draft.departments=el.checked?[...new Set([...draft.departments,el.dataset.department])]:draft.departments.filter(id=>id!==el.dataset.department);
        if(k==='departmentMode'){draft.departmentMode=el.value;if(el.value==='all')draft.departments=[];draw();}
        if(k==='includeChildren')draft.includeChildren=el.checked;
        if(k==='scene'){const next=el.value;el.value=draft.scene;confirmAction('切换业务场景？','切换后将重新带入审批内容和流程示例。',()=>{draft={...M.sample(next),name:draft.name,companies:draft.companies,departments:draft.departments,includeChildren:draft.includeChildren,departmentMode:draft.departmentMode};draw();});}
      });
      l.el.querySelector('[data-applicant-save]')?.addEventListener('click',()=>{const errors=[];if(!draft.name.trim())errors.push('请填写模板名称');if(!draft.companies.length)errors.push('请选择适用公司');if(draft.departmentMode==='selected'&&!draft.departments.length)errors.push('请至少选择一个适用部门');showErrors(l.el.querySelector('[data-errors]'),errors);if(errors.length)return;t=draft;dirty=true;closeLayer(l,true);render();});draw();
    }
    function contentForm(){
      if(readonly&&!t.content)return `<h2>审批内容</h2><ul class="ac-fields">${M.scene(t.scene).fields.map(f=>`<li><span>${e(f)}</span><span class="ac-muted">必显</span></li>`).join('')}</ul>`;
      const selected=new Set(t.content.groups.flatMap(g=>g.fields));
      const row=(label,control,required,hint='')=>`<label class="ac-content-choice ${required?'ac-content-required':''}">${control}<span>${e(label)}${hint?`<small>${e(hint)}</small>`:''}</span>${required?'<span class="ac-content-required-label">必显</span>':''}</label>`;
      return `<h2>审批内容</h2><p class="form-hint">勾选审批时展示的字段，必显字段不可取消。</p><div class="ac-content-checklist">${M.contentCatalog(t.scene).map(f=>row(f.label,`<input type="checkbox" data-content-field="${f.id}" ${selected.has(f.id)?'checked':''} ${f.required||readonly?'disabled':''}>`,f.required,{self:'自营门店时显示',franchise:'加盟门店时显示',independent:'自营门店使用独立资质时显示'}[f.applies])).join('')}${row('补充说明',`<input type="checkbox" data-field="note" ${t.fields.note?'checked':''} ${readonly||t.fields.noteRequired?'disabled':''}>`,t.fields.noteRequired)}${row('补充附件',`<input type="checkbox" data-field="attachments" ${t.fields.attachments?'checked':''} ${readonly||t.fields.attachmentRequired?'disabled':''}>`,t.fields.attachmentRequired)}</div>`;
    }
    function flowForm(){return `<div class="ac-node ac-applicant-card"><div class="ac-node-head">申请人</div><button class="ac-node-body" data-ac="applicant" data-drawer-title="${readonly?'查看申请人':'设置申请人'}"><span>${e(scopeText(t))}<span class="ac-muted">${t.departments.length?e(t.departments.map(id=>M.departments.find(d=>d.id===id)?.name||id).join("、")):"全部部门"}</span></span><span class="ac-card-chevron" aria-hidden="true">›</span></button></div>${flowList(t.nodes,'root')}<div class="ac-flow-end">审批结束</div>`;}
    function addConnector(list,index){return `<div class="ac-connector">${readonly?'':`<button type="button" class="ac-add" data-ac="add-node" data-list="${list}" data-index="${index}" aria-label="添加节点">+</button>`}</div>`;}
    function nodeIcon(label,action,attrs){
      const paths={编辑:'<path d="m10 3 3 3M3 10l7-7 3 3-7 7-4 1z"/><path d="M2 15h12"/>',复制:'<path d="M6 5V2h8v10h-3"/><rect x="2" y="5" width="9" height="10" rx="1"/><path d="M4 8h5M4 11h5"/>',删除:'<path d="m3 3 10 10M13 3 3 13"/>'};
      return `<button type="button" class="ac-node-icon" data-ac="${action}" ${attrs} title="${label}" aria-label="${label}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[label]}</svg></button>`;
    }
    function flowList(nodes,list){return addConnector(list,0)+nodes.map((n,i)=>{
      const attrs=`data-list="${list}" data-id="${n.id}"`;
      const controls=readonly?'':`<div class="ac-node-actions">${nodeIcon('复制','node-copy',attrs)}${nodeIcon('删除','node-delete',attrs)}</div>`;
      if(n.type==='branch')return `<div class="ac-branch-group" data-node-id="${n.id}" style="--ac-branch-count:${n.branches.length}" aria-label="${e(n.title)}"><div class="ac-branch-group-head ac-forkbar"><span class="sr-only">${e(n.title)}</span>${readonly?'<span class="ac-fork-label">条件分流</span>':button('添加条件','branch-add',`data-id="${n.id}"`)}</div><div class="ac-branches">${n.branches.map((b,j)=>`<div class="ac-branch" data-branch-id="${b.id}"><section class="ac-condition-card${b.fallback?' ac-default-card':''}"><div class="ac-condition-card-head">${b.fallback?`<span>默认条件</span><span>优先级 ${j+1}</span>`:`<span class="ac-node-heading"><span class="ac-condition-name">${e(b.title)}</span>${readonly?'':`<span class="ac-node-actions">${nodeIcon('编辑','edit-condition',`data-group="${n.id}" data-id="${b.id}"`)}</span>`}</span><div class="ac-condition-card-actions"><span class="ac-condition-priority">优先级 ${j+1}</span>${readonly?'':`<div class="ac-node-actions">${nodeIcon('复制','copy-condition',`data-group="${n.id}" data-id="${b.id}"`)}${nodeIcon('删除','delete-condition',`data-group="${n.id}" data-id="${b.id}"`)}</div>`}</div>`}</div>${b.fallback?'<div class="ac-branch-title ac-fallback">未满足其他条件时，进入此流程</div>':`<button class="ac-branch-title" data-ac="edit-condition" data-group="${n.id}" data-id="${b.id}"><span>${e(b.conditions.map(M.conditionText).join(b.match==='any'?' 或 ':' 且 '))||'请设置条件'}</span><span class="ac-card-chevron" aria-hidden="true">›</span></button>`}</section>${flowList(b.nodes,b.id)}<div class="ac-branch-footer"></div></div>`).join('')}</div></div>`+addConnector(list,i+1);
      return `<div class="ac-node ac-node-${n.type}" data-node-id="${n.id}"><div class="ac-node-head"><span class="ac-node-heading">${n.type==='cc'?'抄送人':'审批人'}${readonly?'':`<span class="ac-node-actions">${nodeIcon('编辑','edit-node',attrs)}</span>`}</span>${controls}</div><button class="ac-node-body" data-ac="edit-node" data-id="${n.id}"><span><strong>${e(n.title)}</strong><span class="ac-muted">${e(n.source==='duty'?n.duty:n.source==='member'?(names(n.members)||'请选择人员'):n.source==='business'?M.scene(t.scene).businessLabel:M.sources[n.source])+(n.hierarchy?' · '+(n.hierarchy.mode==='continuous'?'逐级至':'指定')+(n.hierarchy.origin==='top'?'最高层起':'')+'第'+n.hierarchy.level+'级'+(n.source==='manager'?'':' · 同层'+(n.hierarchy.within==='any'?'或签':'会签')):(n.type==='approval'?' · '+M.modes[n.mode]:''))}</span></span><span class="ac-card-chevron" aria-hidden="true">›</span></button></div>`+addConnector(list,i+1);
    }).join('');}
    function rulesForm(){
      const r=t.rules;
      const radios=(key,items)=>`<div class="ac-rule-options">${items.map(([value,label])=>`<label class="ac-check"><input type="radio" name="rule-${key}" data-rule="${key}" value="${value}" ${r[key]===value?'checked':''}>${label}</label>`).join('')}</div>`;
      const replacements=key=>r[key]!=='replace'?'':`<div class="ac-rule-replacements">${t.companies.map(company=>field(M.companyName(company)+'接替人',select(key+'-'+company,[['','请选择接替人'],...state.people.filter(p=>M.eligible(state,p.id,company)).map(p=>[p.id,p.name])],r[key+'Members']?.[company]||'',`data-replacement="${key}" data-rule-company="${company}"`))).join('')||'<span class="ac-muted">请先在适用范围选择公司。</span>'}</div>`;
      return `<section class="ac-rule-section"><h3>人员异常</h3><div class="ac-rule-settings"><div class="ac-rule-row"><div>审批人为空时</div><div>${radios('empty',[['block','暂停，交审批管理员处理'],['replace','转交指定人员']])}${replacements('empty')}</div></div><div class="ac-rule-row"><div>审批人离职时</div><div>${radios('departed',[['block','暂停，管理员手动交接'],['replace','自动转交指定人员']])}${replacements('departed')}</div></div><p class="ac-muted">优先使用有效代办；接替人失效或为申请人时暂停。提交前已发现缺人，先补齐人员再提交。</p></div></section>
      <section class="ac-rule-section"><h3>重复审批</h3><div class="ac-rule-settings"><div class="ac-rule-row"><div>同一人重复审批</div><div>${radios('repeat',Object.entries(M.repeatModes))}<span class="ac-muted">仅沿用本次申请中已经同意的个人结果，其他会签人仍需审批；退回重提后重新审批。</span></div></div></div></section>
      <section class="ac-rule-section"><h3>意见与签名</h3><div class="ac-rule-settings">${check('approveOpinionRequired','同意时必须填写审批意见',r.approveOpinionRequired,'data-rule="approveOpinionRequired"')}${check('signatureRequired','同意时需要手写签名',r.signatureRequired,'data-rule="signatureRequired"')}<span class="ac-muted">退回、拒绝必须填写原因；签名随审批记录保存。</span></div></section>
      <section class="ac-rule-section"><h3>办理控制</h3><div class="ac-rule-settings"><div class="ac-rule-row"><div>节点办理时限</div><label class="ac-rule-hours">${input('hours',r.hours,'type="number" min="1" max="720" data-field="hours" aria-label="节点办理时限"')} 小时<span class="ac-muted">超时提醒当前审批人，保持待审批</span></label></div>${check('returnAllowed','允许退回补充后重新提交',r.returnAllowed,'data-field="returnAllowed"')}${check('withdrawAllowed','允许申请人在完成前撤回',r.withdrawAllowed,'data-field="withdrawAllowed"')}${check('transferAllowed','允许审批人转交给有本公司权限的人员',r.transferAllowed,'data-field="transferAllowed"')}<span class="ac-muted">申请人不能审批本人申请。</span></div></section>`;
    }
    function save(){if(!t.name.trim()){showErrors(host.querySelector('#acEditorErrors'),['请在申请人节点填写模板名称']);return false;}if(t.departmentMode==='selected'&&!t.departments.length){showErrors(host.querySelector('#acEditorErrors'),['请在申请人节点选择适用部门']);return false;}const next=M.clone(state);M.saveDraft(next,id,t);if(!persist(next))return false;record=state.templates.find(x=>x.id===id);dirty=false;try{history.replaceState(null,'',editorUrl(id));}catch(_){}render();toast('草稿已保存');return true;}
    host.addEventListener('input',ev=>{const k=ev.target.dataset.field;if(k==='hours'){t.rules.hours=ev.target.value;dirty=true;}});
    host.addEventListener('change',ev=>{
      if(readonly)return;const el=ev.target,k=el.dataset.field;dirty=true;
      if(el.dataset.contentField){const f=M.contentCatalog(t.scene).find(f=>f.id===el.dataset.contentField);if(!f||f.required){render();return;}t.content.groups.forEach(g=>g.fields=g.fields.filter(id=>id!==f.id));if(el.checked){let group=t.content.groups.find(g=>g.name===f.group);if(!group){group={id:M.uid(),name:f.group,fields:[]};t.content.groups.push(group);}group.fields.push(f.id);}return;}
      if(el.dataset.rule){t.rules[el.dataset.rule]=el.type==='checkbox'?el.checked:el.value;if(['empty','departed'].includes(el.dataset.rule))render();return;}
      if(el.dataset.replacement){t.rules[el.dataset.replacement+'Members']||={};t.rules[el.dataset.replacement+'Members'][el.dataset.ruleCompany]=el.value;return;}
      if(k==='hideEmpty'){t.content.hideEmpty=el.checked;render();}
      if(['note','noteRequired','attachments','attachmentRequired'].includes(k)){t.fields[k]=el.checked;if((k==='attachments'||k==='note')&&!el.checked)t.fields[k==='note'?'noteRequired':'attachmentRequired']=false;render();}
      if(['returnAllowed','withdrawAllowed','transferAllowed'].includes(k))t.rules[k]=el.checked;
    });
    host.addEventListener('click',ev=>{const b=ev.target.closest('[data-ac]');if(!b)return;const a=b.dataset.ac;
      if(a==='back'){const go=()=>location.href='approval-config.html';if(dirty)confirmAction('离开模板编辑？','当前内容未保存，确认离开吗？',()=>{dirty=false;go();});else go();}
      if(a==='step'){step=Number(b.dataset.step);render();host.querySelector('#acTab'+step)?.focus();}
      if(a==='save'&&!readonly)save();
      if(a==='applicant')applicantDrawer();
      if(a==='trial')trialDrawer(t,id,readonly);
      if(a==='publish'&&!readonly){const errors=M.validate(state,t,id);showErrors(host.querySelector('#acEditorErrors'),errors);if(errors.length)return;confirmAction('发布审批模板？',`${t.name}将适用于${scopeText(t)}。新提交的申请采用新版本，在途申请保留原流程。`,()=>{const next=M.clone(state),result=M.publish(next,id,t);if(result.errors.length){showErrors(host.querySelector('#acEditorErrors'),result.errors);return;}if(persist(next)){record=state.templates.find(x=>x.id===id);dirty=false;location.href='approval-config.html';}});}
      if(a==='edit-node')nodeDrawer(M.getNode(t,b.dataset.id),readonly,()=>{dirty=true;render();});
      if(a==='edit-condition'){const n=M.getNode(t,b.dataset.group),branch=n?.branches.find(x=>x.id===b.dataset.id);if(branch)conditionDrawer(n,branch,()=>{dirty=true;render();},readonly);}
      if(['rename-condition','copy-condition','delete-condition'].includes(a)&&!readonly){const n=M.getNode(t,b.dataset.group),branch=n?.branches.find(x=>x.id===b.dataset.id&&!x.fallback);if(branch){
        if(a==='rename-condition')renameCondition(n,branch);
        if(a==='copy-condition'){const copy=M.cloneConditionBranch(branch);conditionDrawer(n,copy,()=>{n.branches.splice(n.branches.indexOf(branch)+1,0,copy);dirty=true;render();});}
        if(a==='delete-condition')deleteCondition(n,branch);
      }}
      if(a==='branch-add'&&!readonly){const n=M.getNode(t,b.dataset.id),branch=freshCondition();conditionDrawer(n,branch,()=>{n.branches.splice(n.branches.length-1,0,branch);dirty=true;render();});}
      if(a==='add-node'&&!readonly){menu(b,[['approval','审批人'],...(M.scene(t.scene).conditions.length?[['branch','条件分支']]:[]),['cc','抄送人']],type=>{
        const insert=n=>{M.getList(t,b.dataset.list).splice(Number(b.dataset.index),0,n);dirty=true;render();};
        if(type==='branch'){const branch=freshCondition(),n={id:M.uid(),type:'branch',title:'按条件分流',branches:[{id:M.uid(),title:'其他情况',fallback:true,conditions:[],nodes:[]}]};conditionDrawer(n,branch,()=>{n.branches.unshift(branch);insert(n);});}
        else{const fresh={...M.node(type==='cc'?'抄送人':'审批人','member'),type};nodeDrawer(fresh,false,()=>insert(fresh));}
      });}
      function removeNode(){const list=M.getList(t,b.dataset.list),i=list?.findIndex(x=>x.id===b.dataset.id);if(i<0||!list)return;confirmAction('删除节点？',list[i].type==='branch'?'此分支组及内部审批节点将一并删除。':'此节点将从当前流程中删除。',()=>{list.splice(i,1);dirty=true;render();});}
      if(a==='node-delete'&&!readonly)removeNode();
      if(a==='node-copy'&&!readonly){const list=M.getList(t,b.dataset.list),original=M.getNode(t,b.dataset.id);if(list&&original&&original.type!=='branch'){const copy=M.clone(original);copy.id=M.uid();copy.title+='（副本）';list.splice(list.indexOf(original)+1,0,copy);dirty=true;render();}}


    });
    window.addEventListener('beforeunload',ev=>{if(dirty){ev.preventDefault();ev.returnValue='';}});
    function moveNodeDrawer(n,listId){
      const list=M.getList(t,listId),current=list.findIndex(x=>x.id===n.id);
      const l=makeLayer('移动节点',`<p>${e(n.title)}${n.type==='branch'?'（含全部分支内节点）':''}</p><form class="ac-form">${field('新位置',select('nodePosition',list.map((x,i)=>[i,'第 '+(i+1)+' 个位置'+(i===current?'（当前位置）':'')]),current))}</form>`,'<button class="btn btn-secondary" data-ac-close>取消</button><button class="btn btn-primary" data-move-save>确定</button>');
      l.el.addEventListener('change',()=>l.dirty=true);l.el.querySelector('[data-move-save]').onclick=()=>{if(M.moveNode(t,listId,n.id,Number(l.el.querySelector('[name=nodePosition]').value))){dirty=true;closeLayer(l,true);render();}};
    }
    function renameBranchGroup(n){
      const l=makeLayer('分支名称',`<form class="ac-form">${field('分支组名称',input('groupTitle',n.title,'maxlength="40"'))}</form>`,'<button class="btn btn-secondary" data-ac-close>取消</button><button class="btn btn-primary" data-rename-save>确定</button>');
      l.el.addEventListener('input',()=>l.dirty=true);l.el.querySelector('[data-rename-save]').onclick=()=>{const value=l.el.querySelector('[name=groupTitle]').value.trim();if(!value){showErrors(l.el.querySelector('[data-errors]'),['请填写分支组名称']);return;}n.title=value;dirty=true;closeLayer(l,true);render();};
    }
    function branchOrderDrawer(n){
      const draft=n.branches.filter(b=>!b.fallback).map(b=>b.id);
      const l=makeLayer('调整条件顺序','<p>从前往后匹配，进入第一条满足条件的分支。</p><div data-order-rows></div><div class="ac-order-fallback">最后：其他情况</div>','<button class="btn btn-secondary" data-ac-close>取消</button><button class="btn btn-primary" data-order-save>确定</button>');
      function draw(){l.el.querySelector('[data-order-rows]').innerHTML=draft.map((id,i)=>`<label class="ac-order-row"><span>${e(n.branches.find(b=>b.id===id).title)}</span>${select('priority',draft.map((_,j)=>[j,'第 '+(j+1)+' 条']),i,`data-order-id="${id}" aria-label="${e(n.branches.find(b=>b.id===id).title)}的匹配顺序"`)}</label>`).join('');}
      l.el.addEventListener('change',ev=>{const id=ev.target.dataset.orderId;if(!id)return;const i=draft.indexOf(id);draft.splice(i,1);draft.splice(Number(ev.target.value),0,id);l.dirty=true;draw();});
      l.el.querySelector('[data-order-save]').onclick=()=>{if(M.reorderBranches(n,draft)){dirty=true;closeLayer(l,true);render();}};draw();
    }
    function renameCondition(group,branch){
      const l=makeLayer('条件名称',`<form class="ac-form">${field('条件名称',input('conditionName',branch.title,'maxlength="40"'))}</form>`,'<button class="btn btn-secondary" data-ac-close>取消</button><button class="btn btn-primary" data-condition-rename>确定</button>');
      l.el.addEventListener('input',()=>l.dirty=true);l.el.querySelector('[data-condition-rename]').onclick=()=>{const name=l.el.querySelector('[name=conditionName]').value.trim();if(!name){showErrors(l.el.querySelector('[data-errors]'),['请填写条件名称']);return;}branch.title=name;dirty=true;closeLayer(l,true);render();};
    }
    function deleteCondition(group,branch,after){if(branch.fallback)return;if(group.branches.length<3){confirmAction('删除条件分支组？','这是最后一个条件，删除后整个分支组及其内部节点将一并删除。',()=>{function remove(list){const i=list.indexOf(group);if(i>=0){list.splice(i,1);return true;}return list.some(n=>n.type==='branch'&&n.branches.some(b=>remove(b.nodes)));}remove(t.nodes);dirty=true;if(after)after();render();});return;}confirmAction('删除条件分支？','该条件及其内部审批节点将一并删除，默认条件和其他分支保持。',()=>{group.branches=group.branches.filter(x=>x.id!==branch.id);dirty=true;if(after)after();render();});}
    function conditionDrawer(group,original,onSave,readOnly=false){
      if(original.fallback)return;
      const b=M.clone(original),isNew=!group.branches.some(x=>x.id===b.id);
      const l=makeLayer(readOnly?'查看条件':isNew?'添加条件':'设置条件','<form data-condition-form></form>',`${!readOnly&&!isNew&&group.branches.filter(x=>!x.fallback).length>1?'<button class="btn btn-secondary" data-condition-delete>删除此分支</button>':''}<button class="btn btn-secondary" data-ac-close>${readOnly?'关闭':'取消'}</button>${readOnly?'':'<button class="btn btn-primary" data-condition-save>确定</button>'}`,false,'drawer-edit drawer-lg');
      const form=l.el.querySelector('[data-condition-form]');
      function draw(){form.innerHTML=drawerSection('条件信息',`<div class="form-grid ac-form ac-form-two">${field('条件名称 <span class="req">*</span>',input('branchTitle',b.title,'maxlength="40"'))}${field('满足条件',select('match',[['all','全部条件满足'],['any','任一条件满足']],b.match))}</div>`)+drawerSection('判断条件',`<div class="ac-condition-list">${b.conditions.map((c,i)=>`<div class="ac-condition-row" data-condition-index="${i}">${select('field',M.scene(t.scene).conditions.map(v=>[v,v==='amount'?'申请金额':'调价幅度绝对值']),c.field,'aria-label="条件字段"')}${select('op',[['gt','>'],['gte','≥'],['lt','<'],['lte','≤'],['eq','=']],c.op,'aria-label="比较方式"')}${input('value',c.value,'type="number" min="0" step="any" aria-label="条件数值"')}${c.field==='amount'?select('currency',['CNY','USD','EUR'],c.currency,'aria-label="币种"'):'<span>%</span>'}${!readOnly?`<button type="button" class="ac-link" data-remove-condition="${i}" aria-label="删除条件">×</button>`:''}</div>`).join('')}</div>${!readOnly?'<button type="button" class="btn btn-secondary" data-add-condition>添加判断条件</button>':''}`);if(readOnly)form.querySelectorAll('input,select').forEach(x=>x.disabled=true);}
      function update(ev){if(readOnly)return;const el=ev.target;l.dirty=true;if(el.name==='branchTitle')b.title=el.value;if(el.name==='match')b.match=el.value;const row=el.closest('[data-condition-index]');if(row)b.conditions[Number(row.dataset.conditionIndex)][el.name]=el.value;}
      form.addEventListener('input',update);form.addEventListener('change',ev=>{update(ev);if(ev.target.name==='field')draw();});
      form.addEventListener('click',ev=>{if(readOnly)return;const add=ev.target.closest('[data-add-condition]'),remove=ev.target.closest('[data-remove-condition]');if(add)b.conditions.push({field:M.scene(t.scene).conditions[0],op:'gt',value:'',currency:'CNY'});if(remove)b.conditions.splice(Number(remove.dataset.removeCondition),1);if(add||remove){l.dirty=true;draw();}});
      if(!readOnly)l.el.querySelector('[data-condition-save]').onclick=()=>{const errors=[];if(!b.title.trim())errors.push('请填写条件名称');if(!b.conditions.length||b.conditions.some(c=>c.value===''||Number(c.value)<0||!Number.isFinite(Number(c.value))))errors.push('请至少配置一个完整有效的条件');showErrors(l.el.querySelector('[data-errors]'),errors);if(errors.length)return;Object.assign(original,b);closeLayer(l,true);onSave();};
      const del=l.el.querySelector('[data-condition-delete]');if(del)del.onclick=()=>deleteCondition(group,original,()=>closeLayer(l,true));draw();
    }
    function freshCondition(){return {id:M.uid(),title:'新条件',match:'all',conditions:[{field:M.scene(t.scene).conditions[0],op:'gt',value:'',currency:'CNY'}],nodes:[]};}
    function nodeDrawer(original,readOnly,onSave){
      if(!original||original.type==='branch')return;refreshOrganization();const n=M.clone(original);
      const l=makeLayer(readOnly?'查看节点':'设置'+(n.type==='cc'?'抄送人':'审批人'),'<form data-node-form></form>',`<button class="btn btn-secondary" data-ac-close>${readOnly?'关闭':'取消'}</button>${readOnly?'':'<button class="btn btn-primary" data-node-save>确定</button>'}`);
      const form=l.el.querySelector('[data-node-form]'),scene=M.scene(t.scene);
      function sourceOptions(){return [['member','指定成员'],['manager','指定上级'],['manager-continuous','连续多级上级'],['department','指定部门负责人'],['department-continuous','连续多级部门负责人'],['duty','公司审批人员'],...(scene.businessOwnerAvailable||n.source==='business'?[['business',scene.businessOwnerAvailable?'单据负责人':'单据负责人（原配置）']]:[])];}
      const defaults=()=>({mode:'single',origin:'bottom',level:n.source==='superior'?2:1,base:'business',empty:'block',within:n.mode==='any'?'any':'all'});
      function selectedSource(){const source=n.source==='superior'?'department':n.source;return ['manager','department'].includes(source)&&n.hierarchy?.mode==='continuous'?source+'-continuous':source;}
      function renderNode(){form.innerHTML=drawerSection('节点设置',`<div class="form-grid ac-form ac-form-two">${field('节点名称 <span class="req">*</span>',input('title',n.title,'maxlength="40"'))}${field(n.type==='cc'?'抄送人来源':'审批人来源',select('source',sourceOptions(),selectedSource()))}</div>`)+drawerSection(n.type==='cc'?'抄送人员':'审批人员',`<div class="ac-form" data-person-controls>${personControls()}</div>`)+(n.type==='approval'&&!n.hierarchy&&n.source!=='manager'?drawerSection('办理方式',`<div class="ac-form">${field('多人办理方式',select('mode',Object.entries(M.modes),n.mode))}</div>`):'');if(readOnly)form.querySelectorAll('input,select').forEach(x=>x.disabled=true);}
      function personControls(){
        if(n.source==='duty')return field('审批职责',select('duty',M.duties,n.duty));
        if(['manager','department','superior'].includes(n.source)){
          const h=n.hierarchy||defaults(),manager=n.source==='manager',continuous=h.mode==='continuous',top=h.origin==='top',level=Number(h.level);
          const levelName=i=>top?(i?'从最高层起第'+(i+1)+'级':manager?'最高上级':'最高部门负责人'):(i?'第'+(i+1)+'级'+(manager?'上级':'部门负责人'):(manager?'直属上级':'直接部门负责人'));
          // Match resolveHierarchy: top changes the target index, never the execution order.
          const depth=Math.max(3,level),index=top?depth-level+1:level;
          const base=manager?'直属上级':(h.base==='applicant'?'申请人本次任职部门':'单据业务责任部门');
          const example=`假设${manager?'直属上级链':'部门链'}共有${depth}级，以${base}为最下层第1级。当前选择对应从下往上第${index}级。`+(continuous?`按第1级${index>1?' → '+Array.from({length:index-1},(_,i)=>'第'+(i+2)+'级').join(' → '):''}的顺序${n.type==='cc'?'抄送':'审批'}。`:`仅该级${manager?'上级':'负责人'}参与${n.type==='cc'?'抄送':'审批'}。`);
          return (!manager?field('从哪个部门开始',select('hierarchyBase',[['business','单据业务责任部门'],['applicant','申请人本次任职部门']],h.base)):'')+
            `<div class="ac-control-help">${field(continuous?'审批终点':'指定层级',`<div class="ac-hierarchy-selects">${select('hierarchyOrigin',[['bottom','从下至上'],['top','从上至下']],h.origin,'aria-label="层级计数方向"')}${select('hierarchyLevel',Array.from({length:10},(_,i)=>[i+1,levelName(i)]),h.level,'aria-label="审批层级"')}</div>`)}<details class="ac-hierarchy-more"><summary>查看示例</summary><p class="form-hint">${e(example)}${manager?'':'示例假设各层均有有效负责人。'}</p></details></div>`+
            (!manager?field('当前层级无部门负责人时',select('hierarchyEmpty',[['block','暂停，交审批管理员处理'],['parent','向上查找最近的有效部门负责人']],h.empty))+
              field('同一层有多位负责人时',select('hierarchyWithin',[['any','或签（一人同意即可）'],['all','会签（须全部同意）']],h.within)):'');
        }
        if(n.source==='member'){
          const candidates=state.people.filter(p=>t.companies.some(c=>n.type==='cc'?M.orgData.currentPerson(state.org,p.id,c):M.eligible(state,p.id,c)));
          const empty=!t.companies.length?'请先在“申请人”节点设置适用公司':n.type==='cc'?'适用公司暂无有效任职员工，请先在“员工账号”维护任职':'适用公司暂无可审批成员，请先核对员工任职及审批权限';
          return `<div class="ac-field"><span>选择成员</span><div class="ac-person-list">${candidates.length?candidates.map(p=>check('member',`${e(p.name)} <span class="ac-muted">${e(p.companies.filter(c=>t.companies.includes(c)).map(M.companyName).join('、'))}</span>`,n.members.includes(p.id),`value="${p.id}"`)).join(''):`<div class="ac-member-empty" role="status">${e(empty)}</div>`}</div>${candidates.length&&n.type==='approval'&&n.mode==='sequential'?'<span class="ac-muted">按勾选顺序审批</span>':''}</div>`;
        }
        return scene.businessOwnerAvailable?field('负责人类型',`<span>${e(scene.businessLabel)}</span>`):'<p class="form-hint">当前场景无单据负责人，请更换来源。</p>';
      }
      form.addEventListener('input',ev=>{if(readOnly)return;l.dirty=true;if(ev.target.name==='title')n.title=ev.target.value;});
      form.addEventListener('change',ev=>{if(readOnly)return;l.dirty=true;const el=ev.target;if(el.name==='source'){const next=el.value.replace('-continuous',''),previous=n.source==='superior'?'department':n.source,oldHierarchy=n.hierarchy||defaults();n.source=next;if(['manager','department'].includes(next)){n.hierarchy=previous===next?oldHierarchy:defaults();n.hierarchy.mode=el.value.endsWith('-continuous')?'continuous':'single';if(next==='manager')n.hierarchy.base='applicant';}else n.hierarchy=null;renderNode();}if(el.name.startsWith('hierarchy')){n.hierarchy=n.hierarchy||defaults();const key=el.name.slice(9).toLowerCase();n.hierarchy[key]=key==='level'?Number(el.value):el.value;renderNode();}if(el.name==='duty'){n.duty=el.value;renderNode();}if(el.name==='mode'){n.mode=el.value;renderNode();}if(el.name==='member'){if(el.checked)n.members.push(el.value);else n.members=n.members.filter(id=>id!==el.value);}});
      if(!readOnly)l.el.querySelector('[data-node-save]').onclick=()=>{const errors=[];if(['manager','department','superior'].includes(n.source))n.hierarchy=n.hierarchy||defaults();errors.push(...M.orgData.configErrors(n));if(!n.title.trim())errors.push('请填写节点名称');if(n.source==='member'&&!n.members.length)errors.push('请至少选择一位人员');if(n.source==='business'&&!scene.businessOwnerAvailable)errors.push('当前业务场景未提供单据负责人，请改选其他审批人来源');showErrors(l.el.querySelector('[data-errors]'),errors);if(!errors.length){Object.assign(original,n);closeLayer(l,true);onSave();}};renderNode();
    }
    render();
  }
  function trialDrawer(t,id,readonly){
    refreshOrganization();
    // Historical versions can be previewed independently of current template overlap.
    const company=t.companies[0]||'fj';let needsAppointment=false;M.walk(t.nodes,n=>{if(n.source==='manager'||n.hierarchy?.base==='applicant')needsAppointment=true;});let needsBusiness=false;M.walk(t.nodes,n=>{if(n.source==='business')needsBusiness=true;});
    const l=makeLayer('流程试跑',`${t.demo?'<span class="ac-muted">使用示例规则试跑，不提交业务申请。</span>':''}<form class="ac-form" data-trial>${field(M.scene(t.scene).companyLabel,select('company',M.companies.map(c=>[c.id,c.short]),company))}${field('业务责任部门',select('department',[],''))}${field('申请人',select('applicant',[],''))}${needsAppointment?field('本次申请任职',select('appointment',[],'')):''}${needsBusiness?field(M.scene(t.scene).businessLabel,select('businessOwner',[],'')):''}${M.scene(t.scene).conditions.includes('amount')?field('申请金额',input('amount',60000,'type="number" min="0" step="any"'))+field('币种',select('currency',['CNY','USD','EUR'],'CNY')):''}${M.scene(t.scene).conditions.includes('rate')?field('调价幅度绝对值（%）',input('rate',5,'type="number" min="0" step="any"')):''}${field('申请日期',input('date',today(),'type="date"'))}</form><div data-trial-result></div>`,'<button class="btn btn-secondary" data-ac-close>关闭</button><button class="btn btn-primary" data-run>开始试跑</button>');
    function refresh(){const company=l.el.querySelector('[name=company]').value;const ds=M.departments.filter(d=>d.company===company);l.el.querySelector('[name=department]').innerHTML=options(ds.map(d=>[d.id,d.name]),ds.find(d=>d.parent)?.id||ds[0]?.id);const ps=state.people.filter(p=>p.active&&p.companies.includes(company));l.el.querySelector('[name=applicant]').innerHTML=options(ps.map(p=>[p.id,p.name]),company==='fj'?'chenhong':'chenxiao');if(needsBusiness)l.el.querySelector('[name=businessOwner]').innerHTML=options(ps.map(p=>[p.id,p.name]),company==='fj'?'zhou':'zhoumin');}
    function refreshAppointment(){if(!needsAppointment)return;const f=l.el.querySelector('form'),jobs=M.orgData.jobs(state.org,f.elements.applicant.value,f.elements.company.value,f.elements.date.value);f.elements.appointment.innerHTML=options([['','请选择本次申请任职'],...jobs.map(a=>[a.id,(a.primary?'主任职':'兼任')+' · '+(M.departments.find(d=>d.id===a.department)?.name||a.department)])],jobs.length===1?jobs[0].id:'');}
    refresh();refreshAppointment();l.el.querySelector('[name=company]').onchange=()=>{refresh();refreshAppointment();};l.el.querySelector('[name=applicant]').onchange=refreshAppointment;l.el.querySelector('[name=date]').onchange=refreshAppointment;
    l.el.querySelector('[data-trial]').addEventListener('input',()=>l.el.querySelector('[data-trial-result]').innerHTML='');
    l.el.querySelector('[data-run]').onclick=()=>{refreshOrganization();const currentErrors=M.validate(state,t,readonly?'':id);const actualErrors=readonly?currentErrors.filter(x=>!x.includes('适用范围与')):currentErrors;const values=Object.fromEntries(new FormData(l.el.querySelector('form'))),result=actualErrors.length?{errors:actualErrors,steps:[]}:M.trial(state,t,values);const target=l.el.querySelector('[data-trial-result]'),rules=M.rulesFor(t);target.innerHTML=errorsHTML(result.errors)+(!result.errors.length?'<div class="ac-success">试跑通过</div>':'')+result.steps.map(s=>`<div class="ac-trial-step"><strong>${e(s.title)}</strong><span>${e(s.detail)}</span>${s.delegated?`<span class="ac-muted">${e(s.delegated)}</span>`:''}${(s.notices||[]).map(x=>`<span>${e(x)}</span>`).join('')}</div>`).join('')+(!result.errors.length?`<div class="ac-trial-step"><strong>审批结束</strong><span>返回来源业务继续办理</span></div><div class="ac-rehearsal-entry"><span class="ac-muted">${e(M.repeatModes[rules.repeat])}；同意意见${rules.approveOpinionRequired?'必填':'选填'}；${rules.signatureRequired?'同意需签名':'不要求签名'}</span><button type="button" class="btn btn-secondary" data-rehearse>模拟逐级办理</button></div>`:'');target.querySelector('[data-rehearse]')?.addEventListener('click',()=>rehearsalDrawer(t,values));};
  }
  function signatureSVG(strokes){return `<svg viewBox="0 0 480 160" class="ac-signature-image" role="img" aria-label="审批签名">${strokes.map(s=>`<polyline points="${s.map(p=>p.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;}
  function signaturePad(host){
    let strokes=[],drawing=false,pointerId=null;
    host.innerHTML='<svg class="ac-signature-pad" viewBox="0 0 480 160" aria-label="手写签名区域"><g></g></svg><div class="ac-signature-tools"><span class="ac-muted">请用鼠标或触屏手写签名</span><button type="button" class="ac-link" data-signature-clear>清除重写</button></div>';
    const svg=host.querySelector('svg'),g=svg.querySelector('g');
    const point=ev=>{const b=svg.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(480,(ev.clientX-b.left)*480/(b.width||480)))),Math.round(Math.max(0,Math.min(160,(ev.clientY-b.top)*160/(b.height||160))))];};
    const draw=()=>{g.innerHTML=strokes.map(s=>`<polyline points="${s.map(p=>p.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('');};
    svg.addEventListener('pointerdown',ev=>{if(drawing||ev.button>0)return;ev.preventDefault();drawing=true;pointerId=ev.pointerId;svg.setPointerCapture?.(pointerId);strokes.push([point(ev)]);draw();});
    svg.addEventListener('pointermove',ev=>{if(!drawing||ev.pointerId!==pointerId)return;strokes.at(-1).push(point(ev));draw();});
    const finish=ev=>{if(ev.pointerId!==pointerId)return;if(drawing&&ev.type==='pointerup')strokes.at(-1).push(point(ev));drawing=false;draw();};
    svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);svg.addEventListener('lostpointercapture',finish);
    const clear=()=>{strokes=[];drawing=false;g.innerHTML='';};host.querySelector('[data-signature-clear]').onclick=clear;
    return {value:()=>M.clone(strokes),clear};
  }
  function rehearsalDrawer(template,context){
    const R=window.ApprovalRuleRun,demo=M.clone(state),result=R.start(demo,template,context);
    if(result.errors.length){toast(result.errors[0]);return;}
    const run=result.run,rules=M.rulesFor(run.template),l=makeLayer('模拟审批办理','<p class="ac-muted">本次试用不提交业务申请；关闭后结束。模板和人员配置不会被改动。</p><div data-rehearsal></div>','<button class="btn btn-secondary" data-ac-close>结束试用</button>');
    const host=l.el.querySelector('[data-rehearsal]');let pad=null;
    const statuses={running:'待审批',paused:'人员异常，审批暂停',approved:'审批已通过',returned:'已退回申请人',rejected:'审批已拒绝',withdrawn:'申请已撤回'};
    const actions={approve:'同意',return:'退回',reject:'拒绝',handover:'交接',withdraw:'撤回',resubmit:'重新提交'};
    const candidates=()=>demo.people.filter(p=>M.eligible(demo,p.id,run.context.company)&&p.id!==run.context.applicant).map(p=>[p.id,p.name]);
    function render(){
      const s=R.current(run),pending=R.pending(run);
      host.innerHTML=`<div class="ac-rehearsal-status"><strong>${statuses[run.status]}</strong><span class="ac-muted">${e(M.companyName(run.context.company))} · 第 ${run.round} 次提交${s?' · '+e(s.node.title):''}</span></div>${errorsHTML(run.issue)}
      ${run.status==='running'?`<div class="ac-form">${field('以此审批人试办',select('actingPerson',pending.map(id=>[id,M.personName(demo,id)]),pending[0]))}${field('审批意见'+(rules.approveOpinionRequired?'（同意时必填）':'（同意时选填）'),'<textarea name="decisionOpinion" placeholder="退回或拒绝时必须填写原因"></textarea>')}${rules.signatureRequired?'<div class="ac-field"><span>手写签名（同意时必填）</span><div data-signature></div></div>':''}</div><div class="ac-actions ac-rehearsal-actions"><button type="button" class="btn btn-primary" data-decide="approve">同意</button>${rules.returnAllowed?'<button type="button" class="btn btn-secondary" data-decide="return">退回</button>':''}<button type="button" class="btn btn-secondary" data-decide="reject">拒绝</button>${rules.transferAllowed?'<button type="button" class="ac-link" data-transfer>转交</button>':''}</div><details class="ac-rehearsal-extra"><summary>异常试用</summary><button type="button" class="ac-link" data-depart>模拟当前审批人离职</button></details>`:''}
      ${run.status==='paused'?'<button type="button" class="btn btn-secondary" data-admin-handover>以审批管理员身份交接</button>':''}
      ${['running','paused'].includes(run.status)&&rules.withdrawAllowed?'<div class="ac-rehearsal-extra"><button type="button" class="ac-link" data-withdraw>以申请人身份撤回</button></div>':''}
      ${run.status==='returned'?'<div class="ac-rehearsal-extra"><button type="button" class="btn btn-secondary" data-resubmit>以申请人身份修改重提</button></div>':''}
      ${run.history.length?`<section class="ac-rehearsal-history"><h3>审批记录</h3>${run.history.map(h=>`<div class="ac-trial-step"><strong>${e(h.title||'申请处理')} · ${h.automatic?'免重复审批':actions[h.decision]}</strong><span>${e(h.person==='administrator'?'审批管理员':h.person?M.personName(demo,h.person):'系统')}${h.recipient?' → '+e(M.personName(demo,h.recipient)):''} · 第 ${h.round} 次提交</span><span>${e(h.opinion||'未填写意见')}</span>${h.reference?'<span>已保留原同意记录及其签名</span>':''}${R.validSignature(h.signature)?`<details class="ac-signature-record"><summary>查看签名</summary>${signatureSVG(h.signature)}</details>`:''}</div>`).join('')}</section>`:''}`;
      pad=host.querySelector('[data-signature]')?signaturePad(host.querySelector('[data-signature]')):null;
      host.querySelector('[name=actingPerson]')?.addEventListener('change',()=>{pad?.clear();host.querySelector('[name=decisionOpinion]').value='';});
    }
    function actionDrawer(kind){
      const admin=kind==='admin',withdraw=kind==='withdraw',f=makeLayer(withdraw?'撤回申请':admin?'审批异常交接':'转交审批',`<form class="ac-form">${withdraw?'':field('接替人',select('recipient',[['','请选择'],...candidates()],''))}${field(withdraw?'撤回原因':'交接原因','<textarea name="actionReason"></textarea>')}</form>`,'<button class="btn btn-secondary" data-ac-close>取消</button><button class="btn btn-primary" data-action-save>确认</button>');
      f.el.addEventListener('input',()=>f.dirty=true);f.el.querySelector('[data-action-save]').onclick=()=>{const reason=f.el.querySelector('[name=actionReason]').value,errors=withdraw?R.withdraw(run,reason):R.handover(demo,run,{recipient:f.el.querySelector('[name=recipient]').value,reason,administrator:admin,person:host.querySelector('[name=actingPerson]')?.value});showErrors(f.el.querySelector('[data-errors]'),errors);if(!errors.length){closeLayer(f,true);showErrors(l.el.querySelector('[data-errors]'),[]);render();}};
    }
    host.addEventListener('click',ev=>{
      const b=ev.target.closest('button');if(!b)return;
      if(b.dataset.decide){const errors=R.decide(demo,run,{person:host.querySelector('[name=actingPerson]').value,decision:b.dataset.decide,opinion:host.querySelector('[name=decisionOpinion]').value,signature:pad?.value()||[]});showErrors(l.el.querySelector('[data-errors]'),errors);if(!errors.length)render();}
      if(b.hasAttribute('data-transfer'))actionDrawer('transfer');
      if(b.hasAttribute('data-admin-handover'))actionDrawer('admin');
      if(b.hasAttribute('data-withdraw'))actionDrawer('withdraw');
      if(b.hasAttribute('data-depart')){const id=host.querySelector('[name=actingPerson]').value;demo.people.find(p=>p.id===id).active=false;R.refresh(demo,run);showErrors(l.el.querySelector('[data-errors]'),[]);render();}
      if(b.hasAttribute('data-resubmit')){
        const f=makeLayer('修改后重新提交',`<form class="ac-form">${M.scene(run.template.scene).conditions.includes('amount')?field('申请金额',input('amount',run.context.amount,'type="number" min="0" step="any"')):''}${M.scene(run.template.scene).conditions.includes('rate')?field('调价幅度绝对值（%）',input('rate',run.context.rate,'type="number" min="0" step="any"')):''}${field('重提说明','<textarea name="reason"></textarea>')}</form>`,'<button class="btn btn-secondary" data-ac-close>取消</button><button class="btn btn-primary" data-resubmit-save>重新提交</button>');
        f.el.addEventListener('input',()=>f.dirty=true);f.el.querySelector('[data-resubmit-save]').onclick=()=>{const values=Object.fromEntries(new FormData(f.el.querySelector('form'))),errors=values.reason.trim()?R.resubmit(demo,run,{...run.context,...values}):['请填写重提说明'];showErrors(f.el.querySelector('[data-errors]'),errors);if(!errors.length){closeLayer(f,true);render();}};
      }
    });render();
  }
  window.ApprovalConfigUI={mountConfig,mountEditor};
})();
