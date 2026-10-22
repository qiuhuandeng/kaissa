/* Approval configuration prototype. Session-scoped configuration only; no business-document writes. */
(function (root) {
  'use strict';
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value||'') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => 'ac-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const companies = [{id:'fj',name:'福建凯撒国际旅行社有限公司',short:'福建凯撒'}, {id:'bj',name:'北京凯撒国际旅行社有限公司',short:'北京凯撒'}];
  const O=typeof module==='object'&&module.exports?require('./approval-org-data.js'):root.ApprovalOrgData;
  const organization=O.read(),people=organization.people;
  const departments=organization.departments.filter(d=>d.active).map(d=>({...d,owner:O.owners(organization,d)[0]}));
  const legacyDuties = ['财务审核','财务负责人','合同审核','法务审核','公司负责人','业务审核','组织审核'];
  const duties = ['渠道负责人','渠道总监','产品总监','供应商管理审核','核算会计','财务BP','财务经理','总经理','开票审核人员',...legacyDuties];
  const sources = {manager:'申请人上级',department:'部门负责人',superior:'上级部门负责人',duty:'按审批职责',business:'单据负责人',member:'指定成员'};
  const modes = {all:'全部同意',any:'一人同意',sequential:'依次审批'};
  const repeatModes = {every:'每个节点都需要审批',consecutive:'仅连续重复审批时免重复审批',once:'同一申请首次同意后免重复审批'};
  function rulesFor(t){return {returnAllowed:true,withdrawAllowed:true,transferAllowed:false,hours:24,reasonRequired:true,self:'block',empty:'block',departed:'block',emptyMembers:{},departedMembers:{},repeat:'every',approveOpinionRequired:false,signatureRequired:false,...clone(t.rules||{})};}
  function eligible(state,id,company){const p=state.people.find(p=>p.id===id);return !!(p?.active&&p.companies.includes(company)&&p.approvalAuthorized!==false&&O.jobs(state.org||organization,id,company,O.today()).some(a=>(state.org||organization).departments.some(d=>d.id===a.department&&d.active)));}
  function validateRules(state,t){
    const r=rulesFor(t),errors=[];
    for(const key of ['empty','departed']){
      if(!['block','replace'].includes(r[key]))errors.push('请选择有效的人员异常处理方式');
      if(r[key]==='replace')t.companies.forEach(company=>{if(!eligible(state,r[key+'Members']?.[company],company))errors.push(companyName(company)+'：请选择'+(key==='empty'?'人员为空':'人员离职')+'时有本公司审批授权的接替人');});
    }
    if(!repeatModes[r.repeat])errors.push('请选择有效的重复审批规则');
    for(const key of ['returnAllowed','withdrawAllowed','transferAllowed','approveOpinionRequired','signatureRequired'])if(typeof r[key]!=='boolean')errors.push('审批规则选项无效，请重新设置');
    if(r.self!=='block'||r.reasonRequired!==true)errors.push('申请人不得自审，退回和拒绝必须填写原因');
    if(!Number.isFinite(Number(r.hours))||Number(r.hours)<1||Number(r.hours)>720)errors.push('办理时限请填写 1—720 小时');
    return [...new Set(errors)];
  }
  const groups = {
    '产品与履约':['产品发布','代理入库','代理上线','团期开排','团期调整','价格调整','成本差异','交通资源付款','超DL还位','损耗确认'],
    '销售与渠道':['渠道授权','佣金规则','渠道账户','渠道对账','改期转团','订单应收变更','订单结算价变更','订单优惠','订单转款'],
    '财务':['供应商账户变更','付款申请','退款申请','认款调整／复核','坏账处理','结算确认','发票红冲','NC异常处理','预存账户开户','收付款配置变更','收付款资料停用','付款退回','预付款退回','领队费用申请','开票申请','预付转款'],
    '合同':['合同首次签约','合同变更','合同撤销','合同解除','企业合同归档','合同模板发布','合同收款例外','单团合同审核'],
    '会员与营销':['活动报批','活动变更','人工调级','注销用户','积分补发','积分发放处理','等级失败重跑','取消兑换','等级规则发布','积分规则发布','章程发布','券作废','券恢复'],
    '组织与门店':['组织人事','门店档案准入','门店销售授权','门店财务配置','门店恢复营业','员工组织调整']
  };
  const moneyScenes = ['订单应收变更','付款申请','退款申请','交通资源付款','成本差异','认款调整／复核','坏账处理','结算确认','发票红冲'];
  // Only offer document owners where the source business page has an owner field.
  const businessOwnerFields = {'产品发布':'产品负责人','价格调整':'产品负责人','代理入库':'产品负责人','代理上线':'产品负责人','团期开排':'团期负责人','团期调整':'团期负责人'};
  const scenes = Object.entries(groups).flatMap(([group,names]) => names.map(name => ({
    name,group,companyLabel:name.includes('付款')?'付款公司':name.includes('退款')?'退款责任公司':group==='合同'?'合同主体公司':'业务责任公司',
    fields:group==='合同'?['合同及版本','合同主体公司','申请人及部门','合同正文与附件','申请原因']:name==='价格调整'?['产品及团期','业务责任公司','申请人及部门','原价及调整后价格','调价幅度','调整原因']:moneyScenes.includes(name)?['来源单据','业务责任公司','申请人及部门','申请金额及币种','业务依据']:['来源单据','业务责任公司','申请人及部门','申请内容及依据'],
    conditions:name==='价格调整'?['rate']:moneyScenes.includes(name)?['amount']:[],
    businessOwnerAvailable:!!businessOwnerFields[name],
    businessLabel:businessOwnerFields[name]||(group==='产品与履约'?'团期负责人':'业务负责人')
  })));
  const scene = name => scenes.find(s => s.name===name);
  const conditionFields={
    activityLevel:{label:'活动级别',values:['A','B','常规']},
    amount:{label:'申请金额',type:'number'},rate:{label:'调价幅度绝对值（%）',type:'number'},
    channel:{label:'销售渠道',values:['门店','呼叫中心','电商','分销']},
    paymentType:{label:'付款申请类型',values:['预付款','应付付款']},
    refundRoute:{label:'退款方式',values:['线上原路退回','线下退款']},
    returned:{label:'实际回团状态',values:['回团前','已回团']},
    settlementChanged:{label:'是否修改供应商结算价',values:['是','否']},
    settlementStage:{label:'结算次数',values:['首次结算','二次结算']},
    expenseType:{label:'领队费用类型',values:['借款','付款','报销']},
    invoiceType:{label:'开票类型',values:['预开票','开票']},
    receiptPassed:{label:'是否达到渠道收款要求',values:['是','否']},
    discountAmount:{label:'优惠金额',type:'number'},discountRate:{label:'优惠比例（%）',type:'number'}
  };
  const scopeTypes={company:'公司通用',businessDepartment:'业务责任部门',productDepartment:'产品责任部门',channel:'销售渠道'};
  // Prototype product organizations from the existing organization tree and product ownership selector.
  // Branches and stores are not product departments. Formal assignments remain to be maintained.
  const productDepartmentIds=['fj-center','fj-europe','fj-org-15','fj-org-16','fj-org-17'];
  function scopeDepartments(type,company){return departments.filter(d=>d.company===company&&(type!=='productDepartment'||productDepartmentIds.includes(d.id)||d.productBusiness===true));}
  const scopeChoices={company:'本公司全部业务',businessDepartment:'指定业务部门的业务',productDepartment:'指定产品部门的产品',channel:'指定销售渠道的订单'};
  const companyBases={company:'单据业务责任公司',productCompany:'产品责任公司',salesCompany:'销售责任公司'};
  const extraFields={
    '活动报批':['activityLevel'], '活动变更':['activityLevel'],
    '付款申请':['paymentType'], '退款申请':['refundRoute','channel'], '结算确认':['settlementStage'],
    '订单结算价变更':['settlementChanged','returned'], '订单优惠':['amount','discountAmount','discountRate','channel'],
    '订单转款':['amount'], '预付转款':['amount'], '付款退回':['amount'], '预付款退回':['amount'],
    '领队费用申请':['amount','expenseType'], '开票申请':['amount','invoiceType'],
    '合同收款例外':['receiptPassed','channel'], '单团合同审核':['amount']
  };
  for(const s of scenes){s.fields=[...s.fields,...(extraFields[s.name]||[]).filter(k=>!['amount','rate'].includes(k)).map(k=>conditionFields[k].label)];s.conditions=[...new Set([...s.conditions,...(extraFields[s.name]||[])])];
    if(['退款申请','单团合同审核','订单优惠'].includes(s.name)){s.businessOwnerAvailable=true;s.businessLabel='订单计调';}
  }
  function conditionErrors(c,name){const f=conditionFields[c.field],errors=[];
    if(!f||!scene(name)?.conditions.includes(c.field))return ['该业务不支持此条件字段'];
    if(f.type==='number'){
      if(!['gt','gte','lt','lte','eq'].includes(c.op)||c.value===''||!Number.isFinite(Number(c.value))||Number(c.value)<0)errors.push('请填写有效的非负条件数值');
      if(c.field==='discountRate'&&Number(c.value)>100)errors.push('比例不能超过100%');
      if(['amount','discountAmount'].includes(c.field)&&!['CNY','USD','EUR'].includes(c.currency))errors.push('请选择金额币种');
    }else if(!['eq','neq','in','notin'].includes(c.op)||(Array.isArray(c.value)?!c.value.length||c.value.some(v=>!f.values.includes(v)):!f.values.includes(c.value)))errors.push('请选择有效的业务条件及比较方式');
    return errors;
  }
  function conditionContextErrors(conditions,c){const errors=[];for(const x of conditions){const f=conditionFields[x.field],v=c[x.field];
    if(!f)errors.push('不支持的条件字段');
    else if(v===''||v===undefined||v===null||(f.type==='number'?(!Number.isFinite(Number(v))||Number(v)<0||(x.field==='discountRate'&&Number(v)>100)):!f.values.includes(v)))errors.push('请提供有效的'+f.label+'，缺失或未知不能按其他情况处理');
  }return errors;}
  function arrangementStatus(a,date=O.today()){return a.disabled?'已停用':a.start&&a.start>date?'未生效':a.end&&a.end<date?'已到期':'有效';}
  function arrangementScope(a){return (a.scopeType&&a.scopeType!=='company')?(scopeTypes[a.scopeType]+'：'+(a.scopes||[]).map(id=>departments.find(d=>d.id===id)?.name||id).join('、')+(a.includeChildren&&a.scopeType!=='channel'?'（含下级）':'')):'公司通用';}
  function covers(a,id){return (a.scopes||[]).some(x=>x===id||(a.includeChildren&&a.scopeType!=='channel'&&ancestor(departments.find(d=>d.id===id)||{},x)));}
  function resolveDuty(state,n,c){const errors=[],scope=n.scopeBasis||'company',basis=n.companyBasis||'company',company=c[basis];
    if(!company)return {ids:[],errors:['缺少'+companyBases[basis]],notices:[]};
    if(company!==c.company)return {ids:[],errors:['跨公司审批授权待确认，请由审批管理员核实'],notices:[]};
    const key={businessDepartment:'department',productDepartment:'productDepartment',channel:'channel'}[scope];
    if(key&&(!c[key]||(scope==='channel'?!conditionFields.channel.values.includes(c[key]):!scopeDepartments(scope,company).some(d=>d.id===c[key]))))return {ids:[],errors:['缺少有效的'+scopeTypes[scope]],notices:[]};
    const records=state.arrangements.filter(a=>a.company===company&&a.duty===n.duty&&arrangementStatus(a,c.date||O.today())==='有效');
    let matches=records.filter(a=>(a.scopeType||'company')===scope&&(scope==='company'||covers(a,c[key]))),fallback=false;
    if(!matches.length&&scope!=='company'&&n.allowCompanyFallback){matches=records.filter(a=>(a.scopeType||'company')==='company');fallback=matches.length>0;}
    if(matches.length>1)errors.push('同一职责命中多条人员安排，请消除负责范围和有效期重叠');
    return {ids:matches.length===1?matches[0].members:[],errors,basis:matches.length===1?companyName(company)+' / '+n.duty+' / '+(fallback||scope==='company'?'公司通用':scopeTypes[scope]+'：'+(departments.find(d=>d.id===c[key])?.name||c[key]))+(fallback?'（本节点允许公司通用安排）':''):''};
  }
  function businessSample(name){const t=sample(name);t.name=name+'（公司场景草稿）';t.demo=true;
    const duty=(name,scope='company')=>({...node(name,'duty',name),companyBasis:'company',scopeBasis:scope,allowCompanyFallback:false});
    const department=()=>({...node('部门经理','department'),hierarchy:{mode:'single',origin:'bottom',level:1,base:'applicant',empty:'block',within:'all'}}),coordinator=()=>node('订单计调','business');
    const accountant=()=>duty('核算会计','businessDepartment'),bp=()=>duty('财务BP','businessDepartment'),product=()=>duty('产品总监','productDepartment'),channel=()=>duty('渠道总监','channel'),gm=()=>duty('总经理');
    const flows={
      '付款申请':[duty('供应商管理审核'),product(),accountant(),bp(),duty('财务经理'),gm()],
      '退款申请':[coordinator(),channel(),product(),bp(),{id:uid(),type:'branch',title:'退款方式',branches:[{id:uid(),title:'线下退款',match:'all',conditions:[{field:'refundRoute',op:'eq',value:'线下退款'}],nodes:[gm()]},{id:uid(),title:'线上原路退回',fallback:true,conditions:[],nodes:[]}]}],
      '结算确认':[product(),accountant(),bp(),gm()],
      '订单结算价变更':[product()], '订单优惠':[department(),coordinator(),product()],
      '合同收款例外':[duty('渠道负责人','channel')], '单团合同审核':[department(),coordinator(),accountant()],
      '付款退回':[bp()], '预付款退回':[bp()], '领队费用申请':[accountant(),bp(),gm()],
      '开票申请':[accountant(),duty('开票审核人员')], '订单转款':[accountant()], '预付转款':[accountant()]
    };t.nodes=flows[name]||t.nodes;
    if(name==='订单结算价变更')t.trigger={mode:'conditional',match:'all',conditions:[{field:'settlementChanged',op:'eq',value:'是'},{field:'returned',op:'eq',value:'已回团'}],confirmed:true,evidence:'用户确认：结算价变更回团后增加产品总监审批；外部供应商另行确认，销售优惠仍走优惠审批。'};
    if(name==='合同收款例外')t.trigger={mode:'conditional',match:'all',conditions:[{field:'receiptPassed',op:'eq',value:'否'}],confirmed:false,evidence:''};
    return t;
  }
  function demoPersonnel(state){const copy=clone(state);let i=0;
    for(const company of companies){const ids=company.id==='fj'?['sun','wangjie','liu','limin','chentao','zhou']:['zhoumin','wangjie','wufang','limin','zheng'];
      for(const duty of duties.slice(0,9))for(const scopeType of Object.keys(scopeTypes)){
        copy.arrangements=copy.arrangements.filter(a=>!(a.company===company.id&&a.duty===duty&&(a.scopeType||'company')===scopeType));
        copy.arrangements.push({id:'demo-'+i++,company:company.id,duty,scopeType,scopes:scopeType==='channel'?conditionFields.channel.values:departments.filter(d=>d.company===company.id).map(d=>d.id),members:[ids[duties.indexOf(duty)%ids.length]]});
      }
    }return copy;
  }
  function conditionSetsOverlap(a,b){
    const clauses=x=>x.match==='any'?x.conditions.map(c=>[c]):[x.conditions];
    return clauses(a).some(ca=>clauses(b).some(cb=>{
      const all=[...ca,...cb],currencies=[...new Set(all.filter(c=>c.currency).map(c=>c.currency))];if(currencies.length>1)return false;
      return [...new Set(all.map(c=>c.field))].every(key=>{
        const f=conditionFields[key],cs=all.filter(c=>c.field===key);if(!f)return true;
        if(f.type!=='number')return f.values.some(value=>cs.every(c=>matchCondition(c,{[key]:value})));
        let low=0,high=Infinity,lowClosed=true,highClosed=false;
        for(const c of cs){const v=Number(c.value);if(['gt','gte','eq'].includes(c.op)){if(v>low){low=v;lowClosed=c.op!=='gt';}else if(v===low&&c.op==='gt')lowClosed=false;}if(['lt','lte','eq'].includes(c.op)){if(v<high){high=v;highClosed=c.op!=='lt';}else if(v===high&&c.op==='lt')highClosed=false;}}
        return low<high||(low===high&&lowClosed&&highClosed);
      });
    }));
  }
  function ensureBusinessScenes(state){if(state.businessConfigVersion===1)return state;
    const names=Object.keys(extraFields).filter(name=>!groups['会员与营销'].includes(name));for(const name of names){state.templates.push({id:'business-'+name,published:null,draft:businessSample(name),disabled:false,versions:[]});}
    state.businessConfigVersion=1;return state;
  }
  // Display configuration references existing business fields; it never changes their input requirements.
  const contentField = (id,label,group,required,sampleValue,extra={}) => ({id,label,group,required,sample:sampleValue,...extra});
  function contentCatalog(name) {
    const f=contentField, s=scene(name);
    if(name==='订单应收变更')return [
      f('orderNo','原订单','业务依据',true,'KS20260926001'),f('productType','产品类型','业务依据',true,'参团游'),f('before','原项目数量、单价及金额','调整内容',true,'单房差 1 × 1800 = 1800'),f('after','调整后数量、单价及金额','调整内容',true,'单房差 1 × 1500 = 1500'),f('delta','应收差额','调整内容',true,'-300.00'),f('reason','调整原因及客户确认依据','业务依据',true,'客户确认调整报价'),f('resource','计调确认结果','业务依据',true,'已确认'),f('received','实收及多收款影响','业务依据',true,'实收保持不变；多收款另走退转流程')
    ];
    if(name==='付款申请')return [
      f('sourceNo','申请单号','付款申请',false,'FK20260924001',{input:'自动带入',selected:true}),
      f('applyType','申请类型','付款申请',true,'应付付款',{source:'data-apply-type'}),
      f('base-1','付款主体','付款申请',true,'福建凯撒国际旅行社有限公司',{source:'data-company'}),
      f('base-2','申请人及部门','付款申请',true,'陈红 / 财务部',{input:'自动带入'}),
      f('submittedAt','申请日期','付款申请',false,'2026-09-24',{source:'data-apply-date',selected:true}),
      f('payee','付款对象','付款申请',true,'示例旅行服务有限公司',{source:'data-payee'}),
      f('base-0','来源单据','付款申请',true,'YF20260924001',{source:'data-business-no'}),
      f('costSource','成本来源','付款申请',false,'团期成本',{source:'data-cost-source'}),
      f('base-4','付款依据','付款申请',true,'应付确认单',{source:'data-basis-type'}),
      f('paymentNode','付款节点','付款申请',false,'合同尾款',{source:'data-node'}),
      f('planDate','计划付款日期','付款申请',false,'2026-09-30',{source:'data-plan-date'}),
      f('base-3','申请金额','付款申请',true,'60,000.00',{source:'data-original-amount'}),
      f('currency','币种','付款申请',true,'CNY',{source:'data-currency'}),
      f('rate','汇率','付款申请',false,'1.0000',{source:'data-rate'}),
      f('localAmount','本币金额','付款申请',false,'60,000.00',{source:'data-local-amount'}),
      f('available','可申请金额','付款申请',false,'80,000.00',{source:'data-available'}),
      f('currentLimit','本次上限','付款申请',false,'80,000.00',{source:'data-current-limit'}),
      f('prepayBalance','预付余额','付款申请',false,'10,000.00',{source:'data-prepay-balance'}),
      f('prepayOffset','本次冲抵','付款申请',false,'0.00',{source:'data-prepay-offset'}),
      f('afterOffset','冲抵后申请','付款申请',false,'60,000.00',{source:'data-after-offset'}),
      f('prepayAction','冲抵处理口径','付款申请',false,'本次不冲抵',{source:'data-prepay-action'}),
      f('remark','申请备注','付款申请',false,'按合同约定支付',{source:'data-note'})
    ];
    if(name==='门店档案准入')return [
      f('storeName','门店名称','申请信息',true,'软件园门店',{source:'storeFormName',input:'必填'}),
      f('storeType','门店类型','申请信息',true,'加盟门店',{source:'storeFormType',input:'必填'}),
      f('company','所属公司','申请信息',true,'福建凯撒',{source:'storeFormSubject',input:'自动带入'}),
      f('applicant','申请人及部门','申请信息',true,'陈红 / 厦门分公司',{input:'自动带入'}),
      f('applyType','本次申请类型','申请信息',true,'档案变更',{input:'自动带入'}),
      f('organization','组织路径','管理归属',true,'福建凯撒 > 厦门分公司 > 厦门思明区门市部',{source:'storeOrgPath',input:'必选'}),
      f('reportOrg','数据统计归属','管理归属',false,'厦门分公司 / 厦门思明区门市部',{source:'storeReportOrg',input:'自动带入'}),
      f('department','所属部门','管理归属',false,'厦门分公司 / 厦门思明区门市部',{source:'storeFormCenter',input:'必选'}),
      f('manager','负责人','联系信息',true,'沈悦',{source:'storeManager',input:'必填'}),
      f('phone','联系电话','联系信息',false,'136****8821',{source:'storePhone',input:'必填',selected:true}),
      f('address','经营地址','联系信息',false,'厦门市思明区观日路18号',{source:'storeAddress',input:'必填',selected:true}),
      f('qualificationMode','资质使用方式','自营资质',true,'沿用所属经营主体资质',{source:'selfQualificationMode',applies:'self',input:'必选'}),
      f('qualificationNo','独立资质编号','自营资质',true,'L-FJ-示例001',{source:'selfQualificationNo',applies:'independent',input:'条件提供'}),
      f('qualificationExpiry','资质有效期','自营资质',true,'2029-12-31',{source:'selfQualificationExpiry',applies:'independent',input:'条件提供'}),
      f('qualificationFile','独立资质文件','自营资质',true,'独立资质示例.pdf',{source:'selfQualificationFile',applies:'independent',input:'条件提供'}),
      f('franchiseCompany','加盟企业名称','加盟资质',true,'苏州金鸡湖旅行服务有限公司',{source:'franchiseCompany',applies:'franchise',input:'必填'}),
      f('creditCode','统一社会信用代码','加盟资质',true,'91320594MA2X****',{source:'franchiseCreditCode',applies:'franchise',input:'必填'}),
      f('legal','法定代表人','加盟资质',false,'周海',{source:'franchiseLegal',applies:'franchise',input:'选填'}),
      f('franchiseContact','企业联系人','加盟资质',false,'沈悦',{source:'franchiseContact',applies:'franchise',input:'选填'}),
      f('licenseExpiry','营业执照有效期','加盟资质',true,'2029-12-31',{source:'franchiseLicenseExpiry',applies:'franchise',input:'选填'}),
      f('licenseFile','营业执照文件','加盟资质',true,'营业执照示例.pdf',{source:'franchiseLicenseFile',applies:'franchise',input:'资料附件'}),
      f('agreementNo','协议编号','合作协议',true,'HT-JM-20260704',{source:'franchiseAgreementNo',applies:'franchise',input:'必填'}),
      f('agreementFile','协议文件','合作协议',true,'加盟合作协议示例.pdf',{source:'franchiseAgreementFile',applies:'franchise',input:'资料附件'}),
      f('agreementStart','协议生效日期','合作协议',true,'2026-07-04',{source:'storeStartDate',applies:'franchise',input:'必填'}),
      f('agreementEnd','协议到期日期','合作协议',true,'2027-07-03',{source:'storeContractDate',applies:'franchise',input:'必填'}),
      f('effectiveDate','计划启用日期','启用安排',true,'2026-10-01',{source:'storeEffectiveDate',input:'必填'}),
      f('profileRemark','档案备注','启用安排',false,'',{source:'storeProfileRemark',input:'选填'})
    ];
    const base=(s?.fields||[]).map((label,i)=>f('base-'+i,label,'业务资料',true,label.includes('公司')?'福建凯撒国际旅行社有限公司':label.includes('金额')?'¥60,000 / CNY':label.includes('幅度')?'5%':label.includes('申请人')?'陈红 / 厦门分公司':label.includes('产品')?'日本关西深度游 / 2026-10-01':label.includes('合同')?'HT-20260924-001 / V1.0':label.includes('原因')?'业务调整申请':'已随申请提交',{input:'业务单据带入'}));
    if(name==='门店销售授权')return [f('storeName','门店名称','申请信息',true,'软件园门店'),f('storeType','门店类型','申请信息',true,'加盟门店'),f('company','所属公司','申请信息',true,'福建凯撒'),f('applicant','申请人及部门','申请信息',true,'陈红 / 厦门分公司'),...['可售产品类型','可售目的地','签约主体','合同模板','订单能力','合同控制','主体复核','授权有效期'].map((label,i)=>f('sales-'+i,label,'销售授权',true,'本次授权申请内容'))];
    if(name==='门店财务配置')return [f('storeName','门店名称','申请信息',true,'软件园门店'),f('storeType','门店类型','申请信息',true,'加盟门店'),f('company','所属公司','申请信息',true,'福建凯撒'),f('applicant','申请人及部门','申请信息',true,'陈红 / 厦门分公司'),...['结算方式','账期','预存安排','管理费','收付款资料选用','保证金约定'].map((label,i)=>f('finance-'+i,label,'加盟财务',true,'本次财务配置申请内容',{applies:'franchise'})),...['收款方式','内部核算方式','公司账户','公司支付商户','NC辅助核算'].map((label,i)=>f('self-finance-'+i,label,'自营核算',true,'公司统一配置',{applies:'self'}))];
    return [...base,f('submittedAt','申请时间','申请信息',false,'2026-09-24 10:30',{input:'自动带入',selected:true}),f('sourceNo','来源业务单号','申请信息',false,'SQ20260924001',{input:'自动带入',selected:true})];
  }
  function defaultContent(name) {
    const groups=[];contentCatalog(name).filter(f=>f.required||f.selected).forEach(f=>{let g=groups.find(g=>g.name===f.group);if(!g){g={id:uid(),name:f.group,fields:[]};groups.push(g);}g.fields.push(f.id);});
    return {groups,hideEmpty:true};
  }
  function getContent(t){return t.content||defaultContent(t.scene);}
  function validateContent(t){
    if(!t.content)return []; // Old published versions retain their original fixed display.
    const errors=[],catalog=contentCatalog(t.scene),ids=t.content.groups.flatMap(g=>g.fields);
    if(t.content.groups.some(g=>!g.name.trim()))errors.push('请填写审批内容分组名称');
    if(new Set(t.content.groups.map(g=>g.name.trim())).size!==t.content.groups.length)errors.push('审批内容分组名称不能重复');
    if(new Set(ids).size!==ids.length)errors.push('同一审批字段不能重复展示');
    if(ids.some(id=>!catalog.some(f=>f.id===id)))errors.push('审批内容包含不属于当前事项的字段');
    catalog.filter(f=>f.required&&!ids.includes(f.id)).forEach(f=>errors.push(f.label+'为审批必显字段，不能隐藏'));
    return errors;
  }
  function contentApplies(f,values){return !f.applies||(f.applies==='franchise'&&values.storeType==='加盟门店')||(f.applies==='self'&&values.storeType==='自营门店')||(f.applies==='independent'&&values.storeType==='自营门店'&&values.qualificationMode==='门店有独立经营资质');}
  function previewContent(t,values,changes={}){
    const catalog=contentCatalog(t.scene),layout=getContent(t),empty=v=>v===undefined||v===null||v==='';
    const row=f=>({...f,value:values[f.id],changed:Object.prototype.hasOwnProperty.call(changes,f.id),before:changes[f.id]});
    const visible=catalog.filter(f=>contentApplies(f,values));
    return {
      groups:layout.groups.map(g=>({name:g.name,fields:g.fields.map(id=>visible.find(f=>f.id===id)).filter(Boolean).filter(f=>f.required||!layout.hideEmpty||!empty(values[f.id])||Object.prototype.hasOwnProperty.call(changes,f.id)).map(row)})).filter(g=>g.fields.length),
      changes:catalog.filter(f=>Object.prototype.hasOwnProperty.call(changes,f.id)).map(row),
      all:visible.map(row)
    };
  }
  function moveNode(t,listId,id,position){const list=getList(t,listId),index=list?.findIndex(n=>n.id===id);if(!list||index<0||!Number.isInteger(position)||position<0||position>=list.length)return false;const [n]=list.splice(index,1);list.splice(position,0,n);return true;}
  function cloneConditionBranch(branch){const copy=clone(branch);copy.id=uid();copy.title+='（副本）';walk(copy.nodes,n=>{n.id=uid();if(n.type==='branch')n.branches.forEach(b=>b.id=uid());});return copy;}
  function reorderBranches(n,ids){const normal=n.branches.filter(b=>!b.fallback),fallback=n.branches.find(b=>b.fallback);if(!fallback||ids.length!==normal.length||new Set(ids).size!==ids.length||ids.some(id=>!normal.some(b=>b.id===id)))return false;n.branches=[...ids.map(id=>normal.find(b=>b.id===id)),fallback];return true;}

  const person = (state,id) => state.people.find(p=>p.id===id);
  const personName = (state,id) => person(state,id)?.name || '未指定';
  const companyName = id => companies.find(c=>c.id===id)?.short || id;
  const node = (title,source='duty',duty='财务审核') => ({id:uid(),type:'approval',title,source,duty,members:[],mode:'all'});
  function sample(name) {
    const s=scene(name);
    let nodes=[];
    if(name==='付款申请') nodes=[node('部门审核','department'),node('财务审核'),{id:uid(),type:'branch',title:'按申请金额分流',branches:[
      {id:uid(),title:'大额付款',match:'all',conditions:[{field:'amount',op:'gt',value:50000,currency:'CNY'}],nodes:[node('财务负责人审批','duty','财务负责人')]},
      {id:uid(),title:'其他情况',fallback:true,conditions:[],nodes:[]}
    ]}];
    else if(name==='价格调整') nodes=[node('产品负责人审核','business'),{id:uid(),type:'branch',title:'按调价幅度分流',branches:[
      {id:uid(),title:'较大幅度调整',match:'all',conditions:[{field:'rate',op:'gt',value:3,currency:''}],nodes:[node('财务审核')]},
      {id:uid(),title:'其他情况',fallback:true,conditions:[],nodes:[]}
    ]}];
    else if(s?.group==='会员与营销'){
      const first=()=>node('业务负责人','department'),second=()=>node('复核负责人','duty','业务审核');
      if(['活动报批','活动变更'].includes(name))nodes=[{id:uid(),type:'branch',title:'按活动级别审批',branches:[
        {id:uid(),title:'A级活动',match:'all',conditions:[{field:'activityLevel',op:'eq',value:'A'}],nodes:[node('部门负责人','department'),node('分管领导','duty','业务审核'),node('总经理','duty','公司负责人')]},
        {id:uid(),title:'B级活动',match:'all',conditions:[{field:'activityLevel',op:'eq',value:'B'}],nodes:[node('部门负责人','department'),node('分管领导','duty','业务审核')]},
        {id:uid(),title:'常规活动',fallback:true,conditions:[],nodes:[node('部门负责人','department')]}
      ]}];else nodes=[first(),second()];
    }
    else if(s?.group==='合同') nodes=[node(name==='合同解除'?'法务审核':'合同审核','duty',name==='合同解除'?'法务审核':'合同审核')];
    return {name:name+'流程',scene:name,companies:['fj','bj'],departments:[],departmentMode:'all',includeChildren:true,fields:{note:true,noteRequired:false,attachments:true,attachmentRequired:false},content:defaultContent(name),nodes,rules:rulesFor({}),demo:true};
  }
  function createState() {
    const arrangements = companies.flatMap(c=>legacyDuties.map(d=>({id:c.id+'-'+d,company:c.id,duty:d,members:[d==='合同审核'?'wangjie':d==='法务审核'?'limin':c.id==='fj'?(d==='财务审核'?'liu':d==='组织审核'?'sun':'chentao'):(d==='财务审核'?'wufang':d==='组织审核'?'zhoumin':'zheng')]})));
    const initial=['付款申请','价格调整',...groups['合同'].slice(0,6)];
    const legacy=['预存账户开户','收付款配置变更','收付款资料停用','产品发布','团期开排','团期调整','供应商账户变更','成本差异','退款申请','认款调整／复核','结算确认','NC异常处理','门店档案准入','门店销售授权','门店财务配置','门店恢复营业','员工组织调整','订单应收变更'];
    return {schema:1,org:clone(organization),people:clone(people),arrangements,delegations:[],templates:[...initial,...legacy].map((name,i)=>{
      const t=sample(name),pub=i<initial.length;
      return {id:'template-'+i,published:pub?clone(t):null,draft:pub?null:t,disabled:false,versions:pub?[{number:1,at:'2026-09-24',by:'审批管理员',template:clone(t)}]:[]};
    })};
  }
  function ensureMemberMarketingScenes(state){
    groups['会员与营销'].forEach((name,index)=>{if(state.templates.some(r=>(r.draft||r.published)?.scene===name))return;
      const t=sample(name);t.rules={...t.rules,transferAllowed:true,approveOpinionRequired:true};
      state.templates.push({id:'member-marketing-'+index,published:t,draft:null,disabled:false,versions:[{number:1,at:'2026-10-22',by:'审批管理员',template:clone(t)}]});
    });return state;
  }
  function memberMarketingRoute(kind,context={},storage){
    if(!groups['会员与营销'].includes(kind))return null;
    const raw=storage?.getItem('caesar-approval-configuration-v1');
    const state=ensureMemberMarketingScenes(raw?JSON.parse(raw):createState());
    const entries=state.templates.filter(r=>r.published?.scene===kind&&!r.disabled);
    if(entries.length!==1)throw Error(kind+'须在审批模板中保留一个已发布且启用的流程');
    const entry=entries[0],t=entry.published,nodes=[];
    function collect(list){for(const n of list){if(n.type==='branch'){const branch=n.branches.find(b=>!b.fallback&&(b.match==='any'?b.conditions.some(c=>matchCondition(c,context)):b.conditions.every(c=>matchCondition(c,context))))||n.branches.find(b=>b.fallback);if(branch)collect(branch.nodes);}else if(n.type==='approval')nodes.push(n.title);}}
    collect(t.nodes);if(!nodes.length)throw Error('审批模板没有匹配的审批节点');
    return {id:entry.id,name:t.name,version:entry.versions?.at(-1)?.number||1,nodes,template:clone(t)};
  }
  function ensureReceivableScenes(state){
    ['订单应收变更','认款调整／复核'].forEach(name=>{
      if(state.templates.some(r=>(r.draft||r.published)?.scene===name))return;
      state.templates.push({id:uid(),published:null,draft:sample(name),disabled:false,versions:[]});
    });
    return state;
  }
  function activeDepartments(t) {
    return departments.filter(d=>t.companies.includes(d.company)&&((t.departmentMode!=='selected'&&!t.departments.length)||t.departments.some(id=>id===d.id||(t.includeChildren&&ancestor(d,id)))));
  }
  function ancestor(d,id){let p=d.parent;while(p){if(p===id)return true;p=departments.find(x=>x.id===p)?.parent;}return false;}
  function accepts(t,c){return t.companies.includes(c.company)&&activeDepartments(t).some(d=>d.id===c.department);}
  function walk(nodes,fn){nodes.forEach(n=>{fn(n);if(n.type==='branch')n.branches.forEach(b=>walk(b.nodes,fn));});}
  function getNode(t,id){let found;walk(t.nodes,n=>{if(n.id===id)found=n;});return found;}
  function getList(t,id){if(id==='root')return t.nodes;let found;walk(t.nodes,n=>{if(n.type==='branch')n.branches.forEach(b=>{if(b.id===id)found=b.nodes;});});return found;}
  function approvers(state,n,c,checkSelf=true,rules={}) {
    const errors=[],notices=[],r=rulesFor({rules});let ids=[],basis='';
    const d=departments.find(x=>x.id===c.department&&x.company===c.company);
    if(n.hierarchy||n.source==='manager'){const result=O.levels(state.org||organization,n,c);errors.push(...result.errors.map(x=>n.title+'：'+x));ids=result.layers.flatMap(x=>x.members);}
    else if(n.source==='department')ids=O.owners(state.org||organization,(state.org||organization).departments.find(x=>x.id===d?.id),c.date||O.today());
    else if(n.source==='superior')ids=O.owners(state.org||organization,(state.org||organization).departments.find(x=>x.id===d?.parent),c.date||O.today());
    else if(n.source==='duty'){const resolved=resolveDuty(state,n,c);ids=resolved.ids;errors.push(...resolved.errors.map(x=>n.title+'：'+x));basis=resolved.basis||'';}
    else if(n.source==='business')ids=[c.businessOwner];
    else if(n.source==='member')ids=n.members||[];
    const originalIds=[...new Set(ids.filter(Boolean))];
    const replacement=(kind,message)=>{
      const id=r[kind+'Members']?.[c.company];
      if(n.type==='approval'&&r[kind]==='replace'&&eligible(state,id,c.company)){
        if(checkSelf&&id===c.applicant){errors.push(n.title+'：接替人不能审批本人申请');return '';}
        notices.push(message+'，转交'+personName(state,id));return id;
      }
      errors.push(n.title+'：'+message+(r[kind]==='replace'?'，接替人失效或未配置':'，暂停并交审批管理员处理'));return '';
    };
    if(!ids.length)ids=[''];
    ids=[...new Set(ids)].map(id=>{
      if(!id)return replacement('empty','未找到'+(sources[n.source]||'审批人'));
      const original=person(state,id);
      if(original&&!original.companies.includes(c.company)){errors.push(n.title+'：'+original.name+'无本公司审批授权');return '';}
      if(checkSelf&&id===c.applicant&&n.type==='approval'){errors.push(n.title+'：申请人不能审批本人申请');return '';}
      const a=state.delegations.find(a=>a.original===id&&a.company===c.company&&(!a.scenes.length||a.scenes.includes(c.scene))&&a.start<=c.date&&a.end>=c.date);
      if(a){
        if(checkSelf&&a.delegate===c.applicant&&n.type==='approval'){errors.push(n.title+'：代办人不能审批本人申请');return '';}
        if(eligible(state,a.delegate,c.company)){notices.push(personName(state,id)+'由'+personName(state,a.delegate)+'代办');return a.delegate;}
        return replacement('departed','代办人员已失效或无本公司授权');
      }
      if(!original?.active)return replacement('departed','人员不存在或已离职');
      if(!O.currentPerson({...state.org||organization,people:state.people},id,c.company,c.date||O.today())){errors.push(n.title+'：'+original.name+'在本公司没有有效任职');return '';}
      if(n.type==='approval'&&original.approvalAuthorized===false){errors.push(n.title+'：'+original.name+'无本公司审批授权');return '';}
      return id;
    });
    return {ids:[...new Set(ids.filter(Boolean))],originalIds,basis,errors:[...new Set(errors)],notices};
  }
  function conditionText(c){return (conditionFields[c.field]?.label||c.field)+(c.currency?'（'+c.currency+'）':'')+' '+({gt:'>',gte:'≥',lt:'<',lte:'≤',eq:'等于',neq:'不等于',in:'属于',notin:'不属于'}[c.op]||'?')+' '+(Array.isArray(c.value)?c.value.join('、'):c.value);}
  function matchCondition(c,context){const f=conditionFields[c.field];if(!f)return false;const v=context[c.field];if(v===''||v===undefined||v===null)return false;
    if(f.type!=='number'){const has=(Array.isArray(c.value)?c.value:[c.value]).includes(v);return ['eq','in'].includes(c.op)?has:!has;}
    if(c.currency&&c.currency!==context.currency)return false;
    const n=c.field==='rate'?Math.abs(Number(v)):Number(v),threshold=Number(c.value);return {gt:n>threshold,gte:n>=threshold,lt:n<threshold,lte:n<=threshold,eq:n===threshold}[c.op];
  }
  function triggerErrors(t){const x=t.trigger;if(!x||x.mode==='always')return [];if(x.mode!=='conditional')return ['审批触发方式无效'];return [...(!x.conditions?.length?['条件审批须配置触发条件']:[]),...(!x.confirmed||!x.evidence?.trim()?['免审批规则须有已确认的业务依据，当前仅可保存草稿']:[]),...(x.conditions||[]).flatMap(c=>conditionErrors(c,t.scene))];}
  function validate(state,t,excludeId) {
    const errors=[...validateContent(t),...validateRules(state,t),...triggerErrors(t)];
    if(!t.name?.trim())errors.push('请填写模板名称');
    if(!scene(t.scene))errors.push('请选择业务场景');
    if(!t.companies.length)errors.push('请至少选择一家公司');
    if(t.companies.some(id=>!companies.some(c=>c.id===id)))errors.push('适用公司无效');
    if(t.departments.some(id=>!departments.some(d=>d.id===id&&t.companies.includes(d.company))))errors.push('部门不属于适用公司，请重新选择');
    const ds=activeDepartments(t);
    if(!ds.length)errors.push('适用范围内没有有效部门');
    state.templates.filter(r=>r.id!==excludeId&&r.published&&!r.disabled&&r.published.scene===t.scene).forEach(r=>{if(ds.some(d=>activeDepartments(r.published).some(x=>x.id===d.id)))errors.push('适用范围与“'+r.published.name+'”重叠，请调整公司或部门');});
    let approvals=0;
    function checkNodes(nodes,depth=0){
      if(depth>3)errors.push('条件分支最多支持三层，请简化流程');
      nodes.forEach(n=>{
        if(!n.title?.trim())errors.push('请填写节点名称');
        if(n.type==='branch'){
          if(n.branches.length<2||n.branches.filter(b=>b.fallback).length!==1||!n.branches.at(-1)?.fallback)errors.push(n.title+'：必须保留末尾的其他情况分支');
          const signatures=new Set();
          n.branches.forEach(b=>{
            if(!b.title?.trim())errors.push(n.title+'：请填写分支名称');
            if(!b.fallback){if(!b.conditions.length)errors.push(b.title+'：至少配置一个条件');
              b.conditions.forEach(c=>conditionErrors(c,t.scene).forEach(e=>errors.push(b.title+'：'+e)));
              if(b.conditions.length===1&&conditionFields[b.conditions[0].field]?.type==='number'){const c=b.conditions[0],v=Number(c.value);const range={gt:[v,Infinity,false,false],gte:[v,Infinity,true,false],lt:[-Infinity,v,false,false],lte:[-Infinity,v,false,true],eq:[v,v,true,true]}[c.op];
                n.branches.slice(0,n.branches.indexOf(b)).filter(p=>!p.fallback&&p.conditions.length===1).forEach(p=>{const pc=p.conditions[0],pv=Number(pc.value);if(pc.field!==c.field||pc.currency!==c.currency)return;const pr={gt:[pv,Infinity,false,false],gte:[pv,Infinity,true,false],lt:[-Infinity,pv,false,false],lte:[-Infinity,pv,false,true],eq:[pv,pv,true,true]}[pc.op];if(!range||!pr)return;const lo=Math.max(range[0],pr[0]),hi=Math.min(range[1],pr[1]);const contains=(r,x)=> (x>r[0]||(x===r[0]&&r[2]))&&(x<r[1]||(x===r[1]&&r[3]));if(lo<hi||(lo===hi&&contains(range,lo)&&contains(pr,lo)))errors.push(n.title+'：'+p.title+'与'+b.title+'的条件重叠，请明确区间');});
              }
              n.branches.slice(0,n.branches.indexOf(b)).filter(p=>!p.fallback).forEach(p=>{if(conditionSetsOverlap(p,b))errors.push(n.title+'：'+p.title+'与'+b.title+'的条件重叠，请调整业务条件');});
              if(!conditionSetsOverlap(b,b))errors.push(b.title+'：条件互相矛盾，无法命中');
              const signature=JSON.stringify([b.match,b.conditions]);if(signatures.has(signature))errors.push(n.title+'：存在重复条件分支');signatures.add(signature);
            }
            checkNodes(b.nodes,depth+1);
          });
        }else if(['approval','cc'].includes(n.type)){
          if(n.type==='approval')approvals++;
          if(n.source==='duty'&&(!duties.includes(n.duty)||!scopeTypes[n.scopeBasis||'company']||!companyBases[n.companyBasis||'company']))errors.push(n.title+'：审批职责或负责范围无效');
          if(!sources[n.source])errors.push(n.title+'：请选择审批人来源');
          if(n.source==='duty'&&n.scopeBasis&&n.scopeBasis!=='company')for(const company of t.companies){
            const available=state.arrangements.some(a=>a.company===company&&a.duty===n.duty&&arrangementStatus(a)==='有效'&&((a.scopeType||'company')===n.scopeBasis||n.allowCompanyFallback&&(a.scopeType||'company')==='company')&&a.members.some(id=>eligible(state,id,company)));
            if(!available)errors.push(companyName(company)+' / '+n.title+'：请先配置该负责范围内有效的审批人员');
          }
          if(n.source==='business'&&!scene(t.scene).businessOwnerAvailable)errors.push(n.title+'：当前业务场景未提供单据负责人，请改选其他审批人来源');
          if(n.type==='approval'&&!modes[n.mode])errors.push(n.title+'：请选择多人办理方式');
          if(n.hierarchy||n.source==='manager')errors.push(...O.configErrors(n).map(x=>n.title+'：'+x));
          ds.forEach(d=>{if(n.source==='business'||n.source==='manager'||n.hierarchy||(n.source==='duty'&&((n.scopeBasis&&n.scopeBasis!=='company')||(n.companyBasis&&n.companyBasis!=='company'))))return;const r=approvers(state,n,{company:d.company,department:d.id,scene:t.scene,date:'',applicant:''},false,t.rules);r.errors.forEach(e=>errors.push(companyName(d.company)+' / '+d.name+' / '+e));});
        }else errors.push('不支持的节点类型');
      });
    }
    checkNodes(t.nodes);
    if(!approvals)errors.push('流程至少需要一个审批节点');
    // Every reachable path must contain an approval, including fallback branches.
    function minApprovals(nodes){return nodes.reduce((sum,n)=>sum+(n.type==='approval'?1:n.type==='branch'?Math.min(...n.branches.map(b=>minApprovals(b.nodes))):0),0);}
    if(approvals&&minApprovals(t.nodes)<1)errors.push('存在无需审批即可结束的分支，请补充审批节点');
    return [...new Set(errors)];
  }
  function trial(state,t,context) {
    const c={...context,scene:t.scene};const errors=validateRules(state,t);const steps=[];
    if(!validDate(c.date))errors.push('请选择有效的申请日期');
    if(!accepts(t,c))errors.push('本次公司或部门不在模板适用范围内');
    const applicant=person(state,c.applicant);
    if(!applicant?.active||!applicant.companies.includes(c.company)||!O.currentPerson({...state.org||organization,people:state.people},c.applicant,c.company,c.date))errors.push('申请人不在所选公司的有效任职范围内');
    if(t.trigger?.mode==='conditional'){
      errors.push(...triggerErrors(t));const required=t.scene==='订单结算价变更'&&c.settlementChanged==='否'?t.trigger.conditions.filter(x=>x.field==='settlementChanged'):t.trigger.conditions;
      errors.push(...conditionContextErrors(required,c));const currencies=required.filter(x=>x.currency).map(x=>x.currency);if(currencies.length&&!currencies.includes(c.currency))errors.push('触发条件未配置当前币种，请核对后再试跑');
      if(!errors.length){const matched=t.trigger.match==='any'?t.trigger.conditions.some(x=>matchCondition(x,c)):t.trigger.conditions.every(x=>matchCondition(x,c));
        if(!matched){const supplier=t.scene==='订单结算价变更'&&c.settlementChanged==='是';return {errors:[],steps:[{type:'exempt',title:supplier?'无需内部审批，待供应商确认':'本事项免审批',detail:supplier?'由外部合作供应商确认结算价，尚未生效。':t.scene==='订单结算价变更'?'仅免当前事项审批；销售优惠仍须按订单优惠流程办理。':t.scene==='合同收款例外'?'仅免合同收款例外审批；合同首次签约、法务等审核仍按各自流程办理。':'未命中本事项审批条件，其他事项仍按各自流程办理。'}],outcome:supplier?'supplier_pending':'not_required'};}
      }
    }
    const currencies=new Set();
    walk(t.nodes,n=>{if(n.type==='branch')n.branches.forEach(b=>{errors.push(...conditionContextErrors(b.conditions,c));b.conditions.forEach(cond=>{if(['amount','discountAmount'].includes(cond.field))currencies.add(cond.currency);});});});
    if(currencies.size&&!currencies.has(c.currency))errors.push('当前金额分支未配置 '+c.currency+'，请补充对应币种规则');
    if(errors.length)return {errors:[...new Set(errors)],steps};
    function run(nodes){nodes.forEach(n=>{
      if(n.type==='branch'){
        const b=n.branches.find(b=>b.fallback||(b.match==='any'?b.conditions.some(cond=>(cond.field!=='amount'||cond.currency===c.currency)&&matchCondition(cond,c)):b.conditions.every(cond=>(cond.field!=='amount'||cond.currency===c.currency)&&matchCondition(cond,c))));
        if(!b){errors.push(n.title+'：没有可用分支');return;}
        steps.push({type:'branch',title:n.title,detail:b.title+(b.fallback?'': ' · '+b.conditions.map(conditionText).join(b.match==='any'?' 或 ':' 且 '))});run(b.nodes);
      }else{
        let executionNodes=[n];
        if(n.hierarchy||n.source==='manager'){
          const result=O.levels(state.org||organization,n,c);errors.push(...result.errors.map(x=>n.title+'：'+x));
          executionNodes=result.layers.map((layer,i)=>({...n,id:n.id+'::'+i+'::'+layer.key,sourceNodeId:n.id,source:'member',hierarchy:null,members:layer.members,mode:n.hierarchy.within,title:n.title+' / '+layer.name,levelNotice:layer.notice}));
        }
        executionNodes.forEach(executionNode=>{
          const r=approvers(state,executionNode,c,true,t.rules);errors.push(...r.errors);
          steps.push({type:n.type,nodeId:n.id,executionNode:executionNode===n?undefined:executionNode,ids:r.ids,title:executionNode.title,detail:r.ids.map(id=>personName(state,id)).join('、')+(n.type==='approval'?' · '+modes[executionNode.mode]:' · 抄送'),notices:[...(r.basis?['人员依据：'+r.basis]:[]),...r.notices,...(executionNode.levelNotice?[executionNode.levelNotice]:[])],delegated:r.ids.join()!==r.originalIds.join()?'原审批人：'+(r.originalIds.map(id=>personName(state,id)).join('、')||'未找到') :''});
        });
      }
    });}
    run(t.nodes);if(t.scene==='订单结算价变更'&&!errors.length)steps.push({type:'external',title:'外部供应商确认',detail:'内部审批完成后，仍需外部合作供应商确认结算价。'});if(!steps.some(s=>s.type==='approval'))errors.push('本分支没有审批节点');return {errors:[...new Set(errors)],steps};
  }
  function saveDraft(state,id,t){let r=state.templates.find(r=>r.id===id);if(!r){r={id:id||uid(),published:null,draft:null,disabled:false,versions:[]};state.templates.unshift(r);}r.draft=clone(t);return r;}
  function publish(state,id,t){const errors=validate(state,t,id);if(errors.length)return {errors};const r=saveDraft(state,id,t);const version={number:(r.versions.at(-1)?.number||0)+1,at:new Date().toLocaleString('zh-CN'),by:'审批管理员',template:clone(t)};r.versions.push(version);r.published=clone(t);r.draft=null;r.disabled=false;return {errors:[],record:r};}
  function saveArrangement(state,value){const a={scopeType:'company',scopes:[],includeChildren:false,start:'',end:'',disabled:false,...clone(value)},errors=[];
    if(!companies.some(c=>c.id===a.company)||!duties.includes(a.duty))errors.push('请选择公司和审批职责');
    if(!a.members.length)errors.push('请至少选择一位审批人员');
    a.members.forEach(id=>{if(!eligible(state,id,a.company))errors.push('所选人员无本公司有效任职或审批授权');});
    if(!scopeTypes[a.scopeType])errors.push('请选择负责范围');
    if(a.scopeType!=='company'&&(!a.scopes.length||a.scopes.some(id=>a.scopeType==='channel'?!conditionFields.channel.values.includes(id):!scopeDepartments(a.scopeType,a.company).some(d=>d.id===id))))errors.push('请选择本公司的有效负责部门或渠道');
    if((a.start&&!validDate(a.start))||(a.end&&!validDate(a.end))||(a.start&&a.end&&a.start>a.end))errors.push('生效日期和截止日期不正确');
    const overlaps=x=>(x.start||'0000')<=(a.end||'9999')&&(a.start||'0000')<=(x.end||'9999');
    if(!a.disabled&&state.arrangements.some(x=>x.id!==a.id&&!x.disabled&&x.company===a.company&&x.duty===a.duty&&(x.scopeType||'company')===a.scopeType&&overlaps(x)&&(a.scopeType==='company'||a.scopes.some(id=>covers(x,id))||(x.scopes||[]).some(id=>covers(a,id)))))errors.push('该公司已配置此审批职责，负责范围和有效期重叠，请调整或编辑已有安排');
    const i=state.arrangements.findIndex(x=>x.id===a.id);
    if(i>=0&&!a.reason?.trim())errors.push('请填写调整原因');
    if(errors.length)return [...new Set(errors)];
    a.history=[...(i>=0?state.arrangements[i].history||[]:[]),{at:new Date().toLocaleString('zh-CN'),reason:a.reason||'新增安排',members:a.members.slice(),scope:arrangementScope(a),start:a.start,end:a.end,disabled:a.disabled}];
    if(i<0)state.arrangements.unshift({...a,id:uid()});else state.arrangements[i]=a;return [];
  }
  function saveDelegation(state,a){const errors=[];if(!a.reason.trim())errors.push('请填写代办原因');if(!validDate(a.start)||!validDate(a.end)||a.start>a.end)errors.push('请填写正确的生效及结束日期');if(a.original===a.delegate)errors.push('不能将审批代办给本人');[a.original,a.delegate].forEach(id=>{const p=person(state,id);if(!eligible(state,id,a.company))errors.push('原审批人和代办人均须具有本公司有效任职及审批授权');});
    const overlaps=b=>b.company===a.company&&b.start<=a.end&&b.end>=a.start&&(!b.scenes.length||!a.scenes.length||b.scenes.some(s=>a.scenes.includes(s)));
    state.delegations.filter(b=>b.id!==a.id&&overlaps(b)).forEach(b=>{if(b.original===a.original)errors.push('该人员已有重叠期间及事项的代办');if(b.original===a.delegate||b.delegate===a.original)errors.push('暂不支持连续转交或循环代办，请直接指定最终代办人');});
    if(errors.length)return [...new Set(errors)];const i=state.delegations.findIndex(b=>b.id===a.id);const value={...clone(a),id:a.id||uid()};if(i<0)state.delegations.push(value);else state.delegations[i]=value;return [];
  }
  const api={ensureMemberMarketingScenes,memberMarketingRoute,scopeDepartments,scopeChoices,demoPersonnel,conditionSetsOverlap,conditionFields,conditionErrors,conditionContextErrors,scopeTypes,companyBases,arrangementStatus,arrangementScope,resolveDuty,businessSample,ensureBusinessScenes,triggerErrors,matchCondition,ensureReceivableScenes,organization,orgData:O,rulesFor,validateRules,repeatModes,eligible,contentCatalog,defaultContent,getContent,validateContent,previewContent,moveNode,reorderBranches,cloneConditionBranch,clone,uid,companies,departments,duties,sources,modes,scenes,scene,personName,companyName,node,sample,createState,activeDepartments,accepts,walk,getNode,getList,approvers,conditionText,validate,trial,saveDraft,publish,saveArrangement,saveDelegation};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ApprovalConfigModel=api;
})(typeof window==='object'?window:globalThis);
