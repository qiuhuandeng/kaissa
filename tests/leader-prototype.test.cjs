const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const values = new Map();
const context = {
  window: {
    sessionStorage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
  },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../shared/leader-prototype-data.js'), 'utf8'), context);

const model = context.window.CaesarLeaderPrototype;
const records = model.load();
const leader = records.find((record) => record.id === 'LD-20260312001');
assert.equal(records.length, 4);
assert.equal(model.actualCount(leader), 3, '计划、取消、更换不计实际带团');
assert.equal(model.actualCount(records.find((record) => record.name === '李梅')), 0);
assert.equal(model.duplicate(records, { identity: leader.identity }).id, leader.id);
assert.equal(model.duplicate(records, { passportNo: leader.passportNo.toLowerCase() }).id, leader.id);
assert.equal(model.duplicate(records, { guideNo: leader.guideNo }, leader.id), null);
leader.certificateHistory.push({ type: '护照', oldNo: 'EJ-OLD-123', newNo: leader.passportNo });
assert.equal(model.duplicate(records, { passportNo: 'EJOLD123' }).id, leader.id, '旧证件也要参与查重');

const filtered = model.filterHistory(leader, { destination: '英国', start: '2026-07-01', end: '2026-07-31' });
assert.equal(filtered.length, 1);
assert.equal(filtered[0].schedule, 'EU-UKI-20260716-001');
const csv = model.historyCsv(leader, filtered);
assert.ok(csv.startsWith('\uFEFF'));
assert.ok(csv.includes('来源团号'));
assert.ok(csv.includes('EU-UKI-20260716-001'));
assert.ok(!csv.includes('CR-MED-20250618-001'), '导出只包含当前筛选结果');
assert.ok(model.historyCsv(leader, [{ ...filtered[0], product: '=1+1' }]).includes("'="), '导出文本不能作为表格公式执行');

records.push({ id: 'LD-TEST-001', name: '新增领队', history: [], reviews: [] });
model.save(records);
assert.equal(model.load().length, 5, '新档案能在当前原型会话重开');
console.log('领队查重、实际带团次数、筛选导出和会话保存通过');
