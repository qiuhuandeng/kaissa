(function () {
  "use strict";
  const CUTOFF = "2026-05-07";
  const VERSION = "演示工作版 V1";
  const names = { A: "A公司（演示）", B: "B公司（演示）" };
  const productNames = { A: "A产品经营组", B: "B产品经营组" };
  const base = [
    ["O01", "2026-05-01", "欧洲经典跟团", 10000, "A", "B", "门店", "2026-05-05", "T01", "跟团游", "集团内部供应"],
    ["O02", "2026-05-02", "海南外采跟团", 20000, "A", "A", "呼叫中心", "2026-05-06", "T02", "跟团游", "外部采购"],
    ["O03", "2026-05-03", "北京至上海机票", 2000, "A", "A", "门店", "2026-05-04", "S03-A", "单项服务", "外部采购"],
    ["O03", "2026-05-03", "上海酒店住宿", 3000, "A", "A", "门店", "2026-05-09", "S03-B", "单项服务", "外部采购"],
    ["O04", "2026-04-28", "华东跟团", 6000, "A", "A", "门店", "2026-05-05", "T04", "跟团游", "自营组织"],
    ["O05", "2026-05-04", "西安跟团（取消）", 8000, "A", "A", "门店", "2026-05-10", "T05", "跟团游", "自营组织"],
    ["O06", "2025-12-20", "企业团队出行", 15000, "B", "B", "企业直销", "2026-05-07", "T06", "团队定制", "自营组织"],
    ["O07", "2026-05-06", "跨年冰雪跟团", 9000, "B", "B", "呼叫中心", "2027-01-03", "T07", "跟团游", "自营组织"],
    ["O08", "", "西南跟团预留", 4000, "A", "A", "呼叫中心", "2026-06-01", "T08", "跟团游", "外部采购"],
    ["O09", "2026-05-07", "企业会务项目", 10000, "B", "B", "企业直销", "2026-05-12", "P09", "MICE", "自营组织"],
  ];
  const items = base.map((v, i) => {
    const [order, confirmed, product, original, company, productOrg, channel, planned, service, type, supply] = v;
    const reduction = order === "O04" ? 1000 : order === "O05" ? 8000 : 0;
    return {
      id: "ITEM-" + (i + 1), order, confirmed, created: confirmed || CUTOFF, product, original, company,
      productOrg, channel, planned, service, type, supply, reduction, addition: 0,
      amount: confirmed ? original - reduction : null, unit: "服务项", quantity: 1,
      status: !confirmed ? "未确认" : order === "O05" ? "已取消" : "有效",
      team: channel === "门店" ? "朝阳门店" : channel === "呼叫中心" ? company + "电销一组" : "企业客户部",
      salesperson: channel === "门店" ? "李欣" : channel === "呼叫中心" ? "王宁" : "陈晨",
      source: "演示订单台账", sourceOrder: "DEMO-" + order, currency: "人民币",
      received: null, refunded: order === "O04" ? 1000 : null, ownership: "发生时归属·演示V1",
      business: type === "MICE" ? "会奖业务" : channel === "企业直销" ? "企业旅游" : "休闲旅游",
      travel: order === "O01" ? "出境" : "境内", destination: order === "O01" ? "法国" : order === "O02" ? "海南" : order === "O03" ? "上海" : "待补充",
      departure: "北京", supplier: supply === "集团内部供应" ? names.B : null,
      owner: null, subtype: type === "单项服务" ? (service === "S03-A" ? "机票" : "酒店") : null,
      management: null, customerService: null, distributor: null, budgetRegion: null
    };
  });
  const events = items.filter(r => r.confirmed).map(r => ({
    ...r, record: "CONF-" + r.id, date: r.confirmed, changeType: "确认成交", amount: r.original,
    evidence: "演示确认记录", originalPeriod: r.confirmed.slice(0, 7)
  })).concat(items.filter(r => r.reduction).map(r => ({
    ...r, record: "ADJ-" + r.order, date: r.order === "O04" ? "2026-05-04" : "2026-05-06",
    changeType: r.order === "O04" ? "生效减项" : "取消减项", amount: -r.reduction,
    evidence: "演示生效记录", originalPeriod: r.confirmed.slice(0, 7)
  })));
  // 完成事实独立给出，计划到期不代表实际履约。金额和日期均为验收样例。
  const completionSamples = [
    { item: "ITEM-1", planned: "2026-05-05", actual: "2026-05-05", amount: 10000, completionType: "回团", completionBasis: "演示回团确认记录", confirmedBy: "计调甲（演示）", confirmedAt: "2026-05-05 18:00", allocationBasis: "本项全部完成·演示分配" },
    { item: "ITEM-2", planned: "2026-05-06", actual: "2026-05-06", amount: 20000, completionType: "回团", completionBasis: "演示外采履约确认记录", confirmedBy: "计调乙（演示）", confirmedAt: "2026-05-06 19:00", allocationBasis: "本项全部完成·演示分配" },
    { item: "ITEM-3", planned: "2026-05-04", actual: "2026-05-04", amount: 2000, completionType: "服务完成", completionBasis: "演示机票服务完成记录", confirmedBy: "票务甲（演示）", confirmedAt: "2026-05-04 16:00", allocationBasis: "机票销售内容·演示分配" },
    { item: "ITEM-4", planned: "2026-05-09", plannedStart: "2026-05-08", actual: "", amount: 3000, planBasis: "演示酒店服务安排" },
    { item: "ITEM-5", planned: "2026-05-05", actual: "2026-05-05", amount: 5000, completionType: "回团", completionBasis: "演示回团确认记录", confirmedBy: "计调丙（演示）", confirmedAt: "2026-05-05 20:00", allocationBasis: "生效减项后的销售内容·演示分配" },
    { item: "ITEM-7", planned: "2026-05-07", actual: "2026-05-07", amount: 15000, completionType: "项目验收", completionBasis: "演示企业出行验收记录", confirmedBy: "项目负责人甲（演示）", confirmedAt: "2026-05-07 18:00", allocationBasis: "本项全部完成·演示分配" },
    { item: "ITEM-8", planned: "2027-01-03", plannedStart: "2026-12-29", actual: "", amount: 9000, planBasis: "演示跨年团期安排" },
    { item: "ITEM-10", suffix: "-1", phase: "第一阶段", planned: "2026-05-07", actual: "2026-05-07", amount: 4000, completionType: "阶段验收", completionBasis: "演示会务第一阶段验收记录", confirmedBy: "项目负责人乙（演示）", confirmedAt: "2026-05-07 21:00", allocationBasis: "第一阶段单独分配4,000元·演示" },
    { item: "ITEM-10", suffix: "-2", phase: "第二阶段", planned: "2026-05-12", plannedStart: "2026-05-07", actualStart: "2026-05-07", actual: "", amount: 6000, planBasis: "演示会务第二阶段安排及开始确认" }
  ];
  const completions = completionSamples.map(p => {
    const r = items.find(row => row.id === p.item);
    return {
      ...r, ...p, product: r.product + (p.phase ? "·" + p.phase : ""),
      record: "FUL-" + r.id + (p.suffix || ""), service: r.service + (p.suffix || ""), quantity: 1,
      settlement: p.actual ? "待结算" : "未完成",
      managementMonth: p.actual ? managementMonth(p.actual) : null,
      settlementNo: null, settlementDate: null, financePeriod: null, financeCompany: null,
      businessRevenue: null, financeRevenue: null, cost: null, adjustment: null
    };
  });
  function managementMonth(date) {
    if (!date) return null;
    const d = new Date(date + "T00:00:00Z");
    if (d.getUTCDate() >= 26) d.setUTCMonth(d.getUTCMonth() + 1, 1);
    return d.toISOString().slice(0, 7);
  }
  function inRange(date, start, end) { return Boolean(date) && date >= start && date <= end; }
  function match(r, f) {
    return (!f.company || r.company === f.company) && (!f.productOrg || r.productOrg === f.productOrg)
      && (!f.channel || r.channel === f.channel) && (!f.team || r.team === f.team)
      && (!f.order || r.order.toLowerCase().includes(f.order.toLowerCase()))
      && (!f.sourceOrder || r.sourceOrder.toLowerCase().includes(f.sourceOrder.toLowerCase()))
      && ["type", "supply", "travel", "business", "destination", "source"].every(k => !f[k] || r[k] === f[k])
      && (!f.confirmYear || r.confirmed.startsWith(f.confirmYear))
      && (!f.finishYear || (r.actual || r.planned).startsWith(f.finishYear));
  }
  function query(f) {
    if (f.view === "changes") return events.filter(r => match(r, f) && inRange(r.date, f.start, f.end));
    if (f.view === "orders") return selectOrders(f);
    if (f.view === "adjustments") return [];
    return selectCompletions(f);
  }
  function selectCompletions(f, records = completions) {
    return records.filter(r => match(r, f)
      && (f.view === "future" || !f.settlement || r.settlement === f.settlement)
      && (f.view === "future" ? (!r.actual || r.actual > CUTOFF) && inRange(r.planned, f.planStart, f.planEnd)
        && (!f.planMonth || String(r.planned).startsWith(f.planMonth)) && (!f.fulfillmentStatus || fulfillmentState(r) === f.fulfillmentStatus)
        : Boolean(r.actual) && r.actual <= CUTOFF && (f.view === "actual" && f.calendar === "management" ? managementMonth(r.actual) === f.month : inRange(r.actual, f.start, f.end))));
  }
  const sum = (rows, key = "amount") => rows.reduce((n, r) => n + (typeof r[key] === "number" ? r[key] : 0), 0);
  const orderCount = rows => new Set(rows.map(r => r.order)).size;
  function groups(rows, key) {
    const result = new Map();
    rows.forEach(r => {
      const value = r[key] || "未归类";
      if (!result.has(value)) result.set(value, []);
      result.get(value).push(r);
    });
    return Array.from(result, ([name, values]) => ({ name, amount: sum(values), orders: orderCount(values) }));
  }
  function percent(actual, target) { return typeof target === "number" && target > 0 ? actual / target * 100 : null; }
  function orderDateBasis(f) { return f.dateBasis || (f.status === "未确认" ? "created" : "confirmed"); }
  function selectOrders(f, records = items) {
    return records.filter(r => match(r, f) && inRange(r[orderDateBasis(f)], f.start, f.end)
      && (f.status === "全部" || r.status === (f.status || "有效")));
  }
  // 独立补充发生时资料，不覆盖其他报表的原有样例，也不读取当前任职推断历史。
  const salesProfiles = {
    store: { salesBranch: "北京分公司（演示）", salesDivision: "零售事业部（演示）", salesDepartment: "门店销售部（演示）", salesLeader: "赵主管（演示）", store: "朝阳门店", salesGroup: "门店销售一组", storeType: "直营（演示）", salesOrigin: "门店成交", acquisition: "到店咨询", budgetRegion: "北京直营区（演示）" },
    callA: { salesBranch: "北京分公司（演示）", salesDivision: "零售事业部（演示）", salesDepartment: "A呼叫中心（演示）", salesLeader: "周主管（演示）", store: "不适用", salesGroup: "A电销一组", storeType: "不适用", salesOrigin: "电话成交", acquisition: "官网咨询", budgetRegion: "呼叫中心A区（演示）" },
    callB: { salesBranch: "不适用", salesDivision: "直销事业部（演示）", salesDepartment: "B呼叫中心（演示）", salesLeader: null, store: "不适用", salesGroup: "B电销一组", storeType: "不适用", salesOrigin: "电话成交", acquisition: "小程序咨询", budgetRegion: null },
    enterprise: { salesBranch: "不适用", salesDivision: "企业事业部（演示）", salesDepartment: "企业客户部（演示）", salesLeader: "吴主管（演示）", store: "不适用", salesGroup: "不适用", storeType: "不适用", salesOrigin: "企业直签", acquisition: "企业客户转介", budgetRegion: "企业直销区（演示）" }
  };
  const orderOwnership = {
    O01: { ...salesProfiles.store, contractCompany: "C公司（演示）", productCompany: "B", division: "B事业部（演示）", productLeader: "产品领导乙（演示）", owner: "产品负责人乙（演示）", geographyZone: "欧洲", managementZone: "欧洲经营区（演示）", destinations: ["法国", "意大利"], destinationCity: "巴黎", productVersion: "欧洲产品2026-04版" },
    O02: { ...salesProfiles.callA, contractCompany: "A公司（演示）", productCompany: "A", division: "A事业部（演示）", productLeader: "产品领导甲（演示）", owner: "产品负责人甲（演示）", geographyZone: "华南", managementZone: "海岛经营区（演示）", destinations: ["海南"], destinationCity: "三亚", productVersion: "海南产品2026-04版" },
    O03: { ...salesProfiles.store, contractCompany: "A公司（演示）", productCompany: "A", division: "A事业部（演示）", productLeader: "产品领导甲（演示）", geographyZone: "华东", managementZone: "单项服务区（演示）", destinations: ["上海"], destinationCity: "上海", receivedState: "未分配到销售内容" },
    O04: { ...salesProfiles.store, productCompany: "A", division: "A事业部（演示）" },
    O05: { ...salesProfiles.store, productCompany: "A", division: "A事业部（演示）" },
    O06: { ...salesProfiles.enterprise, productCompany: "B", division: "B事业部（演示）" },
    O07: { ...salesProfiles.callB, productCompany: "B", division: "B事业部（演示）" },
    O08: { ...salesProfiles.callA, productCompany: "A", division: "A事业部（演示）" },
    O09: { ...salesProfiles.enterprise, productCompany: "B", division: "B事业部（演示）" }
  };
  function orderFacts(row) {
    const details = row.ownershipDetails ?? orderOwnership[row.order] ?? {};
    return { ...row, ...details,
      distributor: details.distributor ?? row.distributor ?? (orderOwnership[row.order] ? "不适用" : null),
      platformStore: details.platformStore ?? (orderOwnership[row.order] ? "不适用" : null),
      ownershipAt: details.ownershipAt ?? row.confirmed,
      organizationVersion: details.organizationVersion ?? (row.confirmed ? "发生时任职·演示V1" : null),
      channelVersion: details.channelVersion ?? (row.confirmed ? "发生时渠道·演示V1" : null)
    };
  }
  const orderFilterFields = [
    ["salesDivision", "销售事业部"], ["salesDepartment", "销售部门"], ["salesLeader", "销售部门领导"],
    ["productCompany", "产品经营公司"], ["division", "产品事业部"], ["productLeader", "产品部门领导"], ["owner", "产品负责人"],
    ["geographyZone", "地理目的地分区"], ["managementZone", "管理目的地分区"], ["budgetRegion", "预算区域"], ["management", "经营分类"]
  ];
  const missingFact = v => v == null || v === "" || ["待补充", "待确认", "未归类"].includes(v);
  function orderIssues(row) {
    return {
      ownership: ["company", "salesDepartment", "salesLeader", "productCompany", "productOrg", "productLeader", "owner", "channel"].some(k => missingFact(row[k])),
      classification: ["management", "geographyZone", "managementZone"].some(k => missingFact(row[k]))
    };
  }
  function orderDetailQuery(f, records) {
    const rows = f.view === "changes"
      ? (records || events).filter(r => match(r, f) && inRange(r.date, f.start, f.end))
      : selectOrders(f, records || items);
    return rows.map(orderFacts).filter(r => ownershipMatch(r, f)
      && (!f.dataQuality || orderIssues(r)[f.dataQuality]));
  }
  function ownershipMatch(r, f) {
    return orderFilterFields.every(([k]) => !f[k] || (f[k] === "__missing" ? missingFact(r[k]) : r[k] === f[k]));
  }
  function fulfillmentState(row) {
    if (row.actual && row.actual <= CUTOFF) return '已完成';
    if (row.planned && row.planned <= CUTOFF) return '到期未确认';
    if (row.actualStart && row.actualStart <= CUTOFF) return '履约中';
    if (row.plannedStart && row.plannedStart > CUTOFF) return '尚未开始';
    return '开始资料待补';
  }
  function pendingMonths(rows) {
    const groups = new Map();
    rows.filter(r => !r.actual || r.actual > CUTOFF).forEach(r => {
      const month = r.planned ? r.planned.slice(0, 7) : '待补充', state = fulfillmentState(r), key = JSON.stringify([r.company, r.productCompany, month, state]);
      if (!groups.has(key)) groups.set(key, { company: r.company, productCompany: r.productCompany, planMonth: month, fulfillmentStatus: state, members: [] }); groups.get(key).members.push(r);
    });
    return [...groups.values()].map(g => ({ ...g, productCompany: names[g.productCompany] || g.productCompany || '待补充', orders: orderCount(g.members), amount: amountCoverage(g.members).value }));
  }
  function returnFacts(row) {
    return { ...orderFacts(row), planMonth: row.planned ? row.planned.slice(0, 7) : null, fulfillmentStatus: fulfillmentState(row), managementMonth: row.actual ? managementMonth(row.actual) : null,
      incomeStatus: row.incomeStatus || "未提供确认记录", costStatus: row.costStatus || "未提供确认记录"
    };
  }
  function returnDetailQuery(f, records = completions) {
    if (f.view === "adjustments") return [];
    return selectCompletions(f, records).map(returnFacts).filter(r => ownershipMatch(r, f)
      && (!f.dataQuality || orderIssues(r)[f.dataQuality])
      && (f.view !== "financial" || ((!f.incomeStatus || r.incomeStatus === f.incomeStatus) && (!f.costStatus || r.costStatus === f.costStatus))));
  }
  function returnFieldValue(row, key) {
    if (["amount", "businessRevenue", "financeRevenue", "cost", "adjustment"].includes(key) && row[key] == null) return row[key + "State"] || "待确认";
    if (["incomeStatus", "costStatus"].includes(key)) return row[key] || "未提供确认记录";
    if (["financeCompany", "incomeDate", "incomePeriod", "incomeRecord", "costDate", "costPeriod", "costRecord", "financePeriod"].includes(key)) return row[key] || "未提供确认记录";
    if (["settlementNo", "settlementDate", "originalSettlement", "adjustmentStatus", "originalFinancePeriod"].includes(key)) return row[key] || "未提供记录";
    if (["originalActual", "correctionReason"].includes(key)) return row[key] || "未提供更正记录";
    if (key === "adjustmentRecord") return row[key] || "未提供调整记录";
    return orderFieldValue(row, key);
  }
  function orderFieldValue(row, key) {
    const value = row[key];
    if (["incomeMethod", "taxTreatment", "taxConfirmation", "management"].includes(key)) return value ?? "待确认";
    if (["amount", "received", "refunded"].includes(key) && value == null) return row[key + "State"] || "待确认";
    if (key === "productCompany") return names[value] || value || "待补充";
    if (["confirmed", "ownershipAt"].includes(key) && !value) return "未确认";
    if (Array.isArray(value)) return value.length ? value.join("、") : "待补充";
    return value == null || value === "" ? "待补充" : value;
  }
  function amountCoverage(rows, key = "amount") {
    const known = rows.filter(r => typeof r[key] === "number" && Number.isFinite(r[key]));
    const unallocated = rows.filter(r => r[key] == null && (r[key + "State"] || "").startsWith("未分配")).length;
    return { value: known.length || !rows.length ? sum(known, key) : null, unknown: rows.length - known.length - unallocated, unallocated };
  }
  function quantitySummary(rows) {
    const units = new Map();
    rows.forEach(r => { if (typeof r.quantity === "number" && r.unit) units.set(r.unit, (units.get(r.unit) || 0) + r.quantity); });
    return Array.from(units, ([unit, value]) => value + " " + unit).join("、");
  }
  function productFacts(row) { return returnFacts(row); }
  function productMatch(row, f) {
    return ownershipMatch(row, f) && (!f.dataQuality || orderIssues(row)[f.dataQuality])
      && (!f.ownerState || (f.ownerState === "missing" ? missingFact(row.owner) : !missingFact(row.owner)));
  }
  function share(value, total) { return percent(value, total) ?? "无有效分母"; }
  const completeAmount = c => c.value !== null && !c.unknown && !c.unallocated;
  function productShare(rows, denominator) {
    const a = amountCoverage(rows), b = amountCoverage(denominator);
    return completeAmount(a) && completeAmount(b) ? share(a.value, b.value) : "金额缺数，未计算";
  }
  function validProductDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d; }
  function productPeriods(f) {
    const shift = (d, n) => new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);
    const lastYear = d => {
      const y = Number(d.slice(0, 4)) - 1, m = Number(d.slice(5, 7));
      return y + '-' + String(m).padStart(2, '0') + '-' + String(Math.min(Number(d.slice(8)), new Date(Date.UTC(y, m, 0)).getUTCDate())).padStart(2, '0');
    };
    const days = Math.round((Date.parse(f.end) - Date.parse(f.start)) / 86400000) + 1;
    return { previous: { start: shift(f.start, -days), end: shift(f.start, -1) }, lastYear: { start: lastYear(f.start), end: lastYear(f.end) },
      month: { start: f.end.slice(0, 7) + '-01', end: f.end }, year: { start: f.end.slice(0, 4) + '-01-01', end: f.end },
      monthEnd: new Date(Date.UTC(Number(f.end.slice(0, 4)), Number(f.end.slice(5, 7)), 0)).toISOString().slice(0, 10), yearEnd: f.end.slice(0, 4) + '-12-31' };
  }
  function productPreset(period, end) {
    return period === 'year' ? end.slice(0, 4) + '-01-01' : period === 'quarter' ? end.slice(0, 4) + '-' + String(Math.floor((Number(end.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, '0') + '-01'
      : period === 'month' ? end.slice(0, 7) + '-01' : new Date(Date.parse(end) - (period === 'biweek' ? 13 : 6) * 86400000).toISOString().slice(0, 10);
  }
  function summarizeProducts(rows, f, allRows = rows, annualRows = rows, monthRows = rows) {
    const key = f.productView === "organizations" ? f.productLevel || "productOrg" : f.structureBy || "type";
    const identity = r => JSON.stringify((f.productView !== 'organizations' || key === 'productCompany' ? [key] : key === 'division' ? ['productCompany', key] : ['productCompany', 'division', key]).map(k => missingFact(r[k]) ? null : r[k]));
    const buckets = new Map();
    const register = r => {
      const value = identity(r);
      if (!buckets.has(value)) buckets.set(value, []);
    };
    (f.productView === "organizations" ? [...rows, ...monthRows, ...annualRows] : f.productView === "channels" ? allRows : rows).forEach(register);
    rows.forEach(r => { register(r); buckets.get(identity(r)).push(r); });
    return Array.from(buckets, ([id, members]) => {
      const same = list => list.filter(r => identity(r) === id);
      const scope = [...members, ...same(monthRows), ...same(annualRows), ...same(allRows)];
      const exemplar = scope[0] || {}, name = missingFact(exemplar[key]) ? (key === 'management' ? '待确认' : '待补充') : exemplar[key];
      const moneyRows = { amount: members, monthly: same(monthRows), yearly: same(annualRows), allAmount: same(allRows),
        selfAmount: members.filter(r => r.supply === '自营组织'), internalAmount: members.filter(r => r.supply === '集团内部供应'), externalAmount: members.filter(r => r.supply === '外部采购'),
        unknownAmount: members.filter(r => !['自营组织', '集团内部供应', '外部采购'].includes(r.supply)) };
      const coverages = Object.fromEntries(Object.entries(moneyRows).map(([k, v]) => [k, amountCoverage(v)]));
      const values = field => Array.from(new Set(scope.map(r => missingFact(r[field]) ? '待补充' : r[field]))).join('、') || '待补充';
      return {
        name: key === "productOrg" ? productNames[name] || name : key === "productCompany" ? names[name] || name : name,
        productCompany: names[exemplar.productCompany] || exemplar.productCompany || "待补充", division: values('division'),
        owner: values('owner'), productLeader: values('productLeader'), quantity: quantitySummary(members) || '无数量记录',
        orders: orderCount(members), coverages, ...Object.fromEntries(Object.entries(coverages).map(([k, c]) => [k, c.value])),
        missingAmounts: coverages.amount.unknown + coverages.amount.unallocated,
        previous: "未提供完整资料", growth: "无可比资料", lastYear: "未提供完整资料", annualGrowth: "无可比资料",
        monthlyTarget: '未提供批准任务', monthlyCompletion: '未计算', annualTarget: "未提供批准任务", completion: "未计算",
        cumulativeTarget: '未提供同进度任务', cumulativeCompletion: '未计算', taskVersion: '未提供批准版本',
        share: productShare(members, rows), contribution: productShare(members, same(allRows))
      };
    });
  }
  function crossYearRows(f, records = completions) {
    const actualBasis = f.crossBasis === "actual";
    const rows = records.map(productFacts).filter(r => match(r, { ...f, finishYear: "", confirmYear: "" }) && productMatch(r, f)
      && r.confirmed && r.confirmed <= CUTOFF && r.status === "有效"
      && (!actualBasis || (r.actual && r.actual <= CUTOFF))
      && (!f.orderYear || r.confirmed.startsWith(f.orderYear))
      && (!f.targetYear || String(actualBasis ? r.actual : r.planned || '').startsWith(f.targetYear))
      && (!f.planMonth || String(actualBasis ? r.actual : r.planned || '').startsWith(f.planMonth))
      && (!f.fulfillmentStatus || fulfillmentState(r) === f.fulfillmentStatus));
    const buckets = new Map();
    rows.forEach(r => {
      const orderYear = r.confirmed.slice(0, 4), finishYear = (actualBasis ? r.actual : r.planned)?.slice(0, 4) || '待补充';
      const key = orderYear + "|" + finishYear;
      if (!buckets.has(key)) buckets.set(key, { name: orderYear, finishYear, completed: 0, future: 0, amount: 0, members: [] });
      const group = buckets.get(key);
      group.members.push(r);
    });
    return { facts: rows, rows: Array.from(buckets.values()).map(r => {
      const coverages = { amount: amountCoverage(r.members), completed: amountCoverage(r.members.filter(m => m.actual && m.actual <= CUTOFF)), future: amountCoverage(r.members.filter(m => !m.actual || m.actual > CUTOFF)) };
      return { ...r, coverages, ...Object.fromEntries(Object.entries(coverages).map(([k, c]) => [k, c.value])), orders: orderCount(r.members), lastYear: "未提供完整资料", difference: "不可比" };
    }) };
  }
  function productReport(f) {
    if (f.productView === "crossYear") return crossYearRows(f);
    const selectRows = filter => (filter.view === 'orders' ? orderDetailQuery({ ...filter, status: '有效', dateBasis: 'confirmed' }) : returnDetailQuery({ ...filter, calendar: 'actual' })).filter(r => productMatch(r, filter));
    const rows = selectRows(f);
    // 渠道贡献只解除主渠道条件；公司、门店、产品和期间等范围保持原样。
    const allRows = f.productView === "channels" ? selectRows({ ...f, channel: "" }) : rows;
    const periods = productPeriods(f), annualRows = selectRows({ ...f, ...periods.year }), monthRows = selectRows({ ...f, ...periods.month });
    return { facts: rows, rows: summarizeProducts(rows, f, allRows, annualRows, monthRows), allRows, periods };
  }
  function csvCell(value) {
    let s = value == null ? "" : String(value);
    if (/^[=+@\-\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  const api = { CUTOFF, VERSION, items, events, completions, query, sum, orderCount, groups, managementMonth, percent, csvCell, summarizeProducts, crossYearRows, productReport,
    orderDateBasis, selectOrders, orderFacts, orderDetailQuery, orderFieldValue, orderIssues, amountCoverage, quantitySummary,
    selectCompletions, returnFacts, returnDetailQuery, returnFieldValue, productPeriods, productPreset, validProductDate, productShare, fulfillmentState, pendingMonths };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;
  window.CaesarReports = api;
  const root = document.querySelector(".finance-report-page[data-report-page]");
  if (!root || root.dataset.reportReady) return;
  root.dataset.reportReady = "true";
  const page = root.dataset.reportPage;
  const isOverview = page === "overview";
  const overviewModel = isOverview ? window.CaesarOverviewModel(api) : null;
  const isProduct = page === "products";
  const isOrder = page === "orders";
  const isReturn = page === "returns";
  const isDetail = isOrder || isReturn;
  const titles = { overview: "经营总览", products: "产品经营分析", channels: "渠道经营分析", orders: "订单明细", returns: "回团与履约明细" };
  const paths = { overview: "performance-reports.html", products: "product-reports.html", channels: "channel-reports.html", orders: "order-report-details.html", returns: "return-report-details.html" };
  const productViews = { organizations: "经营组业绩", structure: "产品结构", channels: "渠道交叉", crossYear: "跨年收客" };
  const iconsBase = new URL("report-icons/", document.currentScript.src).href;
  const icon = name => '<img class="report-icon" alt="" src="' + iconsBase + name + '.svg">';
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const defaults = {
    version: "demo-v1", period: "demo", start: "2026-05-01", end: CUTOFF,
    view: page === "returns" ? "actual" : "orders", company: "", productOrg: "", channel: "", team: "",
    order: "", sourceOrder: "", status: "有效", type: "", supply: "", travel: "", business: "", destination: "", source: "",
    unit: "wan", grouping: "company", comparison: "previous", budget: "none", calendar: "actual", month: "2026-05",
    planStart: "2026-05-08", planEnd: "2027-01-03", confirmYear: "", finishYear: "", settlement: "",
    productView: "organizations", productLevel: "productOrg", structureBy: "type", crossBasis: "planned",
    orderYear: "", targetYear: "", productCompany: "", division: "", ownerState: "", planMonth: "", fulfillmentStatus: "",
    ...((isDetail || isOverview || isProduct) ? { dataQuality: "", ...Object.fromEntries(orderFilterFields.map(([k]) => [k, ""])) } : {}),
    ...(isOverview ? { responsibility: "sales" } : {}),
    ...(isOrder ? { dateBasis: "confirmed" } : {}),
    ...(isReturn ? { incomeStatus: "", costStatus: "" } : {})
  };
  let applied = { ...defaults };
  const params = new URLSearchParams(location.search);
  const sharedKeys = ["company", "productOrg", "channel", "unit", "start", "end", "type", "supply", "travel", "business", "source", "destination"];
  sharedKeys.forEach(k => { if (params.has(k)) applied[k] = params.get(k); });
  if (params.has("start") || params.has("end")) applied.period = "custom";
  let draftView = applied.view;
  let draftProductView = applied.productView;
  let pageNumber = 1, pageSize = 10, sortKey = "", sortDirection = 1, activeTable = { rows: [], columns: [] };
  const selectedColumns = {};
  function select(name, title, options, cls = "") {
    return '<label class="report-field ' + cls + '">' + esc(title) + '<select name="' + name + '">' +
      options.map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + '</option>').join("") + '</select></label>';
  }
  function input(name, title, type = "text") {
    return '<label class="report-field ' + (type === "text" ? "report-field-wide" : "") + '">' + title + '<input name="' + name + '" type="' + type + '"' + (type === "text" ? ' maxlength="100"' : "") + '></label>';
  }
  function dateRange(start, end, title, id = "") {
    return '<label class="report-field report-date-field" ' + id + '><span data-date-caption="' + start + '">' + title + '</span><span class="report-dates"><input type="date" aria-label="' + title + '开始" name="' + start + '" required><span>至</span><input type="date" aria-label="' + title + '结束" name="' + end + '" required></span></label>';
  }
  function options(key, label) { return [["", label], ...Array.from(new Set(items.map(r => r[key]).filter(Boolean))).map(v => [v, v])]; }
  function orderOptions(key, rows = items.map(orderFacts)) {
    const values = Array.from(new Set(rows.map(r => r[key]).filter(v => !missingFact(v))));
    return [["", "全部"], ...values.map(v => [v, key === "productCompany" ? names[v] || v : v]), ["__missing", "待补充／待确认"]];
  }
  root.innerHTML = '<header class="report-head"><h1>' + titles[page] + '</h1><div class="report-actions"><nav class="report-links" aria-label="经营报表">' +
    Object.entries(paths).map(([k, v]) => '<a href="' + v + '" data-report-link="' + k + '"' + (k === page ? ' aria-current="page"' : "") + '>' + titles[k] + '</a>').join("") +
    '</nav><button class="report-button" type="button" data-export title="导出全查询结果">' + icon("download") + '导出</button></div></header>' +
    '<form class="report-filters"><div class="report-filter-row">' +
    select("version", "数据版本", [["demo-v1", VERSION]], "report-field-wide") +
    (isProduct ? select("view", "金额口径", [["orders", "订单净成交额"], ["actual", "实际回团成交额"]], "report-field-wide") : "") +
    select("company", "销售公司", [["", "演示集团全部"], ...Object.entries(names)]) +
    select("period", "统计期间", [["demo", "演示7日"], ["biweek", "演示14日"], ["month", "本月截至日"], ["quarter", "本季截至日"], ["year", "本年截至日"], ["custom", "自定义"]]) +
    (isOrder ? '<span data-date-basis>' + select("dateBasis", "日期依据", [["confirmed", "订单确认日期"], ["created", "订单创建日期"]]) + '</span>' : '') +
    dateRange("start", "end", page === "returns" ? "实际完成日期" : "订单确认日期", 'data-actual-dates') +
    select("productOrg", "产品经营组", [["", "全部产品组"], ...Object.entries(productNames)]) +
    select("channel", "主成交渠道", options("channel", "全部渠道")) +
    select("unit", "金额单位", [["wan", "人民币·万元"], ["yuan", "人民币·元"]]) +
    '</div><details class="report-more"><summary>更多筛选</summary><div class="report-filter-row">' +
    input("order", "订单号") + input("sourceOrder", "来源订单号") +
    select("team", "门店／销售组", options("team", "全部组织")) +
    (page === "orders" ? '<span data-order-status>' + select("status", "订单状态", [["有效", "有效"], ["已取消", "已取消"], ["未确认", "未确认"], ["全部", "全部"]]) + '</span>' : "") +
    select("type", "产品类型", options("type", "全部类型")) + select("supply", "供应关系", options("supply", "全部供应关系")) +
    select("travel", "旅游范围", options("travel", "全部范围")) + select("destination", "主归属目的地", options("destination", "全部目的地")) +
    select("business", "业务线", options("business", "全部业务线")) + select("source", "数据来源", options("source", "全部来源")) +
    (isProduct ? select("ownerState", "负责人资料", [["", "全部"], ["missing", "负责人待补充"], ["known", "已明确负责人"]]) : "") +
    (page === "returns" ? select("confirmYear", "订单确认年份", [["", "全部年份"], ["2025", "2025年"], ["2026", "2026年"]]) +
    select("finishYear", "完成／计划年份", [["", "全部年份"], ["2026", "2026年"], ["2027", "2027年"]]) +
    '<span data-settlement-filter>' + select("settlement", "结算状态", [["", "全部状态"], ["待结算", "待结算"], ["已结算", "已结算"]]) + '</span>' +
    '<span data-financial-filter hidden>' + select("incomeStatus", "收入确认资料", [["", "全部"], ["未提供确认记录", "未提供确认记录"]], "report-field-wide") + '</span>' +
    '<span data-financial-filter hidden>' + select("costStatus", "成本确认资料", [["", "全部"], ["未提供确认记录", "未提供确认记录"]], "report-field-wide") + '</span>' : "") +
    '</div>' + ((isDetail || isOverview || isProduct) ? '<div class="report-order-filter-groups">' +
      [["销售归属", orderFilterFields.slice(0, 3)], ["产品归属", orderFilterFields.slice(3, 7)], ["分类与资料", orderFilterFields.slice(7)]]
        .map(([title, fields]) => '<fieldset><legend>' + title + '</legend><div class="report-filter-row">' + fields.map(([key, label]) => select(key, label, orderOptions(key), "report-field-wide")).join("") +
          (title === "分类与资料" ? select("dataQuality", "资料情况", [["", "全部"], ["ownership", "经营归属待补充"], ["classification", "分类待确认"]], "report-field-wide") : "") + '</div></fieldset>').join("") + '</div>' : '') + '</details>' +
    (page === "returns" ? '<div class="report-filter-row report-more" data-return-calendar>' + select("calendar", "日期口径", [["actual", "实际完成日期"], ["management", "管理月·演示规则"]]) +
      input("month", "财务回团管理月", "month") + '</div><div class="report-filter-row report-more" data-plan-dates hidden>' + dateRange("planStart", "planEnd", "计划完成日期") + input('planMonth', '计划完成月份', 'month') + select('fulfillmentStatus', '未完成情况', [['', '全部'], ...['尚未开始', '履约中', '到期未确认', '开始资料待补'].map(v => [v, v])]) + '</div>' : "") +
    (isOverview ? '<div class="report-filter-row report-more">' + select("responsibility", "分析责任", [["sales", "销售责任"], ["product", "产品责任"]]) +
      select("grouping", "责任分组", Object.entries(overviewModel.levels).filter(([, v]) => v[1] === 'sales').map(([k, v]) => [k, v[0]])) +
      select("comparison", "比较期间", [["previous", "上一等长期间"], ["year", "上年同期"]]) +
      select("budget", "任务版本", [["none", "正式任务未接入"], ["sample", "任务样例·非正式"]], "report-field-wide") + '</div>' : "") +
    (isProduct ? '<div class="report-filter-row report-more">' +
      '<span data-product-level>' + select("productLevel", "责任层级", [["productOrg", "产品经营组"], ["division", "产品事业部"], ["productCompany", "产品经营公司"]]) + '</span>' +
      '<span data-product-structure hidden>' + select("structureBy", "结构分类", [["type", "产品类型"], ["destination", "主归属目的地"], ["geographyZone", "地理目的地分区"], ["managementZone", "管理目的地分区"], ["management", "经营分类"], ["travel", "旅游范围"], ["business", "业务线"]]) + '</span>' +
      '<span data-product-cross hidden>' + select("crossBasis", "完成年份口径", [["planned", "计划完成年份"], ["actual", "实际完成年份"]]) + '</span>' +
      '<span data-product-cross hidden>' + select("orderYear", "订单确认年份", [["", "全部年份"], ["2025", "2025年"], ["2026", "2026年"]]) + '</span>' +
      '<span data-product-cross hidden>' + select("targetYear", "目标完成年份", [["", "全部年份"], ["2026", "2026年"], ["2027", "2027年"]]) + '</span><span data-product-cross hidden>' + input('planMonth', '完成月份（按所选口径）', 'month') + '</span><span data-product-cross hidden>' + select('fulfillmentStatus', '截至日履约情况', [['', '全部'], ...['已完成', '尚未开始', '履约中', '到期未确认', '开始资料待补'].map(v => [v, v])]) + '</span></div>' : "") +
    '<div class="report-query-actions"><button type="submit" class="report-button">查询</button><button type="button" class="report-button" data-reset>重置</button><span class="report-query-status" role="status" data-query-status>已查询</span></div><div class="report-error" role="alert" data-error hidden></div></form>' +
    '<div class="report-meta" data-meta></div><div data-results></div><details class="report-note" aria-label="数据口径说明"><summary>数据口径说明</summary><div data-notes></div></details>';
  const form = root.querySelector("form");
  let financialActive = false, financialView;
  let financialHost;
  if (isReturn) {
    form.insertAdjacentHTML('beforebegin', '<div data-return-tabs>' + tabs() + '</div>');
    financialHost = document.createElement('div');
    financialHost.dataset.returnFinance = '';
    financialHost.hidden = true;
    root.appendChild(financialHost);
  }
  function showReturnFinance(active) {
    financialActive = active;
    [form, root.querySelector('[data-meta]'), root.querySelector('[data-results]'), root.querySelector('.report-note')].forEach(el => { el.hidden = active; });
    financialHost.hidden = !active;
    if (active && !financialView) financialView = window.mountReturnFinance(financialHost, api, iconsBase, { mode: 'completion' });
  }
  function setForm(values) {
    Object.entries(values).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; });
  }
  function readForm() { return { ...applied, ...Object.fromEntries(new FormData(form)), view: draftView, productView: draftProductView,
    ...(isOrder ? { dateBasis: form.elements.dateBasis.value } : {}) }; }
  function updateDateControls() {
    const f = readForm(), future = f.view === "future", management = f.view === "actual" && f.calendar === "management";
    root.querySelector("[data-actual-dates]").hidden = future || management;
    form.elements.start.required = form.elements.end.required = !(future || management);
    form.elements.period.disabled = future || management;
    const caption = root.querySelector('[data-date-caption="start"]');
    caption.textContent = f.view === "changes" ? "变化生效日期" : f.view === "orders" ? (orderDateBasis(f) === "created" ? "订单创建日期" : "订单确认日期") : f.view === "adjustments" ? "调整生效日期" : "实际完成日期";
    if (isOrder) {
      root.querySelector("[data-date-basis]").hidden = f.view !== "orders";
      form.elements.dateBasis.disabled = f.view !== "orders" || f.status === "未确认";
    }
    form.elements.start.setAttribute("aria-label", caption.textContent + "开始");
    form.elements.end.setAttribute("aria-label", caption.textContent + "结束");
    const cal = root.querySelector("[data-return-calendar]");
    if (cal) {
      cal.hidden = f.view !== "actual";
      form.elements.month.closest("label").hidden = !management;
      root.querySelector("[data-plan-dates]").hidden = !future;
      form.elements.planStart.required = form.elements.planEnd.required = future;
      root.querySelector("[data-settlement-filter]").hidden = future || f.view === "adjustments";
      root.querySelectorAll("[data-financial-filter]").forEach(el => { el.hidden = f.view !== "financial"; });
      form.elements.confirmYear.closest("label").hidden = form.elements.finishYear.closest("label").hidden = f.view === "adjustments";
      const yearLabel = form.elements.finishYear.closest("label").firstChild;
      yearLabel.textContent = future ? "计划完成年份" : "实际完成年份";
    }
    const status = root.querySelector("[data-order-status]");
    if (status) status.hidden = f.view !== "orders";
    if (isProduct) {
      const cross = draftProductView === "crossYear";
      root.querySelector("[data-actual-dates]").hidden = cross;
      form.elements.start.required = form.elements.end.required = !cross;
      form.elements.period.disabled = form.elements.view.disabled = cross;
      form.elements.period.closest("label").hidden = form.elements.view.closest("label").hidden = cross;
      root.querySelector("[data-product-level]").hidden = draftProductView !== "organizations";
      root.querySelector("[data-product-structure]").hidden = !["structure", "channels"].includes(draftProductView);
      root.querySelectorAll("[data-product-cross]").forEach(el => { el.hidden = !cross; });
    }
  }
  function dirty(message) {
    const el = root.querySelector("[data-query-status]");
    el.textContent = message || "条件已修改，尚未查询";
    el.classList.add("is-dirty");
  }
  function refreshTeams() {
    const f = readForm(), old = form.elements.team.value;
    const teams = Array.from(new Set(items.filter(r => (!f.company || r.company === f.company) && (!f.channel || r.channel === f.channel)).map(r => r.team)));
    form.elements.team.innerHTML = '<option value="">全部组织</option>' + teams.map(t => '<option>' + esc(t) + '</option>').join("");
    form.elements.team.value = teams.includes(old) ? old : "";
  }
  function refreshOrderOrganizations() {
    if (!isDetail && !isOverview && !isProduct) return;
    orderFilterFields.slice(0, 7).forEach(([key]) => {
      const f = readForm();
      const control = form.elements[key], old = control.value;
      const rows = items.map(orderFacts).filter(r => {
        if (key.startsWith("sales")) return !f.company || r.company === f.company;
        const companyMatches = key === "productCompany" || !f.productCompany
          || (f.productCompany === "__missing" ? missingFact(r.productCompany) : r.productCompany === f.productCompany);
        return (!f.productOrg || r.productOrg === f.productOrg) && companyMatches;
      });
      control.innerHTML = orderOptions(key, rows).map(([v, label]) => '<option value="' + esc(v) + '">' + esc(label) + '</option>').join("");
      control.value = Array.from(control.options).some(o => o.value === old) ? old : "";
    });
  }
  form.addEventListener("change", event => {
    const name = event.target.name;
    if (isOverview && name === "responsibility") {
      form.elements.grouping.innerHTML = Object.entries(overviewModel.levels).filter(([, v]) => v[1] === event.target.value).map(([k, v]) => '<option value="' + k + '">' + v[0] + '</option>').join('');
    }
    if (isProduct && name === "view") draftView = event.target.value;
    if (name === "period") {
      const value = event.target.value;
      if (value !== "custom") {
        if (isOverview || isProduct) {
          const valid = isOverview ? overviewModel.dateValid : validProductDate;
          const preset = isOverview ? overviewModel.preset : productPreset;
          const end = valid(form.elements.end.value) ? form.elements.end.value : CUTOFF;
          form.elements.start.value = preset(value, end); form.elements.end.value = end;
        } else {
          form.elements.start.value = value === "year" ? "2026-01-01" : value === "quarter" ? "2026-04-01" : value === "biweek" ? "2026-04-24" : "2026-05-01";
          form.elements.end.value = CUTOFF;
        }
      }
    }
    if (name === "start" || name === "end") form.elements.period.value = "custom";
    if (name === "company" || name === "channel") refreshTeams();
    if ((isDetail || isOverview || isProduct) && ["company", "productOrg", "productCompany"].includes(name)) refreshOrderOrganizations();
    if (isOrder && name === "status" && form.elements.status.value === "未确认") form.elements.dateBasis.value = "created";
    updateDateControls();
    dirty(isProduct && name === "view" ? "金额口径已修改，请核对日期后查询" : "");
  });
  form.addEventListener("input", () => dirty());
  function validate(f) {
    if (f.planMonth && !/^\d{4}-(0[1-9]|1[0-2])$/.test(f.planMonth)) return '请填写有效完成月份';
    if (isOverview) return overviewModel.validate(f);
    if (isProduct && f.productView === "crossYear") return "";
    if (isProduct && (![f.start, f.end].every(validProductDate) || f.start < '2000-01-01')) return '请填写2000年以后的有效日期。';
    if (isReturn && f.view === "actual" && f.calendar === "management") return /^\d{4}-\d{2}$/.test(f.month) ? "" : "请选择有效的财务回团管理月。";
    const range = f.view === "future" ? [f.planStart, f.planEnd] : [f.start, f.end];
    if (!range.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) || range[0] > range[1]) return "请填写有效日期范围，开始日期不能晚于结束日期。";
    if (f.view !== "future" && f.end > CUTOFF) return "该演示版本截至2026-05-07，实际数据查询不能超过截止日。";
    return "";
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const next = readForm(), error = validate(next), errorEl = root.querySelector("[data-error]");
    errorEl.textContent = error; errorEl.hidden = !error;
    if (error) return;
    applied = next; draftView = applied.view; draftProductView = applied.productView; pageNumber = 1; render();
  });
  root.querySelector("[data-reset]").addEventListener("click", () => {
    applied = { ...defaults, version: applied.version };
    draftView = applied.view;
    draftProductView = applied.productView;
    if (isOverview) form.elements.grouping.innerHTML = Object.entries(overviewModel.levels).filter(([, v]) => v[1] === 'sales').map(([k, v]) => '<option value="' + k + '">' + v[0] + '</option>').join('');
    setForm(applied); refreshTeams(); refreshOrderOrganizations(); updateDateControls(); pageNumber = 1; sortKey = ""; render();
  });
  function amount(value) {
    return typeof value === "number" ? (value / (applied.unit === "wan" ? 10000 : 1)).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "待确认";
  }
  function unitLabel() { return applied.unit === "wan" ? "万元" : "元"; }
  const column = (key, label, kind = "", optional = false) => ({ key, label, kind, optional });
  function baseColumnsFor(view) {
    const common = [column("company", "销售公司"), column("team", "门店／销售组"), column("productOrg", "产品经营组")];
    const extras = [
      column("channel", "主成交渠道", "", true), column("type", "产品类型", "", true), column("subtype", "产品细分", "", true),
      column("travel", "旅游范围", "", true), column("supply", "供应关系", "", true), column("management", "经营分类", "", true),
      column("destination", "主归属目的地", "", true), column("departure", "出发城市", "", true), column("business", "业务线", "", true),
      column("supplier", "供应商", "", true), column("owner", "产品负责人", "", true), column("source", "数据来源", "", true),
      column("sourceOrder", "来源订单号", "", true), column("ownership", "归属版本", "", true), column("currency", "币种", "", true)
    ];
    if (view === "changes") return [
      column("record", "变化记录号"), column("date", "变化生效日期"), column("order", "订单号"), column("product", "销售内容／产品", "product"),
      column("changeType", "变化类型"), column("amount", "生效金额", "money"), column("confirmed", "订单确认日期"), column("originalPeriod", "原归属期间"),
      ...common, column("evidence", "生效依据"), ...extras
    ];
    if (view === "orders") return [
      column("order", "订单号"), column("product", "销售内容／产品", "product"), column("confirmed", "确认日期"), column("status", "订单状态"),
      column("service", "团号／服务单号"), column("planned", "计划完成日", "", true), ...common.slice(0, 2), column("salesperson", "销售人员"),
      common[2], column("channel", "主成交渠道"), column("quantity", "数量及单位", "quantity"), column("amount", "净成交额", "money"),
      column("created", "创建日期", "", true), column("original", "原成交／预留额", "money", true), column("addition", "生效增项", "money", true),
      column("reduction", "生效减项", "money", true), column("received", "分配实收", "money", true), column("refunded", "已退款", "money", true),
      column("customerService", "客服", "", true), column("distributor", "分销商", "", true), column("budgetRegion", "预算区域", "", true),
      ...extras.filter(c => c.key !== "channel")
    ];
    if (view === "financial") return [
      column("order", "订单号"), column("product", "销售内容／产品", "product"), column("service", "团号／服务单号"),
      column("actual", "实际完成日"), column("settlementNo", "结算单号"), column("settlementDate", "结算确认日"),
      column("businessRevenue", "业务结算收入", "money"), column("financeRevenue", "财务确认收入", "money"), column("cost", "可归属成本", "money"),
      column("settlement", "结算状态"), column("incomeStatus", "收入确认状态"), column("costStatus", "成本确认状态"),
      ...common.map(c => ({ ...c, optional: true })), ...extras
    ];
    if (view === "adjustments") return [
      column("record", "调整记录号"), column("order", "原订单号"), column("completionRecord", "原完成记录"), column("actual", "原完成日期"),
      column("date", "调整生效日"), column("financePeriod", "财务确认期间"), column("amount", "成交调整", "money"), column("cost", "成本调整", "money"), column("reason", "原因")
    ];
    return [
      column("order", "订单号"), column("product", "销售内容／产品", "product"), column("service", "团号／服务单号"), column("planned", "计划完成日"),
      ...(view === "future" ? [column('planMonth', '计划完成月份'), column('fulfillmentStatus', '未完成情况')] : [column("actual", "实际完成日"), column("managementMonth", "管理月·演示")]),
      ...common, column("quantity", view === "future" ? "未完成数量" : "完成数量", "quantity"),
      column("amount", view === "future" ? "未完成安排额" : "分配成交额", "money"),
      ...(view === "future" ? [] : [column("settlement", "结算状态")]), column("confirmed", "订单确认日期", "", true), ...extras
    ];
  }
  function columnsFor(view) {
    const baseColumns = baseColumnsFor(view);
    if (!isDetail) return baseColumns;
    const additional = [
      ["salesBranch", "销售分公司"], ["salesDivision", "销售事业部"], ["salesDepartment", "销售部门"], ["salesLeader", "销售部门领导"],
      ["store", "门店"], ["salesGroup", "销售组"], ["storeType", "门店类型"], ["salesperson", "销售人员"], ["customerService", "客服"],
      ["contractCompany", "对客签约公司"], ["productCompany", "产品经营公司"], ["division", "产品事业部"], ["productLeader", "产品部门领导"],
      ["geographyZone", "地理目的地分区"], ["managementZone", "管理目的地分区"], ["destinations", "全部目的地"], ["destinationCity", "目的地城市"],
      ["salesOrigin", "具体成交来源"], ["acquisition", "获客来源"], ["platformStore", "平台店铺"], ["budgetRegion", "预算区域"], ["distributor", "分销商"],
      ["productVersion", "产品／报价版本"], ["ownershipAt", "归属确认日期"], ["organizationVersion", "组织规则版本"], ["channelVersion", "渠道规则版本"],
      ["incomeMethod", "收入确认方式"], ["taxTreatment", "税务处理"], ["taxConfirmation", "税额确认状态"]
    ].filter(([k]) => !(isReturn && view === "future" && ["incomeMethod", "taxTreatment", "taxConfirmation"].includes(k)))
      .filter(([k]) => !baseColumns.some(c => c.key === k)).map(([k, label]) => column(k, label, "", true));
    if (isReturn) {
      const completionFields = [["record", "完成记录号"], ["completionType", "完成类型"], ["completionBasis", "完成依据"],
        ["confirmedBy", "完成确认人"], ["confirmedAt", "完成确认时间"], ["operator", "计调负责人"],
        ["plannedStart", "计划开始日"], ["actualStart", "实际开始日"], ["originalActual", "更正前完成日"], ["correctionReason", "日期更正原因"], ["allocationBasis", "金额分配依据"]];
      const financialFields = [["financeCompany", "核算主体"], ["incomeDate", "收入确认日期"], ["incomePeriod", "收入会计期间"], ["incomeRecord", "收入确认记录号"],
        ["costDate", "成本确认日期"], ["costPeriod", "成本会计期间"], ["costRecord", "成本确认记录号"], ["originalSettlement", "原结算单号"], ["adjustmentRecord", "关联调整记录号"]];
      const fields = view === "future" ? [["planBasis", "计划依据"], ["plannedStart", "计划开始日"], ["operator", "计调负责人"]]
        : view === "adjustments" ? [["originalSettlement", "原结算单号"], ["adjustmentStatus", "调整确认状态"], ["originalFinancePeriod", "原会计期间"]]
        : [...completionFields, ["settlementNo", "结算单号"], ["settlementDate", "结算确认日"], ...(view === "financial" ? financialFields : [])];
      additional.push(...fields.filter(([k]) => !baseColumns.some(c => c.key === k)).map(([k, label]) => column(k, label, "", true)));
    }
    return [...baseColumns, ...additional].map(c => ({ ...c,
      label: c.key === "supplier" ? "主要供应商／内部提供方" : c.key === "destination" ? "主目的地国家／省份" : isReturn && view === "adjustments" && c.key === "financePeriod" ? "本次会计期间" : c.label,
      required: ["order", "product"].includes(c.key) || c.key === "record" && (isOrder || view === "adjustments"),
      group: isReturn ? returnColumnGroup(c.key, c.kind) : orderColumnGroup(c.key, c.kind)
    }));
  }
  function returnColumnGroup(key, kind) {
    if (["settlement", "settlementNo", "settlementDate", "incomeStatus", "costStatus", "financeCompany", "incomeDate", "incomePeriod", "incomeRecord", "costDate", "costPeriod", "costRecord", "originalSettlement", "adjustmentRecord", "adjustmentStatus", "financePeriod", "originalFinancePeriod"].includes(key)) return "金额与财务标识";
    return orderColumnGroup(key, kind);
  }
  function orderColumnGroup(key, kind) {
    if (kind === "money" || ["currency", "incomeMethod", "taxTreatment", "taxConfirmation"].includes(key)) return "金额与财务标识";
    if (["company", "team", "salesperson", "customerService", "salesBranch", "salesDivision", "salesDepartment", "salesLeader", "store", "salesGroup", "storeType", "contractCompany"].includes(key)) return "销售归属";
    if (["productOrg", "productCompany", "division", "productLeader", "owner", "type", "subtype", "travel", "supply", "management", "destination", "departure", "business", "supplier", "geographyZone", "managementZone", "destinations", "destinationCity", "productVersion"].includes(key)) return "产品归属与目的地";
    if (["channel", "source", "sourceOrder", "ownership", "ownershipAt", "organizationVersion", "channelVersion", "salesOrigin", "acquisition", "platformStore", "distributor", "budgetRegion"].includes(key)) return "渠道与来源";
    return "基础与日期";
  }
  function cellValue(row, c, exporting = false) {
    const v = isReturn ? returnFieldValue(row, c.key) : isOrder ? orderFieldValue(row, c.key) : row[c.key];
    if (isProduct && row.coverages?.[c.key]) {
      const coverage = row.coverages[c.key];
      if (!completeAmount(coverage)) return (coverage.value === null ? '金额待确认' : '已知 ' + amount(coverage.value)) + '（缺' + (coverage.unknown + coverage.unallocated) + '条）';
    }
    if (isOverview) {
      const coverage = row[{ amount: 'coverage', monthly: 'monthCoverage', yearly: 'yearCoverage', actual: 'actualCoverage' }[c.key]];
      if (coverage && typeof coverage === 'object' && (coverage.unknown || coverage.unallocated)) return (coverage.value === null ? '金额待确认' : '已知 ' + amount(coverage.value)) + '（缺' + (coverage.unknown + coverage.unallocated) + '条）';
    }
    if (row.coverage && c.key === "amount" && v == null) return "未提供";
    if (c.kind === "money") return typeof v === "string" ? (isOrder && v === "待补充" ? "待确认" : v) : v == null && c.key === "target" ? "未设置" : amount(v);
    if (c.kind === "quantity") return typeof row.quantity === "number" && row.unit ? row.quantity + " " + row.unit : "待补充";
    if (c.kind === "percent") return typeof v === "number" ? v.toFixed(2) + "%" : v || "未设置";
    if (c.key === "company") return names[v] || v || "待补充";
    if (c.key === "productOrg") return productNames[v] || v || "待补充";
    if (v == null || v === "") return ["confirmed"].includes(c.key) ? "未确认" : "待补充";
    return v;
  }
  function tableHTML(rows, columns, tableId = "main", sortable = true) {
    return '<div class="report-table-scroll" tabindex="0" aria-label="' + (tableId === "main" ? "报表结果，可横向滚动" : "补充结果，可横向滚动") + '"><table class="report-table" data-table="' + tableId + '"><thead><tr>' +
      columns.map((c, i) => '<th class="' + (i === 0 ? "report-frozen " : "") + (["money", "number", "percent"].includes(c.kind) ? "report-numeric" : "") + '"' +
        (sortable ? ' aria-sort="' + (sortKey === c.key ? sortDirection === 1 ? "ascending" : "descending" : "none") + '"' : "") + '>' +
        (sortable ? '<button type="button" data-sort="' + c.key + '" title="按' + esc(c.label) + '排序">' : "") + esc(c.label) + (c.kind === "money" ? "（" + unitLabel() + "）" : "") +
        (sortable ? icon("arrow-up-down") + '</button>' : "") + '</th>').join("") + '</tr></thead><tbody>' +
      rows.map(r => '<tr>' + columns.map((c, i) => '<td class="' + (i === 0 ? "report-frozen " : "") + (c.kind === "product" ? "report-product " : "") +
        (["money", "number", "percent"].includes(c.kind) ? "report-numeric " : "") + (typeof r[c.key] === "number" && r[c.key] < 0 ? "report-negative" : "") + '" title="' + esc(cellValue(r, c)) + '">' + esc(cellValue(r, c)) + '</td>').join("") + '</tr>').join("") +
      '</tbody></table>' + (!rows.length ? '<div class="report-empty">' + (applied.view === "adjustments" ? "此演示版本未提供完成后调整记录" : "当前条件无匹配的演示记录") + '</div>' : "") + '</div>';
  }
  function columnSelectionKey() { return isProduct ? applied.productView + ":" + applied.crossBasis : applied.view; }
  function columnMenu(all) {
    const view = columnSelectionKey();
    if (!selectedColumns[view]) selectedColumns[view] = new Set(all.filter(c => !c.optional).map(c => c.key));
    if (isDetail) {
      all.filter(c => c.required).forEach(c => selectedColumns[view].add(c.key));
      return '<details class="report-columns"><summary>显示字段</summary><div class="report-order-column-groups">' +
        ["基础与日期", "销售归属", "产品归属与目的地", "渠道与来源", "金额与财务标识"].map(group => '<fieldset><legend>' + group + '</legend><div class="report-column-options">' +
          all.filter(c => c.group === group).map(c => '<label><input type="checkbox" data-column="' + c.key + '"' + (selectedColumns[view].has(c.key) ? ' checked' : '') + (c.required ? ' disabled' : '') + '>' + c.label + '</label>').join('') + '</div></fieldset>').join('') + '</div></details>';
    }
    return '<details class="report-columns"><summary>显示字段</summary><div class="report-column-options">' +
      all.map((c, i) => '<label><input type="checkbox" data-column="' + c.key + '"' + (selectedColumns[view].has(c.key) ? " checked" : "") + (i === 0 ? " disabled" : "") + '>' + c.label + '</label>').join("") + '</div></details>';
  }
  function sorted(rows) {
    return [...rows].sort((a, b) => {
      if (!sortKey) return 0;
      const x = a[sortKey], y = b[sortKey];
      if (x == null) return y == null ? 0 : 1;
      if (y == null) return -1;
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "zh-CN")) * sortDirection;
    });
  }
  function tabs() {
    const choices = isOverview ? [["orders", "订单净值"], ["changes", "当期变化"], ["actual", "实际回团"]]
      : page === "orders" ? [["orders", "订单净值"], ["changes", "当期变化"]]
      : [["actual", "实际完成"], ["financial", "财务确认资料"], ["future", "未来安排"], ["adjustments", "完成后调整"]];
    return '<div class="report-tabbar" role="tablist" aria-label="金额视图">' + choices.map(([v, t]) =>
      '<button class="report-tab" type="button" role="tab" data-view="' + v + '" aria-selected="' + (draftView === v) + '">' + t + '</button>').join("") + '</div>';
  }
  function metric(label, value, note, pending = false) {
    return '<div class="report-metric"><dt>' + esc(label) + '</dt><dd' + (pending ? ' class="is-pending"' : "") + '>' + esc(value) + '</dd><small>' + esc(note) + '</small></div>';
  }
  function pagination(total) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    pageNumber = Math.min(pageNumber, pages);
    return '<div class="report-pagination"><select aria-label="每页条数" data-page-size>' + [5, 10, 20, 50].map(n => '<option value="' + n + '"' + (pageSize === n ? " selected" : "") + '>' + n + '条/页</option>').join("") + '</select>' +
      '<button class="report-button report-icon-button" type="button" title="上一页" aria-label="上一页" data-page="-1"' + (pageNumber === 1 ? " disabled" : "") + '>' + icon("chevron-left") + '</button>' +
      '<span>' + pageNumber + ' / ' + pages + '</span><button class="report-button report-icon-button" type="button" title="下一页" aria-label="下一页" data-page="1"' + (pageNumber === pages ? " disabled" : "") + '>' + icon("chevron-right") + '</button></div>';
  }
  function totalLabel(rows) {
    if (isOverview) {
      const c = amountCoverage(rows);
      return orderCount(rows) + ' 个订单 · ' + rows.length + (applied.view === 'changes' ? ' 条变化' : ' 条明细') + ' · ' +
        (c.unknown || c.unallocated ? '已知合计 ' : '合计 ') + amount(c.value) + ' ' + unitLabel() +
        (c.unknown ? ' · ' + c.unknown + ' 条金额待确认' : '') + (c.unallocated ? ' · ' + c.unallocated + ' 条金额未分配' : '');
    }
    if (isReturn) {
      const coverageText = (key, title) => {
        const c = amountCoverage(rows, key);
        return title + (c.value !== null && (c.unknown || c.unallocated) ? '已知合计 ' : '合计 ') + amount(c.value) + ' ' + unitLabel() +
          (c.unknown ? ' · ' + c.unknown + ' 条待确认' : '') + (c.unallocated ? ' · ' + c.unallocated + ' 条未分配' : '');
      };
      if (applied.view === 'adjustments' && !rows.length) return '未提供完成后调整记录 · 调整金额待确认';
      const count = orderCount(rows) + ' 个订单 · ' + rows.length + (applied.view === 'future' ? ' 条未完成安排' : ' 条已完成记录');
      if (applied.view === 'financial') return count + ' · ' + ['businessRevenue', 'financeRevenue', 'cost'].map((key, i) => coverageText(key, ['业务结算收入', '财务确认收入', '可归属成本'][i])).join('；');
      const quantities = quantitySummary(rows);
      return count + (quantities ? ' · ' + quantities : '') + ' · ' + coverageText('amount', applied.view === 'future' ? '安排额' : '分配成交额');
    }
    if (isOrder) {
      const coverage = amountCoverage(rows), quantities = quantitySummary(rows);
      return orderCount(rows) + ' 个订单 · ' + rows.length + (applied.view === 'changes' ? ' 条变化' : ' 项销售内容') +
        (applied.view === 'changes' ? ' · 增加 ' + amount(sum(rows.filter(r => r.amount > 0))) + ' · 减少 ' + amount(-sum(rows.filter(r => r.amount < 0))) : quantities ? ' · ' + quantities : '') +
        ' · ' + (coverage.value !== null && (coverage.unknown || coverage.unallocated) ? '已知金额合计 ' : applied.view === 'changes' ? '净变动 ' : '合计 ') + amount(coverage.value) + ' ' + unitLabel() +
        (coverage.unknown ? ' · ' + coverage.unknown + ' 项金额待确认' : '') + (coverage.unallocated ? ' · ' + coverage.unallocated + ' 项金额未分配' : '') +
        (rows.some(r => r.status === '未确认') ? ' · 预留额不计成交' : '');
    }
    if (applied.view === "changes") return orderCount(rows) + ' 个订单 · ' + rows.length + ' 条变化 · 增加 ' + amount(sum(rows.filter(r => r.amount > 0))) + ' · 减少 ' + amount(-sum(rows.filter(r => r.amount < 0))) + ' · 净变动 ' + amount(sum(rows)) + ' ' + unitLabel();
    if (applied.view === "financial") return rows.length + ' 条已完成记录 · 订单项收入及成本均待确认';
    return orderCount(rows) + ' 个订单 · ' + rows.length + (applied.view === "orders" ? ' 项销售内容' : ' 条记录') +
      (["orders", "actual", "future"].includes(applied.view) ? ' · ' + sum(rows, "quantity") + ' 服务项' : '') +
      (applied.view === "orders" && applied.status === "未确认" ? ' · 未确认金额不计成交' : ' · 合计 ' + amount(sum(rows)) + ' ' + unitLabel()) +
      (rows.some(r => r.amount == null) ? ' · ' + rows.filter(r => r.amount == null).length + ' 项金额未确认' : '');
  }
  function renderDetails() {
    const rows = sorted(isReturn ? returnDetailQuery(applied) : isOrder ? orderDetailQuery(applied) : query(applied)), all = columnsFor(applied.view), menu = columnMenu(all);
    const columns = all.filter(c => selectedColumns[applied.view].has(c.key));
    activeTable = { rows, columns };
    const pager = pagination(rows.length);
    const visible = rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    return '<section class="report-section">' + (isReturn ? '' : tabs()) + '<div class="report-section-head"><h2>' + (isOrder && applied.view === "orders" && applied.status !== "有效" ? "订单成交核对" : { orders: "有效成交组成", changes: "成交变化记录", actual: "实际完成记录", financial: "已完成业务的财务确认资料", future: "已售未完成安排", adjustments: "完成后调整记录" }[applied.view]) +
      '</h2><span class="report-muted">金额单位：' + unitLabel() + '</span></div>' + menu + tableHTML(visible, columns) +
      '<div class="report-total"><span data-total>' + totalLabel(rows) + '</span>' + pager + '</div></section>';
  }
  function relativeDate(date, offset) {
    const d = new Date(date + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10);
  }
  function overviewData() {
    return overviewModel.build(applied);
  }
  function overviewSources(result) {
    const cols = [column('order', '订单号'), column('record', '变化／完成记录号'), column('product', '销售内容', 'product'),
      column('confirmed', '订单确认日'), column(applied.view === 'changes' ? 'date' : 'actual', applied.view === 'changes' ? '变化生效日' : '实际完成日'),
      column('company', '销售公司'), column('salesDivision', '销售事业部'), column('salesDepartment', '销售部门'), column('productCompany', '产品经营公司'),
      column('division', '产品事业部'), column('productOrg', '产品经营组'), column('channel', '主成交渠道'), column('budgetRegion', '预算区域'),
      column('amount', '本期金额', 'money'), column('organizationVersion', '发生时组织版本')];
    const rows = result.facts.map(r => ({ ...r, productCompany: orderFieldValue(r, 'productCompany'), record: r.record || r.id,
      actual: r.actual || '不适用', organizationVersion: r.organizationVersion || '待补充' }));
    return { columns: cols, rows };
  }
  function overviewTasks(result) {
    const p = result.periods, total = result.total, range = r => r.start + ' 至 ' + r.end;
    return [
      { name: '月度完成率', actualPeriod: range(p.month), actual: total.monthly, actualCoverage: total.monthCoverage, targetPeriod: range(p.monthTarget), target: total.target, rate: total.completion,
        basis: '本月累计 / 本月完整任务', version: total.taskVersion },
      { name: '年度完成率', actualPeriod: range(p.year), actual: total.yearly, actualCoverage: total.yearCoverage, targetPeriod: range(p.annualTarget), target: total.annualTarget, rate: total.annualCompletion,
        basis: '年累计 / 全年任务', version: '未提供批准版本' },
      { name: '累计进度完成率', actualPeriod: range(p.year), actual: total.yearly, actualCoverage: total.yearCoverage, targetPeriod: range(p.cumulative), target: total.cumulativeTarget, rate: total.cumulativeCompletion,
        basis: '年累计 / 同期累计任务', version: '未提供同进度分解及批准版本' }
    ];
  }
  function overviewTaskColumns() {
    return [column('name', '完成率口径'), column('actualPeriod', '实际统计期间'), column('actual', '实际额', 'money'),
      column('targetPeriod', '任务对应期间'), column('target', '任务额', 'money'), column('rate', '完成率', 'percent'), column('basis', '计算依据'), column('version', '任务版本')];
  }
  function renderOverview() {
    const result = overviewData(), p = result.periods, sources = overviewSources(result), u = unitLabel();
    const all = [
      column("name", overviewModel.levels[applied.grouping][0]), column("amount", "本期金额", "money"),
      column("previous", applied.comparison === 'year' ? "上年同期金额" : "上一等长期间金额"), column("difference", "变动额"), column("growth", applied.comparison === 'year' ? "同比增长率" : "期间增长率"),
      column("monthly", "本月累计", "money"), column("target", "本月任务", "money"), column("completion", "月度完成率", "percent"),
      column("yearly", "年累计", "money"), column("annualTarget", "年度任务"), column("annualCompletion", "年度完成率"),
      column('cumulativeTarget', '同期累计任务', '', true), column('cumulativeCompletion', '累计进度完成率', '', true),
      column('orders', '本期订单数', 'number', true), column('quantity', '本期数量（按单位）', '', true), column('unknownAmount', '本层级未归类额', 'money', true),
      column('missingAmounts', '本期金额缺数条数', 'number', true), column('taskVersion', '任务版本', '', true)
    ];
    const menu = columnMenu(all), cols = all.filter(c => selectedColumns[columnSelectionKey()].has(c.key));
    activeTable = { rows: [...sorted(result.rows), result.total], columns: cols };
    const range = r => r.start + ' 至 ' + r.end;
    const pending = result.actualRows.filter(r => r.settlement === '待结算');
    const coverageText = rows => { const c = amountCoverage(rows); return (c.unknown || c.unallocated) ? '金额缺数 ' + (c.unknown + c.unallocated) + ' 条' : rows.length + ' 条明细'; };
    return '<dl class="report-metrics">' + metric("本期订单净成交额（" + u + "）", amount(amountCoverage(result.orderRows).value), orderCount(result.orderRows) + " 个有效订单 · " + coverageText(result.orderRows)) +
      metric("本期实际回团成交额（" + u + "）", amount(amountCoverage(result.actualRows).value), coverageText(result.actualRows)) +
      metric("已确认业务毛利", "待确认", "未提供可归属的结算收入及成本", true) +
      metric("已完成待结算额（" + u + "）", amount(amountCoverage(pending).value), "分配成交额，非确认收入 · " + coverageText(pending)) + '</dl>' +
      '<section class="report-section">' + tabs() + '<div class="report-section-head"><h2>经营对照</h2><span class="report-muted" data-comparison-period>对比期：' + range(p.previous) + ' · 未提供完整资料</span></div>' +
      '<p class="report-query-status" data-accumulation-period>本月累计：' + range(p.month) + ' · 年累计：' + range(p.year) + '</p>' + menu + tableHTML(activeTable.rows, cols) +
      '<div class="report-total"><span data-total>' + totalLabel(result.facts) + '</span><span>' +
      (result.sample ? '集团5月任务算例（非批准） · 月度完成率 ' + (typeof result.total.completion === 'number' ? result.total.completion.toFixed(2) + '%' : '未计算') : '无匹配批准任务，不计算完成率') + '</span></div></section>' +
      '<section class="report-section"><div class="report-section-head"><h2>任务与完成率</h2><span class="report-muted">' + (applied.view === 'changes' ? '成交变化不作为任务考核指标' : '任务和实际须同指标、同责任范围') + '</span></div>' + tableHTML(overviewTasks(result), overviewTaskColumns(), 'tasks', false) + '</section>' +
      '<section class="report-section"><div class="report-section-head"><h2>期间趋势</h2><span class="report-muted">8个等长期间 · 仅演示样例，非完整经营数据</span></div><div class="report-chart-wrap"><canvas class="report-chart" aria-label="期间样例金额趋势，下方为同一组数据表" role="img"></canvas></div><div data-trend-table></div></section>' +
      '<section class="report-section"><div class="report-section-head"><h2>已售未完成安排</h2><span class="report-muted">截至数据截止日 ' + CUTOFF + ' · 全部计划日期，含到期未确认</span></div>' +
      tableHTML(result.futureGroups, [column("planned", "计划完成日"), column("orders", "订单数", "number"), column("amount", "未完成安排额", "money")], "future", false) +
      '<div class="report-total">未完成安排合计 ' + amount(amountCoverage(result.future).value) + ' ' + u + '</div></section>' +
      '<section class="report-section"><details class="ov-sources"><summary>本期来源明细（' + result.facts.length + '条）</summary>' + tableHTML(sources.rows, sources.columns, 'sources', false) + '</details></section>';
  }
  function productColumns() {
    const category = { type: "产品类型", destination: "主归属目的地", geographyZone: '地理目的地分区', managementZone: '管理目的地分区', management: '经营分类', travel: "旅游范围", business: "业务线" }[applied.structureBy];
    if (applied.productView === "organizations") return [
      column("name", { productOrg: "产品经营组", division: "产品事业部", productCompany: "产品经营公司" }[applied.productLevel]),
      ...(applied.productLevel !== "productCompany" ? [column("productCompany", "经营公司")] : []),
      column("division", "事业部", "", applied.productLevel !== 'productOrg'), column("owner", "负责人", 'product'),
      column("amount", "本期成交额", "money"), column("previous", "上期成交额"), column("growth", "环比"),
      column("lastYear", "上年同期额"), column("annualGrowth", "同比"), column("yearly", "年累计", "money"),
      column("annualTarget", "年度任务"), column("completion", "年度完成率"), column("orders", "订单数", "number", true),
      column('monthly', '本月累计', 'money', true), column('monthlyTarget', '本月任务', '', true), column('monthlyCompletion', '月度完成率', '', true),
      column('cumulativeTarget', '同期累计任务', '', true), column('cumulativeCompletion', '累计进度完成率', '', true), column('taskVersion', '任务版本', '', true),
      column('productLeader', '产品部门领导', '', true), column('quantity', '数量（分单位）', '', true), column('missingAmounts', '金额缺失条数', 'number', true)
    ];
    if (applied.productView === "structure") return [
      column("name", category), column("selfAmount", "自营组织", "money"), column("internalAmount", "集团内部供应", "money"),
      column("externalAmount", "外部采购", "money"), column("unknownAmount", "供应关系待归类", "money"),
      column("amount", "成交额合计", "money"), column("share", "占本范围比例", "percent"), column("orders", "订单数", "number", true)
    ];
    if (applied.productView === "channels") return [
      column("name", category), column("amount", "所选渠道成交额", "money"), column("share", "占所选渠道比例", "percent"),
      column("allAmount", "同范围全部渠道额", "money"), column("contribution", "该渠道贡献比例", "percent"), column("orders", "订单数", "number", true)
    ];
    return [
      column("name", "订单确认年份"), column("finishYear", applied.crossBasis === "actual" ? "实际完成年份" : "计划完成年份"),
      column("completed", "已实际完成额", "money"),
      ...(applied.crossBasis === "actual" ? [] : [column("future", "未完成安排额", "money"), column("amount", "已售合计", "money")]),
      column("lastYear", applied.crossBasis === "actual" ? "同期实际完成额" : "同期已售额"), column("difference", "同比变动额"), column("orders", "订单数", "number", true)
    ];
  }
  function productTotal(result = productReport(applied)) {
    return orderCount(result.facts) + " 个订单 · " + (applied.productView === "crossYear" ? "截至日" : "本期") +
      "合计 " + productAmount(result.facts) + " " + unitLabel() +
      (applied.productView === "crossYear" && applied.crossBasis !== "actual" ? " · 已完成 " + productAmount(result.facts.filter(r => r.actual && r.actual <= CUTOFF)) + " · 未完成 " + productAmount(result.facts.filter(r => !r.actual || r.actual > CUTOFF)) : "");
  }
  function productAmount(rows) {
    const c = amountCoverage(rows);
    return completeAmount(c) ? amount(c.value) : (c.value === null ? '金额待确认' : '已知 ' + amount(c.value)) + '（缺' + (c.unknown + c.unallocated) + '条）';
  }
  function productSources(result) {
    const columns = [column('order', '订单号'), column('sourceOrder', '来源订单号'), column('record', '销售内容／完成记录号'), column('product', '销售内容', 'product'),
      column('confirmed', '订单确认日'), column('planned', '计划完成日'), column('actual', '实际完成日'), column('planMonth', '计划完成月份'), column('fulfillmentStatus', '截至日履约情况'), column('amount', '分配成交额', 'money'),
      column('company', '销售公司'), column('salesDepartment', '销售部门'), column('productCompany', '产品经营公司'), column('division', '产品事业部'),
      column('productOrg', '产品经营组'), column('productLeader', '产品部门领导'), column('owner', '产品负责人'), column('supply', '供应关系'),
      column('geographyZone', '地理目的地分区'), column('managementZone', '管理目的地分区'), column('management', '经营分类'), column('channel', '主成交渠道'), column('organizationVersion', '发生时组织版本')];
    return { columns, rows: result.facts.map(r => ({ ...r, ...Object.fromEntries(columns.filter(c => c.kind !== 'money').map(c => [c.key, orderFieldValue(r, c.key)])),
      record: r.record || r.id, actual: applied.productView !== 'crossYear' && applied.view === 'orders' ? '不适用' : r.actual || '未完成', coverages: { amount: amountCoverage([r]) } })) };
  }
  function productPeriodRows(result) {
    if (!result.periods) return [];
    const p = result.periods, range = v => v.start + ' 至 ' + v.end;
    return [
      { name: '上期比较', actual: applied.start + ' 至 ' + applied.end, reference: range(p.previous), basis: '相邻等长期间；未提供完整可比资料' },
      { name: '上年同期', actual: applied.start + ' 至 ' + applied.end, reference: range(p.lastYear), basis: '上年同日；未提供完整可比资料' },
      { name: '月度完成率', actual: range(p.month), reference: p.month.start + ' 至 ' + p.monthEnd, basis: '月累计 / 完整月任务；未提供匹配批准任务' },
      { name: '年度完成率', actual: range(p.year), reference: p.year.start + ' 至 ' + p.yearEnd, basis: '年累计 / 全年任务；未提供匹配批准任务' },
      { name: '累计进度完成率', actual: range(p.year), reference: range(p.year), basis: '年累计 / 同期累计任务；未提供同进度分解' }
    ];
  }
  const productPeriodColumns = () => [column('name', '比较／任务'), column('actual', '实际统计期间'), column('reference', '比较／任务期间'), column('basis', '计算依据与资料')];
  function renderProduct() {
    const result = productReport(applied), all = productColumns(), menu = columnMenu(all);
    const columns = all.filter(c => selectedColumns[columnSelectionKey()].has(c.key));
    const rows = sorted(result.rows), pager = pagination(rows.length);
    activeTable = { rows, columns };
    const total = productAmount(result.facts), u = unitLabel();
    let metrics;
    if (applied.productView === "crossYear") {
      metrics = metric(applied.crossBasis === "actual" ? "实际完成额（" + u + "）" : "截至日已售额（" + u + "）", total, "按所选完成年份归集") +
        (applied.crossBasis === "actual" ? metric("往年订单完成额（" + u + "）", productAmount(result.facts.filter(r => r.confirmed.slice(0, 4) < r.actual.slice(0, 4))), "订单确认年份早于实际完成年份") :
          metric("已实际完成额（" + u + "）", productAmount(result.facts.filter(r => r.actual && r.actual <= CUTOFF)), "按已完成记录的分配成交额")) +
        (applied.crossBasis === "actual" ? metric("同年订单完成额（" + u + "）", productAmount(result.facts.filter(r => r.confirmed.slice(0, 4) === r.actual.slice(0, 4))), "订单确认与实际完成在同一年") : metric("未完成安排额（" + u + "）", productAmount(result.facts.filter(r => !r.actual || r.actual > CUTOFF)), "未作为实际回团或确认收入")) +
        metric("订单数", orderCount(result.facts), "全查询范围去重");
    } else if (applied.productView === "channels") {
      const ratio = productShare(result.facts, result.allRows);
      metrics = metric("所选渠道成交额（" + u + "）", total, applied.channel || "全部主成交渠道") +
        metric("同范围全部渠道额（" + u + "）", productAmount(result.allRows), "保留公司、产品、门店和期间条件") +
        metric("渠道贡献比例", typeof ratio === 'number' ? ratio.toFixed(2) + '%' : ratio, "所选渠道额 / 同范围全部渠道额") +
        metric("订单数", orderCount(result.facts), "所选渠道内去重");
    } else {
      metrics = metric((applied.view === "orders" ? "订单净成交额" : "实际回团成交额") + "（" + u + "）", total, "当前已查询期间及产品责任范围") +
        metric("订单数", orderCount(result.facts), "按订单号去重") +
        metric("目的地待补充额（" + u + "）", productAmount(result.facts.filter(r => missingFact(r.destination))), "保留在成交合计中") +
        metric("年度任务", "未提供", "未提供产品责任范围批准任务", true);
    }
    return '<dl class="report-metrics">' + metrics + '</dl><section class="report-section"><div class="report-tabbar" role="tablist" aria-label="产品分析视图">' +
      Object.entries(productViews).map(([value, title]) => '<button type="button" class="report-tab" role="tab" data-product-view="' + value + '" aria-selected="' + (draftProductView === value) + '">' + title + '</button>').join("") +
      '</div><div class="report-section-head"><h2>' + productViews[applied.productView] + '</h2><span class="report-muted">' +
      (applied.productView === "crossYear" ? (applied.crossBasis === "actual" ? "按实际完成年份" : "按计划完成年份") + " · 截至2026-05-07" : (applied.view === "orders" ? "订单确认日" : "实际完成日") + " · " + applied.start + " 至 " + applied.end) +
      '</span></div>' + menu + tableHTML(rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), columns) +
      '<div class="report-total"><span data-total>' + productTotal(result) + '</span>' + pager + '</div></section>' +
      (applied.productView === 'organizations' ? '<section class="report-section"><h2>比较期间与任务依据</h2>' + tableHTML(productPeriodRows(result), productPeriodColumns(), 'periods', false) + '</section>' : '') +
      (applied.productView === 'crossYear' && applied.crossBasis !== 'actual' ? '<section class="report-section"><h2>未完成月份与状态</h2>' + tableHTML(pendingMonths(result.facts), [column('company', '销售公司'), column('productCompany', '产品公司'), column('planMonth', '计划完成月份'), column('fulfillmentStatus', '未完成情况'), column('amount', '未完成安排额', 'money'), column('orders', '订单数', 'number')], 'pending-months', false) + '</section>' : '') +
      '<section class="report-section"><div class="report-section-head"><h2>成交构成</h2><span class="report-muted">金额单位：' + u + ' · 全查询范围</span></div>' +
      '<div class="report-chart-wrap"><canvas class="report-chart" role="img" aria-label="当前查询成交额构成，数值见上方报表"></canvas></div></section>' +
      '<section class="report-section"><details class="report-product-sources"><summary>本次查询来源明细（' + result.facts.length + '条）</summary>' + tableHTML(productSources(result).rows, productSources(result).columns, 'sources', false) + '</details></section>';
  }
  function drawProductChart() {
    const canvas = root.querySelector("canvas"); if (!canvas) return;
    const rows = productReport(applied).rows;
    const width = Math.max(140, canvas.parentElement.clientWidth), height = 192, ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio; canvas.height = height * ratio;
    const ctx = canvas.getContext("2d"); ctx.scale(ratio, ratio);
    const total = sum(rows);
    ctx.font = "12px sans-serif"; ctx.fillStyle = "#667085";
    if (!rows.length || total <= 0 || rows.some(r => r.amount < 0 || !completeAmount(r.coverages.amount))) {
      ctx.fillText(rows.length ? "无有效占比分母，金额见上表" : "当前条件无演示记录", 8, 30); return;
    }
    const palette = ["#2f6fed", "#1f8f63", "#b7791f", "#64748b"];
    const rowHeight = Math.min(36, 180 / rows.length);
    rows.forEach((r, i) => {
      const label = r.name + (r.finishYear ? " / " + r.finishYear : "");
      const y = i * rowHeight + 6;
      ctx.fillStyle = "#667085"; ctx.fillText(label, 0, y + 12, width * .42);
      const x = width * .45, barWidth = Math.max(1, (width * .35) * r.amount / total);
      ctx.fillStyle = palette[i % palette.length]; ctx.fillRect(x, y + 2, barWidth, 12);
      ctx.fillStyle = "#1d2430"; ctx.textAlign = "right"; ctx.fillText(amount(r.amount), width - 2, y + 12); ctx.textAlign = "left";
    });
  }
  function drawTrend() {
    const canvas = root.querySelector("canvas"); if (!canvas) return;
    const trend = overviewData().trend;
    root.querySelector("[data-trend-table]").innerHTML = tableHTML(trend, [column("period", "期间"), column("amount", "样例金额", "money"), column("coverage", "资料范围")], "trend", false);
    const width = Math.max(160, canvas.parentElement.clientWidth), height = 192, ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio; canvas.height = height * ratio;
    const ctx = canvas.getContext("2d"); ctx.scale(ratio, ratio); ctx.clearRect(0, 0, width, height);
    const values = trend.map(r => r.amount || 0), max = Math.max(...values, 1), min = Math.min(...values, 0), pad = 34, top = 14, plot = 142;
    const y = value => top + (max - value) / (max - min) * plot;
    ctx.strokeStyle = "#e6eaf2"; ctx.lineWidth = 1;
    [0, .5, 1].forEach(t => { ctx.beginPath(); ctx.moveTo(pad, top + t * plot); ctx.lineTo(width - 8, top + t * plot); ctx.stroke(); });
    const step = (width - pad - 8) / 8;
    trend.forEach((r, i) => {
      const x = pad + step * i + step / 2;
      if (r.amount != null) {
        ctx.fillStyle = r.amount < 0 ? "#c2413a" : i === 7 ? "#1f8f63" : "#2f6fed";
        ctx.fillRect(x - Math.min(18, step / 4), Math.min(y(r.amount), y(0)), Math.min(36, step / 2), Math.max(2, Math.abs(y(0) - y(r.amount))));
      } else {
        ctx.fillStyle = "#c9cfd9"; ctx.fillRect(x - 3, y(0) - 2, 6, 2);
      }
      ctx.fillStyle = "#667085"; ctx.textAlign = "center"; ctx.font = "11px sans-serif";
      if (width > 460 || i % 2 === 1) ctx.fillText(r.label, x, 180);
    });
  }
  function periodDescription() {
    if (isProduct && applied.productView === "crossYear") return "截至2026-05-07全部有效已售 · " +
      (applied.crossBasis === "actual" ? "实际完成年份" : "计划完成年份") + "：" + (applied.targetYear || "全部") + " · 订单确认年份：" + (applied.orderYear || "全部");
    if (applied.view === "future") return "计划完成 " + applied.planStart + " 至 " + applied.planEnd;
    if (applied.view === "financial") return "财务确认资料范围：实际完成 " + applied.start + " 至 " + applied.end;
    if (applied.view === "actual" && applied.calendar === "management") {
      const first = applied.month + "-01", start = relativeDate(first, -1).slice(0, 7) + "-26";
      return "演示管理月 " + applied.month + "（" + start + " 至 " + applied.month + "-25）";
    }
    return ({ orders: orderDateBasis(applied) === "created" ? "订单创建" : "订单确认", changes: "变化生效", actual: "实际完成", adjustments: "调整生效" }[applied.view] || "") + " " + applied.start + " 至 " + applied.end;
  }
  function notes() {
    if (isOverview) return [
      '来源：本页引用订单及实际完成明细中的同一组演示记录和发生时归属，数据截止2026-05-07日终；未接入正式取数、更新、发布及生产权限。',
      '期间：订单按确认期间看截止日净值，变化按生效日计增减，回团按实际完成分配额。月累计及年累计以所选结束日为止，不取未来计划额。订单、回团及毛利不能相加。',
      '比较：上一期间为紧邻本期的等长日历区间；上年同期按同月日演示，闰日暂取上年2月末，正式考核日历待确认。缺完整同期记录，不把零散样例或空结果当成可比实绩。',
      '归属：销售和产品责任独立，事业部/部门按所属公司分别统计。本期为零但本月或年内有记录的组织仍保留；本层级归属缺失单列，数量分单位且不冒充旅客人次。',
      '任务：正式任务及批准版本未提供。可选集团5月算例仅用于全集团同指标的月度计算，不分摊到公司、部门或产品；不读取预算管理草稿。年度及同进度任务缺失不推算，部分月份任务不按天平均。',
      '财务：结算收入与成本缺少确认依据，毛利不推算。未完成安排以数据截止日观察，不是所选结束日的历史发布结果；未提供更正版或历史计划版本。'
    ].map(t => '<p>' + t + '</p>').join('');
    if (isReturn) return [
      "数据：O01至O09为虚构验收样例，截止2026-05-07日终；无正式取数、自动更新或生产权限。销售及产品归属引用订单发生时演示资料，正式组织与历史考核规则待确认。",
      "履约：实际完成依据独立的确认记录，不按计划到期自动认定。分阶段按完成分配额统计，服务项不等于游客人次；未完成安排按计划日期统计，包含所选期间到期但尚未确认的安排。",
      "财务：已完成不等于已结算，已结算不等于收入或成本已确认。财务确认资料按实际完成日期筛选，不是按会计期间取收入；核算主体及收入、成本各自的期间由财务确认记录提供。",
      "金额：未提供确认记录、待确认和未分配分别列示；不复制团期收入或成本，不用分配成交额当财务收入，不推算税额或毛利。完成后调整未提供记录，不代表调整为零。",
      "管理月：上月26日至本月25日仅为待确认的演示规则，按实际完成日派生且只含数据截止前的完成事实；未来安排没有实际完成日或回团管理月。"
    ].map(t => '<p>' + t + '</p>').join('');
    if (isOrder) return [
      "数据：O01至O09为虚构验收样例，截止2026-05-07日终；无正式业务取数、自动更新或生产权限。数量为服务项，不代表游客人次。",
      "成交：按所选确认或创建日期查订单，截至数据截止计净值；未确认预留额不计成交。当期变化只按变化生效日计增减，退款支付不再冲减成交。",
      "归属：采用发生时演示资料。销售、产品和签约责任分别记录，部门领导不等于销售人员或产品负责人；演示公司与部门不是正式组织名册。",
      "分类：地理目的地与管理分区分开，多目的地不重复计成交。经营分类、收入确认方式及税务处理未获财务确认，不按供应关系推算。",
      "金额：只有已分配到销售内容的实收才进入当前行；未分配、待确认与已知零值分别列示。正式业绩金额、历史归属、日历与财务政策仍待确认。"
    ].map(t => '<p>' + t + '</p>').join('');
    if (isProduct) return [
      "数据范围及更新：订单O01至O09的固定演示样例，截至2026-05-07日终；未接正式业务数据、自动更新、发布版本及生产权限。",
      "产品责任：引用订单发生时共同归属，销售与产品公司、事业部、部门领导、产品负责人分别核对；这些演示资料不是正式组织名册。同名组织按公司区分，历史归属不由当前任职覆盖。",
      "金额口径：订单按确认期间看截至日净成交额；实际回团按实际完成分配成交额，包含待结算业务。金额不是财务确认收入。",
      "供应分类：自营组织、集团内部供应、外部采购和待归类分别统计；自营／甄选／外采的集团正式经营分类仍待确认，不把内部供应强行算作外采。",
      "目的地：每项销售内容只按一个主归属目的地计入；未提供目的地仍保留待补充行。多目的地的正式分配政策待确认，不在报表按途经国家重复计数。",
      "渠道比例：占所选渠道比例以该渠道查询总额为分母；渠道贡献比例只解除主成交渠道筛选，公司、产品、门店及期间等条件保持不变。分母非正时不计算比例。",
      "跨年收客：按截至日全部有效已售记录及目标完成年份统计，不套用本期订单确认日期；计划年份表分别列实际完成与未完成安排，实际年份表只列已完成。两张表不能相加。",
      "比较及任务：上期为相邻等长期间，上年同日遇闰日取有效月末仅为演示约定，正式日历待确认。月度、年度、累计进度任务分别匹配，不读取集团算例或预算草稿；完整同期、批准任务缺失不生成增长率或完成率。",
      "缺失资料：同组已知负责人和待补充同时保留；部分金额缺失只列已知金额和缺失条数，不计算占比。数量不作为旅客人次。跨年收客固定按数据截止日，不提供历史时点还原。"
    ].map(t => "<p>" + t + "</p>").join("");
    return [
      "数据范围：虚构验收订单O01至O09，非财务实绩；数量为服务项，未提供旅客名单，不计算出游人次。",
      "数据更新：本地固定演示样例，截至2026-05-07 23:59；尚未接入自动更新、正式发布版本和生产数据权限。",
      "统计口径：订单按确认期间看截至日净值；当期变化按生效日期计增减。退款支付不再次冲减成交。",
      "实际回团按实际完成记录的分配成交额统计，包含待结算业务；未来安排独立统计，不作为实际回团或确认收入。",
      "管理月仅演示上月26日至本月25日规则，尚待财务确认。日期范围超过截止日的管理月只含截止日前已完成记录。",
      "毛利及财务确认：收入或成本未提供时不按比例推算，待确认不等于零；财务确认视图仅展示已有完成业务的确认资料缺口。",
      "主业绩金额、有效状态、统计日历及集团收入政策均待确认；任务样例并非批准预算，对比资料缺失不生成增长率。"
    ].map(t => '<p>' + t + '</p>').join("");
  }
  function render() {
    if (isReturn) root.querySelectorAll('[data-return-tabs] [data-view]').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.view === (financialActive ? 'financial' : draftView))));
    root.querySelector("[data-results]").innerHTML = isProduct ? renderProduct() : isOverview ? renderOverview() : renderDetails();
    root.querySelector("[data-meta]").innerHTML = '<span class="report-demo">演示数据 · 财务口径待确认</span><span>' + esc(periodDescription()) +
      '</span><span>截止：2026-05-07 23:59</span><span>已查范围：' + esc(names[applied.company] || "演示集团全部") +
      ' / ' + esc(productNames[applied.productOrg] || "全部产品组") + ' / ' + esc(applied.channel || "全部渠道") + '</span>';
    if (isOverview) root.querySelector('[data-meta]').insertAdjacentHTML('beforeend', '<span>分析责任：' + (applied.responsibility === 'product' ? '产品责任' : '销售责任') + ' / ' + overviewModel.levels[applied.grouping][0] + '</span>');
    if (isDetail || isOverview || isProduct) root.querySelector("[data-meta]").insertAdjacentHTML("beforeend", orderFilterFields.filter(([key]) => applied[key]).map(([key, label]) =>
      '<span>' + label + '：' + esc(applied[key] === '__missing' ? '待补充／待确认' : key === 'productCompany' ? names[applied[key]] || applied[key] : applied[key]) + '</span>').join('') +
      (applied.dataQuality ? '<span>资料情况：' + (applied.dataQuality === 'ownership' ? '经营归属待补充' : '分类待确认') + '</span>' : ''));
    root.querySelector("[data-notes]").innerHTML = notes();
    const status = root.querySelector("[data-query-status]"); status.textContent = "已查询 · " + VERSION; status.classList.remove("is-dirty");
    root.querySelector("[data-error]").hidden = true;
    root.querySelectorAll("[data-report-link]").forEach(a => {
      const p = new URLSearchParams(); sharedKeys.forEach(k => { if (applied[k]) p.set(k, applied[k]); });
      a.href = paths[a.dataset.reportLink] + "?" + p.toString();
    });
    if (isOverview) drawTrend();
    if (isProduct) drawProductChart();
  }
  root.addEventListener("click", event => {
    const productTab = event.target.closest("[data-product-view]");
    if (productTab) {
      draftProductView = productTab.dataset.productView;
      root.querySelectorAll("[data-product-view]").forEach(t => t.setAttribute("aria-selected", String(t === productTab)));
      updateDateControls(); sortKey = "";
      dirty("已选" + productTab.textContent + "，请核对范围后查询；下方仍为已查询结果");
    }
    const tab = event.target.closest("[data-view]");
    if (tab) {
      if (isReturn) {
        showReturnFinance(tab.dataset.view === 'financial');
        root.querySelectorAll('[data-view]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
        if (financialActive) return;
      }
      draftView = tab.dataset.view;
      if (form.elements.calendar) form.elements.calendar.value = "actual";
      if (form.elements.settlement) form.elements.settlement.value = "";
      if (isReturn) {
        form.elements.incomeStatus.value = form.elements.costStatus.value = "";
      }
      root.querySelectorAll("[data-view]").forEach(t => t.setAttribute("aria-selected", String(t === tab)));
      sortKey = ""; updateDateControls();
      dirty("已选" + tab.textContent + "，请核对日期后查询；下方仍为已查询结果");
    }
    const sort = event.target.closest("[data-sort]");
    if (sort) { sortDirection = sortKey === sort.dataset.sort ? -sortDirection : 1; sortKey = sort.dataset.sort; renderKeepingDraft(); }
    const pager = event.target.closest("[data-page]");
    if (pager) { pageNumber += Number(pager.dataset.page); renderKeepingDraft(); }
  });
  function renderKeepingDraft() {
    const pending = root.querySelector("[data-query-status]").classList.contains("is-dirty");
    render(); if (pending) dirty();
  }
  root.addEventListener("change", event => {
    const target = event.target;
    if (target.dataset.column) {
      const set = selectedColumns[columnSelectionKey()];
      if (target.checked) set.add(target.dataset.column); else set.delete(target.dataset.column);
      const wasOpen = target.closest("details").open;
      renderKeepingDraft(); root.querySelector(".report-columns").open = wasOpen;
    }
    if (target.hasAttribute("data-page-size")) { pageSize = Number(target.value); pageNumber = 1; renderKeepingDraft(); }
  });
  root.querySelector("[data-export]").addEventListener("click", () => {
    if (isReturn && financialActive) { financialView.exportResult(); return; }
    const viewNames = { orders: (orderDateBasis(applied) === "created" ? "订单创建期间" : "订单确认期间") + "截至日净值", changes: "变化生效期间净变动", actual: "实际完成分配成交额", financial: "已完成业务财务确认资料", future: "已售未完成安排", adjustments: "完成后调整" };
    const filterLabels = {
      version: "数据版本", period: "统计期间", start: "已查询范围开始日", end: "已查询范围结束日", view: "金额视图",
      company: "销售公司", productOrg: "产品经营组", channel: "主成交渠道", team: "门店／销售组", order: "订单号",
      sourceOrder: "来源订单号", status: "订单状态", type: "产品类型", supply: "供应关系", travel: "旅游范围",
      business: "业务线", destination: "主归属目的地", source: "数据来源", unit: "金额单位", grouping: "责任分组",
      comparison: "比较期间", responsibility: "分析责任", budget: "任务版本", calendar: "日期口径", month: "管理月（仅管理月查询适用）",
      planStart: "计划完成开始日（仅未来安排适用）", planEnd: "计划完成结束日（仅未来安排适用）", planMonth: '完成月份（按所选口径）', fulfillmentStatus: '截至日履约情况',
      confirmYear: "订单确认年份", finishYear: "完成／计划年份", settlement: "结算状态",
      productView: "产品分析视图", productLevel: "责任层级", structureBy: "结构分类", crossBasis: "完成年份口径",
      orderYear: "订单确认年份", targetYear: "目标完成年份", productCompany: "产品经营公司", division: "产品事业部", ownerState: "负责人资料",
      dateBasis: "日期依据", dataQuality: "资料情况", incomeStatus: "收入确认资料", costStatus: "成本确认资料", ...Object.fromEntries(orderFilterFields)
    };
    const metadata = [
      [titles[page], VERSION, "演示数据，非财务实绩"], ["查询期间", periodDescription()], ["数据截止", CUTOFF + " 23:59"],
      ["金额单位", "人民币" + unitLabel()], ["统计口径", isProduct && applied.productView === "crossYear" ? "截至日有效已售按完成年份统计" : viewNames[applied.view], "规则待确认"],
      ...Object.entries(applied).filter(([k]) => {
        if (isProduct && k === "productView") return true;
        if (!form.elements[k] && k !== "view") return false;
        if (isProduct) {
          if (["start", "end", "period", "view"].includes(k) && applied.productView === "crossYear") return false;
          if (k === "productLevel") return applied.productView === "organizations";
          if (k === "structureBy") return ["structure", "channels"].includes(applied.productView);
          if (["crossBasis", "orderYear", "targetYear", "planMonth", "fulfillmentStatus"].includes(k)) return applied.productView === "crossYear";
        }
        if (k === "status") return applied.view === "orders";
        if (k === "dateBasis") return isOrder && applied.view === "orders";
        if (["planStart", "planEnd", "planMonth", "fulfillmentStatus"].includes(k)) return applied.view === "future";
        if (k === "start" || k === "end" || k === "period") return applied.view !== "future" && !(isReturn && applied.view === "actual" && applied.calendar === "management");
        if (k === "calendar") return applied.view === "actual";
        if (k === "month") return applied.view === "actual" && applied.calendar === "management";
        if (k === "settlement") return applied.view === "actual" || applied.view === "financial";
        if (["incomeStatus", "costStatus"].includes(k)) return applied.view === "financial";
        if (["confirmYear", "finishYear"].includes(k)) return applied.view !== "adjustments";
        return true;
      }).map(([k, v]) => {
        const control = form.elements[k];
        const option = control?.tagName === "SELECT" ? Array.from(control.options).find(o => o.value === v)?.textContent : null;
        const orderOption = (isDetail || isOverview || isProduct) && orderFilterFields.some(([key]) => key === k) ? orderOptions(k).find(([value]) => value === v)?.[1] : null;
        return [isReturn && k === "finishYear" ? (applied.view === "future" ? "计划完成年份" : "实际完成年份") : filterLabels[k], k === "productView" ? productViews[v] : k === "view" ? viewNames[v] : isOverview && k === 'grouping' ? overviewModel.levels[v][0] : orderOption || option || v];
      }), ["全查询合计", isProduct ? productTotal() : isOverview ? totalLabel(overviewData().facts) : totalLabel(activeTable.rows)], []
    ];
    const extra = [];
    if (isProduct) {
      const result = productReport(applied), sources = productSources(result);
      const section = (name, rows, cols) => extra.push([], [name], cols.map(c => c.label + (c.kind === 'money' ? '（' + unitLabel() + '）' : '')), ...rows.map(r => cols.map(c => cellValue(r, c, true))));
      if (applied.productView === 'organizations') section('比较期间与任务依据', productPeriodRows(result), productPeriodColumns());
      if (applied.productView === 'crossYear' && applied.crossBasis !== 'actual') section('未完成月份与状态', pendingMonths(result.facts), [column('company', '销售公司'), column('productCompany', '产品公司'), column('planMonth', '计划完成月份'), column('fulfillmentStatus', '未完成情况'), column('amount', '未完成安排额', 'money'), column('orders', '订单数', 'number')]);
      section('本次查询来源明细', sources.rows, sources.columns);
      if (applied.productView === 'channels') section('同范围全部渠道来源（仅解除主渠道）', productSources({ facts: result.allRows }).rows, sources.columns);
    }
    if (isOverview) {
      const result = overviewData(), sources = overviewSources(result), p = result.periods;
      metadata.push(['比较起止日', p.previous.start, p.previous.end, '未提供完整资料'], ['月累计起止日', p.month.start, p.month.end], ['年累计起止日', p.year.start, p.year.end]);
      const section = (name, rows, cols) => extra.push([], [name], cols.map(c => c.label + (c.kind === 'money' ? '（' + unitLabel() + '）' : '')), ...rows.map(r => cols.map(c => cellValue(r, c, true))));
      section('任务与完成率', overviewTasks(result), overviewTaskColumns());
      section('期间趋势（演示样例）', result.trend, [column('period', '期间'), column('amount', '样例金额', 'money'), column('coverage', '资料范围')]);
      section('数据截止日全部已售未完成安排（非查询结束日历史结果）', result.futureGroups, [column('planned', '计划完成日'), column('orders', '订单数', 'number'), column('amount', '未完成安排额', 'money')]);
      section('本期来源明细', sources.rows, sources.columns);
    }
    const csv = metadata.concat([activeTable.columns.map(c => c.label + (c.kind === "money" ? "（" + unitLabel() + "）" : ""))],
      activeTable.rows.map(r => activeTable.columns.map(c => cellValue(r, c, true))), extra).map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = titles[page] + "-" + applied.view + "-演示V1.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const pending = root.querySelector("[data-query-status]").classList.contains("is-dirty");
    root.querySelector("[data-query-status]").textContent = "已导出全查询结果" + (pending ? " · 新条件尚未查询" : "");
  });
  setForm(applied); refreshTeams(); refreshOrderOrganizations(); updateDateControls();
  const initialError = validate(applied);
  if (initialError) { applied = { ...defaults }; setForm(applied); updateDateControls(); }
  render();
  if (isOverview || isProduct) {
    const observer = new ResizeObserver(() => { if (root.isConnected) { if (isProduct) drawProductChart(); else drawTrend(); } else observer.disconnect(); });
    observer.observe(root);
  }
})();
