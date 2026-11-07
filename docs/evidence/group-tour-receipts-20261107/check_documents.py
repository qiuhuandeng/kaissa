# coding: utf-8
"""核对第五组引用、表格、两条连续资金样板和原控制记录；不执行 ERP。"""
from pathlib import Path
from decimal import Decimal
import json
import re
import subprocess

root = Path(__file__).resolve().parents[3]
docs = root / 'docs'
new = docs / '05-收款与预存-20261107.md'
overview = docs / '测试目录.md'
decision = docs / '待确认问题决策表.md'
progress = docs / '业财报表自动化改造进度.md'
execution = docs / '集团财务报表执行清单.md'
matrix = docs / '财务要求-现有功能-缺口-修改对照表.md'
output = Path(__file__).with_name('document-checks.json')
text = new.read_text()
calc = json.loads(Path(__file__).with_name('calculation-checks.json').read_text())
checks = []


def check(name, ok, details=None):
    checks.append(dict(name=name, passed=bool(ok), details=details))
    if not ok:
        raise AssertionError(name + ': ' + str(details))


def head(path):
    return subprocess.check_output(['git', 'show', 'HEAD:' + str(path.relative_to(root))], cwd=root).decode()


def block(source, start, end):
    return source.split(start, 1)[1].split(end, 1)[0]


local = [target.split('#')[0] for target in re.findall(r'\]\(([^)]+)\)', text)
         if not target.startswith(('https://', 'http://', '#'))]
missing = [v for v in local if not (new.parent / v).exists()
           and (new.parent / v).resolve() != output.resolve()]
check('本组相对引用有效（检查结果为本程序输出）', not missing, dict(count=len(local), missing=missing))
code_paths = sorted(set(re.findall(r'`((?:shared|merchant|docs)/[^`]+)`', text)))
check('正文定位的源码与复算程序存在', all((root / p).is_file() for p in code_paths), code_paths)


def table_check(path):
    count, width = 0, None
    for line in path.read_text().splitlines():
        if line.startswith('|'):
            columns = len(line.split('|')) - 2
            if width is None:
                count += 1
                width = columns
            assert width == columns, (path.name, line)
        else:
            width = None
    return count


tables = {p.name: table_check(p) for p in [new, overview, decision]}
check('新稿和范围决策表列数一致', True, tables)
ids = re.findall(r'^### 款(\d{2})：', text, re.M)
check('十六组场景编号完整唯一', ids == [f'{i:02}' for i in range(1, 17)], ids)
for name, next_name, width, key, count in [
    ('款01', '款02', 7, 'customer_stages', 14),
    ('款07', '款08', 4, 'store_stages', 11),
]:
    rows = [line for line in block(text, '### ' + name + '：', '### ' + next_name + '：').splitlines()
            if line.startswith('|')][2:]
    values = [[Decimal(c.strip().replace(',', '')) for c in row.split('|')[2:2+width]] for row in rows]
    expected = [[Decimal(v) for v in row['values']] for row in calc[key]]
    check(name + '连续节点逐列金额与独立计算对应', values == expected and len(rows) == count, len(rows))
check('算术证据完整且不冒充ERP执行',
      calc['count'] == 88 and len(calc['checks']) == 88 and all(c['passed'] for c in calc['checks'])
      and not calc['real_erp_executed'] and not calc['formal_policies_approved']
      and not calc['actual_payment_concurrency_approval_vouchers_tested'], calc['count'])
for marker in ['execution-items', 'execution-scenarios']:
    start, end = '<!-- '+marker+':start -->', '<!-- '+marker+':end -->'
    check('原'+marker+'表与HEAD逐字一致',
          block(execution.read_text(), start, end) == block(head(execution), start, end))
old_policy = head(decision).split('## 五、拍板记录', 1)[1]
new_policy = block(decision.read_text(), '## 五、拍板记录', '## 六、参团游真实ERP验收补充问题')
check('原拍板记录未被新测试参数批准或修改', old_policy.rstrip() == new_policy.rstrip())
pending_row = [line for line in decision.read_text().splitlines() if line.startswith('| 参验-07 |')]
check('新增参验07唯一且仍待确认', len(pending_row) == 1
      and '正式规则仍待确认' in pending_row[0] and new.name in pending_row[0])
current_step = block(progress.read_text(), '## 三、当前步骤', '**前序记录：第四组')
next_step = progress.read_text().split('**2026-11-07参团游真实ERP的AI业务验收筹备唯一下一步：**', 1)[1].split('\n', 1)[0]
check('当前步骤与唯一下一步衔接第五到第六组', '第五组“收款与预存”' in current_step
      and '第六组“售后与退款”' in next_step and '第六组“售后与退款”' in overview.read_text())
check('原报表执行批次字段仍唯一', progress.read_text().count('- 报表执行批次：已收尾') == 1)
current_rows = [line for line in matrix.read_text().split('## 2026-10-28', 1)[0].splitlines()
                if line.startswith('| 验筹')]
check('当前对照十二行六列', len(current_rows) == 12
      and all(len(row.split('|')) - 2 == 6 for row in current_rows), len(current_rows))
check('边界说明含真实未执行与原检查未成功', '未执行真实ERP、真实资金或并发测试' in text
      and '原Node.js检查因缺少运行程序未成功' in text)
check('沿当前预存页后续补回事实区分原型与实款',
      '9月15日又在原财务预存页补' in text and '退回”不能让真实余额消失' in text
      and '不把泛称审批当跨公司余额互用授权' in text)
new_files = [new, Path(__file__), Path(__file__).with_name('check_examples.py')]
check('本步新文档和脚本无行尾空白',
      all(line == line.rstrip() for p in new_files for line in p.read_text().splitlines()))
result = dict(status='passed', count=len(checks), real_erp_executed=False,
              original_node_check_passed=False, checks=checks)
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(f'{len(checks)} 项文档检查通过；原财务检查及真实 ERP 验收未通过本程序执行。')
