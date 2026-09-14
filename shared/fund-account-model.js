(function (root) {
  'use strict';
  const copy = x => JSON.parse(JSON.stringify(x));
  const storeNames = ['软件园门店', '文灶门店', '观音山门店', '泉州丰泽门店', '泉州鲤城门店', '泉州东海门店'];
  const uses = { company: ['门店缴款至公司', '客户转账收款', '商户结算', '对外付款'], merchant: ['客户扫码收款'], store: ['门店缴款来源', '门店接收分润或退款'] };
  const selections = { companyReceive: ['company', '门店缴款至公司'], customerReceive: ['company', '客户转账收款'], merchant: ['merchant', '客户扫码收款'], payer: ['store', '门店缴款来源'], beneficiary: ['store', '门店接收分润或退款'] };
  function create(today) {
    today = today || new Date().toLocaleDateString('sv-SE');
    const shared = { company: '福建凯撒', currency: 'CNY', scope: storeNames.slice(), status: '正常', proof: '开户证明已核验', approvedAt: '2026-09-01', effectiveAt: '2026-09-01' };
    const rows = [
      { id: 'bank-fj-1', kind: 'company', name: '民生银行公司收款账户', holder: '福建凯撒国际旅行社有限公司', number: '6214 **** 0038', bank: '民生银行北京分行', uses: ['门店缴款至公司', '客户转账收款', '商户结算'] },
      { id: 'bank-fj-2', kind: 'company', name: '招商银行公司备用收款账户', holder: '福建凯撒国际旅行社有限公司', number: '7559 **** 1026', bank: '招商银行厦门分行', uses: ['门店缴款至公司', '客户转账收款', '商户结算', '对外付款'] },
      { id: 'bank-sh-1', kind: 'company', name: '上海公司收款账户', company: '上海凯撒', holder: '上海凯撒国际旅行社有限公司', number: '3100 **** 8821', bank: '中国银行上海分行', uses: ['客户转账收款'], scope: ['上海营业部'] },
      { id: 'bank-fj-old', kind: 'company', name: '民生银行旧收款账户', holder: '福建凯撒国际旅行社有限公司', number: '6214 **** 9910', bank: '民生银行厦门分行', uses: ['客户转账收款'], status: '停用' },
      { id: 'pay-fj-1', kind: 'merchant', name: '福建凯撒聚合支付商户', holder: '福建凯撒国际旅行社有限公司', number: 'YB-FJ-2026001', bank: '', provider: '易宝支付', settlement: 'bank-fj-1', uses: ['客户扫码收款'], channels: '微信、支付宝', proof: '商户协议及结算账户证明已核验' },
      { id: 'pay-fj-old', kind: 'merchant', name: '福建凯撒旧支付商户', holder: '福建凯撒国际旅行社有限公司', number: 'YB-FJ-2025018', bank: '', provider: '易宝支付', settlement: 'bank-fj-old', uses: ['客户扫码收款'], channels: '微信、支付宝', status: '停用', proof: '原商户协议已留存' },
      ...storeNames.map((name, i) => ({ id: 'store-bank-' + (i + 1), kind: 'store', name: name + '收付款账户', holder: i % 3 === 0 ? '福建凯撒国际旅行社有限公司' : name + '旅行服务有限公司', number: '6225 **** ' + String(1000 + i), bank: '民生银行厦门思明支行', scope: [name], uses: uses.store.slice(), proof: '账户证明及门店用款关系已核验' }))
    ].map(x => Object.assign(copy(shared), x));
    const state = { today, rows, requests: [], sequence: 10 };
    const original = copy(rows[0]);
    state.requests.push({ id: 'SP-ZJ-001', rowId: original.id, status: '审批中', before: original, after: { ...copy(original), scope: storeNames.slice(0, 3) }, reason: '泉州门店改用公司备用账户，申请缩小使用范围', requestedDate: '2026-10-01', approvedAt: '', effectiveAt: '', action: '变更', events: ['2026-09-14 财务专员提交，当前资料继续有效'] });
    const old = rows.find(r => r.id === 'pay-fj-old');
    state.requests.push({ id: 'SP-ZJ-002', rowId: old.id, status: '已生效', before: { ...copy(old), status: '正常' }, after: copy(old), reason: '旧商户停止新收款，原订单退款继续按原商户处理', requestedDate: '2026-09-10', approvedAt: '2026-09-11', effectiveAt: '2026-09-11', action: '停用', events: ['2026-09-10 提交停用', '2026-09-11 公司财务负责人批准并生效'] });
    const future = copy(rows[1]);
    state.requests.push({ id: 'SP-ZJ-003', rowId: future.id, status: '待生效', before: future, after: { ...copy(future), name: '招商银行公司收款账户' }, reason: '备用账户转为日常收款账户，门店默认另行申请', requestedDate: '2026-10-01', approvedAt: '2026-09-13', effectiveAt: '2026-10-01', action: '变更', events: ['2026-09-13 已批准，2026-10-01启用'] });
    refresh(state, today);
    return state;
  }
  function refresh(state, today) {
    state.today = today;
    state.requests.filter(r => r.status === '待生效' && r.approvedAt).forEach(r => {
      r.effectiveAt = [r.requestedDate, r.approvedAt].sort().pop();
      if (r.effectiveAt > today) return;
      const row = state.rows.find(x => x.id === r.rowId);
      const value = { ...copy(r.after), approvedAt: r.approvedAt, effectiveAt: r.effectiveAt };
      if (row) Object.assign(row, value); else state.rows.push(value);
      r.status = '已生效'; r.events.push(r.effectiveAt + ' 生效，原资料保留');
    });
  }
  function eligible(state, key, company, store) {
    const [kind, use] = selections[key];
    return state.rows.filter(r => r.kind === kind && r.status === '正常' && r.company === company && r.currency === 'CNY' && r.scope.includes(store) && r.uses.includes(use) && r.approvedAt && r.effectiveAt && r.effectiveAt <= state.today && (kind !== 'merchant' || state.rows.some(b => b.id === r.settlement && b.kind === 'company' && b.company === r.company && b.currency === r.currency && b.status === '正常' && b.uses.includes('商户结算') && b.scope.includes(store))));
  }
  function label(state, id) { const r = state.rows.find(x => x.id === id); return r ? r.name + ' / ' + r.number : id ? '原账户资料待核实' : '未选用'; }
  function validateSelection(state, values, company, store) {
    for (const key of Object.keys(selections)) {
      const required = ['companyReceive', 'payer', 'beneficiary'].includes(key) || key === 'merchant' && values.methods.includes('聚合扫码') || key === 'customerReceive' && values.methods.includes('对公转账');
      if (!values[key] && required) throw Error('请选择' + selections[key][1]);
      if (values[key] && !eligible(state, key, company, store).some(r => r.id === values[key])) throw Error(selections[key][1] + '不在当前已核准范围，请重新选用');
    }
  }
  function validate(state, value) {
    for (const key of ['name', 'holder', 'number', 'company', 'currency', 'proof']) if (!value[key]?.trim()) throw Error('请补齐账户名称、户名、账号、公司、币种和核验资料');
    if (state.rows.some(r => r.id !== value.id && r.kind === value.kind && r.company === value.company && r.number.replace(/\s/g, '') === value.number.replace(/\s/g, '') && (r.kind !== 'merchant' || r.provider === value.provider))) throw Error('该账号或商户号已存在，请维护原资料');
    if (!value.uses.length || value.uses.some(x => !uses[value.kind].includes(x))) throw Error('请选择适用用途');
    if (!value.scope.length) throw Error('请选择可使用门店');
    const allowedStores = value.company === '福建凯撒' ? storeNames : value.company === '上海凯撒' ? ['上海营业部'] : [];
    if (value.scope.some(x => !allowedStores.includes(x))) throw Error('门店须属于当前公司');
    if (value.kind === 'company' && state.rows.some(m => m.kind === 'merchant' && m.status === '正常' && m.settlement === value.id && (!value.uses.includes('商户结算') || m.scope.some(x => !value.scope.includes(x))))) throw Error('关联商户仍使用该结算账户及门店范围，请先办理商户变更');
    if (value.kind === 'store' && value.scope.length !== 1) throw Error('每份门店收付款资料只能对应一个门店');
    if (value.kind !== 'merchant' && !value.bank.trim()) throw Error('请填写开户行');
    if (value.kind === 'merchant') {
      if (!value.provider?.trim() || !value.channels?.trim()) throw Error('请填写支付机构及支付渠道');
      const bank = state.rows.find(x => x.id === value.settlement);
      if (!bank || bank.kind !== 'company' || bank.status !== '正常' || bank.company !== value.company || bank.currency !== value.currency || !bank.uses.includes('商户结算') || value.scope.some(s => !bank.scope.includes(s))) throw Error('商户结算账户须属于同一公司、币种，且已核准相应用途和门店范围');
    }
  }
  function submit(state, rowId, after, reason, date, action, draft, requestId) {
    const before = state.rows.find(r => r.id === rowId) || null;
    const previous = state.requests.find(r => r.id === requestId);
    if (previous && !['草稿', '已退回', '已撤回'].includes(previous.status)) throw Error('当前申请不能修改');
    if (state.requests.some(r => r.rowId === rowId && r.id !== requestId && ['草稿', '审批中', '待生效'].includes(r.status))) throw Error('已有申请，请先处理原申请');
    if (!draft) {
      if (!reason.trim() || !date || date < state.today) throw Error('请填写原因及今天或之后的生效日期');
      if (before && ['kind', 'company', 'holder', 'number', 'currency'].some(k => before[k] !== after[k])) throw Error('账号、商户号或归属变更请新增资料，保留原记录');
      if (action !== '停用') validate(state, after);
      if (action === '停用' && before?.status !== '正常') throw Error('只有正常账户或商户可以申请停用');
    }
    const r = { id: previous?.id || 'SP-ZJ-' + (++state.sequence), rowId, before: copy(before), after: copy(after), reason, requestedDate: date, approvedAt: '', effectiveAt: '', action, status: draft ? '草稿' : '审批中', events: (previous?.events || []).concat(state.today + (draft ? ' 保存草稿' : ' 提交公司财务负责人审批')) };
    if (previous) Object.assign(previous, r); else state.requests.unshift(r);
    return r;
  }
  function withdraw(state, id) { const r = state.requests.find(x => x.id === id); if (r?.status !== '审批中') throw Error('当前申请不能撤回'); r.status = '已撤回'; r.events.push(state.today + ' 申请人撤回'); }
  const api = { create, refresh, copy, uses, selections, eligible, label, validate, validateSelection, submit, withdraw, storeNames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CaesarFundAccounts = api;
})(typeof window !== 'undefined' ? window : null);
