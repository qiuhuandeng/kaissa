/* 航服已确认供票费用的产品端接收演示。不生成应收应付、付款或凭证。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AirInternalCost = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const key = 'caesar-air-internal-cost-v1';
  const supplier = '北京凯撒航空服务有限公司';
  // 仅对应现有航服演示客户；法人关系及正式内部供票名单仍待确认。
  const customers = ['北京凯撒国际旅行社'];
  const roles = {
    superadmin: { name: '超级管理员', company: customers[0], write: true },
    product: { name: '王芳 · 团期成本经办', company: customers[0], write: true },
    finance: { name: '李梅 · 航服财务（只读）', company: supplier, write: false },
    other: { name: '上海公司 · 团期成本经办', company: '上海凯撒旅游', write: true }
  };
  const copy = x => JSON.parse(JSON.stringify(x));
  const round = x => Math.round((Number(x) + Number.EPSILON) * 100) / 100;
  const validAmount = x => x !== null && x !== '' && x !== undefined && Number.isFinite(Number(x));
  function must(ok, message) { if (!ok) throw Error(message); }
  function eligible(s) { return s.company === supplier && customers.includes(s.customer) && !!s.group && s.kind !== '调整' && s.state !== '已作废'; }
  function source(db, id) {
    const s = db.settlements.find(s => s.id === id);
    must(s && eligible(s), '未找到本范围内的内部供票原结算');
    const scope = { id: s.id, company: s.company, customer: s.customer, group: s.group, currency: s.currency };
    const original = s.versions?.at(-1);
    if (!original) return { ...scope, quote: { amount: s.lines?.length && s.lines.every(l=>validAmount(l.sale)) ? round(s.lines.reduce((n,l)=>n+Number(l.sale),0)) : null, lines: (s.lines||[]).map(l=>({orderId:l.orderId,amount:validAmount(l.sale)?Number(l.sale):null,basis:l.basis||'待核对'})) }, ready: false, amount: null, externalCost: null, stamp: '', parts: [], lines: [], note: '航服结算尚未审批确认' };
    const family = [s, ...db.settlements.filter(x => x.parent === s.id && x.kind === '调整' && x.state !== '已作废' && x.versions?.length)].sort((a, b) => a.id.localeCompare(b.id));
    const parts = [], lines = [];
    let amount = 0, externalCost = 0;
    for (const item of family) {
      must(item.company === s.company && item.customer === s.customer && item.currency === s.currency && item.group === s.group, '调整单的公司、客户、团号或币种不一致，请回原单核对');
      const v = item.versions.at(-1);
      must(v.lines?.length && v.lines.every(l => validAmount(l.sale) && validAmount(l.cost)), '已确认版本金额不完整，请回航服原单核对');
      must(v.lines.every(l => original.lines.some(x => x.orderId === l.orderId)), '补充调整超出原结算订单范围');
      const sale = round(v.lines.reduce((n, l) => n + Number(l.sale), 0));
      const cost = round(v.lines.reduce((n, l) => n + Number(l.cost), 0));
      must(validAmount(v.totals?.sale) && validAmount(v.totals?.cost) && sale === Number(v.totals.sale) && cost === Number(v.totals.cost), '已确认版本合计与明细不符，请回航服原单核对');
      amount = round(amount + sale); externalCost = round(externalCost + cost);
      parts.push({ id: item.id, kind: item.kind, version: v.version, amount: sale, cost, period: v.period, by: v.by, at: v.at });
      v.lines.forEach(l => lines.push({ ...copy(l), settlement: item.id, version: v.version }));
    }
    must(amount >= 0, '累计供票金额不能小于零，请回原单核对');
    return { ...scope, ready: true, amount, externalCost, parts, lines,
      stamp: JSON.stringify({ scope, parts, lines }),
      note: s.revision || s.state === '审核中' ? '原单有未确认修订，当前仍按上次审批通过版本核对' : '' };
  }
  function seed() { return { version: 1, receipts: [] }; }
  function receipt(db, id) { return db.receipts.find(r => r.id === id); }
  function view(db, src) {
    const r = receipt(db, src.id), accepted = r?.accepted;
    const state = !src.ready ? '航服待确认' : r?.rejected?.stamp === src.stamp ? '已拒绝' : accepted?.stamp === src.stamp ? '已接收' : accepted ? '待复核' : '待接收';
    return { state, accepted: accepted || null, amount: accepted?.amount || 0, delta: src.ready ? round(src.amount - (accepted?.amount || 0)) : null, history: r?.history || [], rejected: r?.rejected || null };
  }
  function access(src, role, write = false) {
    const actor = roles[role]; must(actor, '请选择办理岗位');
    if (role === 'superadmin') return actor;
    must(actor.company === src.customer || !write && actor.company === src.company, '不在当前公司接收范围内');
    if (write) must(actor.write && actor.company === src.customer, '当前岗位只能查看，费用由团期成本经办接收');
    return actor;
  }
  function decide(db, business, id, expected, decision, note, role) {
    const src = source(business, id), actor = access(src, role, true), v = view(db, src);
    must(src.ready, '航服结算尚未审批确认，不能接收');
    must(expected === src.stamp, '来源版本已变化，请关闭后重新核对');
    must(['接收', '拒绝'].includes(decision), '请选择接收或拒绝');
    must(String(note || '').trim(), decision === '拒绝' ? '请填写拒绝原因，差异须回航服原单处理' : '请填写核对依据');
    must(v.state !== '已接收', '本次确认版本已接收，不能重复办理');
    if (decision === '拒绝') must(v.state !== '已拒绝', '本版本已拒绝，请核对来源或重新接收');
    if (v.accepted) must(['company', 'customer', 'group', 'currency'].every(k => v.accepted[k] === src[k]), '来源公司、团号或币种变化，请回原单核对，不可改挂费用');
    if (decision === '接收') must(!db.receipts.some(r => r.id !== id && r.accepted && r.accepted.lines.some(l => src.lines.some(n => n.orderId === l.orderId))), '同笔机票费用已从另一张结算单接收，请回原单核对');
    const r = receipt(db, id) || { id, accepted: null, rejected: null, history: [] };
    const entry = { at: new Date().toLocaleString('zh-CN'), by: actor.name, decision, note: String(note).trim(), before: v.amount, sourceAmount: src.amount, delta: v.delta, currency: src.currency, parts: copy(src.parts) };
    if (decision === '接收') { r.accepted = copy(src); r.rejected = null; }
    else r.rejected = { stamp: src.stamp, note: String(note).trim() };
    r.history.unshift(entry);
    if (!receipt(db, id)) db.receipts.push(r);
    return view(db, src);
  }
  function manualCheck(business, sourceNo) {
    const value = String(sourceNo || '').trim();
    if (!value) return true;
    const orderSource=business.settlements.find(x=>eligible(x)&&(x.lines||[]).some(l=>l.orderId===value));
    must(!orderSource, '该航服订单已纳入内部供票结算，请从“内部供票费用”核对，不能手工重复录入');
    const s = business.settlements.find(x => x.id === value);
    const base = s?.kind === '调整' ? business.settlements.find(x => x.id === s.parent) : s;
    must(!base || !eligible(base), '该笔航服供票须从“内部供票费用”接收，不能手工重复录入；差异请回航服原结算处理');
    return true;
  }
  function costs(db, group) { return db.receipts.filter(r => r.accepted && (!group || r.accepted.group === group)).map(r => ({ id: r.id, group: r.accepted.group, company: r.accepted.customer, supplier, currency: r.accepted.currency, amount: r.accepted.amount, source: '航服供票', readonly: true })); }
  function load() { try { const db = JSON.parse(sessionStorage.getItem(key)); if (db?.version === 1) return db; } catch (_) {} return seed(); }
  function save(db) { try { sessionStorage.setItem(key, JSON.stringify(db)); return true; } catch (_) { return false; } }
  return { key, supplier, customers, roles, copy, round, eligible, source, seed, receipt, view, access, decide, manualCheck, costs, load, save };
});
