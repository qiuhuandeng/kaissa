"""第四组测试资料独立复算；不访问 ERP，不调用项目计价或财务模型。"""
from decimal import Decimal, ROUND_HALF_UP
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


fare = D(4) * D(10000) + D(6000)
extras = D(1800) + D(1000) + D(1500)
gross = fare + extras
cost = sum(map(D, [14000, 8000, 10000, 2850, 150]))
coupon = D(1000)
points = D(2000) / D(10)
effective = gross - coupon - points
check('主样板团费与其他费用', (fare, extras, gross), (D(46000), D(4300), D(50300)))
check('资源逐笔成本', cost, D(35000))
check('券和积分分别影响收费', (points, effective), (D(200), D(49100)))
check('主券承担合计', (coupon * D('.6'), coupon * D('.4')), (D(600), D(400)))
check('同法人优惠责任而非额外费用', (D(600) + points, D(400), gross - effective), (D(800), D(400), D(1200)))
check('主样板经营差额不二扣', effective - cost, D(14100))
check('国内没有签证但团费基数不变', gross - D(1500) - coupon - points, D(47600))

# 每行：有效应收、累计实际收款、待收、积分余额、冻结、可用。
continuous_stages = []


def stage(name, receivable, received, balance, frozen, expected):
    r, p, b, f = map(D, [receivable, received, balance, frozen])
    values = [r, p, max(r - p, D(0)), b, f, b - f]
    check('惠01/' + name, values, list(map(D, expected)))
    continuous_stages.append(dict(name=name, values=clean(values)))


stage('建券发券并报价', 0, 0, 5000, 0, [0, 0, 0, 5000, 0, 5000])
stage('创建未确认订单并预留权益', 0, 0, 5000, 2000, [0, 0, 0, 5000, 2000, 3000])
stage('订单业务确认', effective, 0, 3000, 0, [49100, 0, 49100, 3000, 0, 3000])
stage('首款到账并认款15,000', effective, 15000, 3000, 0, [49100, 15000, 34100, 3000, 0, 3000])
stage('尾款到账并认款34,100', effective, D(15000) + D(34100), 3000, 0, [49100, 49100, 0, 3000, 0, 3000])
stage('实际回团、确认成本35,000', effective, 49100, 3000, 0, [49100, 49100, 0, 3000, 0, 3000])
stage('实际付供应商30,000', effective, 49100, 3000, 0, [49100, 49100, 0, 3000, 0, 3000])
stage('财务确认并生成凭证', effective, 49100, 3000, 0, [49100, 49100, 0, 3000, 0, 3000])
check('合法供应商未付余额', cost - D(30000), D(5000))

check('门槛前一分', (D('45999.99') < D(46000), D('45999.99') + extras), (True, D('50299.99')))
check('门槛恰好与后一分', (gross - coupon, D('46000.01') + extras - coupon), (D(49300), D('49300.01')))
check('九折封顶', gross - min(fare * D('.1'), D(1500)), D(48800))
check('九折无封顶', gross - fare * D('.1'), D(45700))
bundles = min(4 // 2, 1 // 1)
check('两大一小仅一组减至24000', (bundles, gross - D(bundles) * (D(26000) - D(24000))), (1, D(48300)))
check('成人按人优惠不影响五人名额', gross - D(4) * D(200), D(49500))
check('允许截断但不可减附加费', D(1000) + D(500) - min(D(2000), D(1000)), D(500))
check('服务券零收费但增加成本', effective - (cost + D(300)), D(13800))
first_fixed = gross - coupon - (fare - coupon) * D('.1')
first_percent = gross - fare * D('.1') - coupon
check('先直减再折扣', first_fixed, D(44800))
check('先折扣再直减', first_percent, D(44700))
check('顺序造成的真实差额', first_fixed - first_percent, D(100))
check('互斥取最大测试分支', gross - max(coupon, fare * D('.1')), D(45700))
check('券后与券前积分上限不能混用', ((fare - coupon) * D('.02'), fare * D('.02')), (D(900), D(920)))
check('积分上限边界', (D(9000) / D(10) <= D(900), D(9010) / D(10) <= D(900)), (True, False))
check('会员价后不达门槛', (D(45000) < D(46000), D(45000) + extras), (True, D(49300)))

base_commission = fare * D('.05')
f_commission = base_commission - D(400)
f_receivable = gross - coupon
f_contribution = f_receivable - cost - f_commission
check('加盟基础佣金与承担后应结', (base_commission, f_commission), (D(2300), D(1900)))
check('加盟客户收费与A贡献', (f_receivable, f_contribution), (D(49300), D(12400)))
check('A仅承担600的经营影响', (gross - cost - base_commission) - f_contribution, D(600))
check('代收获准净额抵扣后的实际转款', f_receivable - f_commission, D(47400))
check('未授权抵扣时双方各自未结', (f_receivable - D(47400), f_commission), (D(1900), D(1900)))

profit_base = D(100000) - D(80000)
store_share = profit_base * D('.8') - D(400)
company_share = profit_base * D('.2') - D(600)
check('独立外采分润双方金额', (store_share, company_share), (D(15600), D(3400)))
check('分润与外采差额核平', store_share + company_share, D(99000) - D(80000))
check('分润现金与抵扣后未结', store_share - D(10000) - D(2000), D(3600))
check('D自用券减少采购价不造佣金', (D(40000) - D(500), D(40000) - D(500) - cost), (D(39500), D(4500)))
check('只有真实零售依据才算D差额', gross - D(39500), D(10800))

platform_total = gross - D(800)
platform_fee = platform_total * D('.02')
check('平台代付不是另减收费', D(49200) + D(300), platform_total)
check('平台手续费及净转', (platform_fee, platform_total - platform_fee), (D(990), D(48510)))
check('平台代付情形的贡献', platform_total - cost - platform_fee, D(13510))
check('另获营销补贴情形的贡献', platform_total - cost - platform_fee + D(300), D(13810))
check('供应商承担采用采购减价', (cost - D(400), gross - coupon - (cost - D(400))), (D(34600), D(14700)))
check('另收补贴替代采购减价', gross - coupon - cost + D(400), D(14700))

internal_price = D(40000) - D(600)
check('集团采购转售优惠后的各公司', (f_receivable - internal_price, internal_price - cost), (D(9900), D(4400)))
check('内部减价未批的各公司', (f_receivable - D(40000), D(40000) - cost), (D(9300), D(5000)))
check('公司间承担不同集团总额仍相同', D(9900) + D(4400), D(9300) + D(5000))
check('集团代销两方与集团差额', (f_commission, f_receivable - cost - f_commission, f_receivable - cost), (D(1900), D(12400), D(14300)))

remaining_fare = fare - D(10000)
retained_charges = remaining_fare + extras
revised_commission = remaining_fare * D('.05')
check('部分退团失去门槛后的应收退款', (retained_charges, f_receivable - retained_charges), (D(40300), D(9000)))
check('失去门槛佣金及追回', (revised_commission, f_commission - revised_commission), (D(1800), D(100)))
check('失去门槛分支的新贡献', retained_charges - D(30000) - revised_commission, D(8500))
protected_charges = retained_charges - coupon
protected_commission = revised_commission - D(400)
check('保留优惠分支客户金额', (protected_charges, f_receivable - protected_charges), (D(39300), D(10000)))
check('保留优惠分支佣金及追回', (protected_commission, f_commission - protected_commission), (D(1400), D(500)))
check('保留优惠分支新贡献', protected_charges - D(30000) - protected_commission, D(7900))

check('兑换券积分余额与收费', (D(5000) - D(2000), gross - coupon), (D(3000), D(49300)))
check('退兑换积分或直接抵分的余额', D(3000) + D(2000), D(5000))
check('主样板可退现金不是原价', (effective, gross - effective), (D(49100), D(1200)))
earned = (fare - coupon - points) * D('.1')
remaining_points = earned - D(4000)
check('消费赠分独立基数', earned, D(4480))
check('赠分已用后的余额及待追回', (remaining_points, earned - remaining_points), (D(480), D(4000)))

check('新旧券承担版本分别复算', (D(1000)*D('.6'), D(1000)*D('.4'), D(800)*D('.4'), D(800)*D('.6')), tuple(map(D, [600, 400, 320, 480])))
check('一分优惠按批准顺序分配守恒', D('.01') + D(0), D('.01'))
check('原一分承担精确冲回', (D('.01') + D('-.01'), D(0) + D(0)), (D(0), D(0)))
partial_reversals = []
for amount in map(D, ['333.33', '333.33', '333.34']):
    a = (amount * D('.6')).quantize(D('.01'), rounding=ROUND_HALF_UP)
    partial_reversals.append((a, amount - a))
check('三次承担冲回明细', partial_reversals, [(D(200), D('133.33')), (D(200), D('133.33')), (D(200), D('133.34'))])
check('分次冲回累计不超原承担', tuple(sum(v[i] for v in partial_reversals) for i in (0, 1)), (D(600), D(400)))
check('只改承担不改客户金额', (D(500)-D(600), D(500)-D(400), D(500)+D(500)), (D(-100), D(100), D(1000)))
check('新增激励且此前未计费的贡献', f_contribution - D(300), D(12100))

result = dict(
    status='passed', count=len(checks),
    scope='第四组测试输入与独立算术核对；不验证真实业务行为',
    real_erp_executed=False, actual_concurrency_approval_payment_vouchers_tested=False,
    formal_policies_approved=False, continuous_stages=continuous_stages, checks=checks,
)
Path(__file__).with_name('calculation-checks.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(f'{len(checks)} 项独立算术检查通过；未执行真实 ERP。')
