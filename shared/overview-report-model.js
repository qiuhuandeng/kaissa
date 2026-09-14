(function () {
  'use strict';
  function createModel(report) {
    const names = { A: 'A公司（演示）', B: 'B公司（演示）' };
    const levels = {
      company: ['销售公司', 'sales'], salesDivision: ['销售事业部', 'sales'], salesDepartment: ['销售部门', 'sales'],
      channel: ['主成交渠道', 'sales'], budgetRegion: ['预算区域', 'sales'],
      productCompany: ['产品经营公司', 'product'], division: ['产品事业部', 'product'], productOrg: ['产品经营组', 'product']
    };
    const filterKeys = ['company', 'productOrg', 'channel', 'team', 'order', 'sourceOrder', 'type', 'supply', 'travel', 'business', 'destination', 'source',
      'salesDivision', 'salesDepartment', 'salesLeader', 'productCompany', 'division', 'productLeader', 'owner', 'geographyZone', 'managementZone', 'budgetRegion', 'management', 'dataQuality'];
    const missing = v => v == null || v === '' || ['待补充', '待确认', '未归类'].includes(v);
    const dateValid = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
    const shift = (date, days) => { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
    function previousYear(date) {
      const y = Number(date.slice(0, 4)) - 1, month = Number(date.slice(5, 7));
      const day = Math.min(Number(date.slice(8)), new Date(Date.UTC(y, month, 0)).getUTCDate());
      return y + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }
    function periods(f) {
      const days = Math.round((Date.parse(f.end) - Date.parse(f.start)) / 86400000) + 1;
      const previous = f.comparison === 'year' ? { start: previousYear(f.start), end: previousYear(f.end) }
        : { start: shift(f.start, -days), end: shift(f.start, -1) };
      return { current: { start: f.start, end: f.end }, previous,
        month: { start: f.end.slice(0, 7) + '-01', end: f.end }, year: { start: f.end.slice(0, 4) + '-01-01', end: f.end },
        monthTarget: { start: f.end.slice(0, 7) + '-01', end: new Date(Date.UTC(Number(f.end.slice(0, 4)), Number(f.end.slice(5, 7)), 0)).toISOString().slice(0, 10) },
        annualTarget: { start: f.end.slice(0, 4) + '-01-01', end: f.end.slice(0, 4) + '-12-31' },
        cumulative: { start: f.end.slice(0, 4) + '-01-01', end: f.end }, days };
    }
    function preset(period, end) {
      const month = Number(end.slice(5, 7));
      return period === 'year' ? end.slice(0, 4) + '-01-01' : period === 'quarter' ? end.slice(0, 4) + '-' + String(Math.floor((month - 1) / 3) * 3 + 1).padStart(2, '0') + '-01'
        : period === 'month' ? end.slice(0, 7) + '-01' : shift(end, period === 'biweek' ? -13 : -6);
    }
    function validate(f) {
      if (![f.start, f.end].every(dateValid) || f.start > f.end) return '请填写有效日期范围，开始日期不能晚于结束日期。';
      if (f.end > report.CUTOFF) return '该演示版本截至' + report.CUTOFF + '，实际数据查询不能超过截止日。';
      if (f.start < '2000-01-01') return '当前原型仅支持2000年以后的统计期间。';
      if (!levels[f.grouping] || levels[f.grouping][1] !== f.responsibility) return '责任分组与所选销售／产品责任不匹配。';
      return '';
    }
    function facts(f) {
      const fixed = { ...f, calendar: 'actual', status: '有效', dateBasis: 'confirmed' };
      return ['orders', 'changes'].includes(f.view) ? report.orderDetailQuery(fixed) : report.returnDetailQuery(fixed);
    }
    function groupInfo(r, key) {
      const keys = { company: ['company'], salesDivision: ['company', 'salesDivision'], salesDepartment: ['company', 'salesDivision', 'salesDepartment'],
        productCompany: ['productCompany'], division: ['productCompany', 'division'], productOrg: ['productCompany', 'division', 'productOrg'], channel: ['channel'], budgetRegion: ['budgetRegion'] }[key];
      const parts = keys.map(k => missing(r[k]) ? '待补充' : k === 'company' || k === 'productCompany' ? names[r[k]] || r[k] : k === 'productOrg' ? r[k] + '产品经营组' : r[k]);
      return { key: JSON.stringify(keys.map(k => missing(r[k]) ? null : r[k])), name: parts.join(' / '), missing: keys.some(k => missing(r[k])) };
    }
    const complete = c => c.value !== null && !c.unknown && !c.unallocated;
    function comparison(current, previous, supplied = false) {
      if (!supplied || !complete(current) || !complete(previous)) return { previous: null, difference: null, growth: null, reason: '无完整可比资料' };
      return { previous: previous.value, difference: current.value - previous.value,
        growth: previous.value > 0 ? (current.value - previous.value) / previous.value * 100 : null,
        reason: previous.value > 0 ? '同口径可比' : '对比期分母非正' };
    }
    function taskRates(actual, targets) {
      const ratio = (c, target) => complete(c) && typeof target === 'number' && Number.isFinite(target) && target > 0 ? c.value / target * 100 : null;
      return { completion: ratio(actual.month, targets.month), annualCompletion: ratio(actual.year, targets.annual),
        cumulativeCompletion: ratio(actual.year, targets.cumulative) };
    }
    function build(f) {
      const p = periods(f);
      const current = facts(f), monthly = facts({ ...f, ...p.month }), yearly = facts({ ...f, ...p.year });
      const buckets = new Map();
      [...current, ...monthly, ...yearly].forEach(r => { const g = groupInfo(r, f.grouping); if (!buckets.has(g.key)) buckets.set(g.key, g); });
      const sample = f.budget === 'sample' && ['orders', 'actual'].includes(f.view) && f.end.slice(0, 7) === '2026-05' && filterKeys.every(k => !f[k]);
      function aggregate(rows, monthRows, yearRows, name, isTotal = false) {
        const coverage = report.amountCoverage(rows), monthCoverage = report.amountCoverage(monthRows), yearCoverage = report.amountCoverage(yearRows);
        const target = isTotal && sample ? 70000 : null;
        const rates = taskRates({ month: monthCoverage, year: yearCoverage }, { month: target });
        const comparable = comparison(coverage, report.amountCoverage([]), false);
        const unknownRows = rows.filter(r => groupInfo(r, f.grouping).missing);
        return { name, amount: coverage.value, coverage, monthly: monthCoverage.value, yearly: yearCoverage.value, monthCoverage, yearCoverage,
          previous: comparable.previous ?? '未提供完整资料', difference: comparable.difference ?? '不可比', growth: comparable.growth ?? '无可比资料',
          orders: report.orderCount(rows), quantity: report.quantitySummary(rows) || '无数量记录',
          unknownAmount: report.amountCoverage(unknownRows).value, missingAmounts: coverage.unknown + coverage.unallocated,
          target: target ?? (f.view === 'changes' ? '不适用' : '无匹配批准任务'), completion: rates.completion ?? (f.view === 'changes' ? '不适用' : '未计算'),
          annualTarget: f.view === 'changes' ? '不适用' : '未提供批准任务', annualCompletion: f.view === 'changes' ? '不适用' : '未计算',
          cumulativeTarget: f.view === 'changes' ? '不适用' : '未提供同进度任务', cumulativeCompletion: f.view === 'changes' ? '不适用' : '未计算',
          taskVersion: f.view === 'changes' ? '不适用' : target === null ? '未提供批准版本' : '集团5月算例（非批准）' };
      }
      const rows = Array.from(buckets.values()).map(g => aggregate(current.filter(r => groupInfo(r, f.grouping).key === g.key), monthly.filter(r => groupInfo(r, f.grouping).key === g.key), yearly.filter(r => groupInfo(r, f.grouping).key === g.key), g.name));
      const total = aggregate(current, monthly, yearly, '全查询范围合计', true);
      const trend = Array.from({ length: 8 }, (_, i) => {
        const end = shift(f.end, -(7 - i) * p.days), start = shift(end, 1 - p.days), records = facts({ ...f, start, end });
        const c = report.amountCoverage(records);
        return { period: start + ' 至 ' + end, label: end.slice(5), amount: records.length ? c.value : null,
          coverage: !records.length ? '未提供样例' : !complete(c) ? '金额存在缺数' : '演示样例金额，非完整实绩' };
      });
      const future = facts({ ...f, view: 'future', planStart: '2000-01-01', planEnd: '9999-12-31' });
      const futureGroups = [...new Set(future.map(r => r.planned))].sort().map(planned => { const rows = future.filter(r => r.planned === planned); return { planned, amount: report.amountCoverage(rows).value, orders: report.orderCount(rows) }; });
      return { facts: current, rows, total, sample, periods: p, trend, future, futureGroups,
        orderRows: facts({ ...f, view: 'orders' }), actualRows: facts({ ...f, view: 'actual' }) };
    }
    return { levels, filterKeys, dateValid, periods, preset, validate, facts, groupInfo, comparison, taskRates, build, complete };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createModel;
  else window.CaesarOverviewModel = createModel;
})();
