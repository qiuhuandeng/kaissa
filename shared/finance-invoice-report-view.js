(function () {
  'use strict';
  if ((document.getElementById('finance-cashflow')?.dataset.report || new URLSearchParams(location.search).get('report')) !== 'invoices') return;
  const m = window.CaesarInvoiceReport, ui = window.CaesarReadonlyReport, parent = document.getElementById('finance-cashflow');
  if (!m || !ui || !parent) return;
  const host = document.createElement('section'); host.id = 'finance-invoice-report'; parent.append(host);
  const labels = { id: '订单/应付/凭据号', company: '核算公司', currency: '原币', party: '客户/供应商', cash: '已分配收付净额', invoiced: '已分配有效票额', gap: '本项未匹配金额', due: '约定票款节点', status: '节点与差额情况', invoiceIds: '关联发票号', cashIds: '关联收付款号', proof: '确认凭据', coverage: '资料情况', kindLabel: '凭据类别', amount: '原记录/分配金额', issuedAt: '开具日期', receivedAt: '收票日期', cashAt: '收付款日期', processedAt: '处理日期', recorded: '录入日期', original: '原票/原款', replacementFor: '更正原票', documentId: '原票/原款号', scope: '分配订单/应付号', date: '生效日期', allocated: '已分配', unallocated: '尚未分配', replacement: '重开发票号', reason: '更正原因', treatment: '会计确认影响', issue: '来源缺口', invoiceDue: '约定开/收票日', cashDue: '约定收付款日', partyId: '客户/供应商身份' };
  ui.mount(host, { title: '票款核对', showTitle: false, views: m.views, defaults: m.defaults, query: m.query, labels, money: ['cash', 'invoiced', 'gap', 'amount', 'allocated', 'unallocated'], columns: () => ['id', 'party', 'company', 'currency', 'cash', 'invoiced', 'gap', 'due', 'status'], extras: ['invoiceIds', 'cashIds', 'partyId', 'invoiceDue', 'cashDue', 'proof'], filters: [
    { key: 'asOf', label: '票款余额日', type: 'date' }, { key: 'cutoff', label: '资料截止日', type: 'date' },
    { key: 'company', label: '核算公司', options: [['', '全部，分别合计'], ['北京凯撒', '北京凯撒'], ['福建凯撒', '福建凯撒']] }, { key: 'currency', label: '原币', options: [['', '全部，分别合计'], ['CNY', '人民币'], ['EUR', '欧元']] }, { key: 'party', label: '客户/供应商' },
    { key: 'dateBasis', label: '选单日期口径', options: [['all', '不限定选单期间'], ['issuedAt', '开具日期'], ['receivedAt', '收票日期'], ['processedAt', '处理日期'], ['cashAt', '收付款日期']], more: true },
    { key: 'start', label: '选单期间开始', type: 'date', more: true }, { key: 'end', label: '选单期间结束', type: 'date', more: true }, { key: 'keyword', label: '订单/应付号', more: true },
    { key: 'status', label: '节点与差额情况', options: [['', '全部'], ...['本项无差额', '未到约定节点', '约定节点当日', '已超约定节点', '节点待补', '资料待核对'].map(v => [v, v])], more: true }
  ], definition: '金额均按同公司、同原币、同客户/供应商的有效分配比较，不将原票/原款总额重复复制到每个订单。票款差额不等于会计收入成本或逾期应收应付。未到约定节点不判逾期异常；无节点依据单列。红冲/退款按原单反向记录，纯票据信息更正不重复确认收入成本。税务及正式节点规则待财务确认。' });
})();
