/* 复用合同模板列表、编辑及通知模板入口；供应商用途独立于销售合同。 */
(function(){
  'use strict';
  if(!location.pathname.includes('/admin/'))return;
  const T=window.SupplierContractTools, q=new URLSearchParams(location.search);
  if(location.pathname.endsWith('supplier-contract-template-edit.html')){if(!q.has('template'))q.set('action','new');location.replace('supplier-contract-templates.html?'+q.toString());return;}
  const e=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  const button=(label,act,primary=false)=>'<button type="button" class="btn '+(primary?'btn-primary':'btn-secondary')+'" data-st-action="'+act+'">'+label+'</button>';
  const field=(label,id,value='',type='text')=>'<div class="supplier-field"><label for="'+id+'">'+label+'</label><input class="form-control" id="'+id+'" type="'+type+'" value="'+e(value)+'"></div>';
  const checks=(label,name,values,selected)=>'<fieldset class="supplier-check-field supplier-full"><legend>'+label+'</legend><div class="supplier-checks">'+values.map(v=>'<label><input type="checkbox" name="'+name+'" value="'+e(v)+'"'+(selected.includes(v)?' checked':'')+'> '+e(v)+'</label>').join('')+'</div></fieldset>';
  const values=name=>Array.from(document.querySelectorAll('[name="'+name+'"]:checked')).map(x=>x.value);
  const section=(title,html)=>'<section class="supplier-form-section"><div class="drawer-section-head"><h3 class="drawer-section-title">'+title+'</h3></div>'+html+'</section>';
  const switcher='<section class="page-workbar"><h1 class="page-title">供应商协议模板</h1>'+button('临期通知模板','notice-edit')+'</section>';
  let draft,dirty=false,noticeMode=false,editorMode=false,sequence=0;
  function layer(title,content){$('stTitle').textContent=title;$('stContent').innerHTML=content;window.caesarUI.openLayer($('stLayer'));}
  function close(){if(dirty){ask(()=>{dirty=false;window.caesarUI.closeLayer($('stLayer'));});return;}window.caesarUI.closeLayer($('stLayer'));}
  function ask(fn){$('stConfirm').hidden=false;window.caesarUI.openLayer($('stConfirm'));$('stLeave').onclick=()=>{window.caesarUI.closeLayer($('stConfirm'));fn();};}
  function error(text){const el=$('stError');if(el){el.hidden=false;el.textContent=text;el.focus();}else window.caesarUI.toast(text);}
  function setupLayers(){document.body.insertAdjacentHTML('beforeend','<div id="stLayer" class="modal-overlay drawer-overlay" data-static="true" hidden aria-hidden="true"><section class="modal drawer-modal drawer-lg supplier-drawer" role="dialog" aria-modal="true" aria-labelledby="stTitle"><div class="modal-header"><h2 class="modal-title" id="stTitle"></h2><button class="modal-close" data-st-action="close" aria-label="关闭">×</button></div><div class="modal-body" id="stContent"></div><div class="modal-footer" id="stFooter">'+button('关闭','close')+'</div></section></div><div class="modal-overlay" id="stConfirm" data-static="true" hidden aria-hidden="true"><section class="modal modal-sm modal-confirm" role="dialog" aria-modal="true"><div class="modal-header"><h2 class="modal-title">放弃未保存的修改？</h2></div><div class="modal-body">当前内容未保存，确认离开吗？</div><div class="modal-footer">'+button('取消','stay')+'<button id="stLeave" class="btn btn-primary">确认离开</button></div></section></div>');}
  function list(){
    const main=document.getElementById('supplierTemplateHost');main.className='supplier-template-page';
    main.innerHTML=switcher+'<section class="list-surface" data-list-surface><section class="filter-card filter-card-compact list-surface-filter"><div class="list-surface-filter-actions list-filter-pinned-actions">'+button('新增模板','new',true)+'</div><div class="filter-row"><div class="filter-item"><input id="stSearch" aria-label="模板名称或版本" placeholder="模板名称／版本"></div><div class="filter-item filter-item-sm"><select id="stCategory" aria-label="供应商类型"><option value="">全部供应商类型</option>'+T.categories.map(c=>'<option>'+c+'</option>').join('')+'</select></div><div class="filter-item filter-item-sm"><select id="stState" aria-label="模板状态"><option value="">全部状态</option><option>草稿</option><option>启用</option><option>待审核</option><option>停用</option></select></div><div class="filter-actions">'+button('搜索','search')+button('重置','reset')+'</div></div></section><div class="table-wrap supplier-template-table"><table><colgroup><col><col class="st-type-col"><col class="st-company-col"><col class="st-state-col"><col class="st-owner-col"><col class="st-action-col"></colgroup><thead><tr><th>模板名称／版本</th><th>供应商类型</th><th>适用签约公司</th><th>状态</th><th>维护人</th><th class="st-sticky">操作</th></tr></thead><tbody id="stRows"></tbody></table></div><div class="pagination" id="stCount"></div></section>';
    rows();if(window.caesarRefreshListSurfaces)window.caesarRefreshListSurfaces();
  }
  function rows(){const filtered=T.templates.filter(t=>(!$('stSearch').value||[t.name,t.version,t.id].join(' ').includes($('stSearch').value.trim()))&&(!$('stCategory').value||t.categories.includes($('stCategory').value))&&(!$('stState').value||t.status===$('stState').value));$('stRows').innerHTML=filtered.map(t=>'<tr><td><div class="supplier-cell"><strong>'+e(t.name)+'</strong><small>'+e(t.version)+'</small></div></td><td>'+e(t.categories.join('、'))+'</td><td>'+e(t.companies.join('、'))+'</td><td><span class="tag '+(t.status==='启用'?'tag-green':t.status==='待审核'?'tag-orange':'tag-gray')+'">'+e(t.status)+'</span></td><td>'+e(t.owner)+'</td><td class="st-sticky"><div class="table-action"><button class="table-action-primary" data-st-view="'+t.id+'">查看</button><button type="button" data-st-edit="'+t.id+'">'+(t.status==='待审核'?'详情':t.status==='草稿'?'编辑':'修订')+'</button></div></td></tr>').join('')||'<tr><td colspan="6" class="supplier-empty">没有符合条件的模板</td></tr>';$('stCount').textContent='共'+filtered.length+'条';}
  function readEditor(){draft.name=$('stName').value.trim();draft.version=$('stVersion').value.trim();draft.categories=values('stCategories');draft.companies=values('stCompanies');draft.text=$('stText').value;return draft;}
  function editor(templateId){
    const source=T.templates.find(t=>t.id===templateId);
    if(templateId&&!source){window.caesarUI.toast('未找到供应商模板。');return;}
    editorMode=true;noticeMode=false;dirty=false;
    const locked=source&&source.status==='待审核',revision=source&&['启用','停用'].includes(source.status);
    draft=source?T.copy(source):{name:'',version:'V1.0',status:'草稿',categories:[],companies:[],text:T.defaultText,owner:'采购／法务'};
    if(!source||revision){do{draft.id='SUP-DRAFT-'+(++sequence);}while(T.templates.some(t=>t.id===draft.id));}
    if(revision){draft.parentId=source.id;draft.parentVersion=source.version;draft.version=source.version+'-修订1';draft.status='草稿';}
    $('stFooter').innerHTML=button(locked?'关闭':'取消','close')+button('预览','preview')+(!locked?button('保存草稿','save')+button('提交审核','submit',true):'');
    layer(!source?'新增供应商协议模板':locked?'查看供应商协议模板':revision?'修订供应商协议模板':'编辑供应商协议模板','<p id="stError" class="supplier-form-error" tabindex="-1" role="alert" hidden></p><fieldset class="supplier-template-fields" id="stFields"'+(locked?' disabled':'')+'>'+section('模板信息','<div class="supplier-form-grid">'+field('模板名称 *','stName',draft.name)+field('版本 *','stVersion',draft.version)+checks('适用供应商类型 *','stCategories',T.categories,draft.categories)+checks('适用签约公司 *','stCompanies',T.companies,draft.companies)+'</div>')+section('合同正文','<div class="supplier-template-variables">'+T.variables.map(v=>'<button type="button" class="btn btn-secondary" data-st-variable="'+v+'">'+(v==='合作内容'?'本次合作内容及地区':v)+'</button>').join('')+'</div><label for="stText" class="supplier-field-note">合作内容取自本次协议；各签约公司约定包含账期、币种、联系人和平台使用费。</label><textarea id="stText" class="form-control supplier-template-text" rows="18">'+e(draft.text)+'</textarea>')+'</fieldset>');
  }
  function preview(){readEditor();const problem=T.validateTemplate(draft);if(problem)throw Error(problem);$('stPreviewTitle').textContent='预览模板';$('stPreviewContent').innerHTML=section(e(draft.name)+' · '+e(draft.version),'<pre class="supplier-contract-text">'+e(draft.text)+'</pre>');window.caesarUI.openLayer($('stPreview'));}
  function saveTemplate(submit){
    readEditor();const problem=submit?T.validateTemplate(draft):!draft.name?'请填写模板名称。':'';if(problem)throw Error(problem);
    if(draft.parentVersion===draft.version)throw Error('修订请使用不同于原版本的版本号。');
    if(T.templates.some(t=>t.id!==draft.id&&t.name===draft.name&&t.version===draft.version))throw Error('已有同名同版本模板，请调整版本号。');
    draft.status=submit?'待审核':'草稿';draft.updated=new Date().toLocaleDateString('sv-SE');
    const index=T.templates.findIndex(t=>t.id===draft.id);if(index<0)T.templates.unshift(T.copy(draft));else T.templates[index]=T.copy(draft);
    dirty=false;window.caesarUI.closeLayer($('stLayer'));list();window.caesarUI.toast(submit?'模板送审申请已保存；审核渠道待配置，未发送。':'模板草稿已保存。');
  }
  function noticeEdit(){editorMode=false;noticeMode=true;draft=T.copy(T.notice);dirty=false;$('stFooter').innerHTML=button('取消','close')+button('预览','notice-preview')+button('保存','notice-save',true);layer('编辑通知模板','<p id="stError" class="supplier-form-error" hidden tabindex="-1" role="alert"></p>'+section('通知内容','<div class="supplier-form-grid">'+field('模板名称 *','stName',draft.name)+field('版本 *','stVersion',draft.version)+checks('可用渠道 *','stChannels',['站内信','企业微信'],draft.channels)+'</div><div class="supplier-template-variables">'+T.noticeVariables.map(v=>'<button class="btn btn-secondary" data-st-variable="'+v+'">'+(v==='合作内容'?'本次合作内容及地区':v)+'</button>').join('')+'</div><label for="stText">通知正文 *</label><textarea id="stText" class="form-control" rows="6">'+e(draft.text)+'</textarea>')+section('渠道状态','<p>企业微信：未接通</p><p>提前天数和接收人在各供应商协议中设置。</p>')+'<div id="stNoticePreview"></div>');}
  function noticeRead(){draft.name=$('stName').value.trim();draft.version=$('stVersion').value.trim();draft.channels=values('stChannels');draft.text=$('stText').value;const problem=!draft.name||!draft.version?'请填写模板名称和版本。':!draft.channels.length?'请选择可用渠道。':T.validateText(draft.text,T.noticeVariables,T.noticeVariables);if(problem)throw Error(problem);}
  function init(){
    setupLayers();document.body.insertAdjacentHTML('beforeend','<div id="stPreview" class="modal-overlay drawer-overlay" data-static="true" hidden aria-hidden="true"><section class="modal drawer-modal drawer-lg supplier-drawer" role="dialog" aria-modal="true" aria-labelledby="stPreviewTitle"><div class="modal-header"><h2 id="stPreviewTitle" class="modal-title">预览模板</h2><button type="button" class="modal-close" data-st-action="preview-close" aria-label="关闭预览">×</button></div><div id="stPreviewContent" class="modal-body"></div><div class="modal-footer">'+button('返回编辑','preview-close')+'</div></section></div>');
    $('stContent').addEventListener('input',()=>{if(editorMode||noticeMode)dirty=true;});$('stContent').addEventListener('change',()=>{if(editorMode||noticeMode)dirty=true;});
    document.addEventListener('click',ev=>{if(ev.target.closest('#stLayer .modal-close')){ev.preventDefault();ev.stopImmediatePropagation();close();}},true);list();if(q.get('action')==='new'||q.get('mode')==='create')editor();else if(q.get('template'))editor(q.get('template'));
    document.addEventListener('click',ev=>{const back=ev.target.closest('[data-st-back]');if(back&&dirty){ev.preventDefault();ask(()=>{dirty=false;location.href=back.href;});return;}
      const variable=ev.target.closest('[data-st-variable]');if(variable){const area=$('stText');area.setRangeText('{{'+variable.dataset.stVariable+'}}',area.selectionStart,area.selectionEnd,'end');area.focus();dirty=true;return;}
      const edit=ev.target.closest('[data-st-edit]');if(edit){editor(edit.dataset.stEdit);return;}
      const view=ev.target.closest('[data-st-view]');if(view){noticeMode=false;editorMode=false;dirty=false;$('stFooter').innerHTML=button('关闭','close');const t=T.templates.find(x=>x.id===view.dataset.stView);layer('查看模板',section(e(t.name)+' · '+e(t.version),'<p>适用供应商：'+e(t.categories.join('、'))+'</p><p>签约公司：'+e(t.companies.join('、'))+'</p><pre class="supplier-contract-text">'+e(t.text)+'</pre>'));return;}
      const node=ev.target.closest('[data-st-action]');if(!node)return;
      try{switch(node.dataset.stAction){
        case 'search':rows();break;case 'reset':$('stSearch').value='';$('stCategory').value='';$('stState').value='';rows();break;
        case 'close':close();break;case 'stay':window.caesarUI.closeLayer($('stConfirm'));break;
        case 'new':editor();break;case 'preview':preview();break;case 'preview-close':window.caesarUI.closeLayer($('stPreview'));break;
        case 'save':case 'submit':saveTemplate(node.dataset.stAction==='submit');break;
        case 'notice-edit':noticeEdit();break;
        case 'notice-preview':noticeRead();$('stNoticePreview').innerHTML=section('通知预览','<pre class="supplier-contract-text">'+e(draft.text.replace(/\{\{([^{}]+)\}\}/g,(_,key)=>({'我方签约主体':'福建凯撒','供应商全称':'深圳新启航国际旅行社有限公司','协议名称':'东南亚年度合作协议','协议编号':'AGR-NQ-FJ-001','截止日期':'2026-12-31','剩余天数':'7'}[key])))+'</pre><p class="supplier-field-note">仅预览，未发送。</p>');break;
        case 'notice-save':noticeRead();Object.assign(T.notice,T.copy(draft));dirty=false;window.caesarUI.closeLayer($('stLayer'));window.caesarUI.toast('通知模板已保存。');break;
      }}catch(err){error(err.message);}
    });
    window.addEventListener('beforeunload',ev=>{if(dirty){ev.preventDefault();ev.returnValue='';}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
