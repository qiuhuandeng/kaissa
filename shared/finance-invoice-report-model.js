(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./finance-balances-model.js'));
  else root.CaesarInvoiceReport = factory(root.CaesarBalances);
})(typeof window === 'object' ? window : globalThis, function (b) {
  'use strict';
  const views = { received: '已收未开', issued: '已开未收', paid: '已付未收票', invoiced: '已收票未付' };
  const defaults = { dataset: 'pending', view: 'received', asOf: '2026-09-30', cutoff: '2026-10-31', dateBasis: 'all', start: '2026-09-01', end: '2026-09-30', company: '', currency: '', party: '', keyword: '', status: '' };
  const round = n => Math.round(n * 100) / 100;
  const docKey = d => JSON.stringify([d.company, d.currency, d.kind, d.id]);
  const scopeKey = s => JSON.stringify([s.company, s.currency, s.side, s.scope || s.id]);
  function fixture() {
    const scopes = [], documents = [], allocations = [], corrections = [];
    const scope = (id, side, extra = {}) => { const s = { id, side, company: '北京凯撒', currency: 'CNY', partyId: side === 'sale' ? 'C1' : 'S1', party: side === 'sale' ? '华光科技有限公司' : '远洋邮轮公司', invoiceDue: '2026-09-20', cashDue: '2026-09-20', proof: '合同票款节点-' + id, ...extra }; scopes.push(s); return s; };
    const document = (id, kind, side, amount, extra = {}) => { const d = { id, kind, side, company: '北京凯撒', currency: 'CNY', partyId: side === 'sale' ? 'C1' : 'S1', amount, issuedAt: kind === 'invoice' ? '2026-09-05' : '', receivedAt: kind === 'invoice' && side === 'purchase' ? '2026-09-08' : '', cashAt: kind === 'cash' ? '2026-09-10' : '', processedAt: '2026-09-10', recorded: '2026-09-10', confirmed: true, proof: '已确认凭据-' + id, original: '', ...extra }; documents.push(d); return d; };
    const allocate = (d, s, amount, extra = {}) => allocations.push({ id: 'FP-' + (allocations.length + 1), document: docKey(d), scope: s.id, amount, confirmed: true, date: '2026-09-10', recorded: '2026-09-10', proof: '批准分配-' + d.id + '-' + s.id, ...extra });
    const o1 = scope('ORDER-1', 'sale'), o2 = scope('ORDER-2', 'sale', { cashDue: '2026-10-20' });
    const i1 = document('INV-OUT-1', 'invoice', 'sale', 10000); allocate(i1, o1, 6000); allocate(i1, o2, 4000);
    const i2 = document('INV-OUT-2', 'invoice', 'sale', 3000); allocate(i2, o1, 3000);
    const c1 = document('RECEIPT-1', 'cash', 'sale', 12000); allocate(c1, o1, 10000); allocate(c1, o2, 2000);
    const c2 = document('RECEIPT-2', 'cash', 'sale', 1000); allocate(c2, o1, 1000);
    const a1 = scope('AP-1', 'purchase'), a2 = scope('AP-2', 'purchase');
    const input = document('INV-IN-1', 'invoice', 'purchase', 8000); allocate(input, a1, 6000); allocate(input, a2, 2000);
    const pay = document('PAY-1', 'cash', 'purchase', 9000); allocate(pay, a1, 8000); allocate(pay, a2, 1000);
    document('INV-UNALLOCATED', 'invoice', 'purchase', 1000);
    const o3 = scope('ORDER-CORRECTION', 'sale'), blue = document('INV-BLUE', 'invoice', 'sale', 5000); allocate(blue, o3, 5000);
    const cash = document('RECEIPT-BLUE', 'cash', 'sale', 5000); allocate(cash, o3, 5000);
    const red = document('INV-RED', 'invoice', 'sale', -5000, { original: docKey(blue), issuedAt: '2026-09-20', processedAt: '2026-09-20', recorded: '2026-09-20', reason: '抬头信息更正' }); allocate(red, o3, -5000, { date: '2026-09-20', recorded: '2026-09-20' });
    const replacement = document('INV-REISSUE', 'invoice', 'sale', 5000, { issuedAt: '2026-09-20', processedAt: '2026-09-20', recorded: '2026-09-20', replacementFor: docKey(blue), reason: '原票信息更正重开' }); allocate(replacement, o3, 5000, { date: '2026-09-20', recorded: '2026-09-20' });
    corrections.push({ id: 'CORR-1', original: blue.id, replacement: replacement.id, date: '2026-09-20', reason: '抬头信息更正', treatment: '仅票据更正，不重复确认收入成本', proof: '更正确认-1' });
    const o4 = scope('ORDER-REFUND', 'sale'), b4 = document('INV-PARTIAL', 'invoice', 'sale', 5000), c4 = document('RECEIPT-PARTIAL', 'cash', 'sale', 5000); allocate(b4, o4, 5000); allocate(c4, o4, 5000);
    const r4 = document('INV-PARTIAL-RED', 'invoice', 'sale', -1000, { original: docKey(b4), issuedAt: '2026-10-02', processedAt: '2026-10-02', recorded: '2026-10-02' }); allocate(r4, o4, -1000, { date: '2026-10-02', recorded: '2026-10-02' });
    const refund = document('REFUND-PARTIAL', 'cash', 'sale', -1000, { original: docKey(c4), cashAt: '2026-10-03', processedAt: '2026-10-03', recorded: '2026-10-03' }); allocate(refund, o4, -1000, { date: '2026-10-03', recorded: '2026-10-03' });
    const gap = scope('ORDER-GAP', 'sale', { gap: true, invoiceDue: '' });
    const g = document('INV-GAP', 'invoice', 'sale', null, { gap: true }); allocate(g, gap, 1000);
    const foreign = scope('ORDER-1', 'sale', { company: '福建凯撒', currency: 'EUR', party: '同名企业客户', invoiceDue: '' });
    const fi = document('INV-OUT-1', 'invoice', 'sale', 1000, { company: '福建凯撒', currency: 'EUR' }); allocate(fi, foreign, 1000);
    const fc = document('RECEIPT-1', 'cash', 'sale', 500, { company: '福建凯撒', currency: 'EUR' }); allocate(fc, foreign, 500);
    return { scopes, documents, allocations, corrections, coverageStart: '2026-09-01', coverageEnd: '2026-10-31' };
  }
  function query(input, source = fixture()) {
    const q = { ...defaults, ...input }, side = ['received', 'issued'].includes(q.view) ? 'sale' : 'purchase';
    if (!views[q.view] || !['pending', 'demo', 'gaps'].includes(q.dataset) || !['all', 'issuedAt', 'receivedAt', 'processedAt', 'cashAt'].includes(q.dateBasis)) throw Error('查询口径或资料范围无效');
    if (![q.asOf, q.cutoff, q.start, q.end].every(b.dateOK) || q.start > q.end || q.asOf > q.cutoff || q.dateBasis !== 'all' && q.end > q.asOf) throw Error('请核对选单期间、余额日和资料截止');
    if (q.dataset === 'pending' || q.asOf < source.coverageStart || q.asOf > source.coverageEnd) return { rows: [], sections: [], pending: true, notice: '来源待接入或超出历史范围，不推算票款差额' };
    const docs = new Map(), conflicts = new Set(), invalid = new Set(), problems = [], effective = d => d.kind === 'cash' ? d.cashAt : d.side === 'sale' ? d.issuedAt : d.receivedAt;
    for (const d of source.documents.filter(d => (!d.gap || q.dataset === 'gaps') && (!b.dateOK(d.recorded) || d.recorded <= q.cutoff))) {
      const k = docKey(d); if (docs.has(k)) { if (JSON.stringify(docs.get(k)) !== JSON.stringify(d)) conflicts.add(k); continue; } docs.set(k, d);
    }
    const active = new Map(), reversed = new Map();
    for (const [k, d] of [...docs.entries()].sort(([, a], [, c]) => String(effective(a)).localeCompare(String(effective(c))))) {
      if (!d.confirmed || b.dateOK(effective(d)) && effective(d) > q.asOf) continue;
      if (conflicts.has(k) || !d.id || !b.money(d.amount) || !['cash', 'invoice'].includes(d.kind) || !['sale', 'purchase'].includes(d.side) || !b.dateOK(effective(d)) || !b.dateOK(d.recorded) || !b.dateOK(d.processedAt) || !d.proof || !d.partyId) invalid.add(k);
      if (d.amount < 0) {
        const original = active.get(d.original), sum = round((reversed.get(d.original) || 0) + Math.abs(d.amount));
        if (!original || invalid.has(d.original) || original.amount <= 0 || original.kind !== d.kind || original.side !== d.side || original.company !== d.company || original.currency !== d.currency || original.partyId !== d.partyId || sum > original.amount) invalid.add(k);
        else reversed.set(d.original, sum);
      }
      active.set(k, d);
    }
    const scopeMap = new Map(source.scopes.map(s => [scopeKey(s), s])), groups = new Map(), validAllocations = [], seen = new Map();
    for (const a of source.allocations.filter(a => a.confirmed && (!b.dateOK(a.date) || a.date <= q.asOf) && (!b.dateOK(a.recorded) || a.recorded <= q.cutoff))) {
      const d = active.get(a.document); if (!d) continue;
      const s = scopeMap.get(scopeKey({ ...d, scope: a.scope })), duplicate = seen.get(a.id);
      if (duplicate) { if (JSON.stringify(duplicate) !== JSON.stringify(a)) { invalid.add(a.document); invalid.add(duplicate.document); } continue; } seen.set(a.id, a);
      if (!s || !a.id || !b.money(a.amount) || Math.sign(a.amount) !== Math.sign(d.amount) && a.amount !== 0 || s.company !== d.company || s.currency !== d.currency || s.partyId !== d.partyId || s.side !== d.side || !b.dateOK(a.date) || !b.dateOK(a.recorded) || a.date < effective(d) || !a.proof) invalid.add(a.document);
      if (!groups.has(a.document)) groups.set(a.document, []); groups.get(a.document).push(a);
    }
    const reducedAllocations = new Map();
    for (const [k, as] of groups) {
      const d = active.get(k), total = b.sum(as.map(a => a.amount)); if (Math.abs(total) > Math.abs(d.amount)) invalid.add(k);
      if (d.amount < 0) for (const a of as) { const originalAlloc = (groups.get(d.original) || []).filter(x => x.scope === a.scope), rk = JSON.stringify([d.original, a.scope]); const reduced = round((reducedAllocations.get(rk) || 0) + Math.abs(a.amount)); reducedAllocations.set(rk, reduced); if (invalid.has(d.original) || reduced > b.sum(originalAlloc.map(x => x.amount))) invalid.add(k); }
    }
    const scopeIssues = new Set();
    for (const [k, d] of active) {
      const as = groups.get(k) || [];
      if (invalid.has(k)) { as.forEach(a => scopeIssues.add(scopeKey({ ...d, scope: a.scope }))); problems.push({ ...d, issue: '票款或分配来源缺失、同号冲突、超分配或原单不符' }); }
      else as.forEach(a => validAllocations.push({ ...d, ...a, documentId: d.id, effective: effective(d), kindLabel: d.kind === 'invoice' ? '发票' : '实际收付' }));
    }
    const assigned = k => b.sum((groups.get(k) || []).map(a => a.amount));
    const unallocated = [...active.entries()].map(([k, d]) => ({ ...d, kindLabel: d.kind === 'invoice' ? '发票' : '实际收付', allocated: invalid.has(k) ? null : assigned(k), unallocated: invalid.has(k) ? null : round(d.amount - assigned(k)), effective: effective(d), coverage: invalid.has(k) ? '来源待核对' : '已确认' }));
    const match = s => s.side === side && (!s.gap || q.dataset === 'gaps') && (!q.company || s.company === q.company) && (!q.currency || s.currency === q.currency) && (!q.party || [s.partyId, s.party].join(' ').includes(q.party)) && (!q.keyword || s.id.includes(q.keyword));
    const candidates = source.scopes.filter(match).filter(s => q.dateBasis === 'all' || [...active.entries()].some(([k, d]) => (groups.get(k) || []).some(a => scopeKey({ ...d, scope: a.scope }) === scopeKey(s)) && b.dateOK(d[q.dateBasis]) && d[q.dateBasis] >= q.start && d[q.dateBasis] <= q.end));
    const rows = candidates.map(s => {
      const as = validAllocations.filter(a => scopeKey(a) === scopeKey(s)), known = !scopeIssues.has(scopeKey(s)) && Boolean(s.proof);
      const cash = known ? b.sum(as.filter(a => a.kind === 'cash').map(a => a.amount)) : null, invoiced = known ? b.sum(as.filter(a => a.kind === 'invoice').map(a => a.amount)) : null;
      const gap = known ? round(['received', 'paid'].includes(q.view) ? Math.max(0, cash - invoiced) : Math.max(0, invoiced - cash)) : null;
      const due = ['received', 'paid'].includes(q.view) ? s.invoiceDue : s.cashDue;
      const status = !known ? '资料待核对' : gap === 0 ? '本项无差额' : !b.dateOK(due) ? '节点待补' : due > q.asOf ? '未到约定节点' : due === q.asOf ? '约定节点当日' : '已超约定节点';
      return { ...s, cash, invoiced, gap, due, status, invoiceIds: [...new Set(as.filter(a => a.kind === 'invoice').map(a => a.documentId))].join('、'), cashIds: [...new Set(as.filter(a => a.kind === 'cash').map(a => a.documentId))].join('、') };
    }).filter(r => !q.status || r.status === q.status);
    const selected = new Set(rows.map(scopeKey)), selectedDocs = new Set([...groups.entries()].filter(([k, as]) => as.some(a => selected.has(scopeKey({ ...active.get(k), scope: a.scope })))).map(([k]) => k));
    const sourceMatch = d => d.side === side && (!q.company || d.company === q.company) && (!q.currency || d.currency === q.currency);
    const totals = new Map(); rows.forEach(r => { const k = JSON.stringify([r.company, r.currency]); if (!totals.has(k)) totals.set(k, []); totals.get(k).push(r); });
    return { rows, pending: false, notice: '独立验收算例 · 截至' + q.asOf + ' · 资料截止' + q.cutoff + ' · 选单日期仅选业务范围，票款按余额日累计 · 差额仅按有效分配，未分配另列 · 元/原币', sections: [
      { key: 'totals', title: '公司与原币已分配差额合计', rows: [...totals.values()].map(rs => ({ company: rs[0].company, currency: rs[0].currency, cash: rs.every(r => r.cash != null) ? b.sum(rs.map(r => r.cash)) : null, invoiced: rs.every(r => r.invoiced != null) ? b.sum(rs.map(r => r.invoiced)) : null, gap: rs.every(r => r.gap != null) ? b.sum(rs.map(r => r.gap)) : null, coverage: rs.filter(r => r.gap == null).length + '条缺数' })), columns: ['company', 'currency', 'cash', 'invoiced', 'gap', 'coverage'] },
      { key: 'documents', title: '原票、红冲及收付款依据', rows: unallocated.filter(d => selectedDocs.has(docKey(d))).map(d => ({ ...d, original: docs.get(d.original)?.id || d.original, replacementFor: docs.get(d.replacementFor)?.id || d.replacementFor })), columns: ['id', 'kindLabel', 'company', 'currency', 'amount', 'issuedAt', 'receivedAt', 'cashAt', 'processedAt', 'recorded', 'original', 'replacementFor', 'proof'] },
      { key: 'allocations', title: '逐订单/应付分配依据', rows: validAllocations.filter(a => selected.has(scopeKey(a))), columns: ['id', 'documentId', 'scope', 'kindLabel', 'company', 'currency', 'amount', 'date', 'proof'] },
      { key: 'unallocated', title: '同公司币种尚未分配及待核对原款/票（不随订单筛选缩小）', rows: unallocated.filter(d => sourceMatch(d) && (d.unallocated !== 0)), columns: ['id', 'kindLabel', 'company', 'currency', 'amount', 'allocated', 'unallocated', 'coverage', 'proof'] },
      { key: 'corrections', title: '票据更正记录', rows: source.corrections.filter(c => c.date <= q.asOf && [...selectedDocs].some(k => active.get(k)?.id === c.original)), columns: ['id', 'original', 'replacement', 'date', 'reason', 'treatment', 'proof'] },
      { key: 'issues', title: '来源核对缺口', rows: problems.filter(sourceMatch), columns: ['id', 'company', 'currency', 'issue', 'proof'] }
    ] };
  }
  return { views, defaults, fixture, query, docKey };
});
