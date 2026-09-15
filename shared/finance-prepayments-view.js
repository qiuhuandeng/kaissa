(function () {
  'use strict';
  const m = window.CaesarPrepayments, ui = window.CaesarReadonlyReport;
  const supplier = document.querySelector('[data-supplier-report]');
  const enabled = ['prepayments', 'prepay'].includes(new URLSearchParams(location.search).get('report'));
  if (!supplier && !enabled) return;
  if (!m || !ui) return;
  const labels = { id: '款项/账户号', accountId: '原款项/账户号', company: '核算公司', ledger: '账簿', party: '客户/门店/供应商', partyId: '往来身份', typeName: '款项类别', currency: '原币', direction: '款项方向', opening: '期初余额', increase: '本期增加', used: '本期使用/冲抵', refunded: '本期退回', transferIn: '本期转入', transferOut: '本期转出', loss: '批准损失', closing: '期末账面余额', frozen: '期末冻结', available: '期末可用余额', allocated: '累计团期分摊', refundDue: '待退余额', overdueReturn: '应退未退', unperformed: '未履约占用', days: '持有天数', risk: '占用情况', coverage: '资料情况', since: '原款持有起日', openingDate: '期初资料日', proof: '确认凭据', reference: '对应依据', date: '生效日期', recorded: '录入日期', amount: '变动金额', kindName: '变动类型', inclusion: '本次是否纳入', issue: '核对缺口', batch: '采购批次', tour: '关联团期/航次', returnDue: '约定退回日' };
  const money = ['opening', 'increase', 'used', 'refunded', 'transferIn', 'transferOut', 'loss', 'closing', 'frozen', 'available', 'allocated', 'refundDue', 'overdueReturn', 'unperformed', 'amount'];
  const filters = [
    { key: 'dataset', label: '资料范围', options: [['pending', '来源待接入'], ['demo', '验收算例']] },
    { key: 'start', label: '期间开始', type: 'date' }, { key: 'end', label: '余额截止日', type: 'date' }, { key: 'cutoff', label: '资料截止日', type: 'date' },
    { key: 'company', label: '核算公司', options: [['', '全部'], ['北京凯撒', '北京凯撒'], ['福建凯撒', '福建凯撒']] },
    { key: 'currency', label: '原币', options: [['', '全部，分别合计'], ['CNY', '人民币'], ['EUR', '欧元']] }, { key: 'party', label: '客户/门店/供应商' },
    { key: 'risk', label: '占用情况', options: [['', '全部'], ...['正常持有', '长期未结', '应退未退', '资料不足', '已结清'].map(v => [v, v])], more: true },
    { key: 'threshold', label: '长期占用天数', type: 'number', more: true }, { key: 'direction', label: '款项方向', options: [['', '全部，分别合计'], ['收取', '收取'], ['支付', '支付']], more: true }, { key: 'keyword', label: '款项/账户号', more: true }
  ];
  const config = { title: supplier ? '供应商预付款占用' : '四类预款与保证金', defaults: { ...m.defaults, ...(supplier ? { view: 'prepay' } : {}) }, views: supplier ? { prepay: '预付款占用' } : m.views, labels, money, filters, query: m.query,
    columns: () => ['id', 'party', 'company', 'currency', 'direction', 'opening', 'increase', 'used', 'refunded', 'closing', 'available', 'risk'],
    extras: ['frozen', 'transferIn', 'transferOut', 'loss', 'allocated', 'unperformed', 'refundDue', 'overdueReturn', 'days', 'returnDue', 'ledger', 'proof'],
    definition: '期末 = 期初 + 增加 + 转入 - 使用/冲抵 - 退回 - 转出 - 批准损失；冻结只影响可用，不再扣账面。团期分摊不等于冲抵。保证金收取与支付分列；未履约金额仅在有当日确认依据时列示。长期天数及退回政策待确认，资料缺失不是零。' };
  const host = document.createElement('section'); host.id = 'finance-prepayments';
  if (supplier) {
    const tabs = document.createElement('div'); tabs.className = 'cf-tabs'; tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '<button type="button" role="tab" class="active" aria-selected="true" data-sp-main>采购与返点</button><button type="button" role="tab" aria-selected="false" data-sp-prepay>预付款占用</button>';
    supplier.before(tabs); supplier.after(host); host.hidden = true;
    tabs.addEventListener('click', e => { const button = e.target.closest('button'); if (!button) return; const on = button.hasAttribute('data-sp-prepay'); supplier.hidden = on; host.hidden = !on; tabs.querySelectorAll('button').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-selected', active); }); });
  } else document.getElementById('finance-cashflow').append(host);
  config.showTitle = Boolean(supplier);
  ui.mount(host, config);
})();
