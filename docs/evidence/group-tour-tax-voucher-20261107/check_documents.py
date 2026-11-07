# coding: utf-8
"""第十一组文档金额、证据引用及原控制记录保护；不运行真实ERP。"""
from pathlib import Path
from decimal import Decimal
import json
import re
import subprocess

root = Path(__file__).resolve().parents[3]
docs = root/'docs'
new = docs/'11-税票与凭证-20261107.md'
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
    assert ok, (name, details)


def head(path):
    return subprocess.check_output(['git', 'show', 'HEAD:'+str(path.relative_to(root))], cwd=root).decode()


def block(source, start, end):
    return source.split(start, 1)[1].split(end, 1)[0]


def tables(source):
    groups, active = [], None
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


def amounts(rows):
    return [[Decimal(c.replace(',', '')) for c in row[1:]] for row in rows]


links = re.findall(r'\]\(([^)]+)\)', text)
local = [v.split('#')[0] for v in links if not v.startswith(('https://','http://','#'))]
missing = [v for v in local if not (new.parent/v).exists() and (new.parent/v).resolve() != output.resolve()]
check('本组相对引用存在（本程序结果文件除外）', not missing, dict(count=len(local), missing=missing))
paths = sorted(set(re.findall(r'`((?:shared|merchant|docs)/[^`]+)`', text)))
check('业务源码及独立程序定位有效', all((root/v).is_file() for v in paths), paths)
counts = {p.name:len(tables(p.read_text())) for p in [new,overview,decision]}
check('本组及范围决策文档表格列数一致', True, counts)
ids = re.findall(r'^### 税(\d{2})：',text,re.M)
check('二十六场景完整唯一', ids == [f'{i:02}' for i in range(1,27)], ids)
main_tables = tables(block(text,'### 税01：','### 税02：'))
check('主样板含业务税票、各方余额、会计分录三表', len(main_tables)==3)
business, balances, voucher_text = main_tables
check('二十二节点八列业务及税票金额与独立底稿一致', len(business[2:])==22
      and amounts(business[2:])==[[Decimal(v) for v in r['values']] for r in calc['continuous_stages']]
      and [r[0] for r in business[2:]]==[r['name'] for r in calc['continuous_stages']])
check('二十二节点八列余额及各方责任与底稿一致', len(balances[2:])==22
      and amounts(balances[2:])==[[Decimal(v) for v in r['balances']] for r in calc['continuous_stages']]
      and [r[0] for r in balances[2:]]==[f'{i:02}' for i in range(1,23)])
bridge = tables(block(text,'### 税18：','### 税19：'))[0]
check('两期及累计价税桥接八列逐项一致', amounts(bridge[2:])==[[Decimal(v) for v in row] for row in calc['bridge_periods']])
check('24个金额场景均有复算且权限接入不凑算术',
      set(c['case'] for c in calc['checks'])=={'税'+f'{i:02}' for i in range(1,25)}
      and '税25和税26主要核权限' in text)
check('140项复算和17组分录预期完整', calc['count']==len(calc['checks'])==140
      and all(c['passed'] for c in calc['checks']) and len(calc['expected_journals'])==17)
false_flags=['real_erp_executed','formal_policies_approved','tax_and_formal_voucher_mapping_complete',
             'actual_invoice_payment_concurrency_approval_vouchers_tested']
check('未将条件样板记成正式政策映射或真实执行', all(calc.get(k) is False for k in false_flags), false_flags)
check('17组分录各自平衡且本例责任一致', all(sum(Decimal(v) for v in j['debit'].values())==sum(Decimal(v) for v in j['credit'].values())
      and j['company']=='测试甲' and j['book']=='测试甲账簿' and j['currency']=='CNY' for j in calc['expected_journals']))
for marker in ['execution-items','execution-scenarios']:
    a,b='<!-- '+marker+':start -->','<!-- '+marker+':end -->'
    check('原'+marker+'与HEAD逐字一致',block(execution.read_text(),a,b)==block(head(execution),a,b))
check('原拍板记录未因算例被改写', head(decision).split('## 五、拍板记录',1)[1].rstrip()
      ==block(decision.read_text(),'## 五、拍板记录','## 六、参团游真实ERP验收补充问题').rstrip())
pending=[line for line in decision.read_text().splitlines() if line.startswith('| 参验-13 |')]
check('参验13唯一且正式规则待确认',len(pending)==1 and '正式规则仍待确认' in pending[0] and new.name in pending[0])
current=block(progress.read_text(),'## 三、当前步骤','**前序记录：第十组')
next_step=progress.read_text().split('**2026-11-07参团游真实ERP的AI业务验收筹备唯一下一步：**',1)[1].split('\n',1)[0]
check('当前第十一组和唯一下一步第十二组一致','第十一组“税票与凭证”' in current
      and '第十二组“权限、报表与历史”' in next_step and '第十二组“权限、报表与历史”' in overview.read_text())
check('原财务批次字段唯一',progress.read_text().count('- 报表执行批次：已收尾')==1)
rows=[line for line in matrix.read_text().split('## 2026-10-28',1)[0].splitlines() if line.startswith('| 验筹')]
check('当前对照18行6列',len(rows)==18 and all(len(row.split('|'))-2==6 for row in rows),len(rows))
urls=set(v for v in links if v.startswith('https://'))
check('现行法规来源齐备且仅采用官方站点',len(urls)>=8 and all('.chinatax.gov.cn/' in u or '.mof.gov.cn/' in u for u in urls),sorted(urls))
check('现金毛利税额及逐票尾差不混称',all(v in text for v in ['净现金38,160＝毛利36,000','税额2,377.35','8,943.39','0.01','不是进项税','免税与零税率']))
check('源头真实办理及外部回执未测边界明确',all(v in text for v in ['不得直接写数据库补最终财务余额','不能按系统实际结果反选政策',
      '未执行真实ERP、开票、支付、并发、审批或凭证测试','原Node.js检查因缺少运行程序未成功','外部开票／验真未测','NC按用户确认分期']))
check('本组无占位符或行尾空白','@@' not in text and all(line==line.rstrip()
      for p in [new,Path(__file__),Path(__file__).with_name('check_examples.py')] for line in p.read_text().splitlines()))
result=dict(status='passed',count=len(checks),real_erp_executed=False,original_node_check_passed=False,checks=checks)
output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'{len(checks)} 项文档检查通过；未执行原Node检查或真实ERP。')
