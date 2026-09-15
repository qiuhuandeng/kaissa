(function (root) {
  'use strict';
  const rf = typeof module !== 'undefined' && module.exports ? require('./return-finance-model.js') : root.CaesarReturnFinance;
  const defaults = { dataset: 'pending', view: 'flows', periodStart: '2026-05', periodEnd: '2026-06', start: '2026-04-01', end: '2026-06-30', cutoff: '2026-06-30', entity: '', currency: '', order: '', scenario: '', status: '' };
  const views = { flows: '会计发生', completion: '完成与结算核对', internal: '内部双方核对', nc: 'NC来源核对' };
  function fixture() {
    const pair = (id, type, overrides = {}) => ({ id, type, entity: 'A公司（演示）', partner: 'B公司（演示）', currency: 'CNY', peerCurrency: 'CNY', period: '2026-05', peerPeriod: '2026-05', amount: 8000, peerAmount: 8000, source: id + '-AR', peerSource: id + '-AP', effective: '2026-05-20', recorded: '2026-05-20', peerRecorded: '2026-05-20', evidence: '独立双方确认依据', ...overrides });
    return { ...rf.fixtures(), pairs: [pair('INT01', '内部采购'), pair('INT02', '跨法人服务', { peerAmount: 7800 }), pair('INT03', '同法人协作', { partner: 'A公司（演示）', peerAmount: null, peerSource: '', sameLegal: true }), pair('INT04', '代收清算', { amount: 5000, peerAmount: 5000, peerPeriod: '2026-06' }), pair('INT05', '代付清算', { peerAmount: null, peerSource: '', peerRecorded: '' }), pair('INT06', '关联方采购', { peerCurrency: 'EUR' }), pair('INT07', '内部采购', { peerRecorded: '2026-07-01' })],
      vouchers: [
        { id: 'NC-PRJ-20250623', source: 'JS-PRJ-20250623', entity: '来源未提供', currency: 'CNY', period: '2025-06', debit: 1512600, credit: 1906000, returned: '', status: '原页面标为校验通过', evidence: 'finance-nc.html 项目结算原示例，仅来源审计' },
        { id: 'NC-JS-20260624001', source: 'JS20260624001', entity: '来源未提供', currency: 'CNY', period: '2026-06', debit: 297800, credit: 441600, returned: '', status: '原页面标为校验通过', evidence: 'finance-nc.html 结算原示例，仅来源审计' },
        { id: 'NC-DEMO01', source: 'SR02A', entity: 'D公司（演示）', currency: 'CNY', period: '2026-05', debit: 10000, credit: 10000, sourceAmount: 10000, returnedAmount: 10000, returned: 'NC-DEMO-V01', status: '已接收（演示）', open: '客户未收款；供应商未付；待收票', evidence: '独立完整会计事项及接收依据' },
        { id: 'NC-DEMO02', source: 'CB02A', entity: 'D公司（演示）', currency: 'CNY', period: '2026-05', debit: 7000, credit: 7000, sourceAmount: 7000, returnedAmount: 7200, returned: 'NC-DEMO-V02', status: '已接收（演示）', evidence: '独立来源与NC金额差异' },
        { id: 'NC-DEMO03', source: 'SR03', entity: 'D公司（演示）', currency: 'CNY', period: '2026-05', debit: 10000, credit: 10000, sourceAmount: 10000, returnedAmount: null, returned: '', status: '结果未知', evidence: '尚未取得接收依据' }
      ] };
  }
  function internal(q, data) {
    return data.pairs.filter(r => r.effective <= q.cutoff && r.recorded <= q.cutoff && r.period >= q.periodStart && r.period <= q.periodEnd && (!q.entity || [r.entity, r.partner].includes(q.entity)) && (!q.currency || r.currency === q.currency)).map(raw => {
      const r = { ...raw }, same = r.sameLegal && r.entity === r.partner;
      if (!r.peerRecorded || r.peerRecorded > q.cutoff) { r.peerAmount = null; r.peerSource = ''; }
      r.difference = !same && r.currency === r.peerCurrency && rf.known(r.amount) && rf.known(r.peerAmount) ? Math.round((r.amount - r.peerAmount) * 100) / 100 : null;
      r.status = same ? '同法人协作，不形成跨法人往来' : !rf.known(r.peerAmount) || !r.peerSource ? '对方未提供或在途' : r.currency !== r.peerCurrency ? '币种不同，待核对' : r.difference !== 0 ? '双方金额差异' : r.period !== r.peerPeriod ? '双方期间差异' : '双方一致，未抵销';
      return r;
    });
  }
  function nc(q, data) {
    return data.vouchers.filter(r => r.period >= q.periodStart && r.period <= q.periodEnd && r.period <= q.cutoff.slice(0, 7) && (!q.entity || r.entity === q.entity) && (!q.currency || r.currency === q.currency)).map(r => {
      const difference = rf.known(r.debit) && rf.known(r.credit) ? Math.round((r.debit - r.credit) * 100) / 100 : null;
      const returnDifference = rf.known(r.returnedAmount) && rf.known(r.sourceAmount) ? Math.round((r.returnedAmount - r.sourceAmount) * 100) / 100 : null;
      const status = difference === null ? '借贷资料缺失' : difference !== 0 ? '来源借贷不平衡' : !r.sourceAmount && r.sourceAmount !== 0 ? '来源金额未提供' : !r.returned ? '接收结果待核对' : returnDifference !== 0 ? 'NC返回金额差异' : '来源与返回一致';
      return { ...r, originalStatus: r.status, difference, returnDifference, status };
    });
  }
  function query(input, supplied) {
    const q = { ...defaults, ...input };
    const error = rf.validate({ ...rf.defaults, ...q, dataset: 'demo', mode: q.view === 'completion' ? 'completion' : 'flows' });
    if (error) throw new Error(error);
    if (q.dataset === 'pending') return { rows: [], pending: true, notice: '正式结算及核算来源待接入', sections: [] };
    const data = supplied || fixture();
    let rows, sections = [];
    if (['flows', 'completion'].includes(q.view)) {
      const result = rf.run({ ...q, dataset: 'demo', mode: q.view }, null, data);
      rows = result.rows.map(r => ({ ...r, kind: rf.kinds[r.kind], status: r.gap || r.allocationState || [r.incomeStatus, r.costStatus].join('；') }));
      sections = [
        { key: 'totals', title: '同主体、账簿、币种及金额口径分项合计', rows: result.totals.map(r => ({ ...r, kind: rf.kinds[r.kind] })), columns: ['entity', 'book', 'currency', 'basis', 'kind', 'amount'] },
        { key: 'sources', title: '原确认、业务结算与调整依据', rows: result.records.map(r => ({ ...r, kind: rf.kinds[r.kind], status: r.valid ? '依据有效' : r.gaps.join('；'), original: r.original || r.settlesEstimate, estimate: r.estimate ? '暂估' : r.reversal ? '暂估冲回' : '非暂估', conflicts: r.gaps.some(v => v.includes('同源')) ? r.variants.map(v => v.amount).join(' / ') : '' })), columns: ['id', 'kind', 'entity', 'book', 'currency', 'basis', 'period', 'date', 'amount', 'original', 'originalPeriod', 'estimate', 'reason', 'status', 'conflicts', 'evidence'] },
        { key: 'allocations', title: '逐完成记录分配依据', rows: result.allocations.map(r => ({ ...r, kind: rf.kinds[r.kind] })), columns: ['id', 'confirmation', 'entity', 'currency', 'kind', 'order', 'target', 'amount', 'state', 'evidence'] }
      ];
    } else rows = q.view === 'internal' ? internal(q, data) : nc(q, data);
    if (q.status) rows = rows.filter(r => String(r.status).includes(q.status));
    return { rows, sections, notice: '独立核算算例；原主体分别列示，未抵销。正式期间与确认政策待确认。' };
  }
  const api = { defaults, views, fixture, internal, nc, query };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CaesarAccountingReport = api;
})(typeof window !== 'undefined' ? window : globalThis);
