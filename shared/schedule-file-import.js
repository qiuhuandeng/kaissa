/* 团期抽屉只读取文件中的出发日期；数量和价格在后续页面统一维护。 */
(function () {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  let loading;
  function script(name) { return new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = new URL(name, base).href; s.onload = resolve; s.onerror = () => { s.remove(); reject(Error('文件工具加载失败，请重试')); }; document.head.append(s); }); }
  async function excel() {
    if (!loading) loading = (async () => { if (!window.JSZip) await script('vendor/jszip-3.10.1.min.js'); if (!window.AirOrdersExcel) await script('air-orders-excel.js?v=20261018-import-drawer2'); })().catch(e => { loading = null; throw e; });
    await loading; return window.AirOrdersExcel;
  }
  async function dates(file) {
    const X = await excel(), grid = await X.readGrid(file), headers = grid[0].map(x => String(x || '').trim()), col = headers.indexOf('出发日期');
    if (col < 0) throw Error('缺少“出发日期”列，请使用排期模板');
    const values = grid.slice(1).filter(row => row.some(x => String(x || '').trim())).map((row, i) => {
      let value = String(row[col] || '').trim();
      if (/^\d{5}(\.0+)?$/.test(value)) value = new Date(Date.UTC(1899, 11, 30) + Number(value) * 86400000).toISOString().slice(0, 10);
      value = value.replace(/\//g, '-').replace(/^(\d{4})-(\d{1,2})-(\d{1,2})$/, (_, y, m, d) => y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0'));
      const dt = new Date(value + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(dt.getTime()) || dt.toISOString().slice(0, 10) !== value) throw Error('第' + (i + 2) + '行出发日期无效');
      return value;
    });
    if (!values.length) throw Error('文件没有出发日期');
    return [...new Set(values)].sort();
  }
  window.ScheduleFileImport = { dates, template: async () => (await excel()).download('团期排期模板.xlsx', [], null, [['出发日期']]) };
})();
