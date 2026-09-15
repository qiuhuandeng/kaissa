(function () {
  'use strict';
  if ((document.getElementById('finance-cashflow')?.dataset.report || new URLSearchParams(location.search).get('report')) !== 'accounting') return;
  const m = window.CaesarAccountingReport, parent = document.getElementById('finance-cashflow');
  if (!parent || !m) return;
  const confirmations = document.createElement('section');
  confirmations.className = 'finance-report-page';
  confirmations.setAttribute('data-accounting-confirmations', '');
  confirmations.innerHTML = '<div class="cf-heading"><button type="button" class="report-button" data-export><img class="report-icon" alt="" src="../../shared/report-icons/download.svg">导出明细</button></div><div data-return-finance></div>';
  parent.append(confirmations);
  const financialView = window.mountReturnFinance(confirmations.querySelector('[data-return-finance]'), window.CaesarReports, '../../shared/report-icons/', { mode: 'flows' });
  confirmations.querySelector('[data-export]').addEventListener('click', () => financialView.exportResult());
  const host = document.createElement('section'); host.id = 'finance-accounting-report'; parent.append(host);
  const labels = { id: '确认/核对记录号', kind: '确认类型', entity: '核算主体', book: '账簿', currency: '原币', basis: '金额口径', period: '会计期间', date: '确认日期', order: '订单号', actual: '实际完成日', product: '销售内容', amount: '本次确认金额', original: '原确认记录', originalPeriod: '原会计期间', status: '核对结果', businessRevenue: '业务结算收入', income: '累计财务确认收入', cost: '累计已结转成本', difference: '核对差额', evidence: '确认依据', confirmation: '确认记录号', target: '完成记录号', state: '分配情况', estimate: '暂估情况', reason: '调整原因', conflicts: '冲突来源金额', type: '内部业务类型', partner: '对方主体', peerCurrency: '对方原币', peerPeriod: '对方会计期间', peerAmount: '对方金额', source: '来源单据', peerSource: '对方来源单据', debit: '借方合计', credit: '贷方合计', sourceAmount: '来源事项金额', returnedAmount: 'NC接收金额', returnDifference: 'NC金额差额', returned: 'NC凭证号', originalStatus: '原来源标识', open: '正常未结事项' };
  const columns = { flows: ['id', 'kind', 'entity', 'period', 'date', 'order', 'actual', 'currency', 'amount', 'status'], completion: ['order', 'product', 'actual', 'entity', 'currency', 'businessRevenue', 'income', 'cost', 'status'], internal: ['id', 'type', 'entity', 'partner', 'currency', 'amount', 'peerCurrency', 'peerAmount', 'period', 'peerPeriod', 'difference', 'status'], nc: ['id', 'source', 'entity', 'period', 'currency', 'debit', 'credit', 'difference', 'sourceAmount', 'returnedAmount', 'returnDifference', 'status'] };
  window.CaesarReadonlyReport.mount(host, { title: '核算核对', showTitle: false, defaults: { ...m.defaults, view: 'completion' }, views: Object.fromEntries(Object.entries(m.views).filter(([key]) => key !== 'flows')), query: m.query, labels, columns: q => columns[q.view], extras: ['book', 'basis', 'original', 'originalPeriod', 'source', 'peerSource', 'returned', 'originalStatus', 'open', 'evidence'], money: ['amount', 'businessRevenue', 'income', 'cost', 'difference', 'peerAmount', 'debit', 'credit', 'sourceAmount', 'returnedAmount', 'returnDifference'], filters: [
    { key: 'dataset', label: '资料范围', options: [['pending', '来源待接入'], ['demo', '独立核算算例']] }, { key: 'periodStart', label: '会计期间开始', type: 'month' }, { key: 'periodEnd', label: '会计期间结束', type: 'month' }, { key: 'cutoff', label: '资料截止', type: 'date' },
    { key: 'entity', label: '核算主体', options: [['', '全部，分别列示'], ...['A公司（演示）', 'B公司（演示）', 'D公司（演示）', '来源未提供'].map(v => [v, v])] }, { key: 'currency', label: '原币', options: [['', '全部'], ['CNY', '人民币'], ['USD', '美元'], ['EUR', '欧元']] },
    { key: 'start', label: '完成范围开始', type: 'date', more: true }, { key: 'end', label: '完成范围结束', type: 'date', more: true }, { key: 'order', label: '订单号（确认查询）', more: true }, { key: 'scenario', label: '确认业务场景', options: [['', '全部'], ...Object.entries(window.CaesarReturnFinance.scenarios)], more: true }, { key: 'status', label: '核对结果包含', more: true }
  ], definition: '会计发生与回团页共用原确认及分配记录。业务结算、收付、票据不替代收入确认和成本结转；内部双方分别核对金额、原币及期间，不自动抵销。NC核对仅提供来源与接收依据，不执行推送。' });
})();
