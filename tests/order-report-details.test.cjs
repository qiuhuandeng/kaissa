const assert = require("node:assert/strict");
const test = require("node:test");
const r = require("../shared/report-pages.js");
const base = { view: "orders", start: "2026-05-01", end: "2026-05-07", dateBasis: "confirmed", status: "有效" };
const query = (f = {}, records) => r.orderDetailQuery({ ...base, ...f }, records);

test("订单补充不改变原成交、变化和其他报表资料", () => {
  const before = JSON.stringify([r.items, r.events, r.completions]);
  assert.equal(r.sum(query()), 54000);
  assert.equal(r.sum(query({ view: "changes" })), 53000);
  assert.equal(r.orderCount(query()), 5);
  assert.equal(query().length, 6);
  assert.equal(JSON.stringify([r.items, r.events, r.completions]), before);
  assert.equal(r.items[0].owner, null);
});
test("A01 历史归属按记录保留，不随当前任职覆盖", () => {
  const row = { ...r.items[0], order: "HISTORY", ownershipDetails: { salesLeader: "领导甲", salesDepartment: "原部门", organizationVersion: "5月任职版" }, currentLeader: "领导乙" };
  assert.equal(query({ salesLeader: "领导甲" }, [row]).length, 1);
  assert.equal(query({ salesLeader: "领导乙" }, [row]).length, 0);
  assert.equal(r.orderFacts(row).organizationVersion, "5月任职版");
});
test("A02 销售产品签约公司分开，不复制成交", () => {
  const rows = query({ company: "A", productCompany: "B" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].contractCompany, "C公司（演示）");
  assert.equal(r.sum(rows), 10000);
  assert.equal(r.orderFieldValue(rows[0], "productCompany"), "B公司（演示）");
  assert.equal(query({ company: "B", productCompany: "A" }).length, 0);
});
test("A03 真实目的地、管理分区和途经地不相互替代", () => {
  assert.equal(r.sum(query({ geographyZone: "欧洲", managementZone: "欧洲经营区（演示）" })), 10000);
  assert.equal(query({ geographyZone: "欧洲", managementZone: "海岛经营区（演示）" }).length, 0);
  assert.equal(r.orderFieldValue(query({ order: "O01" })[0], "destinations"), "法国、意大利");
  assert.equal(r.sum(query({ destination: "待补充" })), 19000);
  assert.equal(query({ dataQuality: "classification" }).length, 6);
});
test("A04 未知、不适用与已知零分开，缺数可筛", () => {
  const row = query({ order: "O07" })[0];
  assert.equal(r.orderFieldValue(row, "salesLeader"), "待补充");
  assert.equal(r.orderFieldValue(row, "store"), "不适用");
  assert.equal(query({ salesLeader: "__missing" }).some(r => r.order === "O07"), true);
  assert.equal(query({ dataQuality: "ownership" }).some(r => r.order === "O07"), true);
  assert.equal(r.orderFieldValue(query({ status: "已取消" })[0], "amount"), 0);
});
test("A05 创建和确认跨月、全部状态不混用日期", () => {
  const row = { ...r.items[1], created: "2026-04-30", confirmed: "2026-05-02" };
  assert.equal(query({}, [row]).length, 1);
  assert.equal(query({ dateBasis: "created" }, [row]).length, 0);
  assert.equal(query({ status: "全部", order: "O08" }).length, 0);
  const unconfirmed = query({ status: "全部", dateBasis: "created", order: "O08" });
  assert.equal(unconfirmed.length, 1);
  assert.equal(unconfirmed[0].amount, null);
  assert.equal(r.orderDateBasis({ status: "全部" }), "confirmed");
});
test("A06 外采及零税额不能推断收入确认或免税", () => {
  const row = { ...query({ order: "O02" })[0], taxAmount: 0 };
  for (const key of ["incomeMethod", "taxTreatment", "taxConfirmation"]) assert.equal(r.orderFieldValue(row, key), "待确认");
});
test("A10 已知金额合计说明缺数，全部未知不变成零", () => {
  assert.deepEqual(r.amountCoverage([{ amount: 4000 }, { amount: null, amountState: "未分配" }]), { value: 4000, unknown: 0, unallocated: 1 });
  assert.deepEqual(r.amountCoverage([{ amount: null }]), { value: null, unknown: 1, unallocated: 0 });
  assert.deepEqual(r.amountCoverage([{ amount: 0 }]), { value: 0, unknown: 0, unallocated: 0 });
  assert.deepEqual(r.amountCoverage([]), { value: 0, unknown: 0, unallocated: 0 });
});
test("A11 数量按单位合计，整单收款未分配不复制到销售内容", () => {
  assert.equal(r.quantitySummary([{ quantity: 2, unit: "张" }, { quantity: 3, unit: "间夜" }]), "2 张、3 间夜");
  const rows = query({ order: "O03" });
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row.received == null && r.orderFieldValue(row, "received") === "未分配到销售内容"));
  assert.deepEqual(r.amountCoverage(rows, "received"), { value: null, unknown: 0, unallocated: 2 });
});
test("新增筛选在变化视图保留，退款不再产生变化", () => {
  const rows = query({ view: "changes", salesDepartment: "门店销售部（演示）", order: "O04" });
  assert.equal(rows.length, 1);
  assert.equal(r.sum(rows), -1000);
  assert.equal(query({ view: "changes", productCompany: "B" }).length, 3);
});
