(function () {
  'use strict';
  // A single business tab strip; original controllers own queries, calculations and exports.
  const primary = '[data-report-page]', channel = '[data-channel-report]', settlement = '[data-settlement-report]', supplier = '[data-supplier-report]', governance = '[data-gov-report]';
  const views = (selector, pairs) => pairs.map(([key, label]) => ({ selector, key, label }));
  const config = {
    'performance-reports': ['经营总览', [...views(primary, [['orders','订单业绩'],['actual','回团业绩']]), ...views('[data-overview-finance]', [['profit','损益摘要'],['funds','资金概况'],['plan','计划概况'],['resources','风险概况']])]],
    'monthly-profit-reports': ['月度损益', views('[data-monthly-profit]', [['companies','公司损益'],['departments','部门损益'],['expenses','费用构成'],['budgets','预算差异'],['group','集团调整'],['management','内部调整']])],
    'product-reports': ['产品分析', [...views(primary, [['organizations','产品订单'],['completed','产品回团'],['structure','产品结构'],['channels','渠道构成'],['crossYear','跨年收客']]), ...views('[data-contribution="product"]', [['product','经营贡献']]), ...views('[data-resource-cost]', [['resources','产品风险']])]],
    'channel-reports': ['渠道分析', [...views(channel, [['channels','渠道订单'],['completed','渠道回团'],['stores','门店业绩'],['calls','呼叫中心'],['structure','产品构成']]), ...views('[data-contribution="channel"]', [['channel','经营贡献']]), { selector: '[data-channel-margin]', key: 'margin', label: '毛利校验', owner: channel }]],
    'settlement-reports': ['业务毛利', [...views(settlement, [['tours','毛利明细'],['groups','部门毛利'],['gaps','结算异常'],['adjustments','结算调整']]), ...views('[data-resource-cost]', [['costs','成本分配'],['resources','资源风险']])]],
    'supplier-reports': ['供应商分析', [...views(supplier, [['summary','采购汇总'],['purchases','采购明细'],['rebates','返点核对'],['allocations','返点分配']]), ...views('#finance-prepayments', [['prepay','预付占用']])]],
    'order-report-details': ['订单明细', views(primary, [['orders','成交净值'],['changes','成交变动']])],
    'return-report-details': ['回团明细', [...views(primary, [['actual','实际完成'],['future','已售未完']]), { selector: '[data-return-finance]', key: 'financial', label: '完成核对', owner: primary }, ...views(primary, [['adjustments','完成后调整']])]],
    'cashflow-reports': ['收付明细', views('#finance-cashflow', [['receipt','收款'],['refund','退款'],['transfer','转款'],['payment','付款'],['allocations','收付分配'],['writeoffs','核销明细'],['trace','原款追溯']])],
    'balance-reports': ['往来账龄', [...views('#finance-balances', [['ar','应收余额'],['ap','应付余额'],['aging','账龄分析'],['clearing','内部清算']]), ...views('#finance-order-cash', [['orders','订单收付']])]],
    'prepayment-reports': ['预款余额', views('#finance-prepayments', [['advance','预收款'],['deposit','预存款'],['prepay','预付款'],['guarantee','保证金']])],
    'fund-reports': ['资金分析', views('#finance-funds', [['accounts','账户余额'],['movements','账户收支'],['periods','收支汇总'],['plan','资金计划']])],
    'invoice-reports': ['票款核对', views('#finance-invoice-report', [['received','已收未开'],['issued','已开未收'],['paid','已付未收票'],['invoiced','已收票未付']])],
    'accounting-reports': ['核算核对', [{ selector: '[data-accounting-confirmations] [data-return-finance]', panel: '[data-accounting-confirmations]', key: 'flows', label: '确认明细' }, ...views('#finance-accounting-report', [['completion','结算对照'],['internal','内部对账'],['nc','凭证核对']])]],
    'budget-targets': ['任务预算', [...views('[data-budget-targets]', [['primary','经营任务']]), ...views('[data-profit-budget]', [['budgets','批准预算']])]],
    'report-management': ['数据管理', [...views('[data-report-management]', [['checks','数据核对'],['rules','分类规则'],['organizations','组织对应']]), ...views(governance, [['versions','版本记录'],['records','查看范围'],['subscriptions','订阅设置']]).map(e => ({ ...e, panel: '[data-report-governance]' }))]]
  };
  const file = location.pathname.split('/').pop().replace('.html',''), definition = config[file];
  if (!definition) return;
  const [title, entries] = definition, q = s => document.querySelector(s);
  // V2 drops obsolete data-source test filters so an old empty "pending" state cannot be restored.
  const storageKey = (['cashflow-reports', 'performance-reports', 'product-reports', 'channel-reports'].includes(file) ? 'caesar-report-navigation-v3:' : 'caesar-report-navigation-v2:') + file;
  let saved = {}, active, switching = false;
  try { saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch (_) { /* File browsers may disable storage. */ }
  const states = saved.states || {};
  if(file === "performance-reports" && saved.summaryVersion !== 2) ['profit','funds','plan','resources'].forEach(key=>delete states[key]);
  const panels = [...new Set(entries.map(e => e.panel || e.owner || e.selector))];
  const container = q('#finance-cashflow') || q(panels[0]);
  if (!container) throw new Error('报表主入口未加载：' + title);
  const shell = document.createElement('section'); shell.className = 'report-navigation-shell';
  shell.innerHTML = '<nav class="report-section-switch" role="tablist" aria-label="' + title + '业务视图">' + entries.map(e => '<button type="button" role="tab" data-report-tab="' + e.key + '" id="report-tab-' + e.key + '">' + e.label + '</button>').join('') + '</nav>';
  container.before(shell); container.classList.add('report-navigation-content');
  panels.forEach(s => q(s)?.classList.add('report-navigation-content'));
  document.title = title + ' - 凯撒旅游';
  function persist() {
    if (active && !switching) {
      const controller = q(active.selector)?.reportNavigation;
      if (controller) states[active.key] = controller.capture();
      try { sessionStorage.setItem(storageKey, JSON.stringify({ active: active.key, states, ...(file === "performance-reports" ? {summaryVersion:2} : {}) })); } catch (_) { /* In-memory navigation still works. */ }
    }
  }
  function activate(key, initial = false) {
    const next = entries.find(e => e.key === key) || entries[0];
    if (active === next) return;
    if (active && (q(active.selector)?.reportNavigation?.leave?.() === false || q(active.selector)?.reportCanLeave?.() === false)) return;
    persist(); switching = true;
    for (const owner of new Set(entries.filter(e => e.owner).map(e => e.owner))) q(owner).reportNavigation.show(next.owner === owner ? next.key : 'primary');
    panels.forEach(s => { const panel = q(s); if (panel) { panel.hidden = s !== (next.panel || next.owner || next.selector); panel.classList.add('report-navigation-content'); } });
    const host = q(next.selector), controller = host?.reportNavigation;
    if (!controller) throw new Error('报表视图未加载：' + title + '/' + next.label);
    if (states[next.key]) controller.restore(states[next.key]);
    else if (!initial || next !== entries[0]) controller.activate(next.key);
    active = next;
    const panel = q(next.panel || next.owner || next.selector);
    panel.id = panel.id || 'report-panel-' + next.key;
    panel.setAttribute('role','tabpanel'); panel.setAttribute('aria-labelledby','report-tab-' + next.key);
    shell.querySelectorAll('[data-report-tab]').forEach(b => { const on = b.dataset.reportTab === next.key; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on) b.setAttribute('aria-controls',panel.id); });
    if (file === 'report-management') {
      q('[data-gov-update]').parentElement.hidden = false;
      q('[data-gov-update]').closest('[data-report-governance]').querySelectorAll('[data-gov-update], [data-gov-fail], [data-gov-publish], [data-gov-correct]').forEach(button => { button.hidden = next.key !== 'versions'; });
      q('[data-gov-subscribe]').closest('details').hidden = next.key !== 'subscriptions';
    }
    if (!initial) {
      const address = new URL(location.href); address.searchParams.set('tab', next.key);
      history.replaceState(history.state, '', address.href);
    }
    switching = false; persist();
    window.dispatchEvent(new CustomEvent('caesar:report-view-changed', { detail: { file, key: next.key } }));
  }
  shell.addEventListener('click', event => { const b = event.target.closest('[data-report-tab]'); if (b) activate(b.dataset.reportTab); });
  shell.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); const index = entries.indexOf(active), next = event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + entries.length) % entries.length;
    activate(entries[next].key); shell.querySelector('[aria-selected="true"]').focus();
  });
  for (const panel of new Set(panels.map(q).filter(Boolean))) for (const type of ['input','change','click','submit']) panel.addEventListener(type, () => queueMicrotask(persist));
  const params = new URLSearchParams(location.search);
  const legacy = { contribution: file === 'product-reports' ? 'product' : 'channel', resources: 'resources', finance: 'profit', budget: 'budgets', governance: 'records', confirmations: 'flows', checks: 'completion', primary: entries[0].key };
  const queryView = params.get('tab') || (params.has('section') ? legacy[params.get('section')] : null) || (file === 'cashflow-reports' ? params.get('type') : null);
  activate(queryView || saved.active || entries[0].key, true);
})();
