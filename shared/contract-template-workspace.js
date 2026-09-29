(function(root){
  'use strict';
  const F=root.ContractTemplateFields,T=root.ContractTemplateText;
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(label,action,value='',cls='btn-text')=>`<button type="button" class="${cls}" data-cs-action="${action}" data-cs-value="${e(value)}">${e(label)}</button>`;
  const input=(name,label,value,options,type='text')=>`<label class="ce-property-field"><span>${e(label)}</span>${options?`<select class="form-control" name="${name}">${options.map(([v,label])=>`<option value="${e(v)}" ${v===value?'selected':''}>${e(label)}</option>`).join('')}</select>`:type==='textarea'?`<textarea class="form-control" name="${name}" rows="6">${e(value)}</textarea>`:`<input class="form-control" name="${name}" value="${e(value)}">`}</label>`;
  const info=(label,value)=>`<div class="ce-property-value"><span>${e(label)}</span><div>${e(value)}</div></div>`;
  function segments(t){const out=[];let end=0;for(const m of T.body(t).matchAll(/【([^】\n]+)】/g)){if(m.index>end)out.push({type:'text',start:end,end:m.index,text:T.body(t).slice(end,m.index)});const slot=t.slots?.find(s=>s.id===m[1].slice(1));out.push({type:'field',start:m.index,end:m.index+m[0].length,slot:slot?.id,id:slot?.fieldId});end=m.index+m[0].length;}if(end<T.body(t).length)out.push({type:'text',start:end,end:T.body(t).length,text:T.body(t).slice(end)});return out;}
  function sampleTable(t,f){const row=F.preview(t,F.sample(t,'joint',t.companies[0])).rows.find(r=>r.id===f.id);if(!row)return '';return `<div class="ce-sample-table"><table><thead><tr>${f.showRowNumber?'<th>序号</th>':''}${f.columns.map(c=>`<th>${e(c.label)}</th>`).join('')}</tr></thead><tbody>${(row.value||[]).slice(0,3).map((r,i)=>`<tr>${f.showRowNumber?`<td>${i+1}</td>`:''}${f.columns.map(c=>`<td>${e(r[c.source]??'待补')}</td>`).join('')}</tr>`).join('')}</tbody></table><span class="ce-caption">${(row.value||[]).length>3?'仅显示前3行 · ':''}按实际资料条数生成</span></div>`;}
  function properties(t,state,editable){
    const selection=state.selection;
    let body='',title='',save=true;
    if(selection?.kind==='text'){
      const part=segments(t).find(p=>p.type==='text'&&p.start===selection.start);title='正文文字';body=part?input('ce-text','编辑固定条款',part.text,null,'textarea'):info('正文','请选择需要编辑的文字');
    }else{
      const row=F.rows(t).find(r=>r.config.id===selection?.id);if(!row)return '<aside class="ce-properties"><h3>内容设置</h3><p class="cs-sub">选择一项资料或正文内容。</p></aside>';
      const {spec:s,config:f}=row;title=f.name;
      if(f.mode==='signature'){save=false;body=info('填写方式','实际签署完成后填入')+info('签署安排','通过页面顶部“签署设置”核对角色和文件。');}
      else {
        const file=t.generation==='file';
        body=file?input('ce-label',s.type==='table'?'表格名称':'填写项名称',f.name):info('平台填写项',f.name);
        if(s.type==='table'){
          body+=info('资料来源',F.sourceLabel(f));
          body+=`<div class="ce-property-value"><span>${file?'展示列':'平台要求的列'}</span><div class="ce-columns">${f.columns.map((c,i)=>`<div data-ce-column="${e(c.id)}"><div class="ce-column-head"><span>${e(s.columns.find(x=>x.id===c.id)?.label||c.label)} · 必需</span>${file?`<div>${button('上移','column-move',c.id+'|-1')}${button('下移','column-move',c.id+'|1')}</div>`:''}</div>${file?`<input name="ce-column-label" class="form-control" aria-label="${e(c.label)}展示列名" value="${e(c.label)}">`:`<strong>${e(c.label)}</strong>`}</div>`).join('')}</div></div>`;
          if(file)body+=`<label class="ce-checkbox"><input name="ce-row-number" type="checkbox" ${f.showRowNumber?'checked':''}>显示序号列</label>`;
          body+=info('资料缺少时','不能生成合同，返回合同准备补齐')+info('排列顺序','沿用已确认资料顺序');
        }else{
          body+=s.modes.length>1?input('ce-mode','填写方式',f.mode,s.modes.map(v=>[v,F.modes[v]])):info('填写方式',F.modes[f.mode]);
          if(f.mode==='erp')body+=s.sources.length>1?input('ce-source','采用资料',f.source,s.sources.map(v=>[v,F.sources[v].label])):info('资料来源',F.sourceLabel(f));
          else if(f.mode==='fixed')body+=file||s.modes.includes('input')?input('ce-value','固定内容',f.value,null,'textarea'):info('模板固定条款',f.value);
          else body+=info('销售填写位置','合同准备 → '+f.name)+(s.choices?info('可选内容',s.choices.join('、')):'');
          body+=s.conditions.length>1?input('ce-condition','填写要求',f.condition,s.conditions.map(v=>[v,F.conditions[v]])):info('填写要求',F.conditions[f.condition]);
          if(f.mode==='erp')body+=info('销售直接修改','不允许；在对应业务资料中核对');
        }
      }
      if(!/name="ce-/.test(body))save=false;
    }
    return `<aside class="ce-properties"><div class="ce-property-heading"><span class="ce-caption">${selection?.kind==='text'?'固定条款':'当前选中'}</span><h3>${e(title)}</h3></div><div class="ce-property-form">${body}</div><div id="ce-property-error" role="status"></div>${save&&editable?`<div class="ce-property-actions">${button('应用修改','apply-property','','btn btn-secondary')}${button('取消修改','reset-property')}</div>`:''}${t.generation==='file'&&selection?.slot&&editable?button('移除此处填写位置','remove-position',selection.slot):''}</aside>`;
  }
  function render(t,state,{editable=true,role='business'}={}){
    const rows=F.rows(t),file=t.generation==='file';
    if(!rows.some(r=>r.config.id===state.selection?.id)&&state.selection?.kind!=='text')state.selection={kind:'field',id:(file?rows.find(r=>r.spec.kind==='travelers')||rows[0]:rows[0])?.config.id};
    if(state.file!=='body'&&!t.attachments.includes(state.file))state.file='body';
    const header=`<div class="ce-workbar"><h3>${file?'合同文书':t.generation==='manual'?'平台办理资料':'平台模板所需资料'}</h3><div class="ce-work-actions"><span id="cs-platform-summary" class="ce-caption">${t.generation==='manual'?'到平台办理':t.platformConfig?'对应草稿已保存 · 待接口核实':'接口资料待核实'}</span>${button('对接检查','platform-fields')}${button('文件与附件','template-files')}${file&&state.file==='body'?button('插入内容','insert-content','all','btn btn-secondary'):''}</div></div>`;
    let main='';
    if(!file){
      const groups=[...new Set(rows.map(r=>r.spec.group))];
      main=`<div class="ce-native"><div id="cs-template-requirements" class="ce-required-groups">${groups.map(group=>`<section><h4>${e(group)}</h4>${rows.filter(r=>r.spec.group===group).map(({config:f,spec:s})=>`<button type="button" class="ce-required-row ${f.id===state.selection?.id?'is-selected':''}" data-cf-name="${e(f.key)}" data-content-id="${e(f.id)}" data-cs-action="configure-content" data-cs-value="${e(f.id)}" aria-pressed="${f.id===state.selection?.id}"><span>${e(f.name)}</span><span>${e(s.type==='table'?F.sourceLabel(f):f.mode==='fixed'?'模板固定条款':F.sourceLabel(f))}</span><small>${e(F.conditions[f.condition])}</small></button>`).join('')}</section>`).join('')}</div>${properties(t,state,editable)}</div>`;
    }else{
      const slotFields=new Set(t.slots?.map(s=>s.fieldId));
      const left=`<aside class="ce-files"><h4>合同文件</h4>${['body',...t.attachments].map(name=>`<button type="button" class="ce-file ${state.file===name?'is-selected':''}" data-cs-action="editor-file" data-cs-value="${e(name)}" aria-pressed="${state.file===name}">${e(name==='body'?'合同正文':name)}</button>`).join('')}<h4>正文填写项</h4>${rows.filter(r=>slotFields.has(r.config.id)).map(({config:f})=>`<button type="button" data-cf-name="${e(f.key)}" data-cs-action="locate-content" data-cs-value="${e(f.id)}" class="ce-file ce-field-link ${f.id===state.selection?.id?'is-selected':''}">${e(f.name)}</button>`).join('')}</aside>`;
      let body='';
      if(state.file==='body')body=segments(t).map(part=>{
        if(part.type==='text')return part.text.trim()?`<button type="button" class="ce-text ${state.selection?.kind==='text'&&state.selection.start===part.start?'is-selected':''}" data-cs-action="editor-text" data-cs-value="${part.start}">${e(part.text)}</button>`:e(part.text);
        const row=rows.find(r=>r.config.id===part.id);if(!row)return '<span class="cs-error">填写位置失效</span>';const f=row.config;
        return row.spec.type==='table'?`<section class="ce-document-table ${state.selection?.id===f.id?'is-selected':''}" data-ce-slot="${e(part.slot)}"><button type="button" class="cs-text-slot" data-cs-action="select-position" data-cs-value="${e(part.slot)}">${e(f.name)}</button>${sampleTable(t,f)}</section>`:`<button type="button" class="cs-text-slot ${state.selection?.id===f.id?'is-selected':''}" data-ce-slot="${e(part.slot)}" data-cs-action="select-position" data-cs-value="${e(part.slot)}">${e(f.name)}</button>`;
      }).join('');
      else {const r=rows.find(r=>r.config.key===state.file);body=r?.spec.type==='table'?`<section class="ce-document-table">${button(r.config.name,'configure-content',r.config.id)}${sampleTable(t,r.config)}</section>`:info('文件要求',state.file==='企业授权书'?'销售在合同准备中上传本次有效授权书':'合同准备中带入本次确认的'+state.file);}
      main=`<div class="ce-compose">${left}<div class="ce-canvas"><article class="ce-document"><h2>${e(state.file==='body'?t.name||'合同正文':state.file)}</h2><p class="ce-caption">${state.file==='body'?'原型文书 · 点击正文或填写项进行编辑':'附件资料样例'}</p><div class="ce-document-body">${body}</div></article></div>${properties(t,state,editable)}</div>`;
    }
    return `<section class="ce-workspace" data-editor-generation="${e(t.generation)}">${header}${main}</section>`;
  }
  root.ContractTemplateWorkspace={render,segments,sampleTable};
})(window);
