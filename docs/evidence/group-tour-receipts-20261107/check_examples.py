"""第五组独立资金样板核对；不调用 ERP 或原型余额函数。"""
from decimal import Decimal
from pathlib import Path
import json

D = lambda value: Decimal(str(value))
checks = []


def clean(value):
    if isinstance(value, Decimal):
        return format(value, 'f')
    if isinstance(value, (list, tuple)):
        return [clean(v) for v in value]
    if isinstance(value, dict):
        return {k: clean(v) for k, v in value.items()}
    return value


def check(name, actual, expected):
    passed = actual == expected
    checks.append(dict(name=name, actual=clean(actual), expected=clean(expected), passed=passed))
    if not passed:
        raise AssertionError(name + ': ' + str(actual) + ' != ' + str(expected))


o1_due, o2_due = D(50300) - D(1000) - D(200), D(48800) - D(1000) - D(200)
check('两单有效应收合计', o1_due + o2_due, D(96700))
check('两单积分从同会员真实可用额分别扣', D(5000) - D(2000) - D(2000), D(1000))
customer_stages = []
net, unallocated, advance, hold, o1, o2, deposit = [D(0)] * 7


def customer(name, expected):
    values = [net, unallocated, advance, hold, o1, o2, deposit]
    check('款01/' + name, values, list(map(D, expected)))
    check('款01资金去向/' + name, net, unallocated + advance + o1 + o2 + deposit)
    customer_stages.append(dict(name=name, values=clean(values)))


customer('仅收到付款截图', [0, 0, 0, 0, 0, 0, 0])
net += D(60000); unallocated += D(60000)
customer('第一笔60,000核实到账', [60000, 60000, 0, 0, 0, 0, 0])
advance += unallocated; unallocated = D(0)
customer('确认C预收60,000', [60000, 0, 60000, 0, 0, 0, 0])
customer('O1及O2业务确认', [60000, 0, 60000, 0, 0, 0, 0])
advance -= D(50000); o1 += D(30000); o2 += D(20000)
customer('预收用于O1 30,000及O2 20,000', [60000, 0, 10000, 0, 30000, 20000, 0])
hold += D(3000)
customer('冻结剩余预收中的3,000', [60000, 0, 10000, 3000, 30000, 20000, 0])
check('预收冻结后可用', advance - hold, D(7000))
advance -= D(7000); o1 += D(7000)
customer('将可用7,000用于O1', [60000, 0, 3000, 3000, 37000, 20000, 0])
hold -= D(3000)
customer('按依据解除冻结3,000', [60000, 0, 3000, 0, 37000, 20000, 0])
advance -= D(3000); o2 += D(3000)
customer('剩余预收3,000用于O2', [60000, 0, 0, 0, 37000, 23000, 0])
net += D(40000); unallocated += D(40000)
customer('第二笔40,000核实到账', [100000, 40000, 0, 0, 37000, 23000, 0])
o1 += D(12100); o2 += D(24600); unallocated -= D(12100) + D(24600)
customer('分配O1 12,100及O2 24,600', [100000, 3300, 0, 0, 49100, 47600, 0])
deposit += unallocated; unallocated = D(0)
customer('C同意将3,300转本人预存并确认', [100000, 0, 0, 0, 49100, 47600, 3300])
hold += D(800)
customer('申请退余额800并占用', [100000, 0, 0, 800, 49100, 47600, 3300])
check('余额退款申请后可用但账面不提前扣', (deposit - hold, deposit), (D(2500), D(3300)))
net -= D(800); deposit -= D(800); hold -= D(800)
customer('实际退款800成功并解除相应占用', [99200, 0, 0, 0, 49100, 47600, 2500])
check('主样板各分配阶段总待收', [o1_due + o2_due - D(n) for n in [0, 50000, 57000, 60000, 96700]], list(map(D, [96700, 46700, 39700, 36700, 0])))
check('第一笔原款最终组成', D(37000) + D(23000), D(60000))
check('第二笔原款含退回的最终组成', D(12100) + D(24600) + D(2500) + D(800), D(40000))
cost = D(35000) + D(30000)
check('两单成本与经营差额', (cost, o1_due + o2_due - cost), (D(65000), D(31700)))
check('实际供应商支付后现金净增与未付', (net - D(60000), cost - D(60000)), (D(39200), D(5000)))
check('现金不是利润，留存与未付仍存在', D(31700) + deposit + D(5000), D(39200))

check('核实亲属代付后欠款', D(49100) - D(15000), D(34100))
check('一款两单后的剩余', D(60000) - D(30000) - D(20000), D(10000))
check('认款与充值争用的算术边界非并发测试', (D(40000)-D(10000), D(20000)*2 > D(30000), D(30000)-D(20000)), (D(30000), True, D(10000)))
check('独立两次真实付款与单次付款金额不同', D(15000) * D(2), D(30000))
check('多收必须另列', D(50000) - D(49100), D(900))
check('少收一分钱不静默抹平', D(49100) - D('49099.99'), D('.01'))
check('有依据的商户手续费和净到账', D(49000) + D(100), D(49100))
check('缺扣费依据时尚待核明的差额', D(49100) - D(49000), D(100))
check('错认更正后两单欠款', (D(49100), D(47600) - D(20000)), (D(49100), D(27600)))
check('部分实际退款后不能再全额重分配', D(20000) - D(5000), D(15000))

store_stages = []
ledger, frozen, order3 = D(0), D(0), D(0)


def store(name, expected):
    values = [ledger, frozen, ledger - frozen, order3]
    check('款07/' + name, values, list(map(D, expected)))
    store_stages.append(dict(name=name, values=clean(values)))


store('提交充值70,000，尚未确认', [0, 0, 0, 0])
first_available = D(40000) - D(10000)
ledger += first_available
store('第一笔仅确认可用30,000', [30000, 0, 30000, 0])
check('余额不足的冻结申请超出可用', D(39500) > ledger - frozen, True)
store('尝试为O3冻结39,500，余额不足拒绝', [30000, 0, 30000, 0])
second_credit = D(70000) - first_available
ledger += second_credit
check('第二笔到账未全部充值，剩余仍待分配', D(45000) - second_credit, D(5000))
store('第二笔再确认40,000完成充值', [70000, 0, 70000, 0])
frozen += D(39500)
store('O3按规则冻结39,500', [70000, 39500, 30500, 0])
frozen += D(10000)
store('O5另冻结10,000', [70000, 49500, 20500, 0])
ledger -= D(39500); frozen -= D(39500); order3 += D(39500)
store('O3确认扣款39,500并解除其冻结', [30500, 10000, 20500, 39500])
frozen -= D(10000)
store('O5申请退回，释放其10,000', [30500, 0, 30500, 39500])
ledger += D(5000); order3 -= D(5000)
store('O3获批退差5,000并确认返D原预存', [35500, 0, 35500, 34500])
frozen += D(5500)
store('D申请退余额5,500并占用', [35500, 5500, 30000, 34500])
ledger -= D(5500); frozen -= D(5500)
store('确认实际退5,500成功', [30000, 0, 30000, 34500])
check('门店资金最终各去向守恒', D(40000) + D(45000) - D(5500), D(10000) + order3 + ledger + D(5000))
check('门店预存逐笔变动复算', D(70000) - D(39500) + D(5000) - D(5500), D(30000))
check('整户限制不改变占用金额，充值后仍占用', (D(30000) + D(5000), D(10000), D(30000) + D(5000) - D(10000)), (D(35000), D(10000), D(25000)))
check('仅解除一笔金额冻结', (D(10000) - D(2000), D(35000) - (D(10000)-D(2000))), (D(8000), D(27000)))

check('多收退款与留存不能同时超额', D(600) + D(500) > D(900), True)
check('先占用退款后剩余可留存', D(900) - D(600), D(300))
check('实际退600及留存300后去向核平', D(50000) - D(600), D(49100) + D(300))
check('转团可转与目标待收', (D(20000) - D(2000), D(52600) - D(18000)), (D(18000), D(34600)))
check('转团不新增现金', D(2000) + D(18000), D(20000))
check('授权代收部分转付后的双侧欠款', (D(49300) - D(30000), D(1900)), (D(19300), D(1900)))
check('授权佣金抵扣后的剩余转付', D(19300) - D(1900), D(17400))
check('代收清算完毕双方实际持款', (D(49300)-D(30000)-D(17400), D(30000)+D(17400)), (D(1900), D(47400)))
check('集团实际对外入款不重复内部转款', D(1900) + D(47400), D(49300))
check('未获抵扣时仍有双方欠款', (D(49300)-D(47400), D(1900)), (D(1900), D(1900)))

platform_sales = D(49500) + D(20000)
platform_refunded = D(1000)
platform_fee = D(990) + D(400)
platform_retained = D(2000)
platform_payout = platform_sales - platform_refunded - platform_fee - platform_retained
check('平台原收费和退后收费', (platform_sales, platform_sales - platform_refunded), (D(69500), D(68500)))
check('平台费用和扣费后应转', (platform_fee, platform_sales - platform_refunded - platform_fee), (D(1390), D(67110)))
check('平台本期实际转款', platform_payout, D(65110))
check('平台到账逐订单分配', D(48510) + D(16600), platform_payout)
check('平台待转与客户欠款分开', D(67110) - platform_payout, D(2000))
check('平台释放留存后的累计银行到账', platform_payout + platform_retained, D(67110))
check('游客自付净额加平台代付', D(49200) + D(20000) - D(1000) + D(300), D(68500))
check('平台第二单费用退款与留存组成', D(20000) - D(1000) - D(400) - D(2000), D(16600))
check('现金缴银行不是再次客户付款', (D(5000)-D(5000)) + D(5000), D(5000))
check('已充值并部分使用的原款分布', D(40000) + D(10000), D(50000))
check('资金被退回后实际净入款', D(50000) - D(50000), D(0))
check('批准撤销有效使用后恢复客户欠款', D(40000) - D(0), D(40000))
check('跨月认款只改用途，资金总额不变', (D(20000) + D(0), D(0) + D(20000)), (D(20000), D(20000)))

result = dict(status='passed', count=len(checks), scope='第五组资料独立算术核对，不是被测业务逻辑实现', real_erp_executed=False, actual_payment_concurrency_approval_vouchers_tested=False, formal_policies_approved=False, customer_stages=customer_stages, store_stages=store_stages, checks=checks)
Path(__file__).with_name('calculation-checks.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(f'{len(checks)} 项独立资金算术检查通过；未执行真实 ERP。')
