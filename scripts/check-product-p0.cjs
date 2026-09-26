const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const income = require('../shared/settlement-income-basis.js');
const handoff = require('../shared/outsource-order-handoff.js');
const quote = require('../shared/supplier-quote-validation.js');
const quantity = require('../shared/procurement-quantity-change.js');
let n = 0;
function check(name, run) { run(); console.log('PASS ' + name); n++; }
const row = (receivable, received, refund = 0, discount = 0) => ({ receivable, received, refund, discount });
check('两单逐笔汇总8000实收、12000待收', () => {
  const t = income.totals([row(8000, 8000), row(12000, 0)]);
  assert.equal(t.receivable, 20000); assert.equal(t.received, 8000); assert.equal(t.unreceived, 12000);
});
check('明确0元有效且不冒充已收齐', () => { const t = income.totals([row(10000, 0)]); assert.ok(t.ready); assert.equal(t.received, 0); assert.equal(t.unreceived, 10000); });
check('已含优惠不重复扣应收', () => { const t = income.totals([row(9000, 8000, 0, 1000)]); assert.equal(t.unreceived, 1000); });
check('部分退款只减净收款，不重复减当前应收', () => { const t = income.totals([row(8000, 10000, 2000)]); assert.equal(t.netReceived, 8000); assert.equal(t.unreceived, 0); assert.equal(t.receivable, 8000); });
check('待退与待收分开，不用负未收抵消', () => { const t = income.totals([row(8000, 10000), row(5000, 0)]); assert.equal(t.refundable, 2000); assert.equal(t.unreceived, 5000); assert.equal(t.balanceGap, 0); });
check('缺少金额或退款大于已收不得记为已核对', () => { assert.equal(income.totals([row(1000, null)]).ready, false); assert.equal(income.totals([row(1000, 500, 600)]).ready, false); assert.equal(income.totals([]).ready, false); });
check('九个团期示例均可核对且订单号不重复', () => {
  const ids = new Set(); Object.values(income.examples).forEach(rows => { const t = income.totals(rows); assert.ok(t.ready); assert.equal(t.balanceGap, 0); rows.forEach(r => { assert.ok(!ids.has(r.no)); ids.add(r.no); }); });
});
const purchase = () => ({contractNo:'CG001',subtypes:[{name:'A',unit:'间',total:40,allocated:0,sold:0,issued:0,unitPrice:100},{name:'B',unit:'间',total:60,allocated:0,sold:0,issued:0,unitPrice:200}],allocations:[],payments:[{node:'定金',amount:8000,paymentStatus:'未付款'}]});
check('两种规格变更30及50得到80间13000元',()=>{const c=purchase(),r=quantity.preview(c,[30,50],{0:50});assert.deepEqual(r.errors,[]);assert.equal(r.afterAmount,13000);quantity.apply(c,r,'供应商确认');assert.equal(c.effectiveQty,80);assert.equal(c.subtypes[1].total,50);assert.equal(c.payments[0].amount,6500);});
check('全部减0后未付节点真正为0',()=>{const c=purchase(),r=quantity.preview(c,[0,0],{0:50});quantity.apply(c,r,'未占用取消');assert.equal(c.effectiveQty,0);assert.equal(c.payments[0].amount,0);});
check('少于已分配不能修改原采购',()=>{const c=purchase();c.subtypes[0].allocated=30;const before=JSON.stringify(c),r=quantity.preview(c,[20,60],{0:50});assert.match(r.errors.join(''),/少于/);assert.throws(()=>quantity.apply(c,r,'减量'));assert.equal(JSON.stringify(c),before);});
check('跨团分配合计约束及已出票约束',()=>{const c=purchase();c.allocations=[{subtype:'A',allocated:20,scheduleNo:'团1'},{subtype:'A',allocated:15,scheduleNo:'团2'}];assert.match(quantity.preview(c,[30,60],{0:50}).errors.join(''),/团1、团2/);c.allocations=[];c.subtypes[0].issued=35;assert.match(quantity.preview(c,[30,60],{0:50}).errors.join(''),/35间/);});
check('已付及在途申请不被改写，多付余额单列',()=>{const c=purchase();c.payments=[{node:'已付',amount:9000,paymentStatus:'已付款',paymentNo:'PAY1'},{node:'在途',amount:2000,applyNo:'AP1',approvalStatus:'审批中'}];const before=JSON.stringify(c.payments),r=quantity.preview(c,[10,10],{});quantity.apply(c,r,'供应商同意减量');assert.equal(JSON.stringify(c.payments),before);assert.equal(r.overpaid,6000);assert.equal(r.overcommitted,8000);});
check('空数量、负数、小数和缺付款比例拦截',()=>{for(const raw of ['',-1,1.5])assert.ok(quantity.preview(purchase(),[raw,60],{0:50}).errors.length);assert.match(quantity.preview(purchase(),[30,50],{}).errors.join(''),/付款比例/);});
check('空报价和负报价不可提交，0可提交',()=>{assert.equal(quote.price(''),null);assert.equal(quote.price('-1'),null);assert.equal(quote.price('¥0'),0);assert.equal(quote.price('¥1,280.50'),1280.5);assert.equal(quote.errors([{name:'成人',public:0,settlement:0}]).length,0);assert.equal(quote.errors([{name:'儿童',public:1200,settlement:null}]).length,1);});
check('外采五种回复只有明确确认可放行，暂保超时不能放行',()=>{for(const row of handoff.examples) assert.equal(!handoff.block(row),row.reply==='已确认');});
check('无顾问有计调组承接，补差不改客户原应收',()=>{const pending=handoff.find('WC20260926001'),adjust=handoff.find('WC20260926004');assert.match(handoff.next(pending),/计调组接手/);assert.equal(adjust.amount,25600);assert.equal(adjust.supplement,1200);pending.planner='王芳';assert.equal(handoff.find(pending.orderNo).planner,'');});
check('修改页内脚本语法', () => {
  for (const file of ['merchant/tour/fulfillment-cost.html','merchant/tour/resource-procurement-inventory.html','supplier/product-edit.html','supplier/schedules.html','supplier/product-schedules.html','supplier/schedule-create.html','supplier/schedule-batch.html','merchant/sales/orders-detail.html','merchant/dashboard.html']) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if (match[1].trim()) new vm.Script(match[1], { filename: file });
  }
});
console.log('完成 ' + n + ' 组P0规则检查');
