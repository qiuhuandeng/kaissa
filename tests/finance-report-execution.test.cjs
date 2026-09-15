const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { inspect, ledgerPath, progressPath } = require('../scripts/check-finance-report-execution.cjs');
const root = path.resolve(__dirname, '..');
const original = fs.readFileSync(path.join(root, ledgerPath), 'utf8');
const checkpoint = batch => ['报表执行批次：' + batch, '报表批内断点：测试', '报表已改文件：测试',
  '报表已跑检查：测试', '报表未跑检查：测试', '报表下一动作：测试'].map(s => '- ' + s).join('\n');
const allIds = Array.from({ length: 36 }, (_, i) => '执' + String(i + 1).padStart(2, '0')).concat(
  Array.from({ length: 6 }, (_, i) => '场' + String(i + 1).padStart(2, '0'))).join('\n');
// Normalize the fixture so these negative tests survive future real progress.
const fixture = original.split('\n').map(line => {
  if (!/^\| (执|场)\d{2} \|/.test(line)) return line;
  const cells = line.split('|').map(s => s.trim());
  const item = cells[1].startsWith('执');
  cells[item ? 6 : 4] = cells[1] === '执01' ? '已验收' : item ? '待实施' : '待验收';
  cells[item ? 7 : 5] = cells[1] === '执01' ? 'docs/财务收退转付明细原型验收记录-20260914.md' : '-';
  return '| ' + cells.slice(1, -1).join(' | ') + ' |';
}).join('\n');
const check = (overrides = {}) => inspect({ ledger: fixture, progress: checkpoint('2'), readEvidence: () => allIds, ...overrides });
const rejected = result => assert.ok(result.errors.length, 'invalid ledger must fail');

test('repository execution ledger and current progress are consistent', () => {
  const result = inspect({ ledger: original, progress: fs.readFileSync(path.join(root, progressPath), 'utf8'),
    readEvidence: file => fs.readFileSync(path.join(root, file), 'utf8') });
  assert.deepEqual(result.errors, []);
});
test('baseline keeps one completed batch and the next batch at two', () => {
  const r = check(); assert.deepEqual(r.errors, []); assert.equal(r.currentBatch, '2'); assert.equal(r.completedBatches, 1);
});
test('missing or duplicated requirement cannot silently shrink scope', () => {
  rejected(check({ ledger: fixture.replace(/^\| 执25.*\n/m, '') }));
  rejected(check({ ledger: fixture.replace('| 执25 |', '| 执24 |') }));
});
test('changed batch ownership and invalid status fail', () => {
  rejected(check({ ledger: fixture.replace('| 执25 | 7 |', '| 执25 | 8 |') }));
  rejected(check({ ledger: fixture.replace('待实施 | - |', '已完成 | - |') }));
});
test('acceptance requires an existing evidence file covering the requirement', () => {
  rejected(check({ ledger: fixture.replace('待实施 | - |', '已验收 | - |') }));
  const ledger = fixture.replace('待实施 | - |', '已验收 | docs/test.md |');
  rejected(check({ ledger, readEvidence: () => { throw new Error('missing'); } }));
  rejected(check({ ledger, readEvidence: () => 'no requirement reference' }));
});
test('evidence must stay inside repository docs', () => {
  rejected(check({ ledger: fixture.replace('待实施 | - |', '已验收 | docs/../test.md |') }));
});
test('progress cannot skip batches or lose checkpoint details', () => {
  rejected(check({ progress: checkpoint('3') }));
  rejected(check({ progress: checkpoint('2').replace(/^- 报表未跑检查.*$/m, '') }));
  rejected(check({ progress: checkpoint('2') + '\n- 报表执行批次：2' }));
});
test('later batch cannot start before the current one is accepted', () => {
  const ledger = fixture.replace(/^(\| 执20 .*)待实施 \| - \|$/m, '$1进行中 | - |');
  rejected(check({ ledger }));
});
test('incomplete final gate fails even when structural checks pass', () => {
  assert.deepEqual(check().errors, []); rejected(check({ final: true }));
});
test('all requirements and scenarios with evidence permit final delivery', () => {
  const ledger = fixture.replace(/(?:待实施|待验收) \| - \|/g, '已验收 | docs/test.md |');
  assert.deepEqual(check({ ledger, progress: checkpoint('已收尾'), final: true }).errors, []);
  rejected(check({ ledger: ledger.replace(/^(\| 场06 .*)已验收 \| docs\/test.md \|$/m, '$1待验收 | - |'),
    progress: checkpoint('已收尾') }));
});
test('malformed table boundaries and cells fail', () => {
  rejected(check({ ledger: fixture.replace('<!-- execution-items:end -->', '') }));
  rejected(check({ ledger: fixture.replace('| 执02 | 2 |', '| 执02 | 2 | extra |') }));
});
