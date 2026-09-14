/* 预存账户生命周期演示；不持久化，不生成真实资金单据。 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PredepositControlModel = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  function amount(value) { return Number(String(value || 0).replace(/[^\d.-]/g, '')) || 0; }
  function money(value) { return '¥' + value.toLocaleString('zh-CN'); }
  function seed() {
    var names = ['软件园门店','文灶门店','观音山门店','泉州丰泽门店','泉州鲤城门店','杏林门店'];
    var available = [86000,42600,18600,1200,6200,0], held = [12800,0,0,0,8000,0];
    return names.map(function (name, i) {
      return { id: 'pd-' + (i + 1), name: name, accountNo: '8888-000' + (i + 1) + '-2025-0001',
        holder: name, company: '福建凯撒国际旅行社有限公司', currency: '人民币', purpose: '门店订单预存',
        ledger: available[i] + held[i], held: held[i], pendingCount: [3,0,1,0,1,0][i], disputes: i === 4 ? 1 : 0,
        status: i === 5 ? '已关闭' : i === 4 ? '冻结' : '正常',
        restrictions: i === 4 ? ['deduction','refund'] : [], reason: i === 4 ? '争议款项核对中，暂停扣款和退款，允许充值。' : '',
        holds: held[i] ? [{ no: i === 4 ? 'DJ20260625008' : 'DJ20260625001', source: i === 4 ? '争议订单 ORD202606250088' : '订单扣款 DK20260625001、DK20260625002', amount: held[i] }] : [],
        history: [{date:'2026-09-14',action:i === 5 ? '关闭账户' : i === 4 ? '整户冻结' : '开户成功',operator:'公司财务',reason:i === 5 ? '余额及未结事项已清理，历史记录保留。' : '财务审核记录已归档。'}] };
    });
  }
  function requests() {
    return [
      {id:'KHSQ20260914001',name:'开元门店',holder:'开元门店',company:'福建凯撒国际旅行社有限公司',currency:'人民币',purpose:'门店订单预存',proof:'门店开户资料及预存协议',status:'审批中',approval:'APR-YC-001'},
      {id:'KHSQ20260914002',name:'东海门店',holder:'东海门店',company:'福建凯撒国际旅行社有限公司',currency:'人民币',purpose:'门店订单预存',proof:'已核准的开户资料及预存协议',status:'待开通',approval:'APR-YC-002',reused:true},
      {id:'KHSQ20260914003',name:'湖里门店',holder:'湖里门店',company:'福建凯撒国际旅行社有限公司',currency:'人民币',purpose:'门店订单预存',proof:'预存协议待补齐',status:'已退回',approval:'APR-YC-003',reason:'请补充余额归属方确认及预存协议。'}
    ];
  }
  function blocked(account, action) {
    if (account.status === '已关闭') return '账户已关闭，仅可查询历史记录；再次使用请重新申请开户。';
    if (account.status === '冻结' && account.restrictions.indexOf(action) >= 0) return '整户冻结限制了本次操作：' + account.reason;
    return '';
  }
  function closeChecks(a) {
    return [{label:'账面余额为零',ok:a.ledger === 0},{label:'金额冻结已解除',ok:a.held === 0},
      {label:'在途申请已处理',ok:a.pendingCount === 0},{label:'争议事项已结清',ok:a.disputes === 0}];
  }
  function record(a, action, reason) { a.history.unshift({date:new Date().toISOString().slice(0,10),action:action,reason:reason,operator:'公司财务'}); }
  function control(a, action, reason, restrictions, role) {
    if (role !== 'finance') throw Error('整户控制由公司财务处理');
    if (!reason || !reason.trim()) throw Error('请填写处理原因');
    if (action === 'freeze') {
      if (a.status !== '正常') throw Error('仅正常账户可整户冻结');
      if (!restrictions || !restrictions.length || restrictions.some(function (v) { return ['recharge','deduction','refund'].indexOf(v) < 0; })) throw Error('至少选择一项操作限制');
      a.status = '冻结'; a.restrictions = restrictions.slice(); a.reason = reason; record(a,'整户冻结',reason);
    } else if (action === 'restore') {
      if (a.status !== '冻结') throw Error('仅冻结账户可恢复');
      a.status = '正常'; a.restrictions = []; a.reason = ''; record(a,'恢复账户',reason);
    } else if (action === 'close') {
      if (a.status === '已关闭') throw Error('账户已关闭');
      var failed = closeChecks(a).filter(function (c) { return !c.ok; });
      if (failed.length) throw Error('暂不能关闭：' + failed.map(function (c) { return c.label; }).join('、'));
      a.status = '已关闭'; a.restrictions = []; record(a,'关闭账户',reason);
    } else throw Error('未知操作');
  }
  function duplicate(list, r) { return list.some(function (a) { return a.status !== '已关闭' && a.holder === r.holder && a.company === r.company && a.currency === r.currency && a.purpose === r.purpose; }); }
  function validate(r, accounts, allRequests) {
    if (![r.name,r.holder,r.company,r.currency,r.purpose,r.proof].every(function (v) { return v && v.trim(); })) throw Error('请补齐门店、余额归属方、负责公司、币种、用途及开户资料');
    if (duplicate(accounts,r)) throw Error('同一余额归属方、公司、币种和用途已有有效账户');
    if (allRequests.some(function (x) { return x.id !== r.id && ['审批中','待开通'].indexOf(x.status) >= 0 && x.holder === r.holder && x.company === r.company && x.currency === r.currency && x.purpose === r.purpose; })) throw Error('已有在途开户申请，请查看申请进度');
  }
  function open(r, accounts, role) {
    if (role !== 'finance') throw Error('开户由公司财务执行');
    if (r.status !== '待开通') throw Error('开户资料尚未核准');
    if (duplicate(accounts,r)) throw Error('已有有效账户，不能重复开通');
    var n = 'YC20260914' + String(accounts.length + 1).padStart(4,'0');
    var a = {id:'pd-new-' + n,name:r.name,accountNo:n,holder:r.holder,company:r.company,currency:r.currency,purpose:r.purpose,ledger:0,held:0,pendingCount:0,disputes:0,status:'正常',restrictions:[],reason:'',holds:[],history:[]};
    record(a,'开户成功','引用核准记录 ' + r.approval); accounts.push(a); r.status = '已开通'; r.accountNo = n; return a;
  }
  return {seed:seed,requests:requests,amount:amount,money:money,blocked:blocked,closeChecks:closeChecks,control:control,validate:validate,open:open};
});
