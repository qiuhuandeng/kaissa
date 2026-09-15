const fs = require('node:fs');
const path = require('node:path');

const ledgerPath = 'docs/集团财务报表执行清单.md';
const progressPath = 'docs/业财报表自动化改造进度.md';
const batches = [1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 6, 6,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8];
const statuses = new Set(['待实施', '进行中', '待验收', '已验收', '受阻']);
const idFor = (prefix, index) => prefix + String(index + 1).padStart(2, '0');

// These two marked tables have a deliberately fixed, pipe-free cell format.
function table(text, name, width, errors) {
  const start = '<!-- execution-' + name + ':start -->';
  const end = '<!-- execution-' + name + ':end -->';
  if (text.split(start).length !== 2 || text.split(end).length !== 2 || text.indexOf(end) < text.indexOf(start)) {
    errors.push(name + ': table markers missing, repeated or out of order');
    return [];
  }
  const lines = text.slice(text.indexOf(start) + start.length, text.indexOf(end)).trim().split(/\r?\n/);
  if (lines.length < 3 || !/^\|[-| ]+\|$/.test(lines[1])) {
    errors.push(name + ': invalid table header');
    return [];
  }
  return lines.slice(2).map((line, i) => {
    const cells = line.trim().split('|').slice(1, -1).map(s => s.trim());
    if (!line.trim().startsWith('|') || !line.trim().endsWith('|') || cells.length !== width || cells.some(c => !c)) {
      errors.push(name + ': invalid row ' + (i + 1));
    }
    return cells;
  });
}

function inspect({ ledger, progress, readEvidence, final = false }) {
  const errors = [];
  const items = table(ledger, 'items', 7, errors);
  const scenarios = table(ledger, 'scenarios', 5, errors);
  function checkRows(rows, count, prefix, statusIndex, evidenceIndex) {
    if (rows.length !== count) errors.push(prefix + ': expected ' + count + ' rows, found ' + rows.length);
    const seen = new Set();
    rows.forEach((row, index) => {
      const id = row[0], status = row[statusIndex], evidence = row[evidenceIndex];
      if (id !== idFor(prefix, index) || seen.has(id)) errors.push(prefix + ': missing, duplicated or reordered ID at ' + (index + 1));
      seen.add(id);
      if (!statuses.has(status)) errors.push(id + ': invalid status');
      if (status === '已验收') {
        if (!evidence || !/^docs\/.+\.md$/.test(evidence) || evidence.split('/').includes('..') || evidence.includes('\\')) {
          errors.push(id + ': accepted without a repository evidence document');
        } else {
          try {
            const content = readEvidence(evidence);
            if (!content.trim() || (id !== '执01' && !content.includes(id))) errors.push(id + ': evidence does not cover this ID');
          } catch {
            errors.push(id + ': evidence file missing or unreadable');
          }
        }
      }
      if (final && status !== '已验收') errors.push(id + ': not accepted for final delivery');
    });
  }
  checkRows(items, 36, '执', 5, 6);
  checkRows(scenarios, 6, '场', 3, 4);
  items.forEach((row, i) => {
    if (row[1] !== String(batches[i])) errors.push(row[0] + ': batch assignment changed');
  });
  const pending = items.find(row => row[5] !== '已验收');
  const expected = pending ? pending[1] : '已收尾';
  const checkpoints = [...progress.matchAll(/^- 报表执行批次：(.+)$/gm)];
  if (checkpoints.length !== 1 || checkpoints[0][1].trim() !== expected) {
    errors.push('Progress checkpoint must match the first incomplete batch: ' + expected);
  }
  for (const field of ['报表批内断点', '报表已改文件', '报表已跑检查', '报表未跑检查', '报表下一动作']) {
    const matches = [...progress.matchAll(new RegExp('^- ' + field + '：(.+)$', 'gm'))];
    if (matches.length !== 1 || !matches[0][1].trim()) errors.push('Missing or repeated checkpoint field: ' + field);
  }
  if (pending) {
    items.filter(row => Number(row[1]) > Number(expected) && row[5] !== '待实施').forEach(row => {
      errors.push(row[0] + ': later batch started before current batch acceptance');
    });
  }
  if (expected === '已收尾' && scenarios.some(row => row[3] !== '已验收')) errors.push('Final scenarios remain unaccepted');
  const completedBatches = batches.filter((v, i, a) => a.indexOf(v) === i).filter(batch =>
    items.filter(row => row[1] === String(batch)).length === batches.filter(b => b === batch).length &&
    items.filter(row => row[1] === String(batch)).every(row => row[5] === '已验收'));
  return { errors, currentBatch: expected, completedBatches: completedBatches.length,
    acceptedItems: items.filter(row => row[5] === '已验收').length,
    acceptedScenarios: scenarios.filter(row => row[3] === '已验收').length };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  try {
    const result = inspect({ ledger: fs.readFileSync(path.join(root, ledgerPath), 'utf8'),
      progress: fs.readFileSync(path.join(root, progressPath), 'utf8'),
      readEvidence: file => fs.readFileSync(path.join(root, file), 'utf8'), final: process.argv.includes('--final') });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.errors.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { inspect, ledgerPath, progressPath };
