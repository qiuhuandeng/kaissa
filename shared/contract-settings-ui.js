(function () {
  'use strict';
  const D=window.ContractSettings, C=window.ContractCatalog, F=window.ContractTemplateFields;
  if (!D) return;
  const S=D.newState(), day='2026-09-28';
  window.ContractSettingsSession=S;
  const groupSettings=/(?:^|\/)admin\//.test(location.pathname);
  const merchantCompany=()=>{const name=window.caesarCompanyContext?.().company;return S.companies.find(c=>c.fullName===name||c.name===name)?.id;};
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const company=id=>S.companies.find(c=>c.id===id);
  const button=(text,act,value='',primary=false)=>`<button type="button" class="${primary?'btn btn-primary':['查询','重置','取消','保存草稿','预览合同','预览检查','核对配置','查看结果样例'].includes(text)?'btn btn-secondary':'btn-text'}" data-cs-action="${act}" data-cs-value="${e(value)}">${e(text)}</button>`;
  const badge=(text,ok=false)=>`<span class="tag ${ok?'tag-green':'tag-orange'}">${e(text)}</span>`;
  const demo='<span class="cs-demo-label">配置演示 · 刷新恢复 · 未连接平台</span>';
  const heading=(title,actions='')=>`<div class="cs-bar"><h2>${e(title)}</h2><div class="btn-group">${actions}</div></div>`;
  function field(name,label,value,options=null,type='text',wide=false) {
    const attrs=`name="${e(name)}" id="cs-${e(name)}" class="form-control"`;
    let html=options?`<select ${attrs}>${options.map(x=>{const a=typeof x==='string'?{value:x,label:x}:x;return `<option value="${e(a.value)}" ${String(a.value)===String(value)?'selected':''} ${a.disabled?'disabled':''}>${e(a.label)}</option>`;}).join('')}</select>`:type==='textarea'?`<textarea ${attrs} rows="3">${e(value)}</textarea>`:`<input ${attrs} type="${type}" value="${e(value)}" autocomplete="off">`;
    return `<div class="form-group ${wide?'cs-wide':''}"><label class="form-label" for="cs-${e(name)}">${e(label)}</label>${html}</div>`;
  }
  const checks=(name,label,values,selected)=>`<div class="form-group cs-wide"><span class="form-label">${e(label)}</span><div class="cs-checks">${values.map(x=>{const a=typeof x==='string'?{value:x,label:x}:x;return `<label><input type="checkbox" name="${e(name)}" value="${e(a.value)}" ${selected.includes(a.value)?'checked':''}>${e(a.label)}</label>`;}).join('')}</div></div>`;
  const read=(root,name)=>q(`[name="${name}"]`,root)?.value.trim()||'';
  const readChecks=(root,name)=>qa(`[name="${name}"]:checked`,root).map(n=>n.value);
  const ro=items=>`<dl class="cs-readonly">${items.map(([k,v])=>`<div><dt>${e(k)}</dt><dd>${e(v||'待填写')}</dd></div>`).join('')}</dl>`;
  const result=(node,issues,ok)=>{node.textContent=issues.length?issues.join('；'):ok;node.className=issues.length?'cs-error':'cs-result';};
  function table(headers,widths,rows) {return `<div class="table-wrap cs-table"><table style="--cs-table-min:${widths.reduce((sum,w)=>sum+(w||220),140)}px"><colgroup>${widths.map(w=>`<col ${w?`style="width:${w}px"`:''}>`).join('')}<col style="width:140px;min-width:140px;max-width:140px"></colgroup><thead><tr>${headers.map(h=>`<th>${e(h)}</th>`).join('')}<th class="cs-actions">操作</th></tr></thead><tbody>${rows||`<tr><td colspan="${headers.length+1}">暂无符合条件的记录</td></tr>`}</tbody></table></div>`;}
  function log(step,object,state,detail) {S.logs.unshift({time:new Date().toLocaleTimeString('zh-CN'),company:object,step,state,detail});}
  const actions={};
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-cs-action]');
    if (!b || b.disabled) return;
    const fn=actions[b.dataset.csAction];
    if (fn) {event.preventDefault();fn(b.dataset.csValue,b);}
  });
  let modal=null,modalDirty=false;
  function close(force=false) {
    if (!modal) return true;
    if (!force && modalDirty && !window.confirm('当前内容未保存，确认离开吗？')) return false;
    const old=modal; modal=null;modalDirty=false;
    if (window.caesarUI?.closeLayer) window.caesarUI.closeLayer(old); else old.classList.remove('show');
    setTimeout(()=>old.remove(),260); return true;
  }
  actions.close=()=>close();
  function drawer(title,body,onSave,label='保存',extra='') {
    if (!close()) return;
    modal=document.createElement('div');modal.className='modal-overlay drawer-overlay cs-drawer';modal.setAttribute('aria-hidden','false');
    modal.innerHTML=`<section class="modal drawer-modal" role="dialog" aria-modal="true" aria-label="${e(title)}"><div class="modal-header"><h2 class="modal-title">${e(title)}</h2>${button('×','close')}</div><div class="modal-body contract-settings">${demo}<div style="margin-top:16px">${body}</div><div data-cs-error role="status"></div></div><div class="modal-footer">${button('取消','close')}${extra}${onSave?button(label,'save-drawer','',true):''}</div></section>`;
    document.body.appendChild(modal);modalDirty=false;
    const markDirty=ev=>{if(!ev.target.closest('[data-cs-preview-only]'))modalDirty=true;};
    modal.addEventListener('input',markDirty);modal.addEventListener('change',markDirty);
    modal.addEventListener('click',ev=>{if(ev.target===modal){ev.stopPropagation();close();}});
    if (window.caesarUI?.openLayer) window.caesarUI.openLayer(modal); else modal.classList.add('show');
    actions['save-drawer']=()=>onSave?.(modal);
    return modal;
  }
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&modal){ev.preventDefault();ev.stopImmediatePropagation();close();}},true);
  const err=(r,issues)=>{result(q('[data-cs-error]',r),issues,'');return issues.length>0;};

  function mountConfig(type,host){
    window.ContractAdminConfig.mount(type,host,{D,S,e,q,qa,field,checks,read,readChecks,ro,button,table,drawer,close,err,actions,day});
  }
  function initInterface(host){mountConfig('interface',host);}

  const provinces=['全国','北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆'];
  const businesses=['参团游','邮轮','专列','自由行','研学','单项服务','MICE'];
  function templateRequirements(t) {
    const sources={'产品方案':'产品资料带入，签约时核对','团期':'已确认的团期安排带入','订单':'订单资料带入','客户确认':'合同准备中向客户确认','合同经办人':'合同准备中填写或补充','签约公司':'公司资料带入'};
    const manual=new Set(['formation-0','studyFormation-0','pooling-0','other-0']);
    const fields=[
      {group:'签约旅行社',name:'公司名称、旅行社许可证号',condition:'必填',source:'公司资料带入'},
      {group:'签约旅行社',name:'签约地址、联系电话',condition:'必填',source:'公司资料带入'},
      ...C.fields(t.profile).filter(f=>f.owner!=='法务模板'&&f.id!=='other-2').map(f=>({...f,source:manual.has(f.id)?'合同准备中核对本次约定':sources[f.owner]||'合同准备中填写'})),
      ...t.attachments.map(name=>({group:'签约附件',name,condition:'必需附件',source:['企业授权书'].includes(name)?'合同准备中上传':'已有资料带入，合同准备中核对'}))
    ];
    let group='';
    return `<div class="table-wrap cs-requirements-table"><table aria-label="合同填写项"><colgroup><col class="cs-requirement-name"><col class="cs-requirement-condition"><col class="cs-requirement-source"></colgroup><thead><tr><th>合同填写项</th><th>填写要求</th><th>资料来源／填写位置</th></tr></thead><tbody>${fields.map(f=>{const title=group!==f.group?`<tr class="cs-requirements-group"><th scope="rowgroup" colspan="3">${e(f.group)}</th></tr>`:'';group=f.group;return `${title}<tr data-contract-requirement><td>${e(f.name)}</td><td>${e(f.condition)}</td><td>${e(f.source)}</td></tr>`;}).join('')}</tbody></table></div>`;
  }
  function fieldConfiguration(t,readonly=false) {
    if(!F)return templateRequirements(t);
    const rows=F.rows(t),normal=rows.filter(r=>r.spec.type!=='table'),tables=rows.filter(r=>r.spec.type==='table');
    const operation=f=>readonly?'':`<td class="cs-actions"><div>${button('配置','configure-content',f.id)}${button('正文','locate-content',f.id)}</div></td>`;
    const grid=(title,headers,body,kind)=>`<h4 class="cs-config-heading">${title}</h4><div class="table-wrap cs-content-config cs-${kind}-config"><table aria-label="${title}"><colgroup><col style="width:190px">${kind==='ordinary'?'<col style="width:120px">':''}<col>${kind==='ordinary'?'<col style="width:150px">':'<col style="width:250px">'}${readonly?'':'<col class="cs-config-action-col">'}</colgroup><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}${readonly?'':'<th class="cs-actions">操作</th>'}</tr></thead><tbody>${body}</tbody></table></div>`;
    return grid('普通填写项',['合同填写项','填写方式','对应资料／内容','填写条件'],normal.map(({spec:s,config:f})=>`<tr data-cf-name="${e(f.key)}" data-content-id="${e(f.id)}"><td><strong>${e(f.name)}</strong></td><td>${e(f.mode==='input'&&s.choices?'签约时选择':F.modes[f.mode]||'待配置')}</td><td><span class="cs-config-value" title="${e(F.sourceLabel(f))}">${e(F.sourceLabel(f))}</span></td><td>${e(F.conditions[f.condition])}</td>${operation(f)}</tr>`).join(''),'ordinary')+
    (tables.length?grid('明细表',['合同里的表格','整组资料来源','表格列'],tables.map(({config:f})=>`<tr data-cf-name="${e(f.key)}" data-content-id="${e(f.id)}"><td><strong>${e(f.name)}</strong></td><td>${e(F.sourceLabel(f))}</td><td>${e(f.columns.map(c=>c.label).join('、'))}</td>${operation(f)}</tr>`).join(''),'table'):'');
  }
  function captureFields(root,t){return F.reconcile(t);}
  function templateForm(t,editorState,options) {
    const p=C.get(t.profile),custom=t.textSource==='custom',customProvince=!custom&&p.custom&&p.category==='省级示范';
    return `<details class="cs-section ce-basics" ${t.id==='NEW'?'open':''}><summary><span><strong>${e(t.name||'新合同模板')}</strong><span class="ce-caption">${e(D.providerName(t.provider))} · ${e(D.generationNames[t.generation])} · ${e(t.business+' / '+t.range)}</span></span><span>模板信息</span></summary><div class="cs-form cs-inline">${field('name','模板名称',t.name)}${field('generation','文书来源',t.generation||'platform',[{value:'platform',label:'使用平台模板'},{value:'file',label:'制作公司文书'},{value:'manual',label:'到平台办理'}])}${field('provider','签署平台',t.provider||'12301',D.providers.map(p=>({value:p.id,label:p.name})))}${field('profile',t.generation==='file'?'采用业务结构':'采用的合同文本',t.profile,C.profiles.map(p=>({value:p.id,label:p.name})))}${field('business','适用业务',t.business,p.business)}${field('range','旅游范围',t.range,p.ranges)}${customProvince?field('province','适用省份',t.province,[{value:'',label:'请选择'},...provinces.filter(x=>x!=='全国')]):''}${checks('companies','适用签约公司',S.companies.map(c=>({value:c.id,label:c.name})),t.companies)}${field('start','生效日期',t.start,null,'date')}${field('end','截止日期',t.end,null,'date')}</div></details><div id="cs-template-workspace">${window.ContractTemplateWorkspace.render(t,editorState,options)}</div>`;
  }
  function readTemplate(root,t) {
    let n={...t};['name','business','range','start','end','clauses','conditional','provider','generation','textSource'].forEach(k=>{if(q(`[name="${k}"]`,root))n[k]=read(root,k);});
    const p=C.get(t.profile);if(q('[name=companies]',root))n.companies=readChecks(root,'companies');if(q('[name=attachments]',root))n.attachments=readChecks(root,'attachments');
    n.category=n.textSource==='custom'?'企业自有':p.category;n.province=n.textSource==='custom'?'全国':p.custom&&p.category==='省级示范'?read(root,'province'):p.province;
    n.directoryName=n.textSource==='custom'||p.custom?n.name:p.name;n.textReference=n.directoryName+' · '+n.version;
    if((n.textSource==='custom'||p.custom)&&q('[name=bodyText]',root))n=F.updateBody(n,read(root,'bodyText'));
    if(F)n.fieldConfig=captureFields(root,n);
    n.signing=D.reconcileSigning(n);
    return F.normalize(n);
  }
  function preview(t) {return window.ContractTemplateText?ContractTemplateText.plain(t):`${t.name} ${t.version}`;}
  function initTemplates(host,editor) {
    if(!groupSettings){initTemplateLibrary(host);return;}
    if(new URLSearchParams(location.search).get('purpose')==='supplier'){host.innerHTML='<p>供应商协议模板由集团统一维护。</p><a href="../resource/suppliers.html">返回本公司供应商</a>';return;}
    if(editor){initTemplateEditor(host);return;}
    let state='全部',keyword='',business='全部',range='全部',category='全部',provider='';
    function render(){
      host.innerHTML=`<div class="cs-bar">${demo}<a class="btn btn-primary" href="contract-template-edit.html?mode=create">新增模板</a></div><div class="cs-filters"><input class="form-control" id="cs-template-keyword" aria-label="模板名称或版本" placeholder="模板名称／版本" value="${e(keyword)}"><select class="form-control" id="cs-template-business" aria-label="产品类型">${['全部',...businesses].map(x=>`<option value="${e(x)}" ${x===business?'selected':''}>${x==='全部'?'全部类型':e(x)}</option>`).join('')}</select><select class="form-control" id="cs-template-range" aria-label="旅游范围">${['全部','境内','出境','赴台'].map(x=>`<option value="${e(x)}" ${x===range?'selected':''}>${x==='全部'?'全部范围':e(x)}</option>`).join('')}</select><select class="form-control" id="cs-template-category" aria-label="示范文本类别">${['全部','全国示范','省级示范','推荐文本','企业自有'].map(x=>`<option value="${e(x)}" ${x===category?'selected':''}>${x==='全部'?'全部文本':e(x)}</option>`).join('')}</select><select class="form-control" id="cs-template-provider" aria-label="签署平台"><option value="">全部平台</option>${D.providers.map(p=>`<option value="${p.id}" ${p.id===provider?'selected':''}>${e(p.name)}</option>`).join('')}</select><select class="form-control" id="cs-template-status-filter" aria-label="模板状态">${['全部','启用','草稿','待审核','停用'].map(x=>`<option value="${x}" ${x===state?'selected':''}>${x==='全部'?'全部状态':x}</option>`).join('')}</select>${button('查询','filter-templates')}${button('重置','reset-templates')}</div>`;
      const rows=S.templates.filter(t=>(state==='全部'||state===t.status)&&(business==='全部'||t.business===business)&&(range==='全部'||t.range===range)&&(category==='全部'||t.category===category)&&(!provider||t.provider===provider)&&(t.name+t.version).includes(keyword));
      host.insertAdjacentHTML('beforeend',table(['模板名称／版本','业务／文书','适用公司','签署平台','维护人'],[null,150,180,160,150],rows.map(t=>`<tr><td><strong>${e(t.name)}</strong><span class="cs-sub">${e(t.version)} · ${e(t.status)}</span></td><td><strong>${e(t.business)} · ${e(t.range)}</strong><span class="cs-sub">${e(t.category==='省级示范'?(t.province||'省份待选')+'示范':t.document)}</span></td><td>${e(t.companies.map(id=>company(id)?.name).join('、'))}</td><td>${e(D.providerName(t.provider))}</td><td>${e(t.owner)}</td><td class="cs-actions"><div>${button('详情','template-detail',t.id)}<a href="contract-template-edit.html?template=${encodeURIComponent(t.id)}&mode=edit">${t.status==='启用'?'修订':'编辑'}</a></div></td></tr>`).join('')));
    }
    actions['filter-templates']=()=>{keyword=q('#cs-template-keyword').value.trim();business=q('#cs-template-business').value;range=q('#cs-template-range').value;category=q('#cs-template-category').value;state=q('#cs-template-status-filter').value;provider=q('#cs-template-provider').value;render();};actions['reset-templates']=()=>{keyword='';business='全部';range='全部';category='全部';state='全部';provider='';render();};
    actions['template-detail']=id=>{const t=S.templates.find(x=>x.id===id);drawer(t.name,`<div class="cs-result">${e(D.templateIssues(t,S.companies,day).join('；')||'示例资料检查通过；真实平台能力未验证')}</div>`+templateViewBody(t),t.status==='启用'?()=>{if(!confirm('停用后不再用于新合同，历史文件保留。确认停用？'))return;t.status='停用';close(true);render();}:null,'停用模板');};
    render();
  }
  function templateViewBody(t) {
    return `<section class="cs-section">${ro([['模板版本',t.version],['签署平台',D.providerName(t.provider)],['文书生成',D.generationNames[t.generation]],['签署顺序',t.signing?.order],['状态',t.status],['适用业务',t.business+' · '+t.range],['客户类型',t.customer],['适用公司',t.companies.map(id=>company(id)?.name).join('、')],['有效期',t.start+' 至 '+t.end],['必要附件',t.attachments.join('、')],['条件附件',t.conditional||'无']])}</section><section class="cs-section"><h3>合同填写项</h3>${F?fieldConfiguration(t,true):templateRequirements(t)}</section><section class="cs-section"><h3>合同正文</h3><div class="cs-document">${e(preview(t))}</div></section>`;
  }
  function initTemplateLibrary(host) {
    let keyword='',business='全部';
    const render=()=>{
      const id=merchantCompany(),c=company(id),rows=S.templates.filter(t=>t.companies.includes(id)&&t.status==='启用'&&(business==='全部'||t.business===business)&&t.name.includes(keyword));
      host.innerHTML=`<div class="cs-bar"><span>${e(c?.name||'当前公司未维护合同资料')} · 模板只读查看</span>${demo}</div><p class="cs-hint">合同模板和公司规则由集团合同管理员维护。</p><div class="cs-filters"><input id="cs-library-keyword" class="form-control" placeholder="模板名称" value="${e(keyword)}"><select id="cs-library-business" class="form-control" aria-label="适用业务">${['全部',...businesses].map(x=>`<option ${business===x?'selected':''}>${e(x)}</option>`).join('')}</select>${button('查询','filter-library')}${button('重置','reset-library')}</div>${table(['模板名称／版本','适用业务','文本类别','必要附件'],[null,160,160,220],rows.map(t=>`<tr><td><strong>${e(t.name)}</strong><span class="cs-sub">${e(t.version)}</span></td><td>${e(t.business+' · '+t.range)}</td><td>${e(t.category)}</td><td>${e(t.attachments.join('、'))}</td><td class="cs-actions"><div>${button('查看','view-library',t.id)}</div></td></tr>`).join(''))}`;
    };
    actions['filter-library']=()=>{keyword=q('#cs-library-keyword',host).value.trim();business=q('#cs-library-business',host).value;render();};
    actions['reset-library']=()=>{keyword='';business='全部';render();};
    actions['view-library']=id=>{const t=S.templates.find(t=>t.id===id&&t.companies.includes(merchantCompany())&&t.status==='启用');if(t)drawer(t.name,templateViewBody(t),null);};
    window.addEventListener('caesar-company-change',()=>{close(true);render();});render();
  }
  function initTemplateView(host) {
    const params=new URLSearchParams(location.search),id=params.get('template');
    const render=()=>{
      const source=S.templates.find(t=>t.id===id&&(groupSettings||t.companies.includes(merchantCompany())));
      if(!source){host.innerHTML='<p>未找到可查看的模板，请从模板列表选择。</p><a href="contract-templates.html">查看合同模板</a>';return;}
      const t=D.copy(source),approval=groupSettings&&params.get('approvalExample')==='APR-CONTRACT-006'&&id==='T-GROUP-2026';
      if(approval){t.version='V1.1';t.status='待审核';t.clauses+='行程、人员及金额变更须双方确认，采用补充协议或新版本；原签署文件保留。';}
      host.innerHTML=`<div class="page-workbar"><h1 class="page-title">${e(t.name)} · 查看</h1><a href="${approval?'../merchant/approval/approvals.html?matter=合同模板发布':'contract-templates.html'}">返回${approval?'审批中心':'模板列表'}</a></div><div class="cs-bar"><span>${approval?'模板审核样例 · V1.1；原V1.0保留':'只读查看'+(t.status!=='启用'?' · 此版本不能用于新合同':'')}</span>${demo}</div>${templateViewBody(t)}${approval?`<details class="cs-section"><summary>查看原版本 V1.0</summary><div class="cs-document">${e(preview(source))}</div></details>`:''}`;
    };
    if(!groupSettings)window.addEventListener('caesar-company-change',render);render();
  }
  function initTemplateEditor(host) {
    if(!groupSettings||new URLSearchParams(location.search).get('mode')==='view'){initTemplateView(host);return;}
    const params=new URLSearchParams(location.search),isNew=['create','new'].includes(params.get('mode'));
    const source=S.templates.find(t=>t.id===(params.get('template')||'T-GROUP-2026'));
    if(!isNew&&!source){host.innerHTML='<p>未找到该模板，不能默认编辑其他模板。</p><a href="contract-templates.html">返回</a>';return;}
    let t=isNew?{...D.copy(S.templates.find(x=>x.profile==='domestic')),id:'NEW',name:'',version:'V1.0',companies:[],clauses:'',owner:'合同运营',status:'草稿'}:D.copy(source);
    const revising=t.status==='启用';
    if(revising){t.status='草稿';const v=/^V(\d+)\.(\d+)$/.exec(t.version);t.version=v?`V${v[1]}.${Number(v[2])+1}`:t.version+'-修订';t.revision=source.version;}
    let dirty=false,checked='',role='business',propertyDirty=false,propertyBackup=null;const profileDrafts={},routeDrafts={};const editorState={file:'body',selection:null};
    t=F.normalize(t);
    host.classList.add('cs-editor');
    host.innerHTML=`<div class="page-workbar"><div class="cs-back"><a href="contract-templates.html" id="cs-editor-back">返回</a><h1>${isNew?'新增合同模板':revising?'修订合同模板':'编辑合同模板'}</h1></div><div class="btn-group">${button('签署设置','signing-settings')}${button('预览合同','preview-template')}${button('保存草稿','save-template')}${button('提交审核','submit-template','',true)}</div></div><div class="cs-bar"><span id="cs-template-status">草稿${revising?' · 原'+e(source.version)+'继续保留':''}</span><div class="btn-group"><select class="form-control cs-role-select" id="cs-template-role" aria-label="操作身份（演示）"><option value="business">合同管理员（演示）</option><option value="implementation">技术实施管理员（演示）</option></select>${revising?button('查看原版本','original-template'):''}</div></div><div id="cs-template-validation" role="status"></div><div id="cs-template-form">${templateForm(t,editorState,{role,editable:true})}</div><section class="cs-section" id="cs-template-review" hidden><h3>审核记录</h3><a href="../merchant/approval/approvals.html?matter=合同模板发布">进入审批中心查看模板审核</a><details><summary>演示审核结果</summary><div class="cs-form cs-inline">${field('review-result','审核结果','待审核',['待审核','通过','退回'])}${field('review-opinion','审核意见','')}</div>${button('应用演示结果','template-review-result')}</details></section>`;
    const form=q('#cs-template-form',host),status=q('#cs-template-status',host),message=q('#cs-template-validation',host);
    function canEdit(){return ['草稿','审核退回'].includes(t.status);}
    function updateState(){
      status.textContent=t.version+' · '+t.status+(revising?' · 原'+source.version+'继续保留':'');
      qa('input,select,textarea',form).forEach(el=>el.disabled=!canEdit());
      lockFields();
      q('[data-cs-action="save-template"]',host).disabled=!canEdit();
      const submit=q('[data-cs-action="submit-template"]',host);submit.textContent=t.status==='待启用'?'启用本版本':'提交审核';submit.disabled=!canEdit()&&t.status!=='待启用';
      q('#cs-template-review',host).hidden=!['待审核','待启用','启用','审核退回'].includes(t.status);
      qa('input,select,button',q('#cs-template-review',host)).forEach(el=>el.disabled=t.status!=='待审核');
    }
    function lockFields(){
      const platform=q('[data-cs-action="platform-fields"]',host);if(platform)platform.hidden=role!=='implementation';
      qa('[data-cs-action="insert-content"],[data-cs-action="apply-property"],[data-cs-action="reset-property"],[data-cs-action="remove-position"],[data-cs-action="column-move"]',form).forEach(el=>el.disabled=!canEdit());
      qa('[data-ce-column]',form).forEach((row,i)=>{const buttons=qa('button',row);if(buttons.length){buttons[0].disabled=!canEdit()||i===0;buttons[1].disabled=!canEdit()||i===qa('[data-ce-column]',form).length-1;}});
    }
    q('#cs-template-role',host).addEventListener('change',ev=>{if(!commitProperty()){ev.target.value=role;return;}role=ev.target.value;renderWorkspace();});
    function renderForm(){form.innerHTML=templateForm(t,editorState,{role,editable:canEdit()});updateState();}
    function renderWorkspace(){q('#cs-template-workspace',host).innerHTML=window.ContractTemplateWorkspace.render(t,editorState,{role,editable:canEdit()});updateState();}
    function refreshFields(capture=true){if(capture)t=readTemplate(host,t);t.fieldConfig=F.reconcile(t);renderWorkspace();}
    function commitProperty(render=true){
      if(!propertyDirty||!canEdit())return true;
      const selection=editorState.selection,box=q('.ce-properties',host);let next=t;
      if(selection?.kind==='text'){
        const part=window.ContractTemplateWorkspace.segments(t).find(p=>p.type==='text'&&p.start===selection.start),value=q('[name=ce-text]',box)?.value||'';
        if(!part)return false;
        if(/[【】]/.test(value)){result(q('#ce-property-error',box),['填写项请通过“插入内容”添加，固定条款中不使用填写标记'],'');return false;}
        next=F.normalize({...t,bodyText:ContractTemplateText.body(t).slice(0,part.start)+value+ContractTemplateText.body(t).slice(part.end)});
      }else{
        const row=F.rows(t).find(r=>r.config.id===selection?.id);if(!row)return false;
        const f=F.copy(row.config),s=row.spec;
        if(q('[name=ce-label]',box))f.name=read(box,'ce-label');
        if(s.type==='table'){
          f.columns=qa('[data-ce-column]',box).map(el=>{const c=f.columns.find(c=>c.id===el.dataset.ceColumn);return {...c,label:q('[name=ce-column-label]',el)?read(el,'ce-column-label'):c.label};});
          if(q('[name=ce-row-number]',box))f.showRowNumber=q('[name=ce-row-number]',box).checked;
          f.sort='source';
        }else{
          if(q('[name=ce-mode]',box))f.mode=read(box,'ce-mode');
          if(q('[name=ce-source]',box))f.source=read(box,'ce-source');
          if(q('[name=ce-value]',box))f.value=read(box,'ce-value');
          if(q('[name=ce-condition]',box))f.condition=read(box,'ce-condition');
          f.editable=f.mode==='input';
        }
        next={...t,fieldConfig:t.fieldConfig.map(x=>x.id===f.id?f:x)};
        const errors=F.issues(next).filter(x=>x.startsWith(f.name+'：')||x.includes('填写项名称'));
        if(errors.length){result(q('#ce-property-error',box),errors,'');return false;}
      }
      t=next;propertyDirty=false;propertyBackup=null;dirty=true;checked='';t.signing.verified='待检查';if(render)renderWorkspace();return true;
    }
    function prepareAction(){if(!commitProperty())return false;t=readTemplate(host,t);return true;}

    function issues(n){return [...new Set([...D.templateIssues(n,S.companies,day,true),...ContractTemplateText.issues(n),...F.issues(n)])];}
    form.addEventListener('change',ev=>{
      if(!canEdit())return;
      if(!ev.target.closest('.ce-properties')&&propertyDirty&&!commitProperty(false)){if(ev.target.name in t)ev.target.value=t[ev.target.name];return;}
      if(ev.target.name==='attachments'||ev.target.name==='bodyText'){t=readTemplate(host,t);t.signing.verified='待检查';refreshFields(false);q('#cs-signing-check-state',form)?.replaceChildren(document.createTextNode('待检查'));}
      if(['textSource','provider','generation'].includes(ev.target.name)){
        if(!commitProperty(false))return;
        const previous=F.copy(t);routeDrafts[previous.profile+'|'+previous.provider+'|'+previous.generation]=previous;
        t=readTemplate(host,t);
        const saved=routeDrafts[t.profile+'|'+t.provider+'|'+t.generation];
        if(saved){for(const key of ['bodyText','slots','fieldConfig','platformConfig','signing','textSource'])if(saved[key]!==undefined)t[key]=D.copy(saved[key]);}
        else {
          t.textSource=t.generation==='file'?'custom':'standard';
          if(t.generation==='platform'){delete t.bodyText;delete t.slots;delete t.fieldConfig;t=F.normalize(t);}
        }
        t.category=t.textSource==='custom'?'企业自有':C.get(t.profile).category;t.province=t.textSource==='custom'?'全国':C.get(t.profile).province;
        editorState.file='body';editorState.selection=null;
        delete t.platformConfig;t.signing.verified='待检查';checked='';dirty=true;renderForm();return;
      }
      if(ev.target.name!=='profile'||!canEdit())return;
      const id=ev.target.value,p=C.get(id),old=readTemplate(host,t);profileDrafts[t.profile]=old;
      const saved=profileDrafts[id];
      t=saved?{...saved,version:t.version,status:t.status}: {...old,profile:id,name:p.name,business:p.business[0],range:p.ranges[0],category:p.category,province:p.province,directoryName:p.name,directoryCode:p.code,textReference:p.name+' · '+t.version,customer:id==='mice'?'企业':'个人',mode:id==='mice'?'企业代表签署':'多人合签',document:'主合同',serviceMode:id==='agency'?'代订代办':'包价旅游',content:C.fields(id),clauses:'',conditional:id==='mice'?'企业授权书应明确代表的签署权限。':'',attachments:id==='mice'?['服务明细','费用明细','企业授权书']:id==='agency'?['服务明细','费用明细']:['行程单','费用明细'],platformType:'待平台确认',platformCode:'',platformVersion:'',verified:false};
      if(!saved){delete t.bodyText;delete t.fieldConfig;delete t.platformConfig;delete t.slots;
        if(p.id==='mice'){t.textSource='custom';t.provider='fadada';t.generation='file';}
        if(t.textSource==='custom'){t.category='企业自有';t.province='全国';}
        t.signing=D.defaultSigning(t);
      }
      t=F.normalize(t);
      checked='';dirty=true;renderForm();message.textContent='';
    });
    host.addEventListener('input',ev=>{if(form.contains(ev.target)&&canEdit()){dirty=true;checked='';}});
    host.addEventListener('change',ev=>{if(form.contains(ev.target)&&canEdit()){dirty=true;checked='';}});
    q('#cs-editor-back').onclick=ev=>{if(dirty&&!confirm('当前内容未保存，确认离开吗？'))ev.preventDefault();};
    window.addEventListener('beforeunload',ev=>{if(dirty){ev.preventDefault();ev.returnValue='';}});
    function changed(){dirty=true;checked='';propertyDirty=false;propertyBackup=null;renderForm();}
    actions['apply-property']=()=>commitProperty();
    actions['reset-property']=()=>{if(propertyBackup)t.fieldConfig=t.fieldConfig.map(f=>f.id===propertyBackup.id?propertyBackup:f);propertyDirty=false;propertyBackup=null;renderWorkspace();};
    actions['configure-content']=id=>{
      if(!prepareAction())return;editorState.selection={kind:'field',id};renderWorkspace();
    };
    actions['select-position']=slotId=>{
      if(!prepareAction())return;const slot=t.slots.find(s=>s.id===slotId);if(!slot)return;editorState.selection={kind:'field',id:slot.fieldId,slot:slotId};renderWorkspace();
    };
    actions['editor-text']=start=>{if(!prepareAction()||t.generation!=='file')return;editorState.selection={kind:'text',start:Number(start)};renderWorkspace();};
    actions['editor-file']=name=>{if(!prepareAction())return;editorState.file=name;const f=F.rows(t).find(r=>r.config.key===name);if(f)editorState.selection={kind:'field',id:f.config.id};renderWorkspace();};
    actions['locate-content']=id=>{
      if(!prepareAction())return;const slot=t.slots.find(s=>s.fieldId===id);editorState.file='body';editorState.selection={kind:'field',id,slot:slot?.id};renderWorkspace();if(slot)q(`[data-ce-slot="${slot.id}"]`,host)?.scrollIntoView({block:'nearest',behavior:'smooth'});
    };
    actions['column-move']=value=>{
      if(!canEdit()||!prepareAction()||t.generation!=='file')return;const [id,delta]=value.split('|'),f=t.fieldConfig.find(f=>f.id===editorState.selection.id),i=f.columns.findIndex(c=>c.id===id),j=i+Number(delta);if(j<0||j>=f.columns.length)return;[f.columns[i],f.columns[j]]=[f.columns[j],f.columns[i]];t.signing.verified='待检查';dirty=true;checked='';renderWorkspace();
    };
    actions['remove-position']=slotId=>{
      if(!canEdit()||t.generation!=='file'||!prepareAction())return;
      if(!confirm('移除当前文书中的这一处填写位置？其他引用及必要附件保留。'))return;
      t=F.normalize({...t,bodyText:ContractTemplateText.body(t).replace('【#'+slotId+'】','')});editorState.selection=null;t.signing.verified='待检查';changed();
    };
    function insertAtSelection(id,text){
      const before=ContractTemplateText.body(t),selection=editorState.selection;
      let at=before.length;
      if(selection?.slot){const part=window.ContractTemplateWorkspace.segments(t).find(p=>p.slot===selection.slot);if(part)at=part.end;}
      if(selection?.kind==='text'){const part=window.ContractTemplateWorkspace.segments(t).find(p=>p.type==='text'&&p.start===selection.start);if(part)at=part.end;}
      let inserted=text||'';
      if(id){t=F.insert(t,id);const slot=t.slots.at(-1);inserted='【#'+slot.id+'】';editorState.selection={kind:'field',id,slot:slot.id};}
      t=F.normalize({...t,bodyText:before.slice(0,at)+'\n'+inserted+'\n'+before.slice(at)});t.signing.verified='待检查';
    }
    actions['insert-content']=()=>{
      if(!canEdit()||t.generation!=='file'||!prepareAction())return;
      const current=F.rows(t),baseline=F.rows({...t,bodyText:undefined,slots:[],fieldConfig:[]});
      const available=[...new Map([...current,...baseline].filter(r=>r.config.mode!=='signature').map(r=>[r.config.id,r])).values()];
      const m=drawer('插入内容',`<div class="cs-form">${field('insert-kind','内容类型','field',[{value:'field',label:'已有业务资料'},{value:'table',label:'预设明细表'},{value:'new',label:'自定义补充填写'},{value:'text',label:'固定条款'}],null,true)}<div id="cs-insert-options" class="cs-wide"></div><span class="cs-sub cs-wide">${editorState.selection?.slot||editorState.selection?.kind==='text'?'插入到当前选中内容之后':'插入到正文末尾'}</span></div>`,()=>{
        const kind=read(m,'insert-kind');
        if(kind==='text'){const text=read(m,'insert-text');if(!text||/[【】]/.test(text)){err(m,['请填写固定条款，填写位置通过业务资料单独插入']);return;}insertAtSelection('',text);}
        else {let id=read(m,'insert-id');if(kind==='new'){const name=read(m,'insert-label');if(!name||/[【】#\n]/.test(name)||current.some(r=>r.config.name===name||r.config.key===name)){err(m,['请填写不重复的业务名称，不使用括号或换行']);return;}const f=F.defaults(name,t);f.mode='input';f.editable=true;t.fieldConfig.push(f);id=f.id;}else{const row=available.find(r=>r.config.id===id);if(!row){err(m,['请选择要插入的内容']);return;}if(!t.fieldConfig.some(f=>f.id===id))t.fieldConfig.push(F.copy(row.config));}insertAtSelection(id);}
        close(true);changed();
      },'插入');if(!m)return;
      const options=()=>{const kind=read(m,'insert-kind');q('#cs-insert-options',m).innerHTML=kind==='text'?field('insert-text','固定条款','',null,'textarea',true):kind==='new'?field('insert-label','补充填写项名称',''):field('insert-id',kind==='table'?'选择预设表格':'选择业务资料','',available.filter(r=>(r.spec.type==='table')===(kind==='table')).map(r=>({value:r.config.id,label:r.config.name})),null,true);};q('[name=insert-kind]',m).addEventListener('change',options);options();
    };
    actions['template-files']=()=>{
      if(!prepareAction())return;
      const m=drawer('文件与附件',`<div class="cs-form">${checks('attachments','合同准备所需文件',['行程单','服务明细','费用明细','舱房及船票规则','企业授权书'],t.attachments)}${field('conditional','其他附件要求（选填）',t.conditional,null,'textarea',true)}${field('clauses','通用补充约定（选填）',t.clauses,null,'textarea',true)}</div>`,canEdit()?()=>{t.attachments=readChecks(m,'attachments');t.conditional=read(m,'conditional');t.clauses=read(m,'clauses');t.signing=D.reconcileSigning(t);t.signing.verified='待检查';t=F.normalize(t);close(true);changed();}:null);if(m&&!canEdit())qa('input,textarea',m).forEach(el=>el.disabled=true);
    };
    form.addEventListener('input',ev=>{if(!canEdit()||!ev.target.closest('.ce-properties'))return;if(!propertyBackup&&editorState.selection?.id)propertyBackup=F.copy(t.fieldConfig.find(f=>f.id===editorState.selection.id));propertyDirty=true;});
    form.addEventListener('change',ev=>{
      if(!canEdit()||!ev.target.closest('.ce-properties'))return;propertyDirty=true;
      if(ev.target.name==='ce-mode'){
        const f=t.fieldConfig.find(f=>f.id===editorState.selection.id);if(!propertyBackup)propertyBackup=F.copy(f);
        if(q('[name=ce-label]',form))f.name=read(form,'ce-label');if(q('[name=ce-value]',form))f.value=read(form,'ce-value');
        f.mode=ev.target.value;f.editable=f.mode==='input';renderWorkspace();
      }
    });
    actions['signing-settings']=()=>{
      t=canEdit()?readTemplate(host,t):t;
      let signing=D.copy(D.reconcileSigning(t)),verified='';
      const editable=canEdit();
      const body=ro([['模板',t.name+' · '+t.version],['签署平台',D.providerName(t.provider)]])+`<h3 class="cs-config-section-title">签署安排</h3><div class="cs-form">${field('sign-order','签署顺序',signing.order,['同时签署','客户先签，我方后签','我方先签，客户后签'])}</div><h3 class="cs-config-section-title">签署文件</h3><div class="cs-signing-documents">${signing.documents.map((d,i)=>`<section class="cs-sign-document" data-sign-document="${i}"><div class="cs-bar"><strong>${e(d.name)}</strong><label><input type="checkbox" name="document-sign" ${d.sign?'checked':''} ${d.name==='合同正文'?'disabled':''}>共同签署</label></div><div class="cs-sign-document-fields" ${d.sign?'':'hidden'}>${checks('document-role','必要签署方',signing.roles,d.roles||[])}${t.generation==='file'?`<div class="cs-form cs-inline">${field('document-position','签署位置',d.position,['文末签署区（随分页定位）','指定签署标记'])}${field('document-marker','签署标记',d.marker||'')}</div>`:`<p class="cs-sub">采用平台模板的签署位置；具体能力待接口核实。</p><input type="hidden" name="document-position" value="${e(d.position)}"><input type="hidden" name="document-marker" value="${e(d.marker||'')}">` }</div>${d.sign?'':'<span class="cs-sub" data-supporting-label>仅供核对材料</span>'}</section>`).join('')}</div><div class="cs-inline"><button type="button" class="btn btn-secondary" data-sign-check>检查签署样例</button></div><div data-sign-result role="status"></div>`;
      const capture=()=>({...signing,order:read(m,'sign-order'),documents:qa('[data-sign-document]',m).map(row=>{const d=signing.documents[Number(row.dataset.signDocument)];return {...d,sign:q('[name=document-sign]',row).checked,roles:readChecks(row,'document-role'),position:read(row,'document-position'),marker:read(row,'document-marker')};})});
      const m=drawer('签署设置',body,editable?()=>{
        const next=capture(),errors=D.signingIssues({...t,signing:{...next,verified:'样例已检查'}});
        if(verified!==JSON.stringify(next))errors.push('请检查当前签署文件与位置样例');
        if(err(m,errors))return;t.signing={...next,verified:'样例已检查'};close(true);changed();
      }:null);if(!m)return;
      m.classList.add('cs-signing-drawer');
      function sync(){qa('[data-sign-document]',m).forEach(row=>{const sign=q('[name=document-sign]',row).checked;q('.cs-sign-document-fields',row).hidden=!sign;q('[data-supporting-label]',row)?.remove();if(!sign)row.insertAdjacentHTML('beforeend','<span class="cs-sub" data-supporting-label>仅供核对材料</span>');const markerGroup=q('[name=document-marker]',row).closest('.form-group');if(markerGroup)markerGroup.hidden=read(row,'document-position')!=='指定签署标记';});}
      m.addEventListener('change',()=>{verified='';q('[data-sign-result]',m).textContent='';sync();});
      m.addEventListener('input',()=>{verified='';q('[data-sign-result]',m).textContent='';});
      q('[data-sign-check]',m).onclick=()=>{const n=capture(),errors=D.signingIssues({...t,signing:{...n,verified:'样例已检查'}});const target=q('[data-sign-result]',m);target.className=errors.length?'cs-error':'cs-result';if(errors.length){target.textContent=errors.join('；');return;}verified=JSON.stringify(n);target.innerHTML=`<strong>签署安排样例检查通过</strong><div class="cs-sub">${e(n.order)} · 以实际生成文书核对位置，未请求平台</div>${n.documents.filter(d=>d.sign).map(d=>`<div class="cs-sign-sample"><strong>${e(d.name)}</strong><span>${e(d.roles.join('、'))} · ${e(d.position==='指定签署标记'?d.marker:d.position)}</span></div>`).join('')}`;};
      if(!editable)qa('input,select',m).forEach(el=>el.disabled=true);
      qa('[data-sign-document] .form-control',m).forEach((el,i)=>{const label=el.closest('.form-group')?.querySelector('label');el.id='cs-sign-field-'+i;if(label)label.htmlFor=el.id;});sync();
    };
    actions['original-template']=()=>drawer('原版本 '+source.version,templateViewBody(source),null);
    actions['save-template']=()=>{if(!canEdit())return;const n=readTemplate(host,t);if(!n.name){result(message,['请填写模板名称'],'');q('[name=name]',host).focus();return;}t=n;dirty=false;result(message,[],'草稿已保存在当前页面；刷新恢复演示数据。');};
    actions['check-fields']=()=>{const n=readTemplate(host,t);result(message,F.issues(n),'字段配置检查通过；可预览不同签约样例核对取值。');};
    actions['preview-template']=()=>{
      const n=canEdit()?readTemplate(host,t):t,errors=issues(n);if(!errors.length)checked=JSON.stringify(n);
      const m=drawer('合同预览',`${errors.length?`<div class="cs-error">${e(errors.join('；'))}</div>`:''}<div class="cs-form">${field('previewCase','取值样例','joint',[{value:'joint',label:n.profile==='mice'?'企业项目样例':'多人合签：3人／30,000元'},...(n.profile==='mice'?[]:[{value:'split',label:'按人分签：本份1人／10,000元'}]),{value:'many',label:['day','zhejiang'].includes(n.profile)?'多人同行：20人／1日':n.profile==='mice'?'项目多日：20人／12日':'多人多日：20人／12日'},{value:'emptyRows',label:'空表：名单／行程无记录'},{value:'missingRows',label:'资料缺失：名单／行程缺项'},...(F.names(n).includes('保险购买方式')?[{value:'missingInsurance',label:'委托购买保险，资料未补'}]:[])])}${field('previewCompany','实际签约公司（样例）',n.companies[0]||'',[{value:'',label:'请选择'},...n.companies.map(id=>({value:id,label:company(id)?.name||id}))])}</div><p class="cs-sub">样例仅用于检查配置，待实际签署结果保留空位。</p><div id="cs-value-gaps" role="status"></div><div class="cs-document cs-inline" id="cs-resolved-body"></div><details class="cs-inline"><summary>查看逐项取值</summary><div id="cs-value-details"></div></details>`,null);
      const render=()=>{const r=F.preview(n,F.sample(n,read(m,'previewCase'),read(m,'previewCompany')));result(q('#cs-value-gaps',m),r.missing.map(name=>name.includes('：')?name:name+'待签约时填写'),'本样例所需资料齐全');q('#cs-resolved-body',m).innerHTML=`<h3>${e(n.name)} ${e(n.version)}</h3><p class="cs-text-caption">${n.generation==='platform'?'ERP参考预览 · 非平台生成结果':'原型文书预览'} · 待签署结果留空</p><div class="cs-rendered-body">${r.html}</div>${n.clauses?`<p>${e(n.clauses)}</p>`:''}<p>签约附件：${e(n.attachments.join('、'))}</p>`;q('#cs-value-details',m).innerHTML=ro(r.rows.map(x=>[x.name,F.display(x)]));};m.addEventListener('change',render);render();
    };
    actions['platform-fields']=()=>{
      if(role!=='implementation')return;
      t=canEdit()?readTemplate(host,t):t;
      window.ContractPlatformUI.open({template:t,editable:canEdit(),drawer,onSave:config=>{
        if(role!=='implementation'||!canEdit())return;
        t.platformConfig=config;dirty=true;checked='';
        q('#cs-platform-summary',host).textContent='对应草稿已保存 · 待接口核实';close(true);
      }});
    };
    actions['submit-template']=()=>{
      if(t.status==='待启用'){const errors=issues(t);if(errors.length){result(message,errors,'');return;}t.status='启用';dirty=false;updateState();result(message,[],'本版本已启用（原型演示），历史合同保留原版本。');return;}
      if(!canEdit())return;
      const n=readTemplate(host,t),errors=issues(n);if(checked!==JSON.stringify(n))errors.push('请先预览合同，核对当前内容');
      if(errors.length){result(message,errors,'');message.scrollIntoView({block:'nearest'});return;}
      t={...n,status:'待审核'};dirty=false;updateState();q('[name=review-result]',host).value='待审核';q('[name=review-opinion]',host).value='';result(message,[],'已提交当前版本审核（原型演示）。');
    };
    actions['template-review-result']=()=>{
      if(t.status!=='待审核')return;
      const value=read(host,'review-result'),opinion=read(host,'review-opinion');if(value==='待审核')return;
      if(value==='退回'&&!opinion){result(message,['请填写退回原因'],'');return;}
      t.status=value==='通过'?'待启用':'审核退回';checked='';dirty=false;updateState();result(message,[],value==='通过'?'审核通过，可启用本版本。':'审核退回：'+opinion+'。修改后请重新预览并提交。');
    };
    ['save-template','check-fields','preview-template','signing-settings','platform-fields','submit-template','original-template'].forEach(name=>{const action=actions[name];actions[name]=(...args)=>{if(!prepareAction())return;return action(...args);};});
    updateState();
  }

  function initRules(host){mountConfig('rules',host);}

  // Existing organization/store pages use these forms without persisting across pages.
  function initCompany(host) {
    const getId=()=>{
      const name=q('[data-current-name]')?.textContent||q('[data-object-name]')?.textContent||'';
      return S.companies.find(c=>name.includes(c.name))?.id||null;
    };
    host.innerHTML=`<div class="cs-bar"><h3>合同签约资料</h3>${button('维护资料','company-profile')}</div>${demo}<div id="cs-company-summary" class="cs-inline"></div>`;
    function render(){const c=company(getId());q('#cs-company-summary',host).innerHTML=c?ro([['旅行社许可证',c.license],['签约地址',c.address],['联系电话',c.phone],['经营资格',c.qualifications.join('、')],['服务网点关系',c.branchRelation],['投诉电话',c.complaintPhone],['投诉受理地区',c.complaintProvince+' '+c.complaintCity],...D.providers.map(p=>[p.name+'授权',D.companyIssues(c,day,p.id).join('；')||'样例已核对'])])+`<p><a href="interface.html?section=signature">查看电子合同授权</a></p>`:'请选择已维护资料的签约公司';}
    actions['company-profile']=id=>{const c=company(id||getId());if(!c){drawer('签约资料', '<p>请先选择并维护主体公司资料。</p>',null);return;}drawer(c.name+' · 签约资料',ro([['公司全称',c.fullName],['统一社会信用代码',c.credit]])+`<div class="cs-form cs-inline">${field('license','旅行社许可证号',c.license)}${field('phone','签约联系电话',c.phone)}${field('address','签约联系地址',c.address,null,'textarea',true)}${checks('qualifications','已核对经营资格（演示）',['境内旅游','出境旅游','赴台旅游'],c.qualifications)}${field('qualificationEvidence','经营资格依据',c.qualificationEvidence)}${field('branchRelation','分社／服务网点关系',c.branchRelation)}${field('complaintPhone','投诉电话',c.complaintPhone)}${field('complaintProvince','投诉受理省份',c.complaintProvince,provinces)}${field('complaintCity','投诉受理城市',c.complaintCity)}${field('complaintEmail','投诉邮箱',c.complaintEmail)}${field('complaintAddress','投诉联系地址',c.complaintAddress)}</div>`,m=>{const n={...c};['license','phone','address','qualificationEvidence','branchRelation','complaintPhone','complaintProvince','complaintCity','complaintEmail','complaintAddress'].forEach(k=>n[k]=read(m,k));n.qualifications=readChecks(m,'qualifications');if(n.qualifications.length&&!n.qualificationEvidence){err(m,['经营资格须填写核对依据']);return;}if(err(m,!n.license||!n.phone||!n.address?['请补齐许可证号、签约电话和地址']:[]))return;Object.assign(c,n);close(true);render();});};
    window.ContractCompanyProfile={open:id=>actions['company-profile'](id)};
    const target=q('[data-current-name]');if(target)new MutationObserver(render).observe(target,{childList:true,characterData:true,subtree:true});render();
  }
  function storeForm(host) {
    host.innerHTML=`<div class="cs-bar"><h3>合同办理</h3>${demo}</div><div class="cs-form">${field('storeCompany','签约公司','fj',S.companies.map(c=>({value:c.id,label:c.name+(D.companyIssues(c,day).length?'（待完善）':''),disabled:!!D.companyIssues(c,day).length})))}${field('storeAllow','允许本店发起签署','是',['是','否'])}</div><div data-cs-store-result class="cs-result"></div>`;
    const validate=()=>D.storeIssues({allow:read(host,'storeAllow')==='是',company:read(host,'storeCompany')},S,day);
    const sync=()=>result(q('[data-cs-store-result]',host),validate(),read(host,'storeAllow')==='否'?'本店不发起电子签署，原合同保留。':'沿用签约公司的合同规则；按订单业务及产品指定模板确定本次合同，发起时核对适用条件。');
    host.addEventListener('change',sync);sync();
    window.ContractStoreConfig={validate,refresh:sync,reset:()=>{const defaults={storeCompany:'fj',storeAllow:'是'};Object.keys(defaults).forEach(k=>q(`[name="${k}"]`,host).value=defaults[k]);sync();}};
  }

  qa('[data-cs-page]').forEach(host=>{
    host.classList.add('contract-settings');
    const type=host.dataset.csPage;
    if(type==='interface')initInterface(host);
    if(type==='templates')initTemplates(host,false);
    if(type==='template-edit')initTemplates(host,true);
    if(type==='rules'&&groupSettings)initRules(host);
    if(type==='policy'&&groupSettings)mountConfig('policy',host);
    if(type==='template-library')initTemplateLibrary(host);
    if(type==='template-view')initTemplateView(host);
    if(type==='company')initCompany(host);
    if(type==='store')storeForm(host);
  });
  const settingTabs=qa('[data-contract-settings-tab]');
  function selectSettingsTab(value) {
    const selected=value==='rules'?'rules':'templates';
    settingTabs.forEach(tab=>{const active=tab.dataset.contractSettingsTab===selected;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));});
    qa('[data-contract-settings-panel]').forEach(panel=>panel.hidden=panel.dataset.contractSettingsPanel!==selected);
  }
  settingTabs.forEach(tab=>tab.addEventListener('click',()=>{
    selectSettingsTab(tab.dataset.contractSettingsTab);
    const url=new URL(location.href);url.searchParams.set('tab',tab.dataset.contractSettingsTab);history.replaceState(null,'',url);
  }));
  if(settingTabs.length)selectSettingsTab(new URLSearchParams(location.search).get('tab'));
  if(q('[data-org-tree]')&&!window.ContractCompanyProfile)initCompany(document.createElement('section'));
  window.dispatchEvent(new Event('contract-settings-ready'));
})();
