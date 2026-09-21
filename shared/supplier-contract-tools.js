/* 供应商协议模板、合同生成与临期提醒的页面规则；不调用外部服务。 */
(function(root){
  'use strict';
  const copy=v=>JSON.parse(JSON.stringify(v));
  const categories=['境外地接','国内旅行社','出境批发商','单项供应商','综合类供应商'];
  const companies=['福建凯撒','北京凯撒','上海凯撒','亿步','体坛','亿步山西分公司'];
  const variables=['供应商全称','注册登记号','供应商地址','协议名称','合作内容','开始日期','截止日期','各签约公司约定','签章栏'];
  const requiredVariables=['供应商全称','协议名称','合作内容','开始日期','截止日期','各签约公司约定','签章栏'];
  const defaultText='供应商合作协议（示例文本）\n\n协议名称：{{协议名称}}\n供应商：{{供应商全称}}\n注册登记号：{{注册登记号}}\n地址：{{供应商地址}}\n合作期限：{{开始日期}} 至 {{截止日期}}\n合作内容：{{合作内容}}\n\n一、各签约公司约定\n{{各签约公司约定}}\n\n二、服务及结算依据\n具体服务范围、报价及结算依据以本次双方确认的协议附件为准。\n\n三、双方签章\n{{签章栏}}';
  const templates=[
    {id:'SUP-COOP-001',name:'供应商通用合作协议',version:'V1.0',status:'启用',categories:categories.slice(),companies:companies.slice(),text:defaultText,owner:'采购／法务',updated:'2026-09-21'},
    {id:'SUP-DMC-001',name:'境外地接合作协议',version:'V1.0',status:'启用',categories:['境外地接'],companies:companies.slice(),text:defaultText.replace('供应商合作协议（示例文本）','境外地接合作协议（示例文本）'),owner:'采购／法务',updated:'2026-09-21'},
    {id:'SUP-SERVICE-002',name:'综合服务合作协议',version:'V2.0',status:'待审核',categories:['综合类供应商'],companies:['福建凯撒'],text:defaultText,owner:'采购／法务',updated:'2026-09-21'},
    {id:'SUP-COOP-000',name:'供应商通用合作协议旧版',version:'V0.9',status:'停用',categories:categories.slice(),companies:companies.slice(),text:defaultText,owner:'采购／法务',updated:'2026-08-01'}
  ];
  const notice={id:'SUP-EXPIRY-001',name:'供应商协议临期提醒',version:'V1.0',status:'启用',channels:['站内信','企业微信'],text:'{{我方签约主体}}：与{{供应商全称}}签订的《{{协议名称}}》（{{协议编号}}）将于{{截止日期}}到期，剩余{{剩余天数}}天。请查看协议并按需办理续签。'};
  const noticeVariables=['我方签约主体','供应商全称','协议名称','协议编号','截止日期','剩余天数'];
  function validateText(text,allowed,required){
    if(!text.trim())return '请填写模板正文。';
    const used=Array.from(text.matchAll(/\{\{([^{}]+)\}\}/g),m=>m[1]);
    const unknown=used.find(v=>!allowed.includes(v));if(unknown)return '未识别字段：'+unknown+'。请使用可插入字段。';
    if(text.replace(/\{\{[^{}]+\}\}/g,'').includes('{{')||text.replace(/\{\{[^{}]+\}\}/g,'').includes('}}'))return '正文中有未闭合的字段标记。';
    const missing=required.filter(v=>!used.includes(v));return missing.length?'正文缺少：'+missing.join('、')+'。':'';
  }
  function validateTemplate(t){return !t.name.trim()?'请填写模板名称。':!t.version.trim()?'请填写版本。':!t.categories.length?'请选择适用供应商类型。':!t.companies.length?'请选择适用签约公司。':validateText(t.text,variables,requiredVariables);}
  function matches(t,s,a){return t.status==='启用'&&t.categories.some(c=>s.categories.includes(c))&&a.bodies.length>0&&a.bodies.every(b=>t.companies.includes(b.company));}
  function term(b){return b.kind==='月结'?'月结；'+(b.monthRule||'结算日及付款日待确认'):b.kind==='事件后付款'?b.event+'后'+b.days+'天':b.otherRule||'具体约定待确认';}
  function facts(s,a){return JSON.stringify({supplier:s.name,registration:s.registration,address:s.address,categories:s.categories,name:a.name,service:a.service,start:a.start,end:a.end,bodies:a.bodies.map(b=>({company:b.company,kind:b.kind,event:b.event,days:b.days,monthRule:b.monthRule,otherRule:b.otherRule,currency:b.currency,contact:b.contact,phone:b.phone,fee:b.fee}))});}
  function validateGeneration(t,s,a){
    if(!t||!matches(t,s,a))return '模板未启用，或不适用于当前供应商类型及全部签约公司。';
    const te=validateTemplate(t);if(te)return te;
    if(!s.name.trim()||!a.name.trim()||!a.service.trim())return '请先填写供应商全称、协议名称和合作内容。';
    if(!a.start||!a.end||a.end<a.start)return '请填写正确的协议开始及截止日期。';
    if(new Set(a.bodies.map(b=>b.company)).size!==a.bodies.length)return '签约公司不能重复。';
    for(const b of a.bodies){
      if(!b.company||!b.currency.length)return '请填写每个签约公司及结算币种。';
      if(b.kind==='事件后付款'&&(b.days===''||!Number.isInteger(Number(b.days))||Number(b.days)<0))return '请填写正确的账期天数。';
      if(b.kind==='月结'&&!b.monthRule.trim())return '请补充月结的结算日及付款日约定后生成合同。';
      if(b.kind==='其他约定'&&!b.otherRule.trim())return '请填写其他账期约定。';
    }
    return '';
  }
  function generate(t,s,a,today){
    const problem=validateGeneration(t,s,a);if(problem)throw Error(problem);
    const values={'供应商全称':s.name,'注册登记号':s.registration||'未填写','供应商地址':s.address||'未填写','协议名称':a.name,'合作内容':a.service,'开始日期':a.start,'截止日期':a.end,
      '各签约公司约定':a.bodies.map((b,i)=>(i+1)+'. '+b.company+'\n账期：'+term(b)+'\n结算币种：'+b.currency.join('、')+'\n业务联系人：'+(b.contact||'待补充')+'；电话：'+(b.phone||'待补充')+'\n平台使用费：'+(b.fee||'未约定')).join('\n\n'),
      '签章栏':a.bodies.map(b=>b.company+'（盖章）：____________').join('\n')+'\n'+s.name+'（盖章）：____________\n签署日期：____________'};
    return {name:a.name+'-'+t.version+'-生成稿.html',generated:true,templateId:t.id,templateName:t.name,templateVersion:t.version,date:today,facts:facts(s,a),text:t.text.replace(/\{\{([^{}]+)\}\}/g,(_,key)=>values[key])};
  }
  function current(file,s,a){return !file||!file.generated||(file.facts===facts(s,a)&&(!a.templateId||file.templateId===a.templateId)&&templates.some(t=>t.id===file.templateId&&t.version===file.templateVersion&&matches(t,s,a)));}
  function prepareForSubmission(s,a,today){
    if(!a||a.contractMode!=='template')return;
    if(!a.templateId)throw Error('请选择协议模板。');
    if(a.contract&&a.contract.generated&&current(a.contract,s,a))return;
    const file=generate(templates.find(t=>t.id===a.templateId),s,a,today);
    if(a.contract){a.contractHistory=a.contractHistory||[];a.contractHistory.push(copy(a.contract));}
    a.contract=file;
  }
  const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function html(file){return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>'+escape(file.name)+'</title><body><p>合同生成稿 · '+escape(file.templateName)+' '+escape(file.templateVersion)+' · '+escape(file.date)+'</p><pre>'+escape(file.text)+'</pre></body></html>';}
  function day(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return NaN;const n=Date.parse(date+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===date?n/86400000:NaN;}
  function dateAt(n){return new Date(n*86400000).toISOString().slice(0,10);}
  function offsets(value){return String(value).split(/[,，、\s]+/).filter(Boolean).map(Number);}
  function validateReminder(r){
    if(!r.enabled)return '';
    const days=offsets(r.days);if(!days.length||days.some(n=>!Number.isInteger(n)||n<0||n>365)||new Set(days).size!==days.length)return '提前天数须为0至365的不同整数，多个用逗号分隔。';
    if(!r.recipients.trim())return '请填写本公司提醒接收人。';
    if(!r.channels.length||r.channels.some(c=>!notice.channels.includes(c)))return '请选择站内信或企业微信渠道。';return '';
  }
  function plans(s,a,company,r,today,records=[]){
    const problem=validateReminder(r);if(problem)throw Error(problem);
    if(!a.bodies.some(b=>b.company===company))throw Error('该公司不是本协议签约方。');
    if(!Number.isFinite(day(today))||!Number.isFinite(day(a.end)))throw Error('请填写正确的检查日期和协议截止日期。');
    if(!r.enabled)return [];
    return offsets(r.days).sort((a,b)=>b-a).flatMap(n=>r.channels.map(channel=>{
      const due=dateAt(day(a.end)-n),key=[s.id,a.no,company,a.end,n,channel].join('|');
      const sent=records.find(p=>p.key===key);
      const state=a.end<today?'已到期，不再生成临期提醒':a.status!=='已归档'||a.effective!=='已确认'?'生效条件待确认':due>today?'待触发':due<today?'已过提醒日':sent?'已预览，不重复生成':'可预览';
      const values={'我方签约主体':company,'供应商全称':s.name,'协议名称':a.name,'协议编号':a.no,'截止日期':a.end,'剩余天数':String(n)};
      return {key,company,due,channel,state,recipients:r.recipients,content:notice.text.replace(/\{\{([^{}]+)\}\}/g,(_,k)=>values[k]),delivery:channel==='企业微信'?'通道未接通，未发送':'仅预览，未发送',date:today,templateVersion:notice.version};
    }));
  }
  root.SupplierContractTools={categories,companies,templates,notice,variables,requiredVariables,noticeVariables,defaultText,copy,validateText,validateTemplate,matches,facts,generate,current,prepareForSubmission,html,day,offsets,validateReminder,plans};
})(typeof window==='undefined'?globalThis:window);
