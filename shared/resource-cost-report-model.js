(function (root) {
  'use strict';
  const known = v => typeof v === 'number' && Number.isFinite(v);
  const sum = xs => xs.reduce((a, v) => a + Math.round(v * 100), 0) / 100;
  const defaults = { dataset: 'pending', view: 'costs', company: '', supplier: '', tour: '', batch: '', unit: '', start: '2026-09-01', end: '2026-09-30' };
  const views = { costs: '成本组成与分配', resources: '资源批次风险' };
  function fixture() {
    const base = { company: '北京凯撒', currency: 'CNY', date: '2026-09-20', supplier: '邮轮供应商（演示）', product: '地中海邮轮', destination: '欧洲', supply: '自营组织', evidence: '已确认采购及分配依据（独立算例）' };
    return { batches: [
      { ...base, batch: 'CABIN-01', unit: '舱', committed: 20, sold: 14, used: 12, returnable: 2, nonRefundableUnsold: 4, purchase: 200000, payable: 160000, paid: 70000, estimated: 205000, confirmedLoss: 20000, pendingLoss: 20000, quantityComplete: true },
      { ...base, batch: 'AIR-01', supplier: '航司（演示）', product: '欧洲跟团', unit: '座', committed: 30, sold: 25, used: 24, returnable: 3, nonRefundableUnsold: 2, purchase: 90000, payable: 90000, paid: 60000, estimated: 92000, confirmedLoss: 3000, pendingLoss: 3000, quantityComplete: true },
      { ...base, batch: 'RAIL-01', supplier: '专列供应商（演示）', product: '丝路专列', unit: '铺', committed: 40, sold: 35, used: 30, returnable: 0, nonRefundableUnsold: 5, purchase: null, payable: null, paid: 0, estimated: 120000, confirmedLoss: null, pendingLoss: null, quantityComplete: true }
    ], allocations: [
      { id: 'CA-01', batch: 'CABIN-01', tour: 'CRUISE-A', type: '舱位使用成本', quantity: 8, amount: 80000, confirmed: true, evidence: '分配确认01' },
      { id: 'CA-02', batch: 'CABIN-01', tour: 'CRUISE-B', type: '舱位使用成本', quantity: 4, amount: 40000, confirmed: true, evidence: '分配确认02' },
      { id: 'CA-03', batch: 'CABIN-01', tour: 'CRUISE-A', type: '已确认舱损', quantity: 2, amount: 20000, confirmed: true, evidence: '舱损确认01' },
      { id: 'CA-04', batch: 'CABIN-01', tour: '未分配团期', type: '待确认舱损', quantity: 2, amount: 20000, confirmed: false, evidence: '舱损待复核' },
      { id: 'AA-01', batch: 'AIR-01', tour: 'EUROPE-A', type: '机位使用成本', quantity: 24, amount: 72000, confirmed: true, evidence: '机位分配确认' },
      { id: 'RA-01', batch: 'RAIL-01', tour: 'RAIL-A', type: '铺位使用成本', quantity: 30, amount: null, confirmed: false, evidence: '成本金额待确认' }
    ] };
  }
  function unique(rows, key) {
    const groups = new Map();
    rows.forEach(r => { const k = key(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
    return [...groups.values()].map(g => ({ ...g[0], conflict: g.some(r => JSON.stringify(r) !== JSON.stringify(g[0])) }));
  }
  function query(input, supplied) {
    const q = { ...defaults, ...input };
    const date = v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
    if (!date(q.start) || !date(q.end) || q.start > q.end) throw new Error('请检查确认日期范围');
    if (q.dataset === 'pending') return { rows: [], pending: true, notice: '资源确认与成本分配来源待接入', sections: [] };
    const data = supplied || fixture();
    const allocations = unique(data.allocations, r => r.batch + '|' + r.id);
    const selected = unique(data.batches, r => r.company + '|' + r.batch).filter(r => r.date >= q.start && r.date <= q.end && ['company', 'supplier', 'batch', 'unit'].every(k => !q[k] || String(r[k]).includes(q[k])) && (!q.tour || allocations.some(a => a.batch === r.batch && a.tour.includes(q.tour))));
    const batches = selected.map(r => {
      const assigned = allocations.filter(a => a.batch === r.batch && a.confirmed);
      const ambiguous = new Set(data.batches.filter(b => b.batch === r.batch).map(b => b.company)).size > 1;
      const valid = !ambiguous && !r.conflict && known(r.purchase) && assigned.every(a => !a.conflict && known(a.amount) && a.amount >= 0 && a.evidence) && sum(assigned.map(a => a.amount)) <= r.purchase;
      const quantityValid = r.quantityComplete && [r.committed, r.sold, r.used, r.returnable, r.nonRefundableUnsold].every(v => known(v) && v >= 0) && r.used <= r.sold && r.sold + r.returnable + r.nonRefundableUnsold === r.committed;
      return { ...r, allocated: valid ? sum(assigned.map(a => a.amount)) : null, unallocated: valid ? sum([r.purchase, -sum(assigned.map(a => a.amount))]) : null, status: !valid ? '成本或分配资料待核对' : !quantityValid ? '数量资料待核对' : '批次资料齐全，未售风险单列', quantityStatus: quantityValid ? '数量范围齐全' : '数量待核对' };
    });
    const costs = allocations.filter(a => batches.some(b => b.batch === a.batch) && (!q.tour || a.tour.includes(q.tour))).map(a => {
      const b = batches.find(b => b.batch === a.batch);
      return { company: b.company, currency: b.currency, supplier: b.supplier, product: b.product, unit: b.unit, ...a, confirmedCost: a.confirmed && !a.conflict && known(b.allocated) ? a.amount : null, pendingCost: a.confirmed ? 0 : a.amount, status: a.conflict ? '分配资料冲突' : a.confirmed ? known(b.allocated) ? '已确认成本' : '分配待核对' : '待确认成本' };
    });
    return { rows: q.view === 'resources' ? batches : costs, sections: [{ key: 'batches', title: '相关采购批次全额核对（不随单团分配重复累计）', rows: batches, columns: ['batch', 'company', 'supplier', 'currency', 'unit', 'purchase', 'estimated', 'allocated', 'unallocated', 'payable', 'paid', 'confirmedLoss', 'pendingLoss', 'status'] }, { key: 'allocations', title: '完整分配依据', rows: costs, columns: ['id', 'batch', 'tour', 'type', 'quantity', 'unit', 'confirmedCost', 'pendingCost', 'status', 'evidence'] }], notice: '独立资源算例，未计入共同经营业绩。采购、预估、确认、应付及付款分别核对；待确认损耗不作为已确认成本。' };
  }
  const api = { defaults, views, fixture, query };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CaesarResourceCost = api;
})(typeof window !== 'undefined' ? window : globalThis);
