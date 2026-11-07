"""复算第二组文档的专用数量/金额输入；不操作ERP，不模拟并发测试通过。"""
from decimal import Decimal
from pathlib import Path
import json


D = lambda value: Decimal(str(value))
checks = []


def plain(value):
    if isinstance(value, Decimal):
        return format(value, '.2f')
    if isinstance(value, (tuple, list)):
        return [plain(v) for v in value]
    return value


def check(name, basis, actual, expected):
    checks.append({'name': name, 'basis': basis, 'actual': plain(actual),
                   'expected': plain(expected), 'passed': actual == expected})


def position(name, hold, confirmed, receivable, received, applied, expected):
    # 固定20人独立团；预款不提前抵扣未成立的应收。
    actual = [hold, confirmed, 20-hold-confirmed, receivable, received,
              received-applied, receivable-applied]
    check(name, '暂占、确认占用、20减两类占用、有效应收、净收、净收减已分配、应收减已分配',
          actual, [D(v) for v in expected])
    if min(actual) < 0:
        raise AssertionError('本例不允许负余位或超额应收分配: ' + name)


price, first, second = D(10000), D(6), D(4)
amount_1, amount_2 = first*price, second*price
deposit_1, deposit_2 = amount_1*D('.30'), amount_2*D('.30')
position('位01草稿', 0, 0, D(0), D(0), D(0), [0, 0, 20, 0, 0, 0, 0])
position('位01暂占6人', 6, 0, D(0), D(0), D(0), [6, 0, 14, 0, 0, 0, 0])
position('位01首款未确认订单', 6, 0, D(0), deposit_1, D(0), [6, 0, 14, 0, 18000, 18000, 0])
position('位01确认O01', 0, 6, amount_1, deposit_1, deposit_1, [0, 6, 14, 60000, 18000, 0, 42000])
position('位01O02首款待分配', 4, 6, amount_1, deposit_1+deposit_2, deposit_1,
         [4, 6, 10, 60000, 30000, 12000, 42000])
position('位01两单确认', 0, 10, amount_1+amount_2, deposit_1+deposit_2, deposit_1+deposit_2,
         [0, 10, 10, 100000, 30000, 0, 70000])
tail_1, tail_2 = amount_1-deposit_1, amount_2-deposit_2
position('位01两单结清', 0, 10, amount_1+amount_2, deposit_1+deposit_2+tail_1+tail_2,
         amount_1+amount_2, [0, 10, 10, 100000, 100000, 0, 0])
check('位01渠道独立核对', '门店12-6-4；分销8不占', [12-6-4, 8], [2, 8])
position('位01合法先确认后收款分支', 0, 6, amount_1, D(0), D(0), [0, 6, 14, 60000, 0, 0, 60000])

# 询位没有已知源总量，不调用固定20人的位置演算。
request, prepaid, accepted = D(4)*price, D(12000), D(2)*price
check('位02待回复金额', '4人报价；正式应收未成立；预款12000待分配',
      [request, D(0), prepaid], [D(40000), D(0), D(12000)])
check('位02接受2人', '2*10000；扣原款12000；未确认2人不生成应收',
      [accepted, accepted-prepaid, 4-2], [D(20000), D(8000), 2])
check('位02完全无位退回', '未确认应收0；12000原款实际退12000',
      [D(0), prepaid-D(12000)], [D(0), D(0)])
check('位02供应商补差不批准客户价', '客户原报价40000不动；供应商报价变化另存1200',
      [request, D(1200)], [D(40000), D(1200)])

# 两种合法竞态结果仅复算数值，不证明真实服务只有一方成功。
for winner in ('A采购转售', 'B直销'):
    check('位03合法结果-' + winner, '原18人+胜方2；新增对客2*10000',
          [18+2, 20-18-2, 2*price], [20, 0, D(20000)])
check('位03采购转售价差', '对客2*10000；内部约定2*8000',
      [2*price, D(2)*D(8000)], [D(20000), D(16000)])
check('位03代销客户责任金额', 'B对客20000；A对客0；佣金约定4000，不代表已付',
      [2*price, D(0), D(4000)], [D(20000), D(0), D(4000)])

check('位04团有位渠道不足', '团20-6；门店8-6；拟占4不大于门店可用？',
      [20-6, 8-6, 4 <= 8-6], [14, 2, False])
quota = [8+2, 8-2, 4]
check('位04配额划拨', '分销未用2转门店，总量不增加', quota+[sum(quota)], [10, 6, 4, 20])
check('位04再确认4人', '门店6+4、可用10-10；团余20-10', [6+4, quota[0]-6-4, 20-6-4], [10, 0, 10])
check('位04配额下调边界', '门店配额9不能覆盖占用10；合计21超团20', [9 >= 10, 21 <= 20], [False, False])
check('位04释放原渠道2人', '门店占10-2；可用10-8；团余20-8', [10-2, quota[0]-(10-2), 20-(10-2)], [8, 2, 12])

position('位05到期前暂占', 2, 0, D(0), D(0), D(0), [2, 0, 18, 0, 0, 0, 0])
position('位05到期释放', 0, 0, D(0), D(0), D(0), [0, 0, 20, 0, 0, 0, 0])
position('位05释放后迟到款', 0, 0, D(0), D(6000), D(0), [0, 0, 20, 0, 6000, 6000, 0])
position('位05迟到款实际退回', 0, 0, D(0), D(6000)-D(6000), D(0), [0, 0, 20, 0, 0, 0, 0])

customer_charge, customer_received, supplier_prepaid = D(4)*price, D(12000), D(8000)
retained_charge, retained_cost = D(4000), D(3000)
refund_customer, recover_supplier = customer_received-retained_charge, supplier_prepaid-retained_cost
cash = customer_received-supplier_prepaid
check('位06取消前', '占4余16；收费4*10000；净收12000；付供应商8000',
      [4, 20-4, customer_charge, customer_received, cash], [4, 16, D(40000), D(12000), D(4000)])
check('位06取消批准未退钱', '有效收费4000；客户应退12000-4000；供应商应退8000-3000；现金不变',
      [0, 20, retained_charge, customer_received, refund_customer, recover_supplier, cash],
      [0, 20, D(4000), D(12000), D(8000), D(5000), D(4000)])
check('位06应收调整', '原40000调整-36000；原未收28000随取消调整消除，剩余收费已有款覆盖',
      [retained_charge-customer_charge, customer_charge-customer_received, retained_charge-min(customer_received, retained_charge)],
      [D(-36000), D(28000), D(0)])
cash -= refund_customer
check('位06先退客户', '客户净收12000-8000；本单现金4000-8000；供应商5000未回',
      [customer_received-refund_customer, cash, recover_supplier], [D(4000), D(-4000), D(5000)])
cash += recover_supplier
check('位06上游退回后', '本单现金-4000+5000；交易差额4000-3000',
      [cash, retained_charge-retained_cost], [D(1000), D(1000)])
check('位06资金与未结责任', '批准未退时现金4000+应回5000-应退8000=1000',
      customer_received-supplier_prepaid+recover_supplier-refund_customer, D(1000))

check('位07转团目标不足', '原团20-6；目标20-15；6不能全部转入5',
      [20-6, 20-15, 6 <= 20-15], [14, 5, False])
check('位07目标先合法释放1', '目标原占15-1；可用20-14', [15-1, 20-(15-1)], [14, 6])
new_charge = D(6)*D(11000)
check('位07完成转团', '原本单占0；目标14+6；有效应收66000；原款18000；待收48000',
      [20, 14+6, 20-14-6, new_charge, deposit_1, new_charge-deposit_1, new_charge-amount_1],
      [20, 20, 0, D(66000), D(18000), D(48000), D(6000)])
check('位07原款只分配一次', '旧单当前分配0+新单18000；银行没有新增收入',
      [D(0)+deposit_1, D(0)], [D(18000), D(0)])

check('位08儿童数量及售价', '2成人+1儿童；占团3、机位3、酒店1间；20-3；2*10000+6000',
      [2+1, 3, 1, 20-3, 2*price+D(6000)], [3, 3, 1, 17, D(26000)])
check('位09未达到成团人数', '最低10、有效8，缺2；不伪造游客', [8 >= 10, 10-8], [False, 2])
check('位09供给缩减缺口', '确认18，供应可保障15，缺3；原始差额15-18=-3必须可见',
      [18-15, 15-18], [3, -3])
check('位10已释放后剩余可释放', '原占2-累计已释放2=0', 2-2, 0)

result = {
    'scope': '仅第二组专用测试输入的数量、金额及允许结果复算',
    'currency': 'CNY', 'policies_approved_by_this_check': False,
    'real_erp_executed': False, 'concurrency_expiry_permissions_tested': False,
    'passed': all(row['passed'] for row in checks), 'check_count': len(checks), 'checks': checks,
}
Path(__file__).with_name('calculation-checks.json').write_text(
    json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({k: result[k] for k in ('scope', 'passed', 'check_count', 'real_erp_executed')}, ensure_ascii=False))
raise SystemExit(0 if result['passed'] else 1)
