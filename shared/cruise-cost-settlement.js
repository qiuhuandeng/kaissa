/* 共同包舱费用在原成本维护、结算单成本明细内承接。 */
(function (root) {
  'use strict';
  const M = root.CruiseFinanceModel, procurement = M.sharedSeed();
  const E = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const cash = n => '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const q = id => document.getElementById(id);
  let schedules;
  const share = s => s?.cruiseShared ? procurement.shares.find(x => x.id === s.id) : null;
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
  }
  function table(current) {
    const used = procurement.shares.reduce((n, r) => n + r.amount, 0);
    return '<p>采购 ' + E(procurement.no) + ' · 船方航次 ' + E(procurement.voyage) + ' · 采购总额 <strong>' + cash(procurement.total) + '</strong></p><div class="table-wrap cruise-finance-table"><table><thead><tr><th>销售团 / 出发地</th><th>预估成本</th><th>本团承担</th><th>差异</th><th>确认情况</th></tr></thead><tbody>' + procurement.shares.map(r => '<tr><td>' + E(r.id) + '<br>' + E(r.city + (r.id === current.id ? '（本团）' : '')) + '</td><td>' + cash(r.estimate) + '</td><td>' + cash(r.amount) + '</td><td>' + cash(r.amount - r.estimate) + '</td><td>' + E(r.locked ? '已结算' : r.status) + '</td></tr>').join('') + '</tbody></table></div><p class="form-hint">各团承担合计 ' + cash(used) + ' · 尚未分配 ' + cash(procurement.total - used) + ' · ' + E(procurement.basis) + '</p>';
  }
  function editor(schedule) {
    let panel = q('cruiseCostEditor');
    if (!panel) { panel = document.createElement('section'); panel.id = 'cruiseCostEditor'; panel.className = 'cruise-finance-block'; q('costDrawerSummary').after(panel); }
    const r = share(schedule); panel.hidden = !r; if (!r) return;
    panel.innerHTML = '<div class="drawer-section-head"><h3 class="drawer-section-title">共同包舱费用</h3></div>' + table(schedule) + '<div class="form-row"><div class="form-group"><label class="form-label" for="cruiseCostAmount">本团承担金额（元）</label><input class="form-control" id="cruiseCostAmount" type="number" min="0" step="0.01" value="' + r.amount + '"></div><div class="form-group"><label class="form-label" for="cruiseCostReason">与预估差异原因</label><input class="form-control" id="cruiseCostReason" value="' + E(r.reason) + '"></div></div><div class="form-group"><label class="form-label" for="cruiseCostEvidence">船方账单及分配依据</label><input class="form-control" id="cruiseCostEvidence" value="' + E(r.evidence) + '"></div><p class="form-hint" id="cruiseCostDifference">预估 ' + cash(r.estimate) + ' · 本次差异 ' + cash(r.amount - r.estimate) + '</p>';
    q('cruiseCostAmount').addEventListener('input', () => { q('cruiseCostDifference').textContent = '预估 ' + cash(r.estimate) + ' · 本次差异 ' + cash((Number(q('cruiseCostAmount').value) || 0) - r.estimate); });
  }
  function save(schedule, confirm) {
    if (!share(schedule)) return false;
    if (['审批中', '已结算'].includes(schedule.settlement.status)) throw Error('结算已提交或锁定，请从原结算记录办理后续调整');
    M.updateShare(procurement, schedule.id, { amount: q('cruiseCostAmount').value, reason: q('cruiseCostReason').value, evidence: q('cruiseCostEvidence').value, confirm });
    const r = share(schedule), cost = schedule.items.find(x => x.cruiseShared);
    cost[3] = cost[4] = cost.originalAmount = r.amount; cost[5] = r.status; cost[6] = r.reason + '；' + r.evidence; cost.attachment = r.evidence;
    schedule.actual = schedule.items.reduce((n, x) => n + Number(x[4] || 0), 0);
    schedule.status = r.status;
    schedule.settlement.status = confirm ? '待提交' : '成本复核中';
    return true;
  }
  function detail(schedule) {
    let panel = q('cruiseCostComparison');
    if (!panel) { panel = document.createElement('section'); panel.id = 'cruiseCostComparison'; panel.className = 'cruise-finance-block'; q('settlementCostRows').closest('.table-wrap').after(panel); }
    const r = share(schedule); panel.hidden = !r; if (!r) return;
    panel.innerHTML = '<div class="drawer-section-head"><h3 class="drawer-section-title">共同采购与成本差异</h3></div>' + table(schedule) + '<p>差异原因：' + E(r.reason) + '</p><p>确认依据：' + E(r.evidence) + '</p>' + (r.locked ? '<p>原结算成本 <strong>¥320,000.00</strong> · 船方后补港务费 <strong>+¥20,000.00</strong> · 调整后预计成本 <strong>¥340,000.00</strong></p><p><a class="link-primary" href="../finance/finance-settlement-adjustment.html?adjustmentNo=ADJ-CRU-20261121-020">查看财务结算调整</a></p>' : '') + '<p class="form-hint">预付和冲抵只核对款项，不另加到成本；结算后补差保留原结算。</p>';
    const prepayPanel = q('settlementPrepayRows');
    prepayPanel.innerHTML = '<tr><td>' + E(procurement.supplier) + '</td><td>包舱预付</td><td>用途分摊另核</td><td>未核对本团抵清</td><td>待财务核对</td><td>PP-CRU-20260701005</td><td>PAY-CRU-20260701005</td><td><a class="link-primary" href="../finance/finance-prepayment-offset.html?prepayNo=PP-CRU-20260701005">查看预付</a></td></tr>';
  }
  root.CruiseCostSettlement = { seed, share, editor, save, detail, procurement, getSchedules: () => schedules };
})(window);
