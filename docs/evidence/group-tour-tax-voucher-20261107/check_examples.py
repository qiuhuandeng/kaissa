# coding: utf-8
"""第十一组独立预期底稿：只使用标准库，不调用ERP、原型或真实税务服务。"""
from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict
from pathlib import Path
import json

D = Decimal
Z = D('0')
RATE = D('0.06')
checks, stages, journals = [], [], []


def money(v):
    return D(str(v)).quantize(D('.01'), rounding=ROUND_HALF_UP)


def tax(gross, rate=RATE):
    return money(D(str(gross)) * rate / (1 + rate))


def eq(case, name, actual, expected):
    actual, expected = D(str(actual)), D(str(expected))
    checks.append(dict(case=case, name=name, actual=str(actual), expected=str(expected), passed=actual == expected))
    assert actual == expected, (case, name, actual, expected)


# 余额以借方为正；下列名称是会计含义，尚非凯撒正式科目编码。
ledger = defaultdict(lambda: Z)
fees = cost_gross = issued = received = Z


def post(event, debit, credit):
    dr = sum((D(str(v)) for v in debit.values()), Z)
    cr = sum((D(str(v)) for v in credit.values()), Z)
    eq('税01', event+'借贷平衡', dr, cr)
    for k, v in debit.items():
        ledger[k] += D(str(v))
    for k, v in credit.items():
        ledger[k] -= D(str(v))
    journals.append(dict(event=event, company='测试甲', book='测试甲账簿', currency='CNY',
                         debit={k: str(v) for k, v in debit.items()}, credit={k: str(v) for k, v in credit.items()}))


def stage(name):
    rev, cost = -ledger['收入'], ledger['成本']
    out, deduction = -ledger['销项税额'], ledger['销项税额抵减']
    values = [fees, cost_gross, rev, cost, out, deduction, issued, received]
    balances = [ledger['银行'], ledger['客户应收'], -ledger['合同负债'], ledger['预付H'],
                -ledger['应付H'], -ledger['应付L'], -ledger['客户应退'], ledger['供应商应返']]
    # 无其他资产负债、没有纳税支付；本案例税额余额单列，不是公司整期纳税申报额。
    net_assets = sum(balances[i] for i in [0, 1, 3, 7]) - sum(balances[i] for i in [2, 4, 5, 6])
    eq('税01', name+'现金往来与价税拆分后毛利桥接', net_assets - (out-deduction), rev-cost)
    stages.append(dict(name=name, values=[str(money(v)) for v in values], balances=[str(money(v)) for v in balances]))


stage('01 新建主数据产品团期')
fees = D(20)*D(5300)
stage('02 确认两张十人订单')
post('03 客户预付', {'银行': 53000}, {'合同负债': 53000})
stage('03 客户预付53000')
post('04 预付酒店H', {'预付H': 10600}, {'银行': 10600})
stage('04 酒店预付10600')
post('05 履约收入及纳税义务成立', {'合同负债': 53000, '客户应收': 53000}, {'收入': 100000, '销项税额': 6000})
stage('05 履约与收入税额确认')
cost_gross += D(31800)
post('06 酒店服务确认', {'成本': 31800}, {'应付H': 31800})
stage('06 酒店成本确认')
cost_gross += D(31800)
post('07 地接服务确认', {'成本': 31800}, {'应付L': 31800})
stage('07 地接成本确认')
post('08 预付冲酒店应付', {'应付H': 10600}, {'预付H': 10600})
stage('08 酒店预付冲抵')
post('09 付酒店尾款', {'应付H': 21200}, {'银行': 21200})
stage('09 酒店尾款支付')
post('10 付地接', {'应付L': 31800}, {'银行': 31800})
stage('10 地接款支付')
received += D(31800)
post('11 酒店合规扣除', {'销项税额抵减': tax(31800)}, {'成本': tax(31800)})
stage('11 酒店收票及扣除确认')
received += D(21200)
post('12 地接第一票扣除', {'销项税额抵减': tax(21200)}, {'成本': tax(21200)})
stage('12 地接首票及扣除确认')
received += D(10600)
post('13 地接第二票扣除', {'销项税额抵减': tax(10600)}, {'成本': tax(10600)})
stage('13 地接尾票及扣除确认')
post('14 客户付尾款', {'银行': 53000}, {'客户应收': 53000})
stage('14 客户尾款到账')
issued += D(53000)
stage('15 客户首票53000')
issued += D(53000)
stage('16 客户尾票53000')
stage('17 生成凭证及重复请求核对')
fees -= D(10600)
issued -= D(10600)
post('18 退价及红票扣税条件成立', {'收入': 10000, '销项税额': 600}, {'客户应退': 10600})
stage('18 客户让价及有效红票')
post('19 退客户款', {'客户应退': 10600}, {'银行': 10600})
stage('19 客户退款支付')
cost_gross -= D(6360)
received -= D(6360)
post('20 酒店减价形成应返', {'供应商应返': 6360}, {'成本': 6360})
post('20 已扣除价款减少恢复税额', {'成本': 360}, {'销项税额抵减': 360})
stage('20 酒店返价及扣除更正')
post('21 酒店返款到账', {'银行': 6360}, {'供应商应返': 6360})
stage('21 酒店返款到账')
stage('22 二次结算及凭证复核')
eq('税01', '最终不含税收入', -ledger['收入'], 90000)
eq('税01', '最终扣税后成本', ledger['成本'], 54000)
eq('税01', '最终毛利', -ledger['收入']-ledger['成本'], 36000)
eq('税01', '最终本例税额余额', -ledger['销项税额']-ledger['销项税额抵减'], 2160)
eq('税01', '最终净现金', ledger['银行'], 38160)

eq('税02', '全额计税对客销项', tax(106000), 6000)
eq('税02', '独立全额分支合格专票进项', tax(63600), 3600)
eq('税02', '全额分支进项与差额抵减只取一条', 6000-3600, 2400)
eq('税02', '错误双扣会少计税', (6000-3600)-(6000-3600-3600), 3600)
eq('税03', '仅酒店合规已付可扣', tax(31800), 1800)
eq('税03', '部分证据可扣累计', tax(31800)+tax(21200), 3000)
eq('税03', '缺尾票不提前扣', 6000-3000, 3000)
eq('税03', '全额成本中领队自付费用不自动扣', tax(63600)-tax(53000), 600)
eq('税04', '收53000开31800已收未开', max(53000-31800, 0), 21200)
eq('税04', '另一订单开53000收31800已开未收', max(53000-31800, 0), 21200)
eq('税04', 'H付31800收票21200', 31800-21200, 10600)
eq('税04', 'L收票31800付10600', 31800-10600, 21200)
eq('税05', '信息更正蓝红重开净票额', 53000-53000+53000, 53000)
eq('税05', '两票部分红冲净票额', 53000+53000-10600, 95400)
eq('税05', '红冲超过原票的拒绝边界', 53000-53000, 0)
eq('税06', '预收53000先开票税额', tax(53000), 3000)
eq('税06', '履约前剩余合同负债', 53000-3000, 50000)
eq('税06', '履约才确认收入', 106000-6000, 100000)
eq('税06', '已先确认部分税只补余额', 6000-3000, 3000)
eq('税07', '未开票应税收入不是零税', tax(106000), 6000)
eq('税07', '已申报未开票后来开票税只计一次', 6000+6000-6000, 6000)
eq('税08', '票面进项待确认不是已抵扣', tax(10600), 600)
eq('税08', '合法抵扣后净成本', 10600-600, 10000)
eq('税08', '明确不得抵扣应计成本', 10000+600, 10600)
eq('税09', '一票两团分配合计', 21200+10600, 31800)
eq('税09', '付款一份不因两团复制', 31800-21200-10600, 0)
eq('税10', '客户退价税额', tax(10600), 600)
eq('税10', '客户退价收入差额', 10600-tax(10600), 10000)
eq('税10', '税务红冲晚于减价待承接税额', 10600-10000, 600)
eq('税11', '差额扣除返价减少', tax(6360), 360)
eq('税11', '返价净成本减少', 6360-tax(6360), 6000)
eq('税11', '全额分支已抵扣收到确认单后转出', 3600-360, 3240)
eq('税12', '3笔含税0.10逐笔税额', sum((tax('.10') for _ in range(3)), Z), '.03')
eq('税12', '合计0.30拆税的对照', tax('.30'), '.02')
eq('税12', '逐票与合计差异不可静默吞掉', sum((tax('.10') for _ in range(3)), Z)-tax('.30'), '.01')
eq('税13', '符合境外免税的收入', 240000, 240000)
eq('税13', '免税专用成本含不可抵扣税', 10000+600, 10600)
eq('税13', '误将免税成本拆税会虚增毛利', 10600-10000, 600)
eq('税14', '已独立核定境内应税部分', tax(10600), 600)
eq('税14', '已批准可分别核算两项收入', 95400+10600-600, 105400)
eq('税14', '境内境外范围合计', 95400+10600, 106000)
eq('税15', '代理佣金含税10600拆税收入', 10600-tax(10600), 10000)
eq('税15', '代收款应付主责方', 106000-10600, 95400)
eq('税15', '代理代转60000后仍欠', 95400-60000, 35400)
eq('税16', '内采A全额分支收入', 106000-tax(106000), 100000)
eq('税16', 'B供货84800全额分支不含税', 84800-tax(84800), 80000)
eq('税16', 'A毛利', 100000-80000, 20000)
eq('税16', 'B外采63600合格进项分支成本', 63600-tax(63600), 60000)
eq('税16', '集团内部80000抵销后的毛利', 20000+(80000-60000), 40000)
eq('税16', '代理A佣金收入加B剩余毛利', 10000+(100000-60000-10000), 40000)
eq('税17', '同票折扣后计税基数含税', 106000-10600, 95400)
eq('税17', '折后税额', tax(95400), 5400)
eq('税17', '平台净付不改对客收费', 106000-10600, 95400)
eq('税17', '平台费独立专票条件成本', 10600-tax(10600), 10000)

# 续接第十组：逐原始金额/扣除单舍入，不用最终净额反算覆盖历史。
out_oct = tax(80000)*2
ded_oct = tax(40000)+tax(30000)+tax(10000)
out_nov_change = -tax(2000)
ded_nov_change = tax(10000)+tax(27000)-tax(1000)
bridge = [
    [D(160000), D(115000), out_oct, ded_oct, D(160000)-out_oct, D(115000)-ded_oct],
    [D(-2000), D(1000), out_nov_change, ded_nov_change, D(-2000)-out_nov_change, D(1000)-ded_nov_change]
]
bridge.append([a+b for a, b in zip(*bridge)])
for row in bridge:
    row.extend([row[4]-row[5], row[2]-row[3]])
for label, row, expected in zip(['10月', '11月', '累计'], bridge, [
    ['160000','115000','9056.60','4528.30','150943.40','110471.70','40471.70','4528.30'],
    ['-2000','1000','-113.21','2037.74','-1886.79','-1037.74','-849.05','-2150.95'],
    ['158000','116000','8943.39','6566.04','149056.61','109433.96','39622.65','2377.35']]):
    for i,(a,e) in enumerate(zip(row, expected)):
        eq('税18', label+'桥接列'+str(i+1), a, e)
eq('税18', '10月现金往来减税额等于毛利', 70000+10000-35000-bridge[0][7], bridge[0][6])
eq('税18', '最终净现金42000扣税额余额', 42000-bridge[2][7], bridge[2][6])
eq('税18', '最终按汇总拆税会多一分钱', tax(158000)-bridge[2][2], '.01')
eq('税19', '第九组外币本金实际支出', 63200+55650+40500, 159350)
eq('税19', '第九组汇兑及费用不再改服务价', 159350+557-156000, 3907)
eq('税19', '适用免税且原成本已含不可扣税的条件结果', 240000-206000-3350-557, 30093)
eq('税19', '税务折合率7.90会计7.80的税基差', D(1000)*(D('7.90')-D('7.80')), 100)
eq('税20', '员工实际合规报销和退回核借款', 8400+1600, 10000)
eq('税20', '未履行合同留违约金的退回', 10600-2000, 8600)
eq('税20', '无法划分服务进项按本例20%免税占比', D(600)*D('.2'), 120)
eq('税20', '共同服务允许抵扣部分', 600-120, 480)
eq('税21', '小规模差额含税余额101000按1%拆税', D(101000)/D('1.01'), 100000)
eq('税21', '达到起征点全额计税的税额', tax(101000, D('.01')), 1000)
eq('税21', '按月其他交易纳入后不能只看单团', 90000+20000, 110000)
eq('税22', '平衡凭证仍可能整体重复的虚增', 100000+100000-100000, 100000)
eq('税23', '原错成本10000冲销后正确成本9000', 10000-10000+9000, 9000)
eq('税23', '关账后只记调整差额', 9000-10000, -1000)
eq('税24', 'A公司收到B收入款需保留往来', 106000-60000, 46000)

result = dict(status='passed', count=len(checks), checks=checks, continuous_stages=stages,
              expected_journals=journals, final_debit_signed_balances={k:str(money(v)) for k,v in ledger.items()},
              bridge_periods=[[str(money(v)) for v in row] for row in bridge],
              real_erp_executed=False, formal_policies_approved=False,
              tax_and_formal_voucher_mapping_complete=False,
              actual_invoice_payment_concurrency_approval_vouchers_tested=False)
Path(__file__).with_name('calculation-checks.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(f'{len(checks)} 项独立资料复算通过；{len(stages)} 节点、{len(journals)} 组会计分录预期；未执行真实ERP。')
