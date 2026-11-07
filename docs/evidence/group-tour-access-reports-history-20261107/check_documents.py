# coding: utf-8
"""本组金额/集合、用户要求的改名删节、引用与原财务记录保护检查。"""
from pathlib import Path
from decimal import Decimal
import ast
import hashlib
import json
import re
import subprocess

root = Path(__file__).resolve().parents[3]
docs = root/'docs'
new = docs/'12-权限报表与历史-20261107.md'
overview = docs/'测试目录.md'
execution = docs/'集团财务报表执行清单.md'
progress = docs/'业财报表自动化改造进度.md'
decision = docs/'待确认问题决策表.md'
matrix = docs/'财务要求-现有功能-缺口-修改对照表.md'
text = new.read_text()
calc = json.loads(Path(__file__).with_name('calculation-checks.json').read_text())
removal = json.loads(Path(__file__).with_name('section-removal-record.json').read_text())
checks = []


def check(name, ok, details=None):
    checks.append(dict(name=name, passed=bool(ok), details=details))
    assert ok, (name, details)


def block(t, a, b):
    return t.split(a,1)[1].split(b,1)[0]


def head(p):
    return subprocess.check_output(['git','show','HEAD:'+str(p.relative_to(root))],cwd=root).decode()


def tables(t):
    groups, active = [], None
    for line in t.splitlines():
        if line.startswith('|'):
            if active is None:
                active = []
                groups.append(active)
            active.append([v.strip() for v in line.split('|')[1:-1]])
        else:
            active = None
    for g in groups:
        assert all(len(r)==len(g[0]) for r in g),g
    return groups


def amount(v):
    return Decimal(v.replace(',',''))


paths = sorted(docs.glob('[0-9][0-9]-*-20261107.md'))
check('十二份短文件名唯一且序号完整',[p.name[:2] for p in paths]==[f'{i:02}' for i in range(1,13)])
check('旧长文件名没有恢复',not list(docs.glob('参团游真实ERP验收准备*.md')))
check('十二份正文均无第六节及之后编号',all(not re.search(r'^## [六七八九十][、.．\s]',p.read_text(),re.M) for p in paths))
check('本组及各组无末尾空标题',all(not re.search(r'^##\s*$',p.read_text(),re.M) for p in paths))
check('用户删节记录对应当前内容',removal['user_requested'] and len(removal['files'])==12
      and sum(bool(r['removed_from']) for r in removal['files'])==10
      and all(hashlib.sha256((docs/r['file']).read_bytes()).hexdigest()==r['remaining_sha256'] for r in removal['files']))
missing=[]
link_count=0
for p in paths+[overview]:
    for v in re.findall(r'\]\(([^)]+)\)',p.read_text()):
        if v.startswith(('https://','http://','#')):
            continue
        link_count+=1
        if not (p.parent/v.split('#')[0]).exists():
            missing.append([p.name,v])
check('目录及十二组所有相对文件引用存在',not missing,dict(count=link_count,missing=missing))
old_refs=[]
for p in paths+[overview,progress,decision,execution,matrix]+list(docs.glob('evidence/group-tour-*/check_documents.py')):
    if re.search(r'参团游真实ERP验收准备(?:\d{2}|-范围与规则梳理)[^\n)]*\.md',p.read_text()):
        old_refs.append(str(p.relative_to(root)))
check('正文控制文档及检查脚本无旧长文件引用',not old_refs,old_refs)
check('目录十二组均可直接访问',all(p.name in overview.read_text() for p in paths))
table_counts={p.name:len(tables(p.read_text())) for p in paths+[overview,decision]}
check('十二组目录决策表各表列数一致',True,table_counts)
source_paths=sorted(set(re.findall(r'`((?:shared|admin|merchant)/[^`]+)`',text)))
check('本组17处当前代码定位存在',len(source_paths)==17 and all((root/v).is_file() for v in source_paths),source_paths)
check('二十八场景连续唯一',re.findall(r'^### 权(\d{2})：',text,re.M)==[f'{i:02}' for i in range(1,29)])
ts=tables(text)
check('本组六张表结构完整',len(ts)==6)
source=ts[2][2:]
check('九张源订单及原价款一致',[r[0] for r in source]==[r['id'] for r in calc['orders']]
      and [amount(r[-1]) for r in source]==[Decimal(r['original_amount']) for r in calc['orders']])
scope=ts[3][2:]
check('十一种范围两个截止的逐项金额一致',len(scope)==11
      and [[amount(r[2]),amount(r[4])] for r in scope]==[[Decimal(r['october']),Decimal(r['current'])] for r in calc['scope_expectations']])
def ids(cell):
    return sorted(cell.split(',')) if cell!='空' else []
check('十一种范围两个截止的单据集合一致',[[ids(r[1]),ids(r[3])] for r in scope]
      ==[[r['october_ids'],r['current_ids']] for r in calc['scope_expectations']])
check('三期六类财务金额与独立预期一致',[[amount(v) for v in r[1:]] for r in ts[4][2:]]
      ==[[Decimal(v) for v in r[1:]] for r in calc['financial_periods']])
nav=(root/'shared/nav-merchant.js').read_text()
entries=re.findall(r'\{ title: "([^"]+)", href: "data/([^"]+)" \}',nav)
check('17个报表名称与当前导航一致',[r[0] for r in ts[5][2:]]==[r[0] for r in entries] and len(entries)==17,entries)
check('110项预期完整且纯权限未冒充算术通过',calc['count']==len(calc['checks'])==110
      and all(r['passed'] for r in calc['checks']) and not any(r['case'] in {'权25','权28'} for r in calc['checks']))
flags=['real_erp_executed','real_authorization_tested','formal_policies_approved','real_environment_mapping_complete','original_node_check_passed']
check('真实权限政策与映射未误记完成',all(calc.get(k) is False for k in flags),flags)
for marker in ['execution-items','execution-scenarios']:
    a,b='<!-- '+marker+':start -->','<!-- '+marker+':end -->'
    check('原'+marker+'与HEAD逐字一致',block(execution.read_text(),a,b)==block(head(execution),a,b))
check('原拍板记录保持不变',head(decision).split('## 五、拍板记录',1)[1].rstrip()
      ==block(decision.read_text(),'## 五、拍板记录','## 六、参团游真实ERP验收补充问题').rstrip())
pending=[v for v in decision.read_text().splitlines() if v.startswith('| 参验-14 |')]
check('参验14唯一且不批准正式规则',len(pending)==1 and '正式规则仍待确认' in pending[0] and new.name in pending[0])
current=block(progress.read_text(),'## 三、当前步骤','**前序记录：第十一组')
next_step=progress.read_text().split('**2026-11-07参团游真实ERP的AI业务验收筹备唯一下一步：**',1)[1].split('\n',1)[0]
check('当前第十二组与下一步整合一致','第十二组“权限、报表与历史”' in current and '最终AI执行文档整合' in next_step
      and '唯一下一步：整合最终AI执行文档' in overview.read_text())
check('原财务批次字段仍唯一',progress.read_text().count('- 报表执行批次：已收尾')==1)
rows=[v for v in matrix.read_text().split('## 2026-10-28',1)[0].splitlines() if v.startswith('| 验筹')]
check('总对照19行6列',len(rows)==19 and all(len(r.split('|'))-2==6 for r in rows),len(rows))
check('用户改名与删节要求均在当前记录','十二组统一采用短文件名' in current and '第六节及之后' in current)
check('新稿未把原型放开当真实权限结论',all(v in text for v in ['不能把原型全部可见判为真实ERP权限缺陷','单据集合和唯一数量',
      '10-31时A3/C1实际回团字段应为空','不能由AI改服务器时钟','不得直接写数据库补最终财务余额','不发送真实邮件或消息']))
script_paths=list(docs.glob('evidence/group-tour-*/*.py'))
for p in script_paths:
    ast.parse(p.read_text(),filename=str(p))
check('改名后的独立Python程序语法有效',True,len(script_paths))
check('本组新增文档与程序无占位或行尾空白','@@' not in text and all(line==line.rstrip()
      for p in [new,Path(__file__),Path(__file__).with_name('check_examples.py')] for line in p.read_text().splitlines()))
result=dict(status='passed',count=len(checks),real_erp_executed=False,original_node_check_passed=False,checks=checks)
Path(__file__).with_name('document-checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'{len(checks)} 项当前文档检查通过；未运行真实ERP或旧阶段状态检查。')
