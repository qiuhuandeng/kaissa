(function () {
  'use strict';
  const cutoff = '2026-05-07';
  const known = v => typeof v === 'number' && Number.isFinite(v);
  const add = values => values.reduce((n, v) => n + Math.round(v * 100), 0) / 100;
  const difference = (a, b) => known(a) && known(b) ? Math.round((a - b) * 100) / 100 : null;
  const unique = rows => [...new Map(rows.map(r => [r.source + ':' + r.id, r])).values()];
  const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
  const between = (date, start, end) => validDate(date) && date >= start && date <= end;
  const views = { summary: '采购汇总', purchases: '采购明细', rebates: '返点核对', allocations: '返点分配' };
  const defaults = { view: 'summary', start: '2026-05-01', end: cutoff, basis: 'purchase', dataset: 'standard', currency: 'CNY', relation: '外部', company: '', department: '', category: '', type: '', supplier: '', quality: '', keyword: '', grouping: 'supplier', unit: 'wan' };
  const suppliers = ['远航航空（演示）', '海湾酒店（演示）', '欧陆地接（演示）', '蓝海邮轮（演示）', '华旅同业（演示）', '北方专列（演示）', '城市车队（演示）', '海湾酒店（演示）', '环游签证（演示）', '安心保险（演示）', '营地服务（演示）', '景区票务（演示）'];
  const categories = ['机票', '酒店', '地接', '邮轮舱位', '完整旅游产品', '专列铺位', '用车', '酒店', '签证', '保险', '营地', '门票'];
  const units = ['张', '间夜', '人次', '舱', '人次', '铺', '车天', '间夜', '份', '份', '人次', '张'];
  const amounts = [120000, 95000, 80000, 60000, 45000, 35000, 25000, 20000, 15000, 12000, 8000, 5000];
  const purchases = amounts.map((amount, i) => ({
    id: 'BUY-' + String(i + 1).padStart(2, '0'), source: '独立采购算例', supplierId: 'S' + (i + 1), supplier: suppliers[i],
    company: i % 2 ? 'B采购公司（演示）' : 'A采购公司（演示）', department: '旅游产品部（演示）',
    relation: '外部', related: i === 4 ? '是' : '否', category: categories[i], type: i === 4 ? '外采产品' : '自营资源',
    contract: 'CG-2026-' + String(i + 1).padStart(2, '0'), line: '1', name: categories[i] + '采购',
    purchaseDate: '2026-05-0' + (i % 5 + 1), confirmed: true, quantity: (i + 1) * 5, quantityUnit: units[i], amount,
    billNo: 'BN-DEMO-' + (i + 1), billDate: i === 0 ? '2026-04-30' : i === 11 ? null : '2026-05-06',
    billConfirmed: i !== 11, billAmount: i === 2 ? amount - 1000 : amount,
    billQuantity: (i + 1) * 5, currency: 'CNY', tax: '价税合计', rate: 1,
    evidence: '采购确认记录 DEMO-CF-' + (i + 1), owner: i % 2 ? '李采购（演示）' : '王采购（演示）',
    tours: i === 0 ? 'DEMO-T01、DEMO-T02' : 'DEMO-T' + (i + 1), version: '演示归属V1'
  }));
  purchases.push(
    { ...purchases[0], id: 'BUY-13', company: 'B采购公司（演示）', contract: 'CG-2026-13', quantity: 2, amount: 10000, billNo: 'BN-DEMO-13', billDate: '2026-05-06', billAmount: 10000, billQuantity: 2 },
    { ...purchases[4], id: 'BUY-14', supplierId: 'SI', supplier: '集团产品公司（演示）', relation: '内部', related: '是', amount: 80000, billAmount: 80000 },
    { ...purchases[6], id: 'BUY-15', supplierId: 'SU', supplier: '待核定范围供应商（演示）', relation: '待确认', amount: 7000, billAmount: 7000 },
    { ...purchases[2], id: 'BUY-16', supplierId: 'SE', supplier: '境外地接（演示）', currency: 'EUR', amount: 5000, billAmount: 5000, rate: null },
    { ...purchases[0], id: 'BUY-17', confirmed: false, amount: 990000, billConfirmed: false, billDate: null }
  );
  purchases.slice(13).forEach((r, i) => { r.contract = 'CG-2026-' + (i + 14); r.billNo = 'BN-DEMO-' + (i + 14); });
  const gaps = [
    { ...purchases[7], id: 'BUY-G1', supplierId: 'SG1', supplier: '金额待补酒店（演示）', amount: null, billAmount: null, department: '', quantity: null, billQuantity: null },
    { ...purchases[0], id: 'BUY-G2', supplierId: 'SG2', supplier: '零金额改签（演示）', amount: 0, billAmount: 0, quantity: 0, billQuantity: 0 }
  ];
  const rebates = [
    { id: 'REB-01', source: '独立返点算例', supplierId: 'S1', supplier: suppliers[0], company: 'A采购公司（演示）', currency: 'CNY', relation: '外部', agreement: 'XY-FD-01', period: '2026-01-01 至 2026-04-30', expectedDate: '2026-05-01', expected: 12000, confirmDate: '2026-05-05', confirmed: 10000, confirmation: 'CF-FD-01', calculation: '协议基数600,000元 × 2%（独立算例）', tax: '价税合计' },
    { id: 'REB-02', source: '独立返点算例', supplierId: 'S2', supplier: suppliers[1], company: 'B采购公司（演示）', currency: 'CNY', relation: '外部', agreement: 'XY-FD-02', period: '2026年5月', expectedDate: '2026-05-02', expected: 3000, confirmDate: null, confirmed: null, confirmation: '', calculation: '预计协议返点，达量待供应商确认', tax: '待确认' },
    { id: 'REB-03', source: '独立返点算例', supplierId: 'S3', supplier: suppliers[2], company: 'A采购公司（演示）', currency: 'CNY', relation: '外部', agreement: 'XY-FD-03', period: '2026年4月', expectedDate: '2026-04-30', expected: 5000, confirmDate: '2026-05-06', confirmed: 4000, confirmation: 'CF-FD-03', calculation: '4月结算差额确认', tax: '价税合计' },
    { id: 'REB-04', source: '独立返点算例', supplierId: 'S4', supplier: suppliers[3], company: 'B采购公司（演示）', currency: 'CNY', relation: '外部', agreement: 'XY-FD-04', period: '2026年5月', expectedDate: '2026-05-03', expected: 1000, confirmDate: '2026-05-06', confirmed: 0, confirmation: 'CF-FD-04', calculation: '未达协议门槛，确认无返点', tax: '价税合计' }
  ];
  const receipts = [
    { id: 'REC-01', source: '独立返点算例', rebate: 'REB-01', date: '2026-05-06', status: '已确认', kind: '冲抵', amount: 6000, reference: 'AP-FD-01', company: rebates[0].company, currency: 'CNY' },
    { id: 'REC-02', source: '独立返点算例', rebate: 'REB-01', date: '2026-05-07', status: '已确认', kind: '收回', amount: 2000, reference: 'RC-FD-01', company: rebates[0].company, currency: 'CNY' },
    { id: 'REC-03', source: '独立返点算例', rebate: 'REB-01', date: '2026-05-08', status: '已确认', kind: '收回', amount: 2000, reference: 'RC-FD-FUTURE', company: rebates[0].company, currency: 'CNY' }
  ];
  const allocations = [
    { id: 'AL-01', source: '独立返点算例', rebate: 'REB-01', date: '2026-05-06', status: '已确认', amount: 6000, tour: 'DEMO-T01', productCompany: 'A产品公司（演示）', department: '欧洲产品部（演示）', originalPeriod: '2026-04', accountingPeriod: '待确认', treatment: '冲减成本', costRecord: 'ADJ-COST-01', costConfirmed: true, evidence: '分配确认记录 FA-01', currency: 'CNY', company: rebates[0].company },
    { id: 'AL-02', source: '独立返点算例', rebate: 'REB-01', date: '2026-05-07', status: '已确认', amount: 3000, tour: 'DEMO-T02', productCompany: 'B产品公司（演示）', department: '欧洲产品部（演示）', originalPeriod: '2026-04', accountingPeriod: '待确认', treatment: '待确认', costRecord: '', evidence: '分配确认记录 FA-02', currency: 'CNY', company: rebates[0].company }
  ];
  function coverage(rows, key) {
    const values = rows.map(r => r[key]).filter(known);
    return { amount: values.length || !rows.length ? add(values) : null, missing: rows.length - values.length };
  }
  function quantityText(rows) {
    const units = new Map(); let missing = 0;
    rows.forEach(r => { if (!known(r.quantity) || !r.quantityUnit) { missing++; return; } units.set(r.quantityUnit, (units.get(r.quantityUnit) || 0) + r.quantity); });
    return [...units].map(([u, v]) => Number(v.toFixed(4)) + ' ' + u).concat(missing ? [missing + ' 条数量待补'] : []).join('；') || '无数量';
  }
  function match(r, f, keys) { return keys.every(k => !f[k] || (f[k] === '__missing' ? !r[k] : r[k] === f[k])); }
  function validate(f) {
    if (!validDate(f.start) || !validDate(f.end) || f.start > f.end) return '请选择有效的起止日期。';
    if (f.end > cutoff) return '结束日期不能晚于资料截止日 ' + cutoff + '。';
    return '';
  }
  function purchaseRows(f, data = purchases) {
    return unique(data).filter(r => r.confirmed && (f.basis !== 'bill' || r.billConfirmed) && between(f.basis === 'bill' ? r.billDate : r.purchaseDate, f.start, f.end))
      .map(r => ({ ...r, purchaseAmount: r.amount, amount: f.basis === 'bill' ? r.billAmount : r.amount, quantity: f.basis === 'bill' ? r.billQuantity : r.quantity, date: f.basis === 'bill' ? r.billDate : r.purchaseDate }))
      .filter(r => match(r, f, ['company', 'department', 'category', 'type', 'supplierId', 'currency', 'relation']))
      .filter(r => !f.supplier || r.supplierId === f.supplier)
      .filter(r => !f.keyword || [r.id, r.name, r.contract, r.billNo, r.supplier, r.tours].join(' ').includes(f.keyword.trim()))
      .filter(r => !f.quality || f.quality === 'amount' && !known(r.amount) || f.quality === 'department' && !r.department);
  }
  function summarize(rows, grouping) {
    const keyFields = { supplier: ['supplierId'], company: ['company'], department: ['company', 'department'], category: ['category'], month: ['date'] }[grouping] || ['supplierId'];
    const groups = new Map();
    rows.forEach(r => { const key = JSON.stringify([r.currency, ...keyFields.map(k => k === 'date' ? r.date.slice(0, 7) : r[k])]); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(r); });
    const total = coverage(rows, 'amount');
    return [...groups].map(([key, group]) => {
      const c = coverage(group, 'amount'), first = group[0];
      const name = grouping === 'supplier' ? first.supplier : grouping === 'department' ? first.company + ' / ' + (first.department || '部门待补充') : grouping === 'month' ? first.date.slice(0, 7) : first[grouping] || '待补充';
      return { key, name, supplierId: first.supplierId, currency: first.currency, amount: c.amount, missing: c.missing, count: group.length, quantity: quantityText(group), share: !total.missing && total.amount > 0 ? c.amount / total.amount * 100 : null };
    }).sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity) || a.key.localeCompare(b.key))
      .map((r, i) => ({ ...r, rank: total.missing ? null : i + 1 }));
  }
  function rebateFacts(r, receiptRows = receipts, allocationRows = allocations) {
    const confirmed = validDate(r.confirmDate) && r.confirmDate <= cutoff && r.confirmation && known(r.confirmed) ? r.confirmed : null;
    const eligible = row => row.rebate === r.id && row.status === '已确认' && between(row.date, r.confirmDate, cutoff) && row.company === r.company && row.currency === r.currency && known(row.amount) && row.amount >= 0;
    const paid = known(confirmed) ? unique(receiptRows).filter(a => eligible(a) && a.reference && ['收回', '冲抵'].includes(a.kind)) : [];
    const assigned = known(confirmed) ? unique(allocationRows).filter(a => eligible(a) && a.evidence) : [];
    const offset = known(confirmed) ? add(paid.filter(a => a.kind === '冲抵').map(a => a.amount)) : null;
    const cash = known(confirmed) ? add(paid.filter(a => a.kind === '收回').map(a => a.amount)) : null;
    const realized = known(confirmed) ? add([offset, cash]) : null;
    const allocated = known(confirmed) ? add(assigned.map(a => a.amount)) : null;
    const overPaid = known(confirmed) && realized > confirmed, overAllocated = known(confirmed) && allocated > confirmed;
    return { ...r, confirmed, variance: difference(confirmed, r.expected), offset, cash, realized, allocated,
      remaining: overPaid ? null : difference(confirmed, realized), unallocated: overAllocated ? null : difference(confirmed, allocated),
      status: !known(confirmed) ? '待确认' : overPaid || overAllocated ? '金额异常' : realized === confirmed ? '已结清' : '未结清',
      issue: overPaid ? '实现额超过确认额' : overAllocated ? '分配额超过确认额' : !known(confirmed) ? '缺返点确认' : '', paid, assigned };
  }
  function run(input = {}) {
    const f = { ...defaults, ...input }, error = validate(f); if (error) throw new Error(error);
    if (f.view === 'summary' || f.view === 'purchases') {
      const rows = purchaseRows(f, f.dataset === 'gaps' ? [...purchases, ...gaps] : purchases), total = coverage(rows, 'amount');
      const groups = summarize(rows, f.grouping), ranking = summarize(rows, 'supplier');
      return { rows, groups, ranking, total, quantity: quantityText(rows), top: coverage(ranking.slice(0, 10), 'amount'), other: coverage(ranking.slice(10), 'amount'), rankReady: !total.missing };
    }
    const facts = rebates.map(r => rebateFacts(r));
    const sharedMatch = r => match(r, f, ['company', 'currency', 'relation']) && (!f.supplier || r.supplierId === f.supplier);
    if (f.view === 'rebates') {
      const rows = facts.filter(sharedMatch).filter(r => between(f.basis === 'confirmed' ? r.confirmDate : r.expectedDate, f.start, f.end))
        .filter(r => f.basis !== 'confirmed' || known(r.confirmed))
        .filter(r => !f.keyword || [r.id, r.supplier, r.agreement, r.confirmation].join(' ').includes(f.keyword.trim()));
      return { rows, facts: rows, receipts: rows.flatMap(r => r.paid), total: Object.fromEntries(['expected', 'confirmed', 'realized', 'remaining', 'allocated', 'unallocated'].map(k => [k, coverage(rows, k)])) };
    }
    const rows = facts.filter(sharedMatch).flatMap(r => r.assigned.map(a => ({ ...a, supplier: r.supplier, agreement: r.agreement, confirmation: r.confirmation,
      costImpact: r.issue || a.treatment !== '冲减成本' || !a.costRecord || !a.costConfirmed ? null : -a.amount })))
      .filter(r => between(r.date, f.start, f.end) && (!f.keyword || [r.id, r.rebate, r.tour, r.costRecord].join(' ').includes(f.keyword.trim())));
    return { rows, total: coverage(rows, 'amount'), cost: coverage(rows, 'costImpact') };
  }
  const api = { cutoff, known, add, difference, unique, validDate, views, defaults, suppliers, purchases, gaps, rebates, receipts, allocations, coverage, quantityText, validate, purchaseRows, summarize, rebateFacts, run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CaesarSupplierReport = api;
})();
