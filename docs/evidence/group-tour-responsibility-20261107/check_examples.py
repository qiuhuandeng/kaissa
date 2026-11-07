"""独立复算责任稿中的假设金额；不调用ERP，不验证权限、税务或会计政策。"""
from decimal import Decimal
import json
from pathlib import Path


def money(value):
    return Decimal(str(value))


def plain(value):
    if isinstance(value, Decimal):
        return format(value, '.2f')
    if isinstance(value, dict):
        return {key: plain(item) for key, item in value.items()}
    if isinstance(value, (tuple, list)):
        return [plain(item) for item in value]
    return value


checks = []


def check(name, formula, actual, expected):
    checks.append({
        'name': name, 'basis': formula,
        'actual': plain(actual), 'expected': plain(expected),
        'passed': actual == expected,
    })


class Cash:
    """按测试资金发生登记收付；起始测试现金为0，内部划转同时记双方。"""
    def __init__(self):
        self.balances = {'A': money(0), 'B': money(0)}

    def transfer(self, source, target, amount):
        value = money(amount)
        if source in self.balances:
            self.balances[source] -= value
        if target in self.balances:
            self.balances[target] += value

    def verify(self, name, basis, a, b=0):
        check(name, basis, self.balances.copy(), {'A': money(a), 'B': money(b)})


# 基础金额独立由人数、单价和五项资源明细得出。
order_1, order_2 = money(6) * money(10000), money(4) * money(10000)
sale = order_1 + order_2
resources = sum(map(money, [28000, 16000, 18000, 5000, 3000]))
check('两单与有效余位', '6人、4人，每人10000；20减6减4',
      [order_1, order_2, sale, 20 - 6 - 4], [money(60000), money(40000), money(100000), 10])
check('两单首款尾款', '18000+42000=O01；12000+28000=O02；首款30000、尾款70000',
      [money(18000)+money(42000), money(12000)+money(28000), money(18000)+money(12000), money(42000)+money(28000)],
      [order_1, order_2, money(30000), money(70000)])
check('自营五项成本及B自营来源', '28000+16000+18000+5000+3000', resources, money(70000))
check('内部采购与佣金分别归单', '48000+32000；12000+8000',
      [money(48000)+money(32000), money(12000)+money(8000)], [money(80000), money(20000)])

# 责01自营；预付冲抵不再记第二次银行付款。
c = Cash()
c.transfer('客户', 'A', 30000)
c.transfer('A', '交通', 12000)
c.transfer('A', '地接', 8000)
c.verify('责01首款与预付', '30000-12000-8000', 10000)
c.transfer('客户', 'A', 70000)
remaining = resources - money(12000) - money(8000)
check('责01供应商尾款', '70000-12000-8000', remaining, money(50000))
c.verify('责01冲抵不改现金', '收尾款后80000；确认成本和冲抵预付无新银行收付', 80000)
c.transfer('A', '供应商', remaining)
c.verify('责01结清', '100000-70000', 30000)
check('责01待收待付预付', '客户价减已收；成本减预付冲抵减尾款；预付减已冲抵',
      [sale-money(30000)-money(70000), resources-money(20000)-remaining, money(20000)-money(20000)],
      [money(0), money(0), money(0)])

# 责02整包外采。
c = Cash()
c.transfer('客户', 'A', 30000)
c.transfer('A', 'S', 20000)
c.verify('责02首款与预付', '30000-20000', 10000)
c.transfer('客户', 'A', 70000)
remaining = money(80000) - money(20000)
check('责02采购尾款', '80000-20000', remaining, money(60000))
c.transfer('A', 'S', remaining)
c.verify('责02结清', '100000-80000', 20000)

# 责03集团采购转售。
c = Cash()
c.transfer('客户', 'A', 30000)
c.transfer('A', 'B', 20000)
c.transfer('B', 'S', 10000)
c.verify('责03首款与两段预付', 'A=30000-20000；B=20000-10000', 10000, 10000)
c.transfer('客户', 'A', 70000)
c.verify('责03收尾款', 'A增加70000；B不变', 80000, 10000)
check('责03对账后剩余欠款', '内部80000-预付20000；外部70000-预付10000',
      [money(80000)-money(20000), money(70000)-money(10000)], [money(60000), money(60000)])
c.transfer('A', 'B', 60000)
c.verify('责03内部结清但外部待付', 'A减60000；B加60000', 20000, 70000)
c.transfer('B', 'S', 60000)
c.verify('责03全部结清', 'B再付60000', 20000, 10000)
check('责03集团对外差额', 'A现金+B现金=外部实收100000-实付70000',
      sum(c.balances.values()), money(30000))

# 责04B直接收款的代销。
c = Cash()
c.transfer('客户', 'B', 30000)
c.transfer('B', 'S', 10000)
c.transfer('客户', 'B', 70000)
c.verify('责04收款与预付', 'B=30000-10000+70000；A未收款', 0, 90000)
c.transfer('B', 'S', 60000)
c.verify('责04采购已结佣金未付', 'B减60000', 0, 30000)
c.transfer('B', 'A', 20000)
c.verify('责04全部结清', 'B付A20000', 20000, 10000)

# 责04A代收：全额转付与有批准依据的净额转付为独立分支。
for route in ('全额', '净额'):
    c = Cash()
    c.transfer('客户', 'A', 100000)
    collection, commission = money(100000), money(20000)
    c.verify(f'代收{route}初始', 'A收到游客款100000；B银行尚未到账', 100000, 0)
    if route == '全额':
        c.transfer('A', 'B', collection)
        collection -= money(100000)
        c.verify('全额转付后', 'A向B转100000', 0, 100000)
        check('全额转付不清佣金', '代收余额0；佣金仍20000',
              [collection, commission], [money(0), money(20000)])
        c.transfer('B', 'A', commission)
        commission -= money(20000)
    else:
        collection -= money(20000)
        commission -= money(20000)
        c.verify('净额抵扣不改现金', '有依据抵扣20000，无银行收付', 100000, 0)
        check('净额抵扣后的两项责任', '100000-20000；20000-20000',
              [collection, commission], [money(80000), money(0)])
        c.transfer('A', 'B', collection)
        collection -= money(80000)
    c.transfer('B', 'S', 70000)
    c.verify(f'代收{route}最终', '外部客款100000、采购70000，A取得佣金20000', 20000, 10000)
    check(f'代收{route}两项余额结清', '各自转付或批准抵扣后余额',
          [collection, commission], [money(0), money(0)])

# 退差不退人：所有调整均为本例已经单独批准的输入。
revised_sale = sale - money(10000)
revised_cost = resources - money(4000)
revised_internal = money(80000) - money(6000)
revised_commission = money(20000) - money(2000)
check('退差后订单和人数', 'O01减10000、O02不变；人数仍10',
      [order_1-money(10000), order_2, revised_sale, 6+4],
      [money(50000), money(40000), money(90000), 10])
check('责01退差', '90000-(70000-4000)', revised_sale-revised_cost, money(24000))
check('责02退差', '90000-(80000-6000)', revised_sale-revised_internal, money(16000))
check('责03退差公司及集团', 'A=90000-74000；B=74000-66000；集团=90000-66000',
      [revised_sale-revised_internal, revised_internal-revised_cost, revised_sale-revised_cost],
      [money(16000), money(8000), money(24000)])
check('责04退差公司及集团', 'A=20000-2000；B=90000-66000-18000；集团=90000-66000',
      [revised_commission, revised_sale-revised_cost-revised_commission, revised_sale-revised_cost],
      [money(18000), money(6000), money(24000)])

for mode in ('采购转售', '代销'):
    c = Cash()
    c.balances = {'A': money(20000), 'B': money(10000)}
    refunds = [money(10000), money(6000 if mode == '采购转售' else 2000), money(4000)]
    c.verify(f'{mode}退差批准未付款', '批准不改变原已结清现金', 20000, 10000)
    transactions = (
        [('A', '客户', 10000, 10000, 10000), ('B', 'A', 6000, 16000, 4000), ('S', 'B', 4000, 16000, 8000)]
        if mode == '采购转售' else
        [('B', '客户', 10000, 20000, 0), ('A', 'B', 2000, 18000, 2000), ('S', 'B', 4000, 18000, 6000)]
    )
    for index, (source, target, amount, a, b) in enumerate(transactions):
        c.transfer(source, target, amount)
        refunds[index] -= money(amount)
        c.verify(f'{mode}退款节点{index+1}', f'{source}退{target}{amount}', a, b)
    check(f'{mode}三段退款余额', '逐段已批准金额减该段实际已退', refunds, [money(0)]*3)

check('本方优惠不转嫁上游', 'A=100000-2000-80000；B=80000-70000；集团=98000-70000',
      [sale-money(2000)-money(80000), money(80000)-resources, sale-money(2000)-resources],
      [money(18000), money(10000), money(28000)])
check('对账差异保留', 'B提交82000减A确认80000；无调价批准', money(82000)-money(80000), money(2000))
check('未获准抵扣时转80000尚未结清', '应转100000减实转80000；佣金20000仍分别存在',
      [money(100000)-money(80000), money(20000)], [money(20000), money(20000)])

result = {
    'scope': '仅复算2026-11-07责任稿的专用测试金额，不是ERP执行证据',
    'real_erp_executed': False,
    'accounting_tax_permission_policies_validated': False,
    'currency': 'CNY',
    'amount_basis': '未拆税、未加其他费用的本例资金及交易差额',
    'passed': all(row['passed'] for row in checks),
    'check_count': len(checks),
    'checks': checks,
}
destination = Path(__file__).with_name('calculation-checks.json')
destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: result[key] for key in ('scope', 'passed', 'check_count', 'real_erp_executed')}, ensure_ascii=False))
raise SystemExit(0 if result['passed'] else 1)
