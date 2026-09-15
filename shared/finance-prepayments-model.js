(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./finance-balances-model.js'));
  else root.CaesarPrepayments = factory(root.CaesarBalances);
})(typeof window === 'object' ? window : globalThis, function (b) {
  'use strict';
  const views = { advance: '预收款', deposit: '预存款', prepay: '预付款', guarantee: '保证金' };
  const defaults = { dataset: 'pending', view: 'advance', start: '2026-09-01', end: '2026-09-30', cutoff: '2026-10-31', company: '', currency: '', party: '', risk: '', threshold: '90', direction: '', keyword: '' };
  const kinds = { increase: '增加', use: '使用', offset: '冲抵应付', refund: '确认退回', transferIn: '转入', transferOut: '转出', loss: '批准损失', freeze: '冻结', unfreeze: '解冻', allocate: '团期分摊', returnDue: '应退确认' };
  const balanceSign = { increase: 1, use: -1, offset: -1, refund: -1, transferIn: 1, transferOut: -1, loss: -1 };
  const round = v => Math.round(v * 100) / 100;
  const key = a => JSON.stringify([a.company, a.ledger, a.currency, a.type, a.id]);
  function fixture() {
    const accounts = [], events = [], positions = [];
    function account(id, type, opening, extra = {}) { const a = { id, type, company: '北京凯撒', ledger: '业务账', currency: 'CNY', partyId: 'S1', party: '远洋邮轮公司', direction: type === 'advance' || type === 'deposit' ? '收取' : '支付', opening, openingFrozen: 0, openingAllocated: 0, openingReturn: 0, openingDate: '2026-09-01', history: true, proof: '期初确认-' + id, since: '2026-01-01', returnDue: '', ...extra }; accounts.push(a); return a; }
    function event(a, id, kind, amount, date = '2026-09-10', extra = {}) { events.push({ account: key(a), id, kind, amount, date, recorded: date, confirmed: true, proof: '确认-' + id, reference: '依据-' + id, ...extra }); }
    const a = account('YS-001', 'advance', 10000, { partyId: 'C1', party: '华光科技有限公司', since: '2026-08-01' });
    event(a, 'SK-001', 'increase', 5000); event(a, 'HX-001', 'use', 6000); event(a, 'TK-001', 'refund', 1000); event(a, 'DJ-001', 'freeze', 2000);
    event(a, 'SQ-001', 'refund', 3000, '2026-09-20', { confirmed: false });
    const d = account('YC-001', 'deposit', 20000, { partyId: 'STORE-01', party: '王府井加盟门店', since: '2026-08-01' });
    event(d, 'CZ-001', 'increase', 5000); event(d, 'DJ-002', 'freeze', 4000); event(d, 'JD-002', 'unfreeze', 1000); event(d, 'KK-002', 'use', 1000);
    const p = account('YF-001', 'prepay', 300000, { openingAllocated: 0, since: '2026-05-20', returnDue: '2026-09-15' });
    event(p, 'FT-A', 'allocate', 120000, '2026-09-01', { reference: '航次A分摊确认' }); event(p, 'FT-B', 'allocate', 80000, '2026-09-01', { reference: '航次B分摊确认' });
    event(p, 'CD-001', 'offset', 60000); event(p, 'YT-001', 'returnDue', 30000); event(p, 'TH-001', 'refund', 10000, '2026-09-20'); event(p, 'TH-002', 'refund', 20000, '2026-10-05');
    event(p, 'CD-002', 'offset', 50000, '2026-09-22', { confirmed: false });
    positions.push({ account: key(p), date: '2026-09-30', unperformed: 80000, proof: '航次B未履约预付分配确认', batch: 'CRU-BLK-01', tour: '航次B' });
    const g1 = account('BZ-OUT', 'guarantee', 50000, { returnDue: '2026-09-01' }); event(g1, 'YT-BZ', 'returnDue', 50000); event(g1, 'TH-BZ', 'refund', 10000);
    account('BZ-IN', 'guarantee', 30000, { direction: '收取', party: '加盟商', partyId: 'STORE-02' });
    account('YF-GAP', 'prepay', 8000, { history: false, company: '福建凯撒', partyId: 'S2', party: '地接合作社' });
    const foreign = account('YF-EUR', 'prepay', 1000, { currency: 'EUR', since: '2026-09-01' }); event(foreign, 'CD-EUR', 'offset', 200);
    account('YF-ZERO', 'prepay', 0, { partyId: 'S3', party: '已结清供应商' });
    const bad = account('YC-BAD', 'deposit', 1000, { party: '待核对门店', partyId: 'STORE-03' }); event(bad, 'DJ-BAD', 'freeze', 2000);
    for (let i = 1; i <= 25; i++) account('YF-PAGE-' + String(i).padStart(2, '0'), 'prepay', i * 100, { partyId: 'PAGE-' + i, party: i === 25 ? '=分页供应商,"测试"\n第二行' : '分页供应商' + i, since: '2026-09-01' });
    return { accounts, events, positions, coverageEnd: '2026-10-31' };
  }
  function query(input, supplied) {
    const q = { ...defaults, ...input }, source = supplied || fixture();
    if (!views[q.view] || !['pending', 'demo'].includes(q.dataset)) throw Error('资料范围或视图无效');
    if (![q.start, q.end, q.cutoff].every(b.dateOK) || q.start > q.end || q.end > q.cutoff) throw Error('请核对期间和资料截止');
    if (!/^\d+$/.test(String(q.threshold)) || +q.threshold > 3650) throw Error('占用天数须为0至3650的整数');
    const sections = rows => [
      { key: 'totals', title: '公司、类别、方向与原币合计', rows: summarize(rows), columns: ['company', 'ledger', 'typeName', 'direction', 'currency', 'opening', 'increase', 'used', 'refunded', 'transferIn', 'transferOut', 'loss', 'closing', 'frozen', 'available', 'coverage'] },
    ];
    if (q.dataset === 'pending' || q.end > source.coverageEnd) return { rows: [], sections: [], pending: true, notice: '来源待接入或超出历史覆盖，不提供推算余额' };
    const issues = [], evidence = [], positions = [], rows = [], seenAccounts = new Map(), conflicts = new Set();
    for (const a of source.accounts) { const k = key(a); if (!seenAccounts.has(k)) seenAccounts.set(k, a); else if (JSON.stringify(seenAccounts.get(k)) !== JSON.stringify(a)) conflicts.add(k); }
    for (const a of seenAccounts.values()) {
      if (a.type !== q.view || q.company && q.company !== a.company || q.currency && q.currency !== a.currency || q.direction && q.direction !== a.direction || q.party && ![a.party, a.partyId].join(' ').includes(q.party) || q.keyword && ![a.id, a.party, a.batch].join(' ').includes(q.keyword)) continue;
      const k = key(a), errs = [];
      const valid = v => Number.isFinite(v) && v >= 0;
      if (!a.history || !a.proof || !a.company || !a.ledger || !a.currency || !a.partyId || !['收取', '支付'].includes(a.direction) || !b.dateOK(a.openingDate) || a.openingDate > q.start || !valid(a.opening) || !valid(a.openingFrozen) || !valid(a.openingAllocated) || !valid(a.openingReturn) || conflicts.has(k)) errs.push('期初、身份或历史确认资料不足/冲突');
      let opening = a.opening, closing = a.opening, frozen = a.openingFrozen, allocated = a.openingAllocated, refundDue = a.openingReturn;
      const movement = { increase: 0, used: 0, refunded: 0, transferIn: 0, transferOut: 0, loss: 0 }, seen = new Map();
      for (const r of source.events.filter(r => r.account === k && (!b.dateOK(r.recorded) || r.recorded <= q.cutoff)).sort((x, y) => x.date.localeCompare(y.date))) {
        let inclusion = '纳入';
        if (!r.confirmed) inclusion = '申请/待确认，不纳入';
        else if (b.dateOK(r.date) && r.date > q.end) inclusion = '期后发生，不纳入';
        else if (seen.has(r.id)) { inclusion = JSON.stringify(seen.get(r.id)) === JSON.stringify(r) ? '重复记录，不重计' : '同号冲突，余额待核对'; if (inclusion.includes('冲突')) errs.push(inclusion); }
        else if (!r.id || !kinds[r.kind] || !valid(r.amount) || !b.dateOK(r.date) || !b.dateOK(r.recorded) || r.date < a.openingDate || !r.proof || !r.reference) { inclusion = '已确认变动缺依据'; errs.push(inclusion); }
        else {
          seen.set(r.id, r);
          const signed = (balanceSign[r.kind] || 0) * r.amount;
          closing = round(closing + signed); if (r.date < q.start) opening = round(opening + signed);
          if (r.kind === 'freeze') frozen = round(frozen + r.amount);
          if (r.kind === 'unfreeze') frozen = round(frozen - r.amount);
          if (r.kind === 'allocate') allocated = round(allocated + r.amount);
          if (r.kind === 'returnDue') refundDue = round(refundDue + r.amount);
          if (r.kind === 'refund') refundDue = round(Math.max(0, refundDue - r.amount));
          if (r.date >= q.start) { const field = { increase: 'increase', use: 'used', offset: 'used', refund: 'refunded', transferIn: 'transferIn', transferOut: 'transferOut', loss: 'loss' }[r.kind]; if (field) movement[field] = round(movement[field] + r.amount); }
          if (closing < 0 || frozen < 0 || frozen > closing) errs.push('余额或冻结超过可核对范围');
        }
        evidence.push({ ...a, ...r, accountId: a.id, kindName: kinds[r.kind] || '未知变动', inclusion });
      }
      const pos = source.positions.filter(p => p.account === k && p.date === q.end);
      const unperformed = pos.length && pos.every(p => valid(p.unperformed) && p.proof) ? b.sum(pos.map(p => p.unperformed)) : null;
      if (unperformed != null && unperformed > closing) errs.push('未履约占用超过账面余额');
      if (refundDue > closing) errs.push('应退余额超过账面余额');
      const days = b.dateOK(a.since) ? Math.max(0, b.days(q.end, a.since)) : null;
      const overdueReturn = b.dateOK(a.returnDue) ? a.returnDue < q.end ? refundDue : 0 : refundDue ? null : 0;
      const r = { ...a, ...movement, typeName: views[a.type], opening, closing, frozen, available: round(closing - frozen), allocated, refundDue, overdueReturn, unperformed, days, coverage: errs.length ? '余额资料不足' : '已知余额', risk: errs.length ? '资料不足' : overdueReturn > 0 ? '应退未退' : closing > 0 && days != null && days >= +q.threshold ? '长期未结' : closing === 0 ? '已结清' : '正常持有' };
      if (errs.length) ['opening', 'closing', 'frozen', 'available', 'refundDue', 'overdueReturn', 'unperformed'].forEach(f => r[f] = null);
      if (q.risk === '长期未结' ? !(r.closing > 0 && r.days != null && r.days >= +q.threshold) : q.risk && q.risk !== r.risk) continue;
      rows.push(r); errs.forEach(issue => issues.push({ ...a, issue })); positions.push(...pos.map(p => ({ ...a, ...p })));
    }
    const selected = new Set(rows.map(key));
    return { rows, pending: false, notice: '独立验收算例 · 非正式账务 · ' + q.start + '至' + q.end + ' · 资料截止' + q.cutoff + ' · 元/原币，类别方向不混加', sections: [...sections(rows),
      { key: 'events', title: '完整历史变动与依据', rows: evidence.filter(r => selected.has(key({ ...r, id: r.accountId }))), columns: ['accountId', 'id', 'company', 'currency', 'kindName', 'date', 'recorded', 'amount', 'reference', 'proof', 'inclusion'] },
      { key: 'positions', title: '未履约占用来源', rows: positions, columns: ['id', 'company', 'currency', 'date', 'batch', 'tour', 'unperformed', 'proof'] },
      { key: 'issues', title: '来源缺口', rows: issues, columns: ['id', 'company', 'party', 'currency', 'issue', 'proof'] } ] };
  }
  function summarize(rows) {
    const groups = new Map();
    for (const r of rows) { const k = JSON.stringify([r.company, r.ledger, r.currency, r.type, r.direction]); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
    return [...groups.values()].map(rs => {
      const out = { ...rs[0], coverage: rs.filter(r => r.closing == null).length + '条余额缺数' };
      for (const k of ['opening', 'increase', 'used', 'refunded', 'transferIn', 'transferOut', 'loss', 'closing', 'frozen', 'available']) { const values = rs.map(r => r.closing == null ? null : r[k]).filter(v => v != null); out[k] = values.length ? b.sum(values) : null; }
      return out;
    });
  }
  return { views, defaults, fixture, query, key, summarize };
});
