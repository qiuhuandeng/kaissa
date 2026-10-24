/* 共同包舱费用在原成本维护、结算单成本明细内承接。 */
(function (root) {
  'use strict';
  const M = root.CruiseFinanceModel, procurement = M.sharedSeed();
  const E = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const cash = n => '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const q = id => document.getElementById(id);
  let schedules;
  const share = s => s?.cruiseLinked ? s.cruiseShare : s?.cruiseShared ? procurement.shares.find(x => x.id === s.id) : null;
  function mountLinked(list){
    const C=root.CruiseCloseout;if(!C)return;const groups=new Map();
    C.all().filter(c=>!c.legacy).forEach(c=>{const record=C.get(c.key);record.shares.filter(a=>a.voyage).forEach(a=>{
      if(!groups.has(a.id))groups.set(a.id,[]);groups.get(a.id).push({c,record,a});
    });});
    groups.forEach((sources,id)=>{
      if(list.some(s=>s.id===id))return;
      const {c,record,a}=sources[0],saved=record.groupResults[id],currency=record.currency;
      const compatible=sources.every(x=>x.record.currency===currency&&x.record.company===a.company&&x.c.voyage===c.voyage);
      const amount=C.round(sources.reduce((n,x)=>n+Number(x.a.amount),0));
      const rate=currency==='CNY'?1:Number(saved?.rate)||0,confirmed=compatible&&!!saved?.costConfirmed;
      const items=sources.map(x=>{const original=+x.a.amount,local=C.round(original*rate),evidence=saved?.reference||x.record.reference,row=['船方费用（本团承担）',x.c.supplier,'1项',local,local,confirmed?'已确认':'待确认',evidence];Object.assign(row,{originalAmount:original,currency,rate,attachment:evidence,cruiseSource:x.c.key,purchaseCompany:a.company});return row;});
      list.push({id,type:'邮轮团期',typeClass:'tag tag-purple',route:a.route,plan:a.label,date:c.date+' / '+c.back,people:a.people+'人',status:confirmed?'已确认':'待确认',statusClass:'tag tag-blue',estimated:saved?.estimate||0,actual:C.round(amount*rate),income:0,owner:'计调',providingCompany:a.company,cruiseLinked:true,cruiseCurrency:currency,cruiseRate:rate,
        cruiseShare:{amount,currency,estimate:saved?.estimate||0,reason:saved?.reason||'按已关联采购的本团承担核对',evidence:saved?.reference||sources.map(x=>x.record.reference).join('；'),locked:['审批中','已结算','审批通过'].includes(saved?.settlement),compatible},
        settlement:{status:saved?.settlement||'成本复核中',returnStatus:'待核对',basisStatus:'待补齐',confirmedPeople:a.people+'人',receivedNet:0,orders:(a.orders||[]).length+'单',postSettlementItems:[]},items});
    });
  }
  function seed(list) {
    schedules = list;
    procurement.shares.forEach((r, i) => {
      const cost = ['包舱费（本团承担）', procurement.supplier, '1项', r.amount, r.amount, r.status, r.evidence];
      Object.assign(cost, { currency: 'CNY', rate: 1, originalAmount: r.amount, attachment: r.evidence, cruiseShared: true });
      const income = i ? 450000 : 700000;
      root.SettlementIncomeBasis.examples[r.id] = [{ no: 'KSCZ20261112' + (i + 1) + '01', customer: r.city + '邮轮渠道', people: i ? '8间 / 16人' : '12间 / 24人', receivable: income, received: income, refund: 0, discount: 0, receiptNo: 'SK-CZ-1112-' + (i + 1) }];
      list.push({ id: r.id, type: '邮轮团期', typeClass: 'tag tag-purple', route: '理想号地中海邮轮', plan: r.city + ' / 共同包舱', date: '11-12 / 11-19', people: i ? '8间 / 16人' : '12间 / 24人', status: r.status, statusClass: 'tag tag-blue', estimated: r.estimate, actual: r.amount, income, owner: '王强', providingCompany: '上海凯撒', cruiseShared: true,
        settlement: { status: r.locked ? '已结算' : '成本复核中', returnStatus: '已回航', basisStatus: '已补齐', confirmedPeople: i ? '16人' : '24人', receivedNet: income, settlementDraftNo: 'JS-' + r.id, postSettlementItems: r.locked ? [{ type: '应付成本', sourceNo: 'BN-CRU-20261121-020', item: '船方后补港务费（上海团承担）', amount: 20000, status: '待二次结算' }] : [] }, items: [cost] });
    });
    if(root.CruiseCloseout){for(const schedule of list.filter(s=>s.cruiseShared)){const c=root.CruiseCloseout.sourceForGroup(schedule.id);if(!c)continue;const saved=root.CruiseCloseout.get(c.key).groupResults[schedule.id];const r=share(schedule);if(!saved||r.locked)continue;r.amount=saved.cost;r.status=saved.costConfirmed?'已确认':'待确认';schedule.items[0][3]=schedule.items[0][4]=schedule.items[0].originalAmount=saved.cost;schedule.items[0][5]=r.status;schedule.actual=saved.cost;schedule.status=r.status;schedule.settlement.status=saved.settlement;}}
    mountLinked(list);
  }
  function table(current) {
    if(current.cruiseLinked)return '<p class="form-hint">本次采购承担 '+E(current.cruiseCurrency)+' '+Number(share(current).amount).toLocaleString('zh-CN')+'。承担金额在采购核对中维护；本页确认成本，不代替收入、回团或结算确认。</p>';
    const used = procurement.shares.reduce((n, r) => n + r.amount, 0);
    return '<p>采购 ' + E(procurement.no) + ' · 船方航次 ' + E(procurement.voyage) + ' · 采购总额 <strong>' + cash(procurement.total) + '</strong></p><div class="table-wrap cruise-finance-table"><table><thead><tr><th>销售团 / 出发地</th><th>预估成本</th><th>本团承担</th><th>差异</th><th>确认情况</th></tr></thead><tbody>' + procurement.shares.map(r => '<tr><td>' + E(r.id) + '<br>' + E(r.city + (r.id === current.id ? '（本团）' : '')) + '</td><td>' + cash(r.estimate) + '</td><td>' + cash(r.amount) + '</td><td>' + cash(r.amount - r.estimate) + '</td><td>' + E(r.locked ? '已结算' : r.status) + '</td></tr>').join('') + '</tbody></table></div><p class="form-hint">各团承担合计 ' + cash(used) + ' · 尚未分配 ' + cash(procurement.total - used) + ' · ' + E(procurement.basis) + '</p>';
  }
  function editor(schedule) {
    let panel = q('cruiseCostEditor');
    if (!panel) { panel = document.createElement('section'); panel.id = 'cruiseCostEditor'; panel.className = 'cruise-finance-block'; q('costDrawerSummary').after(panel); }
    const r = share(schedule); panel.hidden = !r; if (!r) return;
    panel.innerHTML = '<div class="drawer-section-head"><h3 class="drawer-section-title">'+(schedule.cruiseLinked?'采购费用承担':'共同包舱费用')+'</h3></div>' + table(schedule) + '<div class="form-row"><div class="form-group"><label class="form-label" for="cruiseCostAmount">本团承担金额（'+E(schedule.cruiseCurrency||'CNY')+'）</label><input class="form-control" id="cruiseCostAmount" type="number" min="0" step="0.01" '+(schedule.cruiseLinked?'readonly ':'')+'value="' + r.amount + '"></div><div class="form-group"><label class="form-label" for="cruiseCostReason">'+(schedule.cruiseLinked?'成本核对说明':'与预估差异原因')+'</label><input class="form-control" id="cruiseCostReason" value="' + E(r.reason) + '"></div></div><div class="form-group"><label class="form-label" for="cruiseCostEvidence">船方账单及分配依据</label><input class="form-control" id="cruiseCostEvidence" value="' + E(r.evidence) + '"></div>'+(schedule.cruiseLinked&&schedule.cruiseCurrency!=='CNY'?'<div class="form-group"><label class="form-label" for="cruiseCostRate">折算汇率（人民币 / '+E(schedule.cruiseCurrency)+'）</label><input id="cruiseCostRate" class="form-control" type="number" min="0" step="0.0001" value="'+(schedule.cruiseRate||'')+'"><p class="form-hint">按本次成本确认依据填写，未核定前不确认人民币成本。</p></div>':'')+'<p class="form-hint" id="cruiseCostDifference">'+(schedule.cruiseLinked?'采购原币与人民币折算分别保留；预估及收入依据继续在原结算核对。':'预估 ' + cash(r.estimate) + ' · 本次差异 ' + cash(r.amount - r.estimate))+'</p>';
    root.CruiseCloseoutUI?.costPanel(schedule,panel);
    if(schedule.cruiseLinked&&schedule.items.filter(x=>x.cruiseSource).every(x=>x[5]==='已确认')&&q('cruiseCostRate'))q('cruiseCostRate').readOnly=true;
    q('cruiseCostAmount').addEventListener('input', () => { q('cruiseCostDifference').textContent = '预估 ' + cash(r.estimate) + ' · 本次差异 ' + cash((Number(q('cruiseCostAmount').value) || 0) - r.estimate); });
  }
  function save(schedule, confirm) {
    if (!share(schedule)) return false;
    if (['审批中', '已结算'].includes(schedule.settlement.status)) throw Error('结算已提交或锁定，请从原结算记录办理后续调整');
    if(confirm) root.CruiseCloseout?.checkGroup(schedule,Number(q('cruiseCostAmount').value));
    if(schedule.cruiseLinked){
      const C=root.CruiseCloseout,r=share(schedule),rate=schedule.cruiseCurrency==='CNY'?1:Number(q('cruiseCostRate')?.value);
      const alreadyConfirmed=schedule.items.filter(x=>x.cruiseSource).every(x=>x[5]==='已确认');
      if(alreadyConfirmed&&rate!==schedule.cruiseRate)throw Error('已确认成本的折算依据不能改写，请从原结算调整办理');
      confirm=confirm||alreadyConfirmed;
      r.reason=q('cruiseCostReason').value;r.evidence=q('cruiseCostEvidence').value;
      if(!r.compatible)throw Error('采购来源公司、币种或航次不一致，请回采购核对');
      if(confirm&&(!Number.isFinite(rate)||rate<=0))throw Error('外币成本折算汇率待核定');
      schedule.cruiseRate=Number.isFinite(rate)&&rate>0?rate:0;
      for(const item of schedule.items.filter(x=>x.cruiseSource)){item.rate=schedule.cruiseRate;item[3]=item[4]=C.round(item.originalAmount*schedule.cruiseRate);item[5]=confirm?'已确认':'待确认';item.attachment=q('cruiseCostEvidence').value;item[6]=q('cruiseCostReason').value+'；'+item.attachment;}
      schedule.actual=C.round(schedule.items.reduce((n,x)=>n+Number(x[4]||0),0));schedule.status=confirm?'已确认':'待确认';schedule.settlement.status=confirm?'待提交':'成本复核中';C.capture(schedule);return true;
    }
    M.updateShare(procurement, schedule.id, { amount: q('cruiseCostAmount').value, reason: q('cruiseCostReason').value, evidence: q('cruiseCostEvidence').value, confirm });
    const r = share(schedule), cost = schedule.items.find(x => x.cruiseShared);
    cost[3] = cost[4] = cost.originalAmount = r.amount; cost[5] = r.status; cost[6] = r.reason + '；' + r.evidence; cost.attachment = r.evidence;
    schedule.actual = schedule.items.reduce((n, x) => n + Number(x[4] || 0), 0);
    schedule.status = r.status;
    schedule.settlement.status = confirm ? '待提交' : '成本复核中';
    root.CruiseCloseout?.capture(schedule);
    return true;
  }
  function detail(schedule) {
    let panel = q('cruiseCostComparison');
    if (!panel) { panel = document.createElement('section'); panel.id = 'cruiseCostComparison'; panel.className = 'cruise-finance-block'; q('settlementCostRows').closest('.table-wrap').after(panel); }
    const r = share(schedule); panel.hidden = !r; if (!r) return;
    if(schedule.cruiseLinked){panel.innerHTML='<div class="drawer-section-head"><h3 class="drawer-section-title">采购费用承担</h3></div>'+table(schedule);root.CruiseCloseoutUI?.costPanel(schedule,panel);return;}
    panel.innerHTML = '<div class="drawer-section-head"><h3 class="drawer-section-title">共同采购与成本差异</h3></div>' + table(schedule) + '<p>差异原因：' + E(r.reason) + '</p><p>确认依据：' + E(r.evidence) + '</p>' + (r.locked ? '<p>原结算成本 <strong>¥320,000.00</strong> · 船方后补港务费 <strong>+¥20,000.00</strong> · 调整后预计成本 <strong>¥340,000.00</strong></p><p><a class="link-primary" href="../finance/finance-settlement-adjustment.html?adjustmentNo=ADJ-CRU-20261121-020">查看财务结算调整</a></p>' : '') + '<p class="form-hint">预付和冲抵只核对款项，不另加到成本；结算后补差保留原结算。</p>';
    root.CruiseCloseoutUI?.costPanel(schedule,panel);
    const prepayPanel = q('settlementPrepayRows');
    prepayPanel.innerHTML = '<tr><td>' + E(procurement.supplier) + '</td><td>包舱预付</td><td>用途分摊另核</td><td>未核对本团抵清</td><td>待财务核对</td><td>PP-CRU-20260701005</td><td>PAY-CRU-20260701005</td><td><a class="link-primary" href="../finance/finance-prepayment-offset.html?prepayNo=PP-CRU-20260701005">查看预付</a></td></tr>';
  }
  root.CruiseCostSettlement = { seed, share, editor, save, detail, procurement, getSchedules: () => schedules };
})(window);
