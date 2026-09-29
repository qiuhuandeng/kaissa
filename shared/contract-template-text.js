(function(root){
  'use strict';
  // Prototype text only. These samples are not the platform's approved standard text.
  const common = {
    fees:['费用与付款','本次合同总额为人民币【合同总额】元。费用包含【费用包含】，不包含【费用不含】；付款方式及各期付款日期、金额为【付款安排】。另行增加的服务须经双方确认。'],
    insurance:['旅游意外保险','旅游意外保险由甲方在签约时选择【保险购买方式】。委托购买时，双方确认【保险产品及保障计划】、【被保险人及保费】；购买意愿与实际出单结果分别核对。'],
    formation:['成团与不成团约定','本次行程的最低成团人数及通知安排为【成团人数与通知安排】。不能成团时，甲方对转团、延期、改线及解除分别作出【不成团处理选择】；涉及其他旅行社的，须明确【实际旅行社名称】。'],
    cancel:['变更、解除与必要费用','变更或解除的申请、确认方式及费用依据按【变更与解除约定】办理。需要扣除必要费用时，应列明项目、金额及依据；退款期限为【退款期限】。双方确认的变更作为本合同附件保存。'],
    force:['责任减免与不可抗力','发生不可抗力或其他影响履行的情形时，双方及时告知并核对影响范围，采取必要措施保障人员安全、减少损失。继续履行、变更或解除及有关费用的承担按【责任减免及不可抗力约定】办理。'],
    breach:['违约责任','双方按照合同约定履行义务。服务未按约提供、迟延履行或其他违约情形的处理、赔偿及期限，以【违约责任条款】为依据；处理过程及已达成的约定留存书面记录。'],
    dispute:['争议解决','双方发生争议先协商解决；协商不成，按本合同选定的【争议解决方式】向【法院或仲裁机构】提出。签约时只选定一种处理方式，并填写具体机构名称。'],
    ending:['附件及签署','【行程或服务明细】、【费用明细】及双方确认的其他附件为本合同组成部分。其他约定：【补充约定】。\n甲方签署：【甲方签署】\n乙方签署：【乙方签署】\n签约日期：【签约日期】']
  };
  function sections(t){
    const id=t.profile;
    const rows=id==='mice'?[
      ['合同当事人','甲方（委托企业）：【企业名称】\n统一社会信用代码：【企业信用代码】\n联系地址：【企业地址】\n授权代表：【授权代表】　联系电话：【企业联系电话】\n乙方（服务旅行社）：【签约公司】\n旅行社许可证号：【旅行社许可证号】　联系电话：【旅行社电话】'],
      ['项目与服务范围','甲方委托乙方安排【项目名称】，服务日期为【服务日期】，服务地点为【服务地点】，参加人数为【参加人数】。双方确认的日程、交通、住宿、会议及活动服务列入【服务明细】。未列入服务范围的事项，另行书面确认。'],
      common.fees,
      ['双方协作与企业授权','甲方指定【项目联系人】对接项目安排，并提供参加人员资料和服务需求。授权代表依据【企业授权书】签署本合同；授权范围外的调整需另行确认。乙方按确认的日程与服务标准组织实施，双方按【服务验收约定】核对服务结果。'],
      ['项目调整与取消','参加人数、服务日期或服务范围发生变化时，双方依据【项目调整与取消约定】确认调整内容、费用及办理期限。未经确认的新增费用不直接并入原合同总额。'],
      ['发票与付款资料','甲方开票名称及税号为【开票信息】，发票内容、金额及开具时间按【开票约定】办理。收款信息以乙方确认的公司账户资料为准。'],
      common.force,common.breach,common.dispute,common.ending
    ]:[
      ['合同当事人','甲方（游客或代表）：【游客或代表姓名】　联系电话：【联系电话】\n本合同覆盖游客及签署关系见【游客名单及授权材料】。\n乙方（旅行社）：【签约公司】\n旅行社许可证号：【旅行社许可证号】　联系电话：【旅行社电话】'],
      id==='cruise'?['邮轮行程与服务','甲方参加【邮轮名称与航次】，登船港口、离船港口及日期为【登离船安排】。舱房等级、船上餐饮、停靠港口、岸上游览及服务标准列入【邮轮行程与服务标准】，本单舱房及人数为【舱房与人数】。']:
      id==='study'?['研学课程与服务','本次研学为【研学项目名称】，日期及地点为【服务日期与地点】。课程内容、课时、导师、每日活动、安全及交通餐住安排见【研学课程与服务标准】。课程费与旅行服务费分别列入【研学费用明细】。']:
      id==='agency'?['代订代办服务','甲方委托乙方办理【服务项目】，服务日期、数量、规格及交付内容为【代订代办服务明细】。甲方需按【材料与办理期限】提供资料，各项服务的办理条件及退改规则为【服务办理及退改规则】。']:
      ['行程与服务','甲方参加【线路名称】，出发及返回日期为【出发返回日期】，共【天数】天。交通、住宿、餐饮、游览及服务标准见【行程单】；集合时间、地点及实际组织接待安排为【集合与接待安排】。'],
      common.fees,
      ...(['agency','day','zhejiang'].includes(id)?[]:[common.insurance]),
      ...(id==='zhejiang'?[['一日游保险','本次保险产品及保障额度为【一日游保险产品及保额】，投保人数、每人保费及总保费为【一日游投保人数及保费】。']]:[]),
      ...(id==='cruise'?[['邮轮保险','邮轮专项保险另行确认【邮轮保险购买方式】、【邮轮保险产品及保费】，与普通旅游意外保险分别记录。']]:[]),
      ...(['agency','day','zhejiang'].includes(id)?[]:[common.formation]),
      ...(['day','zhejiang'].includes(id)?[['一日游与拼团安排','本次上下午行程、交通及导游安排为【一日游安排】；存在拼团或转团时，双方另行确认【拼团转团约定及旅行社】。']]:[]),
      common.cancel,common.force,
      ...(id==='cruise'?[['航次及港口变更','航次取消、延误或停靠港变化时，通知方式、退费以及额外费用承担按【航次与港口变更约定】处理。']]:[]),
      common.breach,common.dispute,
      ...(['study','agency'].includes(id)?[]:[['购物与自费','本次购物与自费安排为【购物与自费选择】。有安排时，逐项列明地点、内容、费用、时长及双方确认结果；无安排时明确填写无。']]),
      common.ending
    ];
    return rows;
  }
  function body(t){return t.bodyText!==undefined?t.bodyText:sections(t).map(([title,content],i)=>`${i+1}、${title}\n${content}`).join('\n\n');}
  function plain(t){return `${t.name}　${t.version}\n原型示例正文\n\n${root.ContractTemplateFields?root.ContractTemplateFields.labelledBody(t):body(t)}${t.clauses?'\n\n通用补充约定\n'+t.clauses:''}\n\n签约附件：${t.attachments.join('、')}${t.conditional?'\n条件附件：'+t.conditional:''}`;}
  function html(t,escape){
    const text=root.ContractTemplateFields?root.ContractTemplateFields.markup(t):escape(body(t)).replace(/【([^】]+)】/g,'<mark class="cs-text-slot">【$1】</mark>');
    return `<article class="cs-template-paper"><h2>${escape(t.name||'合同正文')}</h2><p class="cs-text-caption">原型示例正文 · 高亮位置在签约时填写</p><div class="cs-text-body">${text}</div></article>`;
  }
  function issues(t){
    const out=[];if(!body(t).trim())out.push('请填写合同正文');
    if(t.profile==='mice')for(const field of ['企业名称','授权代表','服务明细','合同总额','付款安排'])if(!(root.ContractTemplateFields?root.ContractTemplateFields.names(t).includes(field):body(t).includes('【'+field+'】')))out.push('正文缺少签约填写位置：'+field);
    return out;
  }
  root.ContractTemplateText={body,plain,html,issues};
  if(typeof module!=='undefined')module.exports=root.ContractTemplateText;
})(typeof window==='undefined'?globalThis:window);
