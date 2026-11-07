# coding: utf-8
"""第九组资料、独立金额和原决策记录检查；不是ERP自动化执行器。"""
from pathlib import Path
from decimal import Decimal
import json
import re
import subprocess

root = Path(__file__).resolve().parents[3]
docs = root/'docs'
new = docs/'09-外币与精度-20261107.md'
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


local = [target.split('#')[0] for target in re.findall(r'\]\(([^)]+)\)', text)
         if not target.startswith(('https://', 'http://', '#'))]
missing = [v for v in local if not (new.parent/v).exists()
           and (new.parent/v).resolve() != output.resolve()]
check('本组相对引用有效（检查结果为本程序输出）', not missing, dict(count=len(local), missing=missing))
code_paths = sorted(set(re.findall(r'`((?:shared|merchant|docs)/[^`]+)`', text)))
check('正文定位的源码与复算程序存在', all((root/p).is_file() for p in code_paths), code_paths)


def table_check(path):
    count, width = 0, None
    for line in path.read_text().splitlines():
        if line.startswith('|'):
            columns = len(line.split('|'))-2
            if width is None:
                count += 1
                width = columns
            assert width == columns, (path.name, line)
        else:
            width = None
    return count


tables = {p.name: table_check(p) for p in [new, overview, decision]}
check('新稿和范围决策表列数一致', True, tables)
ids = re.findall(r'^### 汇(\d{2})：', text, re.M)
check('二十组场景编号完整唯一', ids == [f'{i:02}' for i in range(1, 21)], ids)
rows = [line for line in block(text, '### 汇01：', '### 汇02：').splitlines() if line.startswith('|')][2:]
values = [[Decimal(c.strip().replace(',', '')) for c in row.split('|')[2:10]] for row in rows]
expected = [[Decimal(v) for v in row['values']] for row in calc['continuous_stages']]
names = [row.split('|')[1].strip() for row in rows]
check('汇01二十节点八列金额及名称与独立复算一致',
      values == expected and names == [row['name'] for row in calc['continuous_stages']] and len(rows) == 20, len(rows))
check('十九个金额场景有复算，岗位场景不凑金额',
      set(c['case'] for c in calc['checks']) == {'汇'+f'{i:02}' for i in range(1, 20)}
      and '汇20主要核岗位与证据' in text)
check('计算结果完整且不冒充真实ERP', calc['count'] == 118 and len(calc['checks']) == 118
      and all(c['passed'] for c in calc['checks']) and not calc['real_erp_executed']
      and not calc['formal_policies_approved']
      and not calc['actual_payment_concurrency_approval_vouchers_tested'], calc['count'])
for marker in ['execution-items', 'execution-scenarios']:
    start, end = '<!-- '+marker+':start -->', '<!-- '+marker+':end -->'
    check('原'+marker+'表与HEAD逐字一致',
          block(execution.read_text(), start, end) == block(head(execution), start, end))
old_policy = head(decision).split('## 五、拍板记录', 1)[1]
new_policy = block(decision.read_text(), '## 五、拍板记录', '## 六、参团游真实ERP验收补充问题')
check('原拍板记录未被本组参数批准或修改', old_policy.rstrip() == new_policy.rstrip())
pending = [line for line in decision.read_text().splitlines() if line.startswith('| 参验-11 |')]
check('参验11唯一且正式规则仍待确认', len(pending) == 1
      and '正式规则仍待确认' in pending[0] and new.name in pending[0])
current = block(progress.read_text(), '## 三、当前步骤', '**前序记录：第八组')
next_step = progress.read_text().split('**2026-11-07参团游真实ERP的AI业务验收筹备唯一下一步：**', 1)[1].split('\n', 1)[0]
check('当前步骤与唯一下一步衔接第九到第十组', '第九组“外币与精度”' in current
      and '第十组“结算与财务确认”' in next_step and '第十组“结算与财务确认”' in overview.read_text())
check('原报表执行批次字段仍唯一', progress.read_text().count('- 报表执行批次：已收尾') == 1)
current_rows = [line for line in matrix.read_text().split('## 2026-10-28', 1)[0].splitlines()
                if line.startswith('| 验筹')]
check('当前对照十六行六列', len(current_rows) == 16
      and all(len(row.split('|'))-2 == 6 for row in current_rows), len(current_rows))
check('未执行边界及原检查失败说明明确', '未执行真实ERP、支付、并发、审批或凭证测试' in text
      and '原Node.js检查因缺少运行程序未成功' in text)
check('准确标记原型和金融来源证据范围', '示例标签不能证明接入' in text
      and '准则原文直读超时' in text and '实施问答已直接读取' in text
      and '系统设置' in text and '不擅自把NC验收提前' in text)
check('币种、现金、预款及汇差核心边界完整', '期末不得把两笔均重估' in text
      and '银行实际流出EUR1,000' in text and '会多计2,400' in text
      and '已确认成本＋累计汇损＋累计手续费＝累计银行支出＋应付账面' in text
      and '不凭净差200猜每期分录' in text)
check('测试参数不替代政策、税务及实际凭证', '不能按系统实际结果反选政策' in text
      and '不能为了贴合本例强设税额为0' in text
      and '原型超级管理员规则不是生产规则' in text)
check('本步文档与脚本无行尾空白或未填占位', '@@STAGES@@' not in text
      and all(line == line.rstrip() for p in [new, Path(__file__), Path(__file__).with_name('check_examples.py')]
              for line in p.read_text().splitlines()))
result = dict(status='passed', count=len(checks), real_erp_executed=False,
              original_node_check_passed=False, checks=checks)
output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(f'{len(checks)} 项文档检查通过；原财务检查及真实ERP未通过本程序执行。')
