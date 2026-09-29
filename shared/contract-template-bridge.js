(function(root){
'use strict';
const get=(name,file)=>root[name]||(typeof require!=='undefined'?require('./'+file+'.js'):null);
const D=get('ContractSettings','contract-settings-data'),C=get('ContractCatalog','contract-template-catalog');
const F=get('ContractTemplateFields','contract-template-fields'),T=get('ContractTemplateText','contract-template-text');
const copy=x=>JSON.parse(JSON.stringify(x)),DAY='2026-09-28';
function scope(o,s){return {company:o.company,business:o.business,customer:o.business==='MICE'?'企业':'个人',range:s.range,province:s.province,days:s.days,serviceMode:s.serviceMode};}
function templateErrors(t,o,s,settings=D.newState()){
 if(!t)return ['集团合同管理员：未找到适用模板'];
 const ctx=scope(o,s),c=settings.companies.find(x=>x.id===o.company),out=[];
 if(!t.companies.includes(o.company)||t.customer!==ctx.customer||t.range!==ctx.range)out.push('模板与实际签约公司、客户或旅游范围不匹配');
 out.push(...C.applicable(D.profileFor(t),{...ctx,qualifications:c?.qualifications||[]}));
 // Only the company signing this contract is checked; another company's access cannot stand in for it.
 out.push(...D.templateIssues({...t,companies:[o.company]},settings.companies,DAY));
 out.push(...D.companyIssues(c,DAY,t.provider).map(x=>'技术／平台授权管理员：'+x));
 return [...new Set(out)];
}
function available(o,s,settings=D.newState()){return settings.templates.filter(t=>!templateErrors(t,o,s,settings).length);}
function selection(o,s,settings=D.newState()){
 const mode=o.productContractMode||'inherit',out=[],c=settings.companies.find(x=>x.id===o.company);
 const selected=mode==='specified'?{rule:null,issues:[]}:D.selectRule(settings,o,s,DAY);
 out.push(...selected.issues.map(x=>'集团合同管理员：'+x));
 // Existing named trial orders carry their own explicitly confirmed sample policy.
 // Keep those fixtures separate from the company's pending cruise policy.
 const example=o.contractRuleExample;
 const trial=example&&(o.id==='ORD-PREP-'+String(s.profile).toUpperCase()||({'ORD-PREP-CRUISE-FDD':'cruise','ORD-PREP-STUDY-FDD':'study','ORD-PREP-DOMESTIC-MANUAL':'domestic','ORD-PREP-DOMESTIC-EVIDENCE':'domestic'})[o.id]===s.profile)&&example.company===o.company&&example.business===o.business;
 const policy=trial?{company:o.company,business:o.business,review:example.review,flow:example.flow,payment:example.payment,paymentNode:example.paymentNode||'',confirmed:example.confirmed,evidence:example.evidence}:D.policy(settings,o.company,o.business);
 out.push(...D.policyIssues(policy).map(x=>'公司合同管理员：'+x));
 const id=mode==='specified'?o.templateId:selected.rule?.template,t=settings.templates.find(t=>t.id===id);
 if(!['inherit','specified'].includes(mode))out.push('产品人员：合同模板选用方式无效');
 out.push(...templateErrors(t,o,s,settings));if(!o.allow||!o.canServe)out.push('当前门店或人员没有本单办理权限');
 // Downstream contract drafts retain policy values independently of default selection.
 const policyFields=policy?Object.fromEntries(['review','flow','payment','paymentNode','confirmed','evidence'].map(k=>[k,policy[k]??''])):{};
 const rule=policy?{...copy(selected.rule||{name:trial?example.name:'公司签约条件',company:o.company,business:o.business}),...policyFields,policyId:policy.id||null,selectionId:selected.rule?.id||null}:selected.rule;
 return {mode,rule,policy,template:t||null,company:c||null,issues:[...new Set(out)],label:mode==='specified'?'产品指定模板':'沿用公司合同规则'};
}
function selectionChanged(d,selected){return d.templateId!==selected.template?.id||d.templateSnapshot?.version!==selected.template?.version||JSON.stringify(d.selectionRule)!==JSON.stringify(selected.rule)||d.selectionMode!==selected.mode;}
function snapshot(t){if(!t)return null;const n=copy(t);Object.assign(n,F.normalize(t));n.platformBinding={provider:t.provider||'12301',generation:t.generation||'platform',version:t.version,config:copy(t.platformConfig||null)};delete n.platformConfig;return n;}
function template(d){return d.templateSnapshot||null;}
function groups(d){const t=template(d),names=t?F.names(t):[],guard={insurance:'保险购买方式',cruiseInsurance:'邮轮保险购买方式',zjInsurance:'一日游投保人数及保费',formation:'不成团处理选择',studyFormation:'不成团处理选择',pooling:'拼团转团约定及旅行社',shopping:'购物与自费选择',dispute:'争议解决方式'};return (C.get(d.profile)?.groups||[]).filter(g=>!guard[g]||names.includes(guard[g]));}
function amount(o,d){return d.covered.length===o.people.length&&d.mode!=='按人分签'?Number(o.amount):d.covered.reduce((n,id)=>n+Number(d.allocations[id]||0),0);}
function context(o,s,d,settings=D.newState()){
 const c=settings.companies.find(c=>c.id===o.company)||{},v=d.values||{},a=d.decisions||{},t=template(d),values={};
 const joined=keys=>keys.every(k=>String(v[k]||'').trim())?keys.map(k=>v[k]).join('\n'):'';
 const itinerary=s.itinerary.map(x=>[x.day,x.date,x.content].join(' ')).join('\n');
 const covered=o.people.filter(p=>d.covered.includes(p.id));
 const feeText=d.covered.length===o.people.length&&d.mode!=='按人分签'?s.fees.map(x=>x.name+' '+Number(x.amount).toFixed(2)+'元').join('；'):covered.map(p=>p.name+' '+Number(d.allocations[p.id]).toFixed(2)+'元').join('；');
 const enabled=s.verified;
 Object.assign(values,{
  'company.name':c.fullName||'', 'company.license':c.license||'', 'company.phone':c.phone||'',
  'contract.representative':d.representative,'contract.contact':d.representativePhone,
  'contract.travelers':covered.map(p=>({id:p.id,name:p.name,documentType:p.documentType||(String(p.identity||'').includes('身份证')?'居民身份证':''),identity:p.identity})), 'contract.amount':amount(o,d),
  'order.product':o.product, 'order.dates':{start:o.start,end:o.end}, 'order.days':s.days,
  'order.payments':enabled?s.payment:'','order.includes':enabled?(o.feeIncludes||'按本单确认的行程及服务清单包含交通、餐住和服务。'):'',
  'order.excludes':enabled?(o.feeExcludes||'本单不含个人消费和未购买服务。'):'',
  'product.includes':enabled?(s.productIncludes||'所选产品方案：含行程所列交通、餐住及服务。'):'',
  'product.excludes':enabled?(s.productExcludes||'所选产品方案：不含个人消费。'):'',
  'confirmed.itinerary':itinerary,'prepare.reception':enabled?s.organization:'',
  'order.cruise':o.product,'confirmed.ports':joined(['cruiseTrip-1','cruiseTrip-2']),
  'confirmed.cruise':joined(['cruiseTrip-0','cruiseTrip-1']),
  'contract.cabins':enabled?'采用本单确认舱等；本份覆盖 '+covered.length+' 人，舱房分配随附。':'',
  'order.study':o.product,'order.studyDates':o.start+' 至 '+o.end,
  'confirmed.curriculum':joined(['studyTrip-0','studyTrip-1','studyTrip-2','studyTrip-3']),
  'contract.studyFees':enabled?feeText:'','confirmed.dayTrip':joined(['dayTrip-0','dayTrip-1','dayTrip-2']),
  'order.service':o.product,'confirmed.services':joined(['services-0','services-1']),
  'confirmed.materials':v['services-2']||'','confirmed.refund':v['serviceChange-0']||s.cancellation||'',
  'contract.serviceAttachment':itinerary,'contract.feeAttachment':enabled?feeText:'',
  'confirmed.cabinRules':enabled&&s.profile==='cruise'?'本次确认的舱房及船票规则V1；'+s.cancellation:''
 });
 const daily=enabled?s.itinerary.map((x,i)=>({id:x.id||'day-'+i,day:x.day,date:x.date,content:x.content})):[];
 for(const key of ['confirmed.itineraryRows','confirmed.cruiseRows','confirmed.studyRows','confirmed.serviceRows'])values[key]=copy(daily);
 const feeRows=enabled?(d.covered.length===o.people.length&&d.mode!=='按人分签'?s.fees.map((x,i)=>({id:x.id||'fee-'+i,name:x.name,amount:x.amount})):covered.map(p=>({id:'fee-'+p.id,name:p.name+'本份已确认旅游费',amount:d.allocations[p.id]}))):[];
 values['contract.feeRows']=copy(feeRows);values['contract.studyFeeRows']=copy(feeRows);
 const input={
  '保险购买方式':a.insurance==='待确认'?'':a.insurance,
  '保险产品及保障计划':a.insurancePremium,
  '被保险人及保费':a.insurancePeople&&a.insurancePremium?(d.covered.length<o.people.length?'本份覆盖游客：'+covered.map(p=>p.name).join('、')+'；本次投保清单及已确认保费随附，不重复计费':a.insurancePeople+'；'+a.insurancePremium):'',
  '邮轮保险购买方式':a.cruiseInsurance==='待确认'?'':a.cruiseInsurance,
  '邮轮保险产品及保费':a.cruisePremium,
  '一日游保险产品及保额':v['zjInsurance-0']||'', '一日游投保人数及保费':v['zjInsurance-1']||'',
  '成团人数与通知安排':v[t?.profile==='study'?'studyFormation-1':'formation-1']||'',
  '不成团处理选择':[['transfer','转社'],['delay','延期'],['reroute','改线'],['terminate','解除']].filter(([k])=>k!=='transfer'||t?.profile!=='study').map(([k,label])=>label+'：'+(a[k]||'待确认')).join('；'),
  '实际旅行社名称':[a.transfer==='同意'?a.transferAgency:'',a.pooling==='同意'?a.poolAgency:''].filter(Boolean).join('；'),
  '拼团转团约定及旅行社':a.pooling==='待确认'?'':a.pooling==='同意'?a.poolAgency:a.pooling,
  '争议解决方式':a.dispute==='待确认'?'':a.dispute, '法院或仲裁机构':a.institution,
  '购物与自费选择':a.shopping==='待确认'?'':a.shopping==='确认无安排'?'无安排':a.shopping+'；'+(v['shopping-1']||''),
  '补充约定':d.extra||'', ...(d.fieldInputs||{})
 };
 return {values,input,choices:{insurance:a.insurance,cruiseInsurance:a.cruiseInsurance,agency:a.transfer==='同意'||a.pooling==='同意',authorized:d.signers.some(x=>x.required&&x.relation!=='本人')}};
}
function fieldIssues(o,s,d,settings=D.newState()){
 const t=template(d);if(!t)return [{step:0,text:'集团合同管理员：合同模板尚未确定'}];
 const out=F.issues(t).map(text=>({step:0,text:'集团合同管理员：'+text}));
 F.resolved(t,context(o,s,d,settings)).filter(r=>r.missing).forEach(r=>(r.errors.length?r.errors:[r.name+'待补']).forEach(text=>out.push({step:r.mode==='input'?2:0,text:(r.mode==='input'?'合同准备：':'来源资料：')+text})));
 return out;
}
function document(o,s,d,settings=D.newState()){
 const t=template(d);if(!t)return '合同模板尚未确定，请先处理选用问题。';
 return F.preview(t,context(o,s,d,settings));
}
function confirmedTerms(o,s,d,settings=D.newState()){
 const r=document(o,s,d,settings);if(!r.rows)return {};
 const text=names=>r.rows.filter(r=>names.includes(r.key||r.name)&&r.applicable).map(F.display).join('；');
 return {itinerary:s.itinerary.map(x=>x.day+' '+x.content).join('\n'),insurance:text(['保险购买方式','保险产品及保障计划','被保险人及保费','邮轮保险购买方式','邮轮保险产品及保费','一日游保险产品及保额','一日游投保人数及保费']),formation:text(['成团人数与通知安排','不成团处理选择','实际旅行社名称']),cancellation:text(['变更与解除约定','退款期限']),force:text(['责任减免及不可抗力约定','航次与港口变更约定']),breach:text(['违约责任条款']),dispute:text(['争议解决方式','法院或仲裁机构']),other:text(['补充约定'])};
}
root.ContractTemplateBridge={scope,templateErrors,available,selection,selectionChanged,snapshot,template,groups,amount,context,fieldIssues,document,confirmedTerms,copy};
if(typeof module!=='undefined')module.exports=root.ContractTemplateBridge;
})(typeof window==='undefined'?globalThis:window);
