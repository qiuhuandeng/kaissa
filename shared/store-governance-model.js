(function (root) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  function day(offset, base) {
    const d = base ? new Date(base + 'T12:00:00') : new Date();
    d.setDate(d.getDate() + (offset || 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  const employees = [
    { id: 'E001', name: '孙丽', phone: '138****8800', company: '福建凯撒', org: '厦门分公司 / 厦门思明区门市部', store: '软件园门店', role: '店长', status: '正常', scope: '本店订单及成员', money: '本店经营及资金明细', orders: 3, customers: 12 },
    { id: 'E002', name: '郑华', phone: '138****8801', company: '福建凯撒', org: '厦门分公司 / 厦门思明区门市部', store: '软件园门店', role: '店员', status: '正常', scope: '本人客户和订单', money: '本人订单客户应付及已收', orders: 2, customers: 8 },
    { id: 'E003', name: '周敏', phone: '138****8802', company: '福建凯撒', org: '厦门分公司 / 厦门思明区门市部', store: '软件园门店', role: '财务联系人', status: '待生效', scope: '本店充值申请及对账', money: '本店账户明细', orders: 0, customers: 0 },
    { id: 'E004', name: '李梅', phone: '137****1188', company: '福建凯撒', org: '泉州分公司 / 泉州丰泽门市部', store: '泉州丰泽门店', role: '店长', status: '正常', scope: '本店订单及成员', money: '本店经营及资金明细', orders: 4, customers: 16 },
    { id: 'E005', name: '陈红', phone: '139****2211', company: '福建凯撒', org: '厦门分公司 / 厦门思明区门市部', store: '观音山门店', role: '客服', status: '正常', scope: '已分配客户和订单', money: '所服务订单客户应付及已收', orders: 2, customers: 6 },
    { id: 'E006', name: '吴芳', phone: '136****2210', company: '福建凯撒', org: '泉州分公司 / 泉州丰泽门市部', store: '泉州鲤城门店', role: '店员', status: '正常', scope: '本人客户和订单', money: '本人订单客户应付及已收', orders: 1, customers: 5 },
    { id: 'E007', name: '周伟', phone: '135****6677', company: '福建凯撒', org: '泉州分公司 / 泉州丰泽门市部', store: '泉州东海门店', role: '店长', status: '已停用', scope: '无本店操作权限', money: '无资金权限', orders: 0, customers: 0 },
    { id: 'E008', name: '陈晓', phone: '138****5526', company: '福建凯撒', org: '厦门分公司 / 厦门思明区门市部', store: '软件园门店', role: '店员', status: '正常', scope: '本人客户和订单', money: '本人订单客户应付及已收', orders: 1, customers: 3 }
  ];
  const fields = {
    profile: { name: '门店名称', type: '门店类型', company: '所属公司', org: '所属组织', contact: '负责人', phone: '联系电话', address: '地址', start: '合作开始', expiry: '合作到期', license: '营业执照', agreement: '合作协议', openDate: '开通日期' },
    sales: { products: '可售产品类型', destinations: '可售目的地', contractCompany: '签约公司', template: '合同模板', reserveHours: '预留时长（小时）', holdHours: '人工占位时长（小时）', conditions: '订单与合同付款条件' },
    finance: { settlement: '结算安排', methods: '允许付款方式', companyReceive: '门店缴款至公司', customerReceive: '客户转账收款', merchant: '客户扫码收款商户', payer: '门店缴款来源', beneficiary: '门店接收分润或退款', invoice: '开票抬头', fee: '月管理费', feeMethod: '管理费收取方式', paymentNode: '付款节点' },
    restore: { status: '合作状态' }
  };
  const titles = { profile: '档案准入', sales: '销售授权', finance: '财务配置', restore: '恢复营业' };
  function create(base) {
    const today = base || day();
    const names = ['软件园门店', '文灶门店', '观音山门店', '泉州丰泽门店', '泉州鲤城门店', '泉州东海门店'];
    const stores = names.map((name, i) => ({
      id: 'store-' + (i + 1), status: i === 1 ? '待开通' : i === 2 || i === 5 ? '暂停' : '正常',
      profile: { name, type: ['自营门店', '加盟门店', '合作门店'][i % 3], company: '福建凯撒', org: i < 3 ? '厦门分公司 / 厦门思明区门市部' : '泉州分公司 / 泉州丰泽门市部', contact: ['孙丽', '沈悦', '陈红', '李梅', '吴芳', '周伟'][i], phone: '138****8800', address: i < 3 ? '厦门市思明区观日路18号' : '泉州市丰泽区丰泽街128号', start: '2026-05-01', expiry: i === 5 ? day(-5, today) : day(180, today), license: '营业执照已提交', agreement: '门店合作协议已提交', openDate: i === 1 ? day(3, today) : '2026-05-01' },
      sales: { products: ['参团游', '邮轮'], destinations: ['欧洲', '国内'], contractCompany: '福建凯撒', template: '标准国内/出境旅游合同', reserveHours: '', holdHours: '', conditions: '待销售、计调、财务及法务确认' },
      finance: { settlement: i === 4 ? '月结' : '单单结', methods: ['对公转账', '预存抵扣'], companyReceive: 'bank-fj-1', customerReceive: 'bank-fj-1', merchant: 'pay-fj-1', payer: 'store-bank-' + (i + 1), beneficiary: 'store-bank-' + (i + 1), invoice: name + '旅行服务有限公司', fee: '待协议确认', feeMethod: '随门店对账收取', paymentNode: '待财务确认' },
      reviews: { profile: i === 1 ? '审批中' : '已通过', sales: i === 1 ? '未提交' : '已生效', finance: i === 1 ? '已退回' : '已生效' },
      accountState: i === 2 ? '整户冻结' : '正常', available: i === 0 ? '¥86,000' : '¥18,600', frozen: i === 0 ? '¥12,800' : '¥0',
      orders: i === 1 ? 0 : 3, refunds: i === 1 ? 0 : 1, reconciliation: i === 1 ? 0 : 1,
      serviceOwner: ['孙丽', '沈悦', '陈红', '李梅', '吴芳', '周伟'][i], log: []
    }));
    const records = [];
    function sample(id, storeId, kind, status, patch, requestedDate, approvedAt, reason) {
      const store = stores.find(s => s.id === storeId);
      const before = copy(store[kind] || { status: store.status });
      records.push({ id, storeId, kind, status, before, after: Object.assign(copy(before), patch), mode: '指定日期', requestedDate, approvedAt: approvedAt || '', effectiveAt: '', reason, reviewer: kind === 'finance' ? '公司财务' : '门店运营负责人', events: [{ text: '提交申请', date: day(-5, today) }] });
    }
    sample('BG-MS-001', 'store-1', 'sales', '审批中', { products: ['参团游', '邮轮', '自由行'] }, day(3, today), '', '增加自由行可售范围');
    sample('BG-MS-002', 'store-1', 'finance', '已退回', { settlement: '月结' }, day(1, today), '', '月度核对安排调整；退回原因：补充结算协议');
    sample('BG-MS-003', 'store-1', 'profile', '待生效', { contact: '郑华' }, day(7, today), day(-1, today), '负责人轮岗，指定日期生效');
    sample('BG-MS-004', 'store-4', 'sales', '待生效', { destinations: ['欧洲', '国内', '日本'] }, day(-3, today), day(-1, today), '审批晚于申请日期，按实际批准日期启用');
    const state = { today, stores, records, members: copy(employees), memberRecords: [], sequence: 100 };
    refresh(state, today);
    return state;
  }
  function refresh(state, today) {
    state.today = today;
    state.records.forEach(r => {
      if (r.status !== '待生效' || !r.approvedAt) return;
      const effective = r.mode === '批准后生效' ? r.approvedAt : [r.requestedDate, r.approvedAt].sort().pop();
      r.effectiveAt = effective;
      if (effective > today) return;
      const s = state.stores.find(x => x.id === r.storeId);
      if (r.kind === 'restore') s.status = '正常';
      else { s[r.kind] = copy(r.after); s.reviews[r.kind] = r.kind === 'profile' ? '已通过' : '已生效'; }
      r.status = '已生效';
      r.events.push({ date: effective, text: '生效，原资料保留在本记录中' });
    });
    state.stores.forEach(s => {
      if (s.status === '待开通' && s.reviews.profile === '已通过' && s.profile.openDate <= today && s.profile.expiry >= today) s.status = '正常';
    });
  }
  function restoreGaps(s, today) {
    const gaps = [];
    if (s.profile.expiry < today) gaps.push('合作资质已到期，需先完成续签');
    if (s.reviews.profile !== '已通过') gaps.push('档案准入未通过');
    if (s.reviews.sales !== '已生效') gaps.push('销售授权未生效');
    if (s.reviews.finance !== '已生效') gaps.push('财务配置未生效');
    return gaps;
  }
  function save(state, storeId, kind, after, options, recordId) {
    const s = state.stores.find(x => x.id === storeId);
    if (!s) throw Error('门店不存在');
    const status = options.draft ? '草稿' : '审批中';
    if (!options.draft && !options.reason.trim()) throw Error('请填写申请原因');
    if (!options.draft && options.mode !== '批准后生效' && !/^\d{4}-\d{2}-\d{2}$/.test(options.requestedDate)) throw Error('请选择生效日期');
    if (kind === 'restore' && restoreGaps(s, state.today).length) throw Error(restoreGaps(s, state.today).join('；'));
    let r = state.records.find(x => x.id === recordId);
    if (r && !['草稿', '已退回', '已撤回'].includes(r.status)) throw Error('当前申请不能修改');
    if (state.records.some(x => x.id !== recordId && x.storeId === storeId && x.kind === kind && ['草稿', '审批中', '待生效'].includes(x.status))) throw Error('已有同类申请，请先查看变更记录');
    if (!r) { r = { id: 'BG-MS-' + (++state.sequence), storeId, kind, before: copy(s[kind] || { status: s.status }), events: [] }; state.records.unshift(r); }
    Object.assign(r, { after: copy(after), reason: options.reason, mode: options.mode, requestedDate: options.requestedDate || '', approvedAt: '', effectiveAt: '', status, reviewer: kind === 'finance' ? '公司财务' : '门店运营负责人' });
    r.events.push({ date: state.today, text: options.draft ? '保存草稿' : '提交审批' });
    return r;
  }
  function withdraw(state, id) {
    const r = state.records.find(x => x.id === id);
    if (!r || r.status !== '审批中') throw Error('仅审批中的申请可以撤回');
    r.status = '已撤回'; r.events.push({ date: state.today, text: '申请人撤回，当前有效资料不变' });
  }
  const api = { copy, day, employees, fields, titles, create, refresh, restoreGaps, save, withdraw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CaesarStoreGovernance = api;
})(typeof window === 'undefined' ? globalThis : window);
