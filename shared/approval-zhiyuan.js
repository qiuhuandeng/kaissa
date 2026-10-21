/* Third-party approval template configuration prototype; never executes internal approval nodes. */
(function (root) {
  'use strict';
  const tags = [
    ['applicant_name', '申请人'], ['applicant_department', '发起人所在部门'],
    ['business_no', '来源单据号'], ['payment_company', '付款公司'],
    ['supplier_name', '付款对象'], ['application_amount', '申请金额'],
    ['currency', '币种'], ['application_type', '申请类型'],
    ['solution_content', '处理方案与依据'], ['solution_images', '方案图片'],
    ['ticket_store', '所属门店'], ['ticket_customer', '客户姓名'],
    ['ticket_member', '会员号'], ['exchange_names', '置换商品名称（逐项）'],
    ['exchange_quantities', '置换商品数量（逐项）']
  ];
  const types = {text:'文本',textarea:'多行文本',number:'数字',date:'日期',image:'图片',attachment:'附件'};
  const clone = value => JSON.parse(JSON.stringify(value));
  function defaults() {
    const fields = [
      ['document-no','来源单据号','text','business_no'],
      ['applicant','申请人','text','applicant_name'],
      ['department','申请部门','text','applicant_department'],
      ['company','付款公司','text','payment_company'],
      ['payee','付款对象','text','supplier_name'],
      ['amount','申请金额','number','application_amount'],
      ['currency','币种','text','currency'],
      ['application-type','申请类型','text','application_type'],
      ['reason','申请原因','textarea','solution_content'],
      ['images','方案图片','image','solution_images']
    ].map(([id,label,type,source],i)=>({id,label,type,required:i<9,value:'$'+source}));
    return {provider:'zhiyuan',name:'付款申请志远模板',scene:'付款申请',companies:['fj','bj'],
      departmentMode:'all',departments:[],includeChildren:true,templateCode:'ZY-PAY-001',
      templateName:'付款申请',templateContent:JSON.stringify(fields,null,2),enabled:true};
  }
  function parse(content) {
    let raw;
    try { raw=JSON.parse(content); } catch (_) { return {fields:[],issue:'模板内容格式待完善；当前文字可保存为草稿。'}; }
    const fields=Array.isArray(raw)?raw:raw?.fields;
    if(!Array.isArray(fields)||!fields.length)return {fields:[],issue:'模板内容需包含字段列表；当前文字可保存为草稿。'};
    const ids=new Set();
    for(const f of fields){
      if(!f||typeof f!=='object'||Array.isArray(f)||typeof f.id!=='string'||!f.id.trim()||typeof f.label!=='string'||!f.label.trim()||ids.has(f.id))return {fields:[],issue:'字段标识或字段名称缺失，或字段标识重复；当前文字可保存为草稿。'};
      ids.add(f.id);
    }
    return {fields,issue:''};
  }
  function mapping(field) {
    const value=field.value==null?'':typeof field.value==='string'?field.value:JSON.stringify(field.value);
    const mode=['system','fixed'].includes(field.valueMode)?field.valueMode:(value.startsWith('$')?'system':'fixed');
    return {id:field.id,mode,value:mode==='system'&&value.startsWith('$')?value.slice(1):value};
  }
  function updateMapping(content,id,mode,value) {
    const raw=JSON.parse(content),fields=Array.isArray(raw)?raw:raw.fields;
    const field=fields.find(f=>f.id===id);
    if(field){field.value=mode==='system'?'$'+value:value;field.valueMode=mode;}
    return JSON.stringify(raw,null,2);
  }
  function issues(template) {
    const result=parse(template.templateContent),messages=[];
    if(!template.name.trim())messages.push('模板名称待填写');
    if(!template.templateCode.trim())messages.push('志远模板编号待填写');
    if(!template.templateName.trim())messages.push('志远模板名称待填写');
    if(!template.companies.length)messages.push('适用公司待选择');
    if(template.departmentMode==='selected'&&!template.departments.length)messages.push('适用部门待选择');
    if(result.issue)messages.push(result.issue);
    if(result.fields.some(f=>{const m=mapping(f);return m.mode==='system'?!tags.some(([id])=>id===m.value):f.required&&!m.value.trim();}))messages.push('字段关联待完善');
    return messages;
  }
  function save(state,id,template,makeId) {
    state.zhiyuanTemplates=state.zhiyuanTemplates||[];
    let record=state.zhiyuanTemplates.find(r=>r.id===id);
    if(!record){record={id:id||makeId(),provider:'zhiyuan',published:null,draft:null,disabled:false,versions:[]};state.zhiyuanTemplates.unshift(record);}
    const messages=issues(template);
    record.draft={...clone(template),mappings:parse(template.templateContent).fields.map(mapping)};
    return {record,messages};
  }
  function publish(state,id) {
    const record=state.zhiyuanTemplates?.find(r=>r.id===id);
    if(!record?.draft)return {errors:['当前没有待发布的草稿']};
    const saved=clone(record.draft),messages=issues(saved);
    // Prototype publication records the current input; notices never replace it with invented values.
    saved.mappings=parse(saved.templateContent).fields.map(mapping);
    record.published=saved;record.draft=null;record.disabled=saved.enabled===false;
    record.versions.push({number:(record.versions.at(-1)?.number||0)+1,at:new Date().toLocaleString('zh-CN'),by:'审批管理员',template:clone(saved)});
    return {errors:[],record,messages};
  }
  const api={tags,types,defaults,parse,mapping,updateMapping,issues,save,publish};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ApprovalZhiyuan=api;
})(typeof window!=='undefined'?window:globalThis);
