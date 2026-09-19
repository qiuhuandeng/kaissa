const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const storage = new Map();
const window = {
  sessionStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
  },
  caesarUI: { closeLayer: () => {} },
};
const modelContext = { window };
vm.createContext(modelContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../shared/leader-prototype-data.js'), 'utf8'), modelContext);

const html = fs.readFileSync(path.join(__dirname, '../merchant/tour/schedules-detail.html'), 'utf8');
const start = html.indexOf('function leaderDispatchState()');
const end = html.indexOf('function renderTypeSections(', start);
assert.ok(start > 0 && end > start);
const elements = new Map();
for (const id of ['leaderDispatchPerson', 'leaderDispatchStart', 'leaderDispatchEnd', 'leaderDispatchScope', 'leaderDispatchConfirm', 'leaderActualDate', 'leaderActualResult', 'leaderDispatchBasis', 'leaderDispatchError']) elements.set(id, { value: '', hidden: true, textContent: '' });
const context = {
  window,
  document: { getElementById: (id) => elements.get(id) },
  scheduleData: { code: 'TEST-LEADER-001', product: '欧洲团', depart: '2026-10-20', back: '2026-11-01' },
  activeDetailConfig: { info: { destination: '法国、德国' } },
  leaderDispatchStates: {},
  leaderDispatchMode: 'assign',
  leaderDispatchDrawer: {},
  escapeHtml: (value) => String(value),
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);
context.renderLeaderDispatch = () => {};
const input = (id, value) => { elements.get(id).value = value; };
input('leaderDispatchPerson', 'LD-20260312001');
input('leaderDispatchStart', '2026-10-20');
input('leaderDispatchEnd', '2026-11-01');
input('leaderDispatchScope', '全程领队');
input('leaderDispatchConfirm', '已确认');
context.saveLeaderDispatch();
const state = context.leaderDispatchState();
assert.equal(state.active.name, '张建国');
assert.equal(state.events.length, 1);
context.saveLeaderDispatch();
assert.equal(state.events.length, 1, '重复保存不新增记录');

context.leaderDispatchMode = 'actual';
input('leaderActualDate', '2026-10-20');
input('leaderActualResult', '实际出行');
input('leaderDispatchBasis', '领队实际出发确认');
context.saveLeaderDispatch();
assert.equal(state.actual.result, '实际出行');
assert.equal(window.CaesarLeaderPrototype.load().find((row) => row.name === '张建国').history.find((row) => row.schedule === 'TEST-LEADER-001').result, '实际带团');
context.saveLeaderDispatch();
assert.equal(state.events.length, 2, '重复登记实际结果不新增记录');

context.leaderDispatchMode = 'assign';
input('leaderDispatchPerson', 'LD-20260601009');
input('leaderDispatchBasis', '更换领队');
context.saveLeaderDispatch();
assert.equal(state.active.name, '张建国', '已实际出行不得覆盖派团');

context.scheduleData.code = 'TEST-LEADER-002';
input('leaderDispatchPerson', 'LD-20260418007');
input('leaderDispatchBasis', '');
context.saveLeaderDispatch();
assert.equal(context.leaderDispatchState().active, null, '过期证件不得派团');
input('leaderDispatchPerson', 'LD-20260312001');
context.saveLeaderDispatch();
context.leaderDispatchMode = 'cancel';
context.saveLeaderDispatch();
assert.ok(context.leaderDispatchState().active, '无取消依据不得取消');
input('leaderDispatchBasis', '团期取消，领队未出行');
context.saveLeaderDispatch();
assert.equal(context.leaderDispatchState().active, null);
assert.equal(window.CaesarLeaderPrototype.load().find((row) => row.name === '张建国').history.find((row) => row.schedule === 'TEST-LEADER-002').result, '取消派团');
assert.equal(window.CaesarLeaderPrototype.actualCount(window.CaesarLeaderPrototype.load().find((row) => row.name === '张建国')), 4, '取消派团不增加实际带团次数');
console.log('派团、过期阻断、重复登记、实际出行和取消依据算例通过');
