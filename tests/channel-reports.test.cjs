const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../shared/channel-reports.js');
const report = require('../shared/report-pages.js');
test('主渠道互斥，6条销售内容5单54,000元，获客来源不重复计数', () => {
  const r = m.run({}); assert.equal(r.total.value, 54000); assert.equal(r.orders, 5); assert.equal(r.rows.length, 6);
  assert.deepEqual(r.summaries.map(x => x.amount), [15000, 29000, 10000]);
  assert.equal(m.run({ acquisition: '官网咨询' }).total.value, 20000);
});
test('销售与产品公司独立，内部供应不增加集团成交', () => {
  assert.equal(m.run({ company: 'A' }).total.value, 35000);
  assert.equal(m.run({ company: 'A', productCompany: 'B' }).total.value, 10000);
  assert.equal(m.run({ productOrg: 'A', supply: '外部采购' }).total.value, 25000);
});
test('预算区域缺失单列，已知不适用与缺失不混用', () => {
  const r = m.run({ level: 'region' });
  assert.equal(r.summaries.find(x => x.budgetRegion === '待补充').amount, 9000);
  assert.equal(r.summaries.reduce((n, x) => n + x.amount, 0), 54000);
  assert.equal(m.run({ budgetRegion: '__missing' }).total.value, 9000);
  assert.equal(m.run({ quality: 'ownership' }).total.value, 9000);
});
test('实际回团包含上年订单及待结算，不按计划到期生成完成', () => {
  const r = m.run({ basis: 'actual' }); assert.equal(r.total.value, 56000);
  assert.deepEqual(r.summaries.map(x => x.amount), [17000, 20000, 19000]);
  assert.ok(r.rows.some(x => x.order === 'O06')); assert.ok(!r.rows.some(x => x.order === 'O07'));
  assert.equal(r.rows.find(x => x.order === 'O09').amount, 4000);
});
test('门店、中心、组及顾问使用相同来源，姓名相同也不合并员工', () => {
  assert.equal(m.run({ view: 'stores' }).total.value, 15000);
  for (const callLevel of ['center', 'group', 'person']) {
    const r = m.run({ view: 'calls', callLevel }); assert.equal(r.total.value, 29000); assert.equal(r.summaries.length, 2);
  }
  const rows = m.run({ view: 'calls', callLevel: 'person' }).summaries;
  assert.ok(rows.every(r => r.salesperson === '王宁')); assert.notEqual(rows[0].salesId, rows[1].salesId);
});
test('同组重名与缺员工编号不误并，历史归属不被当前资料覆盖', () => {
  const original = report.items.find(r => r.order === 'O02');
  const samples = ['X1', 'X2'].map((order, i) => ({ ...original, order, id: order, ownershipDetails: { salesDepartment: '历史呼叫中心', salesGroup: '历史销售组', salesId: 'EMP-' + i, salesperson: '同名顾问' } }));
  assert.equal(m.run({ view: 'calls', callLevel: 'person' }, samples).summaries.length, 2);
  assert.equal(m.run({ view: 'calls', callLevel: 'group' }, samples).summaries.length, 1);
  const unknown = samples.map(r => ({ ...r, ownershipDetails: { ...r.ownershipDetails, salesId: null } }));
  assert.equal(m.run({ view: 'calls', callLevel: 'person' }, unknown).summaries.length, 2);
});
test('产品结构的渠道内占比和渠道贡献分母不同，并保留其他筛选', () => {
  const r = m.run({ view: 'structure', channel: '呼叫中心' }).summaries.find(x => x.type === '跟团游');
  assert.equal(r.amount, 29000); assert.equal(r.share, 100); assert.equal(r.allAmount, 39000);
  assert.ok(Math.abs(r.contribution - 74.358974) < .0001);
  assert.equal(r.salesDepartment, 'A呼叫中心（演示）、B呼叫中心（演示）');
  assert.equal(m.run({ view: 'structure', channel: '呼叫中心', company: 'A', productCompany: 'A' }).allTotal.value, 25000);
  assert.equal(m.run({ view: 'structure', channel: '呼叫中心', salesGroup: 'A电销一组' }).allTotal.value, 20000);
});
test('主目的地与供应方式分别互斥，待补充目的地19,000仍保留', () => {
  const r = m.run({ view: 'structure', structure: 'destination' });
  assert.equal(r.summaries.find(x => x.destination === '待补充').amount, 19000);
  assert.equal(m.run({ view: 'structure', structure: 'supply' }).summaries.reduce((n, x) => n + x.amount, 0), 54000);
});
test('空范围、未知金额和零成交不同，缺金额不计算比例', () => {
  const row = { ...report.items[0], amount: null, amountState: '未分配到销售内容' };
  const r = m.run({ view: 'structure' }, [row]); assert.equal(r.total.value, null); assert.equal(r.summaries[0].unknown, 1); assert.equal(r.summaries[0].share, null);
  assert.equal(m.run({}, []).total.value, 0);
  assert.equal(m.run({ view: 'structure' }, [{ ...row, amount: 0 }]).summaries[0].contribution, null);
  assert.equal(m.ratio(5, -1), null);
});
test('期间按结束日计算，近7日不冒充批准自然周', () => {
  assert.equal(m.clean({ period: 'seven', end: '2026-01-03' }).start, '2025-12-28');
  assert.equal(m.clean({ period: 'month' }).start, '2026-05-01');
  assert.equal(m.clean({ period: 'year' }).start, '2026-01-01');
  assert.equal(m.run({ period: 'year' }).total.value, 59000);
  assert.match(m.validate({ start: '2026-02-30', end: '2026-05-07' }), /核对日期/);
  assert.match(m.validate({ start: '2026-05-01', end: '2026-05-08' }), /截止/);
});
test('切门店和呼叫中心清理不适用条件，不借用集团任务或毛利', () => {
  const f = m.clean({ view: 'calls', store: '朝阳门店', storeType: '直营', channel: '门店' });
  assert.equal(f.store, ''); assert.equal(f.storeType, ''); assert.equal(f.channel, '呼叫中心');
  const r = m.run({}).summaries[0]; assert.match(r.target, /未提供/); assert.match(r.previous, /未提供/); assert.match(r.grossProfit, /待确认/);
});
test('新增查询不修改共同来源及已完成报表基线', () => {
  const before = JSON.stringify(report.items); m.run({ basis: 'actual', view: 'structure' });
  assert.equal(JSON.stringify(report.items), before);
  assert.equal(report.amountCoverage(report.orderDetailQuery({ start: '2026-05-01', end: '2026-05-07' })).value, 54000);
});
test('未知主渠道与未分配销售组单列，不能塞入其他或丢弃金额', () => {
  const original = report.items.find(r => r.order === 'O02');
  const unknown = { ...original, order: 'X', id: 'X', channel: null, ownershipDetails: {} };
  const r = m.run({ channel: '__missing' }, [unknown]);
  assert.equal(r.total.value, 20000); assert.equal(r.summaries[0].channel, '待补充');
  const group = m.run({ view: 'calls' }, [{ ...original, ownershipDetails: { salesGroup: null } }]);
  assert.equal(group.summaries[0].salesGroup, '待补充'); assert.equal(group.total.value, 20000);
});
