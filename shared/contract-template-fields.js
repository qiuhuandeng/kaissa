(function(root){
'use strict';
const T=root.ContractTemplateText||(typeof require!=='undefined'?require('./contract-template-text.js'):null);
const copy=v=>JSON.parse(JSON.stringify(v));
const conditions={always:'必填',optional:'选填',insurance:'委托购买旅游意外险时',cruiseInsurance:'委托购买邮轮保险时',agency:'存在转社或拼团时',authorized:'代表、监护或委托签署时'};
const modes={erp:'自动带入',fixed:'固定内容',input:'签约时填写',signature:'签署结果'};
const specs={},sources={};
function erp(name,key,label,sample,group='行程与服务',type='text',extra={}){
 if(type==='dateRange'){const dates=String(sample).match(/\d{4}-\d{2}-\d{2}/g)||[];sample={start:dates[0]||'',end:dates[1]||''};}
 sources[key]={label,sample,type};specs[name]={name,group,type,modes:['erp'],sources:[key],condition:'always',conditions:['always'],editable:false,...extra};
}
function manual(name,label,group='本次约定',condition='always',extra={}){
 const key='prepare.'+name;sources[key]={label:'合同准备 → '+label,sample:'',type:'text'};
 specs[name]={name,group,type:'text',modes:['input'],sources:[key],condition,conditions:condition==='optional'?['optional','always']:[condition],editable:true,...extra};
}
function fixed(name,value,group='合同约定',extra={}){specs[name]={name,group,type:'text',modes:['fixed'],sources:[],value,condition:'always',conditions:['always'],editable:false,...extra};}
erp('签约公司','company.name','实际签约公司 → 公司全称','福建凯撒国际旅行社有限公司','合同当事人');
erp('旅行社许可证号','company.license','实际签约公司 → 旅行社许可证号','L-FJ-示例','合同当事人');
erp('旅行社电话','company.phone','实际签约公司 → 签约联系电话','0592-0000000','合同当事人');
erp('游客或代表姓名','contract.representative','合同准备 → 本份游客代表姓名','张建国','合同当事人');
erp('联系电话','contract.contact','合同准备 → 本份游客代表联系电话','138****8001','合同当事人');
erp('游客名单及授权材料','contract.travelers','本份合同 → 覆盖游客名单及授权材料',[],'合同当事人','list');
erp('合同总额','contract.amount','本份合同 → 已确认分配金额',30000,'费用与付款','money');
erp('付款安排','order.payments','订单 → 已确认付款节点及本份分配','首款及尾款按本份已确认付款安排。','费用与付款');
erp('费用包含','order.includes','订单 → 本次已确认费用包含','交通、住宿、餐饮及行程内服务。','费用与付款');
// Only comparable business sources are offered; order totals and arbitrary expressions are absent.
sources['product.includes']={label:'产品已选方案 → 费用包含（生成时留存）',sample:'产品方案含交通、住宿及行程服务。',type:'text'};specs['费用包含'].sources.push('product.includes');
erp('费用不含','order.excludes','订单 → 本次已确认费用不含','个人消费及未购买服务。','费用与付款');
sources['product.excludes']={label:'产品已选方案 → 费用不含（生成时留存）',sample:'产品方案不含个人消费。',type:'text'};specs['费用不含'].sources.push('product.excludes');
[
 ['线路名称','order.product','订单 → 确认线路名称','日本关西深度游'],
 ['出发返回日期','order.dates','订单 → 已确认出发与返回日期','2026-10-12 至 2026-10-16','dateRange'],
 ['天数','order.days','订单 → 本次行程天数',5,'number'],
 ['行程单','confirmed.itinerary','本次确认资料 → 行程单及版本','行程V1：D1抵达、D2—D4按逐日确认行程、D5返程。','file'],
 ['集合与接待安排','prepare.reception','合同准备 → 核对本次集合与组织接待安排','08:00机场集合；组团及接待旅行社按本次确认资料。'],
 ['邮轮名称与航次','order.cruise','订单 → 所选船舶与航次','理想号地中海航次'],
 ['登离船安排','confirmed.ports','本次确认资料 → 登离船日期及港口','10月12日登船、10月16日离船，港口按确认行程。'],
 ['邮轮行程与服务标准','confirmed.cruise','本次确认资料 → 航程、舱等及岸上服务标准','航程V1：海景舱，船上三餐；停靠港及岸上时长见确认行程。'],
 ['舱房与人数','contract.cabins','本份合同 → 已确认舱房与覆盖人数','海景舱1间，覆盖游客2人。'],
 ['研学项目名称','order.study','订单 → 研学项目名称','北京科技研学营'],
 ['服务日期与地点','order.studyDates','订单 → 营期日期及地点','2026-10-12 至 2026-10-14，北京'],
 ['研学课程与服务标准','confirmed.curriculum','本次确认资料 → 课程、课时、导师及安全安排','课程V1：航天课程6课时、实践4课时；导师及安全安排见确认日程。'],
 ['研学费用明细','contract.studyFees','本份合同 → 课程费与旅行服务费分类','课程费与交通餐住分别列示，合计等于本份合同金额。','file'],
 ['一日游安排','confirmed.dayTrip','本次确认资料 → 上下午行程及服务','上午文化参观，下午研学体验；餐饮、用车及导游见确认资料。'],
 ['服务项目','order.service','订单 → 已选代订代办服务','酒店代订'],
 ['代订代办服务明细','confirmed.services','本次确认资料 → 所选服务规格、日期及数量','高级双床房1间2晚，含双早。'],
 ['材料与办理期限','confirmed.materials','本次确认资料 → 所选服务材料与办理期限','按本次服务要求，在确认期限内提供相应材料。'],
 ['服务办理及退改规则','confirmed.refund','本次确认资料 → 对客办理与退改规则','按本次确认的对客退改阶梯和必要费用依据办理。']
].forEach(([n,k,l,v,type])=>erp(n,k,l,v,'行程与服务',type||'text'));
[
 ['企业名称','order.enterprise','订单企业客户 → 企业名称','北京示例科技有限公司'],
 ['企业信用代码','order.enterpriseCredit','订单企业客户 → 统一社会信用代码','91110000示例信用代码'],
 ['企业地址','order.enterpriseAddress','订单企业客户 → 联系地址','北京市朝阳区示例地址'],
 ['企业联系电话','order.enterprisePhone','订单企业客户 → 联系电话','010-00000000'],
 ['授权代表','contract.enterpriseSigner','合同准备 → 已确认企业授权代表','李梅'],
 ['企业授权书','contract.enterpriseAuthorization','合同准备 → 企业代表授权书','企业授权书（样例）','file'],
 ['项目名称','order.project','订单 → 已确认项目名称','年度会议及团队活动'],
 ['服务日期','order.projectDates','订单 → 已确认项目服务日期','2026-10-12 至 2026-10-14','dateRange'],
 ['服务地点','order.projectLocation','订单 → 已确认服务地点','北京'],
 ['参加人数','contract.participants','本份合同 → 已确认项目参加人数',20,'number'],
 ['服务明细','confirmed.projectServices','本次确认资料 → 项目服务清单及版本','服务V1：会议场地、住宿、交通及活动安排。','file'],
 ['项目联系人','order.projectContact','订单 → 项目联系人','王强'],
 ['开票信息','order.invoice','订单 → 客户已确认开票信息','北京示例科技有限公司／税号以本次确认信息为准。']
].forEach(([n,k,l,v,type])=>erp(n,k,l,v,'企业及项目',type||'text'));
manual('一日游保险产品及保额','本次保险产品、保障计划及保额','保险');
manual('一日游投保人数及保费','本次投保人数、每人及总保费','保险');
manual('保险购买方式','旅游意外保险购买选择','保险');
manual('保险产品及保障计划','本次确认保险产品及保障计划','保险','insurance');
manual('被保险人及保费','已确认被保险人及保费','保险','insurance');
manual('邮轮保险购买方式','邮轮保险购买选择','保险');
manual('邮轮保险产品及保费','邮轮保险计划、被保险人与保费','保险','cruiseInsurance');
manual('成团人数与通知安排','最低成团人数及通知安排核对','成团约定');
manual('不成团处理选择','转团、延期、改线及解除逐项选择','成团约定');
manual('实际旅行社名称','转社或拼团的实际旅行社','成团约定','agency');
manual('拼团转团约定及旅行社','拼团／转团选择及实际旅行社','成团约定');
manual('争议解决方式','诉讼或仲裁的客户选择','争议与其他');
manual('法院或仲裁机构','本次选定的法院或仲裁机构','争议与其他');
manual('购物与自费选择','无安排或按明细逐项确认','争议与其他');
manual('补充约定','本次补充约定','争议与其他','optional',{modes:['input','fixed']});
fixed('变更与解除约定','提出变更或解除后，双方确认已履行服务、退改依据及可证明的必要费用，留存确认材料。');
fixed('退款期限','双方确认退款金额及办理期限后，按约定期限办理。');
fixed('责任减免及不可抗力约定','发生影响履行的事件时及时告知、采取合理措施减少损失，按获准合同条款确认变更、解除及费用承担。');
fixed('违约责任条款','按获准正文核对责任、实际损失及补救措施，办理赔偿或退款，不以补充约定排除依法应承担的责任。');
fixed('航次与港口变更约定','依据实际航次及港口变化确认替代安排、未发生服务退费和新增费用承担。');
fixed('项目调整与取消约定','服务范围、人数或日期调整须双方确认，取消费用按确认的项目约定及必要费用依据办理。');
manual('服务验收约定','企业确认的服务验收事项','企业及项目');
manual('开票约定','企业确认的开票内容及时间','企业及项目');
erp('行程或服务明细','contract.serviceAttachment','本份合同 → 确认行程／服务附件及版本','本份行程／服务附件V1','签约附件','file');
erp('费用明细','contract.feeAttachment','本份合同 → 确认分配的费用附件','本份费用明细V1','签约附件','file');
['甲方签署','乙方签署','签约日期'].forEach(n=>{specs[n]={name:n,group:'签署结果',type:n==='签约日期'?'date':'signature',modes:['signature'],sources:[],condition:'always',conditions:['always'],editable:false};});
erp('舱房及船票规则','confirmed.cabinRules','本次确认资料 → 舱房及船票规则附件','舱房及船票规则V1','签约附件','file');
Object.assign(specs['保险购买方式'],{choices:['委托购买','自行购买','不购买']});
Object.assign(specs['邮轮保险购买方式'],{choices:['委托购买','自行购买','不购买']});
Object.assign(specs['争议解决方式'],{choices:['诉讼','仲裁']});
Object.assign(specs['购物与自费选择'],{choices:['无安排','按明细确认']});
// Stable identities are stored with a template version; labels are only presentation.
const uid=text=>'f'+Array.from(text).reduce((n,c)=>Math.imul(n,31)+c.codePointAt(0)|0,7).toString(36).replace('-','n');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tableDefinitions={
 travelers:{label:'游客名单',source:'contract.travelers',sourceLabel:'本份合同 → 覆盖游客名单',columns:[['name','姓名'],['documentType','证件类型'],['identity','证件号码']]},
 itinerary:{label:'行程安排',source:'confirmed.itineraryRows',sourceLabel:'本份合同 → 已确认逐日行程',columns:[['day','天次'],['date','日期'],['content','行程与服务安排']]},
 cruise:{detailSource:'confirmed.cruise',label:'邮轮港口行程',source:'confirmed.cruiseRows',sourceLabel:'本份合同 → 已确认航程及港口安排',columns:[['day','天次'],['date','日期'],['content','港口与船上、岸上安排']]},
 study:{detailSource:'confirmed.curriculum',label:'研学课程安排',source:'confirmed.studyRows',sourceLabel:'本份合同 → 已确认课程、课时及每日活动',columns:[['day','天次'],['date','日期'],['content','课程与活动安排']]},
 project:{detailSource:'confirmed.projectServices',label:'项目服务明细',source:'confirmed.projectRows',sourceLabel:'本份合同 → 已确认项目服务清单',columns:[['date','服务日期'],['content','项目服务与验收内容']]},
 services:{detailSource:'confirmed.services',label:'服务明细',source:'confirmed.serviceRows',sourceLabel:'本份合同 → 已确认服务明细',columns:[['date','服务日期'],['content','服务内容与规格']]},
 fees:{label:'费用明细',source:'contract.feeRows',sourceLabel:'本份合同 → 已确认分配费用',columns:[['name','费用项目'],['amount','金额（元）']]},
 studyFees:{label:'研学费用明细',source:'contract.studyFeeRows',sourceLabel:'本份合同 → 已确认课程费与旅行服务费分类',columns:[['name','费用项目'],['amount','金额（元）']]}
};
Object.values(tableDefinitions).forEach(d=>{sources[d.source]={label:d.sourceLabel,sample:[],type:'table'};});
function tableKind(name,t){
 const itinerary=t?.profile==='cruise'?'cruise':t?.profile==='study'?'study':t?.profile==='mice'?'project':t?.profile==='agency'?'services':'itinerary';
 return ({'游客名单及授权材料':'travelers','行程单':itinerary,'费用明细':'fees','研学费用明细':'studyFees','邮轮行程与服务标准':'cruise','研学课程与服务标准':'study','一日游安排':'itinerary','代订代办服务明细':'services','服务明细':t?.profile==='mice'?'project':'services'})[name];
}
function spec(name,t){
 const kind=tableKind(name,t),base=specs[name]||{name,group:'补充填写项',type:'text',modes:['input','fixed'],sources:[],condition:'always',conditions:['always','optional'],editable:true,custom:true};
 if(kind){const d=tableDefinitions[kind];return {...base,type:'table',kind,detailSource:d.detailSource,modes:['erp'],sources:[d.source],editable:false,conditions:['always'],condition:'always',columns:d.columns.map(([id,label])=>({id,label,source:id,required:true,type:id==='amount'?'money':'text'}))};}
 return base;
}
function defaults(name,t={}){const s=spec(name,t);return {id:uid(t.profile+'|'+name),key:name,name,mode:s.custom?'':s.modes[0],source:s.sources[0]||'',value:s.value||'',condition:s.condition,editable:s.editable,...(s.type==='table'?{columns:copy(s.columns),empty:'block',sort:'source'}:{})};}
function tokens(t){return Array.from(T.body(t).matchAll(/【([^】\n]+)】/g),m=>m[1]);}
function lookup(t,token){
 if(token.startsWith('#')){const slot=t.slots?.find(s=>s.id===token.slice(1));return t.fieldConfig?.find(f=>f.id===slot?.fieldId)||null;}
 return t.fieldConfig?.find(f=>f.name===token||f.key===token)||defaults(token,t);
}
function rows(t){
 const items=[...tokens(t).map(n=>lookup(t,n)),...(t.attachments||[]).map(n=>t.fieldConfig?.find(f=>(f.key||f.name)===n)||defaults(n,t))].filter(Boolean),seen=new Set();
 return items.map(f=>{const key=f.key||f.name,s=spec(key,t),d=defaults(key,t),config={...d,...copy(f),id:f.id||d.id,key};
 // Upgrade only the old prototype table representation. Explicit new source changes are validated.
 if(s.type==='table'&&!f.columns){config.source=d.source;config.columns=d.columns;config.empty='block';config.sort='source';}
 return {spec:s,config};}).filter(r=>!seen.has(r.config.id)&&seen.add(r.config.id));
}
function names(t){return rows(t).map(r=>r.config.key);}
function reconcile(t){return rows(t).map(r=>r.config);}
function normalize(t){
 const n=copy(t);n.fieldConfig=reconcile(t);const previous=t.slots||[],used=new Set(previous.map(x=>x.id)),slots=[];let sequence=1;
 n.bodyText=T.body(t).replace(/【([^】\n]+)】/g,(all,token)=>{
  if(token.startsWith('#')){const old=previous.find(s=>s.id===token.slice(1));if(old){slots.push(copy(old));return all;}return all;}
  const f=n.fieldConfig.find(f=>f.name===token||f.key===token);if(!f)return all;
  while(used.has('p'+sequence))sequence++;const id='p'+sequence++;used.add(id);slots.push({id,fieldId:f.id});return '【#'+id+'】';
 });n.slots=slots;n.contentVersion=2;return n;
}
function labelledBody(t){return T.body(t).replace(/【([^】\n]+)】/g,(all,token)=>{const f=lookup(t,token);return f?'【'+f.name+'】':all;});}
function updateBody(t,text){
 if(text===labelledBody(t))return normalize(t);
 // Resolve user labels once at editing time. Saved content references stable slot identities.
 return normalize({...t,bodyText:text});
}
function insert(t,id){const f=t.fieldConfig?.find(f=>f.id===id),n=normalize(t);if(!f)return n;if(!n.fieldConfig.some(x=>x.id===id))n.fieldConfig.push(copy(f));let i=1;while(n.slots.some(x=>x.id==='p'+i))i++;n.slots.push({id:'p'+i,fieldId:id});n.bodyText+='\n【#p'+i+'】';return n;}
function sourceLabel(f){return f.mode==='fixed'?f.value:f.mode==='signature'?'签署完成后填入':sources[f.source]?.label||(f.mode==='input'?'合同准备 → '+f.name:'请选择对应资料');}
function issues(t){const out=[],ids=new Set(),labels=new Set();for(const {spec:s,config:f} of rows(t)){
 if(ids.has(f.id))out.push('填写项标识重复');ids.add(f.id);
 if(!f.name.trim()||labels.has(f.name))out.push('填写项名称为空或重复，请用业务含义区分');if(/[【】#\n]/.test(f.name))out.push('填写项名称不能包含括号、井号或换行');labels.add(f.name);
 if(!s.modes.includes(f.mode))out.push(f.name+'：请选择允许的取值方式');
 if(f.mode==='erp'&&!s.sources.includes(f.source))out.push(f.name+'：ERP对应项不适用');
 if(f.mode==='input'&&s.sources.length&&!s.sources.includes(f.source))out.push(f.name+'：签约填写位置不适用');
 if(f.mode==='fixed'&&!String(f.value||'').trim())out.push(f.name+'：请填写固定内容');
 if(!s.conditions.includes(f.condition))out.push(f.name+'：不能取消或改变必要填写条件');
 if(f.mode==='input'&&!f.editable)out.push(f.name+'：签约填写项必须允许经办人填写');
 if((!s.editable||f.mode==='fixed'||f.mode==='signature')&&f.editable)out.push(f.name+'：签约时不可修改');
 if(s.type==='table'){
  if(f.empty!=='block')out.push(f.name+'：必要明细为空时不能提交');
  if(!['source','reverse'].includes(f.sort))out.push(f.name+'：请选择有效的排列顺序');
  if(f.columns.length!==s.columns.length||new Set(f.columns.map(c=>c.id)).size!==s.columns.length)out.push(f.name+'：必要列不完整');
  for(const col of s.columns){const c=f.columns.find(x=>x.id===col.id);if(!c||c.source!==col.source||!c.label.trim()||!c.required)out.push(f.name+'：请正确对应'+col.label+'列');}
 }
 }for(const token of tokens(t))if(token.startsWith('#')&&!lookup(t,token))out.push('正文存在失效的填写位置，请重新插入');return [...new Set(out)];}
function sample(t,kind='joint',companyId=t.companies?.[0]){
 const values=Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,copy(v.sample)]));
 const companies={fj:['福建凯撒国际旅行社有限公司','L-FJ-示例','0592-0000000'],bj:['北京凯撒国际旅行社有限公司','L-BJ-示例','010-00000000'],sh:['上海凯撒国际旅行社有限公司','L-SH-示例','021-00000000']};
 const c=companies[companyId]||['','',''];['company.name','company.license','company.phone'].forEach((key,i)=>values[key]=c[i]);
 const people=[{name:'张建国',identity:'身份证尾号1201'},{name:'李梅',identity:'身份证尾号2202'},{name:'王强',identity:'身份证尾号3303'}];
 people.forEach((p,i)=>Object.assign(p,{id:'person-'+i,documentType:'居民身份证'}));
 if(kind==='many'){while(people.length<20)people.push({id:'person-'+people.length,name:'游客'+(people.length+1),documentType:'居民身份证',identity:'演示证件'+(people.length+1)});}
 values['contract.travelers']=kind==='split'?[people[1]]:people;values['contract.amount']=kind==='split'?10000:30000;
 if(kind==='split'){values['contract.representative']='李梅';values['contract.contact']='139****2202';values['contract.cabins']='海景舱，本份覆盖1人。';}
 if(t.range==='境内')values['order.product']='三亚亲子5日游';
 const input={'一日游保险产品及保额':'本次已确认一日游保险计划，保额按确认材料。','一日游投保人数及保费':'3人，每人10元，合计30元（样例）。','保险购买方式':kind==='missingInsurance'?'委托购买':'自行购买','邮轮保险购买方式':'自行购买','成团人数与通知安排':'最低20人；出发前按双方确认期限通知。','不成团处理选择':t.profile==='study'?'延期：不同意；改线：不同意；解除：同意。':'转团：不同意；延期：不同意；改线：不同意；解除：同意。','拼团转团约定及旅行社':'不安排拼团／转团。','争议解决方式':'诉讼','法院或仲裁机构':'双方确认的有管辖权法院（样例）','购物与自费选择':'无安排','服务验收约定':'按双方确认的服务清单逐项验收。','开票约定':'按已确认服务内容和开票时间办理。','补充约定':''};
 const days=['day','zhejiang'].includes(t.profile)?1:kind==='many'?12:['mice','study'].includes(t.profile)?3:t.profile==='agency'?2:5;
 const daily=Array.from({length:days},(_,i)=>({id:'day-'+i,day:'D'+(i+1),date:'2026-10-'+String(12+i).padStart(2,'0'),content:t.profile==='cruise'?(i===0?'上海登船；船上晚餐':i===days-1?'上海离船；早餐后结束服务':'港口观光或海上航行，依确认安排；含当日餐食'):t.profile==='study'?'科技课程与实践活动；导师带队；团队餐及安全点名':t.profile==='agency'?'已确认酒店代订；双床房含双早，入住离店时间按服务确认单':'城市游览与文化参访；旅游车；团队餐；酒店双人间'}));
 for(const key of ['confirmed.itineraryRows','confirmed.cruiseRows','confirmed.studyRows','confirmed.serviceRows'])values[key]=copy(daily);
 values['order.days']=days;values['order.dates']={start:daily[0].date,end:daily.at(-1).date};values['order.projectDates']=copy(values['order.dates']);values['order.studyDates']=daily[0].date+' 至 '+daily.at(-1).date+'，北京';values['confirmed.ports']=daily[0].date+'上海登船，'+daily.at(-1).date+'上海离船';input['一日游投保人数及保费']=values['contract.travelers'].length+'人，每人10元，合计'+(values['contract.travelers'].length*10)+'元（样例）。';
 const fees=kind==='split'?[{id:'fee-1',name:'李梅本份已确认旅游费',amount:10000}]:[{id:'fee-1',name:t.profile==='study'?'课程及导师服务':'旅游服务费',amount:27000},{id:'fee-2',name:t.profile==='study'?'交通餐住服务':'已确认附加服务',amount:3000}];
 values['confirmed.projectRows']=daily.map(x=>({...x,content:'会议场地、餐住及交通服务，按项目确认清单验收'}));
 values['contract.feeRows']=copy(fees);values['contract.studyFeeRows']=copy(fees);
 if(kind==='emptyRows')Object.values(tableDefinitions).forEach(d=>values[d.source]=[]);
 if(kind==='missingRows'){values['contract.travelers'][1].identity='';for(const key of ['confirmed.itineraryRows','confirmed.cruiseRows','confirmed.studyRows','confirmed.serviceRows','confirmed.projectRows'])values[key][0].content='';}
 return {kind,orderAmount:30000,values,input,choices:{insurance:kind==='missingInsurance'?'委托购买':'自行购买',cruiseInsurance:'自行购买',agency:false},version:'本次确认资料V1'};
}
function active(condition,ctx){return !['insurance','cruiseInsurance','agency','authorized'].includes(condition)||(condition==='agency'?ctx.choices.agency:condition==='authorized'?ctx.choices.authorized:ctx.choices[condition]==='委托购买');}
const blank=v=>v===undefined||v===null||typeof v==='string'&&!v.trim();
function resolved(t,ctx){return rows(t).map(({spec:s,config:f})=>{
 const applicable=active(f.condition,ctx);let value=f.mode==='fixed'?f.value:f.mode==='erp'?ctx.values[f.source]:f.mode==='input'?(ctx.input[f.id]??ctx.input[f.key]??ctx.input[f.name]):'';
 const detail=s.detailSource?ctx.values[s.detailSource]:'';const errors=[];if(s.type==='table'&&applicable){
  if(s.detailSource&&blank(detail))errors.push(f.name+'：已确认服务标准待补');
  if(!Array.isArray(value)||!value.length)errors.push(f.name+'：没有明细资料');
  else {value=copy(value);if(f.sort==='reverse')value.reverse();value.forEach((r,i)=>f.columns.forEach(c=>{if(blank(r[c.source]))errors.push(f.name+'第'+(i+1)+'行：'+c.label+'待补');else if(c.type==='money'&&!Number.isFinite(Number(r[c.source])))errors.push(f.name+'第'+(i+1)+'行：'+c.label+'无效');}));
   if(['fees','studyFees'].includes(s.kind)&&!errors.length&&Math.abs(value.reduce((sum,r)=>sum+Number(r.amount),0)-Number(ctx.values['contract.amount']))>0.005)errors.push(f.name+'：明细合计与本份合同金额不一致');
  }
 }
 const missing=applicable&&f.condition!=='optional'&&f.mode!=='signature'&&(blank(value)||Array.isArray(value)&&!value.length||errors.length>0);
 return {id:f.id,key:f.key,name:f.name,source:sourceLabel(f),type:s.type,kind:s.kind,columns:f.columns,showRowNumber:f.showRowNumber,mode:f.mode,applicable,value,missing,errors,detail};
});}
function cell(value,c){return blank(value)?'待补':c.type==='money'&&Number.isFinite(Number(value))?Number(value).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}):String(value);}
function display(r){if(!r.applicable)return '不适用';if(r.mode==='signature')return '【待实际签署结果】';if(r.type==='table'&&Array.isArray(r.value)&&r.value.length)return r.columns.map(c=>c.label).join(' | ')+'\n'+r.value.map(x=>r.columns.map(c=>cell(x[c.source],c)).join(' | ')).join('\n')+(r.detail?'\n服务标准：'+r.detail:'');if(r.missing)return '【待填写：'+r.name+'】';if(r.type==='dateRange')return r.value.start+' 至 '+r.value.end;if(r.type==='money')return Number(r.value).toLocaleString('zh-CN',{minimumFractionDigits:2});return blank(r.value)||r.value===''?'无':String(r.value);}
function renderedTable(r){if(!Array.isArray(r.value)||!r.value.length)return '<span class="cs-error">'+esc(r.name)+'：没有明细资料</span>';return '<div class="cs-document-table"><table data-document-table="'+esc(r.kind)+'"><caption>'+esc(r.name)+'</caption><thead><tr>'+(r.showRowNumber?'<th>序号</th>':'')+r.columns.map(c=>'<th>'+esc(c.label)+'</th>').join('')+'</tr></thead><tbody>'+r.value.map((row,i)=>'<tr>'+(r.showRowNumber?'<td>'+(i+1)+'</td>':'')+r.columns.map(c=>'<td'+(blank(row[c.source])?' class="cs-cell-missing"':'')+'>'+esc(cell(row[c.source],c))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+(r.detail?'<p class="cs-table-detail">服务标准：'+esc(r.detail)+'</p>':'');}
function preview(t,ctx){
 const values=resolved(t,ctx),byId=Object.fromEntries(values.map(r=>[r.id,r]));const render=(token,html)=>{const f=lookup(t,token),r=f&&byId[f.id||defaults(f.name,t).id];if(!r)return html?esc('【失效填写位置】'):'【失效填写位置】';return html&&r.type==='table'?renderedTable(r):html?esc(display(r)):display(r);};
 const body=T.body(t).replace(/【([^】\n]+)】/g,(_,n)=>render(n,false));
 let html='',end=0;for(const m of T.body(t).matchAll(/【([^】\n]+)】/g)){html+=esc(T.body(t).slice(end,m.index))+render(m[1],true);end=m.index+m[0].length;}html+=esc(T.body(t).slice(end));
 const gaps=values.flatMap(r=>r.errors.length?r.errors:r.missing?[r.name]:[]);
 return {rows:values,missing:gaps,body,html,version:t.version};
}
function markup(t){return T.body(t).split(/(【[^】\n]+】)/g).map(part=>{const m=/^【([^】\n]+)】$/.exec(part);if(!m)return esc(part);const f=lookup(t,m[1]);return f?'<button type="button" class="cs-text-slot" data-cs-action="configure-content" data-cs-value="'+esc(f.id||defaults(f.name,t).id)+'">【'+esc(f.name)+'】</button>':esc(part);}).join('');}
function platform(t){return copy(t.platformConfig||{method:'unknown',identifierKind:'type',identifier:'',evidence:'',fileParameter:'',fields:[]});}
function parsePairs(text){return Object.fromEntries(String(text).split(/\n/).filter(Boolean).map(line=>{const i=line.indexOf('=');return i<1?['','']:[line.slice(0,i).trim(),line.slice(i+1).trim()]}));}
function invalidPairs(text){const lines=String(text).split(/\n/).filter(v=>v.trim());const keys=lines.map(v=>v.split('=')[0].trim());return lines.some(v=>!/^([^=]+)=([^=]+)$/.test(v))||new Set(keys).size!==keys.length;}
function formats(s){return s.type==='money'?['金额（元）','金额（分）']:s.type==='table'?['明细数组']:s.type==='file'?['附件引用']:s.type==='date'?['日期 YYYY-MM-DD']:s.type==='dateRange'?['日期区间文本','起止日期明细']:s.type==='number'?['数字']:s.type==='signature'?['签署结果引用']:s.choices?['文本','枚举对应']:['文本'];}
function platformTables(){return root.ContractPlatformTables||(typeof require!=='undefined'?require('./contract-platform-tables.js'):null);}
function platformIssues(t){const p=platform(t),out=[];
 if(t.generation==='manual')return [];
 if(p.provider&&p.provider!==(t.provider||'12301'))out.push('平台对应与本模板签署平台不一致');
 if(t.generation==='file'&&p.method!=='file'||t.generation==='platform'&&p.method==='file')out.push('平台对应与文书生成方式不一致');
 if(p.method==='unknown')return ['办理内容方式待接口资料核实'];
 if(!['structured','file'].includes(p.method))return ['不支持的内容方式'];
 if(!p.evidence.trim())out.push('请填写接口资料依据');
 if(!['type','template','none'].includes(p.identifierKind)||p.identifierKind==='none'&&p.method!=='file')out.push('请选择适用的平台识别方式');
 if(p.identifierKind!=='none'&&!p.identifier.trim())out.push('请填写接口资料规定的合同类型或模板标识');
 if(p.method==='file'){if(!p.fileParameter.trim())out.push('请填写签署文书上传参数');else if(!/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/.test(p.fileParameter))out.push('签署文书上传参数格式无效');return out;}
 const used=new Set();
 for(const {spec:s,config:f} of rows(t).filter(r=>r.config.mode!=='signature'&&!(Array.isArray(p.tables)&&r.spec.type==='table'))){const m=p.fields.find(x=>x.fieldId===f.id||!x.fieldId&&x.name===(f.key||f.name));
 if(!m?.parameter?.trim()){out.push(f.name+'：平台参数未对应');continue;}
 if(!/^[A-Za-z_][\w]*(?:\[\])?(?:\.[A-Za-z_][\w]*(?:\[\])?)*$/.test(m.parameter))out.push(f.name+'：参数格式无效');
 if(used.has(m.parameter))out.push(f.name+'：平台参数重复');used.add(m.parameter);
 if(!formats(s).includes(m.format))out.push(f.name+'：格式与内容类型不匹配');
 if(s.detailSource){
  if(!m.detailParameter||!/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/.test(m.detailParameter))out.push(f.name+'：请对应随表服务标准参数');
  else {if(used.has(m.detailParameter))out.push(f.name+'：服务标准参数重复');used.add(m.detailParameter);}
 }
 if(s.type==='table'&&!m.parameter.endsWith('[]'))out.push(f.name+'：明细须保留逐行层级');
 if(s.type==='table'){
   const pairs=parsePairs(m.members||''),keys=s.columns.map(c=>c.id);
   if(invalidPairs(m.members||'')||keys.some(k=>!pairs[k])||Object.keys(pairs).some(k=>!keys.includes(k)))out.push(f.name+'：请完整对应明细各列');
   if(Object.values(pairs).some(v=>!/^[A-Za-z_]\w*$/.test(v))||new Set(Object.values(pairs)).size!==Object.values(pairs).length)out.push(f.name+'：子项参数无效或重复');
 }
 if(m.format==='枚举对应'){
   const pairs=parsePairs(m.enumMap||''),options=s.choices||[];
   if(invalidPairs(m.enumMap||'')||!options.length||options.some(v=>!pairs[v])||Object.keys(pairs).some(v=>!options.includes(v))||new Set(Object.values(pairs)).size!==Object.values(pairs).length)out.push(f.name+'：请完整填写业务选项与不同平台值的对应');
 }
 }if(Array.isArray(p.tables)){const tables=platformTables();out.push(...(tables?tables.issues(t):['表格对应组件未加载']));}return out;
}
function platformPreview(t,ctx){if(t.generation==='manual')return {status:'到平台办理；未调用创建接口'};const p=platform(t);if(platformIssues(t).length)return null;
 if(p.method==='file')return {status:'未连接平台，仅供核对',parameter:p.fileParameter,value:'本份待签文书（样例）'};
 const tableResult=Array.isArray(p.tables)?platformTables().payload(t,ctx):{parameters:[],errors:[]};
 return {status:'未连接平台，仅供核对',errors:tableResult.errors,parameters:resolved(t,ctx).filter(r=>r.mode!=='signature'&&r.applicable&&!(Array.isArray(p.tables)&&r.type==='table')).flatMap(r=>{const m=p.fields.find(f=>f.fieldId===r.id||!f.fieldId&&f.name===(r.key||r.name));let value=r.value;
 if(m.format==='日期区间文本'&&value)value=value.start+' 至 '+value.end;
 if(m.format==='金额（分）')value=Math.round(Number(value)*100);
 if(m.format==='枚举对应')value=parsePairs(m.enumMap)[value]||'待确认选项';
 if(m.format==='明细数组'){const keys=parsePairs(m.members);value=(value||[]).map(p=>Object.fromEntries(Object.entries(keys).map(([key,param])=>[param,p[key]])));}
 return [{parameter:m.parameter,value},...(m.detailParameter?[{parameter:m.detailParameter,value:r.detail}]:[])];}).concat(tableResult.parameters)};
}
root.ContractTemplateFields={modes,conditions,specs,sources,spec,names,rows,reconcile,defaults,sourceLabel,issues,sample,active,resolved,preview,display,platform,formats,platformIssues,platformPreview,copy,normalize,labelledBody,updateBody,insert,markup,tableDefinitions};
if(typeof module!=='undefined')module.exports=root.ContractTemplateFields;
})(typeof window==='undefined'?globalThis:window);
