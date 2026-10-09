(function(){
  'use strict';
  const M=window.MiceModel,store=M.createStore(window.MicePrototypeSeed,window.sessionStorage,window.MicePrototypeDemo?.upgrade);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const businessLabel=value=>({'客户约定':'报价确认','活动变更':'项目团变更','取消活动':'取消项目团','订单价款变更':'订单金额变更'})[value]||value;
  const q=new URLSearchParams(location.search),rootUrl=new URL('../',document.currentScript.src);
  const url=(path,params={})=>{const u=new URL(path,rootUrl);Object.entries(params).forEach(([k,v])=>{if(v!==null&&v!==undefined&&v!=='')u.searchParams.set(k,String(v));});return u.href;};
  const tag=(s)=>'<span class="tag '+(['已完成','已确认','已结项','准备中'].includes(s)?'tag-green':['草稿','已取消','已终止'].includes(s)?'tag-gray':'tag-blue')+'">'+esc(s)+'</span>';
  const btn=(label,action,data={},primary=false)=>'<button type="button" class="btn '+(primary?'btn-primary':'btn-secondary')+'" data-mice-action="'+esc(action)+'" '+Object.entries(data).map(([k,v])=>'data-'+k+'="'+esc(v)+'"').join(' ')+'>'+esc(label)+'</button>';
  const link=(label,href)=>'<a class="link-primary" href="'+esc(href)+'">'+esc(label)+'</a>';
  const action=(label,act,id='')=>'<button type="button" class="mice-link" data-mice-action="'+esc(act)+'" data-id="'+esc(id)+'">'+esc(label)+'</button>';
  function table(heads,rows,classes='') {
    let main=heads[0]==='选择'?1:0;
    if(/^(日期|时间|行号|序号)/.test(heads[main])&&heads[main+1]!=='操作')main++;
    const state=heads.findIndex(h=>['状态','执行状态','项目状态'].includes(h));
    if(heads.includes('操作')&&state>main+1){const order=heads.map((h,i)=>i);order.splice(state,1);order.splice(main+1,0,state);heads=order.map(i=>heads[i]);rows=rows.map(r=>order.map(i=>r[i]));}
    const widths=heads.map((h,i)=>h==='操作'?168:h==='选择'?44:i===main?260:/日期|期间/.test(h)?240:160);
    const cellClass=(h,i)=>h==='操作'?'mice-actions':i===main?'mice-name-cell':'';
    return '<div class="table-wrap mice-table-wrap"><table style="min-width:'+Math.max(440,widths.reduce((a,b)=>a+b,0))+'px" class="mice-table '+classes+'"><colgroup>'+heads.map((h,i)=>'<col style="width:'+(i===main?'auto':widths[i]+'px')+'" class="'+(h==='操作'?'mice-actions-col':h==='选择'?'mice-select-col':i===main?'mice-name-col':'')+'">').join('')+'</colgroup><thead><tr>'+heads.map((h,i)=>'<th class="'+cellClass(h,i)+'">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((v,i)=>'<td class="'+cellClass(heads[i],i)+'">'+v+'</td>').join('')+'</tr>').join('')+(rows.length?'':'<tr><td colspan="'+heads.length+'" class="mice-empty">暂无符合条件的记录</td></tr>')+'</tbody></table></div>';
  }
  const lines=(a,b,c)=>'<span class="mice-main">'+a+'</span>'+(b?'<span class="mice-muted mice-line">'+b+'</span>':'')+(c?'<span class="mice-line">'+c+'</span>':'');
  const options=(values,current='',blank='请选择')=>(blank!==null?'<option value="">'+esc(blank)+'</option>':'')+values.map(v=>{const value=typeof v==='object'?v.value:v,label=typeof v==='object'?v.label:v;return '<option value="'+esc(value)+'"'+(String(current)===String(value)?' selected':'')+(v.disabled?' disabled':'')+'>'+esc(label)+'</option>';}).join('');
  function field(name,label,value='',opts={}){const attrs='id="mice-f-'+esc(name)+'" name="'+esc(name)+'" data-field="'+esc(name)+'"'+(opts.disabled?' disabled':'')+(opts.readonly?' readonly':'');let input=opts.options?'<select '+attrs+'>'+options(opts.options,value,opts.blank===undefined?'请选择':opts.blank)+'</select>':opts.type==='textarea'?'<textarea '+attrs+' rows="3">'+esc(value)+'</textarea>':'<input '+attrs+' type="'+esc(opts.type||'text')+'" value="'+esc(value)+'"'+(opts.type==='number'?' step="'+(opts.step||'0.01')+'"':'')+'>';return '<div class="form-group mice-field '+(opts.full?'mice-full':'')+'"><label for="mice-f-'+esc(name)+'">'+esc(label)+(opts.required?' <span class="mice-required">*</span>':'')+'</label>'+input+'<span class="mice-error" data-error="'+esc(name)+'"></span></div>';}
  const section=(title,html,actions='')=>'<section class="mice-section"><div class="drawer-section-head"><h3 class="drawer-section-title">'+esc(title)+'</h3>'+(actions?'<div class="mice-section-actions">'+actions+'</div>':'')+'</div>'+html+'</section>';
  const grid=html=>'<div class="mice-form-grid">'+html+'</div>';
  const summary=rows=>'<div class="mice-summary" style="--mice-summary-columns:'+(rows.length>4?3:Math.max(1,rows.length))+'">'+rows.map(([k,v])=>'<div><span class="mice-muted">'+esc(k)+'</span><strong>'+esc(v??'待确认')+'</strong></div>').join('')+'</div>';
  const toast=(text,type='success')=>window.caesarUI?.toast?window.caesarUI.toast(text,{type}):console.info(text);
  let openDialog=null,confirmLayer=null;
  function confirm(title,body,onYes,label='确认'){if(confirmLayer)confirmLayer.remove();const el=document.createElement('div');el.className='modal-overlay show mice-confirm';el.innerHTML='<div class="modal modal-sm modal-confirm" role="dialog" aria-modal="true"><div class="modal-header"><div class="modal-title">'+esc(title)+'</div></div><div class="modal-body">'+esc(body)+'</div><div class="modal-footer"><button class="btn btn-secondary" data-no>取消</button><button class="btn btn-primary" data-yes>'+esc(label)+'</button></div></div>';document.body.append(el);confirmLayer=el;el.querySelector('[data-no]').onclick=()=>{el.remove();confirmLayer=null;};el.querySelector('[data-yes]').onclick=()=>{el.remove();confirmLayer=null;onYes();};el.querySelector('[data-no]').focus();}
  function drawer(title,html,{buttons=[['保存','save']],submit,onOpen,onBack,backLabel='返回费用详情',wide=false,readonly=false}={}){
    if(openDialog)openDialog.remove();const el=document.createElement('div');el.className='modal-overlay drawer-overlay show mice-drawer-overlay';el.innerHTML='<div class="modal drawer-modal '+(wide?'drawer-batch drawer-xl mice-drawer-wide':readonly?'drawer-preview drawer-md mice-drawer':'drawer-edit drawer-md mice-drawer')+'" role="dialog" aria-modal="true" aria-labelledby="mice-dialog-title"><div class="modal-header"><div class="modal-title" id="mice-dialog-title">'+esc(title)+'</div><button type="button" class="modal-close mice-close" aria-label="关闭">×</button></div><form id="mice-form" novalidate><div class="modal-body">'+(onBack?'<button type="button" class="mice-drawer-back mice-link" data-mice-back>← '+esc(backLabel)+'</button>':'')+layout(html,{drawer:true})+'<div class="mice-error mice-submit-error" role="alert"></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-mice-close>'+ (readonly?'关闭':'取消')+'</button>'+buttons.map(([label,value],i)=>'<button class="btn '+(i===buttons.length-1?'btn-primary':'btn-secondary')+'" type="submit" name="intent" value="'+esc(value)+'">'+esc(label)+'</button>').join('')+'</div></form></div>';document.body.append(el);openDialog=el;const form=el.querySelector('form');
    const read=()=>Object.fromEntries(new FormData(form).entries());let baseline=JSON.stringify(read());let dirty=false;form.addEventListener('input',()=>dirty=true);form.addEventListener('change',()=>dirty=true);
    const close=(force=false)=>{if(!force&&!readonly&&(dirty||JSON.stringify(read())!==baseline)){confirm('放弃修改','当前内容未保存，确认离开吗？',()=>close(true),'放弃修改');return;}el.classList.remove('show');el.remove();if(openDialog===el)openDialog=null;};
    if(onBack)el.querySelector('[data-mice-back]').onclick=()=>{const leave=()=>{close(true);onBack();};if(!readonly&&(dirty||JSON.stringify(read())!==baseline))confirm('放弃修改','当前内容未保存，确认返回费用详情吗？',leave,'放弃修改');else leave();};
    const errors=(map)=>{el.querySelectorAll('[data-error]').forEach(x=>x.textContent='');el.querySelector('.mice-submit-error').textContent='';for(const [k,v]of Object.entries(map)){const node=el.querySelector('[data-error="'+CSS.escape(k)+'"]');if(node)node.textContent=v;else el.querySelector('.mice-submit-error').textContent+=v+'；';}const first=Object.keys(map)[0];if(first)el.querySelector('[data-field="'+CSS.escape(first)+'"]')?.focus();};
    el.querySelector('.mice-close').onclick=e=>{e.stopImmediatePropagation();close();};el.querySelector('[data-mice-close]').onclick=()=>close();el.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const nodes=[...el.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.getClientRects().length);if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}};
    form.onsubmit=async e=>{e.preventDefault();if(form.dataset.busy)return;form.dataset.busy='1';try{await submit?.(read(),e.submitter?.value||'save',{el,form,close:()=>close(true),errors,read});}catch(error){errors({_submit:error.message});}finally{delete form.dataset.busy;}};
    onOpen?.({el,form,errors,read,close:()=>close(true),setClean:()=>{dirty=false;baseline=JSON.stringify(read());}});setTimeout(()=>el.querySelector('input:not([readonly]),select,textarea,button')?.focus(),100);return {el,form,errors,close:()=>close(true),read};
  }
  function download(name,content,type='text/csv;charset=utf-8'){const href=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=href;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(href),5000);}
  const actions={};document.addEventListener('click',e=>{const b=e.target.closest('[data-mice-action]');if(!b)return;const fn=actions[b.dataset.miceAction];if(fn){e.preventDefault();fn(b.dataset,b);}});
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn();}
  function mount(title){let main=document.getElementById('mice-app');if(!main){main=document.createElement('main');main.id='mice-app';main.className='mice-workspace';const content=document.querySelector('.content')||document.body;content.prepend(main);}document.title=title+' - 凯撒旅游';return main;}
  function pageHead(title,buttons='',back=''){return '<section class="'+(back?'page-workbar':'list-page-head')+'"><div class="page-title-row">'+(back?'<a class="page-back-link" href="'+esc(back)+'">返回</a>':'')+'<h1 class="page-title">'+esc(title)+'</h1></div><div class="btn-group">'+buttons+'</div></section>';}
  function tabs(items,active,action='tab'){return '<div class="mice-tabs tab-bar" role="tablist">'+items.map(([id,label])=>'<button type="button" role="tab" aria-selected="'+(active===id)+'" class="mice-tab tab-item '+(active===id?'active':'')+'" data-mice-action="'+esc(action)+'" data-id="'+id+'">'+esc(label)+'</button>').join('')+'</div>';}
  function listHead(title,buttons='',back='') {return '<div class="mice-list-head" aria-label="'+esc(title)+'">'+(back?'<a class="btn btn-secondary" href="'+esc(back)+'">返回</a>':'')+buttons+'</div>';}
  function hero({name,code,status,fields,type='project'}) {return '<section class="mice-hero mice-hero-'+type+'"><div class="mice-hero-heading"><div class="mice-hero-code">'+esc(code)+'</div>'+tag(status)+'</div><h2 class="mice-hero-title">'+esc(name)+'</h2>'+summary(fields)+'</section>';}
  // Prepare shared business markup before binding events. Query fields, tabs and sections
  // keep their IDs and action attributes, so changing layout never changes the workflow.
  function layout(html,{drawer=false}={}) {
    const template=document.createElement('template');template.innerHTML=html;const root=template.content;
    root.querySelectorAll('.list-surface').forEach(n=>{n.classList.remove('list-surface');n.classList.add('mice-list-surface');});
    root.querySelectorAll('.mice-filters').forEach(bar=>{
      bar.classList.remove('filter-card');bar.classList.add('mice-filter-bar');
      const controls=[...bar.children];
      controls.forEach(n=>{
        if(n.matches('input,select')) {const item=document.createElement('div');item.className='mice-filter-item';n.before(item);item.append(n);if(!n.getAttribute('aria-label'))n.setAttribute('aria-label',n.placeholder||n.options?.[0]?.text||n.name||'筛选条件');}
        if(n.matches('button')&&/^(搜索|查询|重置)$/.test(n.textContent.trim())) {let group=bar.querySelector(':scope > .mice-filter-query');if(!group){group=document.createElement('div');group.className='mice-filter-query';n.before(group);}group.append(n);n.classList.remove('btn-primary');n.classList.add('btn-secondary');if(n.textContent.trim()!=='重置')n.classList.add('mice-query-button');}
      });
      const dates=[...bar.querySelectorAll(':scope > .mice-filter-item > input[type=date]')];
      if(dates.length===2) {const group=document.createElement('div');group.className='mice-date-range';dates[0].parentElement.before(group);group.append(dates[0].parentElement);const sep=document.createElement('span');sep.textContent='至';group.append(sep,dates[1].parentElement);dates[0].setAttribute('aria-label','开始日期');dates[1].setAttribute('aria-label','结束日期');}
    });
    root.querySelectorAll('.mice-list-head').forEach(head=>{
      let bar=root.querySelector('.mice-filter-bar');if(!bar){bar=document.createElement('div');bar.className='mice-filter-bar mice-filters';head.after(bar);const table=root.querySelector('.mice-table');if(table){const states=[...new Set([...table.querySelectorAll('tbody .tag')].map(n=>n.textContent.trim()))];bar.innerHTML='<div class="mice-filter-item"><input type="search" data-mice-list-query aria-label="编号、客户或供应商" placeholder="编号／客户／供应商"></div>'+(states.length?'<div class="mice-filter-item"><select data-mice-list-status aria-label="状态">'+options(states,'','全部状态')+'</select></div>':'')+'<div class="mice-filter-query"><button type="button" class="btn btn-secondary mice-query-button" data-mice-list-search>查询</button><button type="button" class="btn btn-secondary" data-mice-list-reset>重置</button></div>';}}
      if(head.children.length){const actions=document.createElement('div');actions.className='mice-filter-actions';actions.append(...head.children);bar.append(actions);}head.remove();if(!bar.children.length)bar.remove();
    });
    root.querySelectorAll('.mice-tabs').forEach(tabs=>{const body=tabs.nextElementSibling;if(!body?.matches('.mice-tab-content'))return;const card=document.createElement('section');card.className='card mice-detail-card';tabs.before(card);card.append(tabs,body);body.setAttribute('role','tabpanel');});
    root.querySelectorAll('.mice-section').forEach(section=>{const head=section.querySelector(':scope > .drawer-section-head'),toolbar=section.querySelector(':scope > .mice-toolbar');if(!head||!toolbar||toolbar.previousElementSibling!==head)return;const actions=[...toolbar.children].filter(n=>n.matches('button,a')||n.matches('div')&&n.querySelector('button,a'));if(actions.length){const group=document.createElement('div');group.className='mice-section-actions';group.append(...actions);head.append(group);}if(!toolbar.childElementCount&&!toolbar.textContent.trim())toolbar.remove();});
    root.querySelectorAll('.mice-section').forEach(section=>{const head=section.querySelector(':scope > .drawer-section-head'),buttons=[...section.querySelectorAll(':scope > button')];if(head&&buttons.length){const group=document.createElement('div');group.className='mice-section-actions';group.append(...buttons);head.append(group);}});
    if(drawer){
      root.querySelectorAll('.mice-section').forEach(n=>n.classList.add('drawer-section'));
      root.querySelectorAll('.mice-form-grid').forEach(n=>n.classList.add('form-grid'));
      root.querySelectorAll('.mice-field').forEach(n=>{
        n.querySelector('label')?.classList.add('form-label');
        n.querySelectorAll('input,select,textarea').forEach(control=>control.classList.add('form-control'));
        const textarea=n.querySelector('textarea');if(textarea?.rows===3)textarea.rows=4;
      });
    }else [...root.children].filter(n=>n.matches('.mice-section')).forEach(n=>n.classList.add('mice-panel'));
    return template.innerHTML;
  }
  function render(el,html) {
    el.innerHTML=layout(html);
    const query=el.querySelector('[data-mice-list-query]');if(!query)return;
    const status=el.querySelector('[data-mice-list-status]'),body=el.querySelector('.mice-table tbody');
    const apply=()=>{const word=query.value.trim().toLowerCase(),state=status?.value;let visible=0;body.querySelector('[data-filter-empty]')?.remove();body.querySelectorAll('tr').forEach(row=>{if(row.querySelector('.mice-empty'))return;row.hidden=Boolean(word&&!row.textContent.toLowerCase().includes(word)||state&&![...row.querySelectorAll('.tag')].some(n=>n.textContent.trim()===state));if(!row.hidden)visible++;});if(!visible&&!body.querySelector('.mice-empty')){const row=document.createElement('tr');row.dataset.filterEmpty='';row.innerHTML='<td class="mice-empty" colspan="'+body.closest('table').querySelectorAll('th').length+'">暂无符合条件的记录</td>';body.append(row);}};
    el.querySelector('[data-mice-list-search]').onclick=apply;
    el.querySelector('[data-mice-list-reset]').onclick=()=>{query.value='';if(status)status.value='';apply();};
    query.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();apply();}};
  }
  function takeover(title){const content=document.querySelector('.content')||document.body;[...content.children].forEach(n=>{if(!['mice-app','mice-role-bar'].includes(n.id)&&!['SCRIPT','STYLE'].includes(n.tagName)){n.style.display='none';n.dataset.miceReplaced='1';}});return mount(title);}
  function missing(label='项目'){const el=mount(label);el.innerHTML=pageHead(label,'',url('merchant/tour/product-custom-list.html'))+'<div class="card mice-empty">未找到该'+esc(label)+'或无权查看，请返回列表选择。</div>';}
  function settlementUrl(r){
    const a=store.data.activities.find(a=>a.projectId===r.projectId&&(r.activities?.includes(a.id)||a.id===r.contextActivityId));
    return url('merchant/tour/schedules-detail.html',{mice:1,id:a?.id||'UNKNOWN',projectId:r.projectId,tab:'settlement',settlementId:r.id});
  }
  window.MiceUI={M,store,esc,businessLabel,q,rootUrl,url,settlementUrl,tag,btn,action,link,table,lines,options,field,section,grid,summary,toast,confirm,drawer,download,actions,ready,mount,takeover,pageHead,listHead,hero,layout,render,tabs,missing,get dialog(){return openDialog;}};
})();
