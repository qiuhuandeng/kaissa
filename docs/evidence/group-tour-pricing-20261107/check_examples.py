"""第三组专用输入独立复算。无ERP访问，不证明审批、并发或财务政策通过。"""
from decimal import Decimal
from pathlib import Path
import json


def d(value):
    return Decimal(str(value))


def plain(value):
    if isinstance(value, Decimal):
        return format(value, '.2f')
    if isinstance(value, (list, tuple)):
        return [plain(item) for item in value]
    return value


checks = []
stages = []


def check(name, basis, actual, expected):
    checks.append({'name': name, 'basis': basis, 'actual': plain(actual),
                   'expected': plain(expected), 'passed': actual == expected})


adult, child, single, connection, visa = d(4)*d(10000), d(1)*d(6000), d(1800), d(5)*d(200), d(3)*d(500)
base = adult+child+single+connection+visa
check('共同输入收费明细', '成人4*10000、儿童1*6000、单房差1800、联运5*200、签证3*500、已含保险额外0',
      [adult, child, single, connection, visa, d(0)], [d(40000), d(6000), d(1800), d(1000), d(1500), d(0)])
check('共同输入人数和余位', '4成人+1儿童；附加收费不增加人数；20减5', [4+1, 20-4-1], [5, 15])
check('出境与国内合计', '出境五项；国内不含本例签证1500', [base, base-visa], [d(50300), d(48800)])
new_price = d(4)*d(10500)+d(6500)+single+connection+visa
check('价01版本2及差额', '成人单价10500、儿童6500、附加项目4300', [new_price, new_price-base], [d(52800), d(2500)])
check('价02不同单位同金额', '1人全程1800；2人*3晚*300', [single, d(2)*d(3)*d(300)], [d(1800), d(1800)])
room_changed = d(1)*d(3)*d(300)
check('价02减少人晚', '原2人3晚1800，改1人3晚900，差额-900', [room_changed, room_changed-single], [d(900), d(-900)])
check('价02按间夜加住', '1间2晚600；2间2晚600', [d(1)*d(2)*d(600), d(2)*d(2)*d(600)], [d(1200), d(2400)])

# 连续表只登记已生效差额和真实收退；等待节点不引入新发生额。
effective = received = refunded = d(0)


def stage(name, expected):
    net = received-refunded
    values = [effective, received, refunded, net, max(effective-net, d(0)), max(net-effective, d(0))]
    expected_values = [d(v) for v in expected]
    check(name, '有效应收、累计到账、累计已退、净收、未收、未覆盖应收净款；仅本例同单归属款', values, expected_values)
    stages.append({'name': name, 'expected': plain(expected_values), 'calculated': plain(values)})


stage('价03报价未确认', [0, 0, 0, 0, 0, 0])
received += d(15000)
stage('价03预款已收未确认', [0, 15000, 0, 15000, 0, 15000])
effective = base
stage('价03首次确认', [50300, 15000, 0, 15000, 35300, 0])
stage('价03减300审批中', [50300, 15000, 0, 15000, 35300, 0])
effective += d(1500)-single
stage('价03减300生效', [50000, 15000, 0, 15000, 35000, 0])
stage('价03加住仅确认可供', [50000, 15000, 0, 15000, 35000, 0])
effective += d(1)*d(2)*d(600)
stage('价03加住收费生效', [51200, 15000, 0, 15000, 36200, 0])
received += d(35000)
stage('价03再收35000', [51200, 50000, 0, 50000, 1200, 0])
stage('价03减2200审批中', [51200, 50000, 0, 50000, 1200, 0])
effective -= d(2200)
stage('价03减2200生效', [49000, 50000, 0, 50000, 0, 1000])
refunded += d(600)
stage('价03实退600', [49000, 50000, 600, 49400, 0, 400])
refunded += d(400)
stage('价03再退400', [49000, 50000, 1000, 49000, 0, 0])
check('价03保留原值与差额', '50300-300+1200-2200；600+400退款', [base-d(300)+d(1200)-d(2200), d(600)+d(400)], [d(49000), d(1000)])

check('价04原单房差改价', '50300+(1500-1800)，不再扣1500', base+d(1500)-single, d(50000))
check('价04签证减少一份', '3*500改2*500；50300减500', [d(2)*d(500)-visa, base+d(2)*d(500)-visa], [d(-500), d(49800)])
check('价04原基准追加加住', '50300+1间*2晚*600，与先减300分支区分', base+d(1200), d(51500))
check('价04原联运免费与新增免费', '原1000改0；另建免费项目差额0', [base-connection, base+d(0)], [d(49300), d(50300)])
check('价04零总差额不等于无项目变化', '联运减600、其他服务加600', base-d(600)+d(600), d(50300))
check('价05免费服务与独立成本', '对客应收不变；已收15000；新服务成本另300', [base, base-d(15000), d(300)], [d(50300), d(35300), d(300)])
check('价05已含保险不是零成本', '额外收费0；成本150单独确认；服务人数5', [d(0), d(150), 5], [d(0), d(150), 5])
check('价05待报价后获批600', '50300+600；已收仍15000', [base+d(600), base+d(600)-d(15000)], [d(50900), d(35900)])
check('价06儿童转成人价', '10000-6000；50300+4000；人数仍5', [d(10000)-d(6000), base+d(10000)-d(6000), 5], [d(4000), d(54300), 5])
check('价06免团费游客', '本例所有附加服务亦免费；人数5+1；团余20-6', [base+d(0), 5+1, 20-5-1], [d(50300), 6, 14])
reduced = base-d(10000)-d(200)
check('价07部分退团收费', '减少一成人团费10000及联运200；签证等保留', [reduced, reduced-d(15000), 5-1], [d(40100), d(25100), 4])
check('价07不能平均退整单', '50300/5=10060，不等于已批准10200', [base/d(5), base/d(5) != d(10200)], [d(10060), True])

first_effective = d(10000)+d(1200)
check('价08甲先生效', '10000+1200；真实款8000', [first_effective, first_effective-d(8000)], [d(11200), d(3200)])
check('价08乙重核后生效', '最新11200再减500，不能覆盖成9500', [first_effective-d(500), first_effective-d(500)-d(8000)], [d(10700), d(2700)])
original_a, changed_a, changed_b, proposed_a = d(600), d(400), d(600), d(500)
check('价08同额异项的差额', '旧600改500是-100；当前400改500是+100', [proposed_a-original_a, proposed_a-changed_a], [d(-100), d(100)])
check('价08同额异项重核总额', '当前400+600=1000；重核500+600=1100；旧差额误用会900',
      [changed_a+changed_b, proposed_a+changed_b, changed_a+changed_b+proposed_a-original_a], [d(1000), d(1100), d(900)])
check('价08审批期间到账', '当前应收批准9000，已到账10000保留，多收1000', d(10000)-d(9000), d(1000))

orders = [d(10000), d(20000), d(30000)]
payments = [d(8000), d(15000), d(30000)]
shares = [d(100), d(200), d(300)]
adjusted = [amount+share for amount, share in zip(orders, shares)]
unpaid = [amount-paid for amount, paid in zip(adjusted, payments)]
check('价09逐单追加后', '本例分配100、200、300各自生效', adjusted, [d(10100), d(20200), d(30300)])
check('价09逐单未收', '各单有效应收减各自已收', unpaid, [d(2100), d(5200), d(300)])
check('价09合计守恒', '分配合计600；应收合计60600；未收合计7600', [sum(shares), sum(adjusted), sum(unpaid)], [d(600), d(60600), d(7600)])
partial_total = orders[0]+shares[0]+orders[1]+orders[2]+shares[2]
check('价09第二单未生效', '只加第一100和第三300；款项不动', [partial_total, partial_total-sum(payments)], [d(60400), d(7400)])
check('价09失败单重试不重加其他', '60400补第二200', partial_total+shares[1], d(60600))
check('价09小数精度', '3*99.99+0.01，十进制计算', d(3)*d('99.99')+d('.01'), d('299.98'))
check('价09尾差合计', '本例指定33.33/33.33/33.34', d('33.33')+d('33.33')+d('33.34'), d('100.00'))
check('价09不参与项目不得接尾差', '本例指定0.01/0/0，第三项不参与', [d('.01')+d(0)+d(0), d(0)], [d('.01'), d(0)])

for label, sale, expected in [('改价前', base, [15300, 10300, 10300, 5000, 5000, 10300, 15300]),
                               ('改价后', d(49000), [14000, 9000, 9000, 5000, 5000, 9000, 14000])]:
    check('价10四关系-' + label,
          '自营差额、直接外采差额、转售A/B、代销A/B、集团对外；采购40000、外部35000、佣金5000不变',
          [sale-d(35000), sale-d(40000), sale-d(40000), d(40000)-d(35000), d(5000), sale-d(35000)-d(5000), sale-d(35000)],
          [d(v) for v in expected])

check('价11全收后减少1300', '原50300实收；有效应收减少1300；多收1300',
      [base-d(1300), base-(base-d(1300))], [d(49000), d(1300)])
check('价11退1300后', '50300-1300净收；原累计到账仍50300', [base-d(1300), base], [d(49000), d(50300)])
check('价12超额减免边界', '有效1000-申请1100=-100，不能作为正常有效团费', d(1000)-d(1100), d(-100))
check('价12数量单价与报文金额差异', '2*500应1000；提交999差1', d(2)*d(500)-d(999), d(1))

result = {
    'scope': '第三组专用金额复算；不调用ERP或复用原型计价函数',
    'currency': 'CNY', 'real_erp_executed': False, 'approval_concurrency_tested': False,
    'formal_pricing_tax_policies_approved': False,
    'passed': all(row['passed'] for row in checks), 'check_count': len(checks),
    'continuous_stages': stages, 'checks': checks,
}
Path(__file__).with_name('calculation-checks.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({k: result[k] for k in ('scope', 'passed', 'check_count', 'real_erp_executed')}, ensure_ascii=False))
raise SystemExit(0 if result['passed'] else 1)
