(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OrderAmendmentModel=api;})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  var catalog={
    '参团游':['团费','单房差','升舱差价','签证','签证VIP','联运费','保险','服务费','补差'],
    '邮轮':['船票款','港务费','升舱差价','岸上项目','签证VIP','联运费','保险','补差'],
    '专列':['铺位款','包厢差价','联运费','保险/服务费','补差'],
    '自由行':['套餐款','酒店','机票','接送机','当地玩乐','签证VIP','补差'],
    '单项服务':['服务费','签证VIP','代垫费','材料费','快递费','补差'],
    '研学':['营费','单房差','材料费','保险费','活动增项','补差'],
    '单团项目':['项目团费','会务服务费','交通差价','住宿差价','活动增项','补差']
  };
  function items(type){return (catalog[type]||catalog['参团游']).slice();}
  function commonItems(types){return items(types[0]).filter(function(item){return types.every(function(type){return items(type).indexOf(item)>=0;});});}
  function needsResource(item){return ['单房差','升舱差价','签证VIP','联运费','包厢差价','酒店','机票','接送机','当地玩乐','交通差价','住宿差价','岸上项目','活动增项'].indexOf(item)>=0;}
  function money(n){return '¥'+Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});}
  var seq=0;
  function isEffective(status){return ['已确认','待出团','出行中','已出团','已完成','已回团'].includes(status);}
  function originalItems(type,total,groups){
    var rows=[];
    (groups||[]).forEach(function(g){(g.lines||[]).forEach(function(l){if(Number(l.amount)>0)rows.push({id:'line-'+rows.length,item:items(type).includes(l.label)?l.label:items(type)[0],label:[g.title,l.label].filter(Boolean).join(' / '),quantity:Number(l.quantity)||1,price:Number(l.price),amount:Number(l.amount),unit:'项'});});});
    return rows.length?rows:[{id:'initial',item:items(type)[0],label:items(type)[0],quantity:1,price:Number(total),amount:Number(total),unit:'项'}];
  }
  function create(input,records){
    var x=Object.assign({},input),q=Number(x.quantity),p=Number(x.price);
    if(x.orderStatus&&!isEffective(x.orderStatus)&&!(['预留','占位','待确认'].includes(x.orderStatus)&&x.direction==='新增项目'&&['免费','待报价'].includes(x.priceMode)))throw Error('订单尚未确认，应收未生成；请先完成订单报价及确认。免费或待报价服务可从服务变更登记。');
    if(x.direction==='修改原项目'){
      var before=(x.originalItems||[]).find(function(i){return i.id===x.originalItemId;});
      if(!before)throw Error('请选择原应收项目。');
      x.before=Object.assign({},before);x.item=before.item;
      if(x.priceMode==='待报价')throw Error('修改原应收项目须明确调整后金额。');
    }
    if(!x.orderNo||items(x.type).indexOf(x.item)<0)throw Error('当前订单不适用此业务款项。');
    if(!Number.isInteger(q)||q<1||q>9999)throw Error('数量须为1至9999的整数。');
    if(!['收费','免费','待报价'].includes(x.priceMode))throw Error('请选择收费、免费或待报价。');
    if(x.priceMode==='收费'&&(!String(x.price).trim()||!Number.isFinite(p)||p<=0||p>100000000||Math.abs(p*100-Math.round(p*100))>0.00001))throw Error('收费单价须大于0，最多保留两位小数。');
    x.resource=needsResource(x.item)||!!x.resource||x.priceMode!=='收费';
    x.reason=String(x.reason||'').trim();x.request=String(x.request||'').trim();x.traveler=String(x.traveler||'').trim();
    if(!x.reason)throw Error('请填写调整原因及客户确认依据。');
    if(x.resource&&(!x.traveler||!x.request||!x.operator))throw Error('请填写涉及游客、服务安排及负责计调。');
    if(x.direction==='减免应收'&&x.priceMode!=='收费')throw Error('减免应收须填写本次减免金额，免费服务请使用新增项目。');
    if(!['新增项目','减免应收','修改原项目'].includes(x.direction))throw Error('请选择调整方向。');
    x.quantity=q;x.price=x.priceMode==='待报价'?null:x.priceMode==='免费'?0:p;
    x.delta=x.price===null?null:Math.round(q*x.price*100)*(x.direction==='减免应收'?-1:1)/100;
    if(x.before){x.delta=Math.round((q*x.price-x.before.amount)*100)/100;if(x.delta===0)throw Error('应收金额未变化；仅调整服务安排请从服务变更登记。');}
    if(x.delta!==null&&x.delta<0&&Number.isFinite(Number(x.originalAmount))&&Number(x.originalAmount)+x.delta<0)throw Error('减免金额不能超过原订单应收。');
    x.fingerprint=JSON.stringify([x.orderNo,x.item,x.direction,x.originalItemId,q,x.price,x.traveler,x.request,x.reason]);
    if((records||[]).some(function(r){return r.fingerprint===x.fingerprint&&r.status!=='已撤回';}))throw Error('相同申请已存在，请查看申请记录，勿重复提交。');
    var serial=Date.now().toString()+String(++seq).padStart(3,'0');
    x.no=(x.resource?'FW':'TZ')+serial;x.adjustmentNo=x.delta?'TZ'+serial:'—';
    x.resourceStatus=x.resource?'待计调确认':'无需确认';
    x.approvalStatus=x.delta===0?'无需应收审批':x.delta===null?'待报价':x.resource?'待资源确认':'待配置业务审批';
    x.status=x.resource?'待计调确认':'待配置业务审批';x.finance=x.delta?'未生效':x.delta===null?'待报价':'无需调整应收';
    x.createdAt=new Date().toLocaleString('zh-CN',{hour12:false});x.applicant='王芳';
    return x;
  }
  function decide(record,decision,account,opinion){
    if(record.approvalStatus!=='待业务审批'||record.applied)throw Error('申请不在可审批状态。');
    if(record.resource&&record.resourceStatus!=='已确认')throw Error('请先完成计调确认。');
    if(!['通过','退回','驳回'].includes(decision))throw Error('审批结果无效。');
    if(decision!=='通过'&&!String(opinion||'').trim())throw Error('请填写退回或驳回原因。');
    var next=Object.assign({},account),r=Object.assign({},record);
    if(decision==='通过'){
      if(record.delta===null||!Number.isFinite(record.delta)||Number(account.amount)!==Number(record.originalAmount))throw Error('已生效应收发生变化，请退回申请，按最新金额重提。');
      if(account.amount+record.delta<0)throw Error('累计减免不能超过已生效应收。');
      next.amount=Math.round((account.amount+record.delta)*100)/100;next.received=account.received;
      next.pending=Math.max(0,Math.round((next.amount-next.received)*100)/100);next.overpaid=Math.max(0,Math.round((next.received-next.amount)*100)/100);
      r.applied=true;r.status='已生效';r.approvalStatus='已通过';r.finance='业务审批通过，自动生效';r.effectiveAmount=next.amount;
    }else{r.status=decision==='退回'?'已退回':'已驳回';r.approvalStatus=r.status;r.finance='未生效';}
    r.opinion=String(opinion||'').trim();r.decidedAt=new Date().toLocaleString('zh-CN',{hour12:false});
    return {record:r,account:next};
  }
  function confirmService(item,result,amount,basis,note){
    if(item.result&&item.result!=='待确认')throw Error('本申请已处理，请查看确认记录。');
    if(!['可供','不可供','需补差'].includes(result)||!String(basis||'').trim())throw Error('请选择供给结果并填写确认依据。');
    if(result==='需补差'&&(!Number.isFinite(Number(amount))||Number(amount)<=0||Math.abs(Number(amount)*100-Math.round(Number(amount)*100))>0.00001))throw Error('请填写大于0且最多两位小数的补差金额。');
    if(result==='不可供'&&!String(note||'').trim())throw Error('请填写不可供原因或替代建议。');
    return Object.assign({},item,{result:result==='需补差'?'待销售确认':result,amount:result==='需补差'?Number(amount):0,basis:String(basis).trim(),note:String(note||'').trim(),confirmedBy:'计调张敏',confirmedAt:new Date().toLocaleString('zh-CN',{hour12:false})});
  }
  function allocate(total,weights){
    var cents=Math.round(total*100),sum=weights.reduce(function(a,b){return a+b;},0);
    if(!Number.isFinite(cents)||cents<=0||!weights.length||weights.some(function(w){return !Number.isFinite(w)||w<0;})||sum<=0)throw Error('分摊金额及订单金额须有效。');
    var used=0;return weights.map(function(w,i){var v=i===weights.length-1?cents-used:Math.floor(cents*w/sum);used+=v;return v/100;});
  }
  return {items:items,commonItems:commonItems,needsResource:needsResource,create:create,confirmService:confirmService,allocate:allocate,money:money,isEffective:isEffective,originalItems:originalItems,decide:decide};
});
