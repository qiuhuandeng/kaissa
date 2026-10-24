/* 邮轮预付用途与共同采购算例；只在当前页面办理，不产生跨页财务记录。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CruiseFinanceModel = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const money = n => { const v = Number(String(n).replace(/[¥,\s]/g, '')); if (!Number.isFinite(v) || v < 0) throw Error('金额须为有效的非负数'); return round(v); };
  const voyages = [
    { id: 'MED-20261112', name: '理想号 · 11月12日航次', payable: 'AP-CRU-20261112', due: 480000 },
    { id: 'MED-20261126', name: '理想号 · 11月26日航次', payable: 'AP-CRU-20261126', due: 600000 },
    { id: 'MED-20261210', name: '理想号 · 12月10日航次', payable: 'AP-CRU-20261210', due: 500000 }
  ];
  function seed() { return { amount: 1000000, offset: 0, balance: 1000000, uses: [], pending: null, history: [] }; }
  function totals(r) {
    const assigned = round(r.uses.reduce((s, u) => s + u.allocated, 0));
    const unused = round(r.uses.reduce((s, u) => s + u.allocated - u.offset, 0));
    return { assigned, unused, unassigned: round(r.balance - unused), offset: r.offset, balance: r.balance };
  }
  function log(r, action, text, amount = 0) { r.history.push({ action, text, amount, balance: r.balance, sequence: r.history.length + 1 }); }
  function allocate(r, rows, reserved = 0) {
    if (r.pending) throw Error('本笔冲抵待确认，处理后再调整用途');
    const seen = new Set();
    const next = rows.map(x => {
      if (!voyages.some(v => v.id === x.id) || seen.has(x.id)) throw Error('请选择不同的适用航次');
      seen.add(x.id);
      const old = r.uses.find(u => u.id === x.id), allocated = money(x.allocated), offset = old ? old.offset : 0;
      if (allocated < offset) throw Error('用途金额不能小于该航次已冲抵金额');
      return { id: x.id, item: x.item || '包舱费', allocated, offset };
    });
    if (r.uses.some(u => u.offset > 0 && !seen.has(u.id))) throw Error('已冲抵航次须保留原用途记录');
    if (round(next.reduce((s, u) => s + u.allocated - u.offset, 0)) > round(r.balance - reserved)) throw Error('分摊合计超过未使用预付，请核对退回占用');
    r.uses = next;
    log(r, '用途分摊', next.map(u => u.id + ' ' + u.item + ' ' + u.allocated).join('；'));
    return totals(r);
  }
  function submit(r, id, value, reserved = 0) {
    if (r.pending) throw Error('已有待确认冲抵，不能重复提交');
    const u = r.uses.find(x => x.id === id), v = voyages.find(x => x.id === id), amount = money(value);
    if (!u || !v || amount <= 0 || amount > round(Math.min(u.allocated - u.offset, v.due - u.offset, r.balance - reserved))) throw Error('冲抵金额超过本航次可用预付或应付余额');
    r.pending = { id, amount, payable: v.payable };
    log(r, '提交冲抵', v.payable + ' / ' + id + ' / ' + amount);
  }
  function confirm(r, result, reserved = 0) {
    if (!r.pending) throw Error('没有待确认冲抵，不能重复办理');
    const p = r.pending, u = r.uses.find(x => x.id === p.id);
    if (result === '确认冲抵') {
      if (p.amount > round(Math.min(r.balance - reserved, u.allocated - u.offset))) throw Error('可用预付已变化，请先核对退回占用');
      u.offset = round(u.offset + p.amount); r.offset = round(r.offset + p.amount); r.balance = round(r.balance - p.amount);
      log(r, '已冲抵', p.payable + ' / ' + p.id, -p.amount);
    } else log(r, result, p.payable + ' / ' + p.amount);
    r.pending = null;
    return totals(r);
  }
  function transfer(r, from, to, value, reserved = 0) {
    if (r.pending) throw Error('先处理待确认冲抵再转用');
    const amount = money(value), src = r.uses.find(u => u.id === from);
    if (!voyages.some(v => v.id === to) || from === to) throw Error('请选择不同的适用航次');
    const available = src ? src.allocated - src.offset : from === 'unassigned' ? totals(r).unassigned - reserved : 0;
    if (amount <= 0 || amount > round(available)) throw Error('转用金额超过所选用途未冲抵金额');
    if (src) src.allocated = round(src.allocated - amount);
    let target = r.uses.find(u => u.id === to);
    if (!target) { target = { id: to, item: '包舱费', allocated: 0, offset: 0 }; r.uses.push(target); }
    target.allocated = round(target.allocated + amount);
    log(r, '预付转用', from + ' → ' + to + ' / ' + amount + '（船方确认）');
    return totals(r);
  }
  function sharedSeed() {
    return { no: 'CRU-BLK-20261112-005', supplier: '理想号邮轮公司', voyage: 'MED-20261112', total: 800000, basis: '船方账单 CRU-BILL-1112；双方确认金额分配（演示）', shares: [
      { id: 'CZ20261112001', city: '北京出发', estimate: 500000, amount: 480000, status: '待确认', reason: '船方最终账单较预估减少20,000元', evidence: 'CRU-BILL-1112 / 北京出发成本确认.pdf', locked: false },
      { id: 'CZ20261112002', city: '上海出发', estimate: 330000, amount: 320000, status: '已确认', reason: '船方最终账单较预估减少10,000元', evidence: 'CRU-BILL-1112 / 上海出发成本确认.pdf', locked: true }
    ] };
  }
  function updateShare(p, id, values) {
    const s = p.shares.find(x => x.id === id);
    if (!s || s.locked) throw Error('原结算已锁定，请通过二次结算登记差额');
    const amount = money(values.amount), others = p.shares.filter(x => x.id !== id).reduce((n, x) => n + x.amount, 0);
    if (round(amount + others) > p.total) throw Error('各团承担合计超过共同采购总额');
    Object.assign(s, { amount, reason: values.reason || s.reason, evidence: values.evidence || s.evidence, status: values.confirm ? '已确认' : '待确认' });
    return { delta: round(amount - s.estimate), unassigned: round(p.total - amount - others) };
  }
  return { round, money, voyages, seed, totals, allocate, submit, confirm, transfer, sharedSeed, updateShare };
});
