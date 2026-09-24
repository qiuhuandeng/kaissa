(function (root) {
  'use strict';
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
  templates.forEach(t=>{t.mapping={company:'示例-company',travelers:'示例-travelers',trip:'示例-trip',amount:'示例-amount'};});
  companies.forEach(c=>{c.connection='公司授权连接（示例）';c.platformReview=c.id==='fj'?'无需额外审核（演示）':'待平台确认';c.templateTypes=c.id==='fj'?['团队境内旅游合同','团队出境旅游合同']:[];c.signModes=c.id==='fj'?['多人合签','按人分签','代表及代理签署']:[];});
  const today = () => new Date().toLocaleDateString('en-CA');
  const dateOK = value => { const d=new Date(value+'T12:00:00Z'); return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===value; };
  const dates = (start,end) => !dateOK(start) || !dateOK(end) || start>end ? ['请填写有效的生效及截止日期'] : [];
  function companyIssues(c, day=today()) {
    if (!c) return ['请选择签约公司'];
    let issues=[];
    if (!c.license) issues.push('旅行社许可证待补');
    if (!c.platform) issues.push('平台企业未关联');
    if (c.authorization!=='已核对' || !c.evidence) issues.push('公司授权待核实');
    if (!c.seal || c.sealState!=='已核对') issues.push('电子合同用章待核实');
    if (c.sealCompany!==c.id) issues.push('用章公司与签约公司不一致');
    if (dates(c.start,c.end).length) issues.push('授权期限待核实');
    else if (day<c.start || day>c.end) issues.push('授权不在有效期');
    if (!c.scope.trim()) issues.push('适用组织待填写');
    return issues;
  }
  function templateIssues(t, cs, day=today(), publish=false) {
    const out=[];
    if (!t.name.trim() || !t.version.trim()) out.push('请填写模板名称和版本');
    if (!publish && t.status!=='启用') out.push('模板未启用');
    if (!t.companies.length) out.push('请选择适用签约公司');
    t.companies.forEach(id=>{ const c=cs.find(x=>x.id===id); if (companyIssues(c,day).length) out.push((c?.name||id)+'签约条件不完整'); if(c&&(!c.templateTypes.includes(t.platformType)||!c.signModes.includes(t.mode)))out.push(c.name+'未确认支持本模板类型或签署方式'); });
    if (!t.verified || !t.platformCode || !t.platformVersion || t.platformType==='待平台确认') out.push('平台模板及支持方式待核实');
    if (dates(t.start,t.end).length) out.push('模板有效日期不完整');
    else if (day<t.start || day>t.end) out.push('模板不在有效期');
    if (!t.attachments.includes('行程单') || !t.attachments.includes('费用明细')) out.push('请配置行程单和费用明细');
    if (t.customer==='企业' && (t.mode!=='企业代表签署' || !t.attachments.includes('企业授权书'))) out.push('企业合同需代表签署并提供企业授权书');
    if (t.customer==='个人' && t.mode==='企业代表签署') out.push('个人客户不适用企业代表签署');
    if (!t.clauses.trim()) out.push('请补充合同条款');
    if (['company','travelers','trip','amount'].some(k=>!t.mapping?.[k]?.trim())) out.push('请补齐平台必需内容的字段对应');
    return [...new Set(out)];
  }
  function ruleIssues(r, state, day=today(), enable=false) {
    let out=[];
    if (!r.name.trim()) out.push('请填写规则名称');
    if (!r.confirmed || !r.evidence.trim()) out.push('业务政策尚未确认');
    if (r.payment==='待确认') out.push('签约付款条件待确认');
    if (r.payment==='按付款节点' && !['订单约定首款','订单约定全款'].includes(r.paymentNode)) out.push('请选择订单已约定的付款节点');
    if (r.review==='需要审核' && !r.flow) out.push('请选择已启用的审批流程');
    if (r.scope==='指定门店' && !r.store.trim()) out.push('请选择适用门店');
    out.push(...dates(r.start,r.end));
    if (dateOK(r.start) && dateOK(r.end) && (day<r.start||day>r.end)) out.push('规则不在有效期');
    const t=state.templates.find(t=>t.id===r.template);
    if (!t || !t.companies.includes(r.company) || t.business!==r.business) out.push('模板与签约公司或业务类型不匹配');
    else out.push(...templateIssues(t,state.companies,day));
    const conflict=state.rules.find(x=>x.id!==r.id && x.status==='启用' && x.company===r.company && x.business===r.business && x.start<=r.end && r.start<=x.end && (x.scope==='公司通用'||r.scope==='公司通用'||x.store===r.store));
    if (conflict) out.push('与“'+conflict.name+'”适用范围重叠，请先调整已有规则');
    if (!enable && r.status!=='启用') out.push('规则未启用');
    return [...new Set(out)];
  }
  function storeIssues(choice,state,day=today()) {
    if (!choice.allow) return [];
    const c=state.companies.find(c=>c.id===choice.company), t=state.templates.find(t=>t.id===choice.template), r=state.rules.find(r=>r.id===choice.rule);
    let out=companyIssues(c,day);
    if (!t || !t.companies.includes(choice.company)) out.push('合同模板不适用该签约公司');
    else out.push(...templateIssues(t,state.companies,day));
    if (!r || r.company!==choice.company || r.template!==choice.template || (r.scope==='指定门店'&&r.store!==choice.store)) out.push('合同规则与门店选用不匹配');
    else out.push(...ruleIssues(r,state,day));
    return [...new Set(out)];
  }
  function newState() { return {companies:copy(companies),templates:copy(templates),rules:copy(rules),connection:{environment:'待平台提供',url:'',appId:'',capability:'待确认',contact:'',state:'未配置',checkedAt:'未核对'},logs:[],history:[]}; }
  root.ContractSettings = {copy,today,dateOK,dates,companyIssues,templateIssues,ruleIssues,storeIssues,newState};
  if (typeof module!=='undefined') module.exports=root.ContractSettings;
})(typeof window==='undefined'?globalThis:window);
