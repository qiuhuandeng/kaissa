(function () {
  'use strict';
  if (!['funds', 'fund'].includes(document.getElementById('finance-cashflow')?.dataset.report || new URLSearchParams(location.search).get('report'))) return;
  const m = window.CaesarFunds, ui = window.CaesarReadonlyReport, parent = document.getElementById('finance-cashflow');
  if (!m || !ui || !parent) return;
  const host = document.createElement('section'); host.id = 'finance-funds'; parent.append(host);
  const labels = { id: '流水/安排单号', account: '账户', name: '实际账户名称', number: '账户/商户号', company: '资金公司', currency: '原币', opening: '期初余额', incoming: '实际流入', outgoing: '实际流出', externalIn: '对外流入', externalOut: '对外流出', closing: '期末余额', restricted: '受限资金', available: '期末可用资金', converted: '期末折人民币', rate: '折算汇率', rateDate: '汇率日期', rateProof: '汇率依据', proof: '确认凭据', coverage: '资料情况', date: '实际日期', recorded: '录入日期', nature: '收支性质', party: '往来方', transfer: '转账/提现单号', peer: '对方流水', peerStatus: '双方对应情况', period: '统计期间', direction: '安排方向', planned: '计划日期', due: '到期日期', gross: '原节点金额', paid: '已付/已收', offsetApplied: '已冲抵', offsetPlanned: '计划预付冲抵', prepay: '原预付款', plannedIn: '计划收款', plannedOut: '计划付款/退款', plannedOffsets: '计划预付冲抵', plannedClosing: '计划期末可用', inclusion: '本次是否纳入', obligation: '合同/应付节点', replacedBy: '替代安排单号', commitment: '收款安排依据', offsetProof: '冲抵安排依据', order: '订单/阶段', purchase: '采购批次', issue: '资料缺口' };
  const money = ['opening', 'incoming', 'outgoing', 'externalIn', 'externalOut', 'closing', 'restricted', 'available', 'converted', 'gross', 'paid', 'offsetApplied', 'offsetPlanned', 'plannedIn', 'plannedOut', 'plannedOffsets', 'plannedClosing'];
  const columns = { accounts: ['account', 'name', 'company', 'currency', 'opening', 'incoming', 'outgoing', 'closing', 'restricted', 'available', 'coverage'], movements: ['id', 'date', 'name', 'company', 'currency', 'nature', 'incoming', 'outgoing', 'transfer', 'peerStatus', 'proof'], periods: ['period', 'account', 'company', 'currency', 'opening', 'incoming', 'outgoing', 'closing', 'coverage'], plan: ['id', 'company', 'currency', 'direction', 'planned', 'gross', 'paid', 'offsetApplied', 'offsetPlanned', 'plannedIn', 'plannedOut', 'inclusion'] };
  ui.mount(host, { title: '资金收支与安排', showTitle: false, views: m.views, defaults: m.defaults, query: m.query, labels, money, columns: q => columns[q.view], extras: ['number', 'party', 'converted', 'rate', 'rateDate', 'rateProof', 'recorded', 'peer', 'prepay', 'due', 'obligation', 'replacedBy', 'commitment', 'offsetProof', 'order', 'purchase'], filters: [
    { key: 'dataset', label: '资料范围', options: [['pending', '来源待接入'], ['demo', '正常验收算例'], ['gaps', '含资料缺口算例']] },
    { key: 'start', label: '实际期间开始', type: 'date' }, { key: 'end', label: '余额截止日', type: 'date' }, { key: 'cutoff', label: '资料截止日', type: 'date' },
    { key: 'company', label: '资金公司', options: [['', '全部，分别合计'], ...['北京凯撒', '福建凯撒', '待核对公司'].map(v => [v, v])] },
    { key: 'currency', label: '原币', options: [['', '全部，分别合计'], ['CNY', '人民币'], ['EUR', '欧元']] },
    { key: 'frequency', label: '日周月汇总', options: [['day', '日'], ['week', '周（周一开始）'], ['month', '月']], more: true },
    { key: 'account', label: '实际账户', options: [['', '全部'], ...m.fixture().accounts.filter(a => a.kind === '实际账户').map(a => [a.id, a.name])], more: true },
    { key: 'nature', label: '收支明细性质', options: [['', '全部'], ...['外部收支', '内部转账', '平台提现'].map(v => [v, v])], more: true },
    { key: 'keyword', label: '实际流水/往来方', more: true }, { key: 'planStart', label: '未来安排开始', type: 'date', more: true }, { key: 'planEnd', label: '未来安排结束', type: 'date', more: true }
  ], definition: '实际账户期初加收减支等于期末，受限资金单列；预收、预存责任不再次扣银行余额。内部转账和平台提现不计集团对外流入。未来安排按有效节点扣已收付、已冲抵和批准计划冲抵；逾期未确定收款单列，不视作必收。账户全额合计不随单笔流水搜索改变。原币分别计算，缺当日汇率不猜折算；原型非正式资金计划。' });
})();
