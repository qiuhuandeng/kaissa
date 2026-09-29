(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  // Directory identifiers were observed in the platform UI, not verified API identifiers.
  const profiles = [
    {id:'mice',name:'企业旅游服务合同',code:'',business:['MICE'],ranges:['境内','出境'],category:'企业自有',province:'全国',qualification:'按旅游范围',observed:false,groups:['enterprise','project','projectFees','projectChange','force','breach','dispute','other'],custom:true},
    {id:'outbound',name:'全国版出境旅游合同',code:'GF-2014-2402',business:['参团游','专列','自由行'],ranges:['出境'],category:'全国示范',province:'全国',qualification:'出境旅游',observed:false,groups:['trip','fees','people','insurance','formation','cancellation','force','breach','dispute','other','shopping']},
    {id:'domestic',name:'全国版境内旅游合同',code:'GF-2014-2401',business:['参团游','专列','自由行'],ranges:['境内'],category:'全国示范',province:'全国',qualification:'境内旅游',observed:true,groups:['trip','fees','people','insurance','formation','cancellation','force','breach','dispute','other','shopping']},
    {id:'taiwan',name:'大陆居民赴台湾地区旅游合同',code:'GF-2014-2403',business:['参团游','自由行'],ranges:['赴台'],category:'全国示范',province:'全国',qualification:'赴台旅游',observed:false,groups:['trip','fees','people','insurance','formation','cancellation','force','breach','dispute','other','shopping']},
    {id:'day',name:'全国版国内一日游合同',code:'GF-2014-2404',business:['参团游'],ranges:['境内'],category:'全国示范',province:'全国',qualification:'境内旅游',observed:true,groups:['dayTrip','fees','people','cancellation','force','breach','dispute','other','shopping']},
    {id:'cruise',name:'上海邮轮游合同',code:'EL335TQZTJ94',business:['邮轮'],ranges:['境内','出境'],category:'省级示范',province:'上海',qualification:'按旅游范围',observed:true,groups:['cruiseTrip','fees','people','insurance','cruiseInsurance','formation','cancellation','cruiseForce','breach','dispute','other','shopping']},
    {id:'study',name:'研学旅游合同',code:'GF-2026-2619',business:['研学'],ranges:['境内','出境'],category:'全国示范',province:'全国',qualification:'按旅游范围',observed:true,groups:['studyTrip','studyFees','people','insurance','studyFormation','cancellation','force','breach','dispute','other']},
    {id:'zhejiang',name:'浙江省一日游合同',code:'EL84XGL8ZI1OO',business:['参团游'],ranges:['境内'],category:'省级示范',province:'浙江',qualification:'境内旅游',observed:true,groups:['dayTrip','fees','people','zjInsurance','pooling','cancellation','force','breach','dispute','other','shopping']},
    {id:'agency',name:'代订代办合同',code:'EL84XGL8ZI126',business:['单项服务','自由行'],ranges:['境内','出境','赴台'],category:'推荐文本',province:'全国',qualification:'按旅游范围',observed:true,groups:['services','fees','people','serviceChange','force','breach','dispute','other']},
    {id:'provincial',name:'其他省级旅游示范合同',code:'',business:['参团游','邮轮','研学','自由行','专列'],ranges:['境内','出境'],category:'省级示范',province:'',qualification:'按旅游范围',observed:false,groups:['trip','fees','people','insurance','formation','cancellation','force','breach','dispute','other'],custom:true}
  ];
  // Each line is business content, source owner, condition, and whether a contract may fill it.
  const groups = {
    enterprise:['签约企业及授权代表',[['企业名称、信用代码、地址及联系人','订单','必填'],['授权代表及授权书','合同经办人','必填']]],
    project:['项目服务',[['项目名称、活动日程及服务范围','产品方案','必填'],['服务日期、地点及参加人数','订单','必填'],['交通、住宿、会议及活动服务标准','产品方案','按项目服务范围']]],
    projectFees:['项目费用与付款',[['项目报价及费用包含、不含','订单','必填'],['合同总额及分期付款安排','订单','必填'],['发票抬头及开票约定','订单','按本次约定']]],
    projectChange:['项目变更及取消',[['人数、服务范围变更及取消费用约定','法务模板','按获准文本'],['本次变更与取消的特别约定','合同经办人','有特别约定时填写']]],
    trip:['行程与服务',[['每日行程及交通餐住','产品方案','必填'],['出发返回时间、团号、天数及夜数','团期','必填'],['组团、委托及接待旅行社名称与联系方式','团期','有委托或接待时必填']]],
    dayTrip:['一日游行程',[['上下午行程及餐饮标准','产品方案','必填'],['出发返回时间地点、车型座位、车牌及驾驶员','团期','按模板要求核对'],['导游姓名、证号、联系方式','团期','提供导游时必填']]],
    cruiseTrip:['邮轮服务',[['船舶、舱等标准、船上餐饮及岸上餐住','产品方案','必填'],['登离船港口、停靠港及岸上游览时长','产品方案','必填'],['航次日期、实际组织接待旅行社','团期','必填'],['本单所选舱房标准与人数','订单','必填']]],
    studyTrip:['研学课程',[['课程、课时、场所及每日活动时长','产品方案','必填'],['导师、背景及辅导服务','产品方案','必填'],['交通餐住及安全安排','产品方案','必填'],['本营期日期及实际安排','团期','必填']]],
    fees:['费用与付款',[['费用包含、不含及服务费说明','产品方案','必填'],['成人儿童费用、导游费及合同总额','订单','按本单费用构成'],['付款方式、约定日期及支付说明','订单','必填']]],
    studyFees:['研学费用',[['研学课程费与旅行服务费分类','产品方案','必填'],['交通、餐饮、住宿、导师、课程等成交费用','订单','按本单费用构成'],['付款约定与合同总额','订单','必填']]],
    people:['代表、游客与签署',[['单位或个人代表、是否参团、联系方式','合同经办人','必填'],['游客证件、出生日期、健康及分房需求','订单','按人员及模板要求'],['必要签署人及代表、监护或委托材料','合同经办人','有代表、未成年人或代签时必填']]],
    insurance:['旅游意外保险',[['推荐保险公司、产品及保障计划','产品方案','提供保险时必填'],['委托购买、自行购买或不购买','客户确认','签约时选择'],['本次保险名称、保费及被保险人','合同经办人','委托购买时必填']]],
    cruiseInsurance:['邮轮意外保险',[['邮轮保险公司、产品与保障计划','产品方案','提供邮轮保险时必填'],['邮轮保险选择、保险公司及保费','客户确认','与普通意外险分别确认']]],
    zjInsurance:['一日游保险',[['保险产品、保障计划及保额','产品方案','必填'],['投保人数、每人保费、总保费','合同经办人','按本单投保安排']]],
    formation:['成团与不成团',[['成团说明及可提供替代安排','产品方案','必填'],['最低成团人数或不受人数限制、通知安排','团期','按模板要求核对'],['转社及旅行社、延期、改线、解除逐项选择','客户确认','不成团约定逐项确认'],['拼团选择及实际旅行社','客户确认','存在拼团时必填']]],
    studyFormation:['研学成团约定',[['成团说明及可提供替代安排','产品方案','必填'],['最低成团人数与通知安排','团期','必填'],['延期、改线、解除分别选择','客户确认','逐项确认']]],
    pooling:['拼团与转团',[['拼团或转团安排','产品方案','有安排时填写'],['本单同意结果及旅行社名称','客户确认','有安排时必填']]],
    cancellation:['甲方解除与必要费用',[['退改阶梯及必要费用依据','产品方案','必填'],['解除费用条款、旅途中解除计算及退款期限','法务模板','固定正文及获准参数'],['本次解除费用及与产品退改差异','合同经办人','存在差异时送审']]],
    force:['责任减免与不可抗力',[['责任减免、不可抗力处理条款','法务模板','固定正文']]],
    cruiseForce:['邮轮不可抗力处理',[['出发前与旅途中变更港口、延误及解除处理','法务模板','固定正文'],['未停靠港口退费、额外费用及承担比例','法务模板','获准参数']]],
    breach:['违约责任',[['游客与旅行社违约责任、赔偿及退款期限','法务模板','固定正文及获准参数']]],
    dispute:['争议解决',[['可采用的争议解决方式','法务模板','诉讼、仲裁按名称保存'],['本次诉讼或仲裁及机构','客户确认','选择后机构必填'],['投诉电话、地区、地址及邮箱','签约公司','按模板要求核对']]],
    other:['其他约定与材料',[['本产品专项约定','产品方案','可选'],['本次补充约定及合同份数','合同经办人','按模板要求核对'],['行程、费用和通用附件','合同经办人','按模板适用；授权材料单列']]],
    shopping:['购物与自费',[['购物、自费清单及每项时长','产品方案','无安排须明确选择无'],['实际日期、地点、费用及确认结果','合同经办人','有安排时必填']]],
    services:['代订代办服务',[['机票、酒店、用车、导游、签证、其他服务规格','产品方案','仅选中服务必填'],['本单服务日期、数量及成交费用','订单','仅选中服务必填'],['护照有效期及所需人员材料','订单','按服务要求核对']]],
    serviceChange:['服务变更及责任',[['所选服务退改及办理条件','产品方案','仅选中服务必填'],['代办责任、变更约定及声明','法务模板','按所选服务采用']]]
  };
  const get = id => profiles.find(p => p.id === id);
  function fields(id) {
    const p=get(id); if(!p)return [];
    return p.groups.flatMap(key=>groups[key][1].map((r,i)=>({id:key+'-'+i,group:groups[key][0],name:r[0],owner:r[1],condition:r[2],editable:!['法务模板','签约公司','订单','团期'].includes(r[1]),value:''})));
  }
  function qualification(p,range){return p.qualification==='按旅游范围'?({'境内':'境内旅游','出境':'出境旅游','赴台':'赴台旅游'}[range]||''):p.qualification;}
  function applicable(p,context) {
    const errors=[];
    if(!p)return ['请选择合同文本'];
    if(!p.business.includes(context.business))errors.push('合同与产品业务类型不适用');
    if(!p.ranges.includes(context.range))errors.push('合同与旅游范围不适用');
    if(p.category==='省级示范'&&(!context.province || (p.province&&p.province!==context.province)))errors.push('省级合同需核对适用省份');
    if(['day','zhejiang'].includes(p.id)&&context.days&&Number(context.days)!==1)errors.push('一日游合同仅适用一天行程');
    if(context.serviceMode==='代订代办'&&p.id!=='agency')errors.push('代订代办须选服务合同');
    if(context.serviceMode==='包价旅游'&&p.id==='agency')errors.push('包价旅游不能选代订代办合同');
    if(context.qualifications&&!context.qualifications.includes(qualification(p,context.range)))errors.push('签约公司未具备相应经营资格');
    return errors;
  }
  function contentIssues(t) {
    let p=get(t.profile);if(t.textSource==='custom'&&p)p={...p,category:'企业自有',province:'全国',business:[t.business]};if(!p)return ['请选择合同文本'];
    const out=applicable(p,{business:t.business,range:t.range,province:t.province,serviceMode:t.serviceMode});
    if(t.category!==p.category)out.push('示范文本类别与所选合同不一致');
    if(p.category==='省级示范'&&p.custom&&(!t.directoryName||!t.province))out.push('其他省级合同须填写正式名称及适用省份');
    if(!t.textReference?.trim())out.push('请填写标准正文文件名称及版本');
    if(!t.disputeOptions?.length)out.push('请至少保留一种争议解决方式');
    if((t.content||[]).some(f=>f.owner==='客户确认'&&f.value))out.push('客户同意及选择不能预填为已确认');
    return [...new Set(out)];
  }
  root.ContractCatalog={profiles,groups,get,fields,qualification,applicable,contentIssues,clone};
  if(typeof module!=='undefined')module.exports=root.ContractCatalog;
})(typeof window==='undefined'?globalThis:window);
