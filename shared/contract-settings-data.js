(function (root) {
  'use strict';
  const C = root.ContractCatalog || (typeof require!=='undefined' ? require('./contract-template-catalog.js') : null);
  const copy = value => JSON.parse(JSON.stringify(value));
  const companies = [
    {id:'fj', name:'福建凯撒', fullName:'福建凯撒国际旅行社有限公司', credit:'91350000MA8KS2026F', license:'L-FJ-示例', address:'厦门市思明区软件园二期', phone:'0592-0000000', complaint:'公司客户服务中心', platform:'示例企业-FJ', seal:'福建凯撒电子合同专用章（示例）', sealCompany:'fj', authorization:'已核对', sealState:'已核对', evidence:'公司授权核对样例', start:'2026-01-01', end:'2026-12-31', scope:'福建公司及获准门店', account:'经办人关联待接口确认'},
    {id:'bj', name:'北京凯撒', fullName:'北京凯撒国际旅行社有限公司', credit:'91110000MA8KS2026B', license:'', address:'北京市朝阳区', phone:'010-00000000', complaint:'', platform:'', seal:'', sealCompany:'bj', authorization:'待核实', sealState:'待核实', evidence:'', start:'', end:'', scope:'北京公司', account:''},
    {id:'sh', name:'上海凯撒', fullName:'上海凯撒国际旅行社有限公司', credit:'91310000MA8KS2026S', license:'L-SH-示例', address:'上海市黄浦区', phone:'021-00000000', complaint:'公司客户服务中心', platform:'示例企业-SH', seal:'上海凯撒电子合同专用章（示例）', sealCompany:'sh', authorization:'已核对', sealState:'待核实', evidence:'授权材料样例', start:'2026-01-01', end:'2026-08-31', scope:'上海公司', account:'待核实'}
  ];
  const templates = [
    {id:'T-GROUP-2026',name:'团队出境旅游合同',version:'V1.0',business:'参团游',document:'主合同',companies:['fj'],customer:'个人',mode:'多人合签',textType:'平台标准文本',platformType:'团队出境旅游合同',platformVersion:'示例标准版本',platformCode:'示例-GROUP',verified:true,start:'2026-01-01',end:'2026-12-31',status:'启用',attachments:['行程单','费用明细'],conditional:'未成年人：监护授权；代理签署：委托材料',owner:'法务部 王洁',clauses:'按确认行程提供旅游服务，费用及支付安排以订单约定为准。',revision:''},
    {id:'T-CRUISE-2026',name:'邮轮旅游合同',version:'V1.0',business:'邮轮',document:'主合同',companies:['fj'],customer:'个人',mode:'多人合签',textType:'补充条款',platformType:'待平台确认',platformVersion:'',platformCode:'',verified:false,start:'2026-01-01',end:'2026-12-31',status:'草稿',attachments:['行程单','费用明细','舱房及船票规则'],conditional:'未成年人：监护授权',owner:'法务部 王洁',clauses:'舱房、航次及退改安排需与本次确认订单一致。',revision:''},
    {id:'T-MICE-2026',name:'企业旅游服务合同',version:'V1.0',business:'MICE',document:'主合同',companies:['fj'],customer:'企业',mode:'企业代表签署',textType:'自定义文本',platformType:'待平台确认',platformVersion:'',platformCode:'',verified:false,start:'2026-01-01',end:'2026-12-31',status:'草稿',attachments:['行程单','费用明细','企业授权书'],conditional:'以企业确认服务范围为准',owner:'法务部 陈晗',clauses:'企业旅游服务范围及付款安排以确认的项目报价为准。',revision:''},
    {id:'T-GROUP-OLD',name:'团队出境旅游合同（旧版）',version:'V0.9',business:'参团游',document:'主合同',companies:['fj'],customer:'个人',mode:'多人合签',textType:'平台标准文本',platformType:'团队出境旅游合同',platformVersion:'旧版示例',platformCode:'示例-OLD',verified:true,start:'2025-01-01',end:'2025-12-31',status:'停用',attachments:['行程单'],conditional:'',owner:'法务部 王洁',clauses:'历史签署文件保留原版本。',revision:''}
  ];
  const rules = [
    {id:'R-FJ-01',name:'福建参团游签约规则',company:'fj',business:'参团游',scope:'公司通用',store:'',template:'T-GROUP-2026',draftStage:'订单已确认',review:'需要审核',flow:'销售合同审核（示例）',payment:'先签后收',paymentNode:'',confirmed:true,evidence:'业务规则确认样例',start:'2026-01-01',end:'2026-12-31',status:'启用',owner:'公司业务管理员'},
    {id:'R-FJ-02',name:'邮轮签约规则',company:'fj',business:'邮轮',scope:'公司通用',store:'',template:'T-CRUISE-2026',draftStage:'订单已确认',review:'需要审核',flow:'销售合同审核（示例）',payment:'待确认',paymentNode:'',confirmed:false,evidence:'',start:'2026-01-01',end:'2026-12-31',status:'草稿',owner:'公司业务管理员'}
  ];
  companies.forEach(c=>{c.connection='公司授权连接（示例）';c.platformReview=c.id==='fj'?'无需额外审核（演示）':'待平台确认';c.templateTypes=c.id==='fj'?['团队境内旅游合同','团队出境旅游合同']:[];c.signModes=c.id==='fj'?['多人合签','按人分签','代表及代理签署']:[];});
  companies.forEach(c=>Object.assign(c,{qualifications:c.id==='fj'?['境内旅游','出境旅游']:['境内旅游'],qualificationEvidence:c.id==='fj'?'经营资格核对样例':'待核对',province:c.id==='sh'?'上海':c.id==='bj'?'北京':'福建',branchRelation:'总社及所属服务网点',complaintPhone:'12345',complaintProvince:c.id==='sh'?'上海':c.id==='bj'?'北京':'福建',complaintCity:c.id==='fj'?'厦门':'',complaintEmail:'',complaintAddress:c.address,handling:'平台签署并监管处理',loginState:'待核实',interfaceState:'未验证',signChannel:'',channelEvidence:''}));
  function decorate(t,profile,range) {
    const p=C.get(profile);return Object.assign(t,{profile,range:range||p.ranges[0],category:p.category,province:p.province,directoryName:p.name,directoryCode:p.code,textReference:p.name+' · 目录版本（原型）',contentConfirmed:p.observed,content:C.fields(profile),disputeOptions:['诉讼','仲裁'],serviceMode:profile==='agency'?'代订代办':'包价旅游'});
  }
  decorate(templates[0],'outbound','出境');templates[0].contentConfirmed=true;
  decorate(templates[1],'cruise','出境');templates[1].platformType='上海邮轮游合同';templates[1].status='启用';
  decorate(templates[2],'mice','境内');templates[2].contentConfirmed=false;templates[2].attachments=['服务明细','费用明细','企业授权书'];
  decorate(templates[3],'outbound','出境');
  ['domestic','day','study','zhejiang','agency','taiwan','provincial'].forEach(id=>{
    const p=C.get(id),t=decorate({...copy(templates[0]),id:'T-'+id.toUpperCase()+'-2026',name:p.name,business:p.business[0],platformType:p.name,platformCode:'',platformVersion:'',verified:false,status:p.observed?'启用':'草稿',clauses:'',revision:''},id);
    if(id==='agency')t.attachments=['服务明细','费用明细'];
    templates.push(t);
  });
  [['T-STUDY-2026','出境'],['T-CRUISE-2026','境内'],['T-AGENCY-2026','出境']].forEach(([id,range])=>{const t=copy(templates.find(t=>t.id===id));t.id+='-'+range;t.range=range;templates.push(t);});
  companies[0].templateTypes=[...new Set([...companies[0].templateTypes,...C.profiles.map(p=>p.name)])];
  rules[0].range='出境';rules[0].customer='个人';rules[0].category='全国示范';rules[0].province='全国';
  rules[1].range='出境';rules[1].customer='个人';rules[1].category='省级示范';rules[1].province='上海';
  rules.push({...copy(rules[1]),id:'R-BJ-01',name:'北京境内游签约规则',company:'bj',business:'参团游',range:'境内',category:'全国示范',province:'全国',template:'',owner:'北京公司合同管理员'});
  const today = () => new Date().toLocaleDateString('en-CA');
  const dateOK = value => { const d=new Date(value+'T12:00:00Z'); return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===value; };
  const dates = (start,end) => !dateOK(start) || !dateOK(end) || start>end ? ['请填写有效的生效及截止日期'] : [];
  function companyIssues(c, day=today(), provider="12301") {
    if(provider!=="12301") { const a=c?.platformAccounts?.[provider]; return accountIssues(c,a,day); }
    if (!c) return ['请选择签约公司'];
    let issues=[];
    if (!c.license) issues.push('旅行社许可证待补');
    if (!c.platform) issues.push('平台企业未关联');
    if (c.authorization!=='已核对' || !c.evidence) issues.push('公司授权待核实');
    if (c.handling==='其他获准渠道签署后上传监管'&&(!c.signChannel||!c.channelEvidence))issues.push('请核对外部签署渠道及获准依据');
    if (c.handling==='待确认')issues.push('合同办理方式待确认');
    if (c.handling!=='其他获准渠道签署后上传监管' && (!c.seal || c.sealState!=='已核对')) issues.push('电子合同用章待核实');
    if (c.handling!=='其他获准渠道签署后上传监管' && c.sealCompany!==c.id) issues.push('用章公司与签约公司不一致');
    if (dates(c.start,c.end).length) issues.push('授权期限待核实');
    else if (day<c.start || day>c.end) issues.push('授权不在有效期');
    return issues;
  }
  function templateIssues(t, cs, day=today(), publish=false, formal=false) {
    const out=[];
    const F=root.ContractTemplateFields||(typeof require!=='undefined'?require('./contract-template-fields.js'):null);
    if(F)out.push(...F.issues(t));
    if (!t.name.trim() || !t.version.trim()) out.push('请填写模板名称和版本');
    if (!publish && t.status!=='启用') out.push('模板未启用');
    if (!t.companies.length) out.push('请选择适用签约公司');
    t.companies.forEach(id=>{ const c=cs.find(x=>x.id===id); if (companyIssues(c,day,t.provider).length) out.push((c?.name||id)+'签约条件不完整'); if(c&&(!t.provider||t.provider==='12301')&&(formal||t.profile!=='mice')&&(!c.templateTypes.includes(formal?t.platformType:(C.get(t.profile)?.name||t.platformType))||!c.signModes.includes(t.mode)))out.push(c.name+'未确认支持本模板类型或签署方式'); });
    if (formal && !F && (!t.verified || !t.platformCode || !t.platformVersion || t.platformType==='待平台确认')) out.push('平台模板及支持方式待核实');
    if (dates(t.start,t.end).length) out.push('模板有效日期不完整');
    else if (day<t.start || day>t.end) out.push('模板不在有效期');
    if (!t.attachments.includes(['agency','mice'].includes(t.profile)?'服务明细':'行程单') || !t.attachments.includes('费用明细')) out.push('请配置适用的服务／行程及费用明细');
    if (t.customer==='企业' && (t.mode!=='企业代表签署' || !t.attachments.includes('企业授权书'))) out.push('企业合同需代表签署并提供企业授权书');
    if (t.customer==='个人' && t.mode==='企业代表签署') out.push('个人客户不适用企业代表签署');
    out.push(...C.contentIssues(t));
    if(t.signing)out.push(...signingIssues(t));
    t.companies.forEach(id=>{const c=cs.find(x=>x.id===id);if(c)out.push(...C.applicable(profileFor(t),{business:t.business,range:t.range,province:t.province,qualifications:c.qualifications}));});
    if(formal&&F){out.push(...F.platformIssues(t));out.push('真实接口及公司授权仍需正式验证');}
    return [...new Set(out)];
  }
  function ruleIssues(r,state,day=today(),enable=false) {
    const out=[];
    if(!r.name?.trim())out.push('请填写规则名称');
    if(!ruleCompanies(r).length)out.push('请选择签约公司');
    out.push(...dates(r.start,r.end));
    if(r.start>day||r.end<day)out.push('规则不在有效期');
    const t=state.templates.find(t=>t.id===r.template);
    if(!t||!eligibleRuleTemplate(r,t,state))out.push('默认模板不适用全部所选公司及产品条件');
    const conflicts=state.rules.filter(x=>x.id!==r.id&&x.status==='启用'&&overlap(r,x)&&!moreSpecific(r,x)&&!moreSpecific(x,r));
    if(conflicts.length)out.push('与“'+conflicts.map(x=>x.name).join('、')+'”范围重叠且无法确定优先，请调整条件');
    if(!enable&&r.status!=='启用')out.push('规则未启用');
    return [...new Set(out)];
  }
  function storeIssues(choice,state,day=today()) {
    if (!choice.allow) return [];
    // Store settings identify the signing company. Template eligibility is checked per order.
    return companyIssues(state.companies.find(c=>c.id===choice.company),day);
  }
  const providers=[{id:'12301',name:'12301'},{id:'fadada',name:'法大大'}];
  const providerName=id=>providers.find(x=>x.id===id)?.name||'待选择平台';
  const generationNames={platform:'填写平台模板',file:'ERP生成文件',manual:'到平台办理'};
  const capabilities=['创建签署','查询结果','取得文件','多人签署','企业签署','监护／代理','顺序签署','撤销任务','解除处理','监管接收'];
  function profileFor(t){const p=C.get(t.profile);return t.textSource==='custom'?{...p,category:'企业自有',province:'全国',business:[t.business]}:p;}
  function account(c,provider='12301'){return provider==='12301'?c:c?.platformAccounts?.[provider];}
  function accountIssues(c,a,day=today()){
    const out=[];if(!c)return ['请选择签约公司'];if(!c.license)out.push('旅行社许可证待补');
    if(!a?.platform)out.push('平台企业未关联');if(a?.authorization!=='已核对'||!a?.evidence)out.push('公司授权待核实');
    if(!a?.seal||a?.sealState!=='已核对')out.push('电子合同用章待核实');if(a?.sealCompany!==c.id)out.push('用章公司与签约公司不一致');
    if(dates(a?.start,a?.end).length||day<a.start||day>a.end)out.push('授权不在有效期');return out;
  }
  function defaultSigning(t){const roles=t.customer==='企业'?['企业代表','我方公司']:['必要游客／代表','我方公司'];return {order:'同时签署',roles,documents:['合同正文',...t.attachments].map(name=>({name,sign:name!=='企业授权书',roles:name==='企业授权书'?[]:copy(roles),position:'文末签署区（随分页定位）',marker:''})),verified:'待检查'};}
  function reconcileSigning(t){const old=t.signing||defaultSigning(t),base=defaultSigning(t);return {...old,roles:base.roles,documents:base.documents.map(d=>{const previous=old.documents?.find(x=>x.name===d.name);return previous?{...d,...previous,roles:previous.roles||copy(base.roles)}:d;})};}
  function signingIssues(t){const x=t.signing,out=[];if(!x)return ['签署设置待配置'];
    if(!providers.some(p=>p.id===t.provider))out.push('请选择签署平台');
    if(!generationNames[t.generation])out.push('请选择文件生成方式');
    if(t.textSource==='custom'&&t.provider==='12301')out.push('12301定制文本接收能力待核实，请采用获准文本或第三方');
    if(!['同时签署','客户先签，我方后签','我方先签，客户后签'].includes(x.order))out.push('请选择签署顺序');
    const roles=defaultSigning(t).roles;
    if(roles.some(r=>!x.roles?.includes(r))||x.roles?.some(r=>!roles.includes(r)))out.push('需配置适用客户必要签署方及我方公司');
    if(['合同正文',...t.attachments].some(name=>!x.documents?.some(d=>d.name===name)))out.push('签署文件清单与正文附件不一致');
    if(x.documents?.some(d=>!['合同正文',...t.attachments].includes(d.name)))out.push('请移除不再采用的签署文件');
    if(x.documents?.some(d=>d.sign&&(!d.roles?.length||d.roles.some(r=>!roles.includes(r)))))out.push('共同签署文件须选择适用签署方');
    if(roles.some(r=>!x.documents?.some(d=>d.name==='合同正文'&&d.sign&&d.roles?.includes(r))))out.push('合同正文须包含全部必要签署方');
    if(x.documents?.some(d=>d.sign&&d.position==='指定签署标记'&&!d.marker?.trim()))out.push('请填写签署标记');
    if(!x.documents?.some(d=>d.name==='合同正文'&&d.sign))out.push('合同正文必须共同签署');
    if(x.documents?.some(d=>d.sign&&!d.position?.trim()))out.push('共同签署文件须设置签署位置');
    if(x.verified!=='样例已检查')out.push('请检查签署文件与位置样例');return out;
  }
  const ruleCompanies=r=>r.companies||[r.company].filter(Boolean);
  const conditionKeys=['province','days','serviceMode'];
  const condition=(r,k)=>k==='province'&&r[k]==='全国'?'':String(r[k]||'');
  function overlap(a,b){return ruleCompanies(a).some(c=>ruleCompanies(b).includes(c))&&a.business===b.business&&a.range===b.range&&a.customer===b.customer&&a.start<=b.end&&b.start<=a.end&&conditionKeys.every(k=>!condition(a,k)||!condition(b,k)||condition(a,k)===condition(b,k));}
  function moreSpecific(a,b){return conditionKeys.every(k=>!condition(b,k)||condition(a,k)===condition(b,k))&&conditionKeys.some(k=>condition(a,k)&&!condition(b,k));}
  function matches(r,o,s){return ruleCompanies(r).includes(o.company)&&r.business===o.business&&r.range===s.range&&r.customer===(o.customerType||(o.business==='MICE'?'企业':'个人'))&&conditionKeys.every(k=>!condition(r,k)||condition(r,k)===String(s[k]||''));}
  function selectRule(state,o,s,day=today()){
    const hits=state.rules.filter(r=>r.status==='启用'&&dateOK(r.start)&&dateOK(r.end)&&r.start<=day&&r.end>=day&&matches(r,o,s));
    const best=hits.filter(r=>!hits.some(x=>x!==r&&moreSpecific(x,r)));return {rule:best.length===1?best[0]:null,issues:best.length===1?[]:[best.length?'当前场景匹配多条合同规则，请处理配置冲突':'本公司当前场景没有已启用的合同规则']};
  }
  function eligibleRuleTemplate(r,t,state){return t.status==='启用'&&t.business===r.business&&t.range===r.range&&t.customer===r.customer&&ruleCompanies(r).length>0&&ruleCompanies(r).every(id=>t.companies.includes(id)&&state.companies.some(c=>c.id===id))&&(t.category!=='省级示范'||!!condition(r,'province')&&r.province===t.province)&&(!['day','zhejiang'].includes(t.profile)||String(r.days)==='1')&&(!r.serviceMode||r.serviceMode===t.serviceMode);}
  function policy(state,company,business){return state.signingPolicies?.find(p=>p.company===company&&p.business===business)||state.signingPolicies?.find(p=>p.company===company&&!p.business);}
  function policyIssues(p){const out=[];if(!p||!p.confirmed||!p.evidence)out.push('签约政策待确认');if(!p||p.payment==='待确认'||p.payment==='按付款节点'&&!['订单约定首款','订单约定全款'].includes(p.paymentNode))out.push('签约付款条件待确认');if(!p?.review||p.review==='需要审核'&&!p.flow)out.push('合同审批流程未配置');return out;}
  function newState() {
    const state={companies:copy(companies),templates:copy(templates),rules:copy(rules),connections:{},logs:[],history:[],signingPolicies:[],regulatoryRules:[]};
    providers.forEach(p=>state.connections[p.id]={environment:'待平台提供',url:'',appId:'',contact:'',state:'未配置',checkedAt:'未核对',capabilities:Object.fromEntries(capabilities.map(k=>[k,'待核实']))});
    state.connection=state.connections['12301'];
    state.companies.forEach(c=>{c.platformAccounts={fadada:{platform:c.id==='fj'?'示例企业-FDD-FJ':'',seal:c.id==='fj'?'福建凯撒合同章（第三方样例）':'',sealCompany:c.id,authorization:c.id==='fj'?'已核对':'待核实',sealState:c.id==='fj'?'已核对':'待核实',evidence:c.id==='fj'?'原型公司授权样例':'',account:'',start:'2026-01-01',end:'2026-12-31'}};state.signingPolicies.push({id:'POL-'+c.id,company:c.id,business:'',payment:c.id==='fj'?'先签后收':'待确认',paymentNode:'',review:'需要审核',flow:'合同首次签约',confirmed:c.id==='fj',evidence:c.id==='fj'?'原型公司政策样例':''});});
    state.signingPolicies.push({id:'POL-fj-cruise',company:'fj',business:'邮轮',payment:'待确认',paymentNode:'',review:'需要审核',flow:'合同首次签约',confirmed:false,evidence:''});
    state.templates.forEach(t=>{t.provider='12301';t.textSource=C.get(t.profile)?.custom?'custom':'standard';t.generation='platform';t.signing=defaultSigning(t);t.signing.verified='样例已检查';if(t.textSource==='custom'){t.provider='fadada';t.generation='file';}});
    for(const [profile,name] of [['study','研学旅游定制合同'],['cruise','邮轮旅游定制合同']]){
      const source=state.templates.find(t=>t.profile===profile);const t={...copy(source),id:'T-CUSTOM-'+profile.toUpperCase(),name,provider:'fadada',textSource:'custom',category:'企业自有',province:'全国',generation:'file',status:'启用',directoryName:name,directoryCode:'',textReference:name+' · V1.0（样例）'};t.signing=defaultSigning(t);t.signing.verified='样例已检查';state.templates.push(t);
    }
    const manual=copy(state.templates.find(t=>t.id==='T-DOMESTIC-2026'));Object.assign(manual,{id:'T-DOMESTIC-MANUAL',name:'境内旅游合同（平台办理样例）',generation:'manual'});state.templates.push(manual);
    state.rules=state.rules.map(r=>{const n={...r,companies:[r.company]};for(const k of ['draftStage','review','flow','payment','paymentNode','confirmed','evidence','owner','category'])delete n[k];n.province=r.category==='省级示范'?r.province:'';return n;});
    state.rules.push({id:'R-FJ-DOMESTIC',name:'福建境内参团游默认合同',companies:['fj'],company:'fj',business:'参团游',range:'境内',customer:'个人',province:'',template:'T-DOMESTIC-2026',start:'2026-01-01',end:'2026-12-31',status:'启用'});
    for(const profile of ['study','cruise']){const t=state.templates.find(t=>t.id==='T-CUSTOM-'+profile.toUpperCase());state.rules.push({id:'R-CUSTOM-'+profile,name:'福建'+t.business+'定制合同',companies:['fj'],company:'fj',business:t.business,range:t.range,customer:t.customer,province:'',template:t.id,start:'2026-01-01',end:'2026-12-31',status:'启用'});}
    return state;
  }
  root.ContractSettings = {copy,today,dateOK,dates,companyIssues,templateIssues,ruleIssues,storeIssues,newState,providers,providerName,generationNames,capabilities,account,accountIssues,profileFor,defaultSigning,reconcileSigning,signingIssues,ruleCompanies,overlap,moreSpecific,matches,selectRule,eligibleRuleTemplate,policy,policyIssues};
  if (typeof module!=='undefined') module.exports=root.ContractSettings;
})(typeof window==='undefined'?globalThis:window);
