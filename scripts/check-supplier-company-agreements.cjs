const assert = require('node:assert/strict');
require('../shared/supplier-company-agreements.js');
const agreements = globalThis.SupplierCompanyAgreements;
const supplier = '欧洲联合地接社';
const beijing = agreements.get('AGR-EU-BJ-026');
const shanghai = agreements.get('AGR-EU-SH-016');

assert.equal(agreements.valid(beijing.no, supplier, '北京凯撒'), true);
assert.equal(agreements.valid(beijing.no, supplier, '上海凯撒'), false);
assert.equal(agreements.valid(beijing.no, '其他供应商', '北京凯撒'), false);
assert.equal(agreements.valid('AGR-EU-BJ-027', supplier, '北京凯撒'), false);
assert.equal(agreements.valid('AGR-EU-FJ-015', supplier, '福建凯撒'), false);
assert.equal(agreements.valid('UNKNOWN', supplier, '北京凯撒'), false);
assert.equal(agreements.list(supplier, '上海凯撒').filter(a => agreements.eligible(a)).length, 2);
assert.equal(agreements.eligible(beijing, '2025-12-31'), false);
assert.equal(agreements.eligible(beijing, '2026-12-31'), true);
assert.equal(agreements.eligible(beijing, '2027-01-01'), false);
assert.equal(agreements.dueDate(beijing, '2026-09-17'), '2026-10-17');
assert.equal(agreements.dueDate(shanghai, '2026-09-17'), '2026-11-01');
assert.equal(agreements.dueDate(beijing, ''), '');

const historical = agreements.basisHtml({ agreementNo: 'AGR-EU-FJ-015', supplier, businessCompany: '福建凯撒', usedOn: '2026-07-02', eventDate: '2026-07-02', planDate: '2026-07-15', contract: 'SUP-EU-GROUND-2026' });
assert.match(historical, /AGR-EU-FJ-015/);
assert.doesNotMatch(historical, /AGR-EU-FJ-028/);
assert.match(historical, /2026-08-01/);
assert.match(historical, /本申请保留发生时的协议、成本和应付依据/);
assert.match(historical, /不自动拒绝/);
assert.match(agreements.basisHtml({ agreementNo: beijing.no, supplier, businessCompany: '上海凯撒' }), /与本次公司或供应商不符/);
console.log('PASS：公司及供应商匹配、待批隔离、多协议、有效期边界、账期计算、到期历史依据和提前付款提示。');
