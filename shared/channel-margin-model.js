(function (root) {
  'use strict';
  const cutoff = '2026-05-07';
  const defaults = { dataset: 'common', dateBasis: 'confirmed', start: '2026-05-01', end: cutoff, cutoff,
    company: '', channel: '', status: '', order: '', tour: '', productCompany: '', productOrg: '', store: '', center: '', salesGroup: '', salesperson: '', management: '', supply: '', organization: '', source: '', quality: '', currency: '人民币', unit: 'yuan' };
  const dates = { confirmed: '订单确认日期（演示）', actual: '实际完成日期', settled: '结算确认日期' };
  const known = v => typeof v === 'number' && Number.isFinite(v);
  const sum = values => values.length && values.every(known) ? Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100 : null;
  const unique = values => [...new Set(values)];
  const text = values => unique(values.filter(v => v != null && v !== '')).join('、') || '未提供';
  const dayValid = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
  function validate(f) {
    if (f.dataset === 'common' && f.cutoff !== cutoff) return '共同订单仅提供2026-05-07截止资料，暂不支持历史金额还原。';
    return ![f.start, f.end, f.cutoff].every(dayValid) || f.start > f.end || f.end > f.cutoff || f.cutoff > cutoff
      ? '请核对日期：开始日不晚于结束日，结束日不超过资料截止，资料截止不超过2026-05-07。' : '';
  }
  // These comparisons exercise unapproved boundary examples; the report never uses them as formal decisions.
  function compare(profit, income, mode) {
    if (!known(profit) || !known(income) || income <= 0) return null;
    const a = Math.round(profit * 100) * 10, b = Math.round(income * 100);
    return mode === 'eq' ? a === b : mode === 'gte' ? a >= b : mode === 'gt' ? a > b : null;
  }
  function item(id, overrides = {}) {
    return { id: id + '-1', order: id, product: '自营散拼核对算例', tour: 'DEMO-T01', source: '独立校验算例',
      confirmed: '2026-05-02', actual: ['2026-05-06'], settled: '2026-05-07', company: 'A', productCompany: 'B', productOrg: '欧洲经营组',
      channel: '门店', store: '朝阳门店', center: '不适用', salesGroup: '门店一组', salesperson: '李欣', staff: 'A-001',
      management: '自营', supply: '自营组织', organization: '散拼', applicability: '适用', applicabilityBasis: '自营散拼适用演示清单V1（未批准）',
      currency: '人民币', tax: '含税演示口径', rule: '还原算例V1（未批准）', ownership: '发生时任职·演示V1',
      amount: 10000, income: 10000, deduction: 9000, baseAt: '2026-05-03', baseRef: 'DEMO-BASE-' + id,
      confirmer: '结算会计（演示）', definition: '独立给定收入与扣减额，非会计收入', feeEvidence: '已核对：无其他费用（演示）',
      effects: [], adjustments: [], ...overrides };
  }
  function effect(id, type, amount, included = true, extra = {}) {
    return { id, type, amount, included, confirmed: true, at: '2026-05-03', ref: 'DEMO-FEE-' + id, bearer: 'A公司', ...extra };
  }
  function fixtures() {
    const rows = [item('CM01'), item('CM02', { product: '升舱及本公司优惠', amount: 10400, income: 10400, deduction: 10000,
      effects: [effect('U02', 'upgradeCharge', 1000), effect('C02', 'upgradeCost', 1000), effect('D02', 'discount', 600, true, { own: true })] }),
    item('CM03', { product: '多方承担优惠', income: 9400, amount: 9400, effects: [
      effect('D03A', 'discount', 300, true, { own: true, discount: 'PROMO03', discountTotal: 600 }),
      effect('D03B', 'discount', 200, true, { own: false, bearer: '门店部门', discount: 'PROMO03', discountTotal: 600 }),
      effect('D03C', 'discount', 100, true, { own: false, bearer: '外部平台', discount: 'PROMO03', discountTotal: 600 })] }),
    item('CM04', { product: '已含补偿及返点', effects: [effect('CP04', 'compensation', 200), effect('RB04', 'rebate', 100)] }),
    item('CM05', { product: '平台费已含原扣减额' }), item('CM06', { product: '同费用另一订单', channel: '呼叫中心', store: '不适用', center: 'A呼叫中心', salesGroup: '电销一组' }),
    item('CM07', { product: '费用尚余50元未分配' }),
    item('CM08', { product: '升舱成本缺失', effects: [effect('U08', 'upgradeCharge', 1000), effect('C08', 'upgradeCost', null)] }),
    item('CM09', { product: '明确非适用外采', management: '外采', supply: '外部采购', applicability: '不适用', applicabilityBasis: '非适用演示清单V1' }),
    item('CM10', { product: '内部供应范围未确认', supply: '集团内部供应', applicability: null, applicabilityBasis: null }),
    item('CM11', { product: '9.99%边界算例', deduction: 9001 }), item('CM12', { product: '10.01%边界算例', deduction: 8999 }),
    item('CM13', { product: '舍入临界9.9999%', deduction: 9000.01 }), item('CM14', { product: '负毛利算例', deduction: 11000 }),
    item('CM15', { product: '零分母算例', income: 0, amount: 0, deduction: 100 }),
    item('CM16', { product: '确认金额未提供', income: null }),
    item('CM17', { product: '跨期减项与退款支付', confirmed: '2026-04-20', adjustments: [
      { id: 'AD17', kind: 'financial', confirmed: true, at: '2026-05-04', income: -500, deduction: 0, original: 'DEMO-BASE-CM17', period: '2026-04', ref: 'DEMO-AD17' },
      { id: 'PAY17', kind: 'payment', confirmed: true, at: '2026-05-05', income: -500, deduction: 0, original: 'AD17', period: '2026-04', ref: 'DEMO-PAY17' },
      { id: 'FUT17', kind: 'financial', confirmed: true, at: '2026-05-08', income: 0, deduction: 200, original: 'DEMO-BASE-CM17', period: '2026-04', ref: 'DEMO-FUT17' }] }),
    item('CM18', { id: 'CM18-1', amount: 6000, income: 6000, deduction: 5000 }),
    item('CM18', { id: 'CM18-2', amount: 4000, income: 4000, deduction: 4000, management: '外采', supply: '外部采购', applicability: '不适用' }),
    item('CM19', { product: '来源同号金额冲突' }), item('CM19', { product: '来源同号金额冲突', income: 9999 }),
    item('CM20', { product: 'B公司同名门店顾问', company: 'B', productCompany: 'A', staff: 'B-001' })];
    const fees = [{ source: '独立费用账单', id: 'BILL01', type: 'serviceFee', amount: 300, company: 'A', currency: '人民币', confirmed: true, at: '2026-05-04',
      allocations: [{ item: 'CM05-1', amount: 100, confirmed: true, included: true }, { item: 'CM06-1', amount: 200, confirmed: true, included: true }] },
    { source: '独立费用账单', id: 'BILL02', type: 'platformFee', amount: 300, company: 'A', currency: '人民币', confirmed: true, at: '2026-05-04',
      allocations: [{ item: 'CM07-1', amount: 250, confirmed: true, included: true }] }];
    return { rows, fees };
  }
  function common(report, asOf) {
    const completed = report.returnDetailQuery({ start: '1900-01-01', end: asOf, view: 'actual' });
    return { rows: report.orderDetailQuery({ start: '1900-01-01', end: asOf, status: '有效', dateBasis: 'confirmed', view: 'orders' }).map(r => ({
      ...r, tour: r.service, actual: unique(completed.filter(x => x.id === r.id).map(x => x.actual)), settled: null,
      center: r.channel === '呼叫中心' ? r.salesDepartment : '不适用', staff: null, ownership: r.organizationVersion,
      organization: null, applicability: null, applicabilityBasis: null, income: null, deduction: null,
      baseAt: null, baseRef: null, definition: null, tax: null, rule: null, feeEvidence: null, effects: [], adjustments: [] })), fees: [] };
  }
  function deduplicate(records, key) {
    const groups = new Map();
    for (const r of records) { const k = key(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
    return [...groups.values()].map(values => ({ row: values[0], conflict: unique(values.map(r => JSON.stringify(r))).length > 1 }));
  }
  const typeNames = { upgradeCharge: '升舱收费', upgradeCost: '升舱成本', discount: '优惠承担', compensation: '第三方补偿', rebate: '返点', platformFee: '平台使用费', serviceFee: '平台服务费', commission: '渠道佣金' };
  function evaluate(row, fees, conflict, asOf) {
    const gaps = [], errors = [], evidence = [], impacts = [];
    let income = row.income, deduction = row.deduction, incomeImpact = 0, deductionImpact = 0;
    if (conflict) { errors.push('同一来源同号确认金额冲突'); income = null; deduction = null; }
    if (!row.baseRef || !row.baseAt || row.baseAt > asOf) { gaps.push('缺有效基础确认记录'); income = null; deduction = null; }
    if (!known(income)) gaps.push('原校验收入未确认');
    if (!known(deduction)) gaps.push('原校验扣减额未确认');
    if (!row.tax || !row.definition) gaps.push('金额定义或含税口径未提供');
    if (!row.rule) gaps.push('还原规则资料未提供');
    if (!row.feeEvidence) gaps.push('费用完整性未确认');
    if (!row.applicabilityBasis || !row.organization || !row.management) gaps.push('适用范围依据未提供');
    const effects = deduplicate(row.effects || [], e => e.id);
    if (effects.some(e => e.row.type === 'upgradeCharge') && !effects.some(e => e.row.type === 'upgradeCost')) gaps.push('升舱成本未确认');
    for (const { row: e, conflict: clash } of effects) {
      let ri = 0, rd = 0, valid = true;
      if (clash) { errors.push('费用同号记录冲突'); valid = false; }
      if (!e.confirmed || !e.ref || !e.at || e.at > asOf || !known(e.amount) || typeof e.included !== 'boolean') { gaps.push(typeNames[e.type] + '确认或原基础包含情况不完整'); valid = false; }
      if (e.type === 'discount' && typeof e.own !== 'boolean') { gaps.push('优惠承担方未确认'); valid = false; }
      if (['compensation', 'rebate'].includes(e.type) && e.included !== true) { gaps.push('补偿或返点还原影响待确认'); valid = false; }
      if (!Object.hasOwn(typeNames, e.type)) { gaps.push('费用类型待确认'); valid = false; }
      if (valid && e.included) {
        if (e.type === 'upgradeCharge') ri = -e.amount;
        if (e.type === 'upgradeCost') rd = -e.amount;
        if (e.type === 'discount' && e.own) ri = e.amount;
      }
      if (valid && !e.included && ['platformFee', 'serviceFee', 'commission'].includes(e.type)) rd = e.amount;
      if (valid) { incomeImpact += ri; deductionImpact += rd; }
      evidence.push({ order: row.order, item: row.id, source: row.source, type: typeNames[e.type] || e.type, ref: e.ref, bearer: e.bearer, originalAmount: e.amount, allocated: e.amount, unallocated: 0, included: e.included, at: e.at, confirmation: valid ? '确认算例' : '资料待核对' });
      impacts.push({ order: row.order, item: row.id, ref: e.ref, original: row.baseRef, type: typeNames[e.type], at: e.at, incomeImpact: valid ? ri : null, deductionImpact: valid ? rd : null, note: '还原算例，未批准' });
    }
    for (const id of unique(effects.map(x => x.row.discount).filter(Boolean))) {
      const parts = effects.map(x => x.row).filter(e => e.discount === id);
      if (unique(parts.map(e => e.discountTotal)).length !== 1 || sum(parts.map(e => e.amount)) !== parts[0].discountTotal) errors.push('优惠承担合计与原优惠不一致');
    }
    for (const { row: fee, conflict: clash } of fees) {
      const allocation = fee.allocations.filter(a => a.item === row.id);
      if (!allocation.length) continue;
      const allocated = sum(fee.allocations.map(a => a.amount));
      const remaining = known(fee.amount) && known(allocated) ? sum([fee.amount, -allocated]) : null;
      const complete = fee.confirmed && fee.at && fee.at <= asOf && fee.allocations.every(a => a.confirmed && known(a.amount) && a.amount >= 0) && remaining === 0;
      if (clash) errors.push('费用来源同号冲突');
      if (fee.company !== row.company || fee.currency !== row.currency) errors.push('费用分配公司或币种不匹配');
      if (remaining < 0) errors.push('费用分配超过确认原额');
      if (unique(fee.allocations.map(a => a.item)).length !== fee.allocations.length) errors.push('费用销售内容分配重复');
      if (!complete) gaps.push('费用未确认或分配未完成');
      for (const a of allocation) {
        if (typeof a.included !== 'boolean') gaps.push('费用是否已含原扣减额待确认');
        const influence = complete && !clash && typeof a.included === 'boolean' ? (a.included ? 0 : a.amount) : null;
        if (known(influence)) deductionImpact += influence;
        evidence.push({ order: row.order, item: row.id, ref: fee.id, source: fee.source, type: typeNames[fee.type], bearer: fee.company, originalAmount: clash ? null : fee.amount, allocated: a.amount, unallocated: remaining, included: a.included, at: fee.at, confirmation: complete && !clash ? '确认算例' : '资料待核对' });
        impacts.push({ order: row.order, item: row.id, ref: fee.id, original: row.baseRef, type: typeNames[fee.type], at: fee.at, incomeImpact: 0, deductionImpact: influence, note: a.included === true ? '已含原扣减额，不重复扣减' : '按分配额核对' });
      }
    }
    for (const { row: a, conflict: clash } of deduplicate(row.adjustments || [], a => a.id)) {
      const active = a.kind === 'financial' && a.confirmed && a.at && a.at <= asOf;
      if (active && clash) errors.push('调整同号记录冲突');
      const relationValid = a.original === row.baseRef && a.at >= row.baseAt;
      if (active && !relationValid) errors.push('调整原记录不匹配或生效早于基础确认');
      const valid = active && !clash && relationValid && a.ref && known(a.income) && known(a.deduction);
      if (active && !valid) gaps.push('调整原记录或确认金额缺失');
      if (valid) { incomeImpact += a.income; deductionImpact += a.deduction; }
      impacts.push({ order: row.order, item: row.id, ref: a.ref, original: a.original, type: a.kind === 'payment' ? '退款支付' : '确认调整', at: a.at, period: a.period, incomeImpact: valid ? a.income : 0, deductionImpact: valid ? a.deduction : 0, note: valid ? '生效差额，原记录保留' : a.kind === 'payment' ? '资金执行不再次冲减' : '未生效或截止后，不计本次' });
    }
    const complete = !errors.length && !gaps.filter(g => g !== '适用范围依据未提供').length;
    return { ...row, amount: conflict ? null : row.amount, income, deduction, incomeImpact: complete ? sum([incomeImpact]) : null, deductionImpact: complete ? sum([deductionImpact]) : null,
      restoredIncome: complete ? sum([income, incomeImpact]) : null, restoredDeduction: complete ? sum([deduction, deductionImpact]) : null, gaps, errors, evidence, impacts };
  }
  function run(input, report, supplied) {
    const f = { ...defaults, ...input }, data = supplied || (f.dataset === 'demo' ? fixtures() : common(report, f.cutoff));
    const fees = deduplicate(data.fees || [], r => JSON.stringify([r.source, r.id]));
    const groups = new Map();
    for (const { row, conflict } of deduplicate(data.rows, r => JSON.stringify([r.source, r.id]))) {
      const key = JSON.stringify([row.source, row.order]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(evaluate(row, fees, conflict, f.cutoff));
    }
    const keys = ['company', 'productCompany', 'productOrg', 'channel', 'store', 'center', 'salesGroup', 'salesperson', 'management', 'supply', 'organization', 'source', 'currency'];
    const summaries = [];
    for (const [key, members] of groups) {
      if (!members.some(r => (Array.isArray(r[f.dateBasis]) ? r[f.dateBasis] : [r[f.dateBasis]]).some(d => d && d >= f.start && d <= f.end && d <= f.cutoff))) continue;
      if (!keys.every(k => !f[k] || members.some(r => r[k] === f[k]))) continue;
      if (f.order && !members[0].order.includes(f.order) || f.tour && !members.some(r => (r.tour || '').includes(f.tour))) continue;
      const gaps = unique(members.flatMap(r => r.gaps)), errors = unique(members.flatMap(r => r.errors));
      const compatible = ['company', 'currency', 'tax', 'rule'].every(k => unique(members.map(r => r[k])).length === 1);
      if (!compatible) errors.push('同单公司、币种或金额规则不兼容');
      const scope = unique(members.map(r => r.applicability));
      const applicability = scope.length === 1 && scope[0] && members.every(r => r.applicabilityBasis) ? scope[0] : '待确认';
      if (applicability === '待确认') gaps.push('适用范围待确认（含混合或缺依据）');
      const calculable = compatible && !errors.length && applicability === '适用';
      const income = calculable ? sum(members.map(r => r.restoredIncome)) : null, deduction = calculable ? sum(members.map(r => r.restoredDeduction)) : null;
      const profit = known(income) && known(deduction) ? sum([income, -deduction]) : null;
      const rate = known(profit) && income > 0 ? profit / income * 100 : null;
      if (known(income) && income <= 0) gaps.push('零或负分母处理规则待确认');
      const status = applicability === '不适用' ? '不适用' : applicability !== '适用' ? '适用范围待确认' : errors.length ? '数据异常' : members.some(r => r.gaps.some(g => g !== '适用范围依据未提供')) ? '资料待补齐' : '规则待确认';
      const r = { key, order: members[0].order, product: text(members.map(r => r.product)), sales: text(members.map(r => r.channel + ' · ' + r.company + '公司')), applicability,
        amount: compatible ? sum(members.map(r => r.amount)) : null, income: sum(members.map(r => r.income)), deduction: sum(members.map(r => r.deduction)),
        restoredIncome: income, restoredDeduction: deduction, profit, rate, rawRate: rate, threshold: '10%比较方式待确认', difference: null,
        status, gapReasons: [...errors, ...gaps, '正式还原公式及10%比较方式未批准'], gap: text([...errors, ...gaps, '正式还原公式及10%比较方式未批准']), incomeImpact: calculable ? sum(members.map(r => r.incomeImpact)) : null, deductionImpact: calculable ? sum(members.map(r => r.deductionImpact)) : null,
        ownership: text(members.map(r => r.ownership)), staff: text(members.map(r => r.staff)), baseRef: text(members.map(r => r.baseRef)), rule: text(members.map(r => r.rule)), tax: text(members.map(r => r.tax)),
        members, evidence: members.flatMap(r => r.evidence), impacts: members.flatMap(r => r.impacts) };
      keys.forEach(k => { r[k] = text(members.map(v => v[k])); });
      for (const type of Object.keys(typeNames)) {
        const values = r.evidence.filter(e => e.type === typeNames[type]).map(e => e.allocated);
        r[type] = values.length ? sum(values) : members.every(m => m.feeEvidence) ? 0 : null;
      }
      if (f.status && r.status !== f.status || f.quality === 'fees' && !members.some(m => m.gaps.some(g => /费用|升舱|优惠|补偿|返点/.test(g))) || f.quality === 'conflicts' && !errors.length) continue;
      summaries.push(r);
    }
    const complete = summaries.filter(r => known(r.profit) && r.restoredIncome > 0);
    const totals = [];
    for (const k of unique(complete.map(r => JSON.stringify([r.currency, r.tax, r.rule])))) {
      const rows = complete.filter(r => JSON.stringify([r.currency, r.tax, r.rule]) === k), income = sum(rows.map(r => r.restoredIncome)), profit = sum(rows.map(r => r.profit));
      totals.push({ currency: rows[0].currency, tax: rows[0].tax, rule: rows[0].rule, count: rows.length, income, profit, rate: profit / income * 100 });
    }
    return { filter: f, summaries, total: summaries.length, formal: 0, complete: complete.length, missing: summaries.filter(r => ['资料待补齐', '适用范围待确认', '数据异常'].includes(r.status)).length,
      amount: sum(summaries.map(r => r.amount)), totals, details: summaries.flatMap(r => r.members.map(member => ({ ...member, gap: r.gap }))), evidence: summaries.flatMap(r => r.evidence), impacts: summaries.flatMap(r => r.impacts) };
  }
  const api = { defaults, dates, typeNames, known, sum, validate, compare, item, effect, fixtures, common, run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CaesarChannelMargin = api;
})(typeof window === 'undefined' ? globalThis : window);
