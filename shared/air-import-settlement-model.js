/* 本批导入核单：明确选单后才预填草稿，不确认财务结果。 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./air-orders-model.js'),require('./air-business-model.js'));
  else root.AirImportSettlement=factory(root.AirOrders,root.AirBusiness);
})(typeof window!=='undefined'?window:globalThis,function(M,B){
  'use strict';
  const copy=M.copy, valid=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Number(v)>=0;
  const key=r=>r.type+'|'+r.ticket+'|'+r.date+'|'+r.flight;
  function batch(data,id,role){
    if(role!=='superadmin'&&role!=='ticket')throw Error('仅票务经办可办理本批核单');
    const b=data.batches.find(x=>x.id===id&&x.company===M.company);
    if(!b)throw Error('导入批次不存在或不在当前公司范围');
    return b;
  }
  function existing(db,id){return db.settlements.filter(s=>s.company===M.company&&s.kind!=='调整'&&s.state!=='已作废'&&s.lines.some(l=>l.orderId===id));}
  function signature(o,db,data){return JSON.stringify([o,db.changes.filter(c=>c.orderId===o.id),M.dailyCosts(data,o).signature]);}
  function review(data,db,id,role='ticket'){
    const b=batch(data,id,role), byOrder=new Map(), exceptions=[];
    for(const result of b.results){
      const r=result.row, tx=data.transactions.find(t=>t.mode!=='票号回填'&&t.key===key(r));
      const orderId=result.order||(['重复跳过','更正已记录'].includes(result.state)?tx?.order:null);
      const o=data.orders.find(o=>o.id===orderId&&o.company===M.company);
      const base={type:r.type,rows:[r.sourceRow],ticket:r.ticket,name:r.name,orderId:o?.id||'',reason:result.error||result.state};
      if(result.state==='未应用'&&tx){
        const later=data.batches.find(x=>x.id===(tx.lastBatch||tx.batch)&&x.company===M.company);
        if(later&&data.batches.indexOf(later)<data.batches.indexOf(b)){
          exceptions.push({...base,state:'后续批次已处理',laterBatch:later.id,reason:'本批未应用记录保留；后续已应用，请核对后续批次结果。'});continue;
        }
      }
      if(r.type!=='出票'){
        const state=result.state==='跳过'?'跳过':o?'退改待办理':/更正/.test(result.error||'')?'更正待确认':/原票/.test(result.error||'')?'原票待匹配':'未应用';
        exceptions.push({...base,state,reason:o?'进入原订单核对退改申请及办理结果；日报金额不直接计入结算。':(result.error||'原票号未唯一匹配'),retry:result.state==='未应用'});continue;
      }
      if(['跳过','未应用'].includes(result.state)||!o){exceptions.push({...base,state:result.state, retry:result.state==='未应用'});continue;}
      if(result.state==='重复跳过'){exceptions.push({...base,state:existing(db,o.id).length?'已入结算':'重复跳过',settlements:existing(db,o.id),reason:'本行已在原导入记录处理，不再计入本批金额。'});continue;}
      if(result.state==='更正已记录'){exceptions.push({...base,state:'更正待核对',settlements:existing(db,o.id),reason:'日报更正已留存，订单报价及原结算保持；请在原单核对差异。'});continue;}
      let item=byOrder.get(o.id);
      if(!item){item={...base,rows:[],tickets:[],order:o,settlements:existing(db,o.id),signature:signature(o,db,data)};byOrder.set(o.id,item);}
      item.rows.push(r.sourceRow);if(!item.tickets.includes(r.ticket))item.tickets.push(r.ticket);
    }
    const candidates=[...byOrder.values()];
    for(const item of candidates){
      const o=item.order, gaps=[],daily=M.dailyCosts(data,o),reviewed=o.importCostReview?.signature===daily.signature;item.daily=daily;item.reviewed=reviewed;item.expectedCost=valid(o.cost)?Number(o.cost):null;item.difference=daily.complete&&valid(o.cost)?M.money(daily.amount-Number(o.cost)):null;item.canReviewCost=daily.amount!==null&&!item.settlements.length;
      if(daily.amount!==null&&!reviewed&&(!daily.complete||item.difference!==0))gaps.push('日报成本待核对');
      if(!o.customer?.trim()||o.customer==='待补结算客户')gaps.push('缺结算客户');
      if(!valid(o.sale))gaps.push('缺客户售价');
      if(!valid(o.cost)&&!reviewed)gaps.push('缺采购成本');
      if(!['CNY','USD','EUR'].includes(o.currency))gaps.push('币种待核对');
      if(!o.tickets.length||o.tickets.some(t=>t.state!=='已出票'||!/^\d{13}$/.test(t.ticket)))gaps.push('票号或出票结果待核对');
      if(['已取消','已作废'].includes(o.state))gaps.push('订单已取消或作废');
      if(db.changes.some(c=>c.orderId===o.id&&!c.effective&&!['已取消','已驳回'].includes(c.state)))gaps.push('退改尚未生效');
      if(M.sourceDemandOpen(o)||o.sourceConditionsPending||o.roster?.pending)gaps.push('供票需求或名单尚未接收');
      if(data.transactions.some(t=>t.order===o.id&&t.row.type!=='出票'))gaps.push('导入退改须从原订单核对结算');
      if(!reviewed&&data.transactions.some(t=>t.order===o.id&&t.mode!=='票号回填'&&t.versions?.length))gaps.push('日报更正须在原单核对');
      // One ticket may cover several segments of one passenger, never two orders/passengers.
      if(o.tickets.some(t=>data.orders.some(x=>x.company===M.company&&x.tickets.some(y=>y.ticket===t.ticket&&(x.id!==o.id||y.personId!==t.personId)))))gaps.push('票号关联多个订单或乘客');
      item.state=item.settlements.length?'已入结算':gaps.includes('缺客户售价')?'缺客户售价':gaps.includes('日报成本待核对')?'成本待核对':gaps.length?'资料待核对':'可核单';
      item.reason=item.settlements.length?'已有结算范围，不能再次生成原结算。':gaps.join('；')||'按订单金额预填，同票多段只计一次。';
      item.eligible=item.state==='可核单';
      item.canComplete=!item.settlements.length&&!!o.importTicket&&['草稿','待确认'].includes(o.state)&&gaps.length>0&&gaps.every(g=>['缺客户售价','缺结算客户'].includes(g));
      item.sale=valid(o.sale)?B.effect(db,o).sale:null;item.cost=reviewed?M.money(o.importCostReview.cost+(B.effect(db,o).cost-Number(o.cost||0))):valid(o.cost)?B.effect(db,o).cost:null;
    }
    return {batch:b,candidates,exceptions};
  }
  function selection(data,db,id,ids,role='ticket',expected={}){
    const view=review(data,db,id,role);
    if(!ids.length)throw Error('请先选择可核单订单');
    const chosen=[...new Set(ids)].map(oid=>{
      const item=view.candidates.find(x=>x.orderId===oid);
      if(!item?.eligible)throw Error((oid||'订单')+' 当前不可核单，请刷新本批结果');
      if(expected[oid]&&expected[oid]!==item.signature)throw Error('订单资料或退改已变化，请刷新核对后重新选择');
      return item;
    });
    const groups=new Map();
    for(const item of chosen){const o=item.order,k=JSON.stringify([o.company,o.customer,o.currency,B.settlementUnit(o)==='团期'?o.group:o.id]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(item);}
    return [...groups.values()].map(items=>({items,customer:items[0].order.customer,currency:items[0].order.currency,group:items[0].order.group||'',unit:B.settlementUnit(items[0].order),sale:M.money(items.reduce((n,x)=>n+x.sale,0)),cost:M.money(items.reduce((n,x)=>n+x.cost,0))}));
  }
  function prepare(data,db,id,ids,role='ticket',expected={}){
    const groups=selection(data,db,id,ids,role,expected), next=copy(db), settlements=[];
    for(const group of groups){
      for(const item of group.items){
        const o=M.withDailyCosts(data,item.order), old=next.orders.findIndex(x=>x.id===o.id);
        // Explicitly read the latest source quote; financial confirmation is still required.
        o.costConfirmed=false;o.costBasis=o.priceBasis||'';o.paid=old>=0?Number(next.orders[old].paid||0):0;
        if(old>=0)next.orders[old]=o;else next.orders.push(o);
      }
      const s=B.createSettlement(next,group.items.map(x=>x.orderId),role);
      s.period='';s.importBatch=id;s.importFile=batch(data,id,role).name;
      s.importRows=group.items.map(x=>({orderId:x.orderId,rows:x.rows,tickets:x.tickets}));
      s.lines.forEach(l=>{const item=group.items.find(x=>x.orderId===l.orderId);l.cost=item.cost;l.dailyCost=copy(item.daily);l.expectedCost=item.expectedCost;l.dailyReviewed=item.reviewed||item.difference===0&&item.daily.complete;l.confirmed=false;if(item.reviewed)l.basis=item.order.importCostReview.basis;});
      s.note='由导入批次 '+id+' 选择预填；结算期间、成本依据及实际款项待核对。';
      settlements.push(s);
    }
    return {db:next,settlements};
  }
  function completeMissing(data,db,id,orderId,values,role='ticket'){
    const item=review(data,db,id,role).candidates.find(x=>x.orderId===orderId);
    if(!item?.canComplete)throw Error('当前订单不能在本批补齐，请返回原订单核对');
    const o=item.order, customer=String(values.customer||'').trim(), reason=String(values.reason||'').trim();
    if(!customer||customer==='待补结算客户'||!valid(values.sale)||!reason)throw Error('请补齐结算客户、非负销售价和报价依据');
    if(o.customer&&o.customer!=='待补结算客户'&&customer!==o.customer)throw Error('已有客户不能在补齐资料中变更');
    if(valid(o.sale)&&Number(values.sale)!==Number(o.sale))throw Error('已有销售价不能在补齐资料中变更');
    const next=copy(data), target=next.orders.find(x=>x.id===orderId);
    target.customer=customer;target.sale=M.money(values.sale);target.priceBasis=reason;
    target.history.unshift({text:'导入核单补齐客户及售价：'+customer+' / '+target.sale+' '+o.currency,time:new Date().toLocaleString('zh-CN'),who:'孙丽 · 票务经办',basis:reason,changes:[{label:'结算客户',before:o.customer,after:customer},{label:'销售价',before:o.sale,after:target.sale}]});
    return next;
  }
  function confirmCost(data,db,id,orderId,values,role='ticket'){
    const item=review(data,db,id,role).candidates.find(x=>x.orderId===orderId);
    if(!item?.canReviewCost)throw Error('当前订单不能核对日报成本');
    if(values.signature!==item.daily.signature)throw Error('日报或订单资料已变化，请重新核对成本');
    if(!valid(values.cost)||!String(values.basis||'').trim())throw Error('请填写整单采购成本及核对依据');
    const next=copy(data),o=next.orders.find(x=>x.id===orderId);
    o.importCostReview={signature:item.daily.signature,cost:M.money(values.cost),basis:String(values.basis).trim(),time:new Date().toLocaleString('zh-CN')};
    M.log(o,'核对日报采购成本 '+o.importCostReview.cost+'；原预计成本 '+o.cost+' 保留',role,{basis:o.importCostReview.basis});
    return next;
  }
  return {review,selection,prepare,completeMissing,confirmCost};
});
