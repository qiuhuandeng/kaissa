/* 项目请款仍引用原采购；子团分配不另造应付，申请不增加实付。 */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.MicePaymentModel=api;})(typeof window==='object'?window:this,function(){
  'use strict';
  const round=n=>Math.round((Number(n)||0)*100)/100;
  const sum=rows=>round(rows.reduce((n,r)=>n+Number(r.amount||0),0));
  const live=r=>!['已撤回','已退回','已作废'].includes(r.status);
  function balance(c,requests){
    const pending=sum(requests.filter(r=>r.costId===c.id&&live(r)&&r.status!=='草稿').map(r=>({amount:Math.max(0,r.amount-(r.paid||0))})));
    return c.status!=='已确认'||c.conditionLimit==null?0:Math.max(0,round(Math.min(Number(c.amount||0)+Number(c.paymentReduction||0),Number(c.conditionLimit))-Number(c.paid||0)-Number(c.offset||0)-pending));
  }
  function lines(c,requests,activities){
    const available=balance(c,requests),draft=requests.find(r=>r.costId===c.id&&r.status==='草稿');
    let shares=c.activityId?[{activityId:c.activityId,amount:c.amount}]:c.scopeType==='shared'?(c.allocations||[]).map(r=>({activityId:r.activityId,amount:r.amount})):[];
    const remainder=round(c.amount-sum(shares));
    if(!shares.length||remainder>0)shares.push({activityId:'',amount:shares.length?remainder:c.amount});
    // 历史申请没有分团记录时只扣原采购余额，不补造各团的历史付款。
    const capacities=shares.map(s=>Math.max(0,round(s.amount-sum(requests.filter(r=>r.costId===c.id&&live(r)&&r.status!=='草稿').flatMap(r=>r.allocations||[]).filter(r=>r.activityId===s.activityId)))));
    let left=available;
    return shares.map((s,i)=>{
      const a=activities.find(a=>a.id===s.activityId),cap=Math.min(capacities[i],available),last=i===shares.length-1;
      const suggested=Math.min(cap,last?left:round(available*capacities[i]/(capacities.reduce((x,y)=>x+y,0)||1)));left=round(left-suggested);
      const saved=draft?.allocations?.find(r=>r.activityId===s.activityId);
      return {costId:c.id,activityId:s.activityId,lineId:c.id+'::'+s.activityId,scheduleNo:s.activityId||'项目公共费用',route:a?.name||(c.scopeType==='shared'?'跨团采购未分配部分':'项目公共费用'),fee:c.name,amount:s.amount,available:cap,suggested:draft?(saved?.amount||0):suggested,remark:saved?.remark||'',conditionMissing:c.conditionLimit==null};
    });
  }
  function validate(costs,requests,activities,items){
    if(!items.length)return '请选择需要请款的费用并填写金额';
    const seen=new Set();
    for(const item of items){
      const c=costs.find(c=>c.id===item.costId),line=c&&lines(c,requests,activities).find(r=>r.lineId===item.lineId);
      if(!line||seen.has(item.lineId))return '费用或项目团已变化，请重新打开请款';seen.add(item.lineId);
      if(line.conditionMissing)return c.name+'：付款条件待核对';
      if(!Number.isFinite(item.requestAmount)||item.requestAmount<=0||item.requestAmount>line.available+.001)return c.name+'：本次金额超过该行可申请金额';
    }
    for(const c of costs){const selected=items.filter(r=>r.costId===c.id);if(selected.length&&sum(selected.map(r=>({amount:r.requestAmount})))>balance(c,requests)+.001)return c.name+'：各子团申请合计超过原采购可申请余额';}
    return '';
  }
  return {round,sum,balance,lines,validate};
});
