# coding: utf-8
"""权限/报表验收的独立金额与单据集合预期；不连接ERP，不模拟权限执行通过。"""
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import json

D = Decimal
checks = []


def check(case, name, actual, expected):
    if isinstance(actual, set):
        actual, expected = sorted(actual), sorted(expected)
    ok = actual == expected
    checks.append(dict(case=case, name=name, actual=actual, expected=expected, passed=ok))
    assert ok, (case, name, actual, expected)


def money(value):
    return D(str(value)).quantize(D('.01'), rounding=ROUND_HALF_UP)


# 金额都是业务价款；并非整组财务收入。组织是单据形成时的归属。
# 晚到记录是有依据的补录分支，真实执行必须使用环境允许的业务办理方式。
raw = [
    ('A1','A','D1','S1','U1','自营','国内','2026-09-28','2026-10-28','2026-09-28','80000'),
    ('A2','A','D1','S2','U2','自营','国内','2026-10-02','2026-10-28','2026-10-02','80000'),
    ('A3','A','D2','CALL','U3','外采','出境','2026-10-30','2026-11-10','2026-10-30','60000'),
    ('B1','B','D3','S3','U4','外采','国内','2026-10-02','2026-10-29','2026-10-02','80000'),
    ('C1','C','D4','S4','U5','自营','出境','2026-10-03','2026-11-10','2026-10-03','40000'),
    ('A4','A','D1','F','U6','外采','国内','2026-10-03','2026-10-30','2026-10-03','30000'),
    ('A5','A','D1','S1','U1','自营','国内',None,None,'2026-10-31','5000'),
    ('A6','A','D1','S2','U2','自营','国内','2026-10-03',None,'2026-10-03','20000'),
    ('A7','A','D2','CALL','U3','外采','国内','2026-10-31','2026-10-31','2026-11-02','12000'),
]
keys = ['id','company','department','store','salesperson','supply','region',
        'confirmed','returned','recorded','original_amount']
orders = [dict(zip(keys,row)) for row in raw]
for row in orders:
    row['original_amount'] = D(row['original_amount'])
events = [dict(order='A6', effective='2026-10-15', recorded='2026-10-15', amount=D('-20000'), kind='取消'),
          dict(order='A1', effective='2026-11-05', recorded='2026-11-05', amount=D('-2000'), kind='让价')]


def rows_at(as_of, cutoff):
    result = []
    for row in orders:
        if not row['confirmed'] or row['confirmed'] > as_of or row['recorded'] > cutoff:
            continue
        amount = row['original_amount'] + sum((e['amount'] for e in events if e['order']==row['id']
                    and e['effective']<=as_of and e['recorded']<=cutoff), D('0'))
        returned = row['returned'] if row['returned'] and row['returned']<=as_of else None
        result.append(dict(row, amount=amount, returned=returned))
    return result


def total(rows):
    return sum((r['amount'] for r in rows), D('0'))


def ids(rows):
    # 这里只生成非零有效价款的对账集合；已取消原单仍保留在明细和历史中。
    return {r['id'] for r in rows if r['amount'] != 0}


october = rows_at('2026-10-31', '2026-10-31')
late_known = rows_at('2026-10-31', '2026-11-10')
current = rows_at('2026-11-10', '2026-11-10')
scope_specs = [
    ('集团', {}, {'A1','A2','A3','A4','B1','C1'}, '370000', {'A1','A2','A3','A4','A7','B1','C1'}, '380000'),
    ('A公司', {'company':'A'}, {'A1','A2','A3','A4'}, '250000', {'A1','A2','A3','A4','A7'}, '260000'),
    ('B公司', {'company':'B'}, {'B1'}, '80000', {'B1'}, '80000'),
    ('C公司', {'company':'C'}, {'C1'}, '40000', {'C1'}, '40000'),
    ('A产品一部', {'company':'A','department':'D1'}, {'A1','A2','A4'}, '190000', {'A1','A2','A4'}, '188000'),
    ('A门店S1', {'company':'A','store':'S1'}, {'A1'}, '80000', {'A1'}, '78000'),
    ('A门店S2', {'company':'A','store':'S2'}, {'A2'}, '80000', {'A2'}, '80000'),
    ('A呼叫渠道', {'company':'A','store':'CALL'}, {'A3'}, '60000', {'A3','A7'}, '72000'),
    ('加盟F受限交易', {'company':'A','store':'F'}, {'A4'}, '30000', {'A4'}, '30000'),
    ('A本人U1历史单', {'company':'A','salesperson':'U1'}, {'A1'}, '80000', {'A1'}, '78000'),
    ('无业务授权', {'company':'NONE'}, set(), '0', set(), '0'),
]
scope_outputs = []
for name, conditions, old_ids, old_amount, new_ids, new_amount in scope_specs:
    def select(rows):
        return [r for r in rows if all(r[k]==v for k,v in conditions.items())]
    old, new = select(october), select(current)
    check('权01',name+'原截止单据集合', ids(old), old_ids)
    check('权01',name+'原截止金额', total(old), D(old_amount))
    check('权01',name+'当前单据集合', ids(new), new_ids)
    check('权01',name+'当前金额', total(new), D(new_amount))
    scope_outputs.append(dict(name=name, conditions=conditions, october_ids=sorted(ids(old)),
                              october=total(old), current_ids=sorted(ids(new)), current=total(new)))

check('权01','原截止A+B+C等于集团',sum((r['october'] for r in scope_outputs[1:4]),D('0')),D('370000'))
check('权01','当前A+B+C等于集团',sum((r['current'] for r in scope_outputs[1:4]),D('0')),D('380000'))
check('权02','错公司同额单总数仍相等',total([r for r in current if r['id']=='A2']),total([r for r in current if r['id']=='B1']))
check('权02','金额相等不表示单据集合相同',ids([r for r in current if r['id']=='A2'])==ids([r for r in current if r['id']=='B1']),False)
check('权02','重复返回同一单导致重复金额',total([r for r in current if r['id']=='A2']*2),D('160000'))
check('权02','集团角色不是A公司查询总额',total(current)==total([r for r in current if r['company']=='A']),False)
check('权08','历史U1订单仍属S1',next(r for r in current if r['id']=='A1')['store'],'S1')
check('权08','若批准另列重述S2金额',sum((r['amount'] for r in current if r['id'] in ['A1','A2']),D('0')),D('158000'))
check('权08','重述不能改变集团总额',total(current),D('380000'))

check('权16','订单日前九月原截止',total([r for r in october if r['confirmed']<'2026-10-01']),D('80000'))
check('权16','订单日十月原截止',total([r for r in october if r['confirmed']>='2026-10-01']),D('290000'))
check('权16','实际回团十月原截止',total([r for r in october if r['returned'] and r['returned']<='2026-10-31']),D('270000'))
check('权16','原截止未回团价款',total([r for r in october if r['returned'] is None]),D('100000'))
check('权16','已取消单金额为零',next(r for r in october if r['id']=='A6')['amount'],D('0'))
check('权16','草稿不进入确认价款','A5' in ids(october),False)
check('权17','相同十月业务日后补截止',total(late_known),D('382000'))
check('权17','当前余额含十一月让价',total(current),D('380000'))
check('权17','后补资料与原发布差额',total(late_known)-total(october),D('12000'))
check('权17','当前与十月发布净差',total(current)-total(october),D('10000'))
check('权17','十一月让价不倒进十月业务截止',next(r for r in late_known if r['id']=='A1')['amount'],D('80000'))
check('权17','当前十月回团集合价款',total([r for r in current if r['returned'] and r['returned']<='2026-10-31']),D('280000'))

# 第十/十一组相同160000主线的条件价税桥接；不是全体权限样本的总损益。
tax = lambda amount: money(D(amount)*D('6')/D('106'))
oct_rev = D('160000')-tax('80000')*2
oct_deduct = tax('40000')+tax('30000')+tax('10000')
oct_cost = D('115000')-oct_deduct
nov_output = -tax('2000')
nov_deduct = tax('10000')+tax('27000')-tax('1000')
nov_rev = D('-2000')-nov_output
nov_cost = D('1000')-nov_deduct
periods = [
    ['10月',D('160000'),D('115000'),oct_rev,oct_cost,oct_rev-oct_cost,tax('80000')*2-oct_deduct],
    ['11月变动',D('-2000'),D('1000'),nov_rev,nov_cost,nov_rev-nov_cost,nov_output-nov_deduct],
    ['累计',D('158000'),D('116000'),oct_rev+nov_rev,oct_cost+nov_cost,oct_rev+nov_rev-oct_cost-nov_cost,
     tax('80000')*2-oct_deduct+nov_output-nov_deduct],
]
expected = [
    ['160000','115000','150943.40','110471.70','40471.70','4528.30'],
    ['-2000','1000','-1886.79','-1037.74','-849.05','-2150.95'],
    ['158000','116000','149056.61','109433.96','39622.65','2377.35'],
]
for row, want in zip(periods, expected):
    for label, actual, value in zip(['收费','成本价款','财务收入','财务成本','毛利','本例税额'],row[1:],want):
        check('权18',row[0]+label,actual,D(value))
check('权18','最终现金不是财务毛利',D('42000')-periods[2][5],D('2377.35'))
check('权18','最终主团两订单与当前业务价款一致',sum((r['amount'] for r in current if r['id'] in ['A1','A2']),D('0')),D('158000'))
check('权18','红票保留逐票税额尾差',tax('158000')-(tax('80000')*2-tax('2000')),D('.01'))

# 每一项独立算例必须保留源头标签，不合并为同一个团的总账。
check('权19','集团转售对外价款',D('100000')+D('85000')-D('85000'),D('100000'))
check('权19','集团转售贡献',D('15000')+D('15000'),D('30000'))
check('权19','代理两公司贡献',D('20000')+D('10000'),D('30000'))
check('权19','代收待交付',D('100000')-D('10000')-D('60000'),D('30000'))
check('权20','共同资源成本含公共损失',D('92950')+D('69600')+D('5850'),D('168400'))
check('权20','共同资源集团业务差额',D('160000')+D('120000')-D('168400'),D('111600'))
check('权20','毛利与渠道贡献区别',D('49100')-D('35000')-D('2455'),D('11645'))
check('权20','外币本金费用汇差桥接',D('240000')-D('206000')-D('3350')-D('557'),D('30093'))
check('权21','客户余额桥接',D('100000')-D('800'),D('96700')+D('2500'))
check('权21','门店余额桥接',D('85000')-D('5500'),D('44500')+D('30000')+D('5000'))
check('权21','不同客户应收应退净额虽为8000',D('10000')-D('2000'),D('8000'))
check('权21','保留双方总责任12000',D('10000')+D('2000'),D('12000'))
check('权21','付款毛发生额并非有效抵清额',D('111000')-D('9000'),D('102000'))

# 事件去重在独立预期账中使用事件编号；原款业务号不能代替事件号。
receipts=[('R1','P1',D('6000')),('R2','P1',D('4000')),('R2','P1',D('4000'))]
unique={r[0]:r[2] for r in receipts}
check('权22','两次真实收款加重复回传应为10000',sum(unique.values(),D('0')),D('10000'))
check('权22','不去重会虚增4000',sum((r[2] for r in receipts),D('0'))-sum(unique.values(),D('0')),D('4000'))
check('权22','按同一原款误去重会漏掉一次实际收款',len({r[1] for r in receipts}),1)
check('权22','正确不同事件数为2',len(unique),2)
check('权23','同额漏一单加一错单不能靠总额检出',D('80000')-D('80000'),D('0'))
check('权23','负毛利例按收入分母',money((D('10000')-D('12000'))/D('10000')*100),D('-20.00'))
check('权23','未设预算与预算为零不同',None == D('0'),False)
check('权23','毛利率不能相加取简单平均',money((D('2000')+D('9000'))/(D('10000')+D('90000'))*100),D('11.00'))
check('权23','多种缺字段覆盖率按记录去重',len({'A1','A2'} | {'A2','A3'}),3)
check('权24','当前订单按单据分页求和',total(current[:3])+total(current[3:6])+total(current[6:]),D('380000'))
check('权24','当前门店子集合不含外公司',ids([r for r in current if r['company']=='A' and r['store']=='S2']),{'A2'})
result = dict(status='passed', count=len(checks), checks=checks, orders=orders, changes=events,
              scope_expectations=scope_outputs, financial_periods=periods,
              real_erp_executed=False, real_authorization_tested=False, formal_policies_approved=False,
              real_environment_mapping_complete=False, original_node_check_passed=False)
Path(__file__).with_name('calculation-checks.json').write_text(
    json.dumps(result,ensure_ascii=False,indent=2,default=lambda v:format(v,'f') if isinstance(v,D) else str(v))+'\n')
print(f'{len(checks)} 项独立金额与集合预期复核通过；真实ERP权限与报表未执行。')
