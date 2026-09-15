const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = path.resolve(__dirname, '..');
const pages = { cashflow: 'CaesarCashflow', balance: 'CaesarBalances', prepayment: 'CaesarPrepayments', fund: 'CaesarFunds', invoice: 'CaesarInvoiceReport', accounting: 'CaesarAccountingReport' };
for (const [file, apiName] of Object.entries(pages)) test(file + ' 独立HTML按顺序完整加载查询依赖', () => {
  const html = fs.readFileSync(path.join(repo, 'merchant/data/' + file + '-reports.html'), 'utf8');
  const context = vm.createContext({}); context.window = context;
  for (const [, src] of html.matchAll(/<script src="([^"]+-model\.js)"><\/script>/g)) {
    vm.runInContext(fs.readFileSync(path.resolve(repo, 'merchant/data', src), 'utf8'), context, { filename: src });
  }
  const api = context[apiName];
  assert(api, apiName);
  const defaults = typeof api.defaults === 'function' ? api.defaults() : api.defaults;
  for (const dataset of ['pending', 'demo']) {
    const result = api.query({ ...defaults, dataset });
    assert(Array.isArray(result.rows));
    if (dataset === 'demo') assert(result.rows.length > 0);
  }
});
test('旧报表路由只迁移对应查询，保留参数与定位片段', () => {
  const source = fs.readFileSync(path.join(repo, 'shared/nav-merchant.js'), 'utf8');
  const context = vm.createContext({ URL });
  vm.runInContext(source.slice(source.indexOf('  const financeReportPages'), source.indexOf('  const initialReportUrl')) + '\nthis.destination = reportDestination;', context);
  const next = context.destination(new URL('file:///repo/merchant/finance/finance-reports.html?report=payment&order=O1&currency=USD#result'));
  assert.equal(next.pathname, '/repo/merchant/data/cashflow-reports.html');
  assert.equal(next.searchParams.get('type'), 'payment');
  assert.equal(next.searchParams.get('order'), 'O1');
  assert.equal(next.searchParams.get('currency'), 'USD');
  assert.equal(next.hash, '#result');
  const unrelated = new URL('https://example.test/merchant/finance/finance-payable.html?order=O1');
  assert.equal(context.destination(unrelated).href, unrelated.href);
});
test('数据报表不再显示测试资料范围，并弃用会恢复空表的旧页签状态', () => {
  const views = [
    'monthly-profit-view.js', 'finance-cashflow-view.js', 'finance-balances-view.js',
    'finance-prepayments-view.js', 'finance-funds-view.js', 'finance-invoice-report-view.js',
    'finance-accounting-view.js', 'overview-finance-view.js', 'resource-cost-report-view.js',
    'return-finance-view.js', 'channel-margin-view.js', 'settlement-reports.js', 'supplier-reports.js'
  ];
  for (const file of views) {
    const source = fs.readFileSync(path.join(repo, 'shared', file), 'utf8');
    assert.doesNotMatch(source, /(?:select|control)\(['"]dataset|key:\s*['"]dataset/);
  }
  const navigation = fs.readFileSync(path.join(repo, 'shared/report-section-tabs.js'), 'utf8');
  assert.match(navigation, /caesar-report-navigation-v2/);
  assert.doesNotMatch(navigation, /caesar-report-navigation-v1/);
});
