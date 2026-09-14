(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CaesarCashflow = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const types = { receipt: '收款', refund: '退款', transfer: '转款', payment: '付款' };
  const scenarios = {
    CF01: '合并收款三单分配', CF02: '部分分配与资料不全', CF03: '一单多笔原款', CF04: '截图申请与未识别到账',
    CF05: '付款回单与核销去重', CF06: '退款结果待核实', CF07: '退款转预存', CF08: '连续转款后退款',
    CF09: '退款对应两笔原款', CF10: '合并付款逐单分配', CF11: '批次预付及冲抵', CF12: '银行提交与出纳确认',
    CF13: '付款退回及重付', CF14: '跨期转款冲回', CF15: '迟到记录', CF16: '外币与零金额',
    CF17: '资金公司与合同公司', CF18: '已付归档与未付作废', CF19: '平台清算与现金存行', CF20: '超分及资料缺失', CF21: '多公司打印清单'
  };
  const money = v => typeof v === 'number' && Number.isFinite(v);
  const sum = values => values.reduce((n, v) => n + (money(v) ? Math.round(v * 100) : 0), 0) / 100;
  const fmt = v => money(v) ? v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '未提供';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const day = v => /^\d{4}-\d{2}-\d{2}/.test(v || '') ? v.slice(0, 10) : '';
  const endTime = v => v && (v.length === 10 ? v + 'T23:59:59.999' : v.length === 16 ? v + ':59.999' : v);
  const key = r => [r.source, r.company, r.account, r.id].join('|');

  function fixture() {
    const records = [], allocations = [], evidence = [];
    function add(c, type, id, amount, more = {}) {
      const r = Object.assign({ case: c, type, id, source: '独立验收资料', company: '北京凯撒旅游', account: '招商银行 ****6628',
        accountCompany: '北京凯撒旅游', currency: 'CNY', amount, requested: amount, direction: type === 'receipt' ? 'in' : 'out',
        actualAt: '2026-09-14T10:00:00', confirmedAt: '2026-09-14T11:00:00', appliedAt: '2026-09-13T09:00:00', enteredAt: '2026-09-14T12:00:00',
        verified: true, complete: true, party: type === 'payment' ? '欧洲地接ABC' : '张建国', method: '银行转账', category: type === 'payment' ? '普通付款' : '团款',
        transaction: 'BANK-' + id, execution: 'EX-' + id, proof: '水单-' + id + '.pdf', confirmedBy: '李梅', internal: '外部',
        status: '已核实', contractCompany: '北京凯撒旅游', productCompany: '北京凯撒旅游', department: '出境事业部',
        store: '朝阳门店', center: '', salesperson: '王强', product: '欧洲十国经典游', distributor: '北京阳光旅行社',
        departure: '2026-09-20', returned: '2026-09-30', note: '', fee: 0, rate: null, converted: null, root: '', previous: '', originalOrder: ''
      }, more);
      if (type === 'transfer') Object.assign(r, { noncash: true, actualAt: null, transaction: more.transaction || '', toCompany: more.toCompany || r.company });
      records.push(r); return r;
    }
    function alloc(r, order, amount, more = {}) {
      const a = Object.assign({ id: 'AL-' + r.id + '-' + (allocations.length + 1), sourceKey: key(r), order, amount,
        confirmedAt: r.confirmedAt, enteredAt: r.enteredAt, verified: true, root: r.type === 'receipt' ? r.id : r.root,
        kind: r.type === 'transfer' ? '订单转款' : '款项分配', target: (r.type === 'receipt' ? 'AR-' : 'AP-') + order,
        fromOrder: r.fromOrder || '', toOrder: r.toOrder || '', contractCompany: r.contractCompany, department: r.department,
        store: r.store, center: r.center, productCompany: r.productCompany, salesperson: r.salesperson, product: r.product,
        departure: r.departure, returned: r.returned, distributor: r.distributor, note: r.note
      }, more);
      allocations.push(a); return a;
    }
    function proof(r, kind, amount, more = {}) {
      const e = Object.assign({ id: 'EV-' + (evidence.length + 1), sourceKey: key(r), kind, amount, currency: r.currency,
        date: r.confirmedAt, enteredAt: r.enteredAt, reference: r.id, note: '', verified: true }, more);
      evidence.push(e); return e;
    }
    let r = add('CF01', 'receipt', 'SK26090101', 100000);
    [30000, 40000, 30000].forEach((n, i) => alloc(r, 'KS202609010' + (i + 1), n));
    r = add('CF02', 'receipt', 'SK26090201', 100000); alloc(r, 'KS2026090201', 60000);
    r = add('CF02', 'receipt', 'SK26090202', 100000, { complete: false }); alloc(r, 'KS2026090202', 60000);
    [30000, 20000].forEach((n, i) => { r = add('CF03', 'receipt', 'SK2609030' + i, n); alloc(r, 'KS2026090301', n); });
    add('CF04', 'receipt', 'RK26090401', null, { requested: 10000, verified: false, actualAt: null, proof: '客户截图.jpg', status: '认款待复核' });
    add('CF04', 'receipt', 'SK26090402', 12000, { party: '未识别交款人', status: '到账未认领' });
    r = add('CF05', 'payment', 'FK26090501', 10000); alloc(r, 'KS2026090501', 6000); alloc(r, 'KS2026090502', 4000);
    proof(r, '应付核销', 6000, { reference: 'HX26090501' }); proof(r, '应付核销', 4000, { reference: 'HX26090502' });
    const p = proof(r, '付款回单', 10000, { reference: 'HD26090501' }); evidence.push({ ...p }); records.push({ ...r });
    add('CF06', 'refund', 'TK26090601', null, { requested: 9600, verified: false, actualAt: null, status: '银行结果待核实' });
    add('CF06', 'refund', 'TK26090602', 9600, { status: '已退款待核销' });
    const root7 = add('CF07', 'receipt', 'SK26090701', 3200); alloc(root7, 'KS2026090701', 3200);
    r = add('CF07', 'refund', 'TK26090701', 3200, { noncash: true, method: '转预存', root: root7.id, transaction: '', actualAt: null, status: '已转预存' }); alloc(r, 'KS2026090701', 3200);
    const root8 = add('CF08', 'receipt', 'SK26090801', 10000, { originalOrder: 'KS2026090801' }); alloc(root8, root8.originalOrder, 10000);
    r = add('CF08', 'transfer', 'ZK26090801', 6000, { root: root8.id, originalOrder: root8.originalOrder, fromOrder: root8.originalOrder, toOrder: 'KS2026090802', transaction: root8.transaction }); alloc(r, r.toOrder, 6000);
    r = add('CF08', 'transfer', 'ZK26090802', 4000, { root: root8.id, previous: r.id, originalOrder: root8.originalOrder, fromOrder: 'KS2026090802', toOrder: 'KS2026090803', transaction: root8.transaction }); alloc(r, r.toOrder, 4000);
    r = add('CF08', 'refund', 'TK26090801', 3000, { root: root8.id, previous: r.id, originalOrder: root8.originalOrder, order: 'KS2026090803' }); alloc(r, r.order, 3000);
    const roots9 = [4000, 2000].map((n, i) => add('CF09', 'receipt', 'SK2609090' + i, n));
    r = add('CF09', 'refund', 'TK26090901', 6000, { order: 'KS2026090901' }); roots9.forEach(s => alloc(r, r.order, s.amount, { root: s.id }));
    r = add('CF10', 'payment', 'FK26091001', 12000); alloc(r, 'KS2026091001', 7000); alloc(r, 'KS2026091002', 5000);
    r = add('CF11', 'payment', 'FK26091101', 12000, { category: '批次预付', purchase: 'CG26091101' }); proof(r, '预付冲抵', 5000, { reference: 'CD26091101' });
    add('CF12', 'payment', 'FK26091201', null, { requested: 8000, verified: false, actualAt: null, status: '银行已提交' });
    add('CF12', 'payment', 'FK26091202', 8000, { proof: '出纳确认记录QR26091202（纸质水单已核）', status: '出纳已确认', electronicReceipt: false });
    r = add('CF13', 'payment', 'FK26091301', 10000); proof(r, '付款回单', 10000);
    add('CF13', 'payment', 'TH26091301', 9900, { direction: 'in', original: r.id, category: '银行退回', fee: 100, requested: null });
    add('CF13', 'payment', 'FK26091302', 10000, { original: r.id, retry: 2 });
    const root14 = add('CF14', 'receipt', 'SK26091401', 6000); alloc(root14, 'KS2026091401', 6000);
    r = add('CF14', 'transfer', 'ZK26091401', 6000, { root: root14.id, fromOrder: 'KS2026091401', toOrder: 'KS2026091402', originalOrder: 'KS2026091401' }); alloc(r, r.toOrder, 6000);
    r = add('CF14', 'transfer', 'ZK26101401', -6000, { root: root14.id, original: r.id, fromOrder: 'KS2026091401', toOrder: 'KS2026091402', originalOrder: 'KS2026091401', confirmedAt: '2026-10-04T10:00:00', enteredAt: '2026-10-04T11:00:00', status: '冲回已确认', reason: '订单转款冲回' }); alloc(r, r.toOrder, -6000, { kind: '转款冲回' });
    add('CF15', 'receipt', 'SK26093001', 3000, { actualAt: '2026-09-30T23:59:59', confirmedAt: '2026-10-02T09:00:00', enteredAt: '2026-10-02T10:00:00' });
    add('CF16', 'receipt', 'SK26091601', 1000); add('CF16', 'receipt', 'SK26091602', 100, { currency: 'USD' }); add('CF16', 'receipt', 'SK26091603', 0);
    r = add('CF17', 'receipt', 'SK26091701', 8000, { contractCompany: '福建凯撒旅游' }); alloc(r, 'KS2026091701', 8000);
    r = add('CF17', 'receipt', 'SK26091702', 8000, { conflictRef: 'BANK-CONFLICT-17' });
    records.push({ ...r, company: '福建凯撒旅游', accountCompany: '福建凯撒旅游' });
    add('CF18', 'payment', 'FK26091801', 5000, { status: '已关闭', note: '已付归档' });
    add('CF18', 'payment', 'FK26091802', null, { requested: 5000, verified: false, actualAt: null, status: '已关闭', note: '未付作废' });
    r = add('CF19', 'receipt', 'SK26091901', 9700, { method: '平台净结算', fee: 300, gross: 10000, category: '平台结算款' });
    alloc(r, 'KS2026091901', 9700); proof(r, '平台订单结算毛额', 10000); proof(r, '平台手续费', 300); proof(r, '提现入银行（同笔）', 9700);
    r = add('CF19', 'receipt', 'SK26091902', 1000, { method: '现金', account: '现金账户', transaction: 'CASH26091902', proof: '现金收讫确认QR26091902' });
    alloc(r, 'KS2026091902', 1000); proof(r, '现金存行（同笔）', 1000);
    r = add('CF20', 'receipt', 'SK26092001', 10000); alloc(r, 'KS2026092001', 12000);
    r = add('CF20', 'transfer', 'ZK26092001', 1000, { root: '原款未对应', fromOrder: 'KS2026092001', toOrder: 'KS2026092002' }); alloc(r, r.toOrder, 1000);
    add('CF20', 'receipt', 'SK26092002', null); add('CF20', 'receipt', 'SK26092003', 3000, { actualAt: null });
    for (let i = 1; i <= 25; i++) {
      r = add('CF21', 'receipt', 'SK260921' + String(i).padStart(3, '0'), i * 100, {
        company: i % 2 ? '北京凯撒旅游' : '福建凯撒旅游', accountCompany: i % 2 ? '北京凯撒旅游' : '福建凯撒旅游',
        party: i === 1 ? '=外部文本,"测试"\n第二行' : ['陈红', '赵明', '孙丽'][i % 3], internal: i === 25 ? '集团内部' : '外部'
      }); alloc(r, 'KS20260921' + String(i).padStart(3, '0'), r.amount);
    }
    return { records, allocations, evidence, start: '2026-09-01', end: '2026-10-31', historical: true };
  }
  const defaults = type => ({ dataset: 'pending', type: types[type] ? type : 'receipt', mode: 'documents', case: '', start: '2026-09-01', end: '2026-10-31',
    dateBasis: type === 'transfer' ? 'confirmedAt' : 'actualAt', cutoff: '2026-10-31T23:59', company: '', currency: '', account: '', category: '', method: '', status: '', internal: '', keyword: '', order: '', contractCompany: '', department: '', store: '', center: '' });
  function validate(q) {
    if (q.start && q.end && q.start > q.end) return '开始日期不能晚于结束日期';
    if (!['actualAt', 'appliedAt', 'confirmedAt'].includes(q.dateBasis)) return '日期依据无效';
    return '';
  }
  // Reimports are deduplicated by source identity; conflicting versions remain quarantined.
  function unique(rows, identity) {
    const groups = new Map(), accepted = [], rejected = [];
    rows.forEach(r => { const k = identity(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
    groups.forEach(list => {
      const same = list.every(r => JSON.stringify(r) === JSON.stringify(list[0]));
      if (same) { accepted.push(list[0]); list.slice(1).forEach(r => rejected.push({ ...r, issue: '同源重复，未重复计数' })); }
      else list.forEach(r => rejected.push({ ...r, issue: '同源资料冲突，未纳入合计' }));
    });
    return { accepted, rejected };
  }
  function query(input, data) {
    const q = { ...defaults(input.type), ...input }, error = validate(q);
    if (error) throw new Error(error);
    const empty = { q, rows: [], sources: [], allocations: [], evidence: [], trace: [], exceptions: [], totals: [], notice: '正式资金、分配及核销来源待接入', pending: true };
    if (q.dataset !== 'demo') return empty;
    data = data || fixture();
    if (!data.historical && q.cutoff) return { ...empty, notice: '来源不支持历史资料截止查询' };
    const cutoff = endTime(q.cutoff);
    const available = r => !cutoff || (r.enteredAt && r.enteredAt <= cutoff);
    const origin = data.records.filter(available);
    const dedup = unique(origin, key);
    const conflictGroups = new Map();
    origin.filter(r => r.conflictRef).forEach(r => { const k = r.source + '|' + r.conflictRef; if (!conflictGroups.has(k)) conflictGroups.set(k, new Set()); conflictGroups.get(k).add(key(r)); });
    const common = r => r.type === q.type && (!q.case || r.case === q.case) && ['company', 'currency', 'category', 'method', 'internal'].every(k => !q[k] || r[k] === q[k]) && (!q.account || (r.account || '').includes(q.account));
    const byId = new Map(dedup.accepted.map(r => [r.id, r]));
    const aDedup = unique(data.allocations.filter(available), r => r.sourceKey + '|' + r.id);
    const eDedup = unique(data.evidence.filter(available), r => r.sourceKey + '|' + r.id);
    const exceptions = dedup.rejected.filter(common).map(r => ({ ...r, issue: r.issue }));
    const sources = [], allocations = [];
    function chain(r) {
      const result = [], seen = new Set(); let next = r.previous;
      while (next && !seen.has(next)) { seen.add(next); const p = byId.get(next); if (!p) return { rows: result, issue: '中间转款记录缺失' }; result.unshift(p); next = p.previous; }
      return { rows: result, issue: next ? '原款关系循环' : '' };
    }
    for (const raw of dedup.accepted.filter(common)) {
      const r = { ...raw }, issues = [];
      if (r.conflictRef && conflictGroups.get(r.source + '|' + r.conflictRef).size > 1) issues.push('资金归属冲突');
      if (!r.company || !r.accountCompany || r.company !== r.accountCompany) issues.push('账户所属公司未核对');
      if (!r.currency) issues.push('币种未提供');
      if (!money(r.amount)) issues.push('实际金额未提供');
      if (!r.verified) issues.push('资金结果未核实');
      if (r.type === 'transfer' && r.company !== r.toCompany) issues.push('跨主体转款待核对');
      const trail = chain(r); if (trail.issue) issues.push(trail.issue);
      if (r.root && (!byId.has(r.root) || byId.get(r.root).type !== 'receipt')) issues.push('原款关系缺失');
      if (['transfer', 'refund'].includes(r.type) && !r.root && !aDedup.accepted.some(a => a.sourceKey === key(r) && a.root)) issues.push('原款关系缺失');
      const as = aDedup.accepted.filter(a => a.sourceKey === key(r));
      const allocationSum = sum(as.filter(a => a.verified).map(a => a.amount));
      const excess = money(r.amount) && Math.abs(allocationSum) > Math.abs(r.amount) + 0.005;
      if (excess) issues.push('分配超过原款');
      if (!r.complete) issues.push('分配资料不全');
      r.cashValid = r.verified && money(r.amount) && !!day(r.actualAt) && !r.noncash && !issues.some(s => /公司|归属冲突|币种/.test(s));
      r.confirmValid = r.verified && money(r.amount) && !!day(r.confirmedAt) && !issues.some(s => /原款|转款|公司|归属冲突|币种/.test(s));
      r.cashIn = r.noncash ? 0 : r.cashValid && r.direction === 'in' ? r.amount : r.cashValid ? 0 : null;
      r.cashOut = r.noncash ? 0 : r.cashValid && r.direction === 'out' ? r.amount : r.cashValid ? 0 : null;
      r.nonCashAmount = r.noncash && r.confirmValid ? r.amount : r.noncash ? null : 0;
      const aa = as.map(a => {
        const rootMissing = ['refund', 'transfer'].includes(r.type) && (!a.root || !byId.has(a.root));
        const valid = a.verified && money(a.amount) && !excess && !rootMissing && (r.noncash ? r.confirmValid : r.cashValid) && !!day(a.confirmedAt);
        return { ...r, ...a, sourceId: r.id, id: a.id, valid, allocation: valid ? a.amount : null,
          issue: !a.verified ? '分配待确认' : rootMissing ? '原款关系缺失' : excess ? '分配超过原款' : !valid ? '分配依据未核实' : '',
          result: valid ? '分配已核实' : '分配待核对', transaction: r.transaction };
      });
      r.allocated = aa.length ? sum(aa.filter(a => a.valid).map(a => a.amount)) : 0;
      r.unallocated = r.complete && !excess && r.cashValid ? sum([r.amount, -r.allocated]) : null;
      r.root = r.root || [...new Set(as.map(a => a.root).filter(Boolean))].join(' / ');
      r.order = r.order || [...new Set(as.map(a => a.order).filter(Boolean))].join(' / ');
      r.chain = trail.rows.map(p => p.id).join(' → ');
      r.writeoff = sum(eDedup.accepted.filter(e => e.sourceKey === key(r) && e.kind === '应付核销' && e.verified).map(e => e.amount));
      r.issue = issues.join('；'); r.result = r.issue || r.status;
      const keyword = !q.keyword || [r.id, r.execution, r.transaction, r.root, r.party, r.proof].some(v => String(v || '').toLowerCase().includes(q.keyword.toLowerCase()));
      if (!keyword || (q.status && !r.result.includes(q.status))) continue;
      const allocationMatch = a => (!q.order || [a.order, a.fromOrder, a.toOrder].some(v => (v || '').includes(q.order))) && ['contractCompany', 'department', 'store', 'center'].every(k => !q[k] || (a[k] || '').includes(q[k]));
      let selectedAllocations = aa.filter(allocationMatch);
      if (['order', 'contractCompany', 'department', 'store', 'center'].some(k => q[k]) && !selectedAllocations.length) continue;
      const inPeriod = date => (!q.start || date >= q.start) && (!q.end || date <= q.end);
      if (q.mode === 'allocations' && q.dateBasis === 'confirmedAt' && aa.length) {
        selectedAllocations = selectedAllocations.filter(a => {
          const date = day(a.confirmedAt);
          if (!date) exceptions.push({ ...a, issue: '分配确认日期缺失' });
          return date && inPeriod(date);
        });
        if (!selectedAllocations.length) continue;
      } else {
        const date = day(r[q.dateBasis]);
        if (!date) { exceptions.push({ ...r, issue: '所选日期缺失' + (r.issue ? '；' + r.issue : '') }); continue; }
        if (!inPeriod(date)) continue;
      }
      sources.push(r); allocations.push(...selectedAllocations);
      if (r.issue) exceptions.push(r);
      selectedAllocations.filter(a => a.issue).forEach(a => exceptions.push(a));
    }
    const sourceKeys = new Set(sources.map(key));
    const ev = eDedup.accepted.filter(e => sourceKeys.has(e.sourceKey));
    [...aDedup.rejected, ...eDedup.rejected].filter(e => sourceKeys.has(e.sourceKey)).forEach(e => exceptions.push(e));
    const traceIds = new Set();
    function visit(id) { if (!id || traceIds.has(id)) return; const r = byId.get(id); if (!r) return; traceIds.add(id); visit(r.root); visit(r.previous); visit(r.original); }
    sources.forEach(r => { visit(r.id); data.allocations.filter(a => a.sourceKey === key(r) && available(a)).forEach(a => visit(a.root)); });
    const totals = new Map();
    sources.forEach(r => {
      const k = r.company + '|' + r.currency;
      if (!totals.has(k)) totals.set(k, { company: r.company || '公司未对应', currency: r.currency || '币种未提供', cashIn: [], cashOut: [], noncash: [], allocation: [], unallocated: [], unknown: 0, internal: 0 });
      const t = totals.get(k); t.cashIn.push(r.cashIn); t.cashOut.push(r.cashOut); t.noncash.push(r.nonCashAmount); t.unallocated.push(r.unallocated);
      if (!r.cashValid && !r.noncash) t.unknown++;
      if (r.internal === '集团内部') t.internal++;
    });
    allocations.filter(a => a.valid).forEach(a => totals.get(a.company + '|' + a.currency).allocation.push(a.amount));
    const groups = [...totals.values()].map(t => ({ ...t, cashIn: sum(t.cashIn), cashOut: sum(t.cashOut), noncash: sum(t.noncash), allocation: sum(t.allocation),
      unallocated: t.unallocated.some(v => !money(v)) ? null : sum(t.unallocated), netOut: sum(t.cashOut) - sum(t.cashIn) }));
    return { q, sources, allocations, evidence: ev, trace: [...traceIds].map(id => byId.get(id)), exceptions, totals: groups,
      rows: q.mode === 'allocations' ? allocations : sources, pending: false,
      notice: (q.start && q.start < data.start) || (q.end && q.end > data.end) ? '所选期间超出资料覆盖期，资料不足' : '独立验收算例 · 非正式账务数据' };
  }
  function csvCell(value) {
    let s = String(value ?? '未提供');
    if (typeof value !== 'number' && /^[\s\uFEFF]*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  const csv = rows => '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
  function sort(rows, field, direction) {
    return [...rows].sort((a, b) => {
      const x = a[field], y = b[field];
      if (x == null) return y == null ? 0 : 1;
      if (y == null) return -1;
      return (money(x) && money(y) ? x - y : String(x).localeCompare(String(y), 'zh-CN', { numeric: true })) * direction;
    });
  }
  return { types, scenarios, defaults, fixture, query, key, sum, fmt, esc, money, csv, sort, validate };
});
