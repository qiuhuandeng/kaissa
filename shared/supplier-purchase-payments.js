/* 供应商采购详情的只读预付款；独立示例，不写入对账或财务会话。 */
(function(root){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  const vendor='北京国旅地接部';
  const rows=[
    {purchase:'CG-C07',company:'福建凯撒',supplier:vendor,agreement:'AGR-GL-FJ-013',currency:'CNY',order:'KS20260916007',tour:'JP20260916007',basis:'采购确认-C07；预付款安排YFAP-C07',
      nodes:[{id:'YF-C07-1',name:'订金',date:'2026-09-17',amount:6000,condition:'采购确认后支付',missing:[]},{id:'YF-C07-2',name:'行前第一笔',date:'2026-09-20',amount:3000,condition:'行前服务安排确认后支付',missing:[]},{id:'YF-C07-3',name:'行前第二笔',date:'2026-09-22',amount:3000,condition:'补齐收款资料后支付',missing:['收款账户证明（供应商补充，交福建凯撒计调）']}],
      records:[{id:'FK-YF-C07-1',node:'YF-C07-1',amount:6000,state:'付款成功',date:'2026-09-17',reference:'回单HD-C07-1',note:'福建凯撒已登记实际付款'},{id:'FK-YF-C07-2',node:'YF-C07-2',amount:3000,state:'付款中',date:'2026-09-20',reference:'尚无成功付款回单',note:'福建凯撒资金岗核对付款结果'}]},
    {purchase:'CG-C06',company:'北京凯撒',supplier:vendor,agreement:'AGR-GL-BJ-012',currency:'CNY',order:'KS20260915006',tour:'JP20260915006',basis:'采购确认-C06；预付款安排YFAP-C06',
      nodes:[{id:'YF-C06-1',name:'行前预付',date:'2026-09-20',amount:10000,condition:'按本采购确认的行前付款安排',missing:[]}],
      records:[{id:'FK-YF-C06-1',node:'YF-C06-1',amount:4000,state:'付款失败',date:'2026-09-20',reference:'未形成成功付款回单',note:'收款账户校验未通过；采购公司资金岗核对后重新办理'}]},
    {purchase:'CG-C09',company:'北京凯撒',supplier:vendor,agreement:'AGR-GL-BJ-012',currency:'JPY',order:'KS20260917009',tour:'JP20260917009',basis:'加住确认单ZB09；预付款安排YFAP-C09',
      nodes:[{id:'YF-C09-1',name:'加住预付',date:'2026-09-23',amount:12000,condition:'加住服务确认后支付',missing:[]}],
      records:[{id:'FK-YF-C09-1',node:'YF-C09-1',amount:12000,state:'付款成功',date:'2026-09-23',reference:'回单HD-C09-1',note:'北京凯撒已登记实际付款'}]}
  ];
  function cents(x){if(!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(x)))throw Error('预付款金额依据不完整');const n=Math.round(Number(x)*100);if(!Number.isSafeInteger(n)||n>99999999999)throw Error('预付款金额超出范围');return n;}
  function summarize(p,data){
    if(!data)return null;
    if(data.purchase!==p.id||['company','supplier','agreement','currency','order','tour'].some(k=>data[k]!==p[k]))throw Error('预付款与本采购单不一致，请由采购公司核对');
    if(!data.nodes?.length||!Array.isArray(data.records))throw Error('预付款安排或付款记录依据缺失');
    const ids=new Set(),records=new Set();
    const nodes=data.nodes.map(n=>{if(!n.id||ids.has(n.id))throw Error('预付款节点重复或缺失');if(!Array.isArray(n.missing)||cents(n.amount)===0)throw Error('预付款节点金额或材料依据缺失');ids.add(n.id);return {...copy(n),planned:cents(n.amount),paid:0,processing:0};});
    for(const r of data.records){const n=nodes.find(n=>n.id===r.node);if(!n||!r.id||records.has(r.id))throw Error('付款记录重复或不属于本采购安排');records.add(r.id);const a=cents(r.amount);if(!['付款成功','付款中','付款失败'].includes(r.state))throw Error('付款结果尚未核对');if(r.state==='付款成功')n.paid+=a;if(r.state==='付款中')n.processing+=a;}
    let planned=0,paid=0,processing=0;
    for(const n of nodes){if(n.paid+n.processing>n.planned)throw Error('已付及付款中金额超过本节点安排，请由采购公司核对');planned+=n.planned;paid+=n.paid;processing+=n.processing;n.unpaid=(n.planned-n.paid)/100;n.status=n.paid===n.planned?'已付清':n.processing?'付款中':n.missing.length?'待补材料':data.records.some(r=>r.node===n.id&&r.state==='付款失败')?'付款失败':n.paid?'部分已付':'待付款';n.planned/=100;n.paid/=100;n.processing/=100;}
    return {...copy(data),nodes,totals:{planned:planned/100,paid:paid/100,processing:processing/100,unpaid:(planned-paid)/100}};
  }
  function read(session,id){if(session.role!=='supplier')throw Error('本查看区仅供供应商使用');const p=session.purchase(id);if(p.supplier!==session.supplier)throw Error('无权查看该供应商预付款');return summarize(p,rows.find(r=>r.purchase===id));}
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=(n,c)=>esc(c)+' '+Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  function render(session,id){
    const head='<section class="purchase-prepayment" aria-label="本采购单预付款"><div class="drawer-section-head"><h3 class="drawer-section-title">预付款</h3></div>';
    try{const d=read(session,id);if(!d)return head+'<p class="rec-basis">暂无已发布的预付款安排及记录；付款安排由采购公司计调核对。</p></section>';
      const cash=n=>money(n,d.currency),t=d.totals;
      return head+`<p class="rec-basis">${esc(d.purchase)} · ${esc(d.company)} → ${esc(d.supplier)} · ${esc(d.currency)}</p><dl class="rec-facts">${[['安排预付',t.planned],['实际已付',t.paid],['未付预款（含付款中）',t.unpaid],['其中付款中',t.processing]].map(([label,n])=>`<div><dt>${label}</dt><dd>${cash(n)}</dd></div>`).join('')}</dl><p class="rec-basis">${esc(d.basis)}</p>${d.nodes.map(n=>`<div class="rec-line-card"><strong>${esc(n.name)} · ${esc(n.status)}</strong><p class="rec-basis">${esc(n.id)} · 约定付款日 ${esc(n.date)}</p><dl class="rec-line-facts"><div><dt>安排金额</dt><dd>${cash(n.planned)}</dd></div><div><dt>实际已付</dt><dd>${cash(n.paid)}</dd></div><div><dt>尚未支付</dt><dd>${cash(n.unpaid)}</dd></div></dl><p class="rec-basis">${esc(n.condition)}</p>${n.missing.length?`<p class="rec-return-note">缺少材料：${n.missing.map(esc).join('；')}</p>`:''}</div>`).join('')}<details class="rec-history purchase-prepayment-records"><summary>付款记录（${d.records.length}笔）</summary>${d.records.length?d.records.map(r=>`<div class="rec-line-card"><strong>${esc(r.id)} · ${esc(r.state)}</strong><p class="rec-basis">${esc(r.date)} · ${cash(r.amount)} · ${esc(r.node)}</p><p class="rec-basis">${esc(r.reference)} · ${esc(r.note)}</p></div>`).join(''):'<p class="rec-basis">暂无付款记录</p>'}</details></section>`;
    }catch(e){return head+`<p class="rec-return-note" role="alert">${esc(e.message)}</p></section>`;}
  }
  const api={read,render,summarize};root.SupplierPurchasePayments=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
