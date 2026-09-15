(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./finance-balances-model.js'), require('./finance-prepayments-model.js'));
  else root.CaesarFunds = factory(root.CaesarBalances, root.CaesarPrepayments);
})(typeof window === 'object' ? window : globalThis, function (b, prepay) {
  'use strict';
  const views = { accounts: '账户余额', movements: '实际收支', periods: '日周月收支', plan: '未来资金安排' };
  const defaults = { dataset: 'pending', view: 'accounts', start: '2026-09-01', end: '2026-09-30', cutoff: '2026-10-31', frequency: 'day', company: '', currency: '', account: '', nature: '', keyword: '', planStart: '2026-10-01', planEnd: '2026-12-31' };
  const round = v => Math.round(v * 100) / 100;
  function fixture() {
    const accounts = [
      { id: 'BANK-BJ', company: '北京凯撒', name: '招商银行北京账户', number: '7559 **** 1026', currency: 'CNY', opening: 100000, restricted: 10000 },
      { id: 'PLATFORM-BJ', company: '北京凯撒', name: '已核验支付商户', number: '商户 **** 001', currency: 'CNY', opening: 0, restricted: 0 },
      { id: 'BANK-FJ', company: '福建凯撒', name: '民生银行福建账户', number: '6214 **** 0038', currency: 'CNY', opening: 20000, restricted: 0 },
      { id: 'BANK-EUR', company: '北京凯撒', name: '欧元账户', number: 'EUR **** 001', currency: 'EUR', opening: 1000, restricted: 0, rate: 7.8, rateDate: '2026-09-30', rateProof: '财务折算资料-20260930' },
      { id: 'LIABILITY', company: '北京凯撒', name: '客户预收责任台账', currency: 'CNY', opening: 999999, restricted: 0, kind: '款项责任' },
      { id: 'GAP', company: '待核对公司', name: '历史待补账户', currency: 'CNY', opening: null, restricted: null, history: false, gap: true }
    ].map(a => ({ kind: '实际账户', history: true, start: '2026-09-01', proof: '期初确认-' + a.id, ...a }));
    const flows = [];
    const add = (id, account, date, incoming, outgoing, extra = {}) => flows.push({ id, account, date, incoming, outgoing, recorded: date, confirmed: true, nature: '外部收支', proof: '出纳/银行确认-' + id, party: '客户或供应商', ...extra });
    add('BANK-IN', 'BANK-BJ', '2026-09-05', 10000, 0); add('BANK-OUT', 'BANK-BJ', '2026-09-08', 0, 5000);
    add('TRANSFER-OUT', 'BANK-BJ', '2026-09-10', 0, 10000, { nature: '内部转账', transfer: 'DB-001', peer: 'TRANSFER-IN' });
    add('TRANSFER-IN', 'BANK-FJ', '2026-09-10', 10000, 0, { nature: '内部转账', transfer: 'DB-001', peer: 'TRANSFER-OUT' });
    add('PAY-IN', 'PLATFORM-BJ', '2026-09-12', 3000, 0); add('PAY-FEE', 'PLATFORM-BJ', '2026-09-12', 0, 100, { party: '支付平台手续费' });
    add('WITHDRAW-OUT', 'PLATFORM-BJ', '2026-09-13', 0, 2900, { nature: '平台提现', transfer: 'TX-001', peer: 'WITHDRAW-IN' });
    add('WITHDRAW-IN', 'BANK-BJ', '2026-09-13', 2900, 0, { nature: '平台提现', transfer: 'TX-001', peer: 'WITHDRAW-OUT' });
    add('EUR-OUT', 'BANK-EUR', '2026-09-18', 0, 100);
    add('PENDING', 'BANK-BJ', '2026-09-25', 0, 2000, { confirmed: false });
    const plans = [];
    const node = (id, extra) => plans.push({ id, obligation: id, account: 'BANK-BJ', company: '北京凯撒', currency: 'CNY', due: '2026-10-05', planned: '2026-10-05', recorded: '2026-09-20', confirmed: true, proof: '已确认节点-' + id, direction: '付款', gross: 0, paid: 0, offsetApplied: 0, offsetPlanned: 0, prepay: '', party: '远洋邮轮公司', order: '', purchase: '', ...extra });
    node('AR-PLAN', { direction: '收款', gross: 50000, order: '企业阶段2', commitment: '客户已确认10月5日付款' });
    node('AR-OVERDUE', { direction: '收款', gross: 10000, due: '2026-09-10', planned: '', commitment: '' });
    node('NODE-TO-AP', { obligation: 'CRU-TAIL', gross: 100000, replacedBy: 'AP-PLAN', purchase: 'CRU-BLK-01' });
    node('AP-PLAN', { obligation: 'CRU-TAIL', gross: 100000, paid: 20000, offsetApplied: 30000, offsetPlanned: 10000, offsetProof: '批准预付冲抵安排', prepay: 'YF-001', purchase: 'CRU-BLK-01' });
    node('REFUND-PLAN', { direction: '退款', gross: 5000, order: '已批准退款订单' });
    node('AIR-NODE', { gross: 15000, purchase: 'AIR-BLK-02', planned: '2026-11-01' });
    node('NO-PROOF', { gross: 9000, proof: '', gap: true });
    return { accounts, flows, plans, planComplete: true, coverageEnd: '2026-10-31', planCoverageEnd: '2027-01-31' };
  }
  function period(date, frequency) {
    if (frequency === 'month') return date.slice(0, 7);
    if (frequency === 'day') return date;
    const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10) + '当周';
  }
  function query(input, source = fixture()) {
    const q = { ...defaults, ...input };
    if (!views[q.view] || !['pending', 'demo', 'gaps'].includes(q.dataset) || !['day', 'week', 'month'].includes(q.frequency)) throw Error('资料或查询方式无效');
    if (![q.start, q.end, q.cutoff, q.planStart, q.planEnd].every(b.dateOK) || q.start > q.end || q.end > q.cutoff || q.planStart > q.planEnd || q.view === 'plan' && q.planStart <= q.end) throw Error('请核对实际期间、资料截止及未来安排期间');
    if (q.dataset === 'pending' || q.end > source.coverageEnd || q.view === 'plan' && q.planEnd > source.planCoverageEnd) return { rows: [], sections: [], pending: true, notice: '来源待接入或超出资料覆盖，余额及计划不推算' };
    const issues = [], flows = [], accounts = [], allAccounts = new Map(), accountConflicts = new Set();
    for (const a of source.accounts) { if (!allAccounts.has(a.id)) allAccounts.set(a.id, a); else if (JSON.stringify(allAccounts.get(a.id)) !== JSON.stringify(a)) accountConflicts.add(a.id); }
    const selected = a => a.kind === '实际账户' && (!a.gap || q.dataset === 'gaps') && (!q.company || a.company === q.company) && (!q.currency || a.currency === q.currency) && (!q.account || a.id === q.account);
    const seen = new Map(), conflicted = new Set();
    for (const r of source.flows) {
      if (r.recorded > q.cutoff) continue;
      if (seen.has(r.id)) { if (JSON.stringify(seen.get(r.id)) !== JSON.stringify(r) && [r, seen.get(r.id)].some(x => x.confirmed && (!b.dateOK(x.date) || x.date <= q.end))) { conflicted.add(r.account); conflicted.add(seen.get(r.id).account); issues.push({ ...r, issue: '同号资金记录冲突' }); } continue; }
      seen.set(r.id, r);
    }
    for (const a of [...allAccounts.values()].filter(selected)) {
      const errs = [];
      if (!a.history || !a.proof || !a.company || !a.currency || !b.money(a.opening) || !b.money(a.restricted) || !b.dateOK(a.start) || a.start > q.start || conflicted.has(a.id) || accountConflicts.has(a.id)) errs.push('期初或资金历史不足/冲突');
      let opening = a.opening, closing = a.opening, incoming = 0, outgoing = 0, externalIn = 0, externalOut = 0;
      for (const r of seen.values()) {
        if (r.account !== a.id || !r.confirmed || b.dateOK(r.date) && r.date > q.end) continue;
        if (!r.id || !b.dateOK(r.date) || !b.dateOK(r.recorded) || r.date < a.start || !r.proof || !b.money(r.incoming) || !b.money(r.outgoing) || r.incoming < 0 || r.outgoing < 0 || r.incoming > 0 && r.outgoing > 0 || !['外部收支', '内部转账', '平台提现'].includes(r.nature)) { errs.push('已确认收支缺有效日期或金额凭据'); continue; }
        closing = round(closing + r.incoming - r.outgoing);
        if (r.date < q.start) { opening = round(opening + r.incoming - r.outgoing); continue; }
        incoming = round(incoming + r.incoming); outgoing = round(outgoing + r.outgoing);
        if (r.nature === '外部收支') { externalIn = round(externalIn + r.incoming); externalOut = round(externalOut + r.outgoing); }
        let peerStatus = '不适用';
        if (r.nature !== '外部收支') {
          const peer = seen.get(r.peer), pa = peer && allAccounts.get(peer.account);
          peerStatus = !peer || !peer.confirmed || peer.date > q.end ? '对方未入账/在途' : !pa || pa.kind !== '实际账户' || peer.peer !== r.id || peer.transfer !== r.transfer || pa.currency !== a.currency || peer.incoming !== r.outgoing || peer.outgoing !== r.incoming ? '双方依据不符' : '双方对应';
        }
        flows.push({ ...r, company: a.company, currency: a.currency, name: a.name, peerStatus, period: period(r.date, q.frequency) });
      }
      if (a.restricted < 0 || a.restricted > closing) errs.push('受限金额异常');
      const known = !errs.length;
      const r = { ...a, account: a.id, opening: known ? opening : null, closing: known ? closing : null, incoming, outgoing, externalIn, externalOut, available: known ? round(closing - a.restricted) : null, coverage: known ? '已知余额' : '余额资料不足', converted: null };
      if (known && a.currency === 'CNY') r.converted = closing;
      else if (known && b.money(a.rate) && a.rate > 0 && a.rateDate === q.end && a.rateProof) r.converted = round(closing * a.rate);
      accounts.push(r); errs.forEach(issue => issues.push({ ...a, account: a.id, issue }));
    }
    const groups = new Map();
    for (const r of accounts) { const k = JSON.stringify([r.company, r.currency]); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
    const totals = [...groups.values()].map(rs => ({ company: rs[0].company, currency: rs[0].currency, ...Object.fromEntries(['opening', 'incoming', 'outgoing', 'externalIn', 'externalOut', 'closing', 'restricted', 'available'].map(k => [k, rs.every(r => r.closing != null) ? b.sum(rs.map(r => r[k])) : null])), coverage: rs.filter(r => r.closing == null).length + '条余额缺数' }));
    const visibleFlows = flows.filter(r => (!q.nature || r.nature === q.nature) && (!q.keyword || [r.id, r.transfer, r.party].join(' ').includes(q.keyword)));
    const periods = [];
    for (const a of accounts) {
      let opening = a.opening;
      for (const p of [...new Set(flows.filter(r => r.account === a.id).map(r => r.period))].sort()) {
        const rows = flows.filter(r => r.account === a.id && r.period === p), incoming = b.sum(rows.map(r => r.incoming)), outgoing = b.sum(rows.map(r => r.outgoing));
        const closing = opening == null ? null : round(opening + incoming - outgoing); periods.push({ ...a, period: p, opening, incoming, outgoing, closing }); opening = closing;
      }
    }
    const planRows = [], obligations = new Set(), offsetUses = new Map();
    for (const n of source.plans.filter(n => (!n.gap || q.dataset === 'gaps') && (!b.dateOK(n.recorded) || n.recorded <= q.cutoff && n.recorded <= q.end))) {
      const a = allAccounts.get(n.account); if (!a || !selected(a)) continue;
      let inclusion = '纳入计划', plannedIn = 0, plannedOut = 0;
      if (!n.confirmed || !n.proof || !b.dateOK(n.recorded) || n.company !== a.company || n.currency !== a.currency || ![n.gross, n.paid, n.offsetApplied, n.offsetPlanned].every(v => b.money(v) && v >= 0) || !['收款', '付款', '退款'].includes(n.direction)) inclusion = '资料不足，不列可信计划';
      else if (n.replacedBy) { const target = source.plans.find(p => p.id === n.replacedBy && p.obligation === n.obligation && p.confirmed && p.proof && p.recorded <= q.end && p.recorded <= q.cutoff && p.account === n.account && p.currency === n.currency); inclusion = target ? '已转应付/付款安排，不重计节点' : '替代记录缺失，不列可信计划'; }
      else if (!b.dateOK(n.planned) || n.planned <= q.end || n.direction === '收款' && !n.commitment) inclusion = '逾期/未确定安排，单列核对';
      else if (n.planned < q.planStart || n.planned > q.planEnd) inclusion = '计划期间以外';
      else if (obligations.has(n.obligation)) inclusion = '同一义务重复，待核对';
      else {
        obligations.add(n.obligation);
        let offsetOK = true;
        if (n.offsetPlanned) {
          const balance = prepay.query({ dataset: 'demo', view: 'prepay', start: q.start, end: q.end, cutoff: q.cutoff, company: n.company, currency: n.currency }).rows.find(r => r.id === n.prepay);
          const used = round((offsetUses.get(n.prepay) || 0) + n.offsetPlanned); offsetUses.set(n.prepay, used);
          offsetOK = Boolean(n.offsetProof && balance && balance.available != null && balance.available >= used && balance.party === n.party);
        }
        const remaining = round(n.gross - n.paid - n.offsetApplied - n.offsetPlanned);
        if (!offsetOK || remaining < 0) inclusion = '预付冲抵或未付范围异常';
        else if (n.direction === '收款') plannedIn = remaining;
        else plannedOut = remaining;
      }
      planRows.push({ ...n, plannedIn, plannedOut, inclusion });
    }
    const forecast = totals.map(t => {
      const ns = planRows.filter(n => n.company === t.company && n.currency === t.currency), plannedIn = b.sum(ns.map(n => n.plannedIn)), plannedOut = b.sum(ns.map(n => n.plannedOut));
      const gaps = ns.filter(n => /不足|异常|重复|缺失/.test(n.inclusion)).length + (source.planComplete === true ? 0 : 1);
      return { ...t, plannedIn, plannedOut, plannedOffsets: b.sum(ns.filter(n => n.inclusion === '纳入计划').map(n => n.offsetPlanned)), plannedClosing: t.available == null || gaps ? null : round(t.available + plannedIn - plannedOut), coverage: gaps ? gaps + '项计划缺口，期末待核对' : t.coverage };
    });
    const rows = q.view === 'accounts' ? accounts : q.view === 'movements' ? visibleFlows : q.view === 'periods' ? periods : planRows;
    return { rows, pending: false, notice: '独立验收算例 · 实际期间' + q.start + '至' + q.end + ' · 资料截止' + q.cutoff + ' · 计划不是实际/法定现金流 · 元/原币', sections: [
      { key: 'totals', title: '公司与原币实际资金合计', rows: totals, columns: ['company', 'currency', 'opening', 'incoming', 'outgoing', 'externalIn', 'externalOut', 'closing', 'restricted', 'available', 'coverage'] },
      ...(q.view === 'plan' ? [{ key: 'forecast', title: '未来资金安排汇总', rows: forecast, columns: ['company', 'currency', 'available', 'plannedIn', 'plannedOut', 'plannedOffsets', 'plannedClosing', 'coverage'] }] : []),
      { key: 'flows', title: '完整实际收支依据（同账户范围）', rows: flows, columns: ['id', 'date', 'account', 'company', 'currency', 'nature', 'incoming', 'outgoing', 'transfer', 'peer', 'peerStatus', 'proof'] },
      { key: 'issues', title: '账户来源缺口', rows: issues, columns: ['account', 'id', 'company', 'currency', 'issue', 'proof'] }
    ], accounts, totals, planRows, forecast };
  }
  return { defaults, views, fixture, query, period };
});
