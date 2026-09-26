(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OutsourceOrderHandoff = api;
})(typeof window !== 'undefined' ? window : this, function () {
  // 当前页独立示例；供应商回复与客户应收分别表达。
  var examples = [
    { orderNo: 'WC20260926001', reply: '待供应商确认', planner: '', advisor: '', confirmation: '', basis: '已提交2位成人报名需求，供应商尚未回复', task: '责任计调未分配', holdUntil: '', expired: false },
    { orderNo: 'WC20260926002', reply: '暂时保留', planner: '王芳', advisor: '孙丽', confirmation: 'EU-HOLD-0926-02', basis: '2位成人暂保；原保留期限已到，尚无正式确认件', task: '暂保已超时，未收到正式确认', holdUntil: '2026-09-26 10:00', expired: true },
    { orderNo: 'WC20260926003', reply: '已确认', planner: '王芳', advisor: '孙丽', confirmation: 'EU-OK-0926-03', basis: '2位成人按原报价确认；计调已核对确认件', task: '资源已确认，销售办理合同与收款', holdUntil: '', expired: false },
    { orderNo: 'WC20260926004', reply: '补差待我方确认', planner: '王芳', advisor: '孙丽', confirmation: 'EU-ADJ-0926-04', basis: '原订单已确认；新增酒店加住1晚，供应商申报增加1200元，尚待计调核价及客户费用约定', task: '供应商补差1200元，客户费用待确认', supplement: 1200, holdUntil: '', expired: false },
    { orderNo: 'WC20260926005', reply: '无法承接', planner: '王芳', advisor: '孙丽', confirmation: 'EU-NO-0926-05', basis: '供应商回复酒店无房，未确认资源；客户尚未选择替代安排或取消', task: '供应商无位，订单仍待处理', holdUntil: '', expired: false }
  ].map(function (r) { return Object.assign({ supplier: '欧洲联合地接社', product: '欧洲十国经典游·12天', schedule: 'EU20261008001', date: '2026-10-08', back: '2026-10-19', amount: 25600, history: [] }, r); });
  function find(no) { var row = examples.find(function (r) { return r.orderNo === no; }); return row ? JSON.parse(JSON.stringify(row)) : null; }
  function next(row) {
    if (!row.planner) return '外采计调组接手订单；销售顾问未分配';
    if (row.reply === '已确认') return '销售顾问' + row.advisor + '办理合同与收款';
    if (row.reply === '补差待我方确认') return '计调' + row.planner + '核价；销售顾问' + row.advisor + '确认客户费用，必要时发起应收调整';
    if (row.reply === '无法承接') return '计调' + row.planner + '重新安排资源；销售顾问' + row.advisor + '办理变更或取消';
    return '计调' + row.planner + (row.expired ? '重新确认资源；销售顾问' + row.advisor + '核对客户是否继续保留' : '承接供应商回复');
  }
  function block(row) {
    if (!row.planner) return '责任计调未分配，请先接手订单';
    if (row.expired) return '暂保已到期，须重新确认资源';
    return row.reply === '已确认' ? '' : '供应商回复为“' + row.reply + '”，不能据此转确认';
  }
  return { examples: examples, find: find, next: next, block: block };
});
