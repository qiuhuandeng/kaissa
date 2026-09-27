/* 公司间对账原型：仅本页演示数据，不生成收付单据，不回写其他页面。金额运算使用分。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IntercompanyReconciliation = factory();
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const companies = { fj: '福建凯撒旅游有限公司', bj: '北京凯撒旅游有限公司' };
  const statuses = { draft: '草稿', pending: '待双方确认', disputed: '差异待处理', confirmed: '已对账', void: '已作废' };
  const kinds = { purchase: '采购／供货', collection: '代收', commission: '佣金' };
  const clone = value => JSON.parse(JSON.stringify(value));
  const cents = value => {
    const text = String(value).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isSafeInteger(Math.round(Number(text) * 100))) throw Error('请输入不小于0、最多两位小数的金额');
    return Math.round(Number(text) * 100);
  };
  const total = source => (cents(source.base) + cents(source.increase) - cents(source.decrease)) / 100;
  const companyId = name => Object.keys(companies).find(key => name === companies[key] || name === companies[key].replace('旅游有限公司', '')) || '';
  const party = (source, actor) => !!actor && (source.payer === actor || source.payee === actor);
  function eligibility(source) {
    if (!source || !companies[source.payer] || !companies[source.payee] || source.payer === source.payee || !kinds[source.kind]) return '没有集团内不同公司之间的结算关系';
    if (!source.ready || !source.evidence) return source.reason || '结算依据尚未确认';
    try { if (total(source) <= 0) return '结算金额须大于0'; } catch (_) { return '结算金额尚未明确'; }
    return '';
  }
  const sourceData = [
    { id: 'purchase-901', order: 'KSIC260901', kind: 'purchase', payer: 'fj', payee: 'bj', product: '西藏深度探索7日', schedule: 'BJ-XZ-20261015', base: 9600, increase: 0, decrease: 0, evidence: '采购确认单 CG20260927001（成人2人，每人内部结算价4800元）', ready: true, payerPaid: 0, payeeReceived: 0 },
    { id: 'purchase-902', order: 'KSIC260902', kind: 'purchase', payer: 'bj', payee: 'fj', product: '福建闽南文化5日', schedule: 'FJ-MN-20261022', base: null, increase: 0, decrease: 0, evidence: '', ready: false, reason: '资源待确认，尚无已确认结算依据', payerPaid: 0, payeeReceived: 0 },
    { id: 'purchase-801', order: 'KSIC260801', kind: 'purchase', payer: 'fj', payee: 'bj', product: '西藏深度探索7日', schedule: 'BJ-XZ-20260815', base: 8000, increase: 200, decrease: 0, evidence: '采购确认单 CG20260801001；增补确认单 BC20260810001（接送服务增加200元）', ready: true, payerPaid: 2000, payeeReceived: 2000 },
    { id: 'purchase-802', order: 'KSIC260802', kind: 'purchase', payer: 'bj', payee: 'fj', product: '福建闽南文化5日', schedule: 'FJ-MN-20260822', base: 12000, increase: 500, decrease: 300, evidence: '采购确认单 CG20260802001；加住确认单 BC20260818002（增加500元）；减项确认单 JT20260820001（减少300元）', ready: true, payerPaid: 4000, payeeReceived: 4000 },
    { id: 'collection-803', order: 'KSIC260803', kind: 'collection', payer: 'fj', payee: 'bj', product: '北京文化体验5日', schedule: 'BJ-WH-20260825', base: 10000, increase: 0, decrease: 0, evidence: '代收约定 DS20260801001；代收核对明细 DS20260826001（应转付10000元）', ready: true, payerPaid: 6000, payeeReceived: 6000 },
    { id: 'commission-803', order: 'KSIC260803', kind: 'commission', payer: 'bj', payee: 'fj', product: '北京文化体验5日', schedule: 'BJ-WH-20260825', base: 800, increase: 0, decrease: 0, evidence: '佣金确认单 YJ20260827001（双方已约定800元）', ready: true, payerPaid: 0, payeeReceived: 0 }
  ];
  function seed() {
    const sources = clone(sourceData).map(s => Object.assign({ currency: 'CNY' }, s));
    const make = (id, sourceId, phase, claims, confirmations) => ({ id, sourceId, phase, creator: 'fj', version: 1, claims, confirmations, history: [
      ...Object.keys(confirmations).filter(key => confirmations[key] === 1).map(key => ({ action: '确认本方', actor: key, version: 1, time: '2026-09-27 09:30', note: '确认本次核对金额 ' + claims[key].toFixed(2) + '，收付款余额继续保留。' })),
      { action: '建立对账单', actor: 'fj', version: 1, time: '2026-09-27 09:00', note: '依据已确认的业务结算记录建立；金额一致不代表双方已确认。' }
    ] });
    return { sources, serial: 4, records: [
      make('ICDZ20260927001', 'purchase-801', 'disputed', { fj: 8000, bj: 8200 }, { fj: null, bj: null }),
      make('ICDZ20260927002', 'purchase-802', 'pending', { fj: 12200, bj: 12200 }, { fj: null, bj: 1 }),
      make('ICDZ20260927003', 'collection-803', 'confirmed', { fj: 10000, bj: 10000 }, { fj: 1, bj: 1 }),
      make('ICDZ20260927004', 'commission-803', 'draft', { fj: 800, bj: 800 }, { fj: null, bj: null })
    ] };
  }
  function view(source, record, actor) {
    const payer = actor === source.payer;
    const amount = total(source);
    const actual = payer ? source.payerPaid : source.payeeReceived;
    const other = payer ? source.payee : source.payer;
    return { other, amount, actual, remaining: (cents(amount) - cents(actual)) / 100,
      direction: payer ? '付' : '收', difference: (cents(record.claims[actor]) - cents(record.claims[other])) / 100,
      relation: source.kind === 'purchase' ? (payer ? '我方采购' : '我方供货') : source.kind === 'collection' ? (payer ? '代收转付' : '委托代收') : (payer ? '佣金应付' : '佣金应收') };
  }
  function blockers(source, record) {
    const messages = [], amount = total(source);
    if (cents(record.claims[source.payer]) !== cents(record.claims[source.payee])) messages.push('双方核对金额存在差异');
    if ([source.payer, source.payee].some(key => cents(record.claims[key]) !== cents(amount))) messages.push('核对金额与结算依据不一致，请核实依据或更正本方核对金额');
    if (cents(source.payerPaid) !== cents(source.payeeReceived)) messages.push('双方已付与已收记录不一致，请先在收付款业务核实');
    if ([source.payerPaid, source.payeeReceived].some(value => cents(value) > cents(amount))) messages.push('已收／已付超过结算金额，请先核实收付款记录');
    return messages;
  }
  function access(state, id, actor, version) {
    const record = state.records.find(r => r.id === id), source = record && state.sources.find(s => s.id === record.sourceId);
    if (!source || !party(source, actor)) throw Error('当前公司不是本单结算双方');
    if (record.version !== version) throw Error('对账内容已更新，请重新打开后核对');
    if (['confirmed', 'void'].includes(record.phase)) throw Error('本单已结束，只能查看');
    if (record.phase === 'draft' && record.creator !== actor) throw Error('草稿由发起方维护');
    const invalid = eligibility(source); if (invalid) throw Error(invalid);
    return { record, source };
  }
  function log(record, actor, action, note) {
    record.history.unshift({ actor, action, note, version: record.version, time: new Date().toLocaleString('zh-CN', { hour12: false }) });
  }
  function create(state, sourceId, actor) {
    const source = state.sources.find(s => s.id === sourceId), invalid = eligibility(source);
    if (invalid) throw Error(invalid);
    if (!party(source, actor)) throw Error('当前公司不是本单结算双方');
    if (state.records.some(r => r.sourceId === sourceId && r.phase !== 'void')) throw Error('该结算关系已有对账单，请勿重复建立');
    const amount = total(source), record = { id: 'ICDZ20260927' + String(++state.serial).padStart(3, '0'), sourceId, creator: actor, version: 1, phase: 'draft', claims: { [source.payer]: amount, [source.payee]: amount }, confirmations: { [source.payer]: null, [source.payee]: null }, history: [] };
    log(record, actor, '建立草稿', '结算金额来自已确认业务依据；金额一致不代表双方已确认。'); state.records.unshift(record); return record;
  }
  function submit(state, id, actor, version) {
    const { record, source } = access(state, id, actor, version);
    if (record.phase !== 'draft') throw Error('只有草稿可以提交');
    record.phase = blockers(source, record).length ? 'disputed' : 'pending'; log(record, actor, '提交对账', '等待双方分别核对确认'); return record;
  }
  function update(state, id, actor, version, amount, reason) {
    const { record, source } = access(state, id, actor, version), parsed = cents(amount) / 100;
    if (parsed === record.claims[actor]) throw Error('本方核对金额没有变化');
    if (!String(reason || '').trim()) throw Error('请填写调整核对金额的原因和依据');
    const previous = clone({ version: record.version, claims: record.claims, confirmations: record.confirmations });
    record.claims[actor] = parsed; record.version += 1;
    record.confirmations = { [source.payer]: null, [source.payee]: null };
    if (record.phase !== 'draft') record.phase = blockers(source, record).length ? 'disputed' : 'pending';
    log(record, actor, '更新本方核对金额', reason.trim() + '；原核对金额 ' + previous.claims[actor].toFixed(2) + '，现核对金额 ' + parsed.toFixed(2) + '，双方需重新确认。');
    record.history[0].previous = previous; return record;
  }
  function confirm(state, id, actor, version) {
    const { record, source } = access(state, id, actor, version);
    if (record.phase === 'draft') throw Error('请先提交对账');
    const reasons = blockers(source, record); if (reasons.length) throw Error(reasons.join('；'));
    if (record.confirmations[actor] === record.version) throw Error('我方已确认本次金额');
    record.confirmations[actor] = record.version;
    record.phase = [source.payer, source.payee].every(key => record.confirmations[key] === record.version) ? 'confirmed' : 'pending';
    log(record, actor, '确认我方', '确认本次核对金额 ' + record.claims[actor].toFixed(2) + '；未收／未付款继续由收付款业务办理。'); return record;
  }
  function voidDraft(state, id, actor, version) {
    const { record } = access(state, id, actor, version); if (record.phase !== 'draft') throw Error('只允许作废未提交的草稿');
    record.phase = 'void'; log(record, actor, '作废草稿', '未形成双方确认结果'); return record;
  }
  return { companies, statuses, kinds, companyId, party, eligibility, total, seed, view, blockers, create, submit, update, confirm, voidDraft };
});
