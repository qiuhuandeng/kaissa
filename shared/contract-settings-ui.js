(function () {
  'use strict';
  const D=window.ContractSettings;
  if (!D) return;
  const S=D.newState(), day='2026-09-24';
  window.ContractSettingsSession=S;
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const company=id=>S.companies.find(c=>c.id===id);
  const button=(text,act,value='',primary=false)=>`<button type="button" class="${primary?'btn btn-primary':['查询','重置','取消','保存草稿','预览检查','核对配置','查看结果样例'].includes(text)?'btn btn-secondary':'btn-text'}" data-cs-action="${act}" data-cs-value="${e(value)}">${e(text)}</button>`;
  const badge=(text,ok=false)=>`<span class="tag ${ok?'tag-green':'tag-orange'}">${e(text)}</span>`;
  const demo='<span class="cs-demo-label">配置演示 · 刷新恢复 · 未连接12301</span>';
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
    modal.addEventListener('input',()=>modalDirty=true);modal.addEventListener('change',()=>modalDirty=true);
    modal.addEventListener('click',ev=>{if(ev.target===modal){ev.stopPropagation();close();}});
    if (window.caesarUI?.openLayer) window.caesarUI.openLayer(modal); else modal.classList.add('show');
    actions['save-drawer']=()=>onSave?.(modal);
    return modal;
  }
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&modal){ev.preventDefault();ev.stopImmediatePropagation();close();}},true);
  const err=(r,issues)=>{result(q('[data-cs-error]',r),issues,'');return issues.length>0;};

  function initInterface(host) {
    let tab='connection',keyword='',stateFilter='全部';
    function nav() {return `<div class="cs-bar">${demo}</div><nav class="tab-bar cs-tabs">${[['connection','连接配置'],['companies','公司签约配置'],['logs','对接记录']].map(([key,label])=>`<button class="tab-item ${tab===key?'active':''}" data-cs-action="interface-tab" data-cs-value="${key}">${label}</button>`).join('')}</nav>`;}
    function render() {
      host.innerHTML=nav();
      if(tab==='connection') {
        host.insertAdjacentHTML('beforeend',`<section class="cs-section">${heading('12301连接',button('保存配置','save-connection','',true))}<div class="cs-form">${field('environment','接入环境',S.connection.environment,['待平台提供','测试环境','正式环境'])}${field('capability','已开通服务',S.connection.capability,['待确认','电子签署及备案','仅编号及备案'])}${field('url','接口地址',S.connection.url)}${field('appId','接入编号',S.connection.appId)}${field('credential','认证凭据','',null,'password')}${field('contact','平台技术联系人',S.connection.contact)}</div><div class="cs-result" id="cs-connection-state">${e(S.connection.state)} · 最近核对：${e(S.connection.checkedAt)}</div><div class="btn-group cs-inline">${button('核对配置','check-connection')}${button('查看结果样例','connection-samples')}<a href="https://zwfw.mct.gov.cn/" target="_blank" rel="noopener noreferrer">官方服务入口</a></div><div id="cs-connection-error" role="status"></div></section>`);
        host.addEventListener('input',()=>{host.dataset.dirty='true';},{once:true});
        host.addEventListener('change',()=>{host.dataset.dirty='true';},{once:true});
      } else if(tab==='companies') {
        host.insertAdjacentHTML('beforeend',heading('签约公司')+table(['签约公司','平台企业／用章','授权范围','核对结果'],[220,260,180,null],S.companies.map(c=>{const gaps=D.companyIssues(c,day);return `<tr><td><strong>${e(c.name)}</strong><span class="cs-sub">${e(c.license||'许可证待补')}</span></td><td><strong>${e(c.platform||'未关联')}</strong><span class="cs-sub">${e(c.seal||'用章待核实')}</span></td><td>${e(c.scope)}</td><td>${badge(gaps.length?'待完善':'可用（演示）',!gaps.length)}<span class="cs-sub">${e(gaps[0]||c.end+'到期')}</span></td><td class="cs-actions"><div>${button('配置','company-config',c.id)}</div></td></tr>`;}).join('')));
      } else renderLogs();
    }
    function capture(){return {environment:read(host,'environment'),capability:read(host,'capability'),url:read(host,'url'),appId:read(host,'appId'),contact:read(host,'contact'),state:'已保存，未验证',checkedAt:'未核对'};}
    function connectionGaps(c) {const gaps=[];if(c.environment==='待平台提供')gaps.push('接入环境待平台提供');if(c.capability==='待确认')gaps.push('服务范围待确认');if(!/^https:\/\/[^\s/]+/.test(c.url))gaps.push('请填写平台确认的HTTPS接口地址');if(!c.appId)gaps.push('接入编号未填写');if(!c.contact)gaps.push('平台联系人未填写');return gaps;}
    actions['interface-tab']=key=>{if(host.dataset.dirty==='true'&&!window.confirm('当前连接配置未保存，确认离开吗？'))return;host.dataset.dirty='false';tab=key;render();};
    actions['save-connection']=()=>{S.connection=capture();host.dataset.dirty='false';q('[name="credential"]',host).value='';log('保存连接配置','12301','未验证','仅保存本页配置，认证凭据不留存在原型中');result(q('#cs-connection-error'),[],'本页配置已保存；未连接12301，刷新恢复。');q('#cs-connection-state').textContent='已保存，未验证 · 最近核对：未核对';};
    actions['check-connection']=()=>{const c=capture(),gaps=connectionGaps(c);if(c.capability==='仅编号及备案')gaps.push('当前服务不含电子签署，请核实签署服务');result(q('#cs-connection-error'),gaps,gaps.length?'':'参数已填写，真实连接仍未验证。');log('核对连接配置','12301',gaps.length?'资料待补':'未验证',gaps.join('；')||'参数检查完成，未请求平台');};
    actions['connection-samples']=()=>{
      const m=drawer('连接结果样例',`<div class="cs-form">${field('sample','选择结果','授权有效',['授权有效','授权失效','平台超时','仅备案服务'])}</div><div class="cs-result" id="cs-sample-result"></div>`,null);
      const update=()=>{const value=read(m,'sample'),texts={'授权有效':'演示：连接可用。仍需分别核对签约公司、用章、模板和规则。','授权失效':'演示：授权已失效。暂停新的签署，交管理员核实授权。','平台超时':'演示：受理结果未知。先查询原合同，不能直接重复创建。','仅备案服务':'演示：编号及备案可用，签署服务尚未明确。'};q('#cs-sample-result',m).textContent=texts[value];};m.addEventListener('change',update);update();
    };
    actions['company-config']=id=>{
      const c=company(id);
      drawer(c.name+' · 签约配置',ro([['公司全称',c.fullName],['旅行社许可证',c.license]])+`<div class="cs-form cs-inline">${field('connection','采用的接入授权',c.connection)}${field('platform','平台企业关联',c.platform)}${field('account','经办人关系',c.account)}${field('platformReview','平台审核要求',c.platformReview,['待平台确认','无需额外审核（演示）','需平台审核（演示）'])}${field('seal','电子合同用章',c.seal)}${field('sealCompany','用章所属公司',c.sealCompany,S.companies.map(x=>({value:x.id,label:x.name})))}${field('authorization','授权核对（演示）',c.authorization,['待核实','已核对','已失效'])}${field('sealState','用章核对（演示）',c.sealState,['待核实','已核对'])}${field('start','授权生效日期',c.start,null,'date')}${field('end','授权截止日期',c.end,null,'date')}${field('scope','适用组织／门店',c.scope,null,'textarea',true)}${field('evidence','核对依据',c.evidence,null,'textarea',true)}${checks('templateTypes','已核实的合同类型（演示）',['团队境内旅游合同','团队出境旅游合同','补充协议','企业旅游合同'],c.templateTypes)}${checks('signModes','已核实的签署方式（演示）',['多人合签','按人分签','代表及代理签署','企业代表签署'],c.signModes)}</div><div class="cs-result">${e(D.companyIssues(c,day).join('；')||'签约资料可用（演示）')}</div><p><a href="org.html">维护公司证照资料</a></p>`,m=>{
        const next={...c};['connection','platform','account','platformReview','seal','sealCompany','authorization','sealState','start','end','scope','evidence'].forEach(k=>next[k]=read(m,k));next.templateTypes=readChecks(m,'templateTypes');next.signModes=readChecks(m,'signModes');
        const issues=[];if(next.sealCompany!==id)issues.push('用章所属公司必须与当前签约公司一致');if(next.authorization==='已核对'&&(!next.platform||!next.evidence||D.dates(next.start,next.end).length))issues.push('已核对授权需平台企业、有效日期和核对依据');if(next.sealState==='已核对'&&!next.seal)issues.push('请填写平台电子合同用章');
        if(err(m,issues))return;Object.assign(c,next);log('保存签约配置',c.name,D.companyIssues(c,day).length?'待完善':'演示可用',D.companyIssues(c,day).join('；')||'本页演示核对，不代表正式授权');close(true);render();
      });
    };
    function renderLogs(){
      host.insertAdjacentHTML('beforeend',`<div class="cs-filters"><input class="form-control" id="cs-log-keyword" placeholder="公司／合同／处理步骤" value="${e(keyword)}"><select class="form-control" id="cs-log-state">${['全部','未验证','资料待补','待完善','演示可用'].map(x=>`<option ${x===stateFilter?'selected':''}>${x}</option>`).join('')}</select>${button('查询','filter-logs')}${button('重置','reset-logs')}</div>`);
      const rows=S.logs.filter(x=>(stateFilter==='全部'||x.state===stateFilter)&&JSON.stringify(x).includes(keyword));
      host.insertAdjacentHTML('beforeend',table(['时间','公司／合同','处理步骤','结果'],[140,190,null,160],rows.map(x=>`<tr><td>${e(x.time)}</td><td>${e(x.company)}</td><td>${e(x.step)}</td><td>${e(x.state)}</td><td class="cs-actions"><div>${button('详情','log-detail',S.logs.indexOf(x))}</div></td></tr>`).join('')));
    }
    actions['filter-logs']=()=>{keyword=q('#cs-log-keyword').value.trim();stateFilter=q('#cs-log-state').value;render();};actions['reset-logs']=()=>{keyword='';stateFilter='全部';render();};
    actions['log-detail']=index=>{const x=S.logs[index];drawer('对接记录',ro([['时间',x.time],['公司／合同',x.company],['处理步骤',x.step],['结果',x.state],['处理说明',x.detail]]),null);};
    actions['open-signature']=()=>q('[data-interface-tab="signature"]').click();
    render();
    if(new URLSearchParams(location.search).get('section')==='signature')q('[data-interface-tab="signature"]').click();
  }

  const mappings=[['company','签约公司','本单已确定的签约公司'],['travelers','游客及签署人','本单游客和已核对代理关系'],['trip','旅游行程','本次确认行程及日期'],['amount','合同金额','订单／项目确认金额']];
  function templateForm(t) {
    return `<div class="cs-form">${field('name','模板名称',t.name)}${field('version','版本',t.version)}${field('business','业务类型',t.business,['参团游','邮轮','专列','自由行','单项服务','MICE'])}${field('document','文书类别',t.document,['主合同','补充协议','解除文书'])}${checks('companies','适用签约公司',S.companies.map(c=>({value:c.id,label:c.name})),t.companies)}${field('customer','客户类型',t.customer,['个人','企业'])}${field('mode','签署方式',t.mode,['多人合签','按人分签','代表及代理签署','企业代表签署'])}${field('textType','文本方式',t.textType,['平台标准文本','补充条款','自定义文本'])}${field('platformType','平台合同类型',t.platformType,['待平台确认','团队境内旅游合同','团队出境旅游合同','补充协议','企业旅游合同'])}${field('platformCode','平台提供的模板编号',t.platformCode)}${field('platformVersion','平台模板版本',t.platformVersion)}${field('verified','适用方式核对（演示）',t.verified?'已核对':'待核实',['待核实','已核对'])}${field('owner','维护人',t.owner)}${field('start','生效日期',t.start,null,'date')}${field('end','截止日期',t.end,null,'date')}${checks('attachments','必需附件',['行程单','费用明细','舱房及船票规则','企业授权书'],t.attachments)}${field('conditional','条件附件',t.conditional,null,'textarea',true)}${field('clauses','业务补充约定',t.clauses,null,'textarea',true)}</div><details class="cs-inline"><summary>平台字段对应（配置人员）</summary><div class="table-wrap cs-inline"><table><thead><tr><th>合同内容</th><th>采用资料</th><th>平台字段</th></tr></thead><tbody>${mappings.map(([key,label,source])=>`<tr><td>${label}</td><td>${source}</td><td><input class="form-control" name="mapping-${key}" aria-label="${label}平台字段" value="${e(t.mapping?.[key]||'')}" placeholder="按平台接口资料填写"></td></tr>`).join('')}</tbody></table></div></details>`;
  }
  function readTemplate(root,t) {const n={...t};['name','version','business','document','customer','mode','textType','platformType','platformCode','platformVersion','owner','start','end','conditional','clauses'].forEach(k=>n[k]=read(root,k));n.companies=readChecks(root,'companies');n.attachments=readChecks(root,'attachments');n.mapping=Object.fromEntries(mappings.map(([key])=>[key,read(root,'mapping-'+key)]));n.verified=read(root,'verified')==='已核对';return n;}
  function preview(t) {
    const sample={参团游:'日本关西深度游7日',邮轮:'理想号地中海邮轮7日',专列:'西北旅游专列7日',自由行:'巴黎自由行7日',单项服务:'日本签证代办',MICE:'欧洲企业奖励旅游7日'}[t.business]||'待确认';
    return `配置预览样例 · 不用于签署\n\n${t.name}  ${t.version}\n签约公司：${t.companies.map(id=>company(id)?.fullName||id).join('、')||'待选择'}\n客户：${t.customer==='企业'?'某科技公司（示例），授权代表：王强':'张建国、李梅（示例）'}\n签署方式：${t.mode}\n产品／服务：${sample}（示例）\n服务日期：2026-10-10至2026-10-16\n合同金额：¥25,600（订单确认金额示例）\n\n业务补充约定：\n${t.clauses}\n\n必需附件：${t.attachments.join('、')}\n条件附件：${t.conditional||'无'}\n\n平台合同类型：${t.platformType}\n平台模板版本：${t.platformVersion||'待核实'}\n本页未取得监管编号、未发送游客通知。`;
  }
  function initTemplates(host,editor) {
    if(new URLSearchParams(location.search).get('purpose')==='supplier'){host.innerHTML='<p>供应商协议模板由集团统一维护。</p><a href="../resource/suppliers.html">返回本公司供应商</a>';return;}
    if(editor){initTemplateEditor(host);return;}
    let state='全部',keyword='',business='全部';
    function render(){
      host.innerHTML=`<div class="cs-bar">${demo}<a class="btn btn-primary" href="contract-template-edit.html?mode=create">新增模板</a></div><div class="cs-filters"><input class="form-control" id="cs-template-keyword" placeholder="模板名称／版本" value="${e(keyword)}"><select class="form-control" id="cs-template-business">${['全部','参团游','邮轮','MICE'].map(x=>`<option ${x===business?'selected':''}>${x}</option>`).join('')}</select>${button('查询','filter-templates')}${button('重置','reset-templates')}</div><nav class="tab-bar cs-tabs">${['全部','启用','草稿','待审核','停用'].map(x=>`<button class="tab-item ${x===state?'active':''}" data-cs-action="template-tab" data-cs-value="${x}">${x}</button>`).join('')}</nav>`;
      const rows=S.templates.filter(t=>(state==='全部'||state===t.status)&&(business==='全部'||t.business===business)&&(t.name+t.version).includes(keyword));
      host.insertAdjacentHTML('beforeend',table(['模板名称／版本','业务／文书','适用公司','签署方式','维护人'],[null,150,180,160,150],rows.map(t=>`<tr><td><strong>${e(t.name)}</strong><span class="cs-sub">${e(t.version)} · ${e(t.status)}</span></td><td><strong>${e(t.business)}</strong><span class="cs-sub">${e(t.document)}</span></td><td>${e(t.companies.map(id=>company(id)?.name).join('、'))}</td><td>${e(t.mode)}</td><td>${e(t.owner)}</td><td class="cs-actions"><div>${button('详情','template-detail',t.id)}<a href="contract-template-edit.html?template=${encodeURIComponent(t.id)}&mode=edit">${t.status==='启用'?'修订':'编辑'}</a></div></td></tr>`).join('')));
    }
    actions['template-tab']=v=>{state=v;render();};actions['filter-templates']=()=>{keyword=q('#cs-template-keyword').value.trim();business=q('#cs-template-business').value;render();};actions['reset-templates']=()=>{keyword='';business='全部';state='全部';render();};
    actions['template-detail']=id=>{const t=S.templates.find(x=>x.id===id);drawer(t.name,ro([['版本',t.version],['状态',t.status],['签约公司',t.companies.map(id=>company(id)?.name).join('、')],['平台适用',t.verified?'已核对（演示）':'待核实'],['有效期',t.start+' 至 '+t.end],['必需附件',t.attachments.join('、')]])+`<div class="cs-result">${e(D.templateIssues(t,S.companies,day).join('；')||'示例资料检查通过；真实平台能力未验证')}</div><div class="cs-document cs-inline">${e(preview(t))}</div>`,t.status==='启用'?()=>{if(!confirm('停用后不再用于新合同，历史文件保留。确认停用？'))return;t.status='停用';close(true);render();}:null,'停用模板');};
    render();
  }
  function initTemplateEditor(host) {
    const params=new URLSearchParams(location.search),isNew=['create','new'].includes(params.get('mode'));
    const source=S.templates.find(t=>t.id===(params.get('template')||'T-GROUP-2026'));
    if(!isNew&&!source){host.innerHTML='<p>未找到该模板，不能默认编辑其他模板。</p><a href="contract-templates.html">返回</a>';return;}
    let t=isNew?{...D.copy(S.templates[1]),id:'NEW',name:'',version:'V1.0',platformCode:'',platformVersion:'',companies:[],clauses:'',owner:'合同运营',status:'草稿'}:D.copy(source);
    const revising=t.status==='启用';if(revising){t.status='草稿';t.version='V1.1';t.revision=source.version;}
    let dirty=false,checked='';
    host.classList.add('cs-editor');
    host.innerHTML=`<div class="page-workbar"><div class="cs-back"><a href="contract-templates.html" id="cs-editor-back">返回</a><h1>${isNew?'新增合同模板':revising?'修订合同模板':'编辑合同模板'}</h1></div><div class="btn-group">${button('预览检查','preview-template')}${button('保存草稿','save-template')}${button('提交审核','submit-template','',true)}</div></div><div class="cs-bar">${demo}<span id="cs-template-status">草稿${revising?' · 原'+e(source.version)+'继续保留':''}</span>${revising?button('查看原版本','original-template'):''}</div><section class="cs-section">${templateForm(t)}<div id="cs-template-validation" role="status"></div></section>`;
    actions['original-template']=()=>drawer('原版本 '+source.version,`<div class="cs-document">${e(preview(source))}</div>`,null);
    host.addEventListener('input',()=>{dirty=true;checked='';});host.addEventListener('change',()=>{dirty=true;checked='';});
    q('#cs-editor-back').onclick=ev=>{if(dirty&&!confirm('当前内容未保存，确认离开吗？'))ev.preventDefault();};
    window.addEventListener('beforeunload',ev=>{if(dirty){ev.preventDefault();ev.returnValue='';}});
    actions['save-template']=()=>{const n=readTemplate(host,t);if(!n.name||!n.version){result(q('#cs-template-validation'),['请填写模板名称和版本'],'');return;}t=n;dirty=false;result(q('#cs-template-validation'),[],'草稿已保留在当前页面，可继续编辑；刷新恢复。');};
    actions['preview-template']=()=>{const n=readTemplate(host,t),issues=D.templateIssues(n,S.companies,day,true);checked=JSON.stringify(n);drawer('合同内容预览',`<div class="${issues.length?'cs-error':'cs-result'}">${e(issues.join('；')||'示例资料检查通过，真实平台待验证')}</div><div class="cs-document">${e(preview(n))}</div>`,null);};
    actions['submit-template']=()=>{const n=readTemplate(host,t);let issues=D.templateIssues(n,S.companies,day,true);if(revising&&n.version===source.version)issues.push('修订必须使用新版本，不能覆盖原版本');if(checked!==JSON.stringify(n))issues.push('请先预览检查当前内容');if(issues.length){result(q('#cs-template-validation'),issues,'');return;}t={...n,status:'待审核'};dirty=false;qa('input,select,textarea',host).forEach(x=>x.disabled=true);qa('[data-cs-action="submit-template"],[data-cs-action="save-template"]',host).forEach(x=>x.disabled=true);q('#cs-template-status').textContent='待审核 · 本页演示，尚未发布';result(q('#cs-template-validation'),[],'已提交当前版本审核（演示）。未创建平台合同，未发送游客通知。');};
    host.insertAdjacentHTML('beforeend',`<section class="cs-section" id="cs-template-review" hidden><h3>版本审批与启用</h3><a href="../approval/approvals.html?matter=合同模板发布">进入审批中心查看模板审核</a><details><summary>演示本次审核结果</summary><label>结果<select id="cs-template-result" class="form-control"><option>待审核</option><option>通过</option><option>退回</option></select></label><label>审批意见<input id="cs-template-opinion" class="form-control"></label>${button('应用演示结果','template-review-result')}</details>${button('启用本版本','template-publish','',true)}</section>`);
    const submitTemplate=actions['submit-template'];actions['submit-template']=()=>{submitTemplate();if(t.status==='待审核'){q('#cs-template-review').hidden=false;qa('#cs-template-review input,#cs-template-review select').forEach(x=>x.disabled=false);q('[data-cs-action="template-publish"]').disabled=true;}};
    actions['template-review-result']=()=>{if(t.status!=='待审核'){result(q('#cs-template-validation'),['当前版本不在审核中'],'');return;}const value=q('#cs-template-result').value,opinion=q('#cs-template-opinion').value.trim();if(value==='待审核')return;if(value==='退回'&&!opinion){result(q('#cs-template-validation'),['退回原因必填'],'');return;}t.status=value==='通过'?'待启用':'审核退回';q('#cs-template-status').textContent=t.status+' · '+opinion;if(value==='退回'){qa('.cs-section input,.cs-section select,.cs-section textarea',host).forEach(x=>x.disabled=false);qa('[data-cs-action="submit-template"],[data-cs-action="save-template"]',host).forEach(x=>x.disabled=false);checked='';q('#cs-template-review').hidden=true;}else q('[data-cs-action="template-publish"]').disabled=false;dirty=false;result(q('#cs-template-validation'),[],value==='通过'?'本版本审核通过，启用后供后续合同选用。':'已退回，请修改并重新预览提交。');};
    actions['template-publish']=()=>{if(t.status!=='待启用')return;const errors=D.templateIssues(t,S.companies,day,true);if(errors.length){result(q('#cs-template-validation'),errors,'');return;}t.status='启用';q('#cs-template-status').textContent=t.version+' · 启用';q('[data-cs-action="template-publish"]').disabled=true;dirty=false;result(q('#cs-template-validation'),[],'本版本已启用（本页演示）；历史合同保留原模板正文和签名。');};

  }

  function initRules(host) {
    let keyword='',tab='全部';
    function render(){
      host.innerHTML=`<div class="cs-bar">${demo}${button('新增规则','new-rule','',true)}</div><div class="cs-filters"><input class="form-control" id="cs-rule-keyword" placeholder="合同规则名称" value="${e(keyword)}">${button('查询','filter-rules')}${button('重置','reset-rules')}</div><nav class="tab-bar cs-tabs">${['全部','启用','草稿','停用'].map(v=>`<button class="tab-item ${v===tab?'active':''}" data-cs-action="rule-tab" data-cs-value="${v}">${v}</button>`).join('')}</nav>`;
      const rows=S.rules.filter(r=>r.company==='fj'&&(tab==='全部'||r.status===tab)&&r.name.includes(keyword));
      host.insertAdjacentHTML('beforeend',table(['规则名称','适用业务／范围','签约付款条件','有效期','状态'],[null,180,180,210,110],rows.map(r=>`<tr><td><strong>${e(r.name)}</strong><span class="cs-sub">${e(company(r.company).name)}</span></td><td><strong>${e(r.business)}</strong><span class="cs-sub">${e(r.scope==='公司通用'?'公司通用':r.store)}</span></td><td>${e(r.payment==='按付款节点'?r.paymentNode:r.payment)}</td><td>${e(r.start)} 至 ${e(r.end)}</td><td>${badge(r.status,r.status==='启用')}</td><td class="cs-actions"><div>${button('配置','edit-rule',r.id)}${r.status==='启用'?button('停用','stop-rule',r.id):button('启用','enable-rule',r.id)}</div></td></tr>`).join('')));
    }
    function edit(id){
      const original=S.rules.find(r=>r.id===id),r=original?D.copy(original):{...D.copy(S.rules[1]),id:'R-'+Date.now(),name:'',business:'参团游',template:'T-GROUP-2026',scope:'公司通用',store:'',payment:'待确认',paymentNode:'',confirmed:false,evidence:'',status:'草稿'};
      const body=`<p>签约公司：福建凯撒</p><div class="cs-form">${field('name','规则名称',r.name)}${field('business','业务类型',r.business,['参团游','邮轮','专列','自由行','单项服务','MICE'])}${field('scope','适用范围',r.scope,['公司通用','指定门店'])}${field('store','指定门店',r.store,[{value:'',label:'请选择'},'软件园门店','文灶门店','观音山门店'])}${field('template','适用合同模板',r.template,S.templates.filter(t=>t.companies.includes('fj')).map(t=>({value:t.id,label:t.name+' · '+t.status})))}${field('draftStage','允许生成草稿',r.draftStage,['订单已确认','订单资料齐全'])}${field('review','内部审核',r.review,['需要审核','无需审核'])}${field('flow','审批流程',r.flow,[{value:'',label:'请选择'},'销售合同审核（示例）'])}${field('payment','发起签署付款条件',r.payment,['待确认','先签后收','按付款节点'])}${field('paymentNode','订单付款节点',r.paymentNode,[{value:'',label:'请选择'},'订单约定首款','订单约定全款'])}${field('start','生效日期',r.start,null,'date')}${field('end','截止日期',r.end,null,'date')}${field('confirmed','业务政策核对（演示）',r.confirmed?'已确认':'待确认',['待确认','已确认'])}${field('owner','规则负责人',r.owner)}${field('evidence','政策确认依据',r.evidence,null,'textarea',true)}</div><p><a href="../approval/approvals.html?view=config">查看审批配置</a></p>`;
      const m=drawer(original?'配置合同规则':'新增合同规则',body,m=>{
        let n={...r};['name','business','scope','store','template','draftStage','review','flow','payment','paymentNode','start','end','owner','evidence'].forEach(k=>n[k]=read(m,k));n.confirmed=read(m,'confirmed')==='已确认';
        if(!n.name){err(m,['请填写规则名称']);return;}
        if(original?.status==='启用'){const issues=D.ruleIssues(n,S,day,true);if(err(m,issues))return;}
        if(n.scope==='公司通用')n.store='';if(n.review==='无需审核')n.flow='';if(n.payment!=='按付款节点')n.paymentNode='';
        if(original)Object.assign(original,n);else S.rules.push(n);close(true);render();
      },original?.status==='启用'?'保存配置':'保存草稿');
      const sync=()=>{q('[name="store"]',m).disabled=read(m,'scope')!=='指定门店';q('[name="flow"]',m).disabled=read(m,'review')!=='需要审核';q('[name="paymentNode"]',m).disabled=read(m,'payment')!=='按付款节点';};m.addEventListener('change',sync);sync();
    }
    actions['new-rule']=()=>edit();actions['edit-rule']=edit;actions['filter-rules']=()=>{keyword=q('#cs-rule-keyword').value.trim();render();};actions['reset-rules']=()=>{keyword='';tab='全部';render();};actions['rule-tab']=v=>{tab=v;render();};
    actions['stop-rule']=id=>{if(!confirm('停用后不再用于新的签约，已有合同保留。确认停用？'))return;S.rules.find(r=>r.id===id).status='停用';render();};
    actions['enable-rule']=id=>{const r=S.rules.find(x=>x.id===id),issues=D.ruleIssues(r,S,day,true);if(issues.length){drawer('规则暂不能启用',`<div class="cs-error">${e(issues.join('；'))}</div>`,null);return;}r.status='启用';render();};
    render();
  }

  // Existing organization/store pages use these forms without persisting across pages.
  function initCompany(host) {
    const getId=()=>{
      const name=q('[data-current-name]')?.textContent||q('[data-object-name]')?.textContent||'';
      return S.companies.find(c=>name.includes(c.name))?.id||null;
    };
    host.innerHTML=`<div class="cs-bar"><h3>合同签约资料</h3>${button('维护资料','company-profile')}</div>${demo}<div id="cs-company-summary" class="cs-inline"></div>`;
    function render(){const c=company(getId());q('#cs-company-summary').innerHTML=c?ro([['旅行社许可证',c.license],['签约地址',c.address],['联系电话',c.phone],['投诉联系',c.complaint],['平台企业',c.platform],['授权核对',D.companyIssues(c,day).join('；')||'可用（演示）']])+`<p><a href="interface.html?section=signature">进入12301配置</a></p>`:'请选择已维护资料的签约公司';}
    actions['company-profile']=()=>{const c=company(getId());if(!c){drawer('签约资料', '<p>请先选择并维护主体公司资料。</p>',null);return;}drawer(c.name+' · 签约资料',ro([['公司全称',c.fullName],['统一社会信用代码',c.credit]])+`<div class="cs-form cs-inline">${field('license','旅行社许可证号',c.license)}${field('phone','签约联系电话',c.phone)}${field('address','签约联系地址',c.address,null,'textarea',true)}${field('complaint','投诉联系资料',c.complaint,null,'textarea',true)}</div>`,m=>{const n={...c};['license','phone','address','complaint'].forEach(k=>n[k]=read(m,k));if(err(m,!n.license||!n.phone||!n.address?['请补齐许可证号、签约电话和地址']:[]))return;Object.assign(c,n);close(true);render();});};
    const target=q('[data-current-name]');if(target)new MutationObserver(render).observe(target,{childList:true,characterData:true,subtree:true});render();
  }
  function storeForm(host) {
    host.innerHTML=`<div class="cs-bar"><h3>合同选用</h3>${demo}</div><div class="cs-form">${field('storeCompany','签约公司','fj',S.companies.map(c=>({value:c.id,label:c.name+(D.companyIssues(c,day).length?'（待完善）':''),disabled:!!D.companyIssues(c,day).length})))}${field('storeTemplate','合同模板','T-GROUP-2026',S.templates.map(t=>({value:t.id,label:t.name+' · '+t.status,disabled:!!D.templateIssues(t,S.companies,day).length})))}${field('storeRule','合同规则','R-FJ-01',S.rules.map(r=>({value:r.id,label:r.name+' · '+r.status,disabled:!!D.ruleIssues(r,S,day).length})))}${field('storeAllow','允许本店发起签署','是',['是','否'])}</div><div data-cs-store-result class="cs-result"></div>`;
    const name=()=>q('#salesConfigStoreName')?.textContent||q('[data-detail-store-name]')?.textContent||'软件园门店';
    const validate=()=>{const choice={company:read(host,'storeCompany'),template:read(host,'storeTemplate'),rule:read(host,'storeRule'),allow:read(host,'storeAllow')==='是',store:name()};return D.storeIssues(choice,S,day);};
    const sync=()=>{const gaps=validate();result(q('[data-cs-store-result]',host),gaps,read(host,'storeAllow')==='否'?'本店不发起电子签署，原合同保留。':'示例选用条件满足 · 先签后收 · 需销售合同审核');};
    host.addEventListener('change',sync);sync();
    window.ContractStoreConfig={validate,refresh:sync,reset:()=>{const defaults={storeCompany:'fj',storeTemplate:'T-GROUP-2026',storeRule:'R-FJ-01',storeAllow:'是'};Object.keys(defaults).forEach(k=>q(`[name="${k}"]`,host).value=defaults[k]);sync();}};
  }

  qa('[data-cs-page]').forEach(host=>{
    host.classList.add('contract-settings');
    const type=host.dataset.csPage;
    if(type==='interface')initInterface(host);
    if(type==='templates')initTemplates(host,false);
    if(type==='template-edit')initTemplates(host,true);
    if(type==='rules')initRules(host);
    if(type==='company')initCompany(host);
    if(type==='store')storeForm(host);
  });
  window.dispatchEvent(new Event('contract-settings-ready'));
})();
