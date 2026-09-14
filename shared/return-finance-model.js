(function (root) {
  'use strict';
  const known = v => typeof v === 'number' && Number.isFinite(v);
  const sum = rows => rows.reduce((n, r) => n + (known(r.amount) ? Math.round(r.amount * 100) : 0), 0) / 100;
  const day = v => String(v || '').slice(0, 10);
  const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') && !isNaN(Date.parse(v)) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
  const visible = (r, cutoff) => validDate(day(r.effective)) && validDate(day(r.recorded)) && day(r.effective) <= cutoff && day(r.recorded) <= cutoff;
  const within = (v, start, end) => Boolean(v) && v >= start && v <= end;
  const scope = r => [r.entity, r.book, r.currency, r.basis].join('|');
  const identity = r => [r.source, r.entity, r.id].join('|');
  const defaults = { dataset: 'common', mode: 'completion', dateBasis: 'period', start: '2026-05-01', end: '2026-05-07', periodStart: '2026-05', periodEnd: '2026-05', cutoff: '2026-05-07', unit: 'yuan', scenario: '', entity: '', kind: '', change: '', quality: '', order: '', company: '', productCompany: '', productOrg: '', channel: '', currency: '', method: '', tax: '' };
  const businessFields = ['company', 'salesDivision', 'salesDepartment', 'salesLeader', 'store', 'center', 'salesGroup', 'salesperson', 'productCompany', 'division', 'productOrg', 'owner', 'productLeader', 'channel', 'travel', 'supply', 'destination', 'geographyZone', 'managementZone', 'business', 'supplier', 'contractCompany'];
  const scenarios = { missing: '完成待确认', cross: '跨月确认', adjustment: '跨期后补', phases: '分次完成', allocation: '部分分配', over: '超额分配', lateAllocation: '分配晚于确认', net: '净额与代付', tax: '价税与外币', duplicate: '重复与待批', conflict: '同源冲突', estimate: '暂估转实际', dates: '确认日与会计期间', future: '阶段与未来完成', unmatched: '业务未匹配', entities: '多主体内部交易', zero: '明确零成本' };
  const kinds = { income: '收入确认', cost: '成本结转', settlement: '业务结算收入', businessCost: '业务确认成本', agency: '代付供应款', refund: '退款执行', invoice: '发票纠错' };
  function validate(f) {
    if (!validDate(f.cutoff)) return '请填写有效的资料截止日期';
    if (f.dataset === 'common' && f.cutoff !== defaults.cutoff) return '共同资料仅提供2026-05-07日终版本';
    if (f.mode === 'completion' || f.dateBasis === 'date') {
      if (!validDate(f.start) || !validDate(f.end) || f.start > f.end) return '请检查日期范围';
      if (f.end > f.cutoff) return '查询结束日期不能晚于资料截止';
    } else if (![f.periodStart, f.periodEnd].every(v => validDate(v + '-01')) || f.periodStart > f.periodEnd) return '请检查会计期间范围';
    return '';
  }
  function completion(id, scenario, overrides = {}) {
    return { record: id, order: 'RF-' + id, product: scenarios[scenario], service: 'T-' + id, actual: '2026-05-15', planned: '2026-05-15', amount: 10000, currency: 'CNY', company: 'A', productCompany: 'B', productOrg: '欧洲经营组（演示）', contractCompany: 'C公司（演示）', channel: '门店', store: '朝阳门店', salesDivision: '零售事业部（演示）', salesDepartment: '门店销售部（演示）', salesGroup: '销售一组（演示）', salesperson: '李欣（演示）', salesLeader: '赵主管（演示）', division: '旅游事业部（演示）', owner: '产品负责人乙（演示）', productLeader: '产品领导乙（演示）', supply: '自营组织', travel: '出境', destination: '法国', geographyZone: '欧洲', managementZone: '欧洲经营区（演示）', business: '休闲旅游', ownership: '发生时归属·演示V1', completionBasis: '演示履约确认记录', confirmedBy: '计调甲（演示）', confirmedAt: '2026-05-15', scenario, coverage: {}, ...overrides };
  }
  function confirmation(id, kind, amount, targets = [], overrides = {}) {
    return { id, kind, amount, source: '独立财务算例', entity: 'D公司（演示）', book: 'D主账簿（演示）', currency: 'CNY', basis: '不含税', method: '总额', tax: '一般计税（演示）', taxEvidence: '演示价税确认依据', date: '2026-05-20', period: '2026-05', effective: '2026-05-20', recorded: '2026-05-20', approved: true, evidence: '演示确认依据', owner: '核算会计甲（演示）', adjustment: false, original: '', estimate: false, allocations: targets.map(([target, value], i) => ({ id: id + '-A' + (i + 1), target, amount: value, approved: true, effective: '2026-05-20', recorded: '2026-05-20', evidence: '演示逐项分配确认', owner: '结算会计甲（演示）', version: 1 })), ...overrides };
  }
  function fixtures() {
    const completions = [], records = [];
    function add(id, scenario, values) { const c = completion(id, scenario, values); completions.push(c); return c; }
    function record(id, kind, amount, target, values = {}) {
      const c = completions.find(c => c.record === target);
      const r = confirmation(id, kind, amount, target ? [[target, amount]] : [], { scenario: c?.scenario, ...values });
      r.allocations.forEach(a => { a.effective = r.effective; a.recorded = r.recorded; }); records.push(r); return r;
    }
    const complete = (c, at = '2026-05-20') => { c.coverage = { income: { at, recorded: at, scopes: ['D公司（演示）|D主账簿（演示）|CNY|不含税'], evidence: '演示收入范围已确认' }, cost: { at, recorded: at, scopes: ['D公司（演示）|D主账簿（演示）|CNY|不含税'], evidence: '演示成本范围已确认' } }; };
    add('01', 'missing'); record('JS01', 'settlement', 10000, '01'); record('YC01', 'businessCost', 7000, '01');
    const a = add('02A', 'cross', { actual: '2026-04-28', planned: '2026-04-28' }); complete(a);
    record('SR02A', 'income', 10000, a.record); record('CB02A', 'cost', 7000, a.record);
    const b = add('02B', 'cross', { amount: 6000, company: 'B' }); complete(b, '2026-06-10');
    record('CB02B', 'cost', 4000, b.record); record('SR02B', 'income', 6000, b.record, { date: '2026-06-10', period: '2026-06', effective: '2026-06-10', recorded: '2026-06-10' });
    const c = add('03', 'adjustment'); complete(c);
    record('SR03', 'income', 10000, c.record); record('CB03', 'cost', 7000, c.record);
    const june = { date: '2026-06-15', period: '2026-06', effective: '2026-06-15', recorded: '2026-06-15', adjustment: true, reason: '回团后补确认' };
    record('SR03-T', 'income', -500, c.record, { ...june, original: 'SR03' }); record('CB03-T', 'cost', 200, c.record, { ...june, original: 'CB03' });
    record('TK03', 'refund', 500, c.record, { ...june, adjustment: false, original: 'SR03-T', reason: '对应收入调整，退款不再次冲减' });
    const p1 = add('04A', 'phases', { order: 'RF-04', amount: 4000, product: '会务项目·第一阶段' }); complete(p1);
    const p2 = add('04B', 'phases', { order: 'RF-04', actual: '2026-06-15', amount: 6000, product: '会务项目·第二阶段' }); complete(p2, '2026-06-20');
    record('SR04A', 'income', 4000, p1.record); record('SR04B', 'income', 6000, p2.record, { ...june, adjustment: false });
    records.push(confirmation('CB04', 'cost', 6000, [[p1.record, 2400], [p2.record, 3600]], { scenario: 'phases' }));
    add('05A', 'allocation'); add('05B', 'allocation', { company: 'B' });
    records.push(confirmation('SR05', 'income', 12000, [['05A', 5000], ['05B', 4000]], { scenario: 'allocation' }));
    add('06A', 'over'); add('06B', 'over');
    records.push(confirmation('CB06', 'cost', 600, [['06A', 400], ['06B', 300]], { scenario: 'over' }));
    add('06C', 'lateAllocation'); add('06D', 'lateAllocation');
    const late = confirmation('CB06L', 'cost', 600, [['06C', 400], ['06D', 200]], { scenario: 'lateAllocation' });
    late.allocations[1].effective = late.allocations[1].recorded = '2026-06-10'; records.push(late);
    const net = add('07', 'net', { supply: '外部采购' }); complete(net);
    record('SR07', 'income', 2000, net.record, { method: '净额' }); record('CB07', 'cost', 300, net.record); record('DF07', 'agency', 8000, net.record);
    const tax = add('08', 'tax', { amount: 10600 }); complete(tax);
    record('SR08', 'income', 10000, tax.record, { gross: 10600, taxAmount: 600 }); record('CB08', 'cost', 7000, tax.record);
    record('SR08USD', 'income', 100, '', { currency: 'USD', scenario: 'tax', rate: null, tax: null, taxEvidence: null });
    add('09', 'duplicate'); const dup = record('SR09', 'income', 1000, '09'); records.push(JSON.parse(JSON.stringify(dup)));
    record('SR09-P', 'income', -100, '09', { original: 'SR09', adjustment: true, approved: false, status: '待审批' });
    record('SR09-R', 'income', -50, '09', { original: 'SR09', adjustment: true, approved: false, status: '已驳回' });
    add('09X', 'conflict'); const conflict = record('SR09X', 'income', 1000, '09X'); records.push({ ...conflict, amount: 1200 });
    const est = add('10', 'estimate'); complete(est, '2026-06-20'); record('SR10', 'income', 10000, '10'); record('CB10', 'cost', 6000, '10', { estimate: true, status: '已冲回' });
    record('CB10-R', 'cost', -6000, '10', { ...june, original: 'CB10', reversal: true });
    record('CB10-A', 'cost', 6200, '10', { ...june, adjustment: false, settlesEstimate: 'CB10' });
    record('FP10', 'invoice', -600, '10', { reason: '仅开票信息纠错，无收入调整' });
    add('12', 'dates'); record('SR12', 'income', 900, '12', { date: '2026-05-31', period: '2026-06', effective: '2026-06-02', recorded: '2026-06-02' });
    record('SR12-L', 'income', 100, '12', { date: '2026-05-28', effective: '2026-05-28', recorded: '2026-06-03' });
    add('13A', 'future', { actual: '2026-06-05', originalActual: '2026-05-31', correctionReason: '演示完成日期更正', correctedAt: '2026-06-06' }); record('CB13', 'cost', 400, '13A');
    add('13B', 'future', { actual: '', completionBasis: '', product: '阶段履约·全程未完成' }); record('SR13', 'income', 2000, '13B');
    record('CB14', 'cost', 800, '', { scenario: 'unmatched' });
    const multi = add('15', 'entities'); complete(multi); record('SR15D', 'income', 10000, '15'); record('CB15D', 'cost', 7000, '15');
    record('SR15B', 'income', 8000, '15', { entity: 'B公司（演示）', book: 'B主账簿（演示）', internal: true, partner: 'A公司（演示）' });
    const zero = add('16', 'zero'); complete(zero); record('SR16', 'income', 1000, '16'); record('CB16', 'cost', 0, '16');
    return { completions, records };
  }
  function common(report) {
    return { completions: report.completions.map(r => ({ ...report.returnFacts(r), coverage: {} })), records: [] };
  }
  function businessMatch(r, f) {
    return businessFields.every(k => !f[k] || (f[k] === '__missing' ? !r[k] || r[k] === '待补充' : r[k] === f[k])) && (!f.order || String(r.order || '').toLowerCase().includes(f.order.toLowerCase()));
  }
  function financialMatch(r, f) {
    return ['entity', 'currency', 'method', 'tax'].every(k => !f[k] || (f[k] === '__missing' ? !r[k] : r[k] === f[k]));
  }
  function ledger(data, cutoff) {
    const buckets = new Map(), completions = new Map(data.completions.map(c => [c.record, c]));
    data.records.filter(r => ['effective', 'recorded'].every(k => !validDate(day(r[k])) || day(r[k]) <= cutoff)).forEach(r => { const k = identity(r); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(r); });
    const checked = [...buckets.values()].map(rows => {
      const r = rows[0], gaps = [], duplicates = rows.length - 1;
      if (rows.some(v => JSON.stringify(v) !== JSON.stringify(r))) gaps.push('同源确认金额或资料冲突');
      if (!r.approved) gaps.push(r.status || '尚未批准');
      if (!known(r.amount)) gaps.push('确认金额未提供');
      if (!r.source || !r.id || !r.entity || !r.book || !r.currency || !r.basis) gaps.push('确认主体、账簿或金额口径缺失');
      if (!validDate(r.date) || !validDate(r.period + '-01')) gaps.push('确认日期或会计期间缺失');
      if (!validDate(day(r.effective)) || !validDate(day(r.recorded))) gaps.push('确认生效或资料记录时间缺失');
      if (!r.evidence || !r.owner) gaps.push('确认依据或确认人缺失');
      const allocationGroups = new Map();
      (r.allocations || []).filter(a => a.approved && visible(a, cutoff)).forEach(a => {
        if (!allocationGroups.has(a.id)) allocationGroups.set(a.id, []); allocationGroups.get(a.id).push(a);
      });
      const allocations = [...allocationGroups.values()].map(versions => {
        const ordered = [...versions].sort((a, b) => (a.version || 1) - (b.version || 1));
        const unique = ordered.filter((a, i) => i === 0 || JSON.stringify(a) !== JSON.stringify(ordered[i - 1]));
        if (unique.some((a, i) => i > 0 && (a.version !== unique[i - 1].version + 1 || a.supersedesVersion !== unique[i - 1].version))) gaps.push('分配重复冲突或更正依据缺失');
        return unique[unique.length - 1];
      });
      allocations.forEach(a => {
        if (!a.id || !known(a.amount) || !a.evidence || !a.owner || (a.amount !== 0 && Math.sign(a.amount) !== Math.sign(r.amount))) gaps.push('分配金额、方向或依据异常');
        if (['entity', 'book', 'currency'].some(k => a[k] && a[k] !== r[k])) gaps.push('分配主体、账簿或币种不一致');
      });
      if (known(r.amount) && Math.round(Math.abs(sum(allocations)) * 100) > Math.round(Math.abs(r.amount) * 100)) gaps.push('分配金额超过原确认金额');
      return { ...r, duplicates, variants: rows, allocations, gaps, valid: false };
    });
    function originalFor(r, id) { return checked.find(o => o.id === id && o.source === r.source && o.entity === r.entity); }
    checked.forEach(r => {
      if (r.adjustment || r.settlesEstimate) {
        const original = originalFor(r, r.original || r.settlesEstimate);
        if (!original || original === r || original.kind !== r.kind || scope(original) !== scope(r) || original.gaps.length || day(original.effective) > day(r.effective)) r.gaps.push('原确认记录缺失或不匹配');
        if (r.reversal && (!original?.estimate || r.amount !== -original.amount)) r.gaps.push('暂估冲回金额或原记录不匹配');
        if (r.settlesEstimate && !checked.some(v => v.reversal && v.original === r.settlesEstimate && v.source === r.source && scope(v) === scope(r) && v.approved && !v.gaps.length)) r.gaps.push('暂估转实际缺少有效冲回');
      }
      r.gaps = [...new Set(r.gaps)]; r.valid = r.gaps.length === 0;
    });
    // Keep original postings after reversal; only explicit signed adjustments change totals.
    checked.forEach(r => { if (r.adjustment && !originalFor(r, r.original)?.valid) { r.valid = false; if (!r.gaps.length) r.gaps.push('原确认资料冲突'); } });
    checked.forEach(r => { r.originalPeriod = originalFor(r, r.original || r.settlesEstimate)?.period || ''; });
    const flows = [];
    checked.filter(r => r.valid && ['income', 'cost'].includes(r.kind)).forEach(r => {
      const residual = Math.round((r.amount - sum(r.allocations)) * 100) / 100;
      const parts = [...r.allocations, ...((residual || !r.allocations.length) ? [{ id: r.id + '-U', target: '', amount: residual, unallocated: true }] : [])];
      parts.forEach(a => {
        const c = completions.get(a.target);
        flows.push({ ...(c || {}), ...r, owner: c?.owner, productOwner: c?.owner, confirmationOwner: r.owner, referenceAmount: null, id: r.id, allocation: a.id, target: a.target, actual: c?.actual || '', amount: a.amount, originalAmount: r.amount, unallocated: Boolean(a.unallocated), allocationState: a.unallocated ? '未分配' : !c ? '业务未匹配' : !c.actual || c.actual > cutoff ? '全程未完成' : '已分配', completionRecord: a.target, order: c?.order || '', product: c?.product || '', gap: a.unallocated ? '未分配到销售内容' : !c ? '完成依据未匹配' : '', originalPeriod: originalFor(r, r.original)?.period || '', change: r.adjustment ? '调整' : '原确认' });
      });
      r.unallocatedAmount = residual;
    });
    return { records: checked, flows };
  }
  function totals(rows) {
    const groups = new Map();
    rows.forEach(r => { const k = scope(r) + '|' + r.kind; if (!groups.has(k)) groups.set(k, { entity: r.entity, book: r.book, currency: r.currency, basis: r.basis, kind: r.kind, members: [] }); groups.get(k).members.push(r); });
    return [...groups.values()].map(g => ({ ...g, amount: sum(g.members), count: g.members.length }));
  }
  function run(input, report, supplied) {
    const f = { ...defaults, ...input }, error = validate(f);
    if (error) throw new Error(error);
    const originalData = supplied || (f.dataset === 'demo' ? fixtures() : common(report));
    const data = { completions: originalData.completions.filter(c => !f.scenario || c.scenario === f.scenario), records: originalData.records.filter(r => !f.scenario || r.scenario === f.scenario) };
    const l = ledger(data, f.cutoff);
    const periodMatch = r => f.dateBasis === 'date' ? within(r.date, f.start, f.end) : within(r.period, f.periodStart, f.periodEnd);
    let rows, records, relevant;
    if (f.mode === 'completion') {
      rows = data.completions.filter(c => validDate(c.actual) && within(c.actual, f.start, f.end) && c.actual <= f.cutoff && (!c.confirmedAt || day(c.confirmedAt) <= f.cutoff) && businessMatch(c, f)).map(c => {
        const accountingScope = { entity: f.entity, currency: f.currency };
        const refs = l.records.filter(r => r.allocations.some(a => a.target === c.record) && financialMatch(r, accountingScope));
        const parts = l.flows.filter(r => r.target === c.record && financialMatch(r, accountingScope));
        const gaps = [...new Set(refs.flatMap(r => r.gaps))];
        const out = { ...c, income: null, cost: null, businessRevenue: null, difference: null, sourceConflict: gaps.length > 0, reference: refs.map(r => r.id).join('、'), entity: [...new Set(refs.map(r => r.entity))].join('、'), gaps };
        ['income', 'cost'].forEach(kind => {
          const values = parts.filter(r => r.kind === kind), bases = new Set(values.map(scope));
          const issues = refs.filter(r => r.kind === kind).some(r => !r.valid || r.unallocatedAmount);
          const coverage = c.coverage?.[kind];
          out[kind] = values.length && bases.size === 1 ? sum(values) : null;
          out[kind + 'Status'] = bases.size > 1 || issues ? '资料冲突' : !values.length ? '未提供记录' : coverage?.evidence && coverage.at <= f.cutoff && coverage.recorded <= f.cutoff && coverage.scopes?.includes(scope(values[0])) ? '范围已确认' : '部分确认';
          if (bases.size > 1 || issues) out.sourceConflict = true;
          out[kind + 'Period'] = [...new Set(values.map(r => r.period))].join('、');
          out[kind + 'Date'] = [...new Set(values.map(r => r.date))].join('、');
          out[kind + 'Record'] = [...new Set(values.map(r => r.id))].join('、');
          if (out[kind + 'Status'] !== '范围已确认') gaps.push(kinds[kind] + '：' + out[kind + 'Status']);
        });
        const settlements = refs.filter(r => r.kind === 'settlement' && r.valid);
        const bs = settlements.flatMap(r => r.allocations.filter(a => a.target === c.record).map(a => ({ ...r, amount: a.amount })));
        out.businessRevenue = bs.length && new Set(bs.map(scope)).size === 1 ? sum(bs) : null;
        out.settlementNo = settlements.map(r => r.id).join('、'); out.settlementDate = settlements.map(r => r.date).join('、');
        out.book = [...new Set(parts.map(r => r.book))].join('、'); out.basis = [...new Set(parts.map(r => r.basis))].join('、');
        out.currency = parts.length ? [...new Set(parts.map(r => r.currency))].join('、') : c.currency;
        out.method = [...new Set(parts.filter(r => r.kind === 'income').map(r => r.method).filter(Boolean))].join('、');
        out.tax = [...new Set(parts.map(r => r.tax).filter(Boolean))].join('、');
        if (out.incomeStatus === '范围已确认' && out.costStatus === '范围已确认' && new Set(parts.map(scope)).size === 1 && parts.every(r => r.taxEvidence && (r.kind !== 'income' || ['总额', '净额'].includes(r.method)))) out.difference = Math.round((out.income - out.cost) * 100) / 100;
        out.gap = [...new Set(gaps)].join('；'); return out;
      }).filter(r => (!f.entity || (f.entity === '__missing' ? !r.entity : r.entity.split('、').includes(f.entity))) && ['method', 'tax'].every(k => !f[k] || (f[k] === '__missing' ? !r[k] : r[k].split('、').includes(f[k]))));
      if (f.quality) rows = rows.filter(r => f.quality === 'missing' ? Boolean(r.gap) : f.quality === 'conflict' ? r.sourceConflict : false);
      relevant = new Set(rows.map(r => r.record));
      records = l.records.filter(r => financialMatch(r, { entity: f.entity, currency: f.currency }) && r.allocations.some(a => relevant.has(a.target)));
    } else {
      rows = l.flows.filter(r => periodMatch(r) && financialMatch(r, f) && (!f.kind || r.kind === f.kind) && (!f.change || r.change === f.change) && businessMatch(r, f));
      if (f.quality) rows = rows.filter(r => f.quality === 'unassigned' ? r.unallocated || !r.order : f.quality === 'missing' ? Boolean(r.gap) : false);
      records = l.records.filter(r => financialMatch(r, f) && (periodMatch(r) || !r.period || !r.date) && (!f.kind || r.kind === f.kind) && (!f.change || (r.adjustment ? '调整' : '原确认') === f.change));
      const ids = new Set(rows.map(identity));
      const hasBusiness = businessFields.some(k => f[k]) || f.order;
      if (hasBusiness) records = records.filter(r => ids.has(identity(r)) || r.allocations.some(a => { const c = data.completions.find(c => c.record === a.target); return c && businessMatch(c, f); }) || !r.allocations.length);
      if (f.quality === 'conflict') records = records.filter(r => !r.valid);
    }
    const allocations = records.flatMap(r => {
      const entries = (r.allocations.length ? r.allocations : [{ id: '', target: '', amount: null, evidence: '' }]).map(a => ({ ...data.completions.find(c => c.record === a.target), ...a, confirmation: r.id, kind: r.kind, entity: r.entity, currency: r.currency, originalAmount: r.amount, unallocatedAmount: known(r.amount) ? Math.round((r.amount - sum(r.allocations)) * 100) / 100 : null, state: r.valid ? '有效确认分配' : r.gaps.join('；') }));
      return entries;
    });
    const selectedFlows = f.mode === 'completion' ? l.flows.filter(r => relevant.has(r.target) && financialMatch(r, { entity: f.entity, currency: f.currency })) : rows;
    const unassigned = f.mode === 'flows' ? l.flows.filter(r => periodMatch(r) && financialMatch(r, f) && (!f.kind || r.kind === f.kind) && (!f.change || r.change === f.change) && (!r.order || r.unallocated)) : [];
    return { rows, records, allocations, totals: totals(selectedFlows), unassigned: totals(unassigned), count: rows.length, orders: new Set(rows.map(r => r.order).filter(Boolean)).size, missing: rows.filter(r => r.gap).length, conflicts: records.filter(r => !r.valid).length, sourceCount: new Set(selectedFlows.map(identity)).size, referenceAmount: f.mode === 'completion' ? sum(rows) : null, noFinancialSource: originalData.records.length === 0 };
  }
  const api = { defaults, businessFields, scenarios, kinds, known, sum, validDate, validate, completion, confirmation, fixtures, common, ledger, totals, run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CaesarReturnFinance = api;
})(typeof window !== 'undefined' ? window : globalThis);
