# coding: utf-8
"""第十组资料、金额和原控制记录检查，不执行真实ERP。"""
from pathlib import Path
from decimal import Decimal
import json
import re
import subprocess

root = Path(__file__).resolve().parents[3]
docs = root/'docs'
new = docs/'10-结算与财务确认-20261107.md'
overview = docs/'测试目录.md'
decision = docs/'待确认问题决策表.md'
progress = docs/'业财报表自动化改造进度.md'
execution = docs/'集团财务报表执行清单.md'
matrix = docs/'财务要求-现有功能-缺口-修改对照表.md'
output = Path(__file__).with_name('document-checks.json')
text = new.read_text()
calc = json.loads(Path(__file__).with_name('calculation-checks.json').read_text())
checks = []


def check(name, ok, details=None):
    checks.append(dict(name=name, passed=bool(ok), details=details))
    if not ok:
        raise AssertionError(name+': '+str(details))


def head(path):
    return subprocess.check_output(['git', 'show', 'HEAD:'+str(path.relative_to(root))], cwd=root).decode()


def block(source, start, end):
    return source.split(start, 1)[1].split(end, 1)[0]


def tables(source):
    groups = []
    active = None
    for line in source.splitlines():
        if line.startswith('|'):
            if active is None:
                active = []
                groups.append(active)
            active.append([v.strip() for v in line.split('|')[1:-1]])
        else:
            active = None
    for g in groups:
        assert all(len(r) == len(g[0]) for r in g), g
    return groups


local = [target.split('#')[0] for target in re.findall(r'\]\(([^)]+)\)', text)
         if not target.startswith(('https://', 'http://', '#'))]
missing = [v for v in local if not (new.parent/v).exists()
           and (new.parent/v).resolve() != output.resolve()]
check('本组相对引用有效（检查结果为本程序输出）', not missing, dict(count=len(local), missing=missing))
paths = sorted(set(re.findall(r'`((?:shared|merchant|docs)/[^`]+)`', text)))
check('正文定位的源码与复算程序存在', all((root/v).is_file() for v in paths), paths)
counts = {p.name: len(tables(p.read_text())) for p in [new, overview, decision]}
check('新稿和范围决策表列数一致', True, counts)
ids = re.findall(r'^### 结(\d{2})：', text, re.M)
check('二十二组场景编号完整唯一', ids == [f'{i:02}' for i in range(1, 23)], ids)
bus, balances = tables(block(text, '### 结01：', '### 结02：'))
values = [[Decimal(c.replace(',', '')) for c in a[1:]+b[1:]] for a, b in zip(bus[2:], balances[2:])]
expected = [[Decimal(v) for v in row['values']] for row in calc['continuous_stages']]
names = [row[0] for row in bus[2:]]
check('二十七节点两表十列金额及序号与独立复算一致', values == expected
      and len(bus[2:]) == len(balances[2:]) == 27
      and names == [row['name'] for row in calc['continuous_stages']]
      and [row[0] for row in balances[2:]] == [f'{i:02}' for i in range(1, 28)], len(values))
period_table = tables(block(text, '## 三、', '## 四、'))[0]
period_values = [[Decimal(c.replace(',', '')) for c in row[1:]] for row in period_table[2:]]
check('两期发生额与累计表逐项对应底稿', period_values == [[Decimal(v) for v in row] for row in calc['period_amounts']])
check('二十个金额场景有复算，权限和交接不凑金额',
      set(c['case'] for c in calc['checks']) == {'结'+f'{i:02}' for i in list(range(1, 20))+[21]}
      and '结20和结22主要核权限、并发及证据' in text)
check('计算完整且未冒充政策税票凭证或真实ERP', calc['count'] == 116 and len(calc['checks']) == 116
      and all(c['passed'] for c in calc['checks']) and not calc['real_erp_executed']
      and not calc['formal_policies_approved'] and not calc['tax_and_formal_voucher_mapping_complete']
      and not calc['actual_payment_concurrency_approval_vouchers_tested'], calc['count'])
for marker in ['execution-items', 'execution-scenarios']:
    start, end = '<!-- '+marker+':start -->', '<!-- '+marker+':end -->'
    check('原'+marker+'表与HEAD逐字一致',
          block(execution.read_text(), start, end) == block(head(execution), start, end))
old_policy = head(decision).split('## 五、拍板记录', 1)[1]
new_policy = block(decision.read_text(), '## 五、拍板记录', '## 六、参团游真实ERP验收补充问题')
check('原拍板记录未被本组参数批准或修改', old_policy.rstrip() == new_policy.rstrip())
pending = [line for line in decision.read_text().splitlines() if line.startswith('| 参验-12 |')]
check('参验12唯一且正式规则仍待确认', len(pending) == 1
      and '正式规则仍待确认' in pending[0] and new.name in pending[0])
current = block(progress.read_text(), '## 三、当前步骤', '**前序记录：第九组')
next_step = progress.read_text().split('**2026-11-07参团游真实ERP的AI业务验收筹备唯一下一步：**', 1)[1].split('\n', 1)[0]
check('当前步骤和唯一下一步衔接第十到第十一组', '第十组“结算与财务确认”' in current
      and '第十一组“税票与凭证”' in next_step and '第十一组“税票与凭证”' in overview.read_text())
check('原报表执行批次字段仍唯一', progress.read_text().count('- 报表执行批次：已收尾') == 1)
rows = [line for line in matrix.read_text().split('## 2026-10-28', 1)[0].splitlines() if line.startswith('| 验筹')]
check('当前对照十七行六列', len(rows) == 17 and all(len(row.split('|'))-2 == 6 for row in rows), len(rows))
check('未执行边界及原检查失败说明明确', '未执行真实ERP、支付、并发、审批或凭证测试' in text
      and '原Node.js检查因缺少运行程序未成功' in text)
check('旧审计与当前代码变化有区分', '结论已过时' in text and '确认记录模型已存在' in text
      and '早期无回团／确认模型' in matrix.read_text())
check('正常余额及差额不重记核心边界完整', '客户未收＋供应商应返－客户应退－供应商未付' in text
      and '不能再加整笔27,000' in text and 'B仍欠10,000' in text
      and '不跟着按钮自动全额搬月' in text)
check('税务未完成、时段履约和年末更正限制清楚', '不把未拆税确认范围当正式财务损益' in text
      and '不能按系统实际结果反选政策' in text and '财务报告批准报出前' in text
      and '均匀进度合理' in text and '不能把业务应收表直接复制成会计应收' in text)
check('本步文档与脚本无行尾空白或未填占位', '@@BUSINESS@@' not in text and '@@BALANCES@@' not in text
      and all(line == line.rstrip() for p in [new, Path(__file__), Path(__file__).with_name('check_examples.py')]
              for line in p.read_text().splitlines()))
result = dict(status='passed', count=len(checks), real_erp_executed=False,
              original_node_check_passed=False, checks=checks)
output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(f'{len(checks)} 项文档检查通过；原财务检查及真实ERP未通过本程序执行。')
