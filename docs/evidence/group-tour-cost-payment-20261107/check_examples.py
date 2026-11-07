# coding: utf-8
"""独立复算业务样板；不读取ERP模型、不连接测试环境、不产生付款。"""
from decimal import Decimal
from datetime import date, timedelta
from pathlib import Path
import json


def d(value):
    return Decimal(str(value))


def serial(value):
    if isinstance(value, (list, tuple)):
        return [serial(v) for v in value]
    if isinstance(value, Decimal):
        return format(value, 'f')
    return value


checks = []
stages = []


def check(case, name, actual, expected):
    passed = actual == expected
    checks.append(dict(case=case, name=name, actual=serial(actual),
                       expected=serial(expected), passed=passed))
    if not passed:
        raise AssertionError((case, name, actual, expected))


# 只记录本例实际发生事件，不能从应付页面显示的余额生成预期。
ledger = {key: d(0) for key in
          ['confirmed', 'prepaid', 'offset', 'direct_paid', 'bank_return', 'prepay_return', 'hold']}


def event(name, expected, **changes):
    for key, amount in changes.items():
        ledger[key] += d(amount)
    confirmed = ledger['confirmed']
    prepaid_balance = ledger['prepaid'] - ledger['offset'] - ledger['prepay_return']
    effective_paid = ledger['direct_paid'] - ledger['bank_return']
    outstanding = confirmed - ledger['offset'] - effective_paid
    net_cash = (ledger['prepaid'] + ledger['direct_paid']
                - ledger['bank_return'] - ledger['prepay_return'])
    values = [confirmed, prepaid_balance, ledger['offset'], effective_paid,
              outstanding, ledger['hold'], outstanding - ledger['hold'], net_cash]
    check('付01', name, values, [d(v) for v in expected])
    stages.append(dict(name=name, values=serial(values)))


event('预计95,000，尚未形成确认欠款', [0, 0, 0, 0, 0, 0, 0, 0])
event('第一笔预付20,000实际成功', [0, 20000, 0, 0, 0, 0, 0, 20000], prepaid=20000)
event('第二笔预付15,000实际成功', [0, 35000, 0, 0, 0, 0, 0, 35000], prepaid=15000)
event('预付30,000仅分配到团', [0, 35000, 0, 0, 0, 0, 0, 35000])
event('依据生效，确认应付100,000', [100000, 35000, 0, 0, 100000, 0, 100000, 35000], confirmed=100000)
event('预付30,000实际冲抵', [100000, 5000, 30000, 0, 70000, 0, 70000, 35000], offset=30000)
event('申请现金付款50,000并占用', [100000, 5000, 30000, 0, 70000, 50000, 20000, 35000], hold=50000)
event('申请批准，尚未实际付款', [100000, 5000, 30000, 0, 70000, 50000, 20000, 35000])
event('第一笔35,000实际成功', [100000, 5000, 30000, 35000, 35000, 15000, 20000, 70000], direct_paid=35000, hold=-35000)
event('第二笔15,000结果未知', [100000, 5000, 30000, 35000, 35000, 15000, 20000, 70000])
event('第二笔15,000核实成功', [100000, 5000, 30000, 50000, 20000, 0, 20000, 85000], direct_paid=15000, hold=-15000)
event('S账单主张103,000，补差未批准', [100000, 5000, 30000, 50000, 20000, 0, 20000, 85000])
event('补3,000减1,000业务批准', [102000, 5000, 30000, 50000, 22000, 0, 22000, 85000], confirmed=d(3000)-d(1000))
event('申请尾款22,000并占用', [102000, 5000, 30000, 50000, 22000, 22000, 0, 85000], hold=22000)
event('尾款22,000实际成功', [102000, 5000, 30000, 72000, 0, 0, 0, 107000], direct_paid=22000, hold=-22000)
event('银行退回4,000，原欠款有效', [102000, 5000, 30000, 68000, 4000, 0, 4000, 103000], bank_return=4000)
event('查明后重新申请4,000', [102000, 5000, 30000, 68000, 4000, 4000, 0, 103000], hold=4000)
event('重新付款4,000实际成功', [102000, 5000, 30000, 72000, 0, 0, 0, 107000], direct_paid=4000, hold=-4000)
event('申请退未用预付5,000', [102000, 5000, 30000, 72000, 0, 0, 0, 107000])
event('预付第一笔退回3,000到账', [102000, 2000, 30000, 72000, 0, 0, 0, 104000], prepay_return=3000)
event('预付第二笔退回2,000到账', [102000, 0, 30000, 72000, 0, 0, 0, 102000], prepay_return=2000)
event('履约结算并完成财务确认', [102000, 0, 30000, 72000, 0, 0, 0, 102000])

check('付01', '客户逐人收费', d(18)*9000+d(2)*6000, d(174000))
check('付01', '其他三项来源成本', sum(map(d, [36000, 11000, 1000])), d(48000))
check('付01', '向S累计实际支付', ledger['prepaid']+ledger['direct_paid'], d(111000))
check('付01', 'S及银行实际退回', ledger['bank_return']+ledger['prepay_return'], d(9000))
check('付01', '两个预付逐笔清完', [d(20000)-20000, d(15000)-10000-3000-2000], [d(0), d(0)])
check('付01', '最终成本', ledger['confirmed']+48000, d(150000))
check('付01', '经营差额', d(174000)-ledger['confirmed']-48000, d(24000))
check('付01', '全部实际收付后现金差额', d(174000)-111000+9000-48000, d(24000))

resource_costs = [d(10)*4*500, d(4)*3500, d(20)*6*100, d(18)*600+d(2)*200, d(4)*1000]
check('付02', '各服务单位独立计价', resource_costs, list(map(d, [20000, 14000, 12000, 11200, 4000])))
check('付02', '本团资源总成本', sum(resource_costs), d(61200))
check('付02', '固定车辆不随一人退出同比减少', resource_costs[1]-d(14000)*19/20, d(700))
check('付03', '批准补差净额', d(3000)-1000, d(2000))
check('付03', '最终较预计差额', d(100000)+3000-1000-95000, d(7000))
check('付03', '争议补差未生效', d(100000)+0, d(100000))
check('付04', '合法分段账单覆盖原费用', d(60000)+40000, d(100000))
check('付04', '汇总单不是第三次欠款', d(60000)+40000+0, d(100000))
check('付04', '整包采购优惠后金额', d(5)*8000-500, d(39500))
check('付04', '包内参考成本重复加入会多算', d(39500)+10000-39500, d(10000))
check('付05', '未结清与占用分开', [d(100000)-30000-50000, d(100000)-30000-50000-8000], [d(20000), d(12000)])
check('付05', '付款总额按两笔费用分配', d(50000)+30000, d(80000))
check('付05', '误用整笔付款将少列欠款', d(80000)-50000, d(30000))
start = date(2026, 12, 20)
check('付06', 'A自然日到期', (start+timedelta(days=10)).isoformat(), '2026-12-30')
check('付06', 'B自然日跨年到期', (start+timedelta(days=30)).isoformat(), '2027-01-19')
check('付06', 'A计划提前五天', ((start+timedelta(days=10))-date(2026, 12, 25)).days, 5)
check('付06', '协议过期不抹原责任', d(100000)-0, d(100000))
check('付08', '批量付款逐项剩余', [d(30000)-8000, d(20000)-5000], [d(22000), d(15000)])
check('付08', '本次银行总支出', d(22000)+15000, d(37000))
check('付08', '分配后两笔欠款归零', [d(30000)-8000-22000, d(20000)-5000-15000], [d(0), d(0)])
check('付09', '两笔全额请款超占', d(12000)+10000-20000, d(2000))
check('付09', '第一笔成功占用后只剩', d(20000)-12000, d(8000))
check('付09', '预付冲抵与现金请款共同超占', d(5000)+17000-20000, d(2000))
check('付10', '七千成功后仍欠', d(20000)-7000, d(13000))
check('付10', '失败释放后的未占用', d(20000)-7000-0, d(13000))
check('付10', '未知五千保留占用', d(20000)-7000-5000, d(8000))
check('付10', '五千后续成功后的欠款', d(20000)-7000-5000, d(8000))
check('付11', '重复通知不增加实际流水', sum({'BANK-P1': d(10000)}.values()), d(10000))
check('付11', '两笔真实支出不能去重丢弃', sum({'BANK-P1': d(10000), 'BANK-P2': d(10000)}.values()), d(20000))
check('付11', '多付待追', d(20000)-10000, d(10000))
check('付11', '追回后净付', d(20000)-10000, d(10000))
check('付12', '减免后的费用', d(100000)-2000, d(98000))
check('付12', '条件成立后再次确认的最终责任', d(98000)-3000, d(95000))
check('付12', '返利形成追款', d(98000)-95000, d(3000))
check('付12', '实际回款不二次降成本', d(95000)-0, d(95000))
check('付13', '分配到团仍保留全部预付', d(20000)+15000, d(35000))
check('付13', '冲抵后预付余额', d(20000)+15000-30000, d(5000))
check('付13', '总额足够仍超第一笔原款', d(22000)-20000, d(2000))
check('付13', '获准全部预付转抵后的现金抵清', d(102000)-35000, d(67000))
check('付13', '另一批准路径最终净付仍一致', d(35000)+67000, d(102000))
check('付13', '取消后剩余可退预付', d(30000)-5000, d(25000))
check('付13', '取消实际退回后净支出', d(30000)-25000, d(5000))
check('付13', '取消费用已被预付抵清', d(5000)-5000, d(0))
check('付14', '预付跨流程超占', d(8000)+6000-12000, d(2000))
check('付14', '提交退回后余额占用可用', [d(12000), d(6000), d(12000)-6000], [d(12000), d(6000), d(6000)])
check('付14', '首次到账后余额占用可用', [d(12000)-2000, d(6000)-2000, d(12000)-2000-(6000-2000)], [d(10000), d(4000), d(6000)])
check('付14', '二次到账后余额占用可用', [d(12000)-2000-4000, d(6000)-2000-4000, d(6000)], [d(6000), d(0), d(6000)])
check('付14', '余额冲抵后的预付与欠款', [d(6000)-6000, d(8000)-6000], [d(0), d(2000)])
check('付15', '多付和减费分别形成应返', [d(110000)-100000, d(100000)-95000], [d(10000), d(5000)])
check('付15', '应返合计', d(110000)-95000, d(15000))
check('付15', '回款逐项分配', d(10000)+2000, d(12000))
check('付15', '回款后仍应返', d(110000)-12000-95000, d(3000))
check('付15', '银行退回恢复主例欠款', d(102000)-30000-(72000-4000), d(4000))
check('付16', '实际到账匹配后预付余额', d(5000)-3000, d(2000))
check('付16', '后补匹配不第二次增加现金', d(3000)+0, d(3000))
check('付17', '采购转售各公司差额', [d(60000)-50000, d(50000)-40000], [d(10000), d(10000)])
check('付17', '集团采购转售对外差额', d(60000)-40000, d(20000))
check('付17', '授权代付后的B供应商欠款', d(40000)-15000, d(25000))
check('付17', '代付形成双方相等往来', [d(15000), d(15000)], [d(15000), d(15000)])
check('付17', '未经净抵产品欠款仍保留', d(50000)-0, d(50000))
check('付17', '代销A佣金与B扣佣差额', [d(6000), d(60000)-40000-6000], [d(6000), d(14000)])
check('付17', '集团代销差额不重复扣内部佣金', d(6000)+(60000-40000-6000), d(20000))
check('付18', '实际银行支出含独立手续费', d(20000)+50, d(20050))
check('付18', '已足额支付供应商的欠款', d(20000)-20000, d(0))
check('付18', '扣费责任未定的未付差额', d(20000)-19500, d(500))
check('付19', '月末未结清', d(100000)-30000-60000, d(10000))
check('付19', '次月付款后欠款', d(100000)-30000-60000-10000, d(0))
check('付19', '新增服务批准后欠款', d(100000)+2000-30000-60000-10000, d(2000))
check('付19', '迟到原账单不增加责任', d(100000)+0, d(100000))

result = dict(status='passed', count=len(checks), real_erp_executed=False,
              formal_policies_approved=False,
              actual_payment_concurrency_approval_vouchers_tested=False,
              scope='独立业务输入及算术复算；不代表真实ERP、付款、权限、并发或凭证测试',
              continuous_stages=stages, checks=checks)
Path(__file__).with_name('calculation-checks.json').write_text(
    json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(f'{len(checks)} 项独立复算通过；真实ERP执行数为0。')
