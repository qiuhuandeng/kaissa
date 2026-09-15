const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const pages = {
  'performance-reports': ['经营规模', '损益摘要', '资金概况', '计划概况', '风险概况'],
  'monthly-profit-reports': ['公司损益', '部门损益', '费用构成', '预算差异', '集团调整'],
  'product-reports': ['经营业绩', '产品结构', '渠道构成', '跨年收客', '经营贡献', '产品风险'],
  'channel-reports': ['渠道概况', '门店业绩', '呼叫中心', '产品构成', '经营贡献', '毛利校验'],
  'settlement-reports': ['毛利明细', '部门毛利', '结算异常', '结算调整', '成本分配', '资源风险'],
  'supplier-reports': ['采购汇总', '采购明细', '返点核对', '返点分配', '预付占用'],
  'order-report-details': ['成交净值', '成交变动'],
  'return-report-details': ['实际完成', '已售未完', '完成核对', '完成后调整'],
  'cashflow-reports': ['收款', '退款', '转款', '付款'],
  'balance-reports': ['应收余额', '应付余额', '账龄分析', '内部清算'],
  'prepayment-reports': ['预收款', '预存款', '预付款', '保证金'],
  'fund-reports': ['账户余额', '账户收支', '收支汇总', '资金计划'],
  'invoice-reports': ['已收未开', '已开未收', '已付未收票', '已收票未付'],
  'accounting-reports': ['确认明细', '结算对照', '内部对账', '凭证核对'],
  'budget-targets': ['经营任务', '批准预算'],
  'report-management': ['数据核对', '分类规则', '组织对应', '版本记录', '查看范围', '订阅设置'],
  'report-scenarios': ['销售与内部供货', '跨年分次完成', '包舱跨团及未售', '同产品多渠道', '企业分期与逾期', '后补成本与代收']
};

let socket;
let sequence = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function open(url) {
  const target = await (await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      const handler = pending.get(message.id);
      pending.delete(message.id);
      message.error ? handler.reject(message.error) : handler.resolve(message.result);
    };
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await evaluate(`new Promise(resolve => {
    const ready = () => document.readyState === 'complete' && document.querySelector('[data-report-tab], [data-fr-view]') ? resolve(true) : setTimeout(ready, 25);
    ready();
  })`);
  return target.id;
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function inspect(tab) {
  return evaluate(`new Promise(resolve => {
    const button = [...document.querySelectorAll('[data-report-tab], [data-fr-view]')].find(item => item.textContent.trim() === ${JSON.stringify(tab)});
    button.click();
    setTimeout(() => {
      const visible = element => !!(element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
      const tables = [...document.querySelectorAll('table')].filter(visible);
      const first = tables[0];
      const businessRows = first ? [...first.querySelectorAll('tbody tr')].filter(row => !row.querySelector('.cf-empty, .report-empty')).length : 0;
      const text = document.body.innerText;
      resolve({
        selected: [...document.querySelectorAll('[data-report-tab][aria-selected="true"], [data-fr-view][aria-selected="true"]')].find(visible)?.textContent.trim(),
        tables: tables.length,
        rows: businessRows,
        empty: [...document.querySelectorAll('.cf-empty, .report-empty')].filter(visible).map(item => item.textContent.trim()),
        redundant: text.match(/演示|非正式|算例|来源待接入|待补资料/g) || [],
        datasetFilters: [...document.querySelectorAll('[name="dataset"]')].filter(visible).length,
        notices: [...document.querySelectorAll('.cf-notice, .report-meta, .data-report-filter-surface [role="status"]')].filter(visible).map(item => item.textContent.trim()),
        alerts: [...document.querySelectorAll('[role="alert"]')].filter(visible).map(item => item.textContent.trim())
      });
    }, 120);
  })`);
}

(async () => {
  const repo = path.resolve(__dirname, '..');
  const failures = [];
  const results = [];
  for (const [file, tabs] of Object.entries(pages)) {
    const url = process.env.REPORT_BASE_URL
      ? process.env.REPORT_BASE_URL.replace(/\/$/, '') + '/merchant/data/' + file + '.html'
      : pathToFileURL(path.join(repo, 'merchant/data/' + file + '.html')).href;
    const targetId = await open(url);
    for (const tab of tabs) {
      const result = await inspect(tab);
      results.push({ file, tab, ...result });
      try {
        assert.equal(result.selected, tab);
        assert.ok(result.tables > 0, '没有报表列表');
        assert.ok(result.rows > 0, '默认列表为空');
        assert.deepEqual(result.empty, []);
        assert.deepEqual(result.redundant, []);
        assert.equal(result.datasetFilters, 0, '仍显示资料范围筛选');
        assert.deepEqual(result.notices, []);
        assert.deepEqual(result.alerts, []);
      } catch (error) {
        failures.push({ file, tab, error: error.message, result });
      }
    }
    socket.close();
    await fetch('http://127.0.0.1:9222/json/close/' + targetId);
  }
  console.log(JSON.stringify({ checked: results.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
